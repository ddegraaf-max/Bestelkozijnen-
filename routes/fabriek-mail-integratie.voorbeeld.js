// =====================================================================
// INTEGRATIE-VOORBEELDEN — fabriekmail in bestelkozijnenopmaat.nl
// Kopieer de relevante stukken naar je bestaande routes.
// =====================================================================

const { stuurFabriekMail } = require('../services/fabriek-mail');

// ---------------------------------------------------------------------
// A) AUTOMATISCH bij een nieuwe aanvraag
//    In je bestaande route die de configurator-aanvraag opslaat,
//    direct ná het opslaan toevoegen:
// ---------------------------------------------------------------------
async function voorbeeldNaOpslaanAanvraag(aanvraagRecord) {
  // Map je eigen datamodel naar het mail-formaat. specs is een vrij
  // object: elke key/value wordt een regel in de spectabel, dus je
  // hoeft niets aan je database te veranderen.
  try {
    await stuurFabriekMail({
      aanvraag: {
        nummer: aanvraagRecord.nummer,           // bv. "20260718-5929"
        opmerking: aanvraagRecord.opmerking || ''
        // klant: { naam, email, telefoon }      // alleen relevant als
        //                                       // FABRIEK_STUUR_KLANTGEGEVENS=true
      },
      kozijnen: aanvraagRecord.kozijnen.map(k => ({
        label: k.ruimte,                          // bv. "Keuken"
        aantal: k.aantal,                         // bv. 1
        specs: {
          'Profiel': k.profiel,                   // "SOFTLINE HS"
          'Indeling': k.indeling,                 // "2-delig schuifsysteem"
          'Vakken': k.vakkenOmschrijving,         // "Deel 1: Schuivend (naar rechts)\nDeel 2: Vast (FIX)"
          'Breedte (mm)': k.breedte,              // 1750
          'Hoogte (mm)': k.hoogte,                // 2490
          'Kleur': k.kleur,                       // "Staalblauw (RAL 5011)"
          'Afdichting': k.afdichting,             // "Wit"
          'Beglazing': k.beglazing                // indien aanwezig
        }
      })),
      // Optioneel: de "visuele weergave" uit je configurator als bijlage.
      // Heb je de SVG/PNG opgeslagen of kun je hem genereren:
      // attachments: [{ filename: `${aanvraagRecord.nummer}-kozijn-001.png`, content: pngBuffer }]
    });
    console.log(`[fabriekmail] Aanvraag ${aanvraagRecord.nummer} naar fabriek verzonden`);
  } catch (err) {
    // Mailfout mag de aanvraag zelf nooit blokkeren
    console.error('[fabriekmail]', err.message);
  }
}

// ---------------------------------------------------------------------
// B) HANDMATIG via knop in het beheer (aanvraag-detailpagina)
//    Route toevoegen aan je beheer-router (achter je admin-middleware):
// ---------------------------------------------------------------------
//
// router.post('/beheer/aanvraag/:id/fabriek', requireAdmin, async (req, res) => {
//   try {
//     const aanvraag = await haalAanvraagOp(req.params.id);   // je eigen functie
//     await stuurFabriekMail({
//       aanvraag: { nummer: aanvraag.nummer, opmerking: req.body.opmerking || '' },
//       kozijnen: mapKozijnen(aanvraag),                       // zie voorbeeld A
//       scanId: req.body.scanId || null                        // koppel KozijnScan
//     });
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
//
// Knop in je aanvraag-detail EJS (naast de status-badge "ONTVANGEN"):
//
// <button id="fabriekBtn" class="btn">📤 Stuur naar fabriek</button>
// <span id="fabriekStatus"></span>
// <script>
// document.getElementById('fabriekBtn').addEventListener('click', async () => {
//   const btn = document.getElementById('fabriekBtn');
//   btn.disabled = true; btn.textContent = 'Versturen…';
//   try {
//     const r = await fetch(window.location.pathname + '/fabriek', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({})   // evt. { scanId: 12 } om foto-analyse mee te sturen
//     });
//     const d = await r.json();
//     if (d.error) throw new Error(d.error);
//     document.getElementById('fabriekStatus').textContent = '✓ Verzonden naar fabriek';
//     btn.textContent = 'Nogmaals versturen';
//   } catch (e) {
//     document.getElementById('fabriekStatus').textContent = 'Fout: ' + e.message;
//     btn.textContent = '📤 Stuur naar fabriek';
//   }
//   btn.disabled = false;
// });
// </script>

// ---------------------------------------------------------------------
// C) MET KOZIJNSCAN-DATA (foto-analyse + geschatte maten)
//    Geef simpelweg het scanId mee — de service haalt de items zelf
//    uit kozijn_scan_items en zet ze in een aparte sectie in de mail,
//    inclusief NL/PL-disclaimer dat het schattingen betreft.
// ---------------------------------------------------------------------
async function voorbeeldMetScan() {
  await stuurFabriekMail({
    aanvraag: { nummer: '20260719-0001', opmerking: 'Richtprijs gevraagd o.b.v. foto-analyse' },
    kozijnen: [],        // mag leeg als je alleen de scan stuurt
    scanId: 12           // id uit de KozijnScan-tool ("Opgeslagen als scan #12")
  });
}

module.exports = { voorbeeldNaOpslaanAanvraag, voorbeeldMetScan };
