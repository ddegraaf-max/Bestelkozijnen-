# AI Kozijnenscan — complete update (alles-in-één)

Deze ZIP heeft PRECIES dezelfde mappenstructuur als je project.

## Installeren (2 minuten)

1. VERWIJDER eerst deze bestanden uit je project (voorkomt dubbele/oude versies):
   - views/kozijnscan-klant.ejs
   - views/kozijnscan.ejs
   - routes/kozijnscan.js
   - routes/kozijnscan-public.js
   - services/fabriek-mail.js
   - server.js

2. Pak deze ZIP uit en sleep de inhoud in je projectmap:
   - server.js            → projectroot (vervangt je server.js)
   - routes/  (2 files)   → in je routes-map
   - views/   (2 files)   → in je views-map
   - services/ (1 file)   → services-map (aanmaken als die niet bestaat)

3. GitHub Desktop: commit → push. Railway deployt vanzelf.

4. Open daarna met een harde refresh (Ctrl+F5):
   https://bestelkozijnenopmaat.nl/ai-kozijnenscan

## Railway env vars (check)

Al aanwezig:  ANTHROPIC_API_KEY, DATABASE_URL, RESEND_API_KEY
Toevoegen:    NOTIFY_EMAIL  = jouw adres (notificatie bij nieuwe aanvraag)
Optioneel:    NOTIFY_FROM, KLANT_BEVESTIGING=true,
              FABRIEK_EMAIL (staat standaard op mpanek@drutex.com.pl),
              FABRIEK_REPLY (staat standaard op montage@creditline.nl)

## Nieuw in deze versie

- SEO-PAKKET (lost ~50 audit-taken in één keer op): canonical-tag, Open
  Graph (title/description/image) en JSON-LD LocalBusiness worden nu
  automatisch op ELKE publieke pagina geplaatst; beheer/portaal/inloggen
  krijgen noindex. Nieuw: /sitemap.xml en /robots.txt (dien de sitemap in
  via Google Search Console). Nieuw bestand: public/img/og-image.png
  (1200x630, huisstijl) — ZET DEZE IN JE public/img MAP. Scanpagina heeft
  weer een echte H1 en een title van 61 tekens.
  Handmatig blijft over: teksten uitbreiden op /montage, /contact en
  /inloggen naar 300+ woorden (copywriting in de views).

- OFFERTEMAIL MET ALLE DOCUMENTEN: bij "Opslaan & versturen" gaan nu de
  offerte-PDF én alle extra documenten van de aanvraag als bijlagen mee
  (mailer.js + routes/admin.js aangepast — VERVANG OOK mailer.js). De
  mailtekst vermeldt automatisch het aantal bijlagen; onleesbare bestanden
  worden overgeslagen en het totaal is begrensd op ±25 MB zodat de mail
  altijd aankomt.

- DOCUMENTENSYSTEEM in het beheer: op elke aanvraag-detailpagina staat nu
  een paneel "Documenten (N)" met de offerte-PDF (naam, datum, grootte,
  downloadlink) én onbeperkt extra documenten (PDF/JPG/PNG) met per stuk
  download- en verwijderknoppen plus een uploadformulier (max 10 tegelijk,
  15 MB per stuk). Hiervoor zijn db.js (nieuwe request_documents-tabel,
  automatisch aangemaakt) en routes/admin.js (upload/download/verwijder-
  routes) uitgebreid — VERVANG DUS OOK db.js EN routes/admin.js.
  De offertemail blijft ongewijzigd: die verstuurt de offerte-PDF.

- AI-scan aanvragen komen nu RECHTSTREEKS in je bestaande Aanvragen-lijst
  (Beheer > Aanvragen), via db.createRequest — zelfde nummering
  (JJJJMMDD-XXXX), status "ontvangen", jouw notificatiemail,
  fabrieksmail (met schattings-disclaimer) en klantbevestiging via je
  bestaande mailer. NOTIFY_EMAIL/KLANT_BEVESTIGING zijn niet meer nodig.
  Heeft de klant al een account (zelfde e-mailadres), dan verschijnt de
  aanvraag ook in diens Mijn portaal. De scan zelf wordt daarnaast
  bewaard voor de kalibratie, herkenbaar aan "Aanvraag <nummer>" in de
  beheertool (/beheer/kozijnscan).

- De scanpagina gebruikt nu de ECHTE header en footer van de site: de
  route detecteert automatisch welke partials home.ejs gebruikt en laadt
  exact diezelfde. Jouw logo, menu, stijl en footer — 1-op-1, want het
  zijn letterlijk jouw eigen bestanden. Alle scan-styling is bovendien
  kz-genaamruimt zodat hij nooit botst met de site-CSS.

- "AI Scan" verschijnt nu AUTOMATISCH in het menu van elke pagina
  (home, configurator, alles). De server kloont je bestaande
  Contact-menu-item inclusief CSS-classes, dus de stijl klopt vanzelf.
  Geen header-bestand aanpassen nodig.

## Wat zit erin

- /ai-kozijnenscan          Publieke klantpagina in de huisstijl van de site
                            (echte header + logo, Materialen-dropdown,
                            inlogbewust, Drutex & Aluplast USP)
- /beheer/kozijnscan        Beheertool (alleen rol 'beheer'): inmetingen
                            invullen, kalibratie, CSV-export
- services/fabriek-mail.js  Tweetalige PL/NL offertemail naar Drutex
                            (mpanek@drutex.com.pl), namens Creditline B.V.,
                            offerte gevraagd aan montage@creditline.nl
