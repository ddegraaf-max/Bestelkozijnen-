const fs = require('fs');
const os = require('os');
const path = require('path');

// Datalaag met twee backends:
//   - DATABASE_URL gezet  -> PostgreSQL (Railway)
//   - anders              -> JSON-bestand (lokaal/dev, geen externe database nodig)
// Beide backends bieden dezelfde (async) methoden, zodat de rest van de app
// niet hoeft te weten welke opslag actief is. `await` op een niet-promise is
// veilig, dus de JSON-backend mag synchroon blijven.

// ---- Bestandsopslag voor uploads (PDF-offertes) — in BEIDE backends gebruikt.
// Op Railway: mount een volume op DATA_DIR. De database bewaart alleen de
// bestandsnaam; het PDF zelf staat op deze schijf.
let DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
function dirUsable(dir) {
  try {
    if (fs.existsSync(dir) && !fs.statSync(dir).isDirectory()) return false;
    fs.mkdirSync(path.join(dir, 'uploads'), { recursive: true });
    return true;
  } catch (e) { return false; }
}
if (!dirUsable(DATA_DIR)) {
  const fallback = path.join(os.tmpdir(), 'bko-data');
  console.warn('[db] WAARSCHUWING: DATA_DIR "' + DATA_DIR + '" is geen bruikbare map. ' +
    'Val tijdelijk terug op "' + fallback + '" — let op: opslag is dan NIET blijvend.');
  DATA_DIR = fallback;
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
}
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// =====================================================================
//  PostgreSQL-backend
// =====================================================================
function postgresStore() {
  const { Pool } = require('pg');
  const url = process.env.DATABASE_URL;
  // SSL aan voor publieke (proxy) verbindingen, uit voor interne Railway-host
  // en localhost.
  const needsSsl = /sslmode=require/.test(url) ||
    !/localhost|127\.0\.0\.1|\.railway\.internal/.test(url);
  const pool = new Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : false });
  pool.on('error', (err) => console.error('[db] onverwachte Postgres-poolfout:', err.message));

  const mapUser = (r) => r ? {
    id: r.id, naam: r.naam, email: r.email, passwordHash: r.password_hash,
    role: r.role, telefoon: r.telefoon, totpSecret: r.totp_secret,
    totpEnabled: r.totp_enabled,
    resetTokenHash: r.reset_token_hash,
    resetTokenExp: r.reset_token_exp == null ? null : Number(r.reset_token_exp),
    createdAt: Number(r.created_at)
  } : undefined;

  const mapRequest = (r) => r ? {
    id: r.id, ref: r.ref, userId: r.user_id,
    elementen: r.elementen, klant: r.klant, status: r.status,
    statusHistory: r.status_history, offertePdf: r.offerte_pdf,
    prijs: r.prijs == null ? null : Number(r.prijs),
    prijsNotitie: r.prijs_notitie,
    createdAt: Number(r.created_at)
  } : undefined;

  const USER_COLS = {
    naam: 'naam', email: 'email', passwordHash: 'password_hash', role: 'role',
    telefoon: 'telefoon', totpSecret: 'totp_secret', totpEnabled: 'totp_enabled',
    resetTokenHash: 'reset_token_hash', resetTokenExp: 'reset_token_exp'
  };

  return {
    UPLOAD_DIR,

    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          naam TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'klant',
          telefoon TEXT NOT NULL DEFAULT '',
          totp_secret TEXT,
          totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          reset_token_hash TEXT,
          reset_token_exp BIGINT,
          created_at BIGINT NOT NULL
        );`);
      await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (LOWER(email));`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS requests (
          id TEXT PRIMARY KEY,
          ref TEXT NOT NULL,
          user_id TEXT NOT NULL,
          elementen JSONB NOT NULL DEFAULT '[]',
          klant JSONB NOT NULL DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'ontvangen',
          status_history JSONB NOT NULL DEFAULT '[]',
          offerte_pdf TEXT,
          prijs NUMERIC(10,2),
          prijs_notitie TEXT,
          created_at BIGINT NOT NULL
        );`);
      // Veilig voor bestaande databases die nog geen prijs-kolommen hadden:
      await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS prijs NUMERIC(10,2);`);
      await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS prijs_notitie TEXT;`);
      await pool.query(`CREATE INDEX IF NOT EXISTS requests_user ON requests (user_id);`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS counters (
          name TEXT PRIMARY KEY,
          value BIGINT NOT NULL
        );`);
      await pool.query(`INSERT INTO counters (name, value) VALUES ('ref', 1000) ON CONFLICT (name) DO NOTHING;`);
      console.log('[db] Postgres verbonden en tabellen klaar.');
    },

    // ---- users ----
    async findUserByEmail(email) {
      const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1', [String(email)]);
      return mapUser(rows[0]);
    },
    async findUserById(uid) {
      const { rows } = await pool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [uid]);
      return mapUser(rows[0]);
    },
    async findUserByResetToken(tokenHash) {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE reset_token_hash=$1 AND reset_token_exp > $2 LIMIT 1',
        [tokenHash, Date.now()]);
      return mapUser(rows[0]);
    },
    async createUser({ naam, email, passwordHash, role = 'klant', telefoon = '' }) {
      const u = { id: id(), naam, email, passwordHash, role, telefoon, totpSecret: null, totpEnabled: false, createdAt: Date.now() };
      await pool.query(
        `INSERT INTO users (id, naam, email, password_hash, role, telefoon, totp_secret, totp_enabled, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [u.id, u.naam, u.email, u.passwordHash, u.role, u.telefoon, u.totpSecret, u.totpEnabled, u.createdAt]);
      return u;
    },
    async updateUser(uid, patch) {
      const sets = [], vals = [];
      let i = 1;
      for (const k of Object.keys(patch)) {
        if (USER_COLS[k]) { sets.push(`${USER_COLS[k]}=$${i++}`); vals.push(patch[k]); }
      }
      if (!sets.length) return this.findUserById(uid);
      vals.push(uid);
      const { rows } = await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${i} RETURNING *`, vals);
      return mapUser(rows[0]);
    },

    // ---- requests (aanvragen) ----
    async createRequest({ userId, elementen, klant }) {
      const { rows: c } = await pool.query(`UPDATE counters SET value = value + 1 WHERE name='ref' RETURNING value`);
      const n = Number(c[0].value);
      const ref = `WEB-${new Date().getFullYear().toString().slice(2)}-${n}`;
      const r = {
        id: id(), ref, userId, elementen, klant,
        status: 'ontvangen', statusHistory: [{ status: 'ontvangen', at: Date.now() }],
        offertePdf: null, prijs: null, prijsNotitie: null, createdAt: Date.now()
      };
      await pool.query(
        `INSERT INTO requests (id, ref, user_id, elementen, klant, status, status_history, offerte_pdf, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.id, r.ref, r.userId, JSON.stringify(r.elementen), JSON.stringify(r.klant), r.status, JSON.stringify(r.statusHistory), r.offertePdf, r.createdAt]);
      return r;
    },
    async setPrijs(rid, prijs, notitie) {
      const { rows } = await pool.query(
        `UPDATE requests SET prijs=$1, prijs_notitie=$2 WHERE id=$3 RETURNING *`,
        [prijs, notitie, rid]);
      return mapRequest(rows[0]);
    },
    async getRequest(rid) {
      const { rows } = await pool.query('SELECT * FROM requests WHERE id=$1 LIMIT 1', [rid]);
      return mapRequest(rows[0]);
    },
    async getRequestsByUser(uid) {
      const { rows } = await pool.query('SELECT * FROM requests WHERE user_id=$1 ORDER BY created_at DESC', [uid]);
      return rows.map(mapRequest);
    },
    async allRequests() {
      const { rows } = await pool.query('SELECT * FROM requests ORDER BY created_at DESC');
      return rows.map(mapRequest);
    },
    async setStatus(rid, status) {
      const r = await this.getRequest(rid);
      if (!r) return null;
      const history = [...r.statusHistory, { status, at: Date.now() }];
      const { rows } = await pool.query(
        `UPDATE requests SET status=$1, status_history=$2 WHERE id=$3 RETURNING *`,
        [status, JSON.stringify(history), rid]);
      return mapRequest(rows[0]);
    },
    async setOffertePdf(rid, filename) {
      const { rows } = await pool.query(
        `UPDATE requests SET offerte_pdf=$1 WHERE id=$2 RETURNING *`,
        [filename, rid]);
      return mapRequest(rows[0]);
    }
  };
}

// =====================================================================
//  JSON-bestandsbackend (lokaal/dev)
// =====================================================================
function jsonStore() {
  const DB_FILE = path.join(DATA_DIR, 'db.json');
  function load() {
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch { return { users: [], requests: [], counters: { ref: 1000 } }; }
  }
  function save(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
  let db = load();

  return {
    UPLOAD_DIR,
    async init() { console.log('[db] JSON-bestandsopslag actief (geen DATABASE_URL gezet).'); },

    findUserByEmail(email) {
      return db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    },
    findUserById(uid) { return db.users.find(u => u.id === uid); },
    findUserByResetToken(tokenHash) {
      return db.users.find(u => u.resetTokenHash === tokenHash && (u.resetTokenExp || 0) > Date.now());
    },
    createUser({ naam, email, passwordHash, role = 'klant', telefoon = '' }) {
      const user = { id: id(), naam, email, passwordHash, role, telefoon, totpSecret: null, totpEnabled: false, createdAt: Date.now() };
      db.users.push(user); save(db); return user;
    },
    updateUser(uid, patch) {
      const u = db.users.find(x => x.id === uid);
      if (!u) return null;
      Object.assign(u, patch); save(db); return u;
    },

    createRequest({ userId, elementen, klant }) {
      db.counters.ref = (db.counters.ref || 1000) + 1;
      const ref = `WEB-${new Date().getFullYear().toString().slice(2)}-${db.counters.ref}`;
      const req = {
        id: id(), ref, userId, elementen, klant,
        status: 'ontvangen',
        statusHistory: [{ status: 'ontvangen', at: Date.now() }],
        offertePdf: null, prijs: null, prijsNotitie: null, createdAt: Date.now()
      };
      db.requests.push(req); save(db); return req;
    },
    setPrijs(rid, prijs, notitie) {
      const r = this.getRequest(rid); if (!r) return null;
      r.prijs = prijs; r.prijsNotitie = notitie; save(db); return r;
    },
    getRequest(rid) { return db.requests.find(r => r.id === rid); },
    getRequestsByUser(uid) {
      return db.requests.filter(r => r.userId === uid).sort((a, b) => b.createdAt - a.createdAt);
    },
    allRequests() { return [...db.requests].sort((a, b) => b.createdAt - a.createdAt); },
    setStatus(rid, status) {
      const r = this.getRequest(rid); if (!r) return null;
      r.status = status; r.statusHistory.push({ status, at: Date.now() }); save(db); return r;
    },
    setOffertePdf(rid, filename) {
      const r = this.getRequest(rid); if (!r) return null;
      r.offertePdf = filename; save(db); return r;
    }
  };
}

module.exports = process.env.DATABASE_URL ? postgresStore() : jsonStore();
