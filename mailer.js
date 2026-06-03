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
    async notifyOfferteReady({ to, ref }) {
      await send({
        to,
        subject: `Je offerte ${ref} staat klaar`,
        html: `<p>Goed nieuws — je offerte <strong>${esc(ref)}</strong> staat klaar in je portaal.</p>
          <p>Log in op <a href="https://bestelkozijnenopmaat.nl/portaal">je portaal</a> om de offerte te bekijken en te downloaden.</p>`
      });
    }
  };
};
function esc(s = '') { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
