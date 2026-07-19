// =====================================================================
// KozijnScan module — bestelkozijnenopmaat.nl
// Foto-analyse van kozijnen (herkenning + maatvoering) via Anthropic API
//
// Mount in server.js:
//   app.use('/kozijnscan', require('./routes/kozijnscan'));
//
// Vereist env vars (Railway):
//   ANTHROPIC_API_KEY   — je Anthropic API key
//   DATABASE_URL        — bestaande Railway PostgreSQL URL
// =====================================================================

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Eigen JSON-limiet: base64-foto's kunnen groot zijn
router.use(express.json({ limit: '30mb' }));

// ---------------------------------------------------------------------
// Database (hergebruikt DATABASE_URL, eigen pool zodat de module
// zelfstandig werkt; wil je je bestaande pool gebruiken, vervang dit
// door: const pool = require('../db');)
// ---------------------------------------------------------------------
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
// Kalibratie: gemiddelde afwijking uit historisch ingemeten data.
// Dit is hoe de tool "slimmer wordt met meer input": de correctie
// wordt in de prompt meegegeven zodra er voldoende metingen zijn.
// ---------------------------------------------------------------------
async function getKalibratie() {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS n,
        AVG((schatting_b - werkelijk_b)::float / NULLIF(werkelijk_b,0) * 100) AS dev_b,
        AVG((schatting_h - werkelijk_h)::float / NULLIF(werkelijk_h,0) * 100) AS dev_h
      FROM kozijn_scan_items
      WHERE werkelijk_b IS NOT NULL AND werkelijk_h IS NOT NULL
    `);
    const r = rows[0];
    if (!r || r.n < 10) return null; // pas kalibreren vanaf 10 metingen
    return {
      n: r.n,
      devB: Number(r.dev_b).toFixed(1),
      devH: Number(r.dev_h).toFixed(1)
    };
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
${kalibratie ? `\nKALIBRATIE uit ${kalibratie.n} eerdere inmetingen op vergelijkbare projecten: breedtes werden gemiddeld ${kalibratie.devB}% en hoogtes ${kalibratie.devH}% afwijkend geschat (positief = te hoog geschat). Corrigeer je schattingen hiervoor.` : ''}

Rond af op 50 mm. Meet het KOZIJN buitenwerks (inclusief kader, exclusief beplating). Geef per kozijn een zekerheid: "hoog" (goede referentie, recht vooraanzicht), "middel" (schuin of matige referentie), "laag" (geen referentie / veel perspectief / deels buiten beeld).

Antwoord UITSLUITEND met geldige JSON, geen tekst eromheen, geen markdown:
{"kozijnen":[{"oms":"korte omschrijving + positie (bv. links/midden/rechts, bg/verdieping)","type":"vast|draai|draaikiep|klep|deur|pui|combinatie","b":1800,"h":1400,"conf":"hoog|middel|laag","opm":"gebruikte referentie, kort"}],"algemeen":"1-2 zinnen: aandachtspunten voor inmeting"}

Wees compact in tekstvelden.`;
}

// ---------------------------------------------------------------------
// GET / — de tool-pagina
// ---------------------------------------------------------------------
router.get('/', async (req, res) => {
  await ensureTables().catch(() => {});
  const kalibratie = await getKalibratie();
  res.render('kozijnscan', { kalibratie });
});

