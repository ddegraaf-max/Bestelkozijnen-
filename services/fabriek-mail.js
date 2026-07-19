// =====================================================================
// Fabriekmail-service — bestelkozijnenopmaat.nl
// Stuurt een aanvraag als nette specificatiemail naar de fabriek
// (Resend), optioneel aangevuld met KozijnScan foto-analysedata.
//
// Gebruik:
//   const { stuurFabriekMail } = require('../services/fabriek-mail');
//   await stuurFabriekMail({ aanvraag, kozijnen, scanId, attachments });
//
// Vereist env vars (Railway):
//   RESEND_API_KEY   — bestaande Resend key
//   FABRIEK_EMAIL    — e-mailadres fabriek, bv. offerte@drutex.pl
//                      (meerdere mogelijk, kommagescheiden)
//   FABRIEK_FROM     — afzender, bv. "Bestelkozijnenopmaat <offerte@bestelkozijnenopmaat.nl>"
//   FABRIEK_CC       — optioneel, bv. je eigen adres voor een kopie
//   FABRIEK_STUUR_KLANTGEGEVENS — optioneel, "true" om klantdata mee
//                      te sturen (standaard UIT i.v.m. AVG: de fabriek
//                      heeft alleen specs + jouw referentie nodig)
// =====================================================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false
});

// ---------------------------------------------------------------------
// Hoofdfunctie
//
// aanvraag  = { nummer, datum?, klant?: {naam,email,telefoon}, opmerking? }
// kozijnen  = [{ label?, aantal?, specs: { Profiel, Indeling, Vakken,
//               'Breedte (mm)', 'Hoogte (mm)', Kleur, Afdichting, ... } }]
//             → specs is een vrij object: elke key/value wordt als
//               regel in de spectabel gerenderd, dus je hoeft je
//               datamodel niet aan te passen.
// scanId    = optioneel: id uit kozijn_scans → foto-analyse gaat mee
// attachments = optioneel: [{ filename, content (Buffer|base64 string) }]
//               bv. de SVG/PNG uit je configurator ("visuele weergave")
// ---------------------------------------------------------------------
async function stuurFabriekMail({ aanvraag, kozijnen = [], scanId = null, attachments = [] }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY ontbreekt');
  if (!process.env.FABRIEK_EMAIL) throw new Error('FABRIEK_EMAIL ontbreekt');

  const scanData = scanId ? await haalScanOp(scanId) : null;
  const html = renderMail({ aanvraag, kozijnen, scanData });

  const to = process.env.FABRIEK_EMAIL.split(',').map(s => s.trim()).filter(Boolean);
  const payload = {
    from: process.env.FABRIEK_FROM || 'Bestelkozijnenopmaat <onboarding@resend.dev>',
    to,
    subject: `Offerteaanvraag ${aanvraag.nummer} — ${kozijnen.length || (scanData ? scanData.items.length : 0)} kozijn(en)`,
    html
  };
  if (process.env.FABRIEK_CC) payload.cc = process.env.FABRIEK_CC.split(',').map(s => s.trim());
  if (attachments.length) {
    payload.attachments = attachments.map(a => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content
    }));
  }

  // Resend REST API — geen extra dependency nodig (Node 18+ fetch)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Resend-fout (${res.status})`);
  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------
// KozijnScan-data ophalen (schattingen uit foto-analyse)
// ---------------------------------------------------------------------
async function haalScanOp(scanId) {
  try {
    const scan = await pool.query('SELECT * FROM kozijn_scans WHERE id=$1', [scanId]);
    if (!scan.rows.length) return null;
    const items = await pool.query(
      'SELECT * FROM kozijn_scan_items WHERE scan_id=$1 ORDER BY id', [scanId]
    );
    return { scan: scan.rows[0], items: items.rows };
  } catch { return null; }
}

