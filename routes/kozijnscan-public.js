// =====================================================================
// KozijnScan PUBLIEK — klantgerichte AI-kozijnenscan
// bestelkozijnenopmaat.nl
//
// Klantflow: foto's uploaden → AI herkent kozijnen + schat maten →
// klant controleert → vult contactgegevens in → aanvraag komt binnen.
//
// Mount in server.js (GEEN admin-middleware, dit is publiek):
//   app.use('/ai-kozijnenscan', require('./routes/kozijnscan-public'));
//
// Vereist env vars:
//   ANTHROPIC_API_KEY      — Anthropic API key
//   DATABASE_URL           — Railway PostgreSQL
//   RESEND_API_KEY         — Resend
//   NOTIFY_EMAIL           — jouw adres voor nieuwe-aanvraag-notificaties
//   NOTIFY_FROM            — afzender, bv. "Bestelkozijnenopmaat <noreply@bestelkozijnenopmaat.nl>"
//   KLANT_BEVESTIGING      — optioneel "true": klant krijgt bevestigingsmail
// =====================================================================

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

router.use(express.json({ limit: '20mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false
});

let tablesReady = false;
async function ensureTables() {
  if (tablesReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kozijn_scans (
      id          SERIAL PRIMARY KEY,
      project     TEXT,
      referentie  TEXT,
      algemeen    TEXT,
      created_at  TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS kozijn_scan_items (
      id           SERIAL PRIMARY KEY,
      scan_id      INT REFERENCES kozijn_scans(id) ON DELETE CASCADE,
      omschrijving TEXT,
      type         TEXT,
      schatting_b  INT,
      schatting_h  INT,
      zekerheid    TEXT,
      opmerking    TEXT,
      werkelijk_b  INT,
      werkelijk_h  INT,
      updated_at   TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS kozijn_scan_aanvragen (
      id          SERIAL PRIMARY KEY,
      nummer      TEXT UNIQUE,
      scan_id     INT REFERENCES kozijn_scans(id) ON DELETE SET NULL,
      naam        TEXT,
      email       TEXT,
      telefoon    TEXT,
      adres       TEXT,
      opmerking   TEXT,
      status      TEXT DEFAULT 'ontvangen',
      created_at  TIMESTAMPTZ DEFAULT now()
    );
  `);
  tablesReady = true;
}

// ---------------------------------------------------------------------
// Rate limiting (in-memory, per IP) — beschermt je Anthropic-tegoed
// op deze publieke route. Max 3 analyses per IP per uur.
// ---------------------------------------------------------------------
const RATE_MAX = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || [];
  const recent = entry.filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) { rateMap.set(ip, recent); return true; }
  recent.push(now);
  rateMap.set(ip, recent);
  // opschonen zodat de map niet oneindig groeit
  if (rateMap.size > 5000) {
    for (const [k, v] of rateMap) {
      if (!v.some(t => now - t < RATE_WINDOW_MS)) rateMap.delete(k);
    }
  }
  return false;
}

// ---------------------------------------------------------------------
// AI-analyse (zelfde prompt als de beheertool, incl. kalibratie)
// ---------------------------------------------------------------------
async function getKalibratie() {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int AS n,
        AVG((schatting_b - werkelijk_b)::float / NULLIF(werkelijk_b,0) * 100) AS dev_b,
        AVG((schatting_h - werkelijk_h)::float / NULLIF(werkelijk_h,0) * 100) AS dev_h
      FROM kozijn_scan_items
      WHERE werkelijk_b IS NOT NULL AND werkelijk_h IS NOT NULL
    `);
    const r = rows[0];
    if (!r || r.n < 10) return null;
    return { n: r.n, devB: Number(r.dev_b).toFixed(1), devH: Number(r.dev_h).toFixed(1) };
  } catch { return null; }
}

function buildSystemPrompt(refMaat, kalibratie) {
  return `Je bent een Nederlandse kozijnen-expert. Analyseer de gevelfoto en identificeer ALLE zichtbare kozijnen (ramen, deuren, puien), ook gedeeltelijk zichtbare.

Schat breedte en hoogte in millimeters met behulp van referentiematen in beeld:
- Nederlands metselwerk waalformaat: lagenmaat ±62,5 mm per laag, strek ±220 mm
- Potdekselplank / rabatdeel: ±180-200 mm werkende hoogte
- Buitendeur: hoogte ±2315 mm, breedte ±930-1000 mm
- Deurklink: hartlijn ±1050 mm boven vloer
- Draairaam standaard: ±650-800 mm breed
- Verdiepingshoogte: ±2600-2800 mm
- Dakpan (OVH): dekkende breedte ±200 mm
${refMaat ? `\nBELANGRIJK — de gebruiker geeft deze geverifieerde referentiemaat op, gebruik die als primaire schaal: "${refMaat}"` : ''}
${kalibratie ? `\nKALIBRATIE uit ${kalibratie.n} eerdere inmetingen: breedtes werden gemiddeld ${kalibratie.devB}% en hoogtes ${kalibratie.devH}% afwijkend geschat (positief = te hoog). Corrigeer hiervoor.` : ''}

Rond af op 50 mm. Meet het KOZIJN buitenwerks. Geef per kozijn een zekerheid: "hoog", "middel" of "laag".

Antwoord UITSLUITEND met geldige JSON, geen tekst eromheen, geen markdown:
{"kozijnen":[{"oms":"korte omschrijving + positie","type":"vast|draai|draaikiep|klep|deur|pui|combinatie","b":1800,"h":1400,"conf":"hoog|middel|laag","opm":"kort"}],"algemeen":"1-2 zinnen"}

Wees compact in tekstvelden.`;
}

// ---------------------------------------------------------------------
// GET / — de klantpagina
// ---------------------------------------------------------------------
router.get('/', (req, res) => {
  res.render('kozijnscan-klant');
});

// ---------------------------------------------------------------------
// POST /analyse — { images: [{base64, mediaType}], refMaat }
// ---------------------------------------------------------------------
router.post('/analyse', async (req, res) => {
  try {
    await ensureTables().catch(() => {});
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'onbekend';
    if (rateLimited(ip)) {
      return res.status(429).json({ error: 'U heeft het maximum aantal analyses bereikt. Probeer het over een uur opnieuw, of neem contact met ons op.' });
    }

    const { images = [], refMaat = '' } = req.body;
    if (!images.length) return res.status(400).json({ error: 'Geen foto\'s ontvangen' });
    if (images.length > 3) return res.status(400).json({ error: 'Maximaal 3 foto\'s per scan' });
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Configuratiefout — neem contact met ons op' });
    }

    const kalibratie = await getKalibratie();
    const system = buildSystemPrompt(String(refMaat).slice(0, 300), kalibratie);
    const kozijnen = [];
    const notes = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!/^image\/(jpeg|png|webp)$/.test(img.mediaType || '')) continue;
      if ((img.base64 || '').length > 8 * 1024 * 1024) continue; // ~6MB foto na resize ruim voldoende

      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } },
              { type: 'text', text: 'Analyseer deze gevelfoto. Alleen JSON.' }
            ]
          }]
        })
      });
      const data = await apiRes.json();
      if (data.error) throw new Error('Analyse tijdelijk niet beschikbaar');

      const raw = (data.content || []).map(c => (c.type === 'text' ? c.text : '')).join('');
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean.slice(clean.indexOf('{')));

      (parsed.kozijnen || []).forEach(k => kozijnen.push({
        oms: (k.oms || 'Kozijn') + (images.length > 1 ? ` (foto ${i + 1})` : ''),
        type: k.type || 'vast',
        b: parseInt(k.b, 10) || 1000,
        h: parseInt(k.h, 10) || 1200,
        conf: ['hoog', 'middel', 'laag'].includes(k.conf) ? k.conf : 'middel',
        opm: k.opm || ''
      }));
      if (parsed.algemeen) notes.push(parsed.algemeen);
    }

    res.json({ kozijnen, algemeen: notes.join(' ') });
  } catch (err) {
    console.error('[kozijnscan-public/analyse]', err.message);
    res.status(500).json({ error: 'De analyse is niet gelukt. Probeer het opnieuw of neem contact met ons op.' });
  }
});

