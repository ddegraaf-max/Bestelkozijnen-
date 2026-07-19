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

## Wat zit erin

- /ai-kozijnenscan          Publieke klantpagina in de huisstijl van de site
                            (echte header + logo, Materialen-dropdown,
                            inlogbewust, Drutex & Aluplast USP)
- /beheer/kozijnscan        Beheertool (alleen rol 'beheer'): inmetingen
                            invullen, kalibratie, CSV-export
- services/fabriek-mail.js  Tweetalige PL/NL offertemail naar Drutex
                            (mpanek@drutex.com.pl), namens Creditline B.V.,
                            offerte gevraagd aan montage@creditline.nl
