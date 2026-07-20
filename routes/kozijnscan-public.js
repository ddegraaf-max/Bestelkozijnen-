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
const db = require('../db');

module.exports = function (company, mailer) {
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
// GET / — de klantpagina, met de ECHTE header/footer van de site.
// We lezen views/home.ejs en detecteren welke partials daar als header
// (vóór de content) en footer (na de content) worden ge-include't.
// De scanpagina gebruikt exact diezelfde partials → logo, menu en stijl
// zijn altijd 1-op-1 die van de hoofdsite. Lukt detectie niet, dan valt
// de pagina terug op een eigen eenvoudige header.
// ---------------------------------------------------------------------
const path = require('path');
const fsMod = require('fs');
let _partialsCache = null;

function detectSitePartials() {
  if (_partialsCache) return _partialsCache;
  try {
    const viewsDir = path.join(__dirname, '..', 'views');
    const src = fsMod.readFileSync(path.join(viewsDir, 'home.ejs'), 'utf8');
    const incs = [...src.matchAll(/include\(\s*['"]([^'"]+)['"]/g)]
      .map(m => ({ name: m[1], idx: m.index }));
    // contentgrens: eerste echte pagina-inhoud in home.ejs
    const startMarkers = ['<main', '<section', '<h1'];
    const contentStart = Math.min(...startMarkers.map(t => {
      const i = src.indexOf(t); return i < 0 ? Infinity : i;
    }));
    const endMarkers = ['</main>', '</section>'];
    const contentEnd = Math.max(...endMarkers.map(t => src.lastIndexOf(t)));
    const headerPartials = incs.filter(x => x.idx < contentStart).map(x => x.name);
    const footerPartials = incs.filter(x => contentEnd > 0 && x.idx > contentEnd).map(x => x.name);
    _partialsCache = { headerPartials, footerPartials };
  } catch (e) {
    _partialsCache = { headerPartials: [], footerPartials: [] };
  }
  return _partialsCache;
}

router.get('/', (req, res) => {
  const { headerPartials, footerPartials } = detectSitePartials();
  res.render('kozijnscan-klant', {
    headerPartials, footerPartials,
    title: 'AI Kozijnenscan – richtprijs op basis van een gevelfoto',
    active: 'ai-scan'
  });
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
// Gaat via db.createRequest, dus de aanvraag komt in DEZELFDE lijst
// als de configurator-aanvragen (Beheer > Aanvragen), met eigen nummer,
// status "ontvangen", jouw notificatiemail en klantbevestiging.
// De scan zelf wordt daarnaast bewaard voor de kalibratie, gekoppeld
// aan het aanvraagnummer.
// ---------------------------------------------------------------------
router.post('/aanvraag', async (req, res) => {
  try {
    const { naam = '', email = '', telefoon = '', adres = '', opmerking = '',
            refMaat = '', algemeen = '', items = [] } = req.body;

    if (!naam.trim() || !email.trim()) {
      return res.status(400).json({ error: 'Vul in ieder geval uw naam en e-mailadres in.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Het e-mailadres lijkt niet geldig.' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Er zijn geen kozijnen om aan te vragen. Doe eerst de scan.' });
    }
    if (items.length > 30) {
      return res.status(400).json({ error: 'Te veel kozijnen in één aanvraag.' });
    }

    // Nette items voor de aanvraag (zelfde vorm als configurator-elementen)
    const schoon = items.slice(0, 30).map((it, i) => ({
      label: 'AI-scan · ' + String(it.oms || ('Kozijn ' + (i + 1))).slice(0, 120),
      indeling: String(it.type || 'vast').slice(0, 30),
      afmetingen: (parseInt(it.b, 10) || 0) + ' × ' + (parseInt(it.h, 10) || 0) + ' mm (geschat)',
      kleur: 'n.t.b.', glas: 'n.t.b.', montage: 'n.t.b.', aantal: 1,
      zekerheid: ['hoog', 'middel', 'laag'].includes(it.conf) ? it.conf : 'middel',
      bron: 'ai-kozijnenscan',
      opmerkingAI: String(it.opm || '').slice(0, 200)
    }));

    // Bestaat er al een account met dit e-mailadres? Dan koppelen we de
    // aanvraag daaraan, zodat hij ook in "Mijn portaal" van de klant staat.
    // Zo niet, dan is het een gast-aanvraag (alleen zichtbaar in Beheer).
    let userId = 'gast-ai-scan';
    try {
      const bestaand = await db.findUserByEmail(email);
      if (bestaand) userId = bestaand.id;
    } catch (e) { /* gast-aanvraag */ }

    const opm = ['[Via AI Kozijnenscan — maten zijn schattingen, inmeting vereist]'];
    if (adres.trim()) opm.push('Adres: ' + adres.trim().slice(0, 300));
    if (refMaat.trim()) opm.push('Opgegeven referentiemaat: ' + refMaat.trim().slice(0, 300));
    if (algemeen.trim()) opm.push('AI-observatie: ' + algemeen.trim().slice(0, 500));
    if (opmerking.trim()) opm.push('Klant: ' + opmerking.trim().slice(0, 2000));

    const request = await db.createRequest({
      userId,
      elementen: schoon,
      klant: {
        naam: naam.trim().slice(0, 120),
        email: email.trim().slice(0, 200),
        telefoon: telefoon.trim().slice(0, 40),
        opmerking: opm.join('\n')
      }
    });

    // Scan bewaren voor de kalibratie, gekoppeld aan het aanvraagnummer
    saveScanVoorKalibratie(request.ref, { naam, adres, refMaat, algemeen, items })
      .catch(e => console.error('[kozijnscan-public/kalibratie]', e.message));

    // Mails via het bestaande mailer-systeem (zelfde als de configurator)
    if (mailer) {
      const samenvatting = 'AANVRAAG VIA AI KOZIJNENSCAN — maten zijn schattingen o.b.v. gevelfoto, definitieve maten na inmeting.\n\n' +
        schoon.map((e2, i) =>
          'Kozijn ' + String(i + 1).padStart(3, '0') + ': ' + e2.label + ' · ' + e2.indeling +
          ' · ' + e2.afmetingen + ' · zekerheid: ' + e2.zekerheid +
          (e2.opmerkingAI ? ' · ' + e2.opmerkingAI : '')
        ).join('\n');
      mailer.notifyNewRequest({ ref: request.ref, klant: request.klant, samenvatting }).catch(() => {});
      mailer.notifyFabriek({ ref: request.ref, samenvatting }).catch(() => {});
      mailer.confirmRequest({ to: email.trim(), ref: request.ref, naam: naam.trim() }).catch(() => {});
    }

    res.json({ ok: true, nummer: request.ref });
  } catch (err) {
    console.error('[kozijnscan-public/aanvraag]', err.message);
    res.status(500).json({ error: 'Opslaan is niet gelukt. Probeer het opnieuw.' });
  }
});

// ---------------------------------------------------------------------
// Scan opslaan voor de kalibratie (kozijn_scans / kozijn_scan_items),
// met het aanvraagnummer als projectnaam zodat je hem in de beheertool
// terugvindt om na inmeting de werkelijke maten in te vullen.
// ---------------------------------------------------------------------
async function saveScanVoorKalibratie(ref, { naam, adres, refMaat, algemeen, items }) {
  const client = await pool.connect();
  try {
    await ensureTables();
    await client.query('BEGIN');
    const r = await client.query(
      'INSERT INTO kozijn_scans (project, referentie, algemeen) VALUES ($1,$2,$3) RETURNING id',
      ['Aanvraag ' + ref + ' — ' + String(adres || naam || '').slice(0, 120),
       String(refMaat || '').slice(0, 300), String(algemeen || '').slice(0, 1000)]
    );
    const scanId = r.rows[0].id;
    for (const it of items.slice(0, 30)) {
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
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

return router;
};
