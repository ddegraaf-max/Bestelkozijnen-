const fs = require('fs');
const os = require('os');
const path = require('path');

// JSON-bestand datalaag. DATA_DIR default ./data (mount een Railway-volume
// op dit pad voor blijvende opslag). Later eenvoudig te vervangen door Postgres.
let DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// Boot-veilig: als DATA_DIR niet bruikbaar is (bijv. een verdwaald bestand met
// de naam "data" in de repo, of een verkeerd gekoppeld volume), val terug op
// een schrijfbare tijdelijke map zodat de app niet crasht bij het opstarten.
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
    'Val tijdelijk terug op "' + fallback + '" — let op: opslag is dan NIET blijvend. ' +
    'Controleer het Railway-volume (mountpad /app/data, als map) of verwijder een ' +
    'eventueel bestand met de naam "data" uit de repo-root.');
  DATA_DIR = fallback;
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
}

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: [], requests: [], counters: { ref: 1000 } }; }
}
function save(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

let db = load();

const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

module.exports = {
  UPLOAD_DIR,

  // ---- users ----
  findUserByEmail(email) {
    return db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  },
  findUserById(uid) { return db.users.find(u => u.id === uid); },
  createUser({ naam, email, passwordHash, role = 'klant', telefoon = '' }) {
    const user = { id: id(), naam, email, passwordHash, role, telefoon, totpSecret: null, totpEnabled: false, createdAt: Date.now() };
    db.users.push(user); save(db); return user;
  },
  updateUser(uid, patch) {
    const u = db.users.find(x => x.id === uid);
    if (!u) return null;
    Object.assign(u, patch); save(db); return u;
  },

  // ---- requests (aanvragen) ----
  createRequest({ userId, elementen, klant }) {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const code = () => String(Math.floor(1000 + Math.random() * 9000));
    let ref = `${ymd}-${code()}`;
    while (db.requests.some(r => r.ref === ref)) ref = `${ymd}-${code()}`; // gegarandeerd uniek
    const req = {
      id: id(), ref, userId, elementen, klant,
      status: 'ontvangen',
      statusHistory: [{ status: 'ontvangen', at: Date.now() }],
      offertePdf: null, createdAt: Date.now()
    };
    db.requests.push(req); save(db); return req;
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
    r.offertePdf = filename;
    if (r.status === 'ontvangen' || r.status === 'in_behandeling') {
      r.status = 'offerte_klaar'; r.statusHistory.push({ status: 'offerte_klaar', at: Date.now() });
    }
    save(db); return r;
  }
};
