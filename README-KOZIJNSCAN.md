# KozijnScan — installatie

AI-fotoanalyse van kozijnen (herkenning + breedte/hoogte-schatting) met inmeet-feedback en zelflerende kalibratie. Gemaakt voor integratie in bestelkozijnenopmaat.nl (Node/Express/EJS, PostgreSQL, Railway).

## Bestanden

```
routes/kozijnscan.js    → Express-router (analyse, opslaan, scans, CSV-export)
views/kozijnscan.ejs    → De tool-pagina
```

## Installatie (3 stappen)

**1. Bestanden kopiëren**

Zet `routes/kozijnscan.js` in je `routes/` map en `views/kozijnscan.ejs` in je `views/` map.

**2. Router mounten in server.js**

```js
app.use('/kozijnscan', require('./routes/kozijnscan'));
```

Let op: mount deze regel VÓÓR een eventuele algemene `express.json()` met kleine limiet is geen probleem — de router heeft z'n eigen 30mb-limiet voor de foto-uploads.

**3. Environment variable op Railway**

Controleer dat deze twee bestaan (DATABASE_URL heb je al):

```
ANTHROPIC_API_KEY = sk-ant-...
DATABASE_URL      = (bestaande Railway PostgreSQL referentie)
```

Daarna: commit via GitHub Desktop → Railway deployt automatisch. De databasetabellen (`kozijn_scans`, `kozijn_scan_items`) worden bij het eerste gebruik automatisch aangemaakt — geen migratie nodig.

De tool draait dan op: `https://jouwdomein.nl/kozijnscan`

## Beveiliging

De pagina is nu open. Zit je admin-gedeelte achter een login-middleware? Mount dan zo:

```js
app.use('/kozijnscan', requireAdmin, require('./routes/kozijnscan'));
```

De Anthropic API-key staat alleen server-side — nooit in de browser.

## Hoe de kalibratie werkt (het "slimmer worden")

1. Elke scan sla je op in de database.
2. Na inmeting open je de scan ("Laad recente scans") en vul je de werkelijke maten in.
3. Vanaf **10 volledige inmetingen** berekent de server automatisch de gemiddelde afwijking (breedte en hoogte apart) en stuurt die als correctie mee in elke nieuwe analyse-prompt.
4. Bovenaan de pagina zie je "Kalibratie actief op basis van N inmetingen" zodra dit werkt.
5. Via `/kozijnscan/export.csv` download je de volledige dataset voor eigen analyse.

## API-endpoints

| Endpoint | Methode | Functie |
|---|---|---|
| `/kozijnscan` | GET | Tool-pagina |
| `/kozijnscan/analyse` | POST | Foto's analyseren (server-side Anthropic call) |
| `/kozijnscan/opslaan` | POST | Scan + items opslaan/updaten |
| `/kozijnscan/scans` | GET | Recente scans (JSON) |
| `/kozijnscan/scans/:id` | GET | Eén scan met items |
| `/kozijnscan/export.csv` | GET | Volledige dataset als CSV |

## Kosten-indicatie

Elke analyse is één Vision-call per foto naar claude-sonnet-4-6. Reken grofweg op enkele centen per foto, afhankelijk van resolutie. Grote foto's worden client-side als base64 verstuurd; wil je kosten drukken, verklein foto's vóór upload naar max ±1600px breed (kan ik als volgende stap inbouwen).

## Bekende beperkingen

- Schattingen zijn indicatief: goede frontale foto met referentie ±5-10%, schuine foto's of zonder referentie kan flink meer afwijken. De zekerheidsbadge (hoog/middel/laag) geeft dit aan.
- Gebruik het veld "bekende referentiemaat" waar mogelijk — dat geeft de grootste nauwkeurigheidswinst.
- Offertes altijd onder voorbehoud van inmeting.

---

# Fabriekmail — installatie

Stuurt aanvragen automatisch (of via een beheer-knop) als specificatiemail naar de fabriek, optioneel met de KozijnScan foto-analyse erbij.

## Bestanden

```
services/fabriek-mail.js                       → de mailservice (Resend)
routes/fabriek-mail-integratie.voorbeeld.js    → kopieerbare integratievoorbeelden
```

## Extra env vars (Railway)

