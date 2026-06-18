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
    var konf = (function () {
      if (!KONF || !KONF.productGroups) return null;
      if (dual) return null;                          // hout-aluminium: onze dual-weergave + RAL-buiten behouden
      var slug = (modelId || '').toLowerCase();
      if (/(^|[-_])mb-|cor-vision|d-art|monorail|fold-line|aluminium|alu-cover/i.test(slug)) return null;
      if (/softline|duoline|drewnian/i.test(slug)) return null;
      var cat = m.category, grp;
      if (cat === 'Drzwi') grp = 'doors';
      else if (cat === 'Systemy tarasowe') grp = /(^|-)hs(-|$)|hefschuif|monorail/i.test(slug) ? 'HS' : 'suwanki';
      else grp = /balk|balkon|balcony/i.test(slug) ? 'balcony' : 'windows';
      var g = KONF.productGroups[grp]; if (!g || !g.stepsOrder) return null;
      // maatlimieten van het best passende model in deze groep
      var dim = null, lim = g.dimensionLimits || {}, mats = g.featureGroups.Material;
      var key = Object.keys(lim)[0];
      if (mats) mats.elements.forEach(function (e) {
        var nm = (e.name || '').toLowerCase();
        if (/energy/.test(slug) && /energy/.test(nm) && !/classic/.test(slug)) key = e.identity;
        else if (/classic/.test(slug) && /classic/.test(nm)) key = e.identity;
      });
      dim = lim[key] || lim[Object.keys(lim)[0]] || null;
      return { group: grp, gc: g, dim: dim, materialId: (mats ? key : null) };
    })();
    var gc = konf && konf.gc;
    var wmin = WMIN, wmax = WMAX, hmin = HMIN, hmax = HMAX;
    if (konf && konf.dim) { var _d = konf.dim; if (_d.minW) wmin = _d.minW; if (_d.maxW) wmax = _d.maxW; if (_d.minH) hmin = _d.minH; if (_d.maxH) hmax = _d.maxH; }
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
    if (dual) {
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
    function glassZoom(item) {
      if (!item || !item.img) { pcard.classList.remove('show-gz'); return; }
      gzImg.src = item.img; gzCap.textContent = item.name + (item.detail ? ' · ' + item.detail : '');
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
        b.innerHTML = (it.img ? '<img class="dx-opt-thumb" src="' + it.img + '" alt="" loading="lazy">' : '')
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
      var items = fg.elements.map(function (e) {
        return { name: e.name, detail: cleanNL(e.desc), img: e.image || null, identity: e.identity };
      });
      cfg.sel[label] = items[0] ? items[0].name : '—';
      cfg.ids[fg.identity] = items[0] ? items[0].identity : null;   // gekozen feature-id (voor live maatstap)
      var sel = items[0] || null;
      var p = panel(label, fg.elements.length + (fg.elements.length === 1 ? ' optie' : ' opties'));
      if (items.some(function (it) { return it.img; })) {
        var bh = el('p', 'dx-hint'); bh.style.margin = '0 0 10px';
        bh.textContent = 'Beweeg over een optie voor een groot voorbeeld; klik om te kiezen.'; p.appendChild(bh);
      }
      p.appendChild(optionList(items,
        function (it) { return it.name === cfg.sel[label]; },
        function (it) { cfg.sel[label] = it.name; cfg.ids[fg.identity] = it.identity; sel = it; if (it.img) glassZoom(it); refreshOverview(); },
        function (it) { if (it) { if (it.img) glassZoom(it); } else if (sel && sel.img) glassZoom(sel); }));
      return { key: 'konf-' + fg.identity, label: label, el: p, getZoom: function () { return sel; } };
    }
    // Dynamische maatstap: vraagt de exacte maatstructuur 1:1 op bij Drutex voor de
    // gekozen configuratie (rijen/type/voet) → per-rij hoogtes, juiste ranges. Werkt
    // automatisch voor ELK PVC-model, want het wordt live per configuratie opgehaald.
    function konfDimsStep() {
      var p = panel('Afmetingen');
      var info = el('p', 'dx-hint'); info.style.margin = '0 0 10px'; info.textContent = 'Maten laden…';
      var body = el('div', 'dx-size');
      p.appendChild(info); p.appendChild(body);
      var loaded = false, lastSig = '';
      function selMap() { var s = {}; if (konf.materialId) s.Material = konf.materialId; for (var k in cfg.ids) if (cfg.ids[k]) s[k] = cfg.ids[k]; return s; }
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
      function recompute() {
        if (!cfg.dims) return;
        var tot = cfg.dims.rows.reduce(function (a, r) { return a + (r.h || 0); }, 0);
        if (tot) H = clamp(tot, hmin, hmax * cfg.dims.rows.length); W = cfg.dims.width;
        dimsVisible = true; ensureStill(); drawSchema(); refreshOverview();
      }
      function render(d) {
        body.innerHTML = ''; info.style.display = 'none';
        var wr = d.widthRange && d.widthRange.max ? d.widthRange : { min: wmin, max: wmax };
        cfg.dims = { width: clamp(W, wr.min, wr.max), rows: [] };
        numRow('Breedte', cfg.dims.width, wr.min, wr.max, function (v) { cfg.dims.width = v; recompute(); });
        var rws = (d.rows && d.rows.length) ? d.rows : [{ label: 'Hoogte', minH: (d.total && d.total.minHeight) || hmin, maxH: (d.total && d.total.maxHeight) || hmax, h: (d.total && d.total.height) || H }];
        rws.forEach(function (r, i) {
          if (r.minH === r.maxH) return;                       // niet-instelbaar hulpveld (bv. listwa/parapet) → niet tonen
          var lbl = NL(r.label || ('Hoogte rij ' + (i + 1)));
          var hv = clamp(r.h || r.minH, r.minH, r.maxH);
          var rec = { label: lbl, h: hv }; cfg.dims.rows.push(rec);
          numRow(lbl, hv, r.minH, r.maxH, function (v) { rec.h = v; recompute(); });
        });
        if (!cfg.dims.rows.length) cfg.dims.rows.push({ label: 'Hoogte', h: H });
        recompute();
      }
      function fallback() {
        info.style.display = 'none'; body.innerHTML = ''; cfg.dims = null;
        numRow('Breedte', W, wmin, wmax, function (v) { W = v; dimsVisible = true; ensureStill(); drawSchema(); refreshOverview(); });
        numRow('Hoogte', H, hmin, hmax, function (v) { H = v; dimsVisible = true; ensureStill(); drawSchema(); refreshOverview(); });
      }
      function load() {
        var sig = JSON.stringify(selMap());
        if (loaded && sig === lastSig) return;                 // alleen herladen als keuzes wijzigden
        lastSig = sig; loaded = false;
        info.style.display = ''; info.textContent = 'Maten laden…'; body.innerHTML = '';
        fetch('/api/konf/dims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group: konf.group, sel: selMap() }) })
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d && d.ok) { render(d); loaded = true; } else fallback(); })
          .catch(fallback);
      }
      return { key: 'maat', label: 'Afmetingen', el: p, onShow: load };
    }
    function buildKonfSteps() {
      var SKIP = { Material: 1, ProductSummary: 1 };   // model is al gekozen; overzicht doen wij zelf
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
      ovStep = { key: 'overzicht', label: 'Overzicht & aanvraag', el: p };
    })();

    // ── Stappen samenstellen ──
    // PVC (IGLO): 1:1 Drutex-catalogus in Drutex-volgorde. Anders: onze model-eigen stappen.
    if (konf) steps = buildKonfSteps();
    else steps.unshift(maatStep);
    steps.push(ovStep);

    function summaryRows() {
      var rows = [
        ['Model', m.name + ' (' + m.category + ')'],
        ['Afmeting', W + ' × ' + H + ' mm']
      ];
      if (konf) {   // PVC: alle keuzes komen uit de Drutex-catalogus (cfg.sel) + live maten
        var kr = [['Model', m.name + ' (' + m.category + ')']];
        if (cfg.dims && cfg.dims.rows && cfg.dims.rows.length) {
          kr.push(['Breedte', cfg.dims.width + ' mm']);
          if (cfg.dims.rows.length === 1) kr.push(['Hoogte', cfg.dims.rows[0].h + ' mm']);
          else cfg.dims.rows.forEach(function (r) { kr.push([r.label, r.h + ' mm']); });
        } else kr.push(['Afmeting', W + ' × ' + H + ' mm']);
        Object.keys(cfg.sel).forEach(function (lab) { kr.push([lab, cfg.sel[lab]]); });
        return kr;
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
      // op de stap "Indeling" tonen we de schematische tekening in het preview-paneel
      if (steps[active].key === 'indeling') { drawDivisionPreview(); pcard.classList.add('show-schema'); }
      else pcard.classList.remove('show-schema');
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
