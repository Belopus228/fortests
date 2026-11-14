/* =======================================================================
   Сцена 2 — «БУРМОЛДА»   (звук: [Меллстрой]_рифм......а ру .mp3, 4.15 c)

   Текст звука:
     «…найди свою бурмолду… бурмолда точка ру»

   Картинка: чёрное окно сайта burmolda.ru, в поиске печатается
   «найди свою бурмолду», находится кадр — он открывается превью,
   затем подсвечивается адресная строка с доменом.
   ======================================================================= */
(function (g) {
  'use strict';
  const A = g.Ads;
  const {
    TAU, clamp, lerp, seg, easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack,
    easeOutElastic, pulse, mulberry32, rr, C,
    rrect, circle, band, label, labelWidth, fitSize, sparkle, arrowDown,
    photoTile, selectionFrame, cursorArrow, darkSite, brandPlate
  } = A;

  /* ------------------------------ настройки ------------------------------- */
  const CFG = {
    lines: ['НАЙДИ СВОЮ', 'БУРМОЛДУ'],
    brand: 'БУРМОЛДА',
    domain: 'burmolda.ru',
    query: 'найди свою бурмолду',
    ctaSub: 'ССЫЛКА В ОПИСАНИИ',
    ticker: 'BURMOLDA.RU  •  НАЙДИ СВОЮ БУРМОЛДУ  •  МЭЛ ФУТАЖЭС  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { win: 0.06, l1: 0.12, l2: 0.32, type: 0.52, found: 1.92, brand: 2.10, open: 2.24, domain: 3.26, cta: 3.72, tail: 1.0 };

  const R = mulberry32(191919);
  const CODES = ['0:11', '0:26', '0:08', '1:12', '0:37', '0:19'];


  function slam(t, t0, dur, from) {
    const k = easeOutBack(seg(t, t0, t0 + dur), 1.9);
    const f = from === undefined ? 2 : from;
    return { sx: lerp(1.12, 1, k), sy: lerp(f, 1, k) };
  }

  function wordSlam(ctx, text, x, y, maxW, baseSize, o) {
    o = o || {};
    const fs = fitSize(ctx, text, maxW, baseSize, { tracking: o.tracking || 0 });
    const s = o.slam;
    ctx.save();
    ctx.translate(x, y);
    if (s) ctx.scale(s.sx, s.sy);
    if (o.rot) ctx.rotate(o.rot);
    label(ctx, text, 0, 0, Object.assign({}, o, { size: fs, slam: undefined, align: 'center' }));
    ctx.restore();
    return fs;
  }

  /* --------------------------------- сцена --------------------------------- */
  const scene = {
    id: 'burmolda',
    name: 'Бурмолда',
    tail: T.tail,
    cfg: CFG,
    draw(ctx, W, H, t, E) {
      const env = E.env(t);
      const u = Math.min(W, H) / 1080;
      const cx = W * 0.5;
      const Y = (v) => H * v;
      const photos = A.photos || [];
      const punch = 1 + env * 0.03;

      ctx.save();
      if (t > 0.1) {
        const sh = env * 6 * u;
        ctx.translate(Math.sin(t * 61) * sh, Math.cos(t * 47) * sh);
      }


      /* -------------------------------- 0. ЗАГОЛОВОК --------------------------- */
      if (t > T.l1 - 0.03) {
        wordSlam(ctx, CFG.lines[0], cx, Y(0.068), W * 0.88, 78 * u, {
          slam: slam(t, T.l1, 0.38, 1.9), tracking: 1.5 * u,
          fill: C.white, stroke: C.ink, strokeW: 12 * u, shadow: C.gold, shadowY: 8 * u
        });
        wordSlam(ctx, CFG.lines[1], cx, Y(0.128), W * 0.88, 84 * u, {
          slam: slam(t, T.l2, 0.38, 1.9), tracking: 1.5 * u,
          fill: C.yellow, stroke: C.ink, strokeW: 12 * u, shadow: C.crimson, shadowY: 8 * u
        });
      }

      /* -------------------------------- 1. ОКНО -------------------------------- */
      const winW = W * 0.93, winH = H * 0.545;
      const winOpen = easeOutBack(seg(t, T.win, T.win + 0.34), 1.6);
      const winScale = winOpen * (1 + env * 0.006);

      ctx.save();
      ctx.translate(cx, Y(0.44));
      ctx.scale(winScale, winScale);

      const G = darkSite(ctx, winW, winH, u * 1.35, CFG.domain);
      const cont = G.content;
      const adrY = -winH / 2 + G.barH * 0.5;

      /* строка поиска внутри сайта */
      const sH = cont.h * 0.115;
      const searchW = cont.w * 0.99;
      rrect(ctx, cont.x, cont.y, searchW, sH, sH / 2);
      ctx.fillStyle = '#191D26';
      ctx.fill();
      ctx.lineWidth = 2.5 * u;
      ctx.strokeStyle = '#333A49';
      ctx.stroke();

      // лупа
      const lx = cont.x + sH * 0.6, ly = cont.y + sH / 2;
      circle(ctx, lx, ly - 2 * u, sH * 0.19, null, '#8D95A6', 3 * u);
      ctx.beginPath();
      ctx.moveTo(lx + sH * 0.14, ly + sH * 0.12);
      ctx.lineTo(lx + sH * 0.3, ly + sH * 0.28);
      ctx.lineWidth = 3.5 * u;
      ctx.strokeStyle = '#8D95A6';
      ctx.stroke();

      // «печатается» запрос
      const typeK = seg(t, T.type, T.type + 0.85);
      const shown = CFG.query.slice(0, Math.round(CFG.query.length * typeK));
      label(ctx, shown, cont.x + sH * 1.05, cont.y + sH / 2 + 1 * u, {
        size: sH * 0.44, fill: C.white, align: 'left', fontFn: (s) => '700 ' + s + 'px ' + A.FONT_HEAVY
      });
      // курсор ввода
      if (t > T.type && t < T.type + 1.2 && Math.floor(t * 6) % 2 === 0) {
        const tw = labelWidth(ctx, shown, { size: sH * 0.44, fontFn: (s) => '700 ' + s + 'px ' + A.FONT_HEAVY });
        ctx.fillStyle = C.yellow;
        ctx.fillRect(cont.x + sH * 1.05 + tw + 6 * u, cont.y + sH * 0.18, 3 * u, sH * 0.62);
      }

      /* сетка результатов */
      const gap = 12 * u;
      const cols = 3, rows = 2;
      const gx = cont.x, gy = cont.y + sH + gap;
      const cw = (cont.w - gap * (cols - 1)) / cols;
      const chh = (cont.h - sH - gap * rows) / rows;
      const picked = 4;

      for (let i = 0; i < cols * rows; i++) {
        const c = i % cols, r2 = Math.floor(i / cols);
        const ap = seg(t, T.type + 0.25 + i * 0.04, T.type + 0.25 + i * 0.04 + 0.2);
        if (ap <= 0) continue;
        const px = gx + c * (cw + gap) + cw / 2;
        const py = gy + r2 * (chh + gap) + chh / 2;
        const isPicked = i === picked;
        const dim = isPicked ? 0 : 0.45 * seg(t, T.found, T.found + 0.3);

        photoTile(ctx, {
          img: photos[(i * 2 + 1) % Math.max(photos.length, 1)] || null,
          x: px, y: py, w: cw, h: chh,
          rot: 0, scale: easeOutBack(clamp(ap), 1.4),
          cropX: rr(mulberry32(i * 13 + 3), -0.6, 0.6), cropY: rr(mulberry32(i * 29 + 7), -0.6, 0.6),
          zoom: 1.1, dim,
          codeText: CODES[i % CODES.length], tag: false, play: true
        });

        if (isPicked && t > T.found) {
          const a = easeOutBack(seg(t, T.found, T.found + 0.3), 1.8);
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(a, a);
          selectionFrame(ctx, 0, 0, cw + 18 * u, chh + 18 * u, 8 * u, C.yellow);
          ctx.restore();
        }
      }

      /* превью найденного кадра */
      if (t > T.open) {
        const p = easeOutBack(seg(t, T.open, T.open + 0.36), 1.6);
        ctx.save();
        rrect(ctx, cont.x, cont.y, cont.w, cont.h, 10 * u);
        ctx.clip();
        ctx.fillStyle = 'rgba(5,6,10,0.94)';
        ctx.fillRect(cont.x, cont.y, cont.w, cont.h);

        ctx.translate(cont.x + cont.w / 2, cont.y + cont.h * 0.47);
        ctx.scale(p, p);

        const pw = cont.w * 0.70, ph = pw * 0.58;
        photoTile(ctx, {
          img: photos[0] || null,
          x: 0, y: 0, w: pw, h: ph,
          rot: 0, scale: 1,
          cropX: 0, cropY: 0.18, zoom: 1.05,
          codeText: '0:09', tag: true, tagText: 'mellstroy', play: true
        });
        selectionFrame(ctx, 0, 0, pw + 26 * u, ph + 26 * u, 9 * u, C.yellow);

        // бейдж «нашёл»
        const bp = easeOutElastic(seg(t, T.open + 0.18, T.open + 0.55));
        ctx.save();
        ctx.translate(-pw / 2 + 8 * u, -ph / 2 - 34 * u);
        ctx.rotate(-0.09);
        ctx.scale(bp, bp);
        band(ctx, 0, 0, 210 * u, 62 * u, C.red, C.ink, 5 * u, 14 * u);
        label(ctx, 'НАШЁЛ!', 0, 2 * u, { size: 30 * u, fill: C.white, align: 'center', tracking: 1 * u });
        ctx.restore();

        // кнопка «скачать», а на «точка ру» её сменяет домен
        const btnW = pw * 0.62, btnH = 62 * u;
        if (t < T.domain) {
          const bp2 = easeOutBack(seg(t, T.open + 0.25, T.open + 0.55), 1.5);
          ctx.save();
          ctx.translate(0, ph / 2 + 52 * u);
          ctx.scale(bp2 * (0.97 + env * 0.06), bp2 * (0.97 + env * 0.06));
          rrect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH * 0.3);
          ctx.fillStyle = C.yellow;
          ctx.fill();
          ctx.lineWidth = 4 * u;
          ctx.strokeStyle = C.ink;
          ctx.stroke();
          label(ctx, 'СКАЧАТЬ КАДР', 0, 1 * u, { size: 28 * u, fill: C.ink, align: 'center', tracking: 1.5 * u, fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY });
          ctx.restore();
        } else {
          const dp = easeOutBack(seg(t, T.domain, T.domain + 0.3), 1.6);
          ctx.save();
          ctx.translate(0, ph / 2 + 52 * u);
          ctx.scale(dp * (0.98 + env * 0.05), dp * (0.98 + env * 0.05));
          const bw = pw * 0.70, bh = 62 * u;
          rrect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
          ctx.fillStyle = C.white;
          ctx.fill();
          ctx.lineWidth = 4 * u;
          ctx.strokeStyle = C.ink;
          ctx.stroke();
          label(ctx, CFG.domain, 0, 2 * u, {
            size: fitSize(ctx, CFG.domain, bw * 0.7, 32 * u), fill: C.ink, align: 'center', tracking: 0.5 * u,
            fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY
          });
          ctx.restore();
        }

        ctx.restore();
      }

      /* подсветка адресной строки окна */
      if (t > T.domain) {
        const a = seg(t, T.domain, T.domain + 0.25);
        const adrH = G.barH * 0.56;
        const adrW = Math.min(winW * 0.60, winW * 0.60);
        ctx.save();
        rrect(ctx, -adrW / 2, adrY - adrH / 2, adrW, adrH, adrH / 2);
        ctx.lineWidth = 5 * u;
        ctx.strokeStyle = C.yellow;
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.restore();
      }

      // курсор кликает по адресной строке
      if (t > T.domain + 0.05) {
        const k = easeInOutCubic(seg(t, T.domain + 0.05, T.domain + 0.45));
        const px = lerp(cx + winW * 0.22, cx + winW * 0.08, k);
        const py = lerp(Y(0.44) + winH * 0.28, Y(0.44) + winH * 0.06, k);
        const click = pulse(t, T.domain + 0.4, 0.22);
        cursorArrow(ctx, px, py, 44 * u * (1 - click * 0.15), C.white);
      }

      ctx.restore(); // окно

      /* -------------------------------- 2. ПЛАШКА ------------------------------ */
      {
        const ap = easeOutBack(seg(t, T.brand, T.brand + 0.38), 1.6);
        if (ap > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.805) + (1 - ap) * 120 * u);
          ctx.scale(ap * punch, ap * punch);
          brandPlate(ctx, 0, 0, W * 0.90, H * 0.145, u * 1.15, CFG.brand, CFG.domain, C.yellow);
          ctx.restore();
        }
      }

      /* ---------------------------------- CTA ---------------------------------- */
      if (t > T.cta) {
        const ap = easeOutBack(seg(t, T.cta, T.cta + 0.28), 1.6);
        ctx.save();
        ctx.translate(cx, Y(0.922));
        ctx.scale(ap, ap);
        const bw = W * 0.66, bh = 58 * u;
        rrect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
        ctx.fillStyle = C.red;
        ctx.fill();
        ctx.lineWidth = 4 * u;
        ctx.strokeStyle = C.ink;
        ctx.stroke();
        label(ctx, CFG.ctaSub, -22 * u, 2 * u, { size: 30 * u, fill: C.white, align: 'center', tracking: 1 * u });
        const bob = Math.sin(t * 9) * 7 * u;
        arrowDown(ctx, bw / 2 - 34 * u, bob, 34 * u, C.yellow, C.ink, 5 * u);
        ctx.restore();
      }

      /* ------------------------------- бегущая строка --------------------------- */
      if (t > 0.3) {
        const ap = easeOutCubic(seg(t, 0.3, 0.48));
        ctx.save();
        const th = 54 * u;
        const ty = lerp(H, H - th - 14 * u, ap);
        ctx.fillStyle = C.ink;
        ctx.fillRect(0, ty, W, th);
        ctx.beginPath();
        ctx.rect(0, ty, W, th);
        ctx.clip();
        const txt = CFG.ticker + CFG.ticker;
        const tw = labelWidth(ctx, txt, { size: 28 * u, tracking: 2 * u });
        const off = -(((t - 0.3) * 220 * u) % tw);
        label(ctx, txt, off, ty + th / 2 + 1 * u, { size: 28 * u, tracking: 2 * u, fill: C.yellow, align: 'left' });
        ctx.restore();
      }

      ctx.restore();
    }
  };

  g.SCENES = g.SCENES || [];
  g.SCENES.push(scene);
})(typeof globalThis !== 'undefined' ? globalThis : window);