// ---------------------------------------------------------------------
// POST /analyse — { images: [{ base64, mediaType }], refMaat }
// Server-side call naar Anthropic zodat de API-key nooit in de browser komt.
// ---------------------------------------------------------------------
router.post('/analyse', async (req, res) => {
  try {
    await ensureTables().catch(() => {});
    const { images = [], refMaat = '' } = req.body;
    if (!images.length) return res.status(400).json({ error: 'Geen afbeeldingen ontvangen' });
    if (images.length > 5) return res.status(400).json({ error: 'Maximaal 5 foto\'s per analyse' });
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY ontbreekt in environment variables' });
    }

    const kalibratie = await getKalibratie();
    const system = buildSystemPrompt(String(refMaat).slice(0, 300), kalibratie);
    const kozijnen = [];
    const notes = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!/^image\/(jpeg|png|webp)$/.test(img.mediaType || '')) continue;

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
      if (data.error) throw new Error(data.error.message || 'Anthropic API-fout');

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

    res.json({ kozijnen, algemeen: notes.join(' '), kalibratie });
  } catch (err) {
    console.error('[kozijnscan/analyse]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /opslaan — scan + items opslaan (incl. eventuele inmetingen)
// { project, refMaat, algemeen, items: [{oms,type,b,h,conf,opm,rb,rh}] }
// ---------------------------------------------------------------------
router.post('/opslaan', async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureTables();
    const { project = '', refMaat = '', algemeen = '', items = [], scanId = null } = req.body;
    if (!items.length) return res.status(400).json({ error: 'Geen kozijnen om op te slaan' });

    await client.query('BEGIN');
    let id = scanId;
    if (id) {
      // Bestaande scan updaten: items vervangen (inmeting toegevoegd)
      await client.query('UPDATE kozijn_scans SET project=$1 WHERE id=$2', [project, id]);
      await client.query('DELETE FROM kozijn_scan_items WHERE scan_id=$1', [id]);
    } else {
      const r = await client.query(
        'INSERT INTO kozijn_scans (project, referentie, algemeen) VALUES ($1,$2,$3) RETURNING id',
        [project, refMaat, algemeen]
      );
      id = r.rows[0].id;
    }
    for (const it of items) {
      await client.query(
        `INSERT INTO kozijn_scan_items
         (scan_id, omschrijving, type, schatting_b, schatting_h, zekerheid, opmerking, werkelijk_b, werkelijk_h)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, it.oms || '', it.type || 'vast',
         parseInt(it.b, 10) || null, parseInt(it.h, 10) || null,
         it.conf || 'middel', it.opm || '',
         it.rb ? parseInt(it.rb, 10) : null,
         it.rh ? parseInt(it.rh, 10) : null]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, scanId: id });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[kozijnscan/opslaan]', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------
// GET /scans — recente scans (voor het later invullen van inmetingen)
// ---------------------------------------------------------------------
router.get('/scans', async (req, res) => {
  try {
    await ensureTables();
    const { rows } = await pool.query(`
      SELECT s.id, s.project, s.created_at,
             COUNT(i.id)::int AS aantal,
             COUNT(i.werkelijk_b)::int AS ingemeten
      FROM kozijn_scans s
      LEFT JOIN kozijn_scan_items i ON i.scan_id = s.id
      GROUP BY s.id ORDER BY s.created_at DESC LIMIT 25
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------------------------------------------------------------------
// GET /scans/:id — één scan met items laden
// ---------------------------------------------------------------------
router.get('/scans/:id', async (req, res) => {
  try {
    await ensureTables();
    const scan = await pool.query('SELECT * FROM kozijn_scans WHERE id=$1', [req.params.id]);
    if (!scan.rows.length) return res.status(404).json({ error: 'Scan niet gevonden' });
    const items = await pool.query(
      'SELECT * FROM kozijn_scan_items WHERE scan_id=$1 ORDER BY id', [req.params.id]
    );
    res.json({ scan: scan.rows[0], items: items.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------------------------------------------------------------------
// GET /export.csv — volledige dataset als CSV (voor kalibratie-analyse)
// ---------------------------------------------------------------------
router.get('/export.csv', async (req, res) => {
  try {
    await ensureTables();
    const { rows } = await pool.query(`
      SELECT s.id AS scan_id, s.project, s.created_at::date AS datum,
             i.omschrijving, i.type, i.schatting_b, i.schatting_h, i.zekerheid,
             i.werkelijk_b, i.werkelijk_h,
             ROUND(((i.schatting_b - i.werkelijk_b)::numeric / NULLIF(i.werkelijk_b,0) * 100), 1) AS dev_b_pct,
             ROUND(((i.schatting_h - i.werkelijk_h)::numeric / NULLIF(i.werkelijk_h,0) * 100), 1) AS dev_h_pct,
             i.opmerking
      FROM kozijn_scan_items i
      JOIN kozijn_scans s ON s.id = i.scan_id
      ORDER BY s.created_at DESC, i.id
    `);
    const header = Object.keys(rows[0] || { info: 'geen data' });
    const csv = [header.join(';')]
      .concat(rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';')))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kozijnscan-dataset.csv"');
    res.send('\ufeff' + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
