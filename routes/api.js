const express = require('express');
const db = require('../db');

const STATUS_LABELS = {
  ontvangen: 'Ontvangen',
  in_behandeling: 'In behandeling',
  offerte_klaar: 'Offerte klaar',
  akkoord: 'Akkoord',
  afgewezen: 'Afgewezen'
};

// De preview-markup (geanimeerde SVG / deurpaneel-HTML) komt van de client en wordt
// straks ongeëscaped in het portaal én het beheerpaneel getoond. Daarom hier strikt
// schoonmaken: alleen onze eigen <svg>/<div>-opbouw toelaten en alle scriptvectoren
// (script/iframe/event-handlers/javascript:-urls) verwijderen — defense-in-depth tegen
// een opgevoerde payload die anders stored-XSS bij de beheerder zou kunnen geven.
function sanitizePreview(s) {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  if (!t || t.length > 70000) return '';
  if (!/^<(svg|div)[\s>]/i.test(t)) return '';
  return t
    .replace(/<\s*\/?\s*(script|foreignobject|iframe|object|embed|a|link|meta|base|style)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|xlink:href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')
    .replace(/javascript:/gi, '');
}

module.exports = function (company, mailer) {
  const router = express.Router();

  // ---- Aanvraag indienen (vereist login) ----
  router.post('/aanvraag', async (req, res) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Log eerst in of maak een account aan.' });
    const { elementen, opmerking } = req.body;
    if (!Array.isArray(elementen) || elementen.length === 0)
      return res.status(400).json({ ok: false, error: 'Voeg minstens één element toe.' });

    const cleanElementen = elementen.map(e =>
      (e && typeof e === 'object') ? { ...e, previewSvg: sanitizePreview(e.previewSvg) } : e);

    const request = await db.createRequest({
      userId: req.user.id,
      elementen: cleanElementen,
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
        bestellingAfronden: { type: 'boolean', description: 'Zet op true zodra de samenstelling compleet is (essentiële velden bekend én de extra'+"'"+'s-vraag beantwoord). Dit plaatst NIET de bestelling, maar toont de klant het volledige overzicht van alle stappen zodat hij alles kan controleren en eventueel nog aanpassen. De klant plaatst de bestelling daarna zelf met de knop.' }
      }
    }
  };

  const SYS = `Je bent de configuratie- en inmeet-assistent van ${company.name} (kozijnen, schuifpuien, voordeuren op maat). Antwoord in de taal van de klant (Nederlands of Pools). Kort en concreet, max ~3 zinnen.

JE BELANGRIJKSTE TAAK is de online configurator invullen met de tool update_configuratie. Roep de tool aan ZODRA de klant een concrete waarde noemt (product, materiaal, kleur, glas, maat, vleugelfunctie, optie) — ook als nog niet alles bekend is, en OPNIEUW bij elke nieuwe aanvulling. Liever meerdere kleine updates dan wachten tot alles bekend is. Vraag NOOIT opnieuw naar iets dat de klant al heeft gezegd — gebruik de hele gesprekshistorie.

Voorbeeld: klant zegt "1 raam, naar binnen draaikiep rechts, zwart, dubbel glas, 1500x1300, hout, zonder montage" → roep meteen update_configuratie aan met: product:"raam", aantalVleugels:1, vleugelFuncties:["draaikiep rechts"], kleur:"zwart", glas:"dubbel", breedte_mm:1500, hoogte_mm:1300, materiaal:"hout", montage:false.

Geef waarden ALTIJD in het Nederlands door, ook als de klant Pools schrijft (vertaal: czarny→zwart, biały→wit, szary→grijs, antracytowy→antraciet, zielony→dennengroen; uchylne/rozwierane→draaikiep; prawo→rechts, lewo→links; podwójna szyba→dubbel, potrójna→triple; okno→raam, drzwi→voordeur; drewno→hout, plastik→kunststof, aluminium→aluminium).

Inmeten: noem de tip kort één keer (breedte op 3 hoogtes, hoogte op 3 breedtes, kleinste maat, in mm) maar BLOKKEER er niet op — als de klant maten noemt (bijv. 1500x1300) zet je ze meteen. Geef nooit prijzen.

ESSENTIËLE VELDEN — vraag hiernaar in DEZE volgorde als ze nog niet bekend zijn, en vul ze meteen in:
1) product (raam / schuifpui / voordeur);
2) materiaal (kunststof / hout / aluminium);
3) kleur;
4) afmetingen (breedte × hoogte in mm);
5) openingstype (vast / draai / draaikiep + links of rechts; bij schuifpui welk deel schuift);
6) glas (dubbel of triple);
7) montage (ja/nee).
Controleer dat ALLE zeven bekend zijn voordat je verder gaat. Ontbreekt er één — heel vaak het MATERIAAL of de kleur — vraag er dan expliciet naar. Ga NIET door naar de extra's-vraag of het overzicht zolang niet alle zeven bekend zijn. Verzin geen waarden. Loop verder GEEN losse opties langs (geen verhoor over kruk, kern, glaslat, enz.).

Stel daarna, in een APARTE beurt op zichzelf, ÉÉN gebundelde vraag over extra's, zodat de klant wéét dat het kan: "Wil je nog extra's? Mogelijk zijn o.a. inbraakwerend RC2, veiligheidsglas, een ventilatierooster, roedes, rolluik/hor of een specifieke kruk." Combineer die vraag NIET met montage of een andere vraag. Wacht echt op het antwoord en neem niet aan dat de klant geen extra's wil. Stel extra's alleen in als de klant ze kiest; anders blijven de standaardwaarden staan.

Alleen bij een begroeting of vraag zonder enige keuze: gewoon vriendelijk antwoorden, geen tool.

Volgorde: (1) zorg dat ALLE 7 essentiële velden bekend zijn — vraag expliciet naar wat ontbreekt (bijv. materiaal); (2) stel daarna de APARTE extra's-vraag en wacht op het antwoord; (3) pas NA dat antwoord roep je de tool aan met bestellingAfronden:true.

bestellingAfronden plaatst de bestelling NIET — het toont de klant het volledige overzicht van alle stappen. Schrijf er dan een korte, vriendelijke samenvatting bij van wat je hebt gekozen en zeg: "Bekijk gerust alle stappen in het overzicht — je kunt nog van alles aanpassen en ziet het live in de preview. Klik op 'Voeg toe aan aanvraag' en daarna 'Aanvraag versturen' om te bestellen." Plaats de bestelling NOOIT zelf en zeg nooit dat er al besteld is.`;

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
