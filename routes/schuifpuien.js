// =====================================================================
// SCHUIFPUIEN — Drutex schuifpuien-sectie van bestelkozijnenopmaat.nl
//
//   /schuifpuien                      Hub: overzicht, offerteformulier, FAQ
//   /schuifpuien/hef-schuifpui        Drutex IGLO-HS (kunststof HST)
//   /schuifpuien/kiep-schuifpui       Drutex PSK (kunststof kiep-schuif)
//   /schuifpuien/aluminium-schuifpui  Drutex MB-77HS (aluminium HST)
//   /schuifpuien/muur-uitbreken       Muur wegbreken & constructieberekening
//   /schuifpuien/werkwijze            Stappenplan (stap 1: gemeentetekening)
//   POST /schuifpuien/offerte         Aanvraag → Beheer > Aanvragen
//
// Mount in server.js (publiek, GEEN admin-middleware):
//   app.use('/schuifpuien', require('./routes/schuifpuien')(company, mailer));
//
// De pagina's gebruiken automatisch de ECHTE header/footer van de site
// (zelfde detectie als de AI Kozijnenscan): partials uit home.ejs.
// =====================================================================

const express = require('express');
const path = require('path');
const fsMod = require('fs');
const db = require('../db');

module.exports = function (company, mailer) {
const router = express.Router();

// ---------------------------------------------------------------------
// Header/footer van de site detecteren (zelfde truc als de scanpagina)
// ---------------------------------------------------------------------
let _partialsCache = null;
function detectSitePartials() {
  if (_partialsCache) return _partialsCache;
  try {
    const viewsDir = path.join(__dirname, '..', 'views');
    const src = fsMod.readFileSync(path.join(viewsDir, 'home.ejs'), 'utf8');
    const incs = [...src.matchAll(/include\(\s*['"]([^'"]+)['"]/g)]
      .map(m => ({ name: m[1], idx: m.index }));
    const startMarkers = ['<main', '<section', '<h1'];
    const contentStart = Math.min(...startMarkers.map(t => {
      const i = src.indexOf(t); return i < 0 ? Infinity : i;
    }));
    const endMarkers = ['</main>', '</section>'];
    const contentEnd = Math.max(...endMarkers.map(t => src.lastIndexOf(t)));
    const headerPartials = incs.filter(x => x.idx < contentStart).map(x => x.name);
    const footerPartials = incs.filter(x => contentEnd > 0 && x.idx > contentEnd).map(x => x.name);
    _partialsCache = { headerPartials, footerPartials };
  } catch (e) {
    _partialsCache = { headerPartials: [], footerPartials: [] };
  }
  return _partialsCache;
}

function render(res, view, data) {
  const { headerPartials, footerPartials } = detectSitePartials();
  res.render(view, { headerPartials, footerPartials, active: 'schuifpuien', ...data });
}

// ---------------------------------------------------------------------
// Modeldata — uitsluitend geverifieerde Drutex/Aluprof-specificaties.
// ---------------------------------------------------------------------
const MODELLEN = {
  'hef-schuifpui': {
    slug: 'hef-schuifpui',
    naam: 'Hef-schuifpui — Drutex IGLO-HS',
    kort: 'IGLO-HS',
    materiaal: 'Kunststof (klasse A)',
    sub: 'De kunststof hef-schuifpui met maximaal glas en minimale weerstand',
    metaTitle: 'Hef-schuifpui op maat – Drutex IGLO-HS | bestelkozijnenopmaat.nl',
    metaDescr: 'Drutex IGLO-HS hef-schuifpui op maat: 7-kamerprofiel, vleugels tot 400 kg, lage drempel en veloursafdichting. Inclusief inmeting en montage.',
    intro: 'Met een hef-schuifpui (HST) tilt u de vleugel met één beweging van de kruk een paar millimeter op, waarna hij vrijwel gewichtloos over de rail glijdt — ook bij vleugels van honderden kilo\u2019s. Gesloten zakt de vleugel weer in de afdichting: pot- en winddicht. Het is d\u00e9 keuze voor grote glasoppervlakken en een vlakke overgang van woonkamer naar tuin of terras.',
    specs: [
      ['Profiel', '7-kamerprofiel klasse A, extra versterkt met stalen profielen'],
      ['Afdichting', 'Veloursafdichting aan de binnenzijde (primeur uit de auto-industrie) + EPDM- en borstelafdichting buiten'],
      ['Beslag', 'GU hef-schuifbeslag, standaard drie vergrendelbare grendels'],
      ['Vleugelgewicht', 'Tot 400 kg per vleugel — dus ook zeer grote glasvlakken'],
      ['Rails', 'Twee onafhankelijk werkende geleiderails'],
      ['Drempel', 'Lage drempel van PVC en aluminium'],
      ['Beglazing', 'HR++ of triple, met warme rand; zeer lage Uw-waarden mogelijk'],
      ['Veiligheid', 'Uitbreidbaar met moderne anti-inbraakelementen'],
      ['Kleuren', 'Het volledige Drutex decorfolie-palet — wit, antraciet, houtnerf en meer']
    ],
    voordelen: [
      ['Moeiteloos schuiven', 'Het hefmechanisme neemt het gewicht over: ook een vleugel van 3 meter beweegt u met twee vingers.'],
      ['Vlakke doorloop', 'De lage PVC/aluminium drempel maakt de overgang naar buiten vrijwel drempelloos.'],
      ['Stil en energiezuinig', 'De veloursafdichting binnen plus EPDM en borstels buiten zorgen voor uitstekende geluid- en warmte-isolatie.'],
      ['Geen zwaairuimte', 'De vleugel schuift l\u00e1ngs het vaste deel — u houdt binnen en buiten alle ruimte vrij voor meubels en terras.']
    ],
    indelingen: [
      ['2-delig', 'E\u00e9n schuivende vleugel voor een vast deel — de klassieker.'],
      ['3-delig', 'Groot vast middenvlak met een schuifvleugel; of \u00e9\u00e9n groot schuifdeel.'],
      ['4-delig', 'Twee schuifvleugels die naar buiten toe openen: royale middenopening.']
    ],
    svg: 'hst'
  },
  'kiep-schuifpui': {
    slug: 'kiep-schuifpui',
    naam: 'Kiep-schuifpui — Drutex PSK',
    kort: 'PSK',
    materiaal: 'Kunststof (klasse A)',
    sub: 'Slim schuiven \u00e9n ventileren — het voordelige alternatief',
    metaTitle: 'Kiep-schuifpui op maat – Drutex PSK | bestelkozijnenopmaat.nl',
    metaDescr: 'Drutex PSK kiep-schuifpui op maat: kiepen om te ventileren, schuiven om te openen. Inbraakwerend MACO-beslag, klasse A-profiel. Inclusief montage.',
    intro: 'Bij een kiep-schuifpui (PSK) draait u de kruk en kantelt de vleugel iets naar voren, waarna hij op twee geleiderails zijwaarts voor het vaste deel schuift. In de kiepstand ventileert u veilig, geopend heeft u een ruime doorgang. De PSK is compacter van opbouw dan een hef-schuifpui en daardoor vaak de scherpst geprijsde schuifoplossing voor kleinere en middelgrote openingen.',
    specs: [
      ['Profiel', 'Smal kunststof profiel klasse A — groot glasoppervlak, veel lichtinval'],
      ['Techniek', 'Kiep-schuif: vleugel kantelt naar voren en schuift over twee onafhankelijke geleiderails'],
      ['Ventilatie', 'Volwaardige kiepstand om veilig te ventileren, ook \u2019s nachts'],
      ['Beslag', 'Inbraakwerend MACO-beslag met paddenstoelnokken, verankerd in de stalen wapening'],
      ['Comfort', 'Optioneel met automatische dwangsturing: het kantelen en aandrukken gaat dan vanzelf'],
      ['Beglazing', 'HR++ of triple, met warme rand'],
      ['Kleuren', 'Uitgebreid kleuren- en decorpalet, inclusief natuurgetrouwe houtnerven']
    ],
    voordelen: [
      ['Scherp geprijsd', 'Minder zwaar beslag en een compactere opbouw dan een HST — dat scheelt in de prijs.'],
      ['Kiepen = ventileren', 'Uniek aan de PSK: de vleugel kan ook gewoon op de kiepstand, net als een draaikiepraam.'],
      ['Veilig', 'Paddenstoelnokken die direct in de stalen wapening grijpen maken opwrikken erg lastig.'],
      ['Ruimtebesparend', 'Geen draaicirkel: de vleugel schuift strak voor het vaste deel langs.']
    ],
    indelingen: [
      ['2-delig', 'E\u00e9n kiep-schuifvleugel naast een vast glasdeel.'],
      ['3-delig', 'Vleugel schuift voor een breder vast vlak — meer glas, zelfde bediening.']
    ],
    svg: 'psk'
  },
  'aluminium-schuifpui': {
    slug: 'aluminium-schuifpui',
    naam: 'Aluminium hef-schuifpui — Drutex MB-77HS',
    kort: 'MB-77HS',
    materiaal: 'Aluminium',
    sub: 'Slanke profielen, maximale overspanning — voor de grootste openingen',
    metaTitle: 'Aluminium schuifpui op maat – Drutex MB-77HS | bestelkozijnenopmaat.nl',
    metaDescr: 'Drutex MB-77HS aluminium hef-schuifpui: Uw vanaf 0,75, inbouwdiepte 174 of 271 mm, ruim 200 RAL-kleuren. Ideaal bij het vergroten van de gevelopening.',
    intro: 'De MB-77HS is de aluminium hef-schuifpui uit het Drutex-programma, gebouwd op het gerenommeerde Aluprof-profiel. Aluminium is vormvast en sterk, waardoor de profielen slank blijven — ook bij zeer grote afmetingen. Juist wanneer u de gevelopening laat vergroten en het maximale uit de nieuwe overspanning wilt halen, is dit systeem de logische keuze.',
    specs: [
      ['Profiel', 'Aluminium met thermische onderbreking, 3 kamers'],
      ['Inbouwdiepte', '174 mm (2-sporig) of 271 mm (3-sporig, voor 3-delige puien)'],
      ['Isolatie', 'Uw vanaf 0,75 W/m\u00b2K (HI-uitvoering met triple glas Ug 0,5, argonvulling)'],
      ['Uitvoeringen', '2-sporig, 3-sporig of monorail (vast deel met extra smal aanzicht)'],
      ['Beslag', 'GU hef-schuifbeslag met drie vergrendelbare grendels en micro-ventilatiestand'],
      ['Vleugelgewicht', 'Standaard loopwerk tot 300 kg; zwaardere uitvoeringen mogelijk'],
      ['Drempel', 'Vlakke drempel van 48 mm hoog'],
      ['Afdichting', 'Dubbele EPDM-afdichting (binnen en buiten)'],
      ['Kleuren', 'Ruim 200 RAL-kleuren: mat, metallic, structuur en houtlook']
    ],
    voordelen: [
      ['De grootste maten', 'Aluminium overspant moeiteloos brede openingen met opvallend slanke stijlen — maximaal glas.'],
      ['Vormvast', 'Geen werking of doorbuiging van betekenis; de pui blijft zijn leven lang strak lopen.'],
      ['Elke kleur', 'Meer dan 200 RAL-kleuren, van mat antraciet tot metallic en houtlook.'],
      ['Perfect bij uitbreken', 'Laat u de opening vergroten met een stalen latei? Dan benut de MB-77HS die nieuwe breedte optimaal.']
    ],
    indelingen: [
      ['2-sporig', 'Klassieke opbouw: schuifvleugel(s) en vaste delen op twee rails.'],
      ['3-sporig', 'Drie rails (inbouwdiepte 271 mm): twee delen schuiven tegelijk open voor een extra royale doorgang.'],
      ['Monorail', 'Vast deel als kaderloos smal aanzicht — nog meer glas, nog minder profiel.']
    ],
    svg: 'alu'
  }
};

// ---------------------------------------------------------------------
// Pagina's
// ---------------------------------------------------------------------
router.get('/', (req, res) => {
  render(res, 'schuifpuien', {
    title: 'Schuifpuien op maat – Drutex hef- en kiep-schuifpuien',
    modellen: MODELLEN
  });
});

router.get('/muur-uitbreken', (req, res) => {
  render(res, 'schuifpui-constructie', {
    title: 'Muur uitbreken voor een schuifpui – constructieberekening'
  });
});

router.get('/werkwijze', (req, res) => {
  render(res, 'schuifpui-werkwijze', {
    title: 'Werkwijze schuifpui – van gemeentetekening tot montage'
  });
});

router.get('/:slug', (req, res, next) => {
  const m = MODELLEN[req.params.slug];
  if (!m) return next(); // valt door naar de 404 van de site
  render(res, 'schuifpui-model', { title: m.metaTitle.split(' | ')[0], m });
});

// ---------------------------------------------------------------------
// POST /offerte — schuifpui-aanvraag → Beheer > Aanvragen
// Zelfde beveiliging als de AI-scan: honeypot, tijdscheck, rate limit.
// ---------------------------------------------------------------------
const RATE_MAX = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || [];
  const recent = entry.filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) { rateMap.set(ip, recent); return true; }
  recent.push(now);
  rateMap.set(ip, recent);
  if (rateMap.size > 5000) {
    for (const [k, v] of rateMap) {
      if (!v.some(t => now - t < RATE_WINDOW_MS)) rateMap.delete(k);
    }
  }
  return false;
}

