# bestelkozijnenopmaat.nl

Webshop/configurator voor kozijnen op maat (Creditline Montage). Node.js + Express + EJS.
De klant stelt zijn kozijn samen, meet zelf in met de AI-assistent en verstuurt een aanvraag.
Jij maakt de offerte in je leveranciersportaal (Aluplast Ideal 4000) en uploadt de PDF in het
beheer; de klant ziet en downloadt die direct in zijn eigen portaal. **Geen vaste prijzen** — alles op maat.

## Lokaal draaien
```
npm install
cp .env.example .env   # vul de waarden in
npm start              # http://localhost:3000
```

## Deploy op Railway

> **Upload in één keer de hele map.** Gebruik GitHub → Add file → Upload files en sleep de
> **volledige uitgepakte map in één keer** in het uploadvak (incl. submappen). Niet bestand-voor-bestand:
> dan blijft een map als **`routes/`** achter en crasht de start met "Cannot find module './routes/auth'".
> Controleer dat **`routes/`**, **`views/`** en **`public/`** compleet in de repo staan.
> Verwijder ook een eventueel los bestand **`data`** (zonder extensie) uit de repo-root — alleen `data.js` moet blijven.
> De code start verder zonder dat je iets hoeft in te stellen; alle variabelen hieronder zijn optioneel.

1. Push deze map naar GitHub, koppel de repo aan Railway (start = `npm start`).
2. Zet de environment variables (zie `.env.example`):
   - `SESSION_SECRET` — lange willekeurige string (verplicht voor veilige login).
   - `ADMIN_EMAIL` + `ADMIN_PASSWORD` — hiermee wordt 1x een beheerder aangemaakt. Log daarmee in en ga naar **/beheer**.
   - `DATA_DIR=/data` — en **mount een Railway-volume op `/data`** zodat accounts, aanvragen en geüploade PDF's bewaard blijven na een redeploy.
   - `ANTHROPIC_API_KEY` (+ evt. `ANTHROPIC_MODEL`) — voor de inmeet-assistent. Zonder key valt de assistent terug op een vaste uitleg.
   - `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` — voor e-mailmeldingen (optioneel; zonder key wordt alleen gelogd).
3. Belangrijk: wijzigingen gaan pas live na de GitHub-push + Railway-redeploy. Ververs daarna hard (Ctrl/Cmd+Shift+R).

## Belangrijkste routes
- `/` home · `/configurator` · `/kozijnen/{kunststof|hout|aluminium}` · `/werkwijze` · `/montage` · `/veelgestelde-vragen` · `/contact`
- `/registreren` · `/inloggen` · `/portaal` (klant) · `/beheer` (beheerder)

## Datalaag
JSON-bestand onder `DATA_DIR` (`db.json` + `uploads/`). Bewust simpel en zonder externe database,
later 1-op-1 te vervangen door Postgres (zie `db.js`).

## Nog in te vullen (PLAATSHOUDER in de teksten)
Montagetarieven/werkgebied, levertijden, garantie, FAQ-antwoorden, algemene voorwaarden en privacybeleid.

## Klikbare demo (zonder server)
`node build-demo.js` genereert `demo.html`: één zelfstandig bestand met alle pagina's en de werkende configurator, te openen in elke browser. Navigatie werkt; versturen, AI-assistent en downloads zijn in de demo gesimuleerd.
