// E-mailmeldingen via Resend. Zonder RESEND_API_KEY wordt alleen gelogd.
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

  return {
    async notifyNewRequest({ ref, klant, samenvatting }) {
      await send({
        to: adminTo,
        subject: `Nieuwe aanvraag ${ref} – ${klant.naam}`,
        html: `<h2>Nieuwe aanvraag ${ref}</h2>
          <p>${esc(klant.naam)} · ${esc(klant.email)} · ${esc(klant.telefoon || '-')}</p>
          <pre style="font-family:monospace;white-space:pre-wrap">${esc(samenvatting)}</pre>
          <p>${esc(klant.opmerking || '')}</p>`
      });
    },
    // Bevestiging naar de klant, met de algemene voorwaarden als PDF-bijlage
    async confirmRequest({ to, ref, naam }) {
      const att = avAttachment();
      await send({
        to,
        subject: `We hebben je aanvraag ontvangen (${ref})`,
        attachments: att ? [att] : undefined,
        html: `<p>Hallo ${esc(naam || '')},</p>
          <p>Bedankt voor je aanvraag. We hebben deze ontvangen onder referentie <strong>${esc(ref)}</strong> en stellen je offerte op maat samen. Zodra die klaarstaat, vind je hem terug in je portaal en ontvang je bericht.</p>
          <p>In de bijlage vind je onze algemene voorwaarden${att ? '' : ' (binnenkort beschikbaar)'}. Je kunt ze ook teruglezen op
            <a href="https://bestelkozijnenopmaat.nl/algemene-voorwaarden">bestelkozijnenopmaat.nl/algemene-voorwaarden</a>.</p>
          <p>Met vriendelijke groet,<br>${esc(company.name)}</p>`
      });
    },
    // De offerte in één keer naar de klant: prijs + notitie + (optioneel) de
    // PDF als bijlage. Wordt alleen verstuurd als de beheerder op "versturen"
    // klikt.
    async sendOfferteNaarKlant({ to, ref, naam, prijs, notitie, pdfPath }) {
      const attachments = [];
      if (pdfPath) {
        try { attachments.push({ filename: `offerte-${ref}.pdf`, content: fs.readFileSync(pdfPath).toString('base64') }); }
        catch (e) { console.warn('[MAIL] offerte-PDF kon niet worden bijgevoegd:', e.message); }
      }
      const prijsBlok = (prijs != null) ? `
          <p style="font-size:20px;margin:14px 0 4px"><strong>Prijs: € ${esc(formatPrijs(prijs))}</strong></p>
          ${notitie ? `<p style="color:#555;margin:0">${esc(notitie)}</p>` : ''}` : '';
      await send({
        to,
        subject: `Je offerte ${ref}`,
        attachments: attachments.length ? attachments : undefined,
        html: `<p>Hallo ${esc(naam || '')},</p>
          <p>Je offerte voor aanvraag <strong>${esc(ref)}</strong> staat klaar.</p>
          ${prijsBlok}
          ${attachments.length ? '<p>De volledige offerte vind je in de bijlage (PDF).</p>' : ''}
          <p style="margin-top:16px">Je vindt alles ook terug in <a href="https://bestelkozijnenopmaat.nl/portaal">je portaal</a>.</p>
          <p>Met vriendelijke groet,<br>${esc(company.name)}</p>`
      });
    },
    // Statusupdate (en/of prijs) naar de klant — verstuurd bij elke wijziging
    // vanuit het beheerpaneel.
    async notifyStatusUpdate({ to, ref, statusLabel, prijs, notitie }) {
      const prijsBlok = (prijs != null) ? `
          <p style="font-size:18px;margin:14px 0 4px"><strong>Prijs: € ${esc(formatPrijs(prijs))}</strong></p>
          ${notitie ? `<p style="color:#555;margin:0">${esc(notitie)}</p>` : ''}` : '';
      await send({
        to,
        subject: `Update over je aanvraag ${ref}`,
        html: `<p>Er is een update over je aanvraag <strong>${esc(ref)}</strong>.</p>
          <p>Nieuwe status: <strong>${esc(statusLabel || '')}</strong></p>
          ${prijsBlok}
          <p style="margin-top:16px">Bekijk de details in <a href="https://bestelkozijnenopmaat.nl/portaal">je portaal</a>.</p>
          <p>Met vriendelijke groet,<br>${esc(company.name)}</p>`
      });
    },
    // Wachtwoord vergeten: stuur een eenmalige herstellink (1 uur geldig).
    async sendPasswordReset({ to, naam, url }) {
      await send({
        to,
        subject: 'Je wachtwoord opnieuw instellen',
        html: `<p>Hallo ${esc(naam || '')},</p>
          <p>Je hebt gevraagd om je wachtwoord opnieuw in te stellen. Klik op onderstaande knop. Deze link is <strong>1 uur</strong> geldig en kan maar één keer worden gebruikt.</p>
          <p style="margin:24px 0">
            <a href="${esc(url)}" style="background:#1f6feb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Nieuw wachtwoord instellen</a>
          </p>
          <p>Werkt de knop niet? Kopieer dan deze link in je browser:<br>
            <a href="${esc(url)}">${esc(url)}</a></p>
          <p>Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren; je wachtwoord blijft ongewijzigd.</p>
          <p>Met vriendelijke groet,<br>${esc(company.name)}</p>`
      });
    }
  };
};
function esc(s = '') { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function formatPrijs(n) { return Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
