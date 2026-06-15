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
      // Schone fabrieksmail (alleen referentie + specificatie, geen klantgegevens).
      // Alleen verzonden als MAIL_FABRIEK is ingesteld.
      mailer.notifyFabriek({ ref: request.ref, samenvatting }).catch(() => {});
      mailer.confirmRequest({ to: req.user.email, ref: request.ref, naam: req.user.naam }).catch(() => {});
    }
    res.json({ ok: true, ref: request.ref, id: request.id });
  });

  // ---- AI-configuratie- & inmeet-assistent (Claude Haiku, tool use) ----
  // De assistent praat met de klant én vult de configurator in: het model roept
  // `update_configuratie` aan met concrete keuzes, die de browser toepast op de
  // live preview. Zuinig met tokens: één API-call per bericht; alleen ná een
  // tool-aanroep volgt nog één call voor een natuurlijk antwoord. Korte prompt,
  // korte historie (8 berichten), max_tokens 500.
  const CONFIG_TOOL = {
    name: 'update_configuratie',
    description: 'Pas de online configurator van de klant aan zodra de klant een concrete keuze maakt (product, materiaal, kleur, glas, afmetingen, indeling of opties). Geef alleen velden mee die nu duidelijk zijn; laat de rest weg. De klant ziet de wijziging meteen in de live preview.',
    input_schema: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Soort product, één van: "raam", "schuifpui", "voordeur".' },
        materiaal: { type: 'string', description: 'Profielmateriaal, één van: "kunststof", "hout", "aluminium". Voordeur kan alleen bij kunststof.' },
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
        deurCollectie: { type: 'string', description: 'Voordeur-paneelcollectie, één van: Standard, Modern, Deco, Econo, Glass.' },
        deurModel: { type: 'string', description: 'Voordeur: modelcode, bijv. ST-01.' },
        dubbeleDeur: { type: 'boolean' },
        bestellingAfronden: { type: 'boolean', description: 'Zet op true ALLEEN als de klant uitdrukkelijk bevestigt dat de samenstelling klaar is en de aanvraag/bestelling geplaatst mag worden. Dan wordt de huidige configuratie in de aanvraag gezet en verstuurd (of, als de klant niet is ingelogd, klaargezet zodat hij een account kan aanmaken).' }
      }
    }
  };

  const SYS = `Je bent de configuratie- en inmeet-assistent van ${company.name} (kozijnen, schuifpuien, voordeuren op maat). Antwoord in de taal van de klant (Nederlands of Pools). Kort en concreet, max ~3 zinnen.

JE BELANGRIJKSTE TAAK is de online configurator invullen met de tool update_configuratie. Roep de tool aan ZODRA de klant een concrete waarde noemt (product, materiaal, kleur, glas, maat, vleugelfunctie, optie) — ook als nog niet alles bekend is, en OPNIEUW bij elke nieuwe aanvulling. Liever meerdere kleine updates dan wachten tot alles bekend is. Vraag NOOIT opnieuw naar iets dat de klant al heeft gezegd — gebruik de hele gesprekshistorie.

Voorbeeld: klant zegt "1 raam, naar binnen draaikiep rechts, zwart, dubbel glas, 1500x1300, hout, zonder montage" → roep meteen update_configuratie aan met: product:"raam", aantalVleugels:1, vleugelFuncties:["draaikiep rechts"], kleur:"zwart", glas:"dubbel", breedte_mm:1500, hoogte_mm:1300, materiaal:"hout", montage:false.

Geef waarden ALTIJD in het Nederlands door, ook als de klant Pools schrijft (vertaal: czarny→zwart, biały→wit, szary→grijs, antracytowy→antraciet, zielony→dennengroen; uchylne/rozwierane→draaikiep; prawo→rechts, lewo→links; podwójna szyba→dubbel, potrójna→triple; okno→raam, drzwi→voordeur; drewno→hout, plastik→kunststof, aluminium→aluminium).

Inmeten: noem de tip kort één keer (breedte op 3 hoogtes, hoogte op 3 breedtes, kleinste maat, in mm) maar BLOKKEER er niet op — als de klant maten noemt (bijv. 1500x1300) zet je ze meteen. Geef nooit prijzen.

Alleen bij een begroeting of vraag zonder enige keuze: gewoon vriendelijk antwoorden, geen tool.

Als de samenstelling compleet is: vat kort samen en vraag of je de aanvraag mag plaatsen. Pas bij bevestiging ("ja", "plaats maar", "bestellen") roep je de tool aan met bestellingAfronden:true. Verzin nooit zelf dat het klaar is.`;

  router.post('/assistant', async (req, res) => {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ ok: false, error: 'Ongeldige vraag.' });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ ok: true, reply: 'De assistent is nog niet geactiveerd (er ontbreekt een API-sleutel). Meet ondertussen de breedte op drie hoogtes en de hoogte op drie breedtes, en noteer telkens de kleinste maat.', updates: null });
    }

    // Laatste 8 berichten; Anthropic vereist dat het eerste bericht van de
    // gebruiker is, dus laat leidende assistent-berichten (de begroeting) weg.
    const convo = messages.slice(-8)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) }));
    while (convo.length && convo[0].role === 'assistant') convo.shift();
    if (!convo.length) return res.json({ ok: true, reply: 'Waarmee kan ik je helpen?', updates: null });

    try {
      const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';
      const ingelogd = !!req.user;
      const system = SYS + (ingelogd
        ? '\n\nDe klant is INGELOGD. Bij bestellingAfronden wordt de aanvraag meteen geplaatst; bevestig dat kort en vriendelijk.'
        : '\n\nDe klant is NIET ingelogd. Bij bestellingAfronden wordt de samenstelling klaargezet, maar de klant moet eerst een gratis account aanmaken of inloggen om de aanvraag te versturen — leg dat vriendelijk uit.');
      async function claude(msgs) {
        const rr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({ model: MODEL, max_tokens: 500, system, tools: [CONFIG_TOOL], messages: msgs })
        });
        return rr.json();
      }

      const data = await claude(convo);
      if (data.error) { console.error('Assistant API-fout:', data.error); return res.status(500).json({ ok: false, error: 'De assistent is even niet bereikbaar.' }); }

      const blocks = data.content || [];
      const toolUses = blocks.filter(b => b.type === 'tool_use');
      const updates = {};
      for (const t of toolUses) if (t.input && typeof t.input === 'object') Object.assign(updates, t.input);
      let reply = blocks.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();

      // Alleen ná een tool-aanroep nog één call: het model schrijft dan een
      // natuurlijk antwoord op basis van het toegepaste resultaat.
      if (toolUses.length) {
        try {
          const follow = convo.concat([
            { role: 'assistant', content: blocks },
            { role: 'user', content: toolUses.map(t => ({ type: 'tool_result', tool_use_id: t.id, content: 'Toegepast in de configurator.' })) }
          ]);
          const data2 = await claude(follow);
          const reply2 = ((data2.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')).trim();
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
