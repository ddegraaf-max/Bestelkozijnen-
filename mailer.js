// E-mailmeldingen via Resend. Zonder RESEND_API_KEY wordt alleen gelogd.
// Alle mails gebruiken één gedeelde, merkgebonden HTML-template (tabel-gebaseerd
// voor compatibiliteit met Outlook/Gmail, met inline styles).
const fs = require('fs');
const path = require('path');

module.exports = function (company) {
  let resend = null;
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  const from = `${company.name} <${process.env.MAIL_FROM || 'noreply@bestelkozijnenopmaat.nl'}>`;
  const adminTo = process.env.MAIL_TO || company.email;
  const fabriekTo = process.env.MAIL_FABRIEK || '';   // fabriek/leverancier (leeg = uit)
  const base = (process.env.PUBLIC_URL || 'https://bestelkozijnenopmaat.nl').replace(/\/+$/, '');
  const portaal = base + '/portaal';

  // Algemene voorwaarden als bijlage (indien aanwezig)
  function avAttachment() {
    try {
      const p = path.join(__dirname, 'public', 'docs', 'algemene-voorwaarden.pdf');
      const content = fs.readFileSync(p).toString('base64');
      return { filename: 'Algemene-Voorwaarden-bestelkozijnenopmaat.pdf', content };
    } catch { return null; }
  }

  async function send(opts) {
    if (!resend) { console.log('[MAIL – geen Resend-key]', opts.subject, '→', opts.to); return; }
    await resend.emails.send({ from, ...opts });
  }

  // ---- Bouwstenen voor de mailtemplate ----
  const C = { paper: '#EEEDE8', panel: '#FBFAF7', panel2: '#F4F2EC', ink: '#1B1B1A', muted: '#76736B', faint: '#A9A599', line: '#DCD8CE', accent: '#C8502D', accentInk: '#8E3417', accentSoft: '#F3E2D9' };
  const par = (html) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3a382f">${html}</p>`;

  function priceBox(prijs, notitie) {
    if (prijs == null) return '';
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:${C.accentSoft};border:1px solid #E6C9B8;border-radius:12px;padding:18px 20px">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.accentInk};font-weight:700">Jouw prijs</div>
      <div style="font-size:30px;font-weight:800;color:${C.ink};margin-top:4px;line-height:1.1">&euro; ${esc(formatPrijs(prijs))}</div>
      ${notitie ? `<div style="font-size:14px;color:#5a564e;margin-top:6px">${esc(notitie)}</div>` : ''}
    </td></tr></table>`;
  }

  function specTable(rows) {
    const trs = rows.filter(r => r && r[1]).map(([k, v]) =>
      `<tr><td style="padding:9px 14px;border-top:1px solid ${C.line};color:${C.muted};font-size:13px;width:40%">${esc(k)}</td><td style="padding:9px 14px;border-top:1px solid ${C.line};font-size:14px;color:${C.ink}">${esc(v)}</td></tr>`).join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:12px;overflow:hidden;margin:6px 0 14px">${trs}</table>`;
  }

  function layout({ preheader = '', badge, heading, bodyHtml, button }) {
    return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"></head>
<body style="margin:0;padding:0;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper};font-size:1px;line-height:1px">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};padding:28px 12px"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.panel};border:1px solid ${C.line};border-radius:14px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.ink}">
    <tr><td style="padding:20px 30px;border-bottom:1px solid ${C.line}">
      <table role="presentation" width="100%"><tr>
        <td style="font-size:18px;font-weight:800;letter-spacing:-.02em;color:${C.ink}">bestelkozijnen<span style="color:${C.accent}">opmaat</span><span style="color:${C.muted};font-weight:600">.nl</span></td>
        <td align="right" style="font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:${C.muted}">Kozijnen op maat</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:30px">
      ${badge ? `<div style="display:inline-block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.accentInk};background:${C.accentSoft};padding:6px 12px;border-radius:30px;font-weight:700;margin-bottom:14px">${esc(badge)}</div>` : ''}
      ${heading ? `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;letter-spacing:-.02em;color:${C.ink}">${esc(heading)}</h1>` : ''}
      ${bodyHtml}
      ${button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 4px"><tr><td style="border-radius:11px;background:${C.accent}"><a href="${esc(button.url)}" style="display:inline-block;padding:13px 26px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px">${esc(button.label)} &rarr;</a></td></tr></table>` : ''}
    </td></tr>
    <tr><td style="padding:22px 30px;border-top:1px solid ${C.line};background:${C.panel2}">
      <div style="font-size:13px;color:${C.muted};line-height:1.7">
        <strong style="color:${C.ink}">${esc(company.legalName || company.name)}</strong><br>
        ${company.address ? esc(company.address) + '<br>' : ''}
        ${company.phone ? 'tel. ' + esc(company.phone) + ' &middot; ' : ''}<a href="mailto:${esc(company.email)}" style="color:${C.accentInk};text-decoration:none">${esc(company.email)}</a><br>
        ${company.kvk ? 'KvK ' + esc(company.kvk) : ''}${company.btw ? ' &middot; BTW ' + esc(company.btw) : ''}
      </div>
      <div style="font-size:11px;color:${C.faint};margin-top:12px"><a href="${base}" style="color:${C.faint};text-decoration:none">bestelkozijnenopmaat.nl</a></div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
  }

  return {
    async notifyNewRequest({ ref, klant, samenvatting }) {
      const body = specTable([
        ['Naam', klant.naam], ['E-mail', klant.email], ['Telefoon', klant.telefoon || '-']
      ])
        + `<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.55;white-space:pre-wrap;background:${C.panel2};border:1px solid ${C.line};border-radius:12px;padding:14px 16px;color:#3a382f">${esc(samenvatting)}</div>`
        + (klant.opmerking ? par(`<strong>Opmerking:</strong> ${esc(klant.opmerking)}`) : '');
      await send({
        to: adminTo,
        subject: `Nieuwe aanvraag ${ref} – ${klant.naam}`,
        html: layout({ preheader: `Nieuwe aanvraag van ${klant.naam}`, badge: 'Nieuwe aanvraag', heading: `Aanvraag ${ref}`, bodyHtml: body, button: { label: 'Open in beheer', url: base + '/beheer' } })
      });
    },

    // Schone fabrieksmail: ALLEEN referentie + technische specificatie, géén
    // klantgegevens (AVG-vriendelijk). Alleen verstuurd als MAIL_FABRIEK is gezet.
    async notifyFabriek({ ref, samenvatting }) {
      if (!fabriekTo) return;
      const body = par(`Nieuwe productieaanvraag met referentie <strong>${esc(ref)}</strong>. Hieronder de technische specificatie.`)
        + `<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.55;white-space:pre-wrap;background:${C.panel2};border:1px solid ${C.line};border-radius:12px;padding:14px 16px;color:#3a382f">${esc(samenvatting || '')}</div>`
        + par('<span style="color:#76736B;font-size:13px">Technische specificatie — zonder klantgegevens.</span>');
      await send({
        to: fabriekTo,
        subject: `Productieaanvraag ${ref}`,
        html: layout({ preheader: `Productieaanvraag ${ref}`, badge: 'Fabrieksopdracht', heading: `Aanvraag ${ref}`, bodyHtml: body })
      });
    },

    async confirmRequest({ to, ref, naam }) {
      const att = avAttachment();
      const body = par(`Hallo ${esc(naam || '')},`)
        + par(`Bedankt voor je aanvraag. We hebben deze ontvangen onder referentie <strong>${esc(ref)}</strong> en stellen je offerte op maat samen. Zodra die klaarstaat, vind je hem terug in je portaal en ontvang je bericht.`)
        + par(`In de bijlage vind je onze algemene voorwaarden${att ? '' : ' (binnenkort beschikbaar)'}. Je kunt ze ook teruglezen op <a href="${base}/algemene-voorwaarden" style="color:${C.accentInk}">bestelkozijnenopmaat.nl/algemene-voorwaarden</a>.`)
        + par('Met vriendelijke groet,<br>' + esc(company.name));
      await send({
        to,
        subject: `We hebben je aanvraag ontvangen (${ref})`,
        attachments: att ? [att] : undefined,
        html: layout({ preheader: 'We hebben je aanvraag goed ontvangen.', badge: 'Ontvangen', heading: 'Bedankt voor je aanvraag', bodyHtml: body, button: { label: 'Naar je portaal', url: portaal } })
      });
    },

    // De offerte in één keer naar de klant: prijs + notitie + (optioneel) de PDF
    // als bijlage. Alleen verstuurd als de beheerder op "versturen" klikt.
    async sendOfferteNaarKlant({ to, ref, naam, prijs, notitie, pdfPath }) {
      const attachments = [];
      if (pdfPath) {
        try { attachments.push({ filename: `offerte-${ref}.pdf`, content: fs.readFileSync(pdfPath).toString('base64') }); }
        catch (e) { console.warn('[MAIL] offerte-PDF kon niet worden bijgevoegd:', e.message); }
      }
      const body = par(`Hallo ${esc(naam || '')},`)
        + par(`Je offerte voor aanvraag <strong>${esc(ref)}</strong> staat klaar.`)
        + priceBox(prijs, notitie)
        + (attachments.length ? par('De volledige offerte vind je in de bijlage (PDF).') : '')
        + par('Je vindt alles ook terug in je portaal.')
        + par('Met vriendelijke groet,<br>' + esc(company.name));
      await send({
        to,
        subject: `Je offerte ${ref}`,
        attachments: attachments.length ? attachments : undefined,
        html: layout({ preheader: `Je offerte ${ref} staat klaar`, badge: 'Je offerte', heading: `Offerte ${ref}`, bodyHtml: body, button: { label: 'Bekijk in je portaal', url: portaal } })
      });
    },

    // Statusupdate (en/of prijs) naar de klant — bij elke wijziging vanuit beheer.
    async notifyStatusUpdate({ to, ref, statusLabel, prijs, notitie }) {
      const body = par(`Er is een update over je aanvraag <strong>${esc(ref)}</strong>.`)
        + par(`Nieuwe status: <strong style="color:${C.accentInk}">${esc(statusLabel || '')}</strong>`)
        + priceBox(prijs, notitie)
        + par('Met vriendelijke groet,<br>' + esc(company.name));
      await send({
        to,
        subject: `Update over je aanvraag ${ref}`,
        html: layout({ preheader: `Status: ${statusLabel || ''}`, badge: 'Status-update', heading: `Aanvraag ${ref}`, bodyHtml: body, button: { label: 'Bekijk in je portaal', url: portaal } })
      });
    },

    // Wachtwoord vergeten: eenmalige herstellink (1 uur geldig).
    async sendPasswordReset({ to, naam, url }) {
      const body = par(`Hallo ${esc(naam || '')},`)
        + par('Je hebt gevraagd om je wachtwoord opnieuw in te stellen. Klik op de knop hieronder. Deze link is <strong>1 uur</strong> geldig en kan maar één keer worden gebruikt.')
        + par(`Werkt de knop niet? Kopieer dan deze link in je browser:<br><a href="${esc(url)}" style="color:${C.accentInk};word-break:break-all">${esc(url)}</a>`)
        + par('Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren; je wachtwoord blijft ongewijzigd.')
        + par('Met vriendelijke groet,<br>' + esc(company.name));
      await send({
        to,
        subject: 'Je wachtwoord opnieuw instellen',
        html: layout({ preheader: 'Stel je wachtwoord opnieuw in (link 1 uur geldig).', badge: 'Wachtwoord', heading: 'Wachtwoord opnieuw instellen', bodyHtml: body, button: { label: 'Nieuw wachtwoord instellen', url } })
      });
    }
  };
};
function esc(s = '') { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function formatPrijs(n) { return Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