router.post('/offerte', express.json({ limit: '200kb' }), async (req, res) => {
  try {
    const { naam = '', email = '', telefoon = '', adres = '', plaats = '',
            systeem = '', breedte = '', hoogte = '', openingGroter = '',
            tekeningHulp = '', opmerking = '', website = '', elapsed = null } = req.body;

    // Anti-misbruik: bots stil "accepteren" zonder op te slaan of te mailen
    const nepNummer = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' +
                      String(Math.floor(Math.random() * 9000) + 1000);
    if (website) return res.json({ ok: true, nummer: nepNummer });
    if (typeof elapsed === 'number' && elapsed < 5000) return res.json({ ok: true, nummer: nepNummer });
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'onbekend';
    if (rateLimited(ip)) {
      return res.status(429).json({ error: 'U heeft het maximum aantal aanvragen bereikt. Probeer het later opnieuw of neem contact met ons op.' });
    }

    if (!naam.trim() || !email.trim()) {
      return res.status(400).json({ error: 'Vul in ieder geval uw naam en e-mailadres in.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Het e-mailadres lijkt niet geldig.' });
    }

    const sysNamen = {
      'hef-schuifpui': 'Hef-schuifpui (Drutex IGLO-HS, kunststof)',
      'kiep-schuifpui': 'Kiep-schuifpui (Drutex PSK, kunststof)',
      'aluminium-schuifpui': 'Aluminium hef-schuifpui (Drutex MB-77HS)',
      'advies': 'Nog geen voorkeur — advies gewenst'
    };
    const sysLabel = sysNamen[systeem] || sysNamen['advies'];
    const b = parseInt(breedte, 10) || 0;
    const h = parseInt(hoogte, 10) || 0;

    const element = {
      label: 'Schuifpui \u00b7 ' + sysLabel,
      indeling: 'schuifpui',
      afmetingen: (b && h) ? b + ' \u00d7 ' + h + ' mm (indicatief, inmeting volgt)' : 'n.t.b. (inmeting volgt)',
      kleur: 'n.t.b.', glas: 'n.t.b.', montage: 'ja', aantal: 1,
      bron: 'schuifpuien-pagina'
    };

    // Bestaand account? Dan koppelen zodat de aanvraag in "Mijn portaal" staat.
    let userId = 'gast-schuifpui';
    try {
      const bestaand = await db.findUserByEmail(email);
      if (bestaand) userId = bestaand.id;
    } catch (e) { /* gast-aanvraag */ }

    const grLabels = { ja: 'JA — opening wordt vergroot (muur uitbreken): constructiecheck + berekening inplannen', nee: 'Nee — pui komt in de bestaande opening', weetniet: 'Weet klant nog niet — meenemen in het adviesgesprek' };
    const opm = ['[Via schuifpuien-pagina]'];
    opm.push('STAP 1 — gemeentetekening achtergevel opvragen' +
      (tekeningHulp === 'ja' ? ': klant wil dat WIJ dit verzorgen/begeleiden.'
        : tekeningHulp === 'heb-ik' ? ': klant heeft de bouwtekening al in bezit.'
        : ': klant vraagt de tekening zelf op (wij sturen instructies mee).'));
    if (grLabels[openingGroter]) opm.push('Gevelopening: ' + grLabels[openingGroter]);
    if (adres.trim() || plaats.trim()) opm.push('Adres: ' + [adres.trim(), plaats.trim()].filter(Boolean).join(', ').slice(0, 300));
    if (opmerking.trim()) opm.push('Klant: ' + opmerking.trim().slice(0, 2000));

    const request = await db.createRequest({
      userId,
      elementen: [element],
      klant: {
        naam: naam.trim().slice(0, 120),
        email: email.trim().slice(0, 200),
        telefoon: telefoon.trim().slice(0, 40),
        opmerking: opm.join('\n')
      }
    });

    if (mailer) {
      const samenvatting =
        'SCHUIFPUI-AANVRAAG — maten zijn indicatief, definitieve maten na inmeting.\n\n' +
        'Systeem:  ' + sysLabel + '\n' +
        'Afmeting: ' + element.afmetingen + '\n' +
        opm.join('\n');
      mailer.notifyNewRequest({ ref: request.ref, klant: request.klant, samenvatting }).catch(() => {});
      mailer.confirmRequest({ to: email.trim(), ref: request.ref, naam: naam.trim() }).catch(() => {});
      // Bewust GEEN fabrieksmail: bij schuifpuien liggen de maten pas vast
      // n\u00e1 de constructiecheck/inmeting. Wil je hem toch, haal dan het
      // commentaar hieronder weg:
      // mailer.notifyFabriek({ ref: request.ref, samenvatting }).catch(() => {});
    }

    res.json({ ok: true, nummer: request.ref });
  } catch (err) {
    console.error('[schuifpuien/offerte]', err.message);
    res.status(500).json({ error: 'Opslaan is niet gelukt. Probeer het opnieuw.' });
  }
});

return router;
};