// ---------------------------------------------------------------------
// HTML-template (inline styles — vereist voor e-mailclients)
// ---------------------------------------------------------------------
const S = {
  body: 'font-family:Arial,Helvetica,sans-serif;color:#1b2733;font-size:14px;line-height:1.5;margin:0;padding:0;background:#f4f1ea',
  wrap: 'max-width:640px;margin:0 auto;padding:24px 16px',
  card: 'background:#ffffff;border:1px solid #d8d2c4;border-radius:4px;padding:20px 24px;margin-bottom:16px',
  h1: 'font-size:20px;margin:0 0 4px 0;color:#1b2733',
  h2: 'font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#e8590c;margin:0 0 12px 0',
  meta: 'font-size:12px;color:#4a5a68;margin:0 0 20px 0',
  table: 'width:100%;border-collapse:collapse;font-size:13px',
  th: 'text-align:left;padding:6px 8px;color:#4a5a68;font-weight:normal;border-bottom:1px solid #eee;width:38%;vertical-align:top',
  td: 'text-align:left;padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top',
  badge: 'display:inline-block;font-size:11px;padding:2px 8px;border-radius:3px;background:#fdece1;color:#e8590c',
  disc: 'font-size:11px;color:#4a5a68;background:#fdece1;border-left:3px solid #e8590c;padding:10px 12px;margin-top:12px'
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMail({ aanvraag, kozijnen, scanData }) {
  const stuurKlant = process.env.FABRIEK_STUUR_KLANTGEGEVENS === 'true';
  const datum = aanvraag.datum || new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

  // --- Klantblok (standaard UIT — AVG) ---
  const klantBlok = (stuurKlant && aanvraag.klant) ? `
    <div style="${S.card}">
      <h2 style="${S.h2}">Klant</h2>
      <table style="${S.table}">
        <tr><th style="${S.th}">Naam</th><td style="${S.td}">${esc(aanvraag.klant.naam)}</td></tr>
        <tr><th style="${S.th}">E-mail</th><td style="${S.td}">${esc(aanvraag.klant.email)}</td></tr>
        <tr><th style="${S.th}">Telefoon</th><td style="${S.td}">${esc(aanvraag.klant.telefoon)}</td></tr>
      </table>
    </div>` : '';

  // --- Kozijnblokken uit de configurator-aanvraag ---
  const kozijnBlokken = kozijnen.map((k, i) => `
    <div style="${S.card}">
      <h2 style="${S.h2}">Kozijn ${String(i + 1).padStart(3, '0')}${k.label ? ' · ' + esc(k.label) : ''}${k.aantal ? ' · ' + esc(k.aantal) + '×' : ''}</h2>
      <table style="${S.table}">
        ${Object.entries(k.specs || {}).map(([key, val]) => `
          <tr><th style="${S.th}">${esc(key)}</th><td style="${S.td}">${esc(val).replace(/\n/g, '<br>')}</td></tr>
        `).join('')}
      </table>
    </div>`).join('');

  // --- KozijnScan foto-analyse (schattingen) ---
  let scanBlok = '';
  if (scanData && scanData.items.length) {
    scanBlok = `
    <div style="${S.card}">
      <h2 style="${S.h2}">Foto-analyse — geschatte afmetingen</h2>
      <p style="${S.meta}">Project: ${esc(scanData.scan.project || '—')} · Scan #${scanData.scan.id}</p>
      <table style="${S.table}">
        <tr>
          <th style="${S.th}">Kozijn</th>
          <td style="${S.td};font-weight:bold">Type</td>
          <td style="${S.td};font-weight:bold">B × H (mm)</td>
          <td style="${S.td};font-weight:bold">Zekerheid</td>
        </tr>
        ${scanData.items.map(it => `
        <tr>
          <th style="${S.th}">${esc(it.omschrijving)}</th>
          <td style="${S.td}">${esc(it.type)}</td>
          <td style="${S.td}">${it.werkelijk_b && it.werkelijk_h
            ? `<b>${it.werkelijk_b} × ${it.werkelijk_h}</b> (ingemeten)`
            : `${it.schatting_b} × ${it.schatting_h} (schatting)`}</td>
          <td style="${S.td}"><span style="${S.badge}">${esc(it.zekerheid)}</span></td>
        </tr>`).join('')}
      </table>
      <div style="${S.disc}">
        <b>Let op:</b> maten gemarkeerd als "schatting" zijn afgeleid uit foto-analyse en dienen als
        richtprijs-basis. Definitieve productiematen volgen na inmeting op locatie.
        / <i>Uwaga: wymiary oznaczone jako "schatting" są szacunkowe (analiza zdjęć) — wymiary
        produkcyjne po pomiarze na miejscu.</i>
      </div>
    </div>`;
  }

  return `<!DOCTYPE html>
<html><body style="${S.body}">
  <div style="${S.wrap}">
    <div style="${S.card}">
      <h1 style="${S.h1}">Offerteaanvraag ${esc(aanvraag.nummer)}</h1>
      <p style="${S.meta}">
        bestelkozijnenopmaat.nl · ${esc(datum)}<br>
        Referentie voor alle correspondentie: <b>${esc(aanvraag.nummer)}</b>
      </p>
      <p style="margin:0">Graag ontvangen wij een offerte voor onderstaande specificatie(s).</p>
      ${aanvraag.opmerking ? `<p style="margin:12px 0 0 0"><b>Opmerking:</b> ${esc(aanvraag.opmerking)}</p>` : ''}
    </div>
    ${klantBlok}
    ${kozijnBlokken}
    ${scanBlok}
    <p style="font-size:11px;color:#4a5a68;text-align:center;margin-top:8px">
      Creditline B.V. · Torenlaan 5A/5B, Bussum · KvK 59683198
    </p>
  </div>
</body></html>`;
}

module.exports = { stuurFabriekMail };
