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

  // ---- AI-configuratie- & inmeet-assistent ----
  // De assistent praat met de klant én vult de configurator in via tool use:
  // het model roept `update_configuratie` aan met concrete keuzes, die de
  // browser toepast op de live preview. De frontend valideert/mapt alles, dus
  // de waarden hieronder zijn richtinggevend, niet bindend.
  const CONFIG_TOOL = {
    name: 'update_configuratie',
    description: 'Pas de online configurator van de klant aan zodra de klant een concrete keuze maakt (product, materiaal, kleur, glas, afmetingen, indeling of opties). Geef alleen de velden mee die op dit moment duidelijk zijn — laat de rest weg. De klant ziet de wijziging meteen in de live preview.',
    input_schema: {
      type: 'object',
      properties: {
        product: { type: 'string', enum: ['raam', 'schuifpui', 'voordeur'], description: 'Soort product.' },
        materiaal: { type: 'string', enum: ['kunststof', 'hout', 'aluminium'], description: 'Profielmateriaal. Voordeur/los paneel kan alleen bij kunststof.' },
        kleur: { type: 'string', description: 'Kleur buiten (en binnen indien gelijk). Bijv. "wit", "antraciet (RAL 7016)", "zwart", "crème", "grijs", "dennengroen", "staalblauw", "gouden eiken", "donker eiken", "mahonie", "noten".' },
        kleurBinnen: { type: 'string', description: 'Alleen invullen als de binnenkleur afwijkt van buiten.' },
        glas: { type: 'string', description: 'Glassoort. Bijv. "HR++ dubbel", "Triple HR+++", "geluidwerend", "veiligheid/gelaagd", "zonwerend", "ornament", "gezandstraald", "melkglas".' },
        breedte_mm: { type: 'integer', description: 'Breedte in millimeters (400–6000).' },
        hoogte_mm: { type: 'integer', description: 'Hoogte in millimeters (300–3000).' },
        aantalVleugels: { type: 'integer', description: 'Aantal vleugels naast elkaar bij een raam (1–4).' },
        vleugelFuncties: { type: 'array', items: { type: 'string' }, description: 'Functie per vleugel, op volgorde. Bijv. ["draaikiep rechts","vast"]. Opties: "vast", "draaikiep links/rechts", "draai links/rechts".' },
        schuifDelen: { type: 'integer', description: 'Aantal delen bij een schuifpui (2–4).' },
        montage: { type: 'boolean', description: 'Inclusief montage?' },
        rc2: { type: 'boolean', description: 'Inbraakwerend RC2?' },
        roede: { type: 'boolean', description: 'Roedes (glasverdelers) gewenst?' },
        ventilatie: { type: 'boolean', description: 'Ventilatierooster gewenst?' },
        rolluik: { type: 'boolean' }, hor: { type: 'boolean' }, screen: { type: 'boolean' },
        positie: { type: 'string', description: 'Plek/ruimte, bijv. "woonkamer voorzijde".' },
        aantal: { type: 'integer', description: 'Aantal identieke kozijnen.' },
        deurCollectie: { type: 'string', enum: ['Standard', 'Modern', 'Deco', 'Econo', 'Glass'], description: 'Voordeur: paneelcollectie.' },
        deurModel: { type: 'string', description: 'Voordeur: modelcode, bijv. "ST-01" of "MD-12".' },
        dubbeleDeur: { type: 'boolean', description: 'Voordeur: dubbele deuren i.p.v. enkele.' }
      }
    }
  };

  const SYS = `Je bent de configuratie- en inmeet-assistent van ${company.name} (kozijnen, schuifpuien en voordeuren op maat). Je helpt particuliere klanten in begrijpelijk Nederlands hun kozijn samen te stellen én correct op te meten. Wees kort, warm en concreet — max ~4 zinnen, en stel telkens één duidelijke vervolgvraag.

BELANGRIJK — je kunt de configurator van de klant live invullen. Zodra de klant een concrete keuze noemt (bijv. "antraciet", "schuifpui van 3 meter", "triple glas", "voordeur"), roep je de tool \`update_configuratie\` aan met die velden. Vul alleen wat duidelijk is; verzin niets. De klant kan alles daarna nog zelf aanpassen. Bevestig na het toepassen kort wat je hebt ingesteld en vraag naar de volgende stap.

Inmeten (leg uit en vraag uit):
- Breedte: meet op 3 hoogtes (boven, midden, onder). Hoogte: meet op 3 breedtes (links, midden, rechts). Noteer steeds de KLEINSTE maat. Alles in millimeters.
- Vraag of het de dagmaat (muuropening) of de buitenmaat van een bestaand kozijn is; bij vervanging ook de muurdikte.
- Waarschuw bij verschillen > ~10 mm (scheve opening) of onwaarschijnlijke maten.
- Zet afmetingen pas in de configurator als de klant ze noemt.

Geef nooit prijzen; daarvoor volgt een offerte op maat.`;

  router.post('/assistant', async (req, res) => {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ ok: false, error: 'Ongeldige vraag.' });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ ok: true, reply: 'De assistent is nog niet geactiveerd (er ontbreekt een API-sleutel). Meet ondertussen de breedte op drie hoogtes en de hoogte op drie breedtes, en noteer telkens de kleinste maat.', updates: null });
    }

    // Bouw de conversatie; Anthropic vereist dat het eerste bericht van de
    // gebruiker is, dus laat leidende assistent-berichten (zoals de begroeting) weg.
    const convo = messages.slice(-12)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) }));
    while (convo.length && convo[0].role === 'assistant') convo.shift();
    if (!convo.length) return res.json({ ok: true, reply: 'Waarmee kan ik je helpen?', updates: null });

    async function callClaude(msgs) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
          max_tokens: 700,
          system: SYS,
          tools: [CONFIG_TOOL],
          messages: msgs
        })
      });
      return r.json();
    }

    try {
      const updates = {};
      let reply = '';
      const work = convo.slice();
      // Tool-lus: hooguit 3 ronden (model kan tool aanroepen, wij bevestigen, model rondt af).
      for (let i = 0; i < 3; i++) {
        const data = await callClaude(work);
        if (data.error) { console.error('Assistant API-fout:', data.error); break; }
        const blocks = data.content || [];
        reply = blocks.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || reply;
        const toolUses = blocks.filter(b => b.type === 'tool_use');
        if (!toolUses.length || data.stop_reason !== 'tool_use') break;
        for (const t of toolUses) if (t.input && typeof t.input === 'object') Object.assign(updates, t.input);
        work.push({ role: 'assistant', content: blocks });
        work.push({ role: 'user', content: toolUses.map(t => ({ type: 'tool_result', tool_use_id: t.id, content: 'Toegepast in de configurator. Bevestig kort en ga verder.' })) });
      }
      res.json({ ok: true, reply: reply || 'Top, ik heb het aangepast in de configurator.', updates: Object.keys(updates).length ? updates : null });
    } catch (e) {
      console.error('Assistant-fout:', e);
      res.status(500).json({ ok: false, error: 'De assistent is even niet bereikbaar.' });
    }
  });

  return router;
};

module.exports.STATUS_LABELS = STATUS_LABELS;
