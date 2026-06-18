/* ====== Drutex-configurator (stappen) ======
   Links een stappen-nav, midden het grote voorbeeld (Realistisch/Schema + maat),
   rechts de opties van de actieve stap. Eindigt met "Overzicht & aanvraag".
   Mount op <div class="dx" data-model="<id>">. Vereist drutex-models.js + drutex-schema.js. */
(function () {
  'use strict';

  var PLAY_ICON = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>';
  var WMIN = 400, WMAX = 4000, HMIN = 400, HMAX = 2800;
  var SCHEMA_BG = '#F4F2EC';
  var MAXSW = 1500, MAXSH = 2600, MINSW = 400, MINSH = 500, MAXKG = 130;
  var GLAZ_KGM2 = { Dubbel: 20, Triple: 30 };
  var _colorCache = {};
  var COMPANY_MAIL = 'montage@creditline.nl';

  // ALLE opties komen 1:1 van de Drutex-modelpagina (m.options), niets verzonnen.
  // Bekende Drutex-bloktitels → NL-staplabel + of het een keuzestap is (none = standaard "Geen").
  // 'glas' = de glassoorten-proza; overige (onbekende) blokken tonen we read-only in "Drutex-uitrusting".
  var BOX_STEPS = {
    'Szprosy': { label: 'Roede', none: 'Geen' },
    'Wentylacje': { label: 'Ventilatie', none: 'Geen' },
    'Progi drzwiowe': { label: 'Dorpel' },
    'Ramki': { label: 'Afstandhouder' },
    'Niezawodne okucia': { label: 'Beslag', none: 'Standaard' }
  };
  // NL-vertaling van de Drutex-glassoorttermen (alleen label-hint; de optie zelf blijft Drutex').
  var GLAS_NL = {
    'laminowane (bezpieczne i antywłamaniowe)': 'gelaagd / veiligheid & inbraakwerend',
    'przeciwsłoneczne': 'zonwerend', 'o podwyższonej izolacji akustycznej': 'geluidwerend',
    'hartowane': 'gehard', 'ornamentowe': 'ornament / figuur', 'piaskowane': 'gezandstraald'
  };

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function clamp(v, lo, hi) { v = Math.round(v) || 0; return v < lo ? lo : v > hi ? hi : v; }
  // Drutex gebruikt 'empty.png' én 'brak.jpg' (= "ontbreekt") als placeholder voor opties
  // zonder foto → behandel beide als geen foto.
  function realImg(s) { return (s && !/\/(empty|brak)\.(png|jpe?g)(\?|$)/i.test(s)) ? s : null; }
  // Kleurstaal (hex) afleiden uit een kleurnaam: RAL-nummer in de naam → RAL-hex, anders woordkaart.
  function hexFromName(name) {
    var RAL = window.DRUTEX_RAL || [], m = String(name || '').match(/\b(\d{4})\b/);
    if (m) { var r = RAL.filter(function (c) { return (c.code || '').indexOf(m[1]) >= 0; })[0]; if (r) return r.hex; }
    var n = String(name || '').toLowerCase();
    var MAP = [['antraciet', '#2f3438'], ['zwart', '#1c1c1c'], ['lichtgrijs', '#c6c6c2'], ['leisteengrijs', '#5b6066'], ['leisteen', '#4f555b'],
      ['kwartsgrijs', '#6f7378'], ['bazaltgrijs', '#4b4e52'], ['betongrijs', '#8a8d90'], ['grijs', '#9a9a98'],
      ['chocoladebruin', '#3a2418'], ['donker eiken', '#4a2f1c'], ['goudeiken', '#a6712e'], ['licht eiken', '#c79a5b'], ['eiken', '#b5894e'], ['oak', '#b5894e'],
      ['noten', '#4a2e1a'], ['mahonie', '#5b2418'], ['douglas', '#a86b3b'], ['palissander', '#5a3a2a'], ['crème', '#efe6d0'], ['creme', '#efe6d0'],
      ['beige', '#d8c6a0'], ['donkergroen', '#26432a'], ['mosgroen', '#4a5d2a'], ['groen', '#3f6b3a'],
      ['donkerrood', '#6e1f1f'], ['rood', '#8e2a2a'], ['staalblauw', '#34495e'], ['blauw', '#2f4d7a'],
      ['goud', '#b08d3a'], ['zilver', '#bfc1c2'], ['ivoor', '#e7dcc0'], ['platinum', '#9a9ea0'], ['crown', '#9a9ea0'], ['wit', '#f4f4f1']];
    for (var i = 0; i < MAP.length; i++) if (n.indexOf(MAP[i][0]) >= 0) return MAP[i][1];
    return null;
  }
  // Echte Drutex-kleurstaal zoeken in onze gescrapete modeldata (drutex.pl) op decor-code,
  // bv. "... (F456-3081)" → de bijbehorende swatch-afbeelding. Geeft een URL of null.
  var _swIdx = null;
  function swatchFromName(name) {
    if (!_swIdx) {
      _swIdx = {}; var M = window.DRUTEX_MODELS || {};
      for (var k in M) (M[k].colors || []).forEach(function (c) {
        if (c.swatch && c.code) { var cc = String(c.code).toLowerCase().trim(); if (!_swIdx[cc]) _swIdx[cc] = c.swatch; }
      });
    }
    var ps = String(name || '').match(/\(([^()]+)\)/g) || [];
    for (var i = 0; i < ps.length; i++) { var code = ps[i].replace(/[()]/g, '').toLowerCase().trim(); if (_swIdx[code]) return _swIdx[code]; }
    return null;
  }
  function hex2(n) { return ('0' + (n | 0).toString(16)).slice(-2); }
  function sampleColor(url, cb) {
    if (_colorCache[url]) return cb(_colorCache[url]);
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = c.height = 10;
        var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, 10, 10);
        var d = ctx.getImageData(0, 0, 10, 10).data, r = 0, g = 0, b = 0, n = 0;
        for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        cb(_colorCache[url] = n ? '#' + hex2(r / n) + hex2(g / n) + hex2(b / n) : '#e9e7e1');
      } catch (e) { cb('#e9e7e1'); }
    };
    img.onerror = function () { cb('#e9e7e1'); };
    img.src = url;
  }

  // Indeling/vorm-opties (schematisch). Elke indeling = lijst vakken (rect, genormaliseerd 0..1).
  // Per vak kiest de klant een opening (zoals in de oude configurator).
  var DIVISIONS = [
    { key: '1', label: 'Enkel', vakken: [{ x: 0, y: 0, w: 1, h: 1 }] },
    { key: '2', label: '2-delig', vakken: [{ x: 0, y: 0, w: .5, h: 1 }, { x: .5, y: 0, w: .5, h: 1 }] },
    { key: '3', label: '3-delig', vakken: [{ x: 0, y: 0, w: 1 / 3, h: 1 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 }] },
    { key: 'bl', label: 'Bovenlicht', vakken: [{ x: 0, y: 0, w: 1, h: .3 }, { x: 0, y: .3, w: 1, h: .7 }] },
    { key: '2b1o', label: '2 boven / 1 onder', vakken: [{ x: 0, y: 0, w: .5, h: .5 }, { x: .5, y: 0, w: .5, h: .5 }, { x: 0, y: .5, w: 1, h: .5 }] },
    { key: '1b2o', label: '1 boven / 2 onder', vakken: [{ x: 0, y: 0, w: 1, h: .5 }, { x: 0, y: .5, w: .5, h: .5 }, { x: .5, y: .5, w: .5, h: .5 }] },
    { key: '4', label: '4-delig', vakken: [{ x: 0, y: 0, w: .5, h: .5 }, { x: .5, y: 0, w: .5, h: .5 }, { x: 0, y: .5, w: .5, h: .5 }, { x: .5, y: .5, w: .5, h: .5 }] }
  ];
  // openingstypes (Drutex-codes zoals in de officiele configurator): F/U/RP/RL/URP/URL
  var OPENINGS = [
    { key: 'vast', label: 'Vast', short: 'Vast', code: 'F' },
    { key: 'kiep', label: 'Kiep (uitzet)', short: 'Kiep', code: 'U' },
    { key: 'draai-r', label: 'Draai rechts', short: 'Draai R', code: 'RP' },
    { key: 'draai-l', label: 'Draai links', short: 'Draai L', code: 'RL' },
    { key: 'dk-r', label: 'Draaikiep rechts', short: 'D-kiep R', code: 'URP' },
    { key: 'dk-l', label: 'Draaikiep links', short: 'D-kiep L', code: 'URL' }
  ];
  // open-symbool (draai/kiep) binnen een glasvak — rode lijnen, zoals de Drutex-configurator
  function openSym(op, x, y, w, h) {
    var cx = x + w / 2, cy = y + h / 2, st = ' stroke="#d64a3f" stroke-width="1.6" fill="none" stroke-linejoin="round"';
    var L = x, R = x + w, T = y, B = y + h;
    function v(p1, ap, p2) { return '<path d="M' + p1[0] + ' ' + p1[1] + ' L' + ap[0] + ' ' + ap[1] + ' L' + p2[0] + ' ' + p2[1] + '"' + st + '/>'; }
    var s = '';
    if (op === 'draai-r' || op === 'dk-r') s += v([L, T], [R, cy], [L, B]); // scharnier rechts → punt rechts
    if (op === 'draai-l' || op === 'dk-l') s += v([R, T], [L, cy], [R, B]); // scharnier links → punt links
    if (op === 'kiep' || op === 'dk-r' || op === 'dk-l') s += v([L, T], [cx, B], [R, T]); // kiep → punt onder
    return s;
  }
  function divisionSVG(div, w, h, openings) {
    var ar = (w || 1000) / (h || 1000), vw, vh;
    if (ar >= 1) { vw = 300; vh = Math.max(140, Math.round(300 / ar)); } else { vh = 300; vw = Math.max(140, Math.round(300 * ar)); }
    var fw = Math.max(8, Math.round(Math.min(vw, vh) * 0.05)), mu = Math.max(4, Math.round(fw * 0.5));
    var FR = '#3a382f', GL = '#e7eef1';
    var ix = fw, iy = fw, iw = vw - 2 * fw, ih = vh - 2 * fw;
    var s = '<svg viewBox="0 0 ' + vw + ' ' + vh + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">';
    s += '<rect x="1" y="1" width="' + (vw - 2) + '" height="' + (vh - 2) + '" rx="6" fill="' + FR + '"/>';
    (div.vakken || []).forEach(function (vk, i) {
      var gl = (vk.x > 1e-6 ? mu : 0), gt = (vk.y > 1e-6 ? mu : 0);
      var gr = (vk.x + vk.w < 1 - 1e-6 ? mu : 0), gb = (vk.y + vk.h < 1 - 1e-6 ? mu : 0);
      var gx = ix + vk.x * iw + gl, gy = iy + vk.y * ih + gt;
      var gw = vk.w * iw - gl - gr, gh = vk.h * ih - gt - gb;
      s += '<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" fill="' + GL + '"/>';
      s += openSym((openings && openings[i]) || 'vast', gx, gy, gw, gh);
    });
    return s + '</svg>';
  }

  // Kolommen/rijen (als fracties) afleiden uit de rasterlijnen van een indeling.
  // Zo weet de maatstap hoeveel breedtes (kolommen) en hoogtes (rijen) er nodig zijn.
  function dividerGrid(div) {
    function uq(a) {
      a = a.map(function (v) { return Math.round(v * 1000) / 1000; }).sort(function (x, y) { return x - y; });
      var o = []; a.forEach(function (v) { if (!o.length || Math.abs(o[o.length - 1] - v) > 1e-3) o.push(v); });
      return o;
    }
    var xs = [], ys = [];
    (div.vakken || []).forEach(function (v) { xs.push(v.x, v.x + v.w); ys.push(v.y, v.y + v.h); });
    xs = uq(xs); ys = uq(ys);
    var cols = [], rows = [];
    for (var i = 0; i < xs.length - 1; i++) cols.push(xs[i + 1] - xs[i]);
    for (var j = 0; j < ys.length - 1; j++) rows.push(ys[j + 1] - ys[j]);
    return { cols: cols.length ? cols : [1], rows: rows.length ? rows : [1] };
  }
  // Positie-labels zodat de klant ziet welke maat welke is (links/midden/rechts, boven/onder).
  function posLabels(n, kind) {
    if (kind === 'col') {
      if (n === 1) return ['']; if (n === 2) return ['links', 'rechts']; if (n === 3) return ['links', 'midden', 'rechts'];
    } else {
      if (n === 1) return ['']; if (n === 2) return ['boven', 'onder']; if (n === 3) return ['boven', 'midden', 'onder'];
    }
    var a = []; for (var i = 0; i < n; i++) a.push((kind === 'col' ? 'kolom ' : 'rij ') + (i + 1)); return a;
  }

  function mount(root, modelId) {
    var models = window.DRUTEX_MODELS || {};
    var m = models[modelId];
    if (!m) { root.innerHTML = '<p style="color:#b00">Onbekend model: ' + modelId + '</p>'; return; }
    root.classList.add('dx'); root.innerHTML = '';

    var mode = m.colorMode || 'image';
    var colors = (mode === 'ral') ? (m.colors && m.colors.length ? m.colors : (window.DRUTEX_RAL || [])) : (m.colors || []);
    // "Biały Ulti-Matt" overal verwijderd (op verzoek) — Antracyt/Czarny Ulti-Matt blijven
    colors = colors.filter(function (c) { return !/^bia[łl]y\s+ulti-?matt$/i.test((c.name || '').trim()); });
    var TYPE_BY_CAT = { 'Okna': 'window', 'Drzwi': 'door', 'Systemy tarasowe': 'sliding' };
    var type = m.type || TYPE_BY_CAT[m.category] || 'window';
    var indDef = type === 'door' ? 1 : type === 'sliding' ? 2 : type === 'gate' ? 4 : 1;
    var defDim = type === 'door' ? { w: 1000, h: 2100 } : type === 'sliding' ? { w: 3000, h: 2200 }
      : type === 'gate' ? { w: 2500, h: 2250 } : { w: 1000, h: 760 };
    var ANTRACIET = '#293133';
    var hasVideo = !!m.video;
    // drewniano-aluminiowe: binnen = hout-decors (colors), buiten = alu-masker getint met RAL
    var dual = !!(m.dual && m.maskOuter);
    var RAL = window.DRUTEX_RAL || [];
    var outerHex = m.maskOuterHex || '#7a7d7e';
    var NL = window.DRUTEX_NL || function (s) { return s; }; // PL→NL vertaling van optienamen (alles in het Nederlands)
    var t0 = Date.now(); // voor lichte anti-spam op de offerteaanvraag

    // ===== gedeelde staat =====
    var W = clamp(defDim.w, WMIN, WMAX), H = clamp(defDim.h, HMIN, HMAX);
    var vak = type === 'window' && m.vakken ? m.vakken : indDef;
    var frameHex = '#e9e7e1', glaz = 'Triple', dimsVisible = false;
    var currentFill = null, curApp = 'inox';
    var opt = m.options || { std: [], glas: [], boxes: [] };
    // standaard glaspakket (verbatim uit Drutex-standaarduitrusting)
    var stdGlas = (opt.std || []).find(function (s) { return /pakiet szybow|szyba o Ug|Ug\s*=/i.test(s); }) || '';
    // dichtingskleur: Drutex vermeldt in de standaard "uszczelki ... w kolorze czarnym lub szarym" → zwart/grijs
    var dichtingKeuze = (opt.std || []).some(function (s) { return /uszczel/i.test(s) && /(czarn|szar)/i.test(s); });
    var cfg = { kleur: '—', kleurBuiten: '—', kruk: '—', vulling: null, glas: 'Standaard', sel: {}, ids: {}, dims: null };
    if (dichtingKeuze) cfg.dichting = 'Zwart';
    var hasIndeling = (type === 'window' || type === 'sliding');
    var curDiv = DIVISIONS[0];   // gekozen indeling (vakken)
    if (hasIndeling) { cfg.indeling = curDiv.label; cfg.openings = curDiv.vakken.map(function (_, i) { return i === 0 ? 'dk-r' : 'vast'; }); }

    // ── Officiele Drutex-configuratorcatalogus (1:1 opties/afbeeldingen) ──
    // Voor PVC-modellen (IGLO) komen de stappen 1:1 uit window.DRUTEX_KONF, in
    // Drutex-volgorde, met de echte optie-afbeeldingen. Aluminium/hout houden onze
    // eigen, modelspecifieke stappen (die catalogus bestaat daar niet voor).
    var KONF = window.DRUTEX_KONF;
    // ALLE modellen (PVC, aluminium, hout) gebruiken dezelfde Drutex-catalogus (22 stappen),
    // gemapt op productgroep via de categorie. Geen aparte eigen kleur-/optiestappen meer.
    var konf = (function () {
      if (!KONF || !KONF.productGroups) return null;
      var slug = (modelId || '').toLowerCase();
      var cat = m.category, grp;
      if (cat === 'Drzwi') grp = 'doors';
      else if (cat === 'Systemy tarasowe') grp = /(^|-)hs(-|$)|hefschuif|monorail/i.test(slug) ? 'HS' : 'suwanki';
      else grp = /balk|balkon|balcony/i.test(slug) ? 'balcony' : 'windows';
      var g = KONF.productGroups[grp]; if (!g || !g.stepsOrder) return null;
      return { group: grp, gc: g };
    })();
    var gc = konf && konf.gc;
    var wmin = WMIN, wmax = WMAX, hmin = HMIN, hmax = HMAX;
    // breedte/hoogte-defaults uit de vooraf opgehaalde maatstructuur (1-rij) van deze groep
    if (konf && gc.dimModels && gc.dimModels.byRows && gc.dimModels.byRows[1]) {
      var _d1 = gc.dimModels.byRows[1];
      if (_d1.widthRange) { wmin = _d1.widthRange.min || wmin; wmax = _d1.widthRange.max || wmax; }
      if (_d1.rows && _d1.rows[0]) { hmin = _d1.rows[0].minH || hmin; hmax = _d1.rows[0].maxH || hmax; }
    }
    W = clamp(W, wmin, wmax); H = clamp(H, hmin, hmax);

    /* ===================== PREVIEW (midden) ===================== */
    var preview = el('div', 'dx-preview');
    var pcard = el('div', 'dx-pcard');
    var bar = el('div', 'dx-bar');
    bar.innerHTML = '<span class="dx-dots"><i></i><i></i><i></i></span>';
    pcard.appendChild(bar);   // "Schema op maat"-tab verwijderd → enkel realistische weergave

    var stage = el('div', 'dx-stage ' + (hasVideo ? 'is-video' : 'is-color'));
    var video = null;
    if (hasVideo) {
      video = el('video', 'dx-media dx-video', { autoplay: 'autoplay', loop: 'loop', muted: 'muted', playsinline: 'playsinline', preload: 'metadata' });
      video.muted = true;
      var vext = (m.video.match(/\.(webm|mp4)(?:$|\?)/i) || [, 'mp4'])[1].toLowerCase();
      video.appendChild(el('source', null, { src: m.video, type: 'video/' + vext }));
    }
    var render = el('img', 'dx-media dx-render', { alt: m.name, loading: 'eager' });
    var animBtn = el('button', 'dx-anim', { type: 'button', 'aria-label': 'Terug naar animatie' });
    animBtn.innerHTML = PLAY_ICON + '<span>Animatie</span>';
    if (!hasVideo) animBtn.style.display = 'none';
    var mediabox = el('div', 'dx-mediabox');
    if (video) mediabox.appendChild(video);
    mediabox.appendChild(render);
    stage.appendChild(mediabox); stage.appendChild(animBtn);
    var dimov = el('div', 'dx-dimov');
    var dimW = el('div', 'dx-dimov-w'); var dimWs = el('span'); dimW.appendChild(dimWs);
    var dimH = el('div', 'dx-dimov-h'); var dimHs = el('span'); dimH.appendChild(dimHs);
    dimov.appendChild(dimW); dimov.appendChild(dimH); stage.appendChild(dimov);

    var schemaBox = el('div', 'dx-schemabox');
    // groot glas-voorbeeld (stap Glas): toont de gekozen/aangewezen glasfoto groot in het paneel
    var gz = el('div', 'dx-glasszoom');
    var gzImg = el('img', 'dx-gz-img', { alt: '' });
    var gzCap = el('div', 'dx-gz-cap');
    gz.appendChild(gzImg); gz.appendChild(gzCap);
    var viewWrap = el('div', 'dx-view'); viewWrap.appendChild(stage);

    // drewniano-aluminiowe: twee weergaven naast elkaar — binnen (hout-render, links) + buiten (alu-masker + RAL, rechts)
    var outerImg = null;
    if (dual && !konf) {   // dubbele weergave alleen bij onze eigen flow; catalogus-modellen tonen 1 beeld
      viewWrap.classList.add('dual');
      var lblIn = el('div', 'dx-sidelabel'); lblIn.textContent = 'Binnenkant'; stage.appendChild(lblIn);
      var outer = el('div', 'dx-outer');
      var lblOut = el('div', 'dx-sidelabel'); lblOut.textContent = 'Buitenkant · aluminium'; outer.appendChild(lblOut);
      var obox = el('div', 'dx-mediabox');
      outerImg = el('img', 'dx-media dx-outerimg', { alt: m.name + ' — buitenkant', loading: 'eager' });
      outerImg.src = m.maskOuter; outerImg.style.backgroundColor = outerHex;
      obox.appendChild(outerImg); outer.appendChild(obox);
      viewWrap.appendChild(outer);
    }
    function selectOuter(c) {
      if (!outerImg) return;
      outerHex = c.hex; outerImg.style.backgroundColor = c.hex;
      cfg.kleurBuiten = NL(c.name) + (c.code ? ' (' + c.code + ')' : '');
      refreshOverview();
    }

    viewWrap.appendChild(schemaBox); viewWrap.appendChild(gz); pcard.appendChild(viewWrap);
    var cap = el('div', 'dx-cap');
    var capName = el('span', 'dx-cap-name'); var capCode = el('span', 'dx-cap-code');
    cap.appendChild(capName); cap.appendChild(capCode); pcard.appendChild(cap);
    preview.appendChild(pcard);

    function setTab() { pcard.classList.remove('show-schema'); } // enkel realistisch (schema-tab verwijderd)

    var selGlas = null; // gekozen glasoptie-object (voor het grote voorbeeld)
    var _PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1×1 transparant
    function glassZoom(item) {
      var hex = (item && !item.img) ? (item.swatch || item.hex) : null;   // kleurstaal zonder foto
      if (!item || (!item.img && !hex)) { pcard.classList.remove('show-gz'); return; }
      if (item.img) { gzImg.src = item.img; gzImg.style.background = ''; gzImg.style.width = ''; gzImg.style.height = ''; }
      else { gzImg.src = _PX; gzImg.style.background = hex; gzImg.style.width = '260px'; gzImg.style.height = '200px'; }
      gzCap.textContent = item.name + (item.detail ? ' · ' + item.detail : '');
      pcard.classList.add('show-gz');
    }

    // plaats de maatlijnen tegen de echte beeldranden (beeld staat gecentreerd in eigen verhouding)
    function layoutMedia() {
      if (!dimsVisible) return;
      var sr = stage.getBoundingClientRect(), mr = render.getBoundingClientRect();
      if (!mr.width || !mr.height || !sr.width) return;
      var l = mr.left - sr.left, t = mr.top - sr.top, b = sr.bottom - mr.bottom;
      dimW.style.left = l + 'px'; dimW.style.right = (sr.right - mr.right) + 'px';
      dimW.style.top = 'auto'; dimW.style.bottom = Math.max(8, b - 18) + 'px';
      dimH.style.top = t + 'px'; dimH.style.bottom = b + 'px';
      dimH.style.left = Math.max(8, l - 22) + 'px';
    }
    render.addEventListener('load', layoutMedia);
    window.addEventListener('resize', layoutMedia);

    function drawSchema() {
      dimWs.textContent = W + ' mm'; dimHs.textContent = H + ' mm';
      stage.classList.toggle('dims-on', dimsVisible);
      layoutMedia();
      runCheck();
    }
    // schematische indeling + openingen in het preview-paneel (alleen op de stap "Indeling")
    function drawDivisionPreview() { schemaBox.innerHTML = divisionSVG(curDiv, W, H, cfg.openings); }

    // Gelabeld maatschema: tekent het kozijn met de rijen/kolommen uit cfg.dims en zet
    // er labels bij (rij 1 / rij 2 …, of links/midden/rechts) zodat zichtbaar is welke
    // ingevoerde maat bij welke sectie hoort — net als in de Drutex-configurator.
    function dimSchemaSVG(dims) {
      var hasCols = !!(dims.cols && dims.cols.length);
      // per rij de cellen bepalen: PVC heeft echte cellen (breedte-fractie + opening),
      // aluminium/hout gebruikt de kolommen uit de gekozen indeling (uniform per rij)
      var rows = (dims.rows && dims.rows.length ? dims.rows : [{ h: 1 }]).map(function (r) {
        var cells = (r.cells && r.cells.length) ? r.cells.map(function (c) { return { w: c.w || 1, op: c.op || null }; })
          : (hasCols ? dims.cols.map(function (c) { return { w: c.w || 1, op: null }; }) : [{ w: 1, op: null }]);
        var ct = cells.reduce(function (a, c) { return a + c.w; }, 0) || 1;
        return { size: r.h || 1, cells: cells.map(function (c) { return { f: c.w / ct, op: c.op }; }) };
      });
      var totH = rows.reduce(function (a, r) { return a + r.size; }, 0) || 1;
      var totW = (dims.width || (hasCols ? dims.cols.reduce(function (a, c) { return a + (c.w || 1); }, 0) : 1000)) || 1000;
      var colLabels = hasCols && dims.cols.length > 1;
      // VAST tekenvlak; breedte en hoogte van het getekende kozijn worden ONAFHANKELIJK
      // geschaald (eigen as), zodat het wijzigen van de breedte de getekende hoogte niet
      // verandert — en omgekeerd. Geen herschaling van het hele schema meer.
      var VBW = 330, VBH = 264, padL = 10, padR = 72, padB = 12, m = 3;
      var padT = colLabels ? 22 : 12;
      var boxW = VBW - padL - padR, boxH = VBH - padT - padB, REFW = 2600, REFH = 2600;
      var iw = Math.max(80, Math.min(boxW, totW / REFW * boxW));
      var ih = Math.max(70, Math.min(boxH, totH / REFH * boxH));
      var ox = padL, oy = padT, W2 = VBW, H2 = VBH;
      var FR = '#3a382f', GL = '#e7eef1', TX = '#1b1b1a', LN = '#b9b4a8';
      var s = '<svg viewBox="0 0 ' + W2 + ' ' + H2 + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">';
      s += '<rect x="' + ox + '" y="' + oy + '" width="' + iw + '" height="' + ih + '" rx="4" fill="' + FR + '"/>';
      var yy = oy, rowMid = [];
      rows.forEach(function (r) {
        var rh = ih * (r.size / totH); rowMid.push(yy + rh / 2);
        var xx = ox;
        r.cells.forEach(function (c) {
          var cw = iw * c.f, gx = xx + m, gy = yy + m, gw = Math.max(2, cw - 2 * m), gh = Math.max(2, rh - 2 * m);
          s += '<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" fill="' + GL + '"/>';
          if (c.op) s += openSym(c.op, gx, gy, gw, gh);
          xx += cw;
        });
        yy += rh;
      });
      rows.forEach(function (r, ri) {   // rij-labels rechts
        var lab = rows.length > 1 ? ('rij ' + (ri + 1)) : 'hoogte';
        s += '<line x1="' + (ox + iw) + '" y1="' + rowMid[ri] + '" x2="' + (ox + iw + 8) + '" y2="' + rowMid[ri] + '" stroke="' + LN + '"/>';
        s += '<text x="' + (ox + iw + 12) + '" y="' + (rowMid[ri] + 4) + '" font-size="12" font-weight="700" fill="' + TX + '">' + lab + '</text>';
      });
      if (colLabels) {   // kolom-labels boven (aluminium/hout met indeling)
        var xx2 = ox, tw = dims.cols.reduce(function (a, c) { return a + (c.w || 1); }, 0) || 1;
        dims.cols.forEach(function (c, ci) {
          var cw = iw * ((c.w || 1) / tw);
          s += '<text x="' + (xx2 + cw / 2) + '" y="' + (oy - 7) + '" font-size="10.5" font-weight="700" fill="' + TX + '" text-anchor="middle">' + ((c.label || '').replace(/^Breedte\s*/i, '') || ('kolom ' + (ci + 1))) + '</text>';
          xx2 += cw;
        });
      }
      return s + '</svg>';
    }
    // Statisch maatschema: voor PVC het echte Drutex-beeld (niet uitrekken!) met rij-labels
    // ernaast; voor aluminium/hout het getekende vorm-schema. Verandert NIET met de schuiven.
    // Scherp vector-schema (SVG): kozijn + secties + openingssymbolen, met de maatlabels
    // ↕ Hoogte / ↔ Breedte / sectienummers / rij-labels IN de SVG → altijd uitgelijnd, scherp
    // op elk formaat (ook groot). Layout (proporties) is statisch, dus schuiven ≠ uitlijning.
    function dimLayoutSVG(layout, perCol, multi) {
      var rows = (layout && layout.rows && layout.rows.length) ? layout.rows : [{ frac: 1, cells: [{ frac: 1, op: null }] }];
      var totR = rows.reduce(function (a, r) { return a + (r.frac || 0); }, 0) || 1;
      var VBW = 360, VBH = 300, padL = 42, padR = (multi ? 54 : 14), padT = 12, padB = 30, m = 3;
      var ox = padL, oy = padT, iw = VBW - padL - padR, ih = VBH - padT - padB;
      var FR = '#3a382f', GL = '#e7eef1', TX = '#1b1b1a', AC = '#8e3417';
      var s = '<svg viewBox="0 0 ' + VBW + ' ' + VBH + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" font-family="\'Hanken Grotesk\',sans-serif">';
      s += '<rect x="' + ox + '" y="' + oy + '" width="' + iw + '" height="' + ih + '" rx="5" fill="' + FR + '"/>';
      var yy = oy, rowMid = [];
      rows.forEach(function (r) {
        var rh = ih * ((r.frac || 0) / totR); rowMid.push(yy + rh / 2);
        var cells = (r.cells && r.cells.length) ? r.cells : [{ frac: 1, op: null }];
        var tc = cells.reduce(function (a, c) { return a + (c.frac || 0); }, 0) || 1, xx = ox;
        cells.forEach(function (c) {
          var cw = iw * ((c.frac || 0) / tc), gx = xx + m, gy = yy + m, gw = Math.max(2, cw - 2 * m), gh = Math.max(2, rh - 2 * m);
          s += '<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" fill="' + GL + '"/>';
          if (c.op) s += openSym(c.op, gx, gy, gw, gh);
          xx += cw;
        });
        yy += rh;
      });
      var hy = oy + ih / 2;
      s += '<g fill="' + AC + '" font-size="11" font-weight="700">';
      s += '<text x="13" y="' + hy + '" text-anchor="middle" transform="rotate(-90 13 ' + hy + ')">↕ Hoogte</text>';
      s += '<text x="' + (ox + iw / 2) + '" y="' + (oy + ih + 19) + '" text-anchor="middle">' + (perCol ? '↔ Breedte per sectie (1·2·3)' : '↔ Breedte') + '</text></g>';
      if (multi) { s += '<g fill="' + TX + '" font-size="11" font-weight="700">'; rows.forEach(function (r, i) { s += '<text x="' + (ox + iw + 6) + '" y="' + (rowMid[i] + 4) + '">‹ rij ' + (i + 1) + '</text>'; }); s += '</g>'; }
      if (perCol) {   // sectienummers (1·2·3) onder de kolommen van de breedste rij
        var wr = rows.reduce(function (a, r) { return ((r.cells || []).length > ((a.cells || []).length)) ? r : a; }, rows[0]);
        var cells2 = wr.cells || [], tc2 = cells2.reduce(function (a, c) { return a + (c.frac || 0); }, 0) || 1, xx2 = ox;
        cells2.forEach(function (c, i) { var cw = iw * ((c.frac || 0) / tc2), cx = xx2 + cw / 2; s += '<circle cx="' + cx + '" cy="' + (oy + ih - 10) + '" r="8" fill="' + AC + '"/><text x="' + cx + '" y="' + (oy + ih - 6) + '" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">' + (i + 1) + '</text>'; xx2 += cw; });
      }
      return s + '</svg>';
    }
    function drawDimSchema() {
      if (!cfg.dims) return;
      var d = cfg.dims;
      if (d.img && d.schemaRows && d.schemaRows.length) {
        var Hpx = 230, multi = d.schemaRows.length > 1, perCol = d.perCol && d.cols && d.cols.length > 1;
        var F = 'font:700 11px/1 \'Hanken Grotesk\',sans-serif;color:#8e3417;white-space:nowrap';
        var rij = '<div></div>';
        if (multi) {
          var cum = 0;
          rij = '<div style="position:relative;height:' + Hpx + 'px;min-width:44px">' +
            d.schemaRows.map(function (fr, i) { var mid = (cum + fr / 2) * Hpx; cum += fr; return '<div style="position:absolute;top:' + mid + 'px;left:0;transform:translateY(-50%);font:700 12px/1 \'Hanken Grotesk\',sans-serif;color:#1b1b1a;white-space:nowrap">‹ rij ' + (i + 1) + '</div>'; }).join('') +
            '</div>';
        }
        var badges = '';   // sectienummers op het beeld (per-kolom modus)
        if (perCol) { var cw = 0; badges = d.cols.map(function (c, i) { var mid = cw + (c.frac || 0) / 2; cw += (c.frac || 0); return '<span style="position:absolute;bottom:5px;left:' + (mid * 100).toFixed(1) + '%;transform:translateX(-50%);background:#8e3417;color:#fff;font:700 10px/17px sans-serif;width:17px;height:17px;border-radius:50%;text-align:center">' + (i + 1) + '</span>'; }).join(''); }
        var imgCell = '<div style="position:relative;display:inline-block;line-height:0"><img src="' + d.img + '" alt="" style="height:' + Hpx + 'px;width:auto;max-width:280px;display:block">' + badges + '</div>';
        schemaBox.innerHTML =
          '<div style="display:inline-grid;grid-template-columns:auto auto auto;align-items:center;gap:5px 7px;padding:8px">' +
            '<div style="' + F + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px"><span style="font-size:13px">↕</span><span style="writing-mode:vertical-rl;transform:rotate(180deg)">Hoogte</span></div>' +
            imgCell + rij +
            '<div></div><div style="' + F + ';text-align:center">' + (perCol ? '↔ Breedte per sectie (1·2·3)' : '↔ Breedte') + '</div><div></div>' +
          '</div>';
        return;
      }
      schemaBox.innerHTML = dimSchemaSVG(d);
    }
    function openingLabel(k) { for (var i = 0; i < OPENINGS.length; i++) if (OPENINGS[i].key === k) return OPENINGS[i].label + ' (' + OPENINGS[i].code + ')'; return 'Vast (F)'; }
    function runCheck() {
      if (!checkEl) return;
      if (type !== 'window') { checkEl.style.display = 'none'; return; }
      checkEl.style.display = '';
      var sashW = Math.round(W / vak), sashH = H, area = sashW * sashH / 1e6;
      var kg = Math.round(area * (GLAZ_KGM2[glaz] || 30) + 2 * (sashW + sashH) / 1000 * 3.5);
      var p = [];
      if (sashW < MINSW || sashH < MINSH) p.push('vleugel te klein (' + sashW + '×' + sashH + ' mm)');
      if (sashW > MAXSW) p.push('vleugel te breed (' + sashW + ' > ' + MAXSW + ')');
      if (sashH > MAXSH) p.push('vleugel te hoog (' + sashH + ' > ' + MAXSH + ')');
      if (kg > MAXKG) p.push('vleugel te zwaar (~' + kg + ' kg)');
      if (p.length) { checkEl.className = 'dx-check warn'; checkEl.textContent = '⚠ ' + p.join(' · '); }
      else { checkEl.className = 'dx-check ok'; checkEl.textContent = '✓ Produceerbaar — ' + sashW + ' × ' + sashH + ' mm, ± ' + kg + ' kg/vleugel'; }
    }
    function ensureStill() {
      if (stage.classList.contains('is-color')) return;
      if (colors[0]) selectColor(0); else if (m.fills && m.fills[0]) selectFill(0);
    }
    function showVideo() {
      if (!hasVideo) return; setTab('real');
      stage.classList.remove('is-color'); stage.classList.add('is-video');
      dimsVisible = false; capName.textContent = m.name; capCode.textContent = ''; drawSchema();
      colorBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      try { video.currentTime = 0; var p = video.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
    animBtn.addEventListener('click', showVideo);

    function selectColor(i) {
      var c = colors[i]; dimsVisible = true; currentFill = null;
      fillBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      if (mode === 'ral') { render.src = m.mask; render.style.backgroundColor = c.hex; }
      else { render.src = c.render; render.style.backgroundColor = ''; }
      render.alt = m.name + ' — ' + c.name; setTab('real');
      stage.classList.remove('is-video'); stage.classList.add('is-color');
      try { if (video) video.pause(); } catch (e) {}
      capName.textContent = NL(c.name); capCode.textContent = c.code ? '(' + NL(c.code) + ')' : '';
      cfg.kleur = NL(c.name) + (c.code ? ' (' + NL(c.code) + ')' : '');
      colorBtns.forEach(function (x, j) { x.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      if (mode === 'ral') { frameHex = c.hex; drawSchema(); } else sampleColor(c.swatch, function (hex) { frameHex = hex; drawSchema(); });
      refreshOverview();
    }
    function applyFill() {
      if (currentFill == null) return; dimsVisible = true;
      var f = m.fills[currentFill];
      var img = (curApp === 'czarny' && f.apps.czarny) ? f.apps.czarny : (f.apps.inox || f.apps.czarny);
      render.src = img; render.style.backgroundColor = ''; render.alt = m.name + ' — ' + f.name; setTab('real');
      stage.classList.remove('is-video'); stage.classList.add('is-color');
      try { if (video) video.pause(); } catch (e) {}
      capName.textContent = f.name;
      capCode.textContent = (f.apps.inox && f.apps.czarny) ? '· ' + (curApp === 'czarny' ? 'zwart' : 'inox') : '';
      cfg.vulling = f.name + ((f.apps.inox && f.apps.czarny) ? ' · ' + (curApp === 'czarny' ? 'zwart' : 'inox') : '');
      colorBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      fillBtns.forEach(function (x, j) { x.setAttribute('aria-pressed', j === currentFill ? 'true' : 'false'); });
      frameHex = ANTRACIET; drawSchema(); refreshOverview();
    }
    function selectFill(i) { currentFill = i; applyFill(); }
    function setApp(k) { curApp = k; appBtns.forEach(function (x) { x.b.setAttribute('aria-pressed', x.k === k ? 'true' : 'false'); }); applyFill(); }

    /* ===================== STAPPEN ===================== */
    function panel(title, count) {
      var p = el('div', 'dx-panel2');
      var h = el('div', 'dx-phead');
      h.innerHTML = '<span>' + title + '</span>' + (count ? '<span class="dx-count">' + count + '</span>' : '');
      p.appendChild(h); return p;
    }
    function chipRow(opts, current, onpick) {
      var wrap = el('div', 'dx-chips'); var btns = [];
      opts.forEach(function (o) {
        var b = el('button', 'dx-chip', { type: 'button', 'aria-pressed': o === current ? 'true' : 'false' });
        b.textContent = o;
        b.addEventListener('click', function () { btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); onpick(o); });
        wrap.appendChild(b); btns.push(b);
      });
      return wrap;
    }
    // keuzelijst van Drutex-opties: foto (indien aanwezig) + naam (verbatim) + detail. één-keuze.
    // onHover (optioneel): voor het grote glas-voorbeeld in het preview-paneel.
    function optionList(items, isOn, onpick, onHover) {
      var wrap = el('div', 'dx-optlist'); var btns = [];
      items.forEach(function (it) {
        var b = el('button', 'dx-opt', { type: 'button', 'aria-pressed': isOn(it) ? 'true' : 'false' });
        var thumb = it.img ? '<img class="dx-opt-thumb" src="' + it.img + '" alt="" loading="lazy">'
          : (it.swatch ? '<span class="dx-opt-thumb" style="background:' + it.swatch + ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)"></span>' : '');
        b.innerHTML = thumb
          + '<span class="dx-opt-txt"><span class="dx-opt-name">' + it.name + '</span>'
          + (it.detail ? '<span class="dx-opt-det">' + it.detail + '</span>' : '') + '</span>';
        b.addEventListener('click', function () { btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); onpick(it); });
        if (onHover) {
          b.addEventListener('mouseenter', function () { onHover(it); });
          b.addEventListener('focus', function () { onHover(it); });
        }
        wrap.appendChild(b); btns.push(b);
      });
      // mouseleave op de hele lijst (niet per optie) → geen geflikker bij het bewegen tussen opties
      if (onHover) wrap.addEventListener('mouseleave', function () { onHover(null); });
      return wrap;
    }
    // uniek label per optie (naam + detail) — varianten met dezelfde naam maar andere kleur/maat
    // (bv. "Swisspacer Ultimate" × 6 RAL) blijven los selecteerbaar.
    function optLabel(it) { return it.name + (it.detail ? ' — ' + it.detail : ''); }

    var steps = [];           // { key, label, el }
    var maatStep = null, ovStep = null;
    var colorBtns = [], fillBtns = [], appBtns = [], checkEl = null, glazBtns = [];

    // -- Afmetingen (min/max uit de Drutex-catalogus indien beschikbaar) --
    (function () {
      var p = panel('Afmetingen');
      var lim = el('p', 'dx-hint'); lim.style.margin = '0 0 10px';
      lim.textContent = 'Breedte ' + wmin + '–' + wmax + ' mm · hoogte ' + hmin + '–' + hmax + ' mm.';
      p.appendChild(lim);
      var sizeWrap = el('div', 'dx-size');
      function sizeRow(label, val, min, max, set) {
        var row = el('div', 'dx-size-row'); var lab = el('div', 'dx-size-lab');
        var sp = el('span'); sp.textContent = label;
        var num = el('input', null, { type: 'number', min: min, max: max, step: 10, value: val });
        lab.appendChild(sp); lab.appendChild(num);
        var rng = el('input', null, { type: 'range', min: min, max: max, step: 10, value: val });
        row.appendChild(lab); row.appendChild(rng); sizeWrap.appendChild(row);
        function on(v) { set(clamp(v, min, max)); num.value = rng.value = (label[0] === 'B' ? W : H); }
        rng.addEventListener('input', function () { on(rng.value); });
        num.addEventListener('input', function () { on(num.value); });
      }
      sizeRow('Breedte (mm)', W, wmin, wmax, function (v) { W = v; dimsVisible = true; ensureStill(); drawSchema(); refreshOverview(); });
      sizeRow('Hoogte (mm)', H, hmin, hmax, function (v) { H = v; dimsVisible = true; ensureStill(); drawSchema(); refreshOverview(); });
      p.appendChild(sizeWrap);
      checkEl = el('div', 'dx-check'); p.appendChild(checkEl);
      maatStep = { key: 'maat', label: 'Afmetingen', el: p };
    })();

    // ── Onze model-eigen stappen — alleen voor niet-PVC (aluminium/hout). ──
    // PVC (IGLO) gebruikt de officiele Drutex-catalogus verderop (1:1 stappen).
    if (!konf) {
    // -- Indeling & opening (ramen & schuif) — schematisch, gaat mee in de offerte --
    if (hasIndeling) {
      var pdv = panel('Indeling & opening');
      var dh = el('p', 'dx-hint'); dh.style.margin = '0 0 10px';
      dh.textContent = 'Kies indeling en per vak de opening. Schematisch (geen echte foto) — gaat mee in uw offerteaanvraag.';
      pdv.appendChild(dh);
      var dvgrid = el('div', 'dx-divgrid'); var dvBtns = [];
      var openWrap = el('div', 'dx-openwrap');   // per-vak openingen, herbouwd bij indelingswissel

      function buildOpenings() {
        openWrap.innerHTML = '';
        var hd = el('div', 'dx-subh'); hd.textContent = 'Opening per vak'; openWrap.appendChild(hd);
        curDiv.vakken.forEach(function (vk, i) {
          var row = el('div', 'dx-openrow');
          var lab = el('span', 'dx-openvak'); lab.textContent = 'Vak ' + (i + 1); row.appendChild(lab);
          var chips = el('div', 'dx-openchips');
          OPENINGS.forEach(function (o) {
            var b = el('button', 'dx-openchip', { type: 'button', 'aria-pressed': cfg.openings[i] === o.key ? 'true' : 'false' });
            b.textContent = o.short;
            b.addEventListener('click', function () {
              chips.querySelectorAll('.dx-openchip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
              b.setAttribute('aria-pressed', 'true'); cfg.openings[i] = o.key; drawDivisionPreview(); refreshOverview();
            });
            chips.appendChild(b);
          });
          row.appendChild(chips); openWrap.appendChild(row);
        });
      }
      function setDivision(d) {
        curDiv = d; cfg.indeling = d.label;
        cfg.openings = d.vakken.map(function (_, i) { return i === 0 ? 'dk-r' : 'vast'; });
        dvBtns.forEach(function (x, j) { x.setAttribute('aria-pressed', DIVISIONS[j].key === d.key ? 'true' : 'false'); });
        buildOpenings(); drawDivisionPreview(); refreshOverview();
      }
      DIVISIONS.forEach(function (d) {
        var b = el('button', 'dx-divbtn', { type: 'button', 'aria-pressed': d.key === curDiv.key ? 'true' : 'false', title: d.label });
        b.innerHTML = '<span class="dx-divico">' + divisionSVG(d, 100, 100) + '</span><span class="dx-divlab">' + d.label + '</span>';
        b.addEventListener('click', function () { setDivision(d); });
        dvgrid.appendChild(b); dvBtns.push(b);
      });
      pdv.appendChild(dvgrid); pdv.appendChild(openWrap); buildOpenings();
      steps.push({ key: 'indeling', label: 'Indeling', el: pdv });
    }

    // -- Kleur --
    (function () {
      if (!colors.length) {
        var pn = panel('Kleur');
        var note = el('p', 'dx-hint'); note.style.margin = '0';
        note.textContent = 'Voor dit model is geen kleurkiezer beschikbaar — kleur/uitvoering op aanvraag.';
        pn.appendChild(note); steps.push({ key: 'kleur', label: 'Kleur', el: pn }); return;
      }
      var p = panel(dual ? 'Kleur binnen' : ('Kleur' + (mode === 'ral' ? ' (RAL)' : '')), colors.length + ' kleuren');
      var grid = el('div', 'dx-swatches');
      colors.forEach(function (c, i) {
        var label = NL(c.name) + (c.code ? ' · ' + NL(c.code) : '');
        var b = el('button', 'dx-sw', { type: 'button', 'aria-pressed': 'false', title: label, 'aria-label': label });
        if (mode === 'ral') b.style.background = c.hex;
        else if (/\/renders\//.test(c.swatch || '')) {
          // Drutex mist de echte kleurstaal (bestand ontbreekt) → géén venster-render tonen,
          // maar een vlakke kleur (gemiddelde uit het render-beeld, bv. wit voor "Biały Ulti-Matt").
          (function (btn) { sampleColor(c.swatch, function (hex) { btn.style.background = hex; }); })(b);
        } else b.style.backgroundImage = 'url("' + c.swatch + '")';
        b.addEventListener('click', function () { selectColor(i); });
        grid.appendChild(b); colorBtns.push(b);
      });
      p.appendChild(grid); steps.push({ key: 'kleur', label: dual ? 'Kleur binnen' : 'Kleur', el: p });
    })();

    // -- Kleur buiten (aluminium · RAL) — alleen drewniano-aluminiowe --
    if (dual && RAL.length) {
      var pob = panel('Kleur buiten (aluminium · RAL)', RAL.length + ' kleuren');
      var hintob = el('p', 'dx-hint'); hintob.style.margin = '0 0 10px'; hintob.textContent = 'RAL-kleur voor de aluminium buitenzijde (rechterbeeld).';
      pob.appendChild(hintob);
      var grido = el('div', 'dx-swatches');
      RAL.forEach(function (c) {
        var label = c.name + (c.code ? ' · ' + c.code : '');
        var b = el('button', 'dx-sw', { type: 'button', 'aria-pressed': 'false', title: label, 'aria-label': label });
        b.style.background = c.hex;
        b.addEventListener('click', function () {
          grido.querySelectorAll('.dx-sw').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true'); selectOuter(c);
        });
        grido.appendChild(b);
      });
      pob.appendChild(grido); steps.push({ key: 'kleur-buiten', label: 'Kleur buiten', el: pob });
    }

    // -- Paneel / vulling (deuren) --
    if (type === 'door' && m.fills && m.fills.length) {
      var p = panel('Paneel / vulling', m.fills.length + ' patronen');
      var hasCz = m.fills.some(function (f) { return f.apps.czarny; });
      if (hasCz) {
        var applic = el('div', 'dx-applic');
        [{ k: 'inox', l: 'Inox / wit' }, { k: 'czarny', l: 'Zwart' }].forEach(function (a) {
          var b = el('button', 'dx-chip', { type: 'button', 'aria-pressed': a.k === 'inox' ? 'true' : 'false' });
          b.textContent = a.l; b.addEventListener('click', function () { setApp(a.k); });
          applic.appendChild(b); appBtns.push({ k: a.k, b: b });
        });
        p.appendChild(applic);
      }
      var fgrid = el('div', 'dx-fills');
      m.fills.forEach(function (f, i) {
        var b = el('button', 'dx-fill', { type: 'button', 'aria-pressed': 'false', title: f.name });
        b.style.backgroundImage = 'url("' + (f.apps.inox || f.apps.czarny) + '")';
        b.innerHTML = '<span class="dx-fillnum">' + f.n + '</span>';
        b.addEventListener('click', function () { selectFill(i); });
        fgrid.appendChild(b); fillBtns.push(b);
      });
      p.appendChild(fgrid); steps.push({ key: 'vulling', label: 'Paneel', el: p });
    }

    // -- Beglazing / glas — uit de Drutex-glassoorten (+ standaard glaspakket verbatim) --
    if ((opt.glas && opt.glas.length) || stdGlas) {
      var pg = panel('Beglazing / glas', (opt.glas && opt.glas.length) ? (opt.glas.length + 1) + ' opties' : '');
      if (stdGlas) { var sn = el('p', 'dx-hint'); sn.style.margin = '0 0 10px'; sn.innerHTML = '<b>Standaard pakket:</b> ' + NL(stdGlas); pg.appendChild(sn); }
      var glasItems = [{ name: 'Standaard', detail: '', img: null }].concat((opt.glas || []).map(function (g) {
        return { name: NL(g.name), detail: '', img: g.img || null };
      }));
      selGlas = glasItems[0];
      var hint = el('p', 'dx-hint'); hint.style.margin = '0 0 10px'; hint.textContent = 'Beweeg over een glassoort voor een groot voorbeeld; klik om te kiezen.';
      pg.appendChild(hint);
      pg.appendChild(optionList(glasItems,
        function (it) { return it.name === cfg.glas; },
        function (it) { cfg.glas = it.name; selGlas = it; glassZoom(it); refreshOverview(); },
        // "sticky": hover een glas-met-foto → tonen; hover een veld zonder foto (Standaard/leeg) → niets;
        // lijst verlaten → terug naar gekozen enkel als die een foto heeft (anders blijft het laatste staan → geen geflikker)
        function (it) { if (it) { if (it.img) glassZoom(it); } else if (selGlas && selGlas.img) glassZoom(selGlas); }));
      steps.push({ key: 'glas', label: 'Glas', el: pg, getZoom: function () { return selGlas; } });
    }

    // -- Dichting (kleur) — Drutex standaard: zwart of grijs --
    if (dichtingKeuze) {
      var pdc = panel('Dichting (kleur)');
      var dch = el('p', 'dx-hint'); dch.style.margin = '0 0 10px'; dch.textContent = 'Kleur van de afdichtingsrubbers (omloop, beglazing, centraal).';
      pdc.appendChild(dch);
      pdc.appendChild(chipRow(['Zwart', 'Grijs'], cfg.dichting, function (v) { cfg.dichting = v; refreshOverview(); }));
      steps.push({ key: 'dichting', label: 'Dichting', el: pdc });
    }

    // -- keuzestappen uit de Drutex-blokken: Szprosy→Roede, Wentylacje→Ventilatie, Progi→Dorpel, Ramki→Afstandhouder, Okucia→Beslag --
    var infoBoxes = [];
    (opt.boxes || []).forEach(function (box) {
      var mapd = BOX_STEPS[box.title];
      if (!mapd) { infoBoxes.push(box); return; }           // onbekend blok → read-only "Drutex-uitrusting"
      var items = box.items.map(function (it) { return { name: NL(it.name), detail: NL(it.detail || ''), img: it.img }; });
      if (mapd.none) items = [{ name: mapd.none, detail: '' }].concat(items);
      var lab = mapd.label;
      cfg.sel[lab] = items[0] ? optLabel(items[0]) : '—';
      var boxSel = items[0] || null;   // gekozen item → groot voorbeeld
      var pb = panel(lab, box.items.length + ' opties');
      if (items.some(function (it) { return it.img; })) {
        var bh = el('p', 'dx-hint'); bh.style.margin = '0 0 10px'; bh.textContent = 'Beweeg over een optie voor een groot voorbeeld; klik om te kiezen.'; pb.appendChild(bh);
      }
      pb.appendChild(optionList(items,
        function (it) { return optLabel(it) === cfg.sel[lab]; },
        function (it) { cfg.sel[lab] = optLabel(it); boxSel = it; glassZoom(it); refreshOverview(); },
        function (it) { if (it) { if (it.img) glassZoom(it); } else if (boxSel && boxSel.img) glassZoom(boxSel); }));
      steps.push({ key: 'box-' + lab, label: lab, el: pb, getZoom: function () { return boxSel; } });
    });

    // -- Kruk / greep --
    if (m.handles && m.handles.length) {
      var hLabel = type === 'door' ? 'Deurkruk / greep' : (type === 'sliding' ? 'Greep' : 'Kruk');
      var ph = panel(hLabel, m.handles.length + ' opties');
      var hgrid = el('div', 'dx-handles'); var hcap = el('div', 'dx-handle-cap');
      var krukSel = null;   // gekozen kruk → groot voorbeeld
      m.handles.forEach(function (h) {
        var hn = NL(h.name);
        var item = { name: hn, detail: '', img: h.img };
        var b = el('button', 'dx-handle', { type: 'button', 'aria-pressed': 'false', title: hn });
        b.style.backgroundImage = 'url("' + h.img + '")';
        b.addEventListener('click', function () {
          hgrid.querySelectorAll('.dx-handle').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true'); hcap.textContent = hn; cfg.kruk = hn; krukSel = item; glassZoom(item); refreshOverview();
        });
        b.addEventListener('mouseenter', function () { glassZoom(item); });
        b.addEventListener('focus', function () { glassZoom(item); });
        hgrid.appendChild(b);
      });
      // mouseleave op de hele grid (niet per kruk) → terug naar gekozen, geen geflikker tijdens het bewegen
      hgrid.addEventListener('mouseleave', function () { if (krukSel) glassZoom(krukSel); });
      var hh2 = el('p', 'dx-hint'); hh2.style.margin = '0 0 10px'; hh2.textContent = 'Beweeg over een kruk/greep voor een groot voorbeeld; klik om te kiezen.';
      ph.appendChild(hh2); ph.appendChild(hgrid); ph.appendChild(hcap);
      steps.push({ key: 'kruk', label: hLabel, el: ph, getZoom: function () { return krukSel; } });
    }
    } // ── einde model-eigen stappen (!konf) ──

    // ── Catalogus-gedreven stappen (1:1 Drutex) voor PVC-modellen ──
    function konfStep(fg) {
      var label = fg.name;
      // omschrijving alleen tonen als die volledig NL/neutraal is (geen Pools) — anders enkel de naam
      function cleanNL(s) {
        if (!s) return '';
        if (/[ąćęłńóśźż]/i.test(s)) return '';
        if (/\b(kt[oó]re|widoku|mi[eę]dzy|progiem|nadpro[zż]|skrzyd|szyb|okno|okna|drzwi|oraz|jest|dla|przy|jako|wraz|naklejan|wewn|zewn|uszczel|kolor|bia[lł])\b/i.test(s)) return '';
        return s.length <= 80 ? s : '';
      }
      // producttype-beschrijving: volledige (vertaalde) tekst tonen — bv. "Raam vierdelig,
      // buitenste vleugels niet te openen, … patio links schuift naar links, …". Alleen als
      // er geen Pools meer in zit (anders niets, nooit Pools tonen).
      function ptDesc(s) {
        s = String(s || '').trim();
        if (!s || /[ąćęłńóśźż]/i.test(s)) return '';
        if (/\b(komorow|profil|gwaran|urz[aą]dz|s[lł]u[zż]|przed|wraz|oraz|jako|dla|przy|kt[oó]re|naszego|udzia|wybran|pozycj|odrygl|przewod|domykan|skrzyd|drzwi|okno|okna|szyb|kolor|bia[lł]|naklejan|widok|mi[eę]dzy|nadpro|zewn|wewn)\b/i.test(s)) return '';
        return s.length > 220 ? s.slice(0, 217) + '…' : s;
      }
      var COLORG = { ProductColor: 1, KolorRamekMiedzySzybami: 1, SzprosKolor: 1, UszczelkaKolor: 1 };
      var isColor = !!COLORG[fg.identity];
      var allItems = fg.elements.filter(function (e) {
        // "Wit" uit de raamkleur-stap verwijderen (op verzoek)
        return !(fg.identity === 'ProductColor' && (e.identity === 'ProductColor__KolorBialy' || e.name === 'Wit'));
      }).map(function (e) {
        var img = realImg(e.image) || (isColor ? swatchFromName(e.name) : null);   // echte Drutex-kleurstaal voor kleuren
        var det = ptDesc(e.desc);   // volledige NL-omschrijving tonen (leeg als er nog Pools in zou staan)
        return { name: e.name, detail: det, img: img, swatch: (!img && isColor) ? hexFromName(e.name) : null, identity: e.identity };
      });
      // Niet-kleurstappen met foto's: opties ZONDER foto verwijderen (bv. klamken zonder beeld).
      // Stappen waar geen enkele optie een foto heeft, blijven gewoon als tekstkeuze staan.
      if (!isColor) {
        var withImg = allItems.filter(function (it) { return it.img; });
        if (withImg.length && withImg.length < allItems.length) allItems = withImg;
      }
      // dubbele namen weghalen (zelfde kruk/optie staat soms meerdere keren in de catalogus)
      var _seen = {}; allItems = allItems.filter(function (it) { if (_seen[it.name]) return false; _seen[it.name] = 1; return true; });
      var isPT = (fg.identity === 'ProductType');
      var p = panel(label, allItems.length + (allItems.length === 1 ? ' optie' : ' opties'));
      var countEl = p.querySelector('.dx-count');
      if (allItems.some(function (it) { return it.img; })) {
        var bh = el('p', 'dx-hint'); bh.style.margin = '0 0 10px';
        bh.textContent = 'Beweeg over een optie voor een groot voorbeeld; klik om te kiezen.'; p.appendChild(bh);
      }
      var listWrap = el('div'); p.appendChild(listWrap);
      var sel = allItems[0] || null;
      cfg.sel[label] = sel ? sel.name : '—';
      // Producttype: alleen de types tonen die bij het gekozen aantal rijen horen
      // (1 rij → enkel 1-rij types, 2 rijen → 2-rij types, enz.). Standaard 1 rij.
      function curItems() {
        if (!isPT) return allItems;
        var bt = gc.dimModels && gc.dimModels.byType; if (!bt) return allItems;
        // alleen op rij-aantal filteren als "aantal rijen" een echte keuzestap is (ramen/balkon);
        // bij deuren/schuif bepaalt het type zelf de indeling → toon alle types
        if (gc.stepsOrder.indexOf('IloscRzedow') < 0) return allItems;
        var ir = cfg.ids['IloscRzedow'], rc = (ir && /(\d)Rzedy/i.exec(ir)) ? parseInt(RegExp.$1, 10) : 1;
        var f = allItems.filter(function (it) { var mm = bt[it.identity]; return mm && mm.rows && mm.rows.length === rc; });
        return f.length ? f : allItems;
      }
      function renderList() {
        var items = curItems();
        if (countEl) countEl.textContent = items.length + (items.length === 1 ? ' optie' : ' opties');
        if (!sel || items.indexOf(sel) < 0) {                 // huidige keuze niet (meer) zichtbaar → eerste zichtbare
          var keep = items.filter(function (it) { return it.name === cfg.sel[label]; })[0];
          sel = keep || items[0] || null;
          if (sel) { cfg.sel[label] = sel.name; if (isPT) cfg.ids[fg.identity] = sel.identity; }
        }
        listWrap.innerHTML = '';
        listWrap.appendChild(optionList(items,
          function (it) { return it.name === cfg.sel[label]; },
          function (it) { cfg.sel[label] = it.name; cfg.ids[fg.identity] = it.identity; sel = it; if (it.img) glassZoom(it); refreshOverview(); },
          function (it) { if (it) { if (it.img) glassZoom(it); } else if (sel && sel.img) glassZoom(sel); }));
      }
      renderList();
      var step = { key: 'konf-' + fg.identity, label: label, el: p, getZoom: function () { return sel; } };
      if (isPT) step.onShow = renderList;   // herfilter wanneer het aantal rijen wijzigt
      return step;
    }
    // Dynamische maatstap: vraagt de exacte maatstructuur 1:1 op bij Drutex voor de
    // gekozen configuratie (rijen/type/voet) → per-rij hoogtes, juiste ranges. Werkt
    // automatisch voor ELK PVC-model, want het wordt live per configuratie opgehaald.
    // PVC-maatstap: gebruikt de vooraf 1:1 opgehaalde maatstructuur (per producttype,
    // anders per rij-aantal). Toont breedte + een hoogte per rij ("Hoogte - rij N") met
    // de echte Drutex-ranges. Geen live-afhankelijkheid → werkt altijd, ook op productie.
    function konfDimsStep() {
      var p = panel('Afmetingen');
      var info = el('p', 'dx-hint'); info.style.margin = '0 0 10px';
      var body = el('div', 'dx-size');
      var ck = el('div', 'dx-check');
      p.appendChild(info); p.appendChild(body); p.appendChild(ck);
      function numRow(label, val, min, max, onset) {
        var row = el('div', 'dx-size-row'); var lab = el('div', 'dx-size-lab');
        var sp = el('span'); sp.textContent = label + ' (' + min + '–' + max + ' mm)';
        var num = el('input', null, { type: 'number', min: min, max: max, step: 5, value: val });
        lab.appendChild(sp); lab.appendChild(num);
        var rng = el('input', null, { type: 'range', min: min, max: max, step: 5, value: val });
        row.appendChild(lab); row.appendChild(rng); body.appendChild(row);
        function on(v) { v = clamp(v, min, max); num.value = rng.value = v; onset(v); }
        rng.addEventListener('input', function () { on(rng.value); });
        num.addEventListener('input', function () { on(num.value); });
      }
      // het juiste maatmodel: exact per gekozen producttype, anders op rij-aantal, anders 1-rij
      function pickModel() {
        var dm = (gc && gc.dimModels) || { byType: {}, byRows: {} };
        var t = cfg.ids['ProductType'];
        if (t && dm.byType && dm.byType[t]) return dm.byType[t];
        var ir = cfg.ids['IloscRzedow'], rc = (ir && /(\d)Rzedy/i.exec(ir)) ? parseInt(RegExp.$1, 10) : null;
        if (rc && dm.byRows && dm.byRows[rc]) return dm.byRows[rc];
        if (dm.byRows && dm.byRows[1]) return dm.byRows[1];
        var ks = dm.byType ? Object.keys(dm.byType) : [];
        return ks.length ? dm.byType[ks[0]] : null;
      }
      function recompute() {
        if (!cfg.dims) return;
        if (cfg.dims.cols && cfg.dims.cols.length) W = cfg.dims.cols.reduce(function (a, c) { return a + (c.w || 0); }, 0) || W;
        else if (cfg.dims.width) W = cfg.dims.width;
        var tot = cfg.dims.rows.reduce(function (a, r) { return a + (r.h || 0); }, 0); if (tot) H = tot;
        dimsVisible = true; ensureStill(); drawSchema();
        ck.className = 'dx-check ok'; ck.textContent = '✓ Maten ingevuld — totaal ' + W + ' × ' + H + ' mm';
        refreshOverview();
      }
      function build() {
        body.innerHTML = '';
        var mdl = pickModel();
        if (!mdl) {                                            // geen model → eenvoudige breedte + hoogte
          info.textContent = 'Breedte en hoogte van het kozijn (mm).';
          cfg.dims = { width: clamp(W, wmin, wmax), rows: [{ label: 'Hoogte', h: clamp(H, hmin, hmax) }] };
          numRow('Breedte', cfg.dims.width, wmin, wmax, function (v) { cfg.dims.width = v; recompute(); });
          numRow('Hoogte', cfg.dims.rows[0].h, hmin, hmax, function (v) { cfg.dims.rows[0].h = v; recompute(); });
          recompute(); return;
        }
        var wr = (mdl.widthRange && mdl.widthRange.max) ? mdl.widthRange : { min: wmin, max: wmax };
        // statisch Drutex-beeld van het gekozen (of representatieve) producttype + rij-proporties
        var _PT = gc.featureGroups.ProductType, _t = cfg.ids['ProductType'];
        if (!_t && _PT && gc.dimModels && gc.dimModels.byType) {
          var _bt = gc.dimModels.byType, _rc = mdl.rows.length;
          for (var _tk in _bt) { if (_bt[_tk].rows && _bt[_tk].rows.length === _rc) { _t = _tk; break; } }
        }
        var ptImg = '';
        if (_t && _PT) { var _pe = _PT.elements.filter(function (x) { return x.identity === _t; })[0]; if (_pe) ptImg = realImg(_pe.image) || ''; }
        var sh0 = mdl.rows.reduce(function (a, r) { return a + (r.h0 || r.minH || 1); }, 0) || 1;
        var schemaRows = mdl.rows.map(function (r) { return (r.h0 || r.minH || 1) / sh0; });
        // vorm-layout (rijen × cellen + opening) voor het scherpe vector-schema
        var layout = { rows: mdl.rows.map(function (r, i) {
          var cs = (r.cells && r.cells.length) ? r.cells : [{ w: 1, op: null }];
          var tw = cs.reduce(function (a, c) { return a + (c.w || 1); }, 0) || 1;
          return { frac: schemaRows[i], cells: cs.map(function (c) { return { frac: (c.w || 1) / tw, op: c.op || null }; }) };
        }) };

        // kolommen uit de rij met de meeste cellen; per-kolom-modus als de breedte-bereiken
        // verschillen (bv. deur + zijlichten: 350-500 vs 800-1200). Anders één totale breedte.
        var colRow = mdl.rows.reduce(function (a, r) { return (r.cells && r.cells.length > ((a.cells || []).length)) ? r : a; }, mdl.rows[0] || { cells: [] });
        var cc = colRow.cells || [];
        // per-sectie breedtes ALLEEN voor entreedeuren (deur + zijlichten staan naast elkaar).
        // Ramen/balkon/schuif/HS gebruiken één totale breedte (+ hoogte per rij) — schuifpanelen
        // overlappen, dus daar is een totale breedte de juiste maat.
        var perCol = konf && konf.group === 'doors' && cc.length > 1 && cc.every(function (c) { return c.minW && c.maxW; });

        if (perCol) {
          info.textContent = 'Vul de breedte van elke sectie en de hoogte in — de nummers op het beeld tonen welke sectie welke is.';
          cfg.dims = { perCol: true, img: ptImg, schemaRows: schemaRows, cols: [], rows: [] };
          cc.forEach(function (c, i) {
            var rec = { label: 'Breedte ' + (i + 1), w: clamp(c.minW, c.minW, c.maxW), frac: c.w || (1 / cc.length) }; cfg.dims.cols.push(rec);
            numRow('Breedte ' + (i + 1), rec.w, c.minW, c.maxW, function (v) { rec.w = v; recompute(); });
          });
          mdl.rows.forEach(function (r, i) {
            var lbl = (mdl.rows.length > 1) ? NL(r.label || ('Hoogte rij ' + (i + 1))) : 'Hoogte';
            var rec = { label: lbl, h: clamp(r.minH, r.minH, r.maxH), frac: schemaRows[i] }; cfg.dims.rows.push(rec);
            numRow(lbl, rec.h, r.minH, r.maxH, function (v) { rec.h = v; recompute(); });
          });
          recompute(); return;
        }

        info.textContent = (mdl.rows.length > 1)
          ? ('Vul de breedte in en de hoogte van elke rij (' + mdl.rows.length + ' rijen) — het venster links toont welke maat welke is.')
          : 'Breedte en hoogte van het kozijn (mm).';
        cfg.dims = { width: clamp(W, wr.min, wr.max), img: ptImg, schemaRows: schemaRows, rows: [] };
        numRow('Breedte', cfg.dims.width, wr.min, wr.max, function (v) { cfg.dims.width = v; recompute(); });
        mdl.rows.forEach(function (r, i) {
          var lbl = NL(r.label || ('Hoogte rij ' + (i + 1)));
          var hv = clamp(Math.round(H / mdl.rows.length), r.minH, r.maxH);
          var rec = { label: lbl, h: hv }; cfg.dims.rows.push(rec);
          numRow(lbl, hv, r.minH, r.maxH, function (v) { rec.h = v; recompute(); });
        });
        recompute();
      }
      return { key: 'maat', label: 'Afmetingen', el: p, onShow: build };
    }
    function buildKonfSteps() {
      // niet tonen: model (al gekozen), overzicht (doen we zelf), en de lege tekststappen
      // "Uitsparing onderdorpel" + "Koppelstukken" (op verzoek verwijderd)
      var SKIP = { Material: 1, ProductSummary: 1, WycieciePodparapetowe: 1, Connectors: 1, DodatkowyZawias: 1, 'Łącznik': 1, Zasuwnica: 1, DwaZamki: 1 };
      var out = [], hasDims = false;
      gc.stepsOrder.forEach(function (id) {
        if (id === 'ProductDimensions') { out.push(konfDimsStep()); hasDims = true; return; }
        if (SKIP[id]) return;
        var fg = gc.featureGroups[id];
        if (!fg || !fg.elements || !fg.elements.length) return;
        out.push(konfStep(fg));
      });
      if (!hasDims) out.unshift(konfDimsStep());   // dims ontbrak in volgorde → vooraan
      return out;
    }

    // Maatstap voor aluminium/hout (niet-PVC): per sectie van de gekozen vorm.
    // Bij een indeling met meerdere kolommen/rijen krijgt de klant een breedte per
    // kolom (links/midden/rechts) en een hoogte per rij (boven/onder), met labels +
    // schema zodat duidelijk is welke maat welke is. Gaat zo 1-op-1 naar de fabriek.
    function customDimsStep() {
      var SMIN = 300, SMAXW = 1600, SMAXH = 2600;   // sectie-limieten (Drutex-vleugel)
      var p = panel('Afmetingen');
      var info = el('p', 'dx-hint'); info.style.margin = '0 0 10px';
      var body = el('div', 'dx-size');
      var ck = el('div', 'dx-check');
      p.appendChild(info); p.appendChild(body); p.appendChild(ck);
      function numRow(label, val, min, max, onset) {
        var row = el('div', 'dx-size-row'); var lab = el('div', 'dx-size-lab');
        var sp = el('span'); sp.textContent = label + ' (' + min + '–' + max + ' mm)';
        var num = el('input', null, { type: 'number', min: min, max: max, step: 5, value: val });
        lab.appendChild(sp); lab.appendChild(num);
        var rng = el('input', null, { type: 'range', min: min, max: max, step: 5, value: val });
        row.appendChild(lab); row.appendChild(rng); body.appendChild(row);
        function on(v) { v = clamp(v, min, max); num.value = rng.value = v; onset(v); }
        rng.addEventListener('input', function () { on(rng.value); });
        num.addEventListener('input', function () { on(num.value); });
      }
      function checkProducible() {
        var maxW = 0, maxH = 0;
        cfg.dims.cols.forEach(function (c) { maxW = Math.max(maxW, c.w); });
        cfg.dims.rows.forEach(function (r) { maxH = Math.max(maxH, r.h); });
        var warn = [];
        if (maxW > SMAXW) warn.push('sectie te breed (' + maxW + ' > ' + SMAXW + ')');
        if (maxH > SMAXH) warn.push('sectie te hoog (' + maxH + ' > ' + SMAXH + ')');
        if (warn.length) { ck.className = 'dx-check warn'; ck.textContent = '⚠ ' + warn.join(' · '); }
        else { ck.className = 'dx-check ok'; ck.textContent = '✓ Maten per sectie ingevuld — totaal ' + W + ' × ' + H + ' mm'; }
      }
      function recompute() {
        W = cfg.dims.cols.reduce(function (a, c) { return a + c.w; }, 0) || W;
        H = cfg.dims.rows.reduce(function (a, r) { return a + r.h; }, 0) || H;
        dimsVisible = true; ensureStill(); drawSchema(); checkProducible(); refreshOverview();   // schema blijft statisch
      }
      function build() {
        var g = (hasIndeling && curDiv) ? dividerGrid(curDiv) : { cols: [1], rows: [1] };
        var nc = g.cols.length, nr = g.rows.length;
        var cl = posLabels(nc, 'col'), rl = posLabels(nr, 'row');
        info.textContent = (nc > 1 || nr > 1)
          ? ('Vul de maat van elke sectie in. ' + (nc > 1 ? nc + ' breedtes' : '1 breedte') + ' × ' + (nr > 1 ? nr + ' hoogtes' : '1 hoogte') + ' — het venster links toont welke maat welke is.')
          : 'Breedte en hoogte van het kozijn (mm).';
        body.innerHTML = '';
        cfg.dims = { cols: [], rows: [] };
        g.cols.forEach(function (frac, i) {
          var w = clamp(Math.round(W * frac), SMIN, SMAXW);
          var rec = { label: 'Breedte' + (cl[i] ? ' ' + cl[i] : ''), w: w }; cfg.dims.cols.push(rec);
          numRow(rec.label, w, SMIN, SMAXW, function (v) { rec.w = v; recompute(); });
        });
        g.rows.forEach(function (frac, j) {
          var h = clamp(Math.round(H * frac), SMIN, SMAXH);
          var rec = { label: 'Hoogte' + (rl[j] ? ' ' + rl[j] : ''), h: h }; cfg.dims.rows.push(rec);
          numRow(rec.label, h, SMIN, SMAXH, function (v) { rec.h = v; recompute(); });
        });
        recompute();
      }
      return { key: 'maat', label: 'Afmetingen', el: p, onShow: build, isCustomDims: true };
    }

    // -- Overzicht & aanvraag --
    var ovBody = el('div', 'dx-ov');
    (function () {
      var p = panel('Overzicht & aanvraag');
      p.appendChild(ovBody);

      // contactgegevens → echte offerteaanvraag (wordt per e-mail naar Creditline Montage gestuurd)
      var fh = el('div', 'dx-subh'); fh.textContent = 'Vraag uw offerte aan'; fh.style.marginTop = '14px'; p.appendChild(fh);
      var form = el('div', 'dx-form');
      function field(label, type, req) {
        var w = el('label', 'dx-field');
        var sp = el('span', 'dx-field-lab'); sp.textContent = label + (req ? ' *' : '');
        var inp = (type === 'textarea') ? el('textarea', 'dx-input', { rows: '2' }) : el('input', 'dx-input', { type: type });
        w.appendChild(sp); w.appendChild(inp); form.appendChild(w); return inp;
      }
      var fNaam = field('Naam', 'text', true), fMail = field('E-mail', 'email', true);
      var fTel = field('Telefoon', 'tel', false), fOpm = field('Opmerking', 'textarea', false);
      var hp = el('input', null, { type: 'text', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' });
      hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0'; form.appendChild(hp);
      p.appendChild(form);

      var btn = el('button', 'dx-cta', { type: 'button' }); btn.textContent = 'Vraag vrijblijvend offerte aan';
      var status = el('p', 'dx-formstatus');
      btn.addEventListener('click', function () { sendRequest({ naam: fNaam, email: fMail, tel: fTel, opm: fOpm, hp: hp, btn: btn, status: status }); });
      p.appendChild(btn); p.appendChild(status);
      var note = el('p', 'dx-hint'); note.style.marginTop = '10px';
      note.textContent = 'Prijs op aanvraag — u ontvangt een vrijblijvende offerte op maat. Geen verplichtingen.';
      p.appendChild(note);
      ovStep = {
        key: 'overzicht', label: 'Overzicht & aanvraag', el: p,
        getZoom: function () {   // in het overzicht het gekozen producttype-schema tonen (niet het generieke raam)
          if (!gc || !gc.featureGroups.ProductType) return null;
          var PT = gc.featureGroups.ProductType, t = cfg.ids['ProductType'];
          if (!t && gc.dimModels && gc.dimModels.byType) { for (var k in gc.dimModels.byType) { t = k; break; } }
          var e = t ? PT.elements.filter(function (x) { return x.identity === t; })[0] : null;
          return (e && e.image) ? { name: e.name, img: e.image } : null;
        }
      };
    })();

    // ── Stappen samenstellen ──
    // PVC (IGLO): 1:1 Drutex-catalogus in Drutex-volgorde.
    // Aluminium/hout: onze flow in de volgorde kleur → vorm → afmetingen (per sectie) → rest.
    if (konf) {
      steps = buildKonfSteps();
    } else {
      var dimStep = customDimsStep();
      var byKey = {}; steps.forEach(function (s) { byKey[s.key] = s; });
      var FRONT = ['kleur', 'kleur-buiten', 'indeling'];
      var MIDDLE = ['vulling', 'glas', 'dichting'];
      var ordered = [];
      FRONT.forEach(function (k) { if (byKey[k]) ordered.push(byKey[k]); });
      ordered.push(dimStep);                                  // afmetingen direct na de vorm
      MIDDLE.forEach(function (k) { if (byKey[k]) ordered.push(byKey[k]); });
      var used = FRONT.concat(MIDDLE);
      steps.forEach(function (s) { if (used.indexOf(s.key) < 0) ordered.push(s); });   // box-* + kruk
      steps = ordered;
    }
    steps.push(ovStep);

    function summaryRows() {
      if (konf) {   // PVC: alle keuzes komen uit de Drutex-catalogus (cfg.sel) + maten
        var kr = [['Model', m.name + ' (' + m.category + ')']];
        var dd = cfg.dims;
        if (dd && dd.cols && dd.cols.length) {                 // per-sectie breedtes (deuren met zijlichten)
          dd.cols.forEach(function (c) { kr.push([c.label, c.w + ' mm']); });
          if (dd.rows && dd.rows.length === 1) kr.push(['Hoogte', dd.rows[0].h + ' mm']);
          else (dd.rows || []).forEach(function (r) { kr.push([r.label, r.h + ' mm']); });
          kr.push(['Totaal', W + ' × ' + H + ' mm']);
        } else if (dd && dd.rows && dd.rows.length) {
          kr.push(['Breedte', dd.width + ' mm']);
          if (dd.rows.length === 1) kr.push(['Hoogte', dd.rows[0].h + ' mm']);
          else dd.rows.forEach(function (r) { kr.push([r.label, r.h + ' mm']); });
        } else kr.push(['Afmeting', W + ' × ' + H + ' mm']);
        Object.keys(cfg.sel).forEach(function (lab) { kr.push([lab, cfg.sel[lab]]); });
        return kr;
      }
      var rows = [['Model', m.name + ' (' + m.category + ')']];
      if (cfg.dims && (cfg.dims.cols || cfg.dims.rows)) {   // aluminium/hout: maat per sectie
        (cfg.dims.cols || []).forEach(function (c) { rows.push([c.label, c.w + ' mm']); });
        (cfg.dims.rows || []).forEach(function (r) { rows.push([r.label, r.h + ' mm']); });
        if (((cfg.dims.cols || []).length > 1) || ((cfg.dims.rows || []).length > 1)) rows.push(['Totaal', W + ' × ' + H + ' mm']);
      } else {
        rows.push(['Afmeting', W + ' × ' + H + ' mm']);
      }
      if (hasIndeling) {
        rows.push(['Indeling', cfg.indeling || 'Enkel']);
        rows.push(['Opening', (cfg.openings || []).map(function (k, i) { return 'Vak ' + (i + 1) + ': ' + openingLabel(k); }).join(' · ')]);
      }
      if (dual) { rows.push(['Kleur binnen', cfg.kleur]); rows.push(['Kleur buiten (aluminium/RAL)', cfg.kleurBuiten]); }
      else rows.push(['Kleur', cfg.kleur]);
      if (type === 'door' && m.fills && m.fills.length) rows.push(['Paneel', cfg.vulling || '—']);
      if ((opt.glas && opt.glas.length) || stdGlas) rows.push(['Glas', cfg.glas === 'Standaard' ? ('Standaard' + (stdGlas ? ' — ' + NL(stdGlas) : '')) : cfg.glas]);
      if (dichtingKeuze) rows.push(['Dichting', cfg.dichting]);
      // keuzes uit de Drutex-blokken (Roede, Ventilatie, Dorpel, Afstandhouder, Beslag…) in stapvolgorde
      Object.keys(cfg.sel).forEach(function (lab) { rows.push([lab, cfg.sel[lab]]); });
      if (m.handles && m.handles.length) rows.push([type === 'door' ? 'Kruk/greep' : 'Kruk', cfg.kruk]);
      return rows;
    }
    function refreshOverview() {
      ovBody.innerHTML = '';
      summaryRows().forEach(function (r) {
        var row = el('div', 'dx-ovrow');
        row.innerHTML = '<span class="dx-ovk">' + r[0] + '</span><span class="dx-ovv">' + r[1] + '</span>';
        ovBody.appendChild(row);
      });
    }
    function sendRequest(f) {
      if (f.hp.value) return;                                   // honeypot (bot)
      var naam = f.naam.value.trim(), email = f.email.value.trim();
      function err(msg) { f.status.className = 'dx-formstatus err'; f.status.textContent = msg; }
      if (!naam || !email) return err('Vul uw naam en e-mailadres in.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('Vul een geldig e-mailadres in.');
      f.btn.disabled = true; f.status.className = 'dx-formstatus'; f.status.textContent = 'Versturen…';
      var samenvatting = summaryRows().map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
      fetch('/api/offerte', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: naam, email: email, telefoon: f.tel.value.trim(), opmerking: f.opm.value.trim(), samenvatting: samenvatting, model: m.name, website: f.hp.value, elapsed: Date.now() - t0 })
      }).then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); }).then(function (j) {
        if (j && j.ok) {
          f.status.className = 'dx-formstatus ok';
          f.status.textContent = '✓ Bedankt! Uw aanvraag is verzonden — we nemen vrijblijvend contact met u op.';
          f.btn.style.display = 'none';
        } else { f.btn.disabled = false; err((j && j.error) || 'Er ging iets mis. Probeer het later opnieuw.'); }
      }).catch(function () { f.btn.disabled = false; err('Geen verbinding. Probeer het later opnieuw.'); });
    }

    /* ===================== STAP-NAV + layout ===================== */
    var navEl = el('div', 'dx-stepnav');
    var bodyEl = el('div', 'dx-stepbody');
    var active = 0;
    var navBtns = steps.map(function (s, i) {
      var b = el('button', 'dx-stepbtn', { type: 'button' });
      b.innerHTML = '<span class="dx-stepn">' + (i + 1) + '</span><span>' + s.label + '</span>';
      b.addEventListener('click', function () { showStep(i); });
      navEl.appendChild(b); return b;
    });
    var navWrap = el('div', 'dx-navwrap'); navWrap.appendChild(navEl);

    function showStep(i) {
      active = Math.max(0, Math.min(steps.length - 1, i));
      navBtns.forEach(function (b, j) { b.classList.toggle('active', j === active); b.classList.toggle('done', j < active); });
      bodyEl.innerHTML = '';
      bodyEl.appendChild(steps[active].el);
      if (steps[active].onShow) steps[active].onShow();
      if (steps[active].key === 'overzicht') refreshOverview();
      var navrow = el('div', 'dx-stepfoot');
      var prev = el('button', 'dx-btn-ghost', { type: 'button' }); prev.textContent = '‹ Vorige'; prev.disabled = active === 0;
      prev.addEventListener('click', function () { showStep(active - 1); });
      navrow.appendChild(prev);
      if (active < steps.length - 1) {   // op de laatste stap (Overzicht) is de offerte-knop de actie — geen "Klaar"
        var next = el('button', 'dx-btn-dark', { type: 'button' }); next.textContent = 'Volgende ›';
        next.addEventListener('click', function () { showStep(active + 1); });
        navrow.appendChild(next);
      }
      bodyEl.appendChild(navrow);
      glassZoom(steps[active].getZoom ? steps[active].getZoom() : null); // groot voorbeeld op stappen met foto's (glas, ramki, ventilatie, kruk…)
      // op de maatstap tonen we het gelabelde maatschema (rij 1/2/3, links/midden/rechts),
      // op "Indeling" de vorm met openingen
      if (steps[active].key === 'maat' && cfg.dims) { drawDimSchema(); pcard.classList.add('show-schema'); }
      else if (steps[active].key === 'indeling') { drawDivisionPreview(); pcard.classList.add('show-schema'); }
      else pcard.classList.remove('show-schema');
      // maatlijnen-overlay alleen op de Afmetingen-stap (geen "raam met maat" bij kleuren e.d.)
      stage.classList.toggle('dims-on', steps[active].key === 'maat' && dimsVisible);
      if (steps[active].key === 'kleur' && !dimsVisible) { /* laat animatie staan tot keuze */ }
    }

    root.appendChild(navWrap); root.appendChild(preview); root.appendChild(bodyEl);

    // beginstaat
    capName.textContent = m.name;
    drawSchema();
    if (!hasVideo && colors[0]) selectColor(0);
    else if (!hasVideo) { stage.classList.remove('is-video', 'is-color'); render.style.display = 'none';
      var ph = el('div', 'dx-nomedia'); ph.innerHTML = '<span>' + m.name + '</span><span style="font-size:13px;color:var(--dx-muted)">Uitvoering op aanvraag</span>'; stage.appendChild(ph); }
    refreshOverview();
    showStep(0);

    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 600); };
    idle(function () {
      if (mode === 'ral') { if (m.mask) { var im = new Image(); im.src = m.mask; } }
      else colors.forEach(function (c) { var im = new Image(); im.src = c.render; });
    });
  }

  function init() {
    var nodes = document.querySelectorAll('.dx[data-model]');
    Array.prototype.forEach.call(nodes, function (n) {
      if (n.getAttribute('data-dx-mounted')) return;
      n.setAttribute('data-dx-mounted', '1'); mount(n, n.getAttribute('data-model'));
    });
  }
  window.DrutexShowcase = { mount: mount, init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