```
FABRIEK_EMAIL = offerte@fabriek.pl            (meerdere: kommagescheiden)
FABRIEK_FROM  = Bestelkozijnenopmaat <offerte@bestelkozijnenopmaat.nl>
FABRIEK_CC    = jouw@adres.nl                 (optioneel, kopie naar jezelf)
FABRIEK_STUUR_KLANTGEGEVENS = true            (optioneel — standaard gaan
                                               klantgegevens NIET mee, AVG)
```

RESEND_API_KEY en DATABASE_URL heb je al.

## Drie manieren van gebruik

1. **Automatisch bij nieuwe aanvraag** — roep na het opslaan `stuurFabriekMail()` aan
   (voorbeeld A in het integratiebestand). Mailfouten blokkeren de aanvraag nooit.
2. **Handmatige knop in beheer** — route + knop-snippet staan als voorbeeld B.
3. **Met KozijnScan-data** — geef `scanId` mee; de geschatte maten verschijnen als
   aparte sectie in de mail met NL/PL-disclaimer "schatting, productiemaat na inmeting".
   Ingemeten maten worden automatisch als definitief gemarkeerd.

## Wat de fabriek ontvangt

Per kozijn een spectabel (profiel, indeling, vakken, afmetingen, kleur, afdichting —
het `specs`-object is vrij, dus elk veld uit jouw configurator kan mee), het
aanvraagnummer als referentie, en optioneel de configurator-afbeelding als bijlage
(`attachments`). Klantgegevens gaan standaard niet mee.

---

# AI Kozijnenscan — publieke klantpagina

Klantgerichte versie van de scan in de huisstijl van bestelkozijnenopmaat.nl.
Flow: klant uploadt gevelfoto's → AI herkent kozijnen + schat maten → klant
controleert en past aan → vult gegevens in → aanvraag komt binnen bij jou.

## Bestanden

```
routes/kozijnscan-public.js    → publieke router (rate-limited)
views/kozijnscan-klant.ejs     → klantpagina in huisstijl
```

## Mounten (server.js)

```js
// Publiek — GEEN admin-middleware:
app.use('/ai-kozijnenscan', require('./routes/kozijnscan-public'));

// Beheertool — WEL achter je admin-middleware:
app.use('/beheer/kozijnscan', requireAdmin, require('./routes/kozijnscan'));
```

Voeg "AI Kozijnenscan" toe aan je navigatie met link naar /ai-kozijnenscan.
Tip: dit is ook een sterke homepage-CTA ("Foto uploaden → richtprijs").

## Extra env vars

```
NOTIFY_EMAIL      = jouw@adres.nl        → notificatie bij nieuwe aanvraag
NOTIFY_FROM       = Bestelkozijnenopmaat <noreply@bestelkozijnenopmaat.nl>
KLANT_BEVESTIGING = true                 → optioneel: klant krijgt bevestigingsmail
```

## Ingebouwde bescherming (publiek endpoint = jouw API-tegoed)

- Rate limit: max 3 analyses per IP per uur (429 met nette melding)
- Max 3 foto's per scan, client-side verkleind naar max 1600px JPEG
  (scheelt fors in Anthropic-kosten én uploadtijd op mobiel)
- Servervalidatie op alle invoer, veldlengtes begrensd
- Klantfoutmeldingen zonder technische details

## Wat er gebeurt bij een aanvraag

1. Scan + items worden opgeslagen (kozijn_scans / kozijn_scan_items) —
   dezelfde tabellen als de beheertool, dus klantscans tellen mee in de
   kalibratie zodra jij ze na inmeting aanvult.
2. Aanvraag komt in nieuwe tabel kozijn_scan_aanvragen (nummer, klant,
   status 'ontvangen', gekoppeld scan_id).
3. Jij krijgt een notificatiemail met alle kozijnen + het scan_id, klaar
   om via stuurFabriekMail({ scanId }) door te sturen naar de fabriek.
4. Optioneel krijgt de klant direct een bevestiging.

## Aanvragen bekijken

De aanvragen staan in kozijn_scan_aanvragen. Wil je ze in je bestaande
beheer-lijst tonen, join dan op scan_id:

```sql
SELECT a.*, COUNT(i.id) AS kozijnen
FROM kozijn_scan_aanvragen a
LEFT JOIN kozijn_scan_items i ON i.scan_id = a.scan_id
GROUP BY a.id ORDER BY a.created_at DESC;
```
