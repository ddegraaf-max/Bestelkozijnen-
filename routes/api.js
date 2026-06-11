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

  // ---- AI-configuratie- & inmeet-assistent (OpenAI, function calling) ----
  // De assistent praat met de klant én vult de configurator in: het model roept
  // de functie `update_configuratie` aan met concrete keuzes, die de browser
  // toepast op de live preview. De frontend valideert/mapt alles. Eén API-call
  // per bericht (geen tool-lus) om kosten laag te houden.
  const CONFIG_FN = {
    type: 'function',
    function: {
      name: 'update_configuratie',
      description: 'Pas de online configurator van de klant aan zodra de klant een concrete keuze maakt (product, materiaal, kleur, glas, afmetingen, indeling of opties). Geef alleen velden mee die nu duidelijk zijn; laat de rest weg. De klant ziet de wijziging meteen in de live preview.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', enum: ['raam', 'schuifpui', 'voordeur'], description: 'Soort product.' },
          materiaal: { type: 'string', enum: ['kunststof', 'hout', 'aluminium'], description: 'Profielmateriaal. Voordeur kan alleen bij kunststof.' },
          kleur: { type: 'string', description: 'Kleur buiten (en binnen indien gelijk). Bijv. wit, antraciet (RAL 7016), zwart, crème, grijs, dennengroen, staalblauw, gouden eiken, donker eiken, mahonie, noten.' },
          kleurBinnen: { type: 'string', description: 'Alleen als de binnenkleur afwijkt van buiten.' },
          glas: { type: 'string', description: 'Glassoort. Bijv. HR++ dubbel, Triple HR+++, geluidwerend, veiligheid/gelaagd, zonwerend, ornament, gezandstraald, melkglas.' },
          breedte_mm: { type: 'integer', description: 'Breedte in mm (400–6000).' },
          hoogte_mm: { type: 'integer', description: 'Hoogte in mm (300–3000).' },
          aantalVleugels: { type: 'integer', description: 'Aantal vleugels bij een raam (1–4).' },
          vleugelFuncties: { type: 'array', items: { type: 'string' }, description: 'Functie per vleugel op volgorde. Opties: vast, draaikiep links/rechts, draai links/rechts.' },
          schuifDelen: { type: 'integer', description: 'Aantal delen bij een schuifpui (2–4).' },
          montage: { type: 'boolean', description: 'Inclusief montage?' },
          rc2: { type: 'boolean', description: 'Inbraakwerend RC2?' },
          roede: { type: 'boolean' }, ventilatie: { type: 'boolean' },
          rolluik: { type: 'boolean' }, hor: { type: 'boolean' }, screen: { type: 'boolean' },
          positie: { type: 'string', description: 'Plek/ruimte, bijv. woonkamer voorzijde.' },
          aantal: { type: 'integer', description: 'Aantal identieke kozijnen.' },
          deurCollectie: { type: 'string', enum: ['Standard', 'Modern', 'Deco', 'Econo', 'Glass'] },
          deurModel: { type: 'string', description: 'Voordeur: modelcode, bijv. ST-01.' },
          dubbeleDeur: { type: 'boolean' }
        }
      }
    }
  };

  const SYS = `Je bent de configuratie- en inmeet-assistent van ${company.name} (kozijnen, schuifpuien, voordeuren op maat). Help particuliere klanten in het Nederlands hun kozijn samen te stellen en correct op te meten. Kort, warm, concreet: max ~4 zinnen, telkens één vervolgvraag. Geef nooit prijzen.

Roep de functie update_configuratie ALLEEN aan als de klant een concrete keuze noemt (kleur, maat, product, glas, indeling, optie). Bij een begroeting, bedankje of vraag zonder concrete keuze roep je de functie NIET aan — antwoord dan gewoon vriendelijk en stel een vervolgvraag. Vul alleen wat de klant duidelijk maakt; verzin niets. Zet afmetingen pas als de klant ze noemt.

Inmeten: breedte op 3 hoogtes, hoogte op 3 breedtes, noteer steeds de kleinste maat (in mm). Vraag of het de dagmaat of de buitenmaat is; bij vervanging ook de muurdikte. Waarschuw bij verschillen > ~10 mm.`;

  router.post('/assistant', async (req, res) => {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ ok: false, error: 'Ongeldige vraag.' });

    if (!process.env.OPENAI_API_KEY) {
      return res.json({ ok: true, reply: 'De assistent is nog niet geactiveerd (er ontbreekt een API-sleutel). Meet ondertussen de breedte op drie hoogtes en de hoogte op drie breedtes, en noteer telkens de kleinste maat.', updates: null });
    }

    // Laatste 8 berichten, beknopt; systeemprompt als eerste bericht.
    const convo = messages.slice(-8)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) }));
    if (!convo.length) return res.json({ ok: true, reply: 'Waarmee kan ik je helpen?', updates: null });

    try {
      // OpenAI-compatibele endpoint. Standaard OpenAI; wijs OPENAI_BASE_URL naar
      // Groq of Gemini (gratis) zonder verdere codewijziging.
      const apiBase = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      async function chat(msgs, withTools) {
        const body = { model: MODEL, messages: msgs, temperature: 0.3, max_tokens: 500 };
        if (withTools) { body.tools = [CONFIG_FN]; body.tool_choice = 'auto'; }
        const rr = await fetch(`${apiBase}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify(body)
        });
        return rr.json();
      }

      const baseMessages = [{ role: 'system', content: SYS }, ...convo];
      const data = await chat(baseMessages, true);
      if (data.error) { console.error('Assistant API-fout:', data.error); return res.status(500).json({ ok: false, error: 'De assistent is even niet bereikbaar.' }); }

      const msg = (data.choices && data.choices[0] && data.choices[0].message) || {};
      const updates = {};
      for (const tc of (msg.tool_calls || [])) {
        const args = tc.function && tc.function.arguments;
        if (args) { try { Object.assign(updates, JSON.parse(args)); } catch (e) { /* negeer ongeldige JSON */ } }
      }
      let reply = (msg.content || '').trim();

      // Heeft het model de configurator aangepast? Dan is content vaak leeg —
      // doe één extra call met het functieresultaat zodat het model een echt,
      // natuurlijk antwoord schrijft (geen standaardzin).
      if (msg.tool_calls && msg.tool_calls.length) {
        try {
          const follow = baseMessages.concat([msg], msg.tool_calls.map(tc => ({
            role: 'tool', tool_call_id: tc.id, content: 'Toegepast in de configurator.'
          })));
          const data2 = await chat(follow, false);
          const reply2 = ((data2.choices && data2.choices[0] && data2.choices[0].message && data2.choices[0].message.content) || '').trim();
          if (reply2) reply = reply2;
        } catch (e) { console.warn('Assistant vervolg-call mislukt:', e.message); }
      }

      if (!reply) reply = Object.keys(updates).length ? 'Ik heb het aangepast in de configurator. Wil je nog iets wijzigen?' : 'Waarmee kan ik je helpen?';
      res.json({ ok: true, reply, updates: Object.keys(updates).length ? updates : null });
    } catch (e) {
      console.error('Assistant-fout:', e);
      res.status(500).json({ ok: false, error: 'De assistent is even niet bereikbaar.' });
    }
  });

  return router;
};

module.exports.STATUS_LABELS = STATUS_LABELS;
