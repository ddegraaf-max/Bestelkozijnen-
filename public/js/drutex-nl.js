/* PL→NL vertaler voor Drutex-optienamen (kleuren, glas, krukken, beslag, drempels, szprosy…).
   Drutex levert de productdata enkel in het Pools; merknamen (Aereco, Renson, Maco, Swisspacer,
   Antisol, Stopsol, Float, Mirastar, DUBLIN, NEVADA, MISTRAL, KWADRAT, Hoppe, Ponte…), RAL-codes,
   SKU's en F-codes blijven ongewijzigd. Langste fragmenten worden eerst vervangen (woordgrens-bewust). */
(function () {
  'use strict';
  var PAIRS = [
    // ---- krukken / grepen ----
    ['Klamka okienna z przyciskiem', 'Raamkruk met drukknop'],
    ['Klamka okienna z kluczykiem', 'Raamkruk met sleutel'],
    ['Klamka okienna', 'Raamkruk'],
    ['Klamka drzwiowa pod roletę', 'Deurkruk voor rolluik'],
    ['Klamka drzwiowa', 'Deurkruk'],
    ['Klamka z przyciskiem', 'Kruk met drukknop'],
    ['Klamka', 'Kruk'],
    ['Gałka drzwiowa', 'Deurknop'],
    ['Pochwyt do drzwi', 'Deurgreep'],
    ['Pochwyt', 'Greep'],
    ['z kluczykiem', 'met sleutel'],
    ['z przyciskiem', 'met drukknop'],
    ['pod roletę', 'voor rolluik'],
    ['Okrągły pełny', 'Rond vol'],
    ['Okrągły pusty', 'Rond hol'],
    ['stal nierdzewna', 'RVS'],
    // ---- szprosy / roede ----
    ['Szpros naklejany', 'Opgeplakte roede'],
    ['Szpros wewnątrzszybowy', 'Roede tussen het glas'],
    ['Szpros wiedeński', 'Weense roede'],
    ['Szprosy', 'Roede'],
    // ---- ventilatie ----
    ['Nawiewnik', 'Ventilatierooster'],
    // ---- drempels / progi ----
    ['Próg aluminiowy z przegrodą termiczną', 'Aluminium drempel met thermische onderbreking'],
    ['Próg standardowy', 'Standaard drempel'],
    ['Próg standard', 'Standaard drempel'],
    ['Próg aluminiowy', 'Aluminium drempel'],
    ['Próg drewniany', 'Houten drempel'],
    ['Próg rama', 'Kaderdrempel'],
    ['Próg Combi', 'Combi-drempel'],
    ['Niski próg', 'Lage drempel'],
    ['Próg', 'Drempel'],
    ['z automatyczną uszczelką', 'met automatische afdichting'],
    ['z przegrodą termiczną', 'met thermische onderbreking'],
    ['z daszkiem', 'met afdak'],
    // ---- beslag / okucia ----
    ['Mechanizm stopniowanego uchyłu', 'Trapsgewijs kiepmechanisme'],
    ['Okucie antypaniczne nawierzchniowe', 'Opbouw paniekbeslag'],
    ['Okucie antypaniczne wrębowe', 'Inbouw paniekbeslag'],
    ['Okucie antypaniczne', 'Paniekbeslag'],
    ['Okucia antypaniczne', 'Paniekbeslag'],
    ['Okucia Comfort', 'Comfort-beslag'],
    ['Okucie', 'Beslag'],
    ['Okucia', 'Beslag'],
    ['Ukryte zawiasy', 'Verdekte scharnieren'],
    ['Osłonki na zawiasy', 'Scharnierkapjes'],
    ['Ukryty silnik w ramie', 'Verborgen motor in kader'],
    ['Hamulec cierny', 'Wrijvingsrem'],
    ['Hamulec w klamce', 'Rem in de kruk'],
    ['Kontaktron', 'Magneetcontact'],
    ['Zamykacz naświetli', 'Bovenlichtsluiter'],
    ['Kliny montażowe', 'Montagewiggen'],
    ['Stalowa ocynkowana', 'Verzinkt staal'],
    ['Parapet PVC', 'PVC-vensterbank'],
    ['Parapet', 'Vensterbank'],
    // ---- blok-titels ----
    ['Akcesoria montażowe', 'Montageaccessoires'],
    ['Niezawodne okucia', 'Betrouwbaar beslag'],
    ['Szyba piaskowana', 'Gezandstraald glas'],
    ['Wentylacje', 'Ventilatie'],
    ['Progi balkonowe', 'Balkondrempels'],
    ['Progi drzwiowe', 'Deurdrempels'],
    ['Ramy renowacyjne i adptacyjne', 'Renovatie- en aanpassingskaders'],
    ['Ramy renowacyjne i adaptacyjne', 'Renovatie- en aanpassingskaders'],
    ['Automatyka systemu tarasowego', 'Automatisering terrassysteem'],
    ['Ramki', 'Afstandhouders'],
    // ---- glaspakketten / glas ----
    ['dwukomorowy pakiet szybowy', 'Tweekamers glaspakket'],
    ['jednokomorowy pakiet szybowy', 'Enkelkamers glaspakket'],
    ['pakiet 3-szybowy', '3-glas pakket'],
    ['pakiet 2-szybowy', '2-glas pakket'],
    ['pakiet szybowy', 'glaspakket'],
    ['wypełniony argonem', 'gevuld met argon'],
    ['o współczynniku', 'met coëfficiënt'],
    ['(2-komorowy)', '(2-kamer)'],
    ['(1-komorowy)', '(1-kamer)'],
    ['szyba o', 'glas met'],
    ['Przykład', 'Voorbeeld'],
    ['amerykańska', 'Amerikaans'],
    ['ciepła ramka tworzywowa', 'warme kunststof afstandhouder'],
    ['folia matowa', 'matte folie'],
    ['antywłamaniowa', 'inbraakwerend'],
    ['bezpieczna', 'veiligheidsglas'],
    // ---- kleurnamen (decor / RAL-achtig) ----
    ['Antracyt', 'Antraciet'],
    ['Bazaltowy szary', 'Bazaltgrijs'],
    ['Betonowy szary', 'Betongrijs'],
    ['Kwarcytowy szary', 'Kwartsgrijs'],
    ['Grafitowy piaskowany', 'Grafiet gezandstraald'],
    ['Brylantowo Niebieski', 'Briljantblauw'],
    ['Brąz czekoladowy', 'Chocoladebruin'],
    ['Ciemnozielony', 'Donkergroen'],
    ['Ciemny czerwony', 'Donkerrood'],
    ['Ciemny dąb', 'Donker eiken'],
    ['Jasny dąb', 'Licht eiken'],
    ['Jasny szary', 'Lichtgrijs'],
    ['Dąb bielony', 'Gebleekt eiken'],
    ['Dąb naturalny', 'Natuurlijk eiken'],
    ['Złoty dąb', 'Goudeiken'],
    ['Stalowy niebieski', 'Staalblauw'],
    ['Zieleń mchu', 'Mosgroen'],
    ['Łupkowy szary', 'Leisteengrijs'],
    ['Łupkowy', 'Leisteen'],
    ['Daglezja', 'Douglas'],
    ['Kremowy', 'Crème'],
    ['Mahoń', 'Mahonie'],
    ['Orzech', 'Noten'],
    ['Palisander', 'Palissander'],
    ['Piryt', 'Pyriet'],
    ['Biały', 'Wit'],
    // ---- hout-codes ----
    ['Sosna', 'Grenen'],
    // ---- detail-woorden ----
    ['Wymiary', 'Afmetingen'],
    // ---- losse kleurwoorden (voor samengestelde glas/kruk-namen) ----
    ['brązowy', 'bruin'], ['brązowa', 'bruin'], ['brąz', 'bruin'],
    ['oliwkowa', 'olijf'], ['oliwka', 'olijf'],
    ['srebrna', 'zilver'], ['srebrny', 'zilver'],
    ['zielony', 'groen'], ['niebieski', 'blauw'],
    ['biała', 'wit'], ['szary', 'grijs'], ['gładki', 'glad'],
    ['czarny', 'zwart'], ['tytan', 'titaan'],
    ['oraz', 'en'], ['i', 'en']
  ];
  PAIRS.sort(function (a, b) { return b[0].length - a[0].length; });
  var L = 'A-Za-zÀ-ÿąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9';
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var RES = PAIRS.map(function (p) { return [new RegExp('(^|[^' + L + '])(' + esc(p[0]) + ')(?![' + L + '])', 'gi'), p[1]]; });
  function tr(s) {
    if (s == null) return s;
    var out = String(s);
    for (var i = 0; i < RES.length; i++) out = out.replace(RES[i][0], (function (nl) { return function (m, pre) { return pre + nl; }; })(RES[i][1]));
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  if (typeof window !== 'undefined') window.DRUTEX_NL = tr;
  if (typeof module !== 'undefined') module.exports = tr;
})();
