// Gedeelde bedrijfs- en productdata (gebruikt door server.js en build-demo.js)
const company = {
  name: 'bestelkozijnenopmaat.nl',
  legalName: 'Creditline Montage',
  address: 'Torenlaan 5A, 1402 AT Bussum',
  kvk: '59683198',
  btw: 'NL853603108B01',
  phone: '06 46 15 01 60',
  email: 'montage@creditline.nl'
};

const materials = {
  kunststof: {
    slug: 'kunststof', title: 'Kunststof kozijnen', systeem: 'Drutex IGLO & Aluplast IDEAL NEO',
    lead: 'Onderhoudsarm, uitstekend geïsoleerd en zeer kleurvast.',
    intro: 'Onze kunststof kozijnen komen uit de Drutex IGLO- en Aluplast IDEAL-lijnen: meerkamerprofielen (5 tot 7 kamers) met een drievoudige EPDM-afdichting, leverbaar van een scherpe standaard tot zeer energiezuinige uitvoeringen met een Uw vanaf 0,66 W/m²K. Klasse A-profielen uit puur primair materiaal, in ruim 30 kleuren en houtlooks, desgewenst inbraakwerend (RC2 / RC2 N).',
    voordelen: ['Onderhoudsarm – nooit meer schilderen','5 tot 7 kamers met drievoudige EPDM-afdichting','Energiezuinig: Uw vanaf 0,66 W/m²K (triple glas Ug 0,5)','Ruim 30 kleuren en houtlooks, ook gekleurde afdichting','Inbraakwerend RC2 / RC2 N mogelijk','Korte levertijden – productie volledig op maat'],
    deuren: [
      { naam:'IGLO ENERGY', detail:'Energiezuinige PVC-deur op het ENERGY-profiel — te combineren met een deurpaneel naar keuze' },
      { naam:'IGLO 5', detail:'Voordelige PVC-deur op het IGLO 5-profiel' },
      { naam:'IGLO EDGE', detail:'Premium PVC-deur met strak, kantig design' }
    ],
    deurenNote:'Stel je PVC-(voor)deur samen in de configurator: kies profiel, paneelmodel, kleur, glas en beslag. Je kunt ook alleen een los deurpaneel bestellen voor je bestaande deur.',
    // Draai-/kiepramen en -deuren (okna)
    systemen: [
      { naam:'IGLO EDGE', kamers:'7', diepte:'82 mm', uw:'0,66', db:'36–42', glas:'Triple (Ug 0,5)', note:'Premium, strak-kantig design met 3× EPDM-afdichting. Onze beste isolatie, ook als RC2.' },
      { naam:'IGLO ENERGY', kamers:'7', diepte:'82 mm', uw:'0,71', db:'36–46', glas:'Triple (Ug 0,5)', note:'Centrale afdichting van geschuimd EPDM voor topcomfort en geluidsdemping.' },
      { naam:'IGLO ENERGY CLASSIC', kamers:'7', diepte:'82 mm', uw:'0,73', db:'36–46', glas:'Triple (Ug 0,5)', note:'Niet-gelijkliggende uitvoering van Energy; kern ook in bruin of antraciet.' },
      { naam:'IGLO ENERGY ALUCOVER', kamers:'7', diepte:'93 mm', uw:'0,76', db:'—', glas:'Triple (Ug 0,5)', note:'Met aluminium buitenschaal in RAL-mat — strak design en extra weerbestendig.' },
      { naam:'IGLO 5', kamers:'5', diepte:'70 mm', uw:'0,83', db:'36–44', glas:'Dubbel (Ug 1,1) — triple optioneel', note:'Scherpe standaard, breed inzetbaar in warm én koud klimaat, ook RC2.' },
      { naam:'IGLO 5 CLASSIC', kamers:'5', diepte:'70 mm', uw:'0,83', db:'36–44', glas:'Dubbel (Ug 1,1)', note:'Niet-gelijkliggende variant van IGLO 5.' },
      { naam:'IGLO LIGHT', kamers:'5', diepte:'70 mm', uw:'0,88', db:'36–44', glas:'Dubbel (Ug 1,1)', note:'32% smallere beweegbare stijl en lager vleugelprofiel: maximale lichtinval.' },
      { naam:'IGLO PREMIER', kamers:'5', diepte:'70 mm', uw:'0,89', db:'—', glas:'Dubbel (Ug 1,1)', note:'Naar buiten draaiend en kiepend — ideaal waar binnen weinig ruimte is.' },
      { naam:'IGLO EXT', kamers:'5', diepte:'70 mm', uw:'0,89', db:'—', glas:'Dubbel (Ug 1,1)', note:'Naar buiten draaiende ramen en balkondeuren, vleugel tot 150 kg.' },
      { naam:'IDEAL NEO MD (Aluplast)', kamers:'6', diepte:'76 mm', uw:'0,76', db:'36', glas:'Triple (Ug 0,5)', note:'Slank & symmetrisch, veel lichtinval — voor nieuwbouw én renovatie.' }
    ],
    // Schuif- en hefsystemen (systemy tarasowe)
    schuif: [
      { groep:'Hefschuifpui (HS)', items:[
        { naam:'IGLO-HS', detail:'Uw vanaf 0,71 · vleugel tot 400 kg · lage PVC-drempel (60 mm), vlak inbouwbaar' },
        { naam:'IGLO-HS ALUCOVER', detail:'Als HS met aluminium buitenschaal (206 mm) · Uw vanaf 0,73 · RAL-mat gelakt' }
      ]},
      { groep:'Schuifsystemen', items:[
        { naam:'IGLO EDGE SLIDE', detail:'Nieuw, kantig design · Uw vanaf 0,65 · triple glas (Ug 0,5)' },
        { naam:'IGLO SLIDE', detail:'Voordelig schuifsysteem met dubbele beglazing · Siegenia-beslag' }
      ]},
      { groep:'Kiep-schuifdeuren (PSK)', items:[
        { naam:'IGLO ENERGY PSK', detail:'82 mm · Uw vanaf 0,66 · MACO SKB-S (vleugel tot 160 kg) · optioneel quadruple glas (Ug 0,3)' },
        { naam:'IGLO ENERGY CLASSIC PSK', detail:'Niet-gelijkliggende uitvoering van Energy PSK' },
        { naam:'IGLO 5 PSK', detail:'70 mm · Uw vanaf 0,81 · dubbel glas (Ug 1,1), triple optioneel' },
        { naam:'IGLO 5 CLASSIC PSK', detail:'Niet-gelijkliggende uitvoering van IGLO 5 PSK' },
        { naam:'IGLO LIGHT PSK', detail:'70 mm · Uw vanaf 0,84 · visueel lichte, slanke vorm' }
      ]}
    ],
    secties: [
      { titel:'Beglazing', tekst:'Alle ruiten zijn standaard argongevuld, van dubbel glas (Ug 1,1) tot triple HR+++ (Ug 0,5) en zelfs quadruple (Ug 0,3) bij Energy PSK. Optioneel: geluidwerend, gelaagd (veilig en inbraakwerend), zonwerend Antisol (blauw, brons, grijs of groen), spiegelglas (Mirastar/Reflectofloat) en sierglas zoals Float, ornament (Cathedral, Master Carre, Delta, Chinchilla, Silvit, Deszczyk), mat/satijn of gezandstraald in drie grijstinten of een eigen patroon. Warme randafstandhouder Swisspacer Ultimate als optie.' },
      { titel:'Kleuren', tekst:'Ruim 30 decorfolies: effen kleuren zoals antraciet (RAL 7016), zwart (RAL 9005) en crème, plus houtlooks als gouden eiken, donker eiken, mahonie, noten, macore en winchester. Afdichting in zwart of grijs; profielkern in wit, bruin of antraciet (afhankelijk van het systeem). Scharnierkapjes en krukken in standaard- of accentkleuren tot goud, titanium en champagne.' },
      { titel:'Roedes (sprossen)', tekst:'Opgeplakte PVC-roedes van 27, 45 of 65 mm in alle foliekleuren, of aluminium roedes ín het glas van 8, 18, 26 of 45 mm (o.a. wit, goud, zilver, gouden/donker eiken, mahonie en noten). Toepasbaar op alle raam- en schuifsystemen.' },
      { titel:'Beslag & veiligheid', tekst:'Hoogwaardig MACO MULTI-MATIC KS-beslag met antiverwijderpennen (G-U of Siegenia bij schuifsystemen). Verdekte MACO Multi-Power-scharnieren (onzichtbaar bij gesloten raam), COMFORT- en TBT-beslag en aluminium krukken met sleutel of drukknop (kinderveilig). Inbraakwerendheid RC2 / RC2 N mogelijk op o.a. IGLO 5 en IGLO ENERGY.' },
      { titel:'Dorpels', tekst:'Standaard het kozijnkader als dorpel. Opties: Combi 20 mm, vlakke Combi Plan 0,0 mm (eventueel met lijnafwatering), aluminium drempel 20 mm of een houten drempel — beschikbaarheid afhankelijk van het gekozen systeem.' },
      { titel:'Ventilatie', tekst:'Suskast-/trickle-roosters voor frisse lucht bij gesloten ramen: Aereco (AMO, EXR, EMM), Ventair Simpress, Renson THM 90, Maco Vent, Radaks of Regel-air.' },
      { titel:'Renovatie & Smart Home', tekst:'Renovatie- en adaptatiekaders (35–65 mm) om te plaatsen zonder het oude kozijn te slopen — ideaal voor monumentale panden. Elektrische aansturing via Somfy TaHoma, BleBox of G-U/Siegenia (voor hefschuifpuien): bediening met app of afstandsbediening, ook in groepen of op tijd.' }
    ]
  },
  hout: { slug: 'hout', title: 'Houten kozijnen', systeem: 'Drutex SOFTLINE (hout) & DUOLINE (hout-aluminium)',
    lead: 'Tijdloze, authentieke uitstraling — in massief hout of hout-aluminium.',
    intro: 'Onze houten kozijnen komen uit de Drutex SOFTLINE- en DUOLINE-lijnen. SOFTLINE is massief, gelamineerd hout (grenen of meranti) met een stroomlijnvorm, vrij in elke vorm te maken — ook geschikt voor monumenten onder toezicht van Monumentenzorg. DUOLINE combineert datzelfde warme hout aan de binnenzijde met een onderhoudsarme aluminium schaal aan de buitenzijde: het beste van beide werelden. Beide lijnen worden af fabriek in vier beschermlagen gelakt, leverbaar in dekkende kleuren én transparante houtlazuren, met een Uw vanaf 0,76 W/m²K.',
    voordelen: ['Natuurlijke, warme uitstraling van echt hout','Grenen of meranti, in vrijwel elke vorm te maken','Geschikt voor monumenten en karakteristieke panden','Hout-aluminium (DUOLINE): onderhoudsarme buitenschaal','Energiezuinig: Uw vanaf 0,76 W/m²K (triple glas)','Dekkende kleuren én transparante houtlazuren'],
    schuif: [
      { groep:'Hefschuifpui (HS)', items:[
        { naam:'SOFTLINE HS', detail:'Houten hefschuifpui · Uw 0,79–1,06 · inbouwdiepte 164/184/204 mm · grenen of meranti' },
        { naam:'DUOLINE HS', detail:'Hout-aluminium hefschuifpui · Uw 0,75–1,00 · inbouwdiepte 194/214/234 mm · onderhoudsarme buitenzijde' }
      ]},
      { groep:'Vouwwanden', items:[
        { naam:'SOFTLINE 68 vouwwand', detail:'Houten harmonica · inbouwdiepte 68 mm · Uw 1,09 (grenen) / 1,04 (meranti)' }
      ]},
      { groep:'Kiep-schuifdeuren (PSK)', items:[
        { naam:'SOFTLINE PSK', detail:'Houten kiep-schuifdeur · Uw 0,73–1,06 · inbouwdiepte 68/78/88 mm' },
        { naam:'DUOLINE PSK', detail:'Hout-aluminium kiep-schuifdeur · Uw 0,71–0,93 · 82 mm (DL68) / 92 mm (DL78)' }
      ]}
    ],
    deuren: [
      { naam:'SOFTLINE 68 / 78 / 88', detail:'Houten voordeuren in dezelfde profieldieptes als de SOFTLINE-ramen' }
    ],
    systemenTitel: 'Profielen (hout & hout-aluminium)',
    kolom2: 'Uitvoering',
    systemen: [
      { naam:'SOFTLINE 68', kamers:'Massief hout', diepte:'68 mm', uw:'1,27', db:'—', glas:'24–32 mm', note:'Massief hout (grenen of 3-laags meranti), stroomlijnvorm. Klassieke standaard, ook voor monumenten met extra profilering.' },
      { naam:'SOFTLINE 78', kamers:'Massief hout', diepte:'78 mm', uw:'0,90', db:'—', glas:'24–44 mm', note:'Tussenstap met hogere isolatie en klassieke proporties — modern én voor historische panden. Meranti 4-laags.' },
      { naam:'SOFTLINE 88', kamers:'Massief hout', diepte:'88 mm', uw:'0,76', db:'—', glas:'32–54 mm', note:'Onze meest geïsoleerde massief-houten lijn, voor maximale thermische prestaties met behoud van het houten karakter.' },
      { naam:'DUOLINE 68', kamers:'Hout-aluminium', diepte:'82 mm', uw:'0,90', db:'—', glas:'24–44 mm', note:'Hout binnen (68 mm) + aluminium buitenschaal (14 mm). 4 dichtingen, RAL-kleur aan de buitenzijde.' },
      { naam:'DUOLINE 78', kamers:'Hout-aluminium', diepte:'92 mm', uw:'0,80', db:'—', glas:'24–50 mm', note:'Hoger comfort en betere akoestiek. Hout binnen (78 mm) + aluminium schaal, 4 dichtingen.' },
      { naam:'DUOLINE 88', kamers:'Hout-aluminium', diepte:'102 mm', uw:'0,79', db:'—', glas:'32–58 mm', note:'Premium: maximale isolatie en stabiliteit, grote glaspartijen. Aluminium schaal beschermt het hout volledig tegen weer en UV.' }
    ],
    secties: [
      { titel:'Hout & afwerking', tekst:'Standaard in grenen (sosna) of meranti, meerlaags verlijmd voor stabiliteit (3-laags bij 68 mm, 4-laags bij 78/88 mm). Af fabriek afgewerkt in vier beschermlagen lak. Standaard met een aluminium onderprofiel dat de onderzijde van de vleugel beschermt en een dubbelzijdige uitsparing voor de vensterbank. DUOLINE heeft daarnaast een aluminium buitenschaal die het hout volledig tegen weer en UV beschermt — vrijwel onderhoudsvrij.' },
      { titel:'Beglazing', tekst:'Isolatieglas van dubbel tot triple HR+++ (Ug 0,5), met een verzinkte stalen of warme kunststof randafstandhouder (Swisspacer Ultimate) zonder meerprijs. Optioneel: geluidwerend, gelaagd (veilig en inbraakwerend), zonwerend Antisol (blauw, brons, grijs of groen), Stopsol, spiegelend Mirastar en sierglas zoals Float, ornament (Cathedral, Master Carre, Delta, Chinchilla, Silvit), Waterfall, mat of gezandstraald. Drukvereffenende capillairen mogelijk voor locaties aan zee of hoog in de bergen.' },
      { titel:'Kleuren', tekst:'Dekkende lakken voor een egale kleur (o.a. wit, plus populaire RAL-tinten 9005, 7016, 7039, 7035, 7012 en 6005) of transparante lazuren die de houtstructuur laten zien: licht eiken, donker eiken, noten, walnoot, teak, mahonie, palissander, ginger, graphite, raw mountain en olijfgroen. Daarnaast vrijwel elke RAL-kleur op aanvraag. Bij DUOLINE kan de aluminium buitenschaal een afwijkende RAL-kleur krijgen.' },
      { titel:'Beslag & krukken', tekst:'MACO MULTI-MATIC omloopbeslag met twee anti-inbraakpennen en microventilatie in de draaikiepvleugels. Twee omloopdichtingen in wit, bruin of zwart (DUOLINE bovendien vier EPDM-dichtingen in zwart). Aluminium krukken in diverse modellen — HOPPE, Nevada, Mistral, Kwadrat en Dublin — met sleutel of drukknop (kinderveilig). Scharnierkapjes in onder meer wit, zwart, lichtbruin, antraciet, crème, titanium, champagne, goud en zilver. Optioneel een vleugellift die een verkeerde krukstand blokkeert.' },
      { titel:'Smart Home', tekst:'Intelligente aansturing van ramen, rolluiken en zonwering via smartphone is mogelijk op de houten en hout-aluminium systemen.' }
    ] },
  aluminium: { slug: 'aluminium', title: 'Aluminium kozijnen', systeem: 'Drutex MB-systemen (aluminium)',
    lead: 'Strak, slank en extreem sterk – ideaal voor grote glaspartijen.',
    intro: 'Onze aluminium kozijnen komen uit de Drutex MB-lijn: slanke, zeer stabiele profielen waarmee grote ramen en puien mogelijk zijn. Je kiest van een licht, niet-geïsoleerd binnensysteem (MB-45) tot energiezuinige, thermisch onderbroken systemen met een Uw vanaf 0,76 W/m²K (MB-86N). Daarnaast leveren we een complete brandwerende lijn tot EI90. Aluminium is onderhoudsarm en kleurvast, poedercoat-gelakt in vrijwel elke RAL-kleur of houtlook.',
    voordelen: ['Zeer slanke profielen — meer glas, meer licht','Extreem sterk en stabiel, ook bij grote maten','Onderhoudsarm en kleurvast (poedercoat)','Energiezuinig: Uw vanaf 0,76 W/m²K met triple glas','Brandwerende uitvoeringen tot EI90','Smart Home: elektrische aansturing mogelijk'],
    // Raam-/deursystemen (okienno-drzwiowy)
    systemen: [
      { naam:'MB-79N', kamers:'3', diepte:'70 mm', uw:'0,79', db:'—', glas:'Dubbel of triple (tot 62 mm)', note:'Voordelig, thermisch onderbroken systeem in de varianten E, ST en SI (deuren ook SI+). Voldoet aan WT 2021. Lucht klasse 4, water E1950, wind C5.' },
      { naam:'MB-86N', kamers:'3', diepte:'77 mm', uw:'0,76', db:'—', glas:'Dubbel of triple (tot 69 mm)', note:'Premium: de beste thermische en akoestische prestaties, in de varianten ST en SI. Voldoet aan WT 2021. Lucht klasse 4, water E1500, wind C5.' },
      { naam:'MB-70HI', kamers:'3', diepte:'70 mm', uw:'0,96', db:'—', glas:'Dubbel (Ug 1,1) standaard', note:'Lichte, sterke aluminium ramen voor woning én vliesgevel. MACO MULTI-MATIC KS-beslag met centrale EPDM-dichting; standaard RAL-mat wit (9016) of antraciet (7016), 200+ RAL mogelijk.' },
      { naam:'MB-70', kamers:'3', diepte:'70 mm', uw:'—', db:'—', glas:'Dubbel (Ug 1,1) standaard', note:'Standaarduitvoering van het 70 mm-systeem; MB-70HI is de variant met verhoogde thermische isolatie (Uw vanaf 0,96).' },
      { naam:'MB-45', kamers:'1', diepte:'45 mm', uw:'—', db:'—', glas:'Enkel/dubbel (tot 24 mm)', note:'Zonder thermische onderbreking — licht en slank. Vooral voor binnen: scheidingswanden, vaste ramen en hand- of automatisch bediende schuifdeuren.' }
    ],
    // Brandwerende systemen (przeciwpożarowe)
    schuif: [
      { groep:'Hefschuifpui (HS)', items:[
        { naam:'MB-77HS HI', detail:'Uw vanaf 1,0 · 3 kamers · inbouwdiepte 174 mm (2-spoor) of 271 mm (3-spoor) · vleugel tot 400 kg · lage aluminium drempel (48 mm), in de vloer weg te werken' },
        { naam:'MB-77HS HI Monorail', detail:'Eén doorlopend spoor (174 mm) voor een minimale middenstijl · Uw vanaf 0,75 · met isolatie-inlagen' },
        { naam:'MB-59HS HI', detail:'Voordeligere geïsoleerde hefschuifpui (specificaties op aanvraag)' }
      ]},
      { groep:'Schuifsystemen', items:[
        { naam:'MB-SLIDE', detail:'Schuifsysteem voor lichtere puien' },
        { naam:'COR-VISION', detail:'Minimalistisch schuifsysteem met zeer slanke aanzichten' },
        { naam:'COR-VISION PLUS', detail:'Hefschuif-variant van COR-VISION met nog grotere vleugels' }
      ]},
      { groep:'Vouwwanden', items:[
        { naam:'MB-86 Vouwlijn HD', detail:'Geïsoleerde aluminium vouwwand (harmonica) · Uw vanaf 1,1 · 3 kamers · inbouwdiepte 86 mm · poliamide-glasvezel thermische onderbreking' }
      ]},
      { groep:'Kiep-schuifdeuren (PSK)', items:[
        { naam:'MB-70 / MB-70HI PSK', detail:'Aluminium kiep-schuifdeur (HI = verhoogde isolatie)' }
      ]}
    ],
    deuren: [
      { naam:'D-ART Line', detail:'Nieuwe aluminium designdeur-lijn met vlakke, strakke vlakken' },
      { naam:'MB-86N SI', detail:'Best geïsoleerde aluminium deur, op basis van het MB-86N-systeem' },
      { naam:'MB-79N SI+', detail:'Geïsoleerde aluminium deur met extra isolatie-inlagen (SI+)' },
      { naam:'MB-70HI', detail:'Geïsoleerde aluminium deur (70 mm)' },
      { naam:'MB-70', detail:'Standaard aluminium deur (70 mm)' },
      { naam:'MB-45', detail:'Niet-geïsoleerde aluminium (binnen)deur (45 mm)' },
      { naam:'MB-78 EI', detail:'Brandwerende aluminium deur (EI30/EI60/EI90) — zie ook Brandwerende systemen' },
      { naam:'PIVOT', detail:'Taatsdeur die om een centrale as draait — voor grote, representatieve entrees' }
    ],
    brandwerend: [
      { naam:'MB-60E EI — EI30 (binnen)', detail:'Voordelig systeem op basis van MB-60 · inbouwdiepte 60 mm · glas tot 41 mm · brandwerende scheidingswanden en deuren (1- en 2-vleugelig, met bovenlicht/doorzicht)' },
      { naam:'MB-78 EI — EI30 / EI60 / EI90 (binnen + buiten)', detail:'Thermisch geïsoleerde brandwerende deuren, puien en wanden · inbouwdiepte 78 mm · glas tot 72 mm · Uw vanaf 1,6 W/m²K · lucht klasse 2, water 5A' },
      { naam:'MB-86 EI — EI30 (buiten)', detail:'Op basis van MB-86N · inbouwdiepte 77 mm · glas tot 70 mm · Uw vanaf 0,86 W/m²K · combineert topisolatie met brandwerendheid, niet-brandvoortplantend (NRO)' }
    ],
    secties: [
      { titel:'Beglazing', tekst:'Drutex maakt de isolatieglaspakketten zelf (sinds 1994, eigen hardingsoven en laboratoria). Van dubbel glas tot triple HR+++ (Ug 0,5). Optioneel: geluidwerend, gelaagd (veilig en inbraakwerend), zonwerend Antisol (blauw, brons, grijs of groen), Stopsol, spiegelend Mirastar en sierglas zoals Float, ornament (Cathedral, Master Carre, Delta, Chinchilla, Silvit), Waterfall, mat of gezandstraald. De pakketten kunnen drukvereffenende capillairen krijgen, ideaal aan zee of hoog in de bergen. Warme randafstandhouder Swisspacer Ultimate zonder meerprijs.' },
      { titel:'Kleuren', tekst:'Poedercoat-lak in vrijwel elke RAL-kleur (RAL K7-waaier), in glanzend, mat of structuur, en in houtlooks. Binnen en buiten desgewenst in een andere kleur (tweekleurig). De warme rand Swisspacer is leverbaar in onder meer wit (RAL 9016), lichtgrijs (RAL 7035), grijs (RAL 9023), lichtbruin (RAL 8003), donkerbruin (RAL 8014) en zwart (RAL 9005).' },
      { titel:'Smart Home', tekst:'Intelligente aansturing van ramen, deuren, rolluiken, fasade-jaloezieën, horren, poorten en verlichting via smartphone — beschikbaar op de geïsoleerde MB-systemen.' }
    ] }
};

module.exports = { company, materials };
