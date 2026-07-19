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