// ---------------------------------------------------------------------
// POST /aanvraag — klant verstuurt de aanvraag
// { naam, email, telefoon, adres, opmerking, refMaat, algemeen, items }
// ---------------------------------------------------------------------
router.post('/aanvraag', async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureTables();
    const { naam = '', email = '', telefoon = '', adres = '', opmerking = '',
            refMaat = '', algemeen = '', items = [] } = req.body;

    if (!naam.trim() || !email.trim()) {
      return res.status(400).json({ error: 'Vul in ieder geval uw naam en e-mailadres in.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Het e-mailadres lijkt niet geldig.' });
    }
    if (!items.length) {
      return res.status(400).json({ error: 'Er zijn geen kozijnen om aan te vragen. Doe eerst de scan.' });
    }
    if (items.length > 30) {
      return res.status(400).json({ error: 'Te veel kozijnen in één aanvraag.' });
    }

    const nummer = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' +
                   String(Math.floor(Math.random() * 9000) + 1000);

    await client.query('BEGIN');
    const scanRes = await client.query(
      'INSERT INTO kozijn_scans (project, referentie, algemeen) VALUES ($1,$2,$3) RETURNING id',
      [`Klantscan ${nummer} — ${adres.slice(0, 120) || naam.slice(0, 120)}`, refMaat.slice(0, 300), algemeen.slice(0, 1000)]
    );
    const scanId = scanRes.rows[0].id;

    for (const it of items) {
      await client.query(
        `INSERT INTO kozijn_scan_items
         (scan_id, omschrijving, type, schatting_b, schatting_h, zekerheid, opmerking)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [scanId, String(it.oms || '').slice(0, 200), String(it.type || 'vast').slice(0, 30),
         parseInt(it.b, 10) || null, parseInt(it.h, 10) || null,
         ['hoog', 'middel', 'laag'].includes(it.conf) ? it.conf : 'middel',
         String(it.opm || '').slice(0, 300)]
      );
    }

    await client.query(
      `INSERT INTO kozijn_scan_aanvragen (nummer, scan_id, naam, email, telefoon, adres, opmerking)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [nummer, scanId, naam.slice(0, 120), email.slice(0, 200), telefoon.slice(0, 40),
       adres.slice(0, 300), opmerking.slice(0, 2000)]
    );
    await client.query('COMMIT');

    // Notificatie + bevestiging — mogen de aanvraag nooit blokkeren
    stuurNotificatie({ nummer, scanId, naam, email, telefoon, adres, opmerking, items }).catch(e =>
      console.error('[kozijnscan-public/notificatie]', e.message));
    if (process.env.KLANT_BEVESTIGING === 'true') {
      stuurKlantBevestiging({ nummer, naam, email, items }).catch(e =>
        console.error('[kozijnscan-public/bevestiging]', e.message));
    }

    res.json({ ok: true, nummer });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[kozijnscan-public/aanvraag]', err.message);
    res.status(500).json({ error: 'Opslaan is niet gelukt. Probeer het opnieuw.' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------
// Mails via Resend
// ---------------------------------------------------------------------
async function resendSend(payload) {
  if (!process.env.RESEND_API_KEY) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || `Resend-fout (${res.status})`);
  }
}

function e(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function stuurNotificatie({ nummer, scanId, naam, email, telefoon, adres, opmerking, items }) {
  if (!process.env.NOTIFY_EMAIL) return;
  const rows = items.map(it =>
    `<tr><td style="padding:5px 8px;border-bottom:1px solid #eee">${e(it.oms)}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #eee">${e(it.type)}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #eee">${e(it.b)} × ${e(it.h)} mm</td>
     <td style="padding:5px 8px;border-bottom:1px solid #eee">${e(it.conf)}</td></tr>`).join('');
  await resendSend({
    from: process.env.NOTIFY_FROM || 'Bestelkozijnenopmaat <onboarding@resend.dev>',
    to: process.env.NOTIFY_EMAIL.split(',').map(s => s.trim()),
    subject: `🔔 Nieuwe AI-scan aanvraag ${nummer} — ${items.length} kozijn(en)`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1b2733;max-width:640px">
      <h2 style="margin:0 0 4px">Nieuwe AI-kozijnenscan aanvraag</h2>
      <p style="color:#4a5a68;margin:0 0 16px">Nummer <b>${e(nummer)}</b> · Scan #${e(scanId)}</p>
      <p><b>${e(naam)}</b><br>${e(email)} · ${e(telefoon) || '—'}<br>${e(adres) || '—'}</p>
      ${opmerking ? `<p style="background:#fdece1;padding:10px 12px;border-left:3px solid #e8590c">${e(opmerking)}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
        <tr><th style="text-align:left;padding:5px 8px;border-bottom:2px solid #1b2733">Kozijn</th>
        <th style="text-align:left;padding:5px 8px;border-bottom:2px solid #1b2733">Type</th>
        <th style="text-align:left;padding:5px 8px;border-bottom:2px solid #1b2733">Geschat</th>
        <th style="text-align:left;padding:5px 8px;border-bottom:2px solid #1b2733">Zekerheid</th></tr>
        ${rows}
      </table>
      <p style="color:#4a5a68;font-size:12px;margin-top:14px">
        Open scan #${e(scanId)} in de KozijnScan-beheertool om te controleren en met
        <i>stuurFabriekMail({ scanId: ${e(scanId)} })</i> door te sturen naar de fabriek.
      </p>
    </div>`
  });
}

async function stuurKlantBevestiging({ nummer, naam, email, items }) {
  await resendSend({
    from: process.env.NOTIFY_FROM || 'Bestelkozijnenopmaat <onboarding@resend.dev>',
    to: [email],
    subject: `Uw aanvraag ${nummer} is ontvangen — bestelkozijnenopmaat.nl`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1b2733;max-width:640px">
      <h2 style="margin:0 0 8px">Bedankt voor uw aanvraag, ${e(naam.split(' ')[0])}!</h2>
      <p>Wij hebben uw AI-kozijnenscan ontvangen onder nummer <b>${e(nummer)}</b>,
      met ${items.length} herkend(e) kozijn(en).</p>
      <p>U ontvangt van ons zo snel mogelijk een <b>richtprijs op basis van de geschatte
      afmetingen</b>. De definitieve offerte volgt na een vrijblijvende inmeting op locatie —
      de gescande maten zijn een indicatie.</p>
      <p>Vragen? Reageer gerust op deze e-mail.</p>
      <p style="color:#4a5a68;font-size:12px;margin-top:18px">
        bestelkozijnenopmaat.nl · Creditline B.V. · Torenlaan 5A/5B, Bussum · KvK 59683198
      </p>
    </div>`
  });
}

module.exports = router;
