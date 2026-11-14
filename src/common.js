/* =======================================================================
   AdsCommon — общая библиотека рисования для зелёных рекламных роликов
   Работает и в браузере (window.Ads), и в node (globalThis.Ads)
   Всё рисуется кодом: фигуры, текст, иконки, деньги, частицы.
   ======================================================================= */
(function (g) {
  'use strict';

  /* ------------------------------- математика ------------------------------ */
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < (a === undefined ? 0 : a) ? (a === undefined ? 0 : a) : v > (b === undefined ? 1 : b) ? (b === undefined ? 1 : b) : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / ((b - a) || 1e-6));
  const smooth = (t, a, b) => { const x = seg(t, a, b); return x * x * (3 - 2 * x); };
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const easeInCubic = (x) => x * x * x;
  const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOutBack = (x, s) => { s = s === undefined ? 1.9 : s; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  const easeInBack = (x, s) => { s = s === undefined ? 1.6 : s; return (s + 1) * x * x * x - s * x * x; };
  const easeOutElastic = (x) => (x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1);
  const pulse = (t, t0, dur) => { const x = seg(t, t0, t0 + dur); return Math.sin(x * Math.PI); };
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rr = (r, a, b) => a + r() * (b - a);

  /* -------------------------------- палитра -------------------------------- */
  /* Никаких зелёных и близких к зелёному оттенков — иначе хромакей «съест». */
  const C = {
    key: '#00FF00',
    ink: '#101014',
    ink2: '#1D1F26',
    white: '#FFFFFF',
    cream: '#FFF3D0',
    yellow: '#FFD400',
    gold: '#FFB000',
    goldDeep: '#E08900',
    orange: '#FF6A00',
    red: '#FF2D2D',
    crimson: '#B00020',
    pink: '#FF2BD1',
    purple: '#7B2CBF',
    blue: '#0A84FF',
    steel: '#CBD3DF',
    grey: '#8A93A0',
    brown: '#8B5A2B'
  };

  const FONT_DISPLAY = '"Russo One", "Arial Black", "Segoe UI", Arial, sans-serif';
  const FONT_HEAVY = '"Montserrat", "Arial Black", "Segoe UI", Arial, sans-serif';

  /* ------------------------------ примитивы ------------------------------- */
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function poly(ctx, pts, close) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close !== false) ctx.closePath();
  }

  function starPath(ctx, cx, cy, n, r1, r2, rot) {
    rot = rot || 0;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n;
      const r = i % 2 ? r2 : r1;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function fillStroke(ctx, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke && lw) { ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function burst(ctx, cx, cy, n, r1, r2, rot, fill, stroke, lw) {
    starPath(ctx, cx, cy, n, r1, r2, rot);
    fillStroke(ctx, fill, stroke, lw);
  }

  function circle(ctx, cx, cy, r, fill, stroke, lw) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    fillStroke(ctx, fill, stroke, lw);
  }

  function ring(ctx, cx, cy, r, color, lw) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
  }

  function arc(ctx, cx, cy, r, a0, a1, color, lw) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.lineCap = 'butt'; ctx.stroke();
  }

  function gear(ctx, cx, cy, r, teeth, rot, fill, stroke, lw) {
    rot = rot || 0;
    const tw = (TAU / teeth) * 0.56;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = rot + (i * TAU) / teeth;
      const a1 = a - tw / 2, a2 = a + tw / 2;
      ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
      ctx.lineTo(cx + Math.cos(a1 + tw * 0.18) * (r * 1.17), cy + Math.sin(a1 + tw * 0.18) * (r * 1.17));
      ctx.lineTo(cx + Math.cos(a2 - tw * 0.18) * (r * 1.17), cy + Math.sin(a2 - tw * 0.18) * (r * 1.17));
      ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
      const an = rot + ((i + 1) * TAU) / teeth;
      const am = (a2 + an - tw / 2) / 2;
      ctx.arc(cx, cy, r, a2, an - tw / 2, false);
    }
    ctx.closePath();
    fillStroke(ctx, fill, stroke, lw);
  }

  function coin(ctx, x, y, r, rot, face) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    circle(ctx, 0, r * 0.10, r, C.goldDeep, null, 0);
    circle(ctx, 0, 0, r, C.gold, C.ink, r * 0.14);
    ring(ctx, 0, 0, r * 0.66, C.goldDeep, r * 0.12);
    ctx.fillStyle = C.goldDeep;
    ctx.font = 'bold ' + r * 0.95 + 'px ' + FONT_HEAVY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(face || '₽', 0, r * 0.04);
    ctx.restore();
  }

  function bill(ctx, x, y, w, h, rot, dark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    rrect(ctx, -w / 2, -h / 2, w, h, h * 0.12);
    fillStroke(ctx, dark ? C.ink2 : C.cream, C.ink, h * 0.07);
    rrect(ctx, -w / 2 + h * 0.16, -h / 2 + h * 0.16, w - h * 0.32, h - h * 0.32, h * 0.08);
    ctx.lineWidth = h * 0.05; ctx.strokeStyle = dark ? C.gold : C.goldDeep; ctx.stroke();
    circle(ctx, 0, 0, h * 0.20, dark ? C.gold : C.goldDeep, null, 0);
    ctx.fillStyle = dark ? C.gold : C.goldDeep;
    ctx.font = '900 ' + h * 0.2 + 'px ' + FONT_HEAVY;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('₽', 0, h * 0.02);
    ctx.restore();
  }

  function sparkle(ctx, x, y, s, rot, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.16, -s * 0.16, s, 0);
    ctx.quadraticCurveTo(s * 0.16, s * 0.16, 0, s);
    ctx.quadraticCurveTo(-s * 0.16, s * 0.16, -s, 0);
    ctx.quadraticCurveTo(-s * 0.16, -s * 0.16, 0, -s);
    ctx.closePath();
    ctx.fillStyle = fill || C.white;
    ctx.fill();
    ctx.restore();
  }

  function arrowDown(ctx, x, y, s, fill, stroke, lw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-s * 0.30, -s * 0.62);
    ctx.lineTo(s * 0.30, -s * 0.62);
    ctx.lineTo(s * 0.30, -s * 0.10);
    ctx.lineTo(s * 0.62, -s * 0.10);
    ctx.lineTo(0, s * 0.62);
    ctx.lineTo(-s * 0.62, -s * 0.10);
    ctx.lineTo(-s * 0.30, -s * 0.10);
    ctx.closePath();
    fillStroke(ctx, fill, stroke, lw);
    ctx.restore();
  }

  function arrowRight(ctx, x, y, s, fill, stroke, lw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-s * 0.62, -s * 0.28);
    ctx.lineTo(s * 0.10, -s * 0.28);
    ctx.lineTo(s * 0.10, -s * 0.58);
    ctx.lineTo(s * 0.62, 0);
    ctx.lineTo(s * 0.10, s * 0.58);
    ctx.lineTo(s * 0.10, s * 0.28);
    ctx.lineTo(-s * 0.62, s * 0.28);
    ctx.closePath();
    fillStroke(ctx, fill, stroke, lw);
    ctx.restore();
  }

  function bolt(ctx, x, y, s, fill, stroke, lw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 100, s / 100);
    poly(ctx, [[10, -52], [34, -52], [10, -6], [32, -6], [-14, 52], [-2, 10], [-26, 10]]);
    fillStroke(ctx, fill, stroke, lw === undefined ? 8 : lw);
    ctx.restore();
  }

  /* --------------------------------- текст --------------------------------- */
  function labelWidth(ctx, text, o) {
    const size = o.size;
    const tracking = o.tracking || 0;
    ctx.font = o.fontFn ? o.fontFn(size) : size + 'px ' + FONT_DISPLAY;
    const chars = Array.from(text);
    let w = 0;
    for (const ch of chars) w += ctx.measureText(ch).width + tracking;
    return w - tracking;
  }

  /**
   * Жирный «плакатный» текст с обводкой и жёсткой тенью.
   * o: { size, tracking, fontFn, fill, stroke, strokeW, shadow, shadowX, shadowY,
   *      align: 'center'|'left'|'right', rot, scaleX, scaleY, alpha }
   */
  function label(ctx, text, x, y, o) {
    o = o || {};
    const size = o.size || 100;
    const tracking = o.tracking || 0;
    const font = o.fontFn ? o.fontFn(size) : size + 'px ' + FONT_DISPLAY;
    const chars = Array.from(text);

    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(o.scaleX === undefined ? 1 : o.scaleX, o.scaleY === undefined ? 1 : o.scaleY);
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const widths = chars.map((ch) => ctx.measureText(ch).width + tracking);
    const total = widths.reduce((a, b) => a + b, 0) - tracking;
    const start = o.align === 'center' ? -total / 2 : o.align === 'right' ? -total : 0;

    const lw = o.strokeW || 0;
    const passes = [];
    if (o.shadow) {
      passes.push({
        dx: o.shadowX === undefined ? 0 : o.shadowX,
        dy: o.shadowY === undefined ? size * 0.10 : o.shadowY,
        fill: o.shadow, stroke: o.shadow,
        lw: o.shadowStrokeW === undefined ? lw : o.shadowStrokeW
      });
    }
    passes.push({ dx: 0, dy: 0, fill: o.fill || C.white, stroke: o.stroke, lw: lw });

    for (const p of passes) {
      let cx = start;
      for (let i = 0; i < chars.length; i++) {
        if (p.stroke && p.lw) {
          ctx.lineWidth = p.lw; ctx.strokeStyle = p.stroke;
          ctx.strokeText(chars[i], cx + p.dx, p.dy);
        }
        if (p.fill) {
          ctx.fillStyle = p.fill;
          ctx.fillText(chars[i], cx + p.dx, p.dy);
        }
        cx += widths[i];
      }
    }
    ctx.restore();
    return total;
  }

  /** Вписать текст в maxW: возвращает размер шрифта (итеративно, 3 прохода) */
  function fitSize(ctx, text, maxW, baseSize, o) {
    o = o || {};
    let size = baseSize;
    for (let i = 0; i < 3; i++) {
      const w = labelWidth(ctx, text, { size: size, tracking: o.tracking || 0, fontFn: o.fontFn });
      if (w <= maxW) break;
      size *= (maxW / w) * 0.995;
    }
    return size;
  }

  /** Плашка-лента: прямоугольник со скошенными углами */
  function band(ctx, x, y, w, h, fill, stroke, lw, skew) {
    skew = skew === undefined ? h * 0.22 : skew;
    poly(ctx, [
      [x - w / 2 + skew, y - h / 2],
      [x + w / 2, y - h / 2],
      [x + w / 2 - skew, y + h / 2],
      [x - w / 2, y + h / 2]
    ]);
    fillStroke(ctx, fill, stroke, lw);
  }

  /* ------------------------------- иконки: мусор --------------------------- */
  /** Размер s = ширина иконки, координаты центрированы в (0,0) */
  function trash(ctx, kind, s, rot) {
    ctx.save();
    ctx.rotate(rot || 0);
    const k = s / 100;
    ctx.scale(k, k);
    const ol = 7; // толщина обводки в локальных единицах
    switch (kind) {
      case 'banana': {
        ctx.beginPath();
        ctx.moveTo(-40, -12);
        ctx.bezierCurveTo(-34, 16, -6, 34, 26, 26);
        ctx.bezierCurveTo(38, 23, 44, 14, 44, 4);
        ctx.bezierCurveTo(30, 14, 8, 12, -8, -2);
        ctx.bezierCurveTo(-20, -12, -28, -30, -30, -40);
        ctx.bezierCurveTo(-38, -34, -41, -24, -40, -12);
        ctx.closePath();
        fillStroke(ctx, C.yellow, C.ink, ol);
        ctx.beginPath();
        ctx.moveTo(-24, -6); ctx.quadraticCurveTo(-8, 14, 28, 10);
        ctx.strokeStyle = C.goldDeep; ctx.lineWidth = 4; ctx.stroke();
        break;
      }
      case 'boot': {
        poly(ctx, [[-26, -38], [6, -38], [10, 4], [38, 12], [40, 30], [-30, 30], [-34, 4]]);
        fillStroke(ctx, C.brown, C.ink, ol);
        ctx.beginPath();
        ctx.moveTo(-26, 20); ctx.lineTo(34, 20);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.stroke();
        break;
      }
      case 'sock': {
        ctx.beginPath();
        ctx.moveTo(-22, -40);
        ctx.lineTo(10, -40);
        ctx.lineTo(10, 4);
        ctx.quadraticCurveTo(12, 16, 30, 18);
        ctx.quadraticCurveTo(40, 20, 38, 34);
        ctx.lineTo(-2, 34);
        ctx.quadraticCurveTo(-16, 26, -22, 8);
        ctx.closePath();
        fillStroke(ctx, C.steel, C.ink, ol);
        ctx.beginPath();
        ctx.moveTo(-20, -26); ctx.lineTo(9, -26);
        ctx.strokeStyle = C.red; ctx.lineWidth = 9; ctx.stroke();
        break;
      }
      case 'bottle': {
        poly(ctx, [[-12, -46], [12, -46], [12, -22], [22, -6], [22, 40], [-22, 40], [-22, -6], [-12, -22]]);
        fillStroke(ctx, C.blue, C.ink, ol);
        rrect(ctx, -16, 6, 32, 14, 3); fillStroke(ctx, C.white, C.ink, 4);
        break;
      }
      case 'can': {
        rrect(ctx, -20, -42, 40, 84, 8);
        fillStroke(ctx, C.red, C.ink, ol);
        rrect(ctx, -20, -14, 40, 22, 2); fillStroke(ctx, C.white, C.ink, 3);
        break;
      }
      case 'paper': {
        poly(ctx, [[-34, 2], [-20, -34], [14, -40], [36, -16], [30, 22], [2, 38], [-24, 28], [-38, 16]]);
        fillStroke(ctx, C.white, C.ink, ol);
        ctx.beginPath();
        ctx.moveTo(-18, -18); ctx.lineTo(6, -6); ctx.lineTo(-8, 12); ctx.lineTo(16, 20);
        ctx.strokeStyle = C.grey; ctx.lineWidth = 4; ctx.stroke();
        break;
      }
      case 'bag': {
        // мусорный пакет с завязанным верхом
        ctx.beginPath();
        ctx.moveTo(-14, -34);
        ctx.quadraticCurveTo(-34, -22, -38, 2);
        ctx.quadraticCurveTo(-42, 30, -22, 38);
        ctx.quadraticCurveTo(0, 44, 24, 36);
        ctx.quadraticCurveTo(42, 26, 36, 0);
        ctx.quadraticCurveTo(32, -22, 14, -34);
        ctx.closePath();
        fillStroke(ctx, '#39404F', C.ink, ol);
        // завязка
        poly(ctx, [[-18, -34], [0, -52], [18, -34], [0, -26]]);
        fillStroke(ctx, C.ink, C.ink, 4);
        ctx.beginPath();
        ctx.moveTo(-8, -44); ctx.quadraticCurveTo(-26, -56, -34, -50);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.stroke();
        // блик
        sparkle(ctx, -12, 6, 9, 0.2, C.white);
        break;
      }
      default: {
        circle(ctx, 0, 0, 34, C.steel, C.ink, ol);
      }
    }
    ctx.restore();
  }

  /* -------------------------------- иконки: скины -------------------------- */
  function skin(ctx, kind, s, rot) {
    ctx.save();
    ctx.rotate(rot || 0);
    const k = s / 100;
    ctx.scale(k, k);
    const ol = 7;
    switch (kind) {
      case 'ak': {
        // приклад
        poly(ctx, [[-46, -9], [-70, -3], [-70, 16], [-54, 14], [-46, 6]]);
        fillStroke(ctx, C.goldDeep, C.ink, ol);
        // ствольная коробка
        rrect(ctx, -48, -12, 76, 22, 5);
        fillStroke(ctx, C.gold, C.ink, ol);
        // цевьё сверху
        rrect(ctx, 6, -22, 46, 12, 4);
        fillStroke(ctx, C.goldDeep, C.ink, 6);
        // магазин
        ctx.beginPath();
        ctx.moveTo(-2, 8);
        ctx.lineTo(22, 8);
        ctx.quadraticCurveTo(34, 26, 26, 42);
        ctx.lineTo(6, 40);
        ctx.quadraticCurveTo(10, 22, -2, 8);
        ctx.closePath();
        fillStroke(ctx, C.goldDeep, C.ink, ol);
        // рукоять
        poly(ctx, [[30, 8], [44, 8], [50, 30], [36, 32]]);
        fillStroke(ctx, C.ink2, C.ink, ol);
        // ствол + мушка
        rrect(ctx, 26, -8, 42, 8, 3); fillStroke(ctx, C.ink2, C.ink, 5);
        poly(ctx, [[56, -8], [62, -22], [68, -8]]);
        fillStroke(ctx, C.ink2, C.ink, 4);
        break;
      }
      case 'knife': {
        ctx.beginPath();
        ctx.moveTo(-48, 28);
        ctx.quadraticCurveTo(-14, -20, 34, -32);
        ctx.quadraticCurveTo(20, 4, 4, 22);
        ctx.closePath();
        fillStroke(ctx, C.steel, C.ink, ol);
        poly(ctx, [[-46, 26], [-26, 40], [-52, 44]]);
        fillStroke(ctx, C.ink2, C.ink, ol);
        break;
      }
      case 'glove': {
        // ладонь + четыре пальца + большой палец
        rrect(ctx, -28, -8, 56, 42, 10);
        fillStroke(ctx, C.crimson, C.ink, ol);
        for (let i = 0; i < 4; i++) {
          rrect(ctx, -26 + i * 15, -30 - (i === 1 || i === 2 ? 6 : 0), 11, 26, 5);
          fillStroke(ctx, C.crimson, C.ink, 5);
        }
        ctx.beginPath();
        ctx.ellipse(-34, 12, 16, 10, -0.5, 0, TAU);
        fillStroke(ctx, C.crimson, C.ink, ol);
        rrect(ctx, -28, 16, 56, 12, 5);
        fillStroke(ctx, C.gold, C.ink, 5);
        break;
      }
      case 'case': {
        rrect(ctx, -44, -30, 88, 58, 6);
        fillStroke(ctx, C.ink2, C.ink, ol);
        rrect(ctx, -44, -30, 88, 16, 6); fillStroke(ctx, C.ink, C.ink, 4);
        rrect(ctx, -12, -8, 24, 22, 4); fillStroke(ctx, C.gold, C.ink, 5);
        break;
      }
      case 'bar': {
        poly(ctx, [[-44, 6], [40, 6], [34, 30], [-38, 30]]);
        fillStroke(ctx, C.gold, C.ink, ol);
        poly(ctx, [[-36, -18], [46, -18], [42, 4], [-32, 4]]);
        fillStroke(ctx, C.gold, C.ink, ol);
        ctx.fillStyle = C.goldDeep;
        ctx.font = '900 14px ' + FONT_HEAVY;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('999.9', 0, 20);
        break;
      }
      default: circle(ctx, 0, 0, 34, C.gold, C.ink, ol);
    }
    ctx.restore();
  }


  /* ---------------------------- фото / футажи ------------------------------ */
  /** Вписать картинку в прямоугольник (cover), с зумом и смещением кадрирования */
  function coverImage(ctx, img, x, y, w, h, cropX, cropY, zoom) {
    if (!img || !img.width) return false;
    const z = zoom || 1;
    const iw = img.width, ih = img.height;
    const k = Math.max(w / iw, h / ih) * z;
    const sw = Math.min(iw, w / k), sh = Math.min(ih, h / k);
    let sx = (iw - sw) / 2 + (cropX || 0) * (iw - sw) * 0.5;
    let sy = (ih - sh) / 2 + (cropY || 0) * (ih - sh) * 0.5;
    sx = Math.max(0, Math.min(iw - sw, sx));
    sy = Math.max(0, Math.min(ih - sh, sy));
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    return true;
  }

  /**
   * Плитка футажа: белая рамка, фото, затемнение снизу, кнопка play, таймкод.
   * o = { img, x, y, w, h, rot, scale, cropX, cropY, zoom, dim, code, tag }
   */
  function photoTile(ctx, o) {
    const w = o.w, h = o.h;
    const r = o.r === undefined ? Math.min(w, h) * 0.07 : o.r;
    const sc = o.scale === undefined ? 1 : o.scale;
    const u = Math.min(w, h) / 300;

    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.rot) ctx.rotate(o.rot);
    if (sc !== 1) ctx.scale(sc, sc);

    // жёсткая тень
    rrect(ctx, -w / 2 + 8 * u, -h / 2 + 10 * u, w, h, r);
    ctx.fillStyle = C.ink;
    ctx.fill();

    // белая рамка
    rrect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fillStyle = C.white;
    ctx.fill();

    const pad = Math.max(3 * u, w * 0.022);
    const iw = w - pad * 2, ih = h - pad * 2;

    ctx.save();
    rrect(ctx, -iw / 2, -ih / 2, iw, ih, r * 0.75);
    ctx.clip();

    const ok = coverImage(ctx, o.img, -iw / 2, -ih / 2, iw, ih, o.cropX, o.cropY, o.zoom);
    if (!ok) {
      ctx.fillStyle = o.placeholder || '#2E3542';
      ctx.fillRect(-iw / 2, -ih / 2, iw, ih);
      ctx.fillStyle = '#AEB8C8';
      ctx.font = 'bold ' + 30 * u + 'px ' + FONT_HEAVY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MEL', 0, 0);
    }

    // затемнение снизу (внутри фото — зелёный фон не задевает)
    const g = ctx.createLinearGradient(0, -ih / 2, 0, ih / 2);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.55, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = g;
    ctx.fillRect(-iw / 2, -ih / 2, iw, ih);

    if (o.dim) {
      ctx.fillStyle = 'rgba(0,0,0,' + o.dim + ')';
      ctx.fillRect(-iw / 2, -ih / 2, iw, ih);
    }

    // кнопка play — в правом нижнем углу, чтобы не закрывать лицо
    const pr = Math.min(iw, ih) * (o.play ? 0.16 : 0.12);
    const pcx = iw / 2 - pr - 12 * u;
    const pcy = ih / 2 - pr - 12 * u;
    circle(ctx, pcx, pcy, pr, 'rgba(255,255,255,0.94)', 'rgba(0,0,0,0.4)', pr * 0.08);
    ctx.beginPath();
    ctx.moveTo(pcx - pr * 0.26, pcy - pr * 0.42);
    ctx.lineTo(pcx + pr * 0.54, pcy);
    ctx.lineTo(pcx - pr * 0.26, pcy + pr * 0.42);
    ctx.closePath();
    ctx.fillStyle = C.ink;
    ctx.fill();

    // подпись
    if (o.tag !== false) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '700 ' + 19 * u + 'px ' + FONT_HEAVY;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(o.tagText || 'mellstroy', -iw / 2 + 12 * u, ih / 2 - 12 * u);
    }
    // таймкод — сверху справа
    if (o.code !== false) {
      const txt = o.codeText || '0:14';
      ctx.font = '700 ' + 18 * u + 'px ' + FONT_HEAVY;
      const tw = ctx.measureText(txt).width;
      rrect(ctx, iw / 2 - tw - 22 * u, -ih / 2 + 10 * u, tw + 16 * u, 26 * u, 5 * u);
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, iw / 2 - tw - 14 * u, -ih / 2 + 24 * u);
    }
    ctx.restore();

    // обводка плитки
    rrect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.lineWidth = 4 * u;
    ctx.strokeStyle = C.ink;
    ctx.stroke();

    ctx.restore();
  }

  /** Окно браузера: рамка, три точки, адресная строка */
  function browserWindow(ctx, o) {
    const w = o.w, h = o.h;
    const u = o.u || Math.min(w, h) / 300;
    const r = w * 0.05;
    const barH = Math.max(26 * u, h * 0.13);

    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.rot) ctx.rotate(o.rot);
    const sc = o.scale === undefined ? 1 : o.scale;
    ctx.scale(sc, sc);

    // тень
    rrect(ctx, -w / 2 + 10 * u, -h / 2 + 12 * u, w, h, r);
    ctx.fillStyle = C.ink;
    ctx.fill();

    // корпус
    rrect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fillStyle = '#F4F6FA';
    ctx.fill();

    // шапка
    ctx.save();
    rrect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.clip();
    ctx.fillStyle = C.ink;
    ctx.fillRect(-w / 2, -h / 2, w, barH);

    // точки (без зелёной — чтобы хромакей не съел)
    const dotR = barH * 0.16;
    [C.red, C.yellow, C.blue].forEach((col, i) => {
      circle(ctx, -w / 2 + barH * 0.38 + i * barH * 0.42, -h / 2 + barH * 0.5, dotR, col, null, 0);
    });

    // адресная строка
    const adrH = barH * 0.62;
    const adrW = w * 0.62;
    rrect(ctx, -adrW / 2, -h / 2 + barH * 0.5 - adrH / 2, adrW, adrH, adrH * 0.5);
    ctx.fillStyle = '#2C313C';
    ctx.fill();
    ctx.fillStyle = '#9FB0C8';
    ctx.font = '700 ' + adrH * 0.52 + 'px ' + FONT_HEAVY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.url || 'mel-footage.online', 0, -h / 2 + barH * 0.5 + adrH * 0.04);

    // содержимое: скелет-заглушки
    const cy0 = -h / 2 + barH;
    ctx.fillStyle = '#E7EBF2';
    ctx.fillRect(-w / 2, cy0, w, h - barH);
    if (o.content !== false) {
      const cols = 3, rows = 2;
      const gg = 10 * u;
      const cw = (w - gg * (cols + 1)) / cols;
      const chh = (h - barH - gg * (rows + 1)) / rows;
      for (let r2 = 0; r2 < rows; r2++) {
        for (let c2 = 0; c2 < cols; c2++) {
          const tx = -w / 2 + gg + c2 * (cw + gg);
          const ty = cy0 + gg + r2 * (chh + gg);
          rrect(ctx, tx, ty, cw, chh, 6 * u);
          ctx.fillStyle = '#CBD3E0';
          ctx.fill();
          if (o.img) {
            ctx.save();
            rrect(ctx, tx, ty, cw, chh, 6 * u);
            ctx.clip();
            coverImage(ctx, o.img, tx, ty, cw, chh, 0, 0, 1);
            ctx.restore();
          }
        }
      }
    }
    ctx.restore();

    // обводка окна
    rrect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.lineWidth = Math.max(3, 4 * u);
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.restore();
  }

  /** Рамка выделения с уголками — «выбран лучший кадр» */
  function selectionFrame(ctx, cx, cy, w, h, lw, color) {
    const hw = w / 2, hh = h / 2;
    const a = Math.min(w, h) * 0.22;
    ctx.save();
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    const corners = [
      [-hw, -hh, 1, 1],
      [hw, -hh, -1, 1],
      [hw, hh, -1, -1],
      [-hw, hh, 1, -1]
    ];
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + x + sx * a, cy + y);
      ctx.lineTo(cx + x, cy + y);
      ctx.lineTo(cx + x, cy + y + sy * a);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Курсор-стрелка */
  function cursorArrow(ctx, x, y, s, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, s * 0.95);
    ctx.lineTo(s * 0.24, s * 0.72);
    ctx.lineTo(s * 0.40, s * 1.06);
    ctx.lineTo(s * 0.55, s * 0.99);
    ctx.lineTo(s * 0.39, s * 0.66);
    ctx.lineTo(s * 0.68, s * 0.64);
    ctx.closePath();
    ctx.fillStyle = fill || C.white;
    ctx.fill();
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.strokeStyle = C.ink;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  /** Плашка-URL (для «бурмолда.ру») */
  function urlPill(ctx, x, y, w, h, text, o) {
    o = o || {};
    const r = h * 0.5;
    rrect(ctx, x - w / 2, y - h / 2, w, h, r);
    ctx.fillStyle = o.fill || C.white;
    ctx.fill();
    ctx.lineWidth = o.lw || h * 0.09;
    ctx.strokeStyle = o.stroke || C.ink;
    ctx.stroke();
    label(ctx, text, x, y + h * 0.02, {
      size: o.size || h * 0.52,
      fill: o.color || C.ink,
      align: 'center',
      tracking: o.tracking || 0,
      fontFn: o.fontFn
    });
  }

  /* ------------------------------- аудио-огибающая ------------------------- */
  /**
   * Считает огибающую громкости по каналу PCM. Возвращает функцию env(t) -> 0..1.
   * Используется и в браузере (decodeAudioData), и в node (mpg123-decoder).
   */
  function makeEnvelope(channel, sampleRate, hz) {
    hz = hz || 200;
    const win = Math.max(16, Math.round(sampleRate / hz));
    const n = Math.floor(channel.length / win);
    const arr = new Float32Array(n);
    let max = 1e-9;
    for (let i = 0; i < n; i++) {
      let s = 0;
      const off = i * win;
      for (let j = 0; j < win; j++) { const v = channel[off + j] || 0; s += v * v; }
      const rms = Math.sqrt(s / win);
      arr[i] = rms;
      if (rms > max) max = rms;
    }
    // мягкое сглаживание (атака быстрее, спад плавнее) + нормализация
    const sm = new Float32Array(n);
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const v = arr[i] / max;
      const a = v > prev ? 0.55 : 0.16;
      prev = prev + (v - prev) * a;
      sm[i] = prev;
    }
    const dt = 1 / hz;
    return function env(t) {
      const x = t / dt;
      const i = Math.floor(x);
      if (i < 0) return 0;
      if (i >= n - 1) return sm[n - 1] || 0;
      const f = x - i;
      return sm[i] * (1 - f) + sm[i + 1] * f;
    };
  }

  g.Ads = {
    TAU, clamp, lerp, seg, smooth, easeOutCubic, easeInCubic, easeOutQuint, easeInOutCubic,
    easeOutBack, easeInBack, easeOutElastic, pulse, mulberry32, rr, C, FONT_DISPLAY, FONT_HEAVY,
    rrect, poly, starPath, fillStroke, burst, circle, ring, arc, gear, coin, bill, sparkle,
    arrowDown, arrowRight, bolt, label, labelWidth, fitSize, band, trash, skin, makeEnvelope,
    coverImage, photoTile, browserWindow, selectionFrame, cursorArrow, urlPill
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
