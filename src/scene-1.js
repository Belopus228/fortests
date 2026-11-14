/* =======================================================================
   Сцена 1 — «МЭЛ ФУТАЖЭС»  (звук: [Меллстрой]_рифм......нлайн.mp3, 3.79 c)

   Текст звука:
     «Забери свой лучший кадр… мэл футажэс онлайн!»

   Картинка: на зелёном фоне открывается чёрное окно сайта
   mellfootages.online — внутри сетка футажей, один кадр открывается
   на весь экран сайта (превью), снизу плашка с названием и доменом.
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
    lines: ['ЗАБЕРИ СВОЙ', 'ЛУЧШИЙ КАДР'],
    brand: 'МЭЛ ФУТАЖЭС',
    badge: 'ОНЛАЙН',
    domain: 'mellfootages.online',
    ctaSub: 'ССЫЛКА В ОПИСАНИИ',
    ticker: 'MELLFOOTAGES.ONLINE  •  ЛУЧШИЕ КАДРЫ МЕЛЛСТРОЯ  •  СКАЧАЙ СВОЙ  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { win: 0.06, l1: 0.14, l2: 0.30, grid: 0.46, pick: 1.80, brand: 1.88, online: 3.26, cta: 3.55, tail: 1.0 };

  const R = mulberry32(4242);
  const CODES = ['0:07', '0:12', '0:31', '1:04', '0:19', '0:44'];


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
    id: 'mellfootages',
    name: 'Мэл футажэс',
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
        ctx.translate(Math.sin(t * 57) * sh, Math.cos(t * 43) * sh);
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

      // «шапка сайта» внутри контента
      const headH = cont.h * 0.12;
      const headA = easeOutCubic(seg(t, T.grid - 0.1, T.grid + 0.1));
      ctx.save();
      ctx.globalAlpha = headA;
      label(ctx, 'MELL FOOTAGES', cont.x + cont.w * 0.02, cont.y + headH * 0.5, {
        size: 26 * u, fill: C.white, align: 'left', tracking: 1.5 * u, fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY
      });
      // поиск
      const sw = cont.w * 0.34, shh = headH * 0.62;
      rrsearch(ctx, cont.x + cont.w - sw, cont.y + headH * 0.5 - shh / 2, sw, shh, shh / 2, u);
      label(ctx, 'поиск кадра', cont.x + cont.w - sw * 0.62, cont.y + headH * 0.5, {
        size: 17 * u, fill: '#8D95A6', align: 'left', fontFn: (s) => '700 ' + s + 'px ' + A.FONT_HEAVY
      });
      // чип LIVE
      const liveW = 74 * u;
      band(ctx, cont.x + cont.w * 0.245, cont.y + headH * 0.5, liveW, 30 * u, C.red, C.ink, 3 * u, 8 * u);
      label(ctx, 'LIVE', cont.x + cont.w * 0.245, cont.y + headH * 0.5 + 1 * u, { size: 15 * u, fill: C.white, align: 'center', tracking: 1 * u });
      ctx.restore();

      // сетка футажей
      const gap = 14 * u;
      const cols = 3, rows = 2;
      const gx = cont.x, gy = cont.y + headH;
      const cw = (cont.w - gap * (cols - 1)) / cols;
      const chh = (cont.h - headH - gap * (rows - 1) - gap) / rows;

      for (let i = 0; i < cols * rows; i++) {
        const c = i % cols, r2 = Math.floor(i / cols);
        const ap = seg(t, T.grid + i * 0.055, T.grid + i * 0.055 + 0.22);
        if (ap <= 0) continue;
        const px = gx + c * (cw + gap) + cw / 2;
        const py = gy + r2 * (chh + gap) + chh / 2;
        const dim = 0.55 * seg(t, T.pick, T.pick + 0.35);
        photoTile(ctx, {
          img: photos[i % Math.max(photos.length, 1)] || null,
          x: px, y: py, w: cw, h: chh,
          rot: 0, scale: easeOutBack(clamp(ap), 1.4),
          cropX: rr(mulberry32(i * 77 + 5), -0.6, 0.6), cropY: rr(mulberry32(i * 31 + 9), -0.6, 0.6),
          zoom: 1.1, dim,
          codeText: CODES[i % CODES.length], tag: false, play: true
        });
      }

      /* ---------------------------- 2. ПРЕВЬЮ КАДРА ---------------------------- */
      if (t > T.pick) {
        const p = easeOutBack(seg(t, T.pick, T.pick + 0.36), 1.6);
        const scrim = seg(t, T.pick, T.pick + 0.22);

        ctx.save();
        rrect(ctx, cont.x, cont.y, cont.w, cont.h, 10 * u);
        ctx.clip();
        ctx.fillStyle = 'rgba(5,6,10,' + (0.92 * scrim) + ')';
        ctx.fillRect(cont.x, cont.y, cont.w, cont.h);

        ctx.translate(cont.x + cont.w / 2, cont.y + cont.h * 0.47);
        ctx.scale(p, p);

        const pw = cont.w * 0.78, ph = pw * 0.62;
        photoTile(ctx, {
          img: photos[0] || null,
          x: 0, y: 0, w: pw, h: ph,
          rot: 0, scale: 1,
          cropX: 0, cropY: 0.15, zoom: 1.05,
          codeText: '0:09', tag: true, tagText: 'mellstroy', play: true
        });
        selectionFrame(ctx, 0, 0, pw + 26 * u, ph + 26 * u, 9 * u, C.yellow);

        // заголовок превью
        label(ctx, 'ЛУЧШИЙ КАДР', 0, -ph / 2 - 42 * u, {
          size: 30 * u, fill: C.white, align: 'center', tracking: 2 * u, fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY
        });

        // кнопка скачать
        const btnW = pw * 0.62, btnH = 66 * u;
        const bp = easeOutBack(seg(t, T.pick + 0.22, T.pick + 0.5), 1.5);
        ctx.save();
        ctx.translate(0, ph / 2 + 56 * u);
        ctx.scale(bp * (0.97 + env * 0.06), bp * (0.97 + env * 0.06));
        rrect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH * 0.3);
        ctx.fillStyle = C.yellow;
        ctx.fill();
        ctx.lineWidth = 4 * u;
        ctx.strokeStyle = C.ink;
        ctx.stroke();
        label(ctx, 'СКАЧАТЬ КАДР', 0, 1 * u, { size: 30 * u, fill: C.ink, align: 'center', tracking: 1.5 * u, fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY });
        ctx.restore();

        // крестик
        const xr = 16 * u;
        ctx.lineWidth = 5 * u;
        ctx.strokeStyle = C.white;
        ctx.beginPath();
        ctx.moveTo(pw / 2 + 4 * u - xr, -ph / 2 - 30 * u - xr);
        ctx.lineTo(pw / 2 + 4 * u + xr, -ph / 2 - 30 * u + xr);
        ctx.moveTo(pw / 2 + 4 * u + xr, -ph / 2 - 30 * u - xr);
        ctx.lineTo(pw / 2 + 4 * u - xr, -ph / 2 - 30 * u + xr);
        ctx.stroke();

        ctx.restore();
      }

      // курсор, который «открывает» кадр
      if (t > 1.05 && t < T.pick + 0.35) {
        const k = easeInOutCubic(seg(t, 1.05, T.pick - 0.05));
        const px = lerp(cx + winW * 0.18, cx + winW * 0.01, k);
        const py = lerp(Y(0.44) + winH * 0.16, Y(0.44) + winH * 0.02, k);
        const click = pulse(t, T.pick - 0.06, 0.22);
        cursorArrow(ctx, px, py, 46 * u * (1 - click * 0.15), C.white);
        if (click > 0.01) {
          ctx.save();
          circle(ctx, px, py, 14 * u + click * 34 * u, null, C.yellow, 7 * u * click);
          ctx.restore();
        }
      }

      ctx.restore(); // окно

      /* -------------------------------- 3. ПЛАШКА ------------------------------ */
      {
        const ap = easeOutBack(seg(t, T.brand, T.brand + 0.38), 1.6);
        if (ap > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.805) + (1 - ap) * 120 * u);
          ctx.scale(ap * punch, ap * punch);
          brandPlate(ctx, 0, 0, W * 0.90, H * 0.145, u * 1.15, CFG.brand, CFG.domain, C.yellow);
          ctx.restore();
        }

        // чип «ОНЛАЙН»
        const on = easeOutBack(seg(t, T.online, T.online + 0.3), 1.8);
        if (on > 0) {
          ctx.save();
          ctx.translate(cx + W * 0.30, Y(0.735));
          ctx.rotate(0.08);
          ctx.scale(on * (0.95 + env * 0.2), on * (0.95 + env * 0.2));
          band(ctx, 0, 0, W * 0.32, 74 * u, C.red, C.ink, 6 * u, 18 * u);
          label(ctx, CFG.badge, 0, 2 * u, { size: fitSize(ctx, CFG.badge, W * 0.26, 40 * u), fill: C.white, align: 'center', tracking: 1.5 * u });
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

      function rrsearch(c, x, y, w2, h2, r2, uu) {
        rrect(c, x, y, w2, h2, r2);
        c.fillStyle = '#191D26';
        c.fill();
        c.lineWidth = 2 * uu;
        c.strokeStyle = '#2E3543';
        c.stroke();
      }
    }
  };

  g.SCENES = g.SCENES || [];
  g.SCENES.push(scene);
})(typeof globalThis !== 'undefined' ? globalThis : window);
