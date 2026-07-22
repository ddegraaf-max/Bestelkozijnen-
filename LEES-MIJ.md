# Schuifpuien-sectie — complete update (alles-in-één)

Deze ZIP heeft PRECIES dezelfde mappenstructuur als je project.

## Installeren (2 minuten)

1. VERWIJDER eerst dit bestand uit je project (voorkomt een oude versie):
   - server.js

2. Pak deze ZIP uit en sleep de inhoud in je projectmap:
   - server.js                        → projectroot (vervangt je server.js)
   - routes/schuifpuien.js            → in je routes-map (nieuw)
   - views/  (7 bestanden)            → in je views-map (allemaal nieuw):
     schuifpuien.ejs, schuifpui-model.ejs, schuifpui-constructie.ejs,
     schuifpui-werkwijze.ejs, schuifpui-kop.ejs, schuifpui-voet.ejs,
     schuifpui-svg.ejs

3. GitHub Desktop: commit → push. Railway deployt vanzelf.

4. Open daarna met een harde refresh (Ctrl+F5):
   https://bestelkozijnenopmaat.nl/schuifpuien

## Env vars

Geen nieuwe nodig — alles draait op je bestaande instellingen
(DATABASE_URL, RESEND_API_KEY, enz.).

## Wat zit erin

NIEUWE PAGINA'S (allemaal met de echte header/footer van je site,
zelfde detectietruc als de AI-scanpagina, alle styling sp-genaamruimt):

- /schuifpuien                       Hub: de drie Drutex-systemen, teaser
                                     "muur uitbreken", compacte werkwijze,
                                     OFFERTEFORMULIER en FAQ (met FAQPage
                                     JSON-LD voor Google).
- /schuifpuien/hef-schuifpui         Drutex IGLO-HS (kunststof HST):
                                     7-kamer, vleugels tot 400 kg,
                                     veloursafdichting, GU-beslag.
- /schuifpuien/kiep-schuifpui        Drutex PSK: kiepen om te ventileren,
                                     MACO-paddenstoelnokken in de stalen
                                     wapening.
- /schuifpuien/aluminium-schuifpui   Drutex MB-77HS: Uw vanaf 0,75,
                                     174/271 mm, monorail, 200+ RAL.
- /schuifpuien/muur-uitbreken        HET verhaal: dragende gevel, stalen
                                     latei/portaal, constructieberekening
                                     door erkend constructeur, vergunning-
                                     check — met technische SVG-doorsnede.
- /schuifpuien/werkwijze             6 stappen. STAP 1 = altijd eerst de
                                     bouwtekening van de ACHTERGEVEL
                                     opvragen bij de gemeente.

OFFERTEFORMULIER (op /schuifpuien#offerte):
- Vraagt o.a.: systeem, indicatieve maat, "wordt de opening groter?"
  en wie de gemeentetekening regelt (wij / klant zelf / al in bezit).
- Aanvragen komen RECHTSTREEKS in Beheer > Aanvragen via db.createRequest
  (zelfde nummering JJJJMMDD-XXXX, status "ontvangen"), met jouw
  notificatiemail en een klantbevestiging. Heeft de klant al een account,
  dan verschijnt de aanvraag ook in diens Mijn portaal.
- Zelfde anti-spam als de AI-scan: honeypot, tijdscheck en max 3
  aanvragen per IP per uur.
- LET OP: er gaat bij schuifpui-aanvragen bewust GEEN fabrieksmail naar
  Drutex (maten liggen pas vast na constructiecheck/inmeting). Wil je
  die toch? Haal in routes/schuifpuien.js het commentaar weg bij de
  regel met mailer.notifyFabriek.

AUTOMATISCH OP DE HELE SITE (via server.js):
- "Schuifpuien" verschijnt in het menu van elke pagina (kloon van je
  Contact-item, dus de stijl klopt vanzelf; komt naast "AI Scan").
- Homepage krijgt onderaan een donkere teaser-sectie voor de
  schuifpuien (spt-genaamruimt) — home.ejs hoeft niet aangepast.
- Alle 6 pagina's staan in /sitemap.xml en krijgen elk een eigen
  meta description + canonical + Open Graph via de centrale SEO.

## SEO-tip

Dien de sitemap opnieuw in via Google Search Console zodat de nieuwe
pagina's snel worden opgepikt. De pagina /schuifpuien/muur-uitbreken is
de linkwaardige "gids"-pagina — deel die gerust op social media.
