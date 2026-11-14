/* =======================================================================
   Сцена 2 — «БУРМОЛДА.РУ»   (звук: [Меллстрой]_рифм......нлайн.mp3, 3.79 c)

   Текст звука:
     «…найди свою бурмолду… бурмолда точка ру»
   Тайминги по фразам:
     0.14–1.44  «НАЙДИ СВОЮ БУРМОЛДУ» — вокруг летает стена футажей
     1.82–3.24  «БУРМОЛДА»            — один кадр вылетает в центр и увеличивается
     3.24–3.78  «ТОЧКА РУ»            — появляется адресная строка
     3.70–4.79  призыв к действию
   ======================================================================= */
(function (g) {
  'use strict';
  const A = g.Ads;
  const {
    TAU, clamp, lerp, seg, smooth, easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack,
    easeOutElastic, pulse, mulberry32, rr, C,
    rrect, circle, ring, band, label, labelWidth, fitSize, sparkle, arrowDown,
    photoTile, selectionFrame, cursorArrow, urlPill
  } = A;

  /* ------------------------------ настройки ------------------------------- */
  const CFG = {
    lines: ['НАЙДИ СВОЮ', 'БУРМОЛДУ'],
    brand: 'БУРМОЛДА',
    domain: 'бурмолда.ру',
    cta: 'ЗАЛЕТАЙ НА БУРМОЛДА.РУ',
    ctaSub: 'ССЫЛКА В ОПИСАНИИ',
    ticker: 'БУРМОЛДА.РУ  •  НАЙДИ СВОЮ БУРМОЛДУ  •  МЭЛ ФУТАЖЭС  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { l1: 0.16, l2: 0.38, lock: 1.82, domain: 3.26, cta: 3.70, tail: 1.0 };

  const R = mulberry32(998877);

  /* летающая стена футажей */
  const FLOAT = Array.from({ length: 11 }, (_, i) => ({
    ang: (i / 11) * TAU + rr(R, -0.2, 0.2),
    rad: rr(R, 0.82, 1.16),
    spin: rr(R, -0.5, 0.5),
    rot: rr(R, -0.35, 0.35),
    cropX: rr(R, -0.8, 0.8),
    cropY: rr(R, -0.8, 0.8),
    zoom: rr(R, 1.0, 1.3),
    code: ['0:11', '0:26', '0:08', '1:12', '0:37', '0:19'][Math.floor(rr(R, 0, 6))],
    delay: 0.14 + i * 0.045
  }));

  const sparks = Array.from({ length: 24 }, () => ({
    a: rr(R, 0, TAU), d: rr(R, 0.25, 1), s: rr(R, 0.4, 1.05), sp: rr(R, 0.6, 1.6)
  }));

  /* -------------------------------- хелперы -------------------------------- */
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
    id: 'burmolda-ru',
    name: 'Бурмолда.ру',
    tail: T.tail,
    cfg: CFG,
    draw(ctx, W, H, t, E) {
      const env = E.env(t);
      const u = Math.min(W, H) / 1080;
      const cx = W * 0.5;
      const X = (v) => W * v;
      const Y = (v) => H * v;
      const M = Math.min(W, H);
      const photos = A.photos || [];
      const punch = 1 + env * 0.04;

      ctx.save();
      if (t > 0.1) {
        const sh = env * 8 * u;
        ctx.translate(Math.sin(t * 61) * sh, Math.cos(t * 47) * sh);
      }

      /* --------------------------- 1. ЛЕТАЮЩАЯ СТЕНА --------------------------- */
      const out = seg(t, T.lock, T.lock + 0.45);
      const tileW = W * 0.29, tileH = W * 0.29 * 0.94;

      if (t < T.lock + 0.5) {
        for (let i = 0; i < FLOAT.length; i++) {
          const f = FLOAT[i];
          const ap = seg(t, f.delay, f.delay + 0.3);
          if (ap <= 0) continue;
          const ang = f.ang + t * 0.55 * (i % 2 ? 1 : -1);
          const rad = 1 + easeOutCubic(out) * 2.4;
          const px = cx + Math.cos(ang) * W * 0.46 * f.rad * rad;
          const py = Y(0.55) + Math.sin(ang) * H * 0.26 * f.rad * rad;
          const sc = easeOutBack(ap, 1.5) * lerp(1, 0.35, easeInCubic(out));
          photoTile(ctx, {
            img: photos[(i * 3 + 2) % Math.max(photos.length, 1)] || null,
            x: px, y: py, w: tileW, h: tileH,
            rot: f.rot + t * f.spin * 0.4 + out * 1.6,
            scale: sc * (0.9 + (i % 3) * 0.06),
            cropX: f.cropX, cropY: f.cropY, zoom: f.zoom,
            codeText: f.code, tag: i % 2 === 0
          });
        }
      }

      /* ------------------------- 2. ГЛАВНЫЙ КАДР В ЦЕНТРЕ ----------------------- */
      if (t > T.lock - 0.05) {
        const fl = pulse(t, T.lock - 0.03, 0.14);
        if (fl > 0.01) {
          ctx.save();
          ctx.globalAlpha = clamp(fl * 0.85);
          ctx.fillStyle = C.white;
          ctx.fillRect(-W, -H, W * 3, H * 3);
          ctx.restore();
        }

        // звезда
        const st = easeOutElastic(seg(t, T.lock, T.lock + 0.45));
        if (st > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.558));
          ctx.rotate(t * 0.2);
          ctx.scale(st, st);
          A.burst(ctx, 0, 0, 16, W * 0.42, W * 0.28, 0, C.yellow, C.ink, 8 * u);
          ctx.restore();
        }

        const pop = easeOutElastic(seg(t, T.lock + 0.02, T.lock + 0.55));
        const mw = W * 0.78, mh = W * 0.68;
        photoTile(ctx, {
          img: photos[0] || null,
          x: cx, y: Y(0.558), w: mw, h: mh,
          rot: 0, scale: pop * punch,
          cropX: 0, cropY: 0.18, zoom: 1.08,
          codeText: '0:09', tagText: 'burmolda.ru', play: true
        });

        // рамка выделения
        const fr = easeOutBack(seg(t, T.lock + 0.16, T.lock + 0.5), 1.8);
        ctx.save();
        ctx.translate(cx, Y(0.558));
        ctx.scale(fr, fr);
        selectionFrame(ctx, 0, 0, mw + 56 * u, mh + 56 * u, 14 * u, C.yellow);
        selectionFrame(ctx, 0, 0, mw + 40 * u, mh + 40 * u, 6 * u, C.white);
        ctx.restore();

        // искры
        const dt = t - T.lock;
        if (dt < 0.85) {
          for (const s of sparks) {
            const d = s.d * 0.5 * M * easeOutCubic(clamp(dt / 0.5));
            ctx.save();
            ctx.globalAlpha = 1 - clamp(dt / 0.85);
            sparkle(ctx, cx + Math.cos(s.a) * d * s.sp, Y(0.558) + Math.sin(s.a) * d * s.sp, 26 * u * s.s, dt * 3 + s.a, s.a > 3 ? C.white : C.yellow);
            ctx.restore();
          }
        }
      }

      /* -------------------------------- 3. ТЕКСТЫ ------------------------------ */
      if (t < T.lock + 0.08) {
        const exit = easeInCubic(seg(t, T.lock - 0.16, T.lock - 0.01));
        ctx.save();
        ctx.translate(0, -exit * H * 0.5);
        wordSlam(ctx, CFG.lines[0], cx, Y(0.105), W * 0.92, 112 * u, {
          slam: slam(t, T.l1, 0.42, 1.9), tracking: 2 * u,
          fill: C.white, stroke: C.ink, strokeW: 16 * u, shadow: C.red, shadowY: 12 * u
        });
        wordSlam(ctx, CFG.lines[1], cx, Y(0.175), W * 0.92, 126 * u, {
          slam: slam(t, T.l2, 0.42, 1.9), tracking: 2 * u,
          fill: C.yellow, stroke: C.ink, strokeW: 16 * u, shadow: C.crimson, shadowY: 12 * u
        });
        ctx.restore();
      }

      // «БУРМОЛДА»
      if (t > T.lock + 0.04) {
        wordSlam(ctx, CFG.brand, cx, Y(0.152), W * 0.86, 190 * u, {
          slam: slam(t, T.lock + 0.08, 0.42, 2.1), tracking: 3 * u,
          fill: C.white, stroke: C.ink, strokeW: 22 * u, shadow: C.gold, shadowY: 16 * u
        });
      }

      // маленькая плашка под названием
      {
        const ap = easeOutBack(seg(t, T.lock + 0.5, T.lock + 0.8), 1.6);
        if (ap > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.268));
          ctx.scale(ap, ap);
          band(ctx, 0, 0, W * 0.62, 66 * u, C.ink, C.yellow, 5 * u, 16 * u);
          label(ctx, 'МЭЛ ФУТАЖЭС  •  ЛУЧШИЕ КАДРЫ', 0, 2 * u, {
            size: fitSize(ctx, 'МЭЛ ФУТАЖЭС  •  ЛУЧШИЕ КАДРЫ', W * 0.56, 30 * u, { tracking: 1 * u }),
            fill: C.yellow, align: 'center', tracking: 1 * u
          });
          ctx.restore();
        }
      }

      /* --------------------------- 4. АДРЕСНАЯ СТРОКА -------------------------- */
      if (t > T.domain) {
        const p = easeOutBack(seg(t, T.domain, T.domain + 0.3), 1.7);
        const py = Y(0.79);
        ctx.save();
        ctx.translate(cx, py + (1 - p) * 120 * u);
        ctx.scale(p * (0.98 + env * 0.06), p * (0.98 + env * 0.06));

        // «окошко» адресной строки
        const pw = W * 0.80, ph = 96 * u;
        rrect(ctx, -pw / 2, -ph / 2 + 10 * u, pw, ph, ph * 0.5);
        ctx.fillStyle = C.ink;
        ctx.fill();
        rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph * 0.5);
        ctx.fillStyle = C.white;
        ctx.fill();
        ctx.lineWidth = 7 * u;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // «замок»
        const lx = -pw / 2 + 46 * u;
        circle(ctx, lx, 0, 22 * u, C.yellow, C.ink, 5 * u);
        rrect(ctx, lx - 9 * u, -2 * u, 18 * u, 14 * u, 3 * u);
        ctx.fillStyle = C.ink;
        ctx.fill();

        label(ctx, CFG.domain, 18 * u, 2 * u, {
          size: fitSize(ctx, CFG.domain, pw * 0.66, 64 * u), fill: C.ink, align: 'center', tracking: 1 * u
        });

        // «ру» акцентом
        const pulseRu = 1 + pulse(t, T.domain + 0.1, 0.3) * 0.1;
        ctx.save();
        ctx.translate(pw / 2 - 34 * u, 0);
        ctx.scale(pulseRu, pulseRu);
        circle(ctx, 0, 0, 26 * u, C.red, C.ink, 5 * u);
        label(ctx, 'РУ', 0, 2 * u, { size: 26 * u, fill: C.white, align: 'center' });
        ctx.restore();

        // курсор кликает
        const cp = seg(t, T.domain + 0.1, T.domain + 0.42);
        if (cp > 0) {
          const px = lerp(pw * 0.62, pw * 0.20, easeOutCubic(cp));
          const pyp = lerp(ph * 0.9, -ph * 0.1, easeOutCubic(cp));
          cursorArrow(ctx, px, pyp, 52 * u, C.white);
        }
        ctx.restore();
      }

      /* ---------------------------------- CTA ---------------------------------- */
      if (t > T.cta) {
        const p = seg(t, T.cta, T.cta + 0.3);
        const by = lerp(H + 320 * u, Y(0.895), easeOutBack(p, 1.5));

        rrect(ctx, W * 0.045, by - 100 * u, W * 0.91, 200 * u, 24 * u);
        A.fillStroke(ctx, C.ink, C.gold, 8 * u);

        label(ctx, CFG.cta, cx, by - 40 * u, {
          size: fitSize(ctx, CFG.cta, W * 0.80, 56 * u), fill: C.white, align: 'center', tracking: 0.5 * u
        });

        const bpx = cx - W * 0.04;
        const bpy = by + 50 * u;
        band(ctx, bpx, bpy, W * 0.56, 56 * u, C.red, C.ink, 5 * u, 14 * u);
        label(ctx, CFG.ctaSub, bpx - 16 * u, bpy + 2 * u, { size: 30 * u, fill: C.white, align: 'center', tracking: 1 * u });
        const bob = Math.sin(t * 9) * 9 * u;
        arrowDown(ctx, cx + W * 0.27, bpy + bob, 44 * u, C.yellow, C.ink, 6 * u);
      }

      /* ------------------------------- бегущая строка --------------------------- */
      if (t > 0.32) {
        const ap = easeOutCubic(seg(t, 0.32, 0.5));
        ctx.save();
        const th = 58 * u;
        const ty = lerp(H, H - th - 16 * u, ap);
        ctx.fillStyle = C.ink;
        ctx.fillRect(0, ty, W, th);
        ctx.beginPath();
        ctx.rect(0, ty, W, th);
        ctx.clip();
        const txt = CFG.ticker + CFG.ticker;
        const tw = labelWidth(ctx, txt, { size: 32 * u, tracking: 2 * u });
        const off = -(((t - 0.32) * 240 * u) % tw);
        label(ctx, txt, off, ty + th / 2 + 1 * u, { size: 32 * u, tracking: 2 * u, fill: C.yellow, align: 'left' });
        ctx.restore();
      }

      ctx.restore();
    }
  };

  g.SCENES = g.SCENES || [];
  g.SCENES.push(scene);
})(typeof globalThis !== 'undefined' ? globalThis : window);
