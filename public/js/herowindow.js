/* Live "zelf-ontwerpend" kozijn voor de homepage-hero.
   Zelfstandig (geen afhankelijkheden), zelfde stijl als de configurator. */
(function () {
  var stage = document.getElementById('hwStage');
  if (!stage) return;
  var cap = document.getElementById('hwCap');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function shade(hex, p) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + p));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + p));
    var b = Math.max(0, Math.min(255, (n & 255) + p));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // Scènes die elkaar afwisselen
  var SCENES = [
    { label: 'Antraciet · draaikiep · triple glas', frame: '#363B3E', dark: true,  top: false, vakken: ['kiepR'] },
    { label: 'Wit · draai + vast · HR++',           frame: '#F2F2EF', dark: false, top: false, vakken: ['draaiR', 'vast'] },
    { label: 'Gouden eiken · bovenlicht',           frame: '#B5803F', dark: false, top: true,  vakken: ['kiepR', 'vast'] },
    { label: 'Zwart · schuifpui',                   frame: '#17191C', dark: true,  top: false, vakken: ['schuifR', 'vast'], schuif: true }
  ];

  function glass(x, y, w, h, stroke, gid) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#hg' + gid + ')"/>'
      + '<rect x="' + x + '" y="' + (y + h * 0.6) + '" width="' + w + '" height="' + (h * 0.4) + '" fill="#b9ad8e" opacity=".05"/>'
      + '<polygon points="' + x + ',' + (y + h * 0.58) + ' ' + (x + w * 0.42) + ',' + y + ' ' + (x + w * 0.6) + ',' + y + ' ' + x + ',' + (y + h * 0.82) + '" fill="#fff" opacity=".16"/>'
      + '<polygon points="' + (x + w * 0.74) + ',' + (y + h) + ' ' + (x + w) + ',' + (y + h * 0.6) + ' ' + (x + w) + ',' + (y + h * 0.76) + ' ' + (x + w * 0.88) + ',' + (y + h) + '" fill="#fff" opacity=".07"/>'
      + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="3.5" fill="#000" opacity=".05"/>'
      + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + stroke + '"/>';
  }

  function paneFixed(x, y, w, h, stroke, gid) {
    var bd = Math.max(2, Math.min(w, h) * 0.03);
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#hf' + gid + ')"/>'
      + glass(x + bd, y + bd, w - 2 * bd, h - 2 * bd, stroke, gid);
  }

  function paneSash(x, y, w, h, stroke, gid, thin) {
    var sd = Math.max(3, Math.min(w, h) * (thin ? 0.045 : 0.06));
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#hf' + gid + ')" stroke="' + stroke + '"/>'
      + '<rect x="' + (x + 0.8) + '" y="' + (y + 0.8) + '" width="' + (w - 1.6) + '" height="' + (h - 1.6) + '" fill="none" stroke="rgba(255,255,255,.14)"/>';
    var gx = x + sd, gy = y + sd, gw = w - 2 * sd, gh = h - 2 * sd;
    s += '<rect x="' + (gx - 1.5) + '" y="' + (gy - 1.5) + '" width="' + (gw + 3) + '" height="' + (gh + 3) + '" fill="#000" opacity=".06"/>';
    s += glass(gx, gy, gw, gh, stroke, gid);
    return s;
  }

  function sym(s, x, y, w, h, c) {
    var d = 'stroke="' + c + '" stroke-width="1.5" stroke-dasharray="4 3" fill="none" class="hw-sym"';
    var o = '', ay = y + h / 2;
    if (s === 'draaiL' || s === 'kiepL') o += '<path d="M' + (x + w) + ' ' + (y + 6) + ' L' + (x + 6) + ' ' + (y + h / 2) + ' L' + (x + w) + ' ' + (y + h - 6) + '" ' + d + '/>';
    if (s === 'draaiR' || s === 'kiepR') o += '<path d="M' + x + ' ' + (y + 6) + ' L' + (x + w - 6) + ' ' + (y + h / 2) + ' L' + x + ' ' + (y + h - 6) + '" ' + d + '/>';
    if (s === 'kiepL' || s === 'kiepR') o += '<path d="M' + (x + 6) + ' ' + (y + h - 6) + ' L' + (x + w / 2) + ' ' + (y + 6) + ' L' + (x + w - 6) + ' ' + (y + h - 6) + '" ' + d + '/>';
    if (s === 'vast') o += '<rect x="' + (x + w / 2 - 8) + '" y="' + (y + h / 2 - 8) + '" width="16" height="16" rx="2" fill="none" stroke="' + c + '" stroke-width="1.1" opacity=".5" class="hw-sym"/>';
    if (s === 'schuifR') o += '<line x1="' + (x + w * 0.3) + '" y1="' + ay + '" x2="' + (x + w * 0.7) + '" y2="' + ay + '" stroke="' + c + '" stroke-width="1.8" class="hw-sym"/><path d="M' + (x + w * 0.7) + ' ' + ay + ' l-8 -6 m8 6 l-8 6" stroke="' + c + '" stroke-width="1.8" fill="none" class="hw-sym"/>';
    if (s === 'schuifL') o += '<line x1="' + (x + w * 0.3) + '" y1="' + ay + '" x2="' + (x + w * 0.7) + '" y2="' + ay + '" stroke="' + c + '" stroke-width="1.8" class="hw-sym"/><path d="M' + (x + w * 0.3) + ' ' + ay + ' l8 -6 m-8 6 l8 6" stroke="' + c + '" stroke-width="1.8" fill="none" class="hw-sym"/>';
    return o;
  }

  function handle(s, x, y, w, h) {
    if (!/^(kiep|draai)/.test(s)) return '';
    var left = s.endsWith('L'), hh = Math.max(20, h * 0.14);
    var hx = left ? x + 5 : x + w - 9, hy = y + h * 0.5 - hh / 2;
    var st = 'stroke="rgba(0,0,0,.28)" stroke-width="0.6"';
    return '<g class="hw-handle">'
      + '<rect x="' + (hx - 2) + '" y="' + (hy + hh - 3) + '" width="9" height="5" rx="2" fill="#c9cdcf" ' + st + '/>'
      + '<rect x="' + hx + '" y="' + hy + '" width="5" height="' + hh + '" rx="2.5" fill="#d6dadc" ' + st + '/>'
      + '<rect x="' + (hx - 2) + '" y="' + (hy - 3) + '" width="11" height="5" rx="2.5" fill="#c9cdcf" ' + st + '/></g>';
  }

  function render(sc) {
    var gid = (++GID);
    var ox = 18, oy = 14, dw = 326, dh = 252;
    var frameC = sc.frame, lo = shade(frameC, 20), hi = shade(frameC, -22), dark = sc.dark;
    var stroke = dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)';
    var symC = dark ? 'rgba(255,255,255,.62)' : 'rgba(40,40,40,.55)';
    var frame = Math.max(11, Math.min(dw, dh) * 0.05), gap = frame * 0.7, div = frame * 0.8;

    var defs = '<defs>'
      + '<linearGradient id="hg' + gid + '" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#d9e7ed"/><stop offset=".5" stop-color="#eff5f6"/><stop offset="1" stop-color="#cfdfe3"/></linearGradient>'
      + '<linearGradient id="hf' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + lo + '"/><stop offset=".55" stop-color="' + frameC + '"/><stop offset="1" stop-color="' + hi + '"/></linearGradient>'
      + '<filter id="hb' + gid + '" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="7"/></filter></defs>';

    var g = '<rect x="' + ox + '" y="' + oy + '" width="' + dw + '" height="' + dh + '" rx="5" fill="url(#hf' + gid + ')" stroke="' + stroke + '"/>';
    g += '<path d="M' + (ox + 1) + ' ' + (oy + dh - 1) + ' L' + (ox + 1) + ' ' + (oy + 1) + ' L' + (ox + dw - 1) + ' ' + (oy + 1) + '" fill="none" stroke="rgba(255,255,255,' + (dark ? '.10' : '.22') + ')" stroke-width="1.4" stroke-linecap="round"/>';
    g += '<path d="M' + (ox + 1) + ' ' + (oy + dh - 1) + ' L' + (ox + dw - 1) + ' ' + (oy + dh - 1) + ' L' + (ox + dw - 1) + ' ' + (oy + 1) + '" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.4" stroke-linecap="round"/>';
    g += '<rect x="' + (ox + frame) + '" y="' + (oy + frame) + '" width="' + (dw - frame * 2) + '" height="' + (dh - frame * 2) + '" fill="none" stroke="rgba(0,0,0,.10)"/>';

    var ix = ox + frame, iw = dw - frame * 2, iy0 = oy + frame, ih0 = dh - frame * 2;
    var N = sc.vakken.length;
    var topH = sc.top ? ih0 * 0.26 : 0;
    var midY = iy0 + (topH ? topH + div : 0), midH = ih0 - topH - (topH ? div : 0);

    var panes = []; // verzamel zodat we entrance-vertraging kunnen zetten
    if (topH) panes.push(paneFixed(ix, iy0, iw, topH, stroke, gid));
    var cw = (iw - gap * (N - 1)) / N;
    sc.vakken.forEach(function (fn, k) {
      var x = ix + k * (cw + gap);
      var opening = (fn !== 'vast');
      var p = opening ? paneSash(x, midY, cw, midH, stroke, gid, fn.indexOf('schuif') === 0)
                      : paneFixed(x, midY, cw, midH, stroke, gid);
      if (fn.indexOf('schuif') === 0) p += '<rect x="' + (x + (fn === 'schuifL' ? cw - 6 : 3)) + '" y="' + (midY + 3) + '" width="3.5" height="' + (midH - 6) + '" rx="1.5" fill="' + shade(frameC, -20) + '"/>';
      p += sym(fn, x, midY, cw, midH, symC) + handle(fn, x, midY, cw, midH);
      panes.push(p);
    });
    if (sc.schuif) g += '<rect x="' + ox + '" y="' + (oy + dh - 6) + '" width="' + dw + '" height="6" fill="' + shade(frameC, -22) + '"/>';

    // panelen met oplopende entrance-vertraging
    var panesSvg = panes.map(function (p, i) {
      return '<g class="hw-pane" style="animation-delay:' + (0.25 + i * 0.16).toFixed(2) + 's">' + p + '</g>';
    }).join('');

    var shadow = '<rect x="' + ox + '" y="' + (oy + 7) + '" width="' + dw + '" height="' + dh + '" rx="7" fill="#1B1B1A" opacity=".16" filter="url(#hb' + gid + ')"/>';

    return '<svg class="hw-svg" viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">' + defs + shadow
      + '<g class="hw-frame">' + g + '</g>' + panesSvg + '</svg>';
  }

  var GID = 0, idx = 0;

  function show(i) {
    var sc = SCENES[i];
    stage.innerHTML = render(sc);
    if (cap) {
      cap.classList.remove('hw-cap-in');
      // force reflow zodat de animatie opnieuw start
      void cap.offsetWidth;
      cap.textContent = sc.label;
      cap.classList.add('hw-cap-in');
    }
  }

  show(0);
  if (!reduce) {
    setInterval(function () {
      idx = (idx + 1) % SCENES.length;
      stage.classList.add('hw-fade');
      setTimeout(function () { show(idx); stage.classList.remove('hw-fade'); }, 320);
    }, 4200);
  }
})();
