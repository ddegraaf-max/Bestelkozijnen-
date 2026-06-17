/* ====== Drutex-schema: schematische vector-tekening in configurator-stijl ======
   Tekent het product op de gekozen maat (mm) met kozijnkleur, indeling en
   maatlijnen (breedte onder, hoogte links). Past de tekening aan op het TYPE:
     - 'window'  : draai-kiep raam (vakken + draai-kiep-symbolen)
     - 'door'    : deur (1 of 2 vleugels, paneel + bovenlicht-glas + kruk)
     - 'sliding' : schuif/hef-systeem (panelen + schuifpijl + onderrail)
   Standalone (geen koppeling met de hoofdconfigurator).
   API:  DrutexSchema.build({ type, W, H, frameHex, vakken, bg }) -> SVG-string  */
(function () {
  'use strict';
  var _gid = 0;

  function shade(hex, p) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + p));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + p));
    var b = Math.max(0, Math.min(255, (n & 255) + p));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
  var lum = hex => { var n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };

  function defs(frameC, gid) {
    var lo = shade(frameC, 20), hi = shade(frameC, -22);
    return '<defs>' +
      '<linearGradient id="gl' + gid + '" x1="0" y1="0" x2=".3" y2="1">' +
      '<stop offset="0" stop-color="#d9e7ed"/><stop offset=".5" stop-color="#eff5f6"/><stop offset="1" stop-color="#cfdfe3"/></linearGradient>' +
      '<linearGradient id="fr' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + lo + '"/><stop offset=".55" stop-color="' + frameC + '"/><stop offset="1" stop-color="' + hi + '"/></linearGradient>' +
      '<filter id="bl' + gid + '" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '</defs>';
  }
  function glass(x, y, w, h, stroke, gid) {
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#gl' + gid + ')"/>';
    s += '<polygon points="' + x + ',' + (y + h * 0.58) + ' ' + (x + w * 0.42) + ',' + y + ' ' + (x + w * 0.6) + ',' + y + ' ' + x + ',' + (y + h * 0.82) + '" fill="#fff" opacity=".16"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + stroke + '"/>';
    return s;
  }
  function sash(x, y, w, h, stroke, gid, glazed) {
    var sd = Math.max(3, Math.min(w, h) * 0.06);
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#fr' + gid + ')" stroke="' + stroke + '"/>';
    s += '<rect x="' + (x + 0.8) + '" y="' + (y + 0.8) + '" width="' + (w - 1.6) + '" height="' + (h - 1.6) + '" fill="none" stroke="rgba(255,255,255,.14)"/>';
    if (glazed !== false) s += glass(x + sd, y + sd, w - 2 * sd, h - 2 * sd, stroke, gid);
    return s;
  }

  // ---- innerlijke tekeningen per type ----
  function windowInner(c) {
    // Geen open-richting-symbolen: de animatie toont de opening al 1:1 (zoals de
    // hoofdconfigurator het ook doet — schematische pijlen/driehoeken weggelaten).
    var vak = c.vak, g = '';
    var cw = (c.iw - c.gap * (vak - 1)) / vak;
    for (var i = 0; i < vak; i++) {
      g += sash(c.ix + i * (cw + c.gap), c.iy, cw, c.ih, c.stroke, c.gid, true);
    }
    return g;
  }
  function doorInner(c) {
    var leaves = Math.min(2, Math.max(1, c.vak)), g = '';
    var lw = (c.iw - c.gap * (leaves - 1)) / leaves;
    for (var i = 0; i < leaves; i++) {
      var x = c.ix + i * (lw + c.gap);
      // vleugel-kader
      g += '<rect x="' + x + '" y="' + c.iy + '" width="' + lw + '" height="' + c.ih + '" fill="url(#fr' + c.gid + ')" stroke="' + c.stroke + '"/>';
      var pad = Math.max(4, lw * 0.12);
      var gx = x + pad, gw = lw - 2 * pad;
      // glasstrook bovenin
      var gh = Math.min(c.ih * 0.32, c.ih - 2 * pad);
      g += glass(gx, c.iy + pad, gw, gh, c.stroke, c.gid);
      // dicht paneel onderin
      var py = c.iy + pad + gh + pad * 0.6, ph = c.iy + c.ih - pad - py;
      if (ph > 6) {
        g += '<rect x="' + gx + '" y="' + py + '" width="' + gw + '" height="' + ph + '" fill="' + shade(c.frameC, -14) + '" stroke="' + c.stroke + '"/>';
        g += '<rect x="' + (gx + gw * 0.18) + '" y="' + (py + ph * 0.12) + '" width="' + (gw * 0.64) + '" height="' + (ph * 0.76) + '" fill="none" stroke="' + c.symC + '" stroke-width="1" opacity=".5"/>';
      }
      // kruk aan de sluitzijde (binnenrand bij dubbele deur, buitenrand bij enkele)
      var hingeRight = (leaves === 2 && i === 0) || (leaves === 1);
      var hx = hingeRight ? x + lw - pad * 0.7 : x + pad * 0.4;
      g += '<rect x="' + (hx - 1.4) + '" y="' + (c.iy + c.ih * 0.52) + '" width="2.8" height="' + Math.max(14, c.ih * 0.12) + '" rx="1.4" fill="' + c.symC + '"/>';
    }
    return g;
  }
  function slidingInner(c) {
    // Geen schuifpijlen: de animatie toont de schuifbeweging al (pijlen weggelaten).
    var vak = Math.max(2, c.vak), g = '';
    var cw = (c.iw - c.gap * (vak - 1)) / vak;
    for (var i = 0; i < vak; i++) {
      g += sash(c.ix + i * (cw + c.gap), c.iy, cw, c.ih, c.stroke, c.gid, true);
    }
    g += '<rect x="' + c.ox + '" y="' + (c.oy + c.dh - 5) + '" width="' + c.dw + '" height="5" fill="' + shade(c.frameC, -22) + '"/>'; // onderrail
    return g;
  }

  // garagedeur (D-GATE): sectionaaldeur — horizontale panelen met groeven
  function gateInner(c) {
    var rows = Math.max(3, Math.min(6, c.vak || 4)), g = '';
    var gap = Math.max(1.5, c.frame * 0.18);
    var rh = (c.ih - gap * (rows - 1)) / rows;
    for (var i = 0; i < rows; i++) {
      var y = c.iy + i * (rh + gap);
      g += '<rect x="' + c.ix + '" y="' + y + '" width="' + c.iw + '" height="' + rh + '" rx="2" fill="url(#fr' + c.gid + ')" stroke="' + c.stroke + '"/>';
      // verzonken paneel
      var pad = Math.min(rh, c.iw) * 0.10;
      g += '<rect x="' + (c.ix + pad) + '" y="' + (y + pad) + '" width="' + (c.iw - 2 * pad) + '" height="' + (rh - 2 * pad) + '" rx="1.5" fill="none" stroke="rgba(0,0,0,' + (c.dark ? '.28' : '.16') + ')"/>';
      // licht boven / schaduw onder voor reliëf
      g += '<rect x="' + c.ix + '" y="' + y + '" width="' + c.iw + '" height="1.6" fill="rgba(255,255,255,' + (c.dark ? '.10' : '.28') + ')"/>';
      g += '<rect x="' + c.ix + '" y="' + (y + rh - 1.6) + '" width="' + c.iw + '" height="1.6" fill="rgba(0,0,0,.20)"/>';
    }
    return g;
  }

  function dims(ox, oy, dw, dh, W, H, bg) {
    var dc = '#8a8579', by = oy + dh + 20, FS = 13;
    var s = '<line x1="' + ox + '" y1="' + by + '" x2="' + (ox + dw) + '" y2="' + by + '" stroke="' + dc + '"/>' +
      '<rect x="' + (ox + dw / 2 - 34) + '" y="' + (by - 11) + '" width="68" height="22" fill="' + bg + '"/>' +
      '<text x="' + (ox + dw / 2) + '" y="' + (by + 5) + '" font-family="ui-monospace,Menlo,monospace" font-size="' + FS + '" font-weight="700" fill="#3a382f" text-anchor="middle">' + W + ' mm</text>';
    var lx = ox - 17;
    s += '<line x1="' + lx + '" y1="' + oy + '" x2="' + lx + '" y2="' + (oy + dh) + '" stroke="' + dc + '"/>' +
      '<text x="' + lx + '" y="' + (oy + dh / 2) + '" font-family="ui-monospace,Menlo,monospace" font-size="' + FS + '" font-weight="700" fill="#3a382f" text-anchor="middle" transform="rotate(-90 ' + lx + ' ' + (oy + dh / 2) + ')">' + H + ' mm</text>';
    return s;
  }

  function build(opts) {
    opts = opts || {};
    var type = opts.type || 'window';
    var W = opts.W || 1500, H = opts.H || 1400;
    var frameC = opts.frameHex || '#e9e7e1';
    var bg = opts.bg || '#f6f4ee';
    var vak = Math.max(1, Math.min(4, opts.vakken || 2));

    var maxBox = 330, pad = 50, oy = 22;
    var ratio = Math.min(maxBox / W, maxBox / H), dw = W * ratio, dh = H * ratio;
    var ox = pad, tW = dw + pad + 30, tH = dh + oy + 48;
    var gid = 's' + (_gid++);
    var dark = lum(frameC) < 70;
    var stroke = dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)';
    var symC = dark ? 'rgba(255,255,255,.6)' : 'rgba(40,40,40,.5)';
    var frame = Math.max(7, Math.min(dw, dh) * 0.045), gap = frame * 0.7;

    var g = '<rect x="' + ox + '" y="' + oy + '" width="' + dw + '" height="' + dh + '" rx="4" fill="url(#fr' + gid + ')" stroke="' + stroke + '"/>';
    g += '<path d="M' + (ox + 1) + ' ' + (oy + dh - 1) + ' L' + (ox + 1) + ' ' + (oy + 1) + ' L' + (ox + dw - 1) + ' ' + (oy + 1) + '" fill="none" stroke="rgba(255,255,255,' + (dark ? '.10' : '.22') + ')" stroke-width="1.3" stroke-linecap="round"/>';
    g += '<path d="M' + (ox + 1) + ' ' + (oy + dh - 1) + ' L' + (ox + dw - 1) + ' ' + (oy + dh - 1) + ' L' + (ox + dw - 1) + ' ' + (oy + 1) + '" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.3" stroke-linecap="round"/>';

    var ctx = {
      ix: ox + frame, iw: dw - frame * 2, iy: oy + frame, ih: dh - frame * 2,
      frame: frame, gap: gap, gid: gid, stroke: stroke, symC: symC, dark: dark, frameC: frameC,
      ox: ox, oy: oy, dw: dw, dh: dh, vak: vak
    };
    if (type === 'door') g += doorInner(ctx);
    else if (type === 'sliding') g += slidingInner(ctx);
    else if (type === 'gate') g += gateInner(ctx);
    else g += windowInner(ctx);

    var s = '<svg viewBox="0 0 ' + tW + ' ' + tH + '" xmlns="http://www.w3.org/2000/svg">' + defs(frameC, gid);
    s += '<rect x="' + ox + '" y="' + (oy + 6) + '" width="' + dw + '" height="' + dh + '" rx="6" fill="#1B1B1A" opacity=".15" filter="url(#bl' + gid + ')"/>';
    s += g;
    s += dims(ox, oy, dw, dh, W, H, bg);
    s += '</svg>';
    return s;
  }

  window.DrutexSchema = { build: build };
})();
