const express = require('express');
const db = require('../db');

const STATUS_LABELS = {
  ontvangen: 'Ontvangen',
  in_behandeling: 'In behandeling',
  offerte_klaar: 'Offerte klaar',
  akkoord: 'Akkoord',
  afgewezen: 'Afgewezen'
};

module.exports = function (company, mailer) {
  const router = express.Router();

  // ---- Aanvraag indienen (vereist login) ----
  router.post('/aanvraag', async (req, res) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Log eerst in of maak een account aan.' });
    const { elementen, opmerking } = req.body;
    if (!Array.isArray(elementen) || elementen.length === 0)
      return res.status(400).json({ ok: false, error: 'Voeg minstens één element toe.' });

    const request = await db.createRequest({
      userId: req.user.id,
      elementen,
      klant: { naam: req.user.naam, email: req.user.email, telefoon: req.user.telefoon || '', opmerking: opmerking || '' }
    });

    if (mailer) {
      const samenvatting = elementen.map((e, i) =>
        `Kozijn ${String(i + 1).padStart(3, '0')}: ${e.label || e.systeem || ''} · ${e.indeling || ''} · ${e.kleur || ''} · ${e.glas || ''} · ${e.afmetingen || ''} · ${e.montage === 'ja' || e.montage === true ? 'incl. montage' : 'excl. montage'} · ${e.aantal || 1}×`
      ).join('\n');
      mailer.notifyNewRequest({ ref: request.ref, klant: request.klant, samenvatting }).catch(() => {});
      mailer.confirmRequest({ to: req.user.email, ref: request.ref, naam: req.user.naam }).catch(() => {});
    }
    res.json({ ok: true, ref: request.ref, id: request.id });
  });

  // ---- AI inmeet-assistent ----
  router.post('/assistant', async (req, res) => {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ ok: false, error: 'Ongeldige vraag.' });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ ok: true, reply: 'De inmeet-assistent is nog niet geactiveerd (er ontbreekt een API-sleutel). Meet ondertussen de breedte op drie hoogtes (boven, midden, onder) en de hoogte op drie breedtes (links, midden, rechts), en noteer telkens de kleinste maat. De volledige uitleg vind je op de Werkwijze-pagina.' });
    }

    const system = `Je bent de inmeet-assistent van ${company.name} (kozijnen op maat). Je helpt particuliere klanten in begrijpelijk Nederlands om hun kozijn, deur of schuifpui zelf correct op te meten. Wees kort, vriendelijk en concreet.

Regels voor goed inmeten die je uitlegt en uitvraagt:
- Breedte: meet op 3 hoogtes (boven, midden, onder). Hoogte: meet op 3 breedtes (links, midden, rechts). Noteer steeds de KLEINSTE maat.
- Meet in millimeters.
- Controleer haaksheid: meet beide diagonalen; gelijk = haaks.
- Vraag of het om de dagmaat (binnenmaat van de muuropening) of de buitenmaat van een bestaand kozijn gaat.
- Vraag bij vervanging ook naar de muurdikte/inbouwdiepte.
- Waarschuw als de 3 metingen meer dan ~10 mm verschillen (scheve opening) of als maten onwaarschijnlijk lijken.
- Geef nooit prijzen; daarvoor volgt een offerte op maat.
Houd antwoorden kort (max ~4 zinnen) en stel telkens één duidelijke vervolgvraag.`;

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
          max_tokens: 600,
          system,
          messages: messages.slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) }))
        })
      });
      const data = await r.json();
      const reply = (data.content || []).map(c => c.text || '').join('\n').trim() || 'Sorry, ik kon even geen antwoord geven. Probeer het opnieuw.';
      res.json({ ok: true, reply });
    } catch (e) {
      console.error('Assistant-fout:', e);
      res.status(500).json({ ok: false, error: 'De assistent is even niet bereikbaar.' });
    }
  });

  return router;
};

module.exports.STATUS_LABELS = STATUS_LABELS;
