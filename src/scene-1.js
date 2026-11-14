/* =======================================================================
   Сцена 1 — «АПГРЕЙДЕР»  (звук: [Меллстрой]_рифм......а ру .mp3, 4.15 c)
   Тайминги выставлены по фразам звука:
     0.15–1.70  «АПГРЕЙДЕР»   — крутится апгрейд-колесо, вокруг летает мусор
     1.75–3.00  «МУСОРДРОП»   — мусор сыпется в бак
     3.05–3.80  «РУБАП»       — из бака вылетает золотой АК, деньги
     3.90–5.15  призыв к действию
   ======================================================================= */
(function (g) {
  'use strict';
  const A = g.Ads;
  const {
    TAU, clamp, lerp, seg, smooth, easeOutCubic, easeInCubic, easeOutBack,
    easeOutElastic, pulse, mulberry32, rr, C,
    rrect, poly, circle, ring, coin, bill, sparkle, band, label, labelWidth, fitSize,
    gear, trash, skin, arrowDown, arrowRight, FONT_DISPLAY
  } = A;

  /* ------------------------------ настройки -------------------------------
     Меняй слова под свой ролик — всё остальное подстроится само.          */
  const CFG = {
    word1: 'АПГРЕЙДЕР',
    word2: 'МУСОРДРОП',
    word3: 'РУБАП',
    sub: 'МУСОР  →  РУБАП',
    mult1: 'x100',
    mult2: 'x1000',
    cta: 'ЗАЛЕТАЙ НА АПГРЕЙДЕР',
    ctaSub: 'ССЫЛКА В ОПИСАНИИ',
    ticker: 'АПГРЕЙДЕР  •  МУСОРДРОП  •  РУБАП  •  x1000  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { intro: 0.02, b1: 0.14, b2: 1.76, b3: 3.04, cta: 3.92, tail: 1.0 };

  /* -------------------- данные (фиксированный сид → стабильно) ------------- */
  const R = mulberry32(20261114);

  const orbit = ['banana', 'boot', 'sock', 'bottle', 'can', 'paper', 'bag'].map((k, i, arr) => ({
    kind: k,
    ang: (i / arr.length) * TAU + rr(R, -0.16, 0.16),
    rad: rr(R, 0.92, 1.14),
    spin: rr(R, -1.2, 1.2),
    size: rr(R, 0.9, 1.12),
    pop: 0.34 + i * 0.075
  }));

  const rainTrash = Array.from({ length: 20 }, () => ({
    kind: ['banana', 'boot', 'sock', 'bottle', 'can', 'paper', 'bag'][Math.floor(rr(R, 0, 7))],
    spread: rr(R, -1, 1),
    ph: R(),
    sp: rr(R, 0.62, 1.05),
    sz: rr(R, 0.085, 0.145),
    spin: rr(R, -2.6, 2.6)
  }));

  const money = Array.from({ length: 18 }, () => ({
    kind: R() < 0.7 ? 'bill' : 'coin',
    x: rr(R, -0.02, 1.02),
    ph: R(),
    sp: rr(R, 0.4, 0.72),
    sz: rr(R, 0.9, 1.3),
    rot: rr(R, -1.2, 1.2),
    spin: rr(R, -1.4, 1.4)
  }));

  const sparks = Array.from({ length: 24 }, () => ({
    a: rr(R, 0, TAU), d: rr(R, 0.25, 1.0), s: rr(R, 0.4, 1), sp: rr(R, 0.6, 1.6)
  }));

  /* -------------------------------- хелперы -------------------------------- */
  /** «Плюх» по вертикали: не вылезает за ширину кадра, зато бьёт как штамп */
  function slam(t, t0, dur, from) {
    const x = seg(t, t0, t0 + dur);
    const k = easeOutBack(x, 1.9);
    const f = from === undefined ? 2.0 : from;
    return { sx: lerp(1.14, 1, k), sy: lerp(f, 1, k) };
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

  function drawWheel(ctx, r, rot) {
    // зубцы + корпус
    gear(ctx, 0, 0, r, 14, rot, C.gold, C.ink, r * 0.05);
    circle(ctx, 0, 0, r * 0.84, C.ink, null, 0);
    // сегменты
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = rot + (i / n) * TAU, a1 = a0 + TAU / n;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.80, a0, a1 - 0.02);
      ctx.arc(0, 0, r * 0.63, a1 - 0.02, a0, true);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? C.crimson : C.gold;
      ctx.fill();
    }
    ring(ctx, 0, 0, r * 0.615, C.ink, r * 0.035);
    circle(ctx, 0, 0, r * 0.55, C.white, C.ink, r * 0.035);
    // стрелка «вверх» = апгрейд
    const s = r * 0.62;
    ctx.save();
    ctx.rotate(Math.PI);
    A.arrowDown(ctx, 0, 0, s, C.red, C.ink, r * 0.05);
    ctx.restore();
  }

  function drawBin(ctx, s, lidLift, fill) {
    // мусорный бак
    const w = s * 0.72, h = s * 0.9;
    poly(ctx, [[-w / 2, -h * 0.34], [w / 2, -h * 0.34], [w * 0.38, h * 0.5], [-w * 0.38, h * 0.5]]);
    A.fillStroke(ctx, C.steel, C.ink, s * 0.045);
    // полосы
    ctx.strokeStyle = C.grey;
    ctx.lineWidth = s * 0.03;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w * 0.18, -h * 0.28);
      ctx.lineTo(i * w * 0.14, h * 0.42);
      ctx.stroke();
    }
    // крышка
    ctx.save();
    ctx.translate(0, -h * 0.36 - lidLift);
    rrect(ctx, -w * 0.56, -s * 0.09, w * 1.12, s * 0.16, s * 0.05);
    A.fillStroke(ctx, C.grey, C.ink, s * 0.045);
    rrect(ctx, -s * 0.07, -s * 0.16, s * 0.14, s * 0.09, s * 0.03);
    A.fillStroke(ctx, C.ink, C.ink, 0);
    ctx.restore();
    // содержимое
    if (fill > 0) {
      ctx.save();
      ctx.beginPath();
      poly(ctx, [[-w / 2, -h * 0.34], [w / 2, -h * 0.34], [w * 0.38, h * 0.5], [-w * 0.38, h * 0.5]]);
      ctx.clip();
      ctx.fillStyle = C.gold;
      ctx.fillRect(-w / 2, lerp(h * 0.5, -h * 0.2, fill), w, h);
      ctx.restore();
    }
  }

  /* --------------------------------- сцена --------------------------------- */
  const scene = {
    id: 'scene1',
    name: 'Апгрейдер',
    tail: T.tail,
    cfg: CFG,
    draw(ctx, W, H, t, E) {
      const env = E.env(t);
      const u = Math.min(W, H) / 1080;
      const cx = W * 0.5;
      const X = (v) => W * v;
      const Y = (v) => H * v;
      const M = Math.min(W, H);
      const punch = 1 + env * 0.045;

      ctx.save();
      if (t > 0.12) {
        const sh = env * 8 * u;
        ctx.translate(Math.sin(t * 63) * sh, Math.cos(t * 49) * sh);
      }

      /* ------------------------------ 1. АПГРЕЙДЕР ------------------------------ */
      if (t < T.b2 - 0.01) {
        const exit1 = easeInCubic(seg(t, T.b2 - 0.20, T.b2));
        const outWheel = seg(t, T.b2 - 0.06, T.b2 + 0.26);
        ctx.save();
        ctx.translate(0, -exit1 * H * 0.55);
        const inWheel = easeOutBack(seg(t, T.intro, T.intro + 0.4), 1.6);
        const wheelScale = lerp(inWheel, 0.1, easeInCubic(outWheel));
        const spin = t * 0.9 + easeInCubic(outWheel) * 12;
        const wy = Y(0.525);
        const r = M * 0.295;

        // колесо
        ctx.save();
        ctx.translate(cx, wy);
        ctx.scale(wheelScale, wheelScale);
        ctx.globalAlpha = 1 - outWheel;
        drawWheel(ctx, r, spin);
        ctx.restore();

        // ряд множителей под колесом
        const chips = ['x2', 'x5', 'x10', CFG.mult1];
        const rowY = Y(0.762);
        const gap = W * 0.235;
        chips.forEach((txt, i) => {
          const px = cx + (i - (chips.length - 1) / 2) * gap;
          const ap = seg(t, T.intro + 0.34 + i * 0.07, T.intro + 0.52 + i * 0.07);
          if (ap <= 0) return;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.translate(px, rowY);
          ctx.rotate((i - 1.5) * 0.03);
          const sc = easeOutBack(ap, 1.5);
          ctx.scale(sc, sc);
          band(ctx, 0, 0, W * 0.20, 56 * u, i === chips.length - 1 ? C.red : C.ink, C.yellow, 5 * u, 12 * u);
          label(ctx, txt, 0, 1 * u, { size: 30 * u, fill: C.white, align: 'center', tracking: 1 * u });
          ctx.restore();
        });

        // орбита мусора
        for (const it of orbit) {
          const ap = seg(t, it.pop, it.pop + 0.2);
          if (ap <= 0) continue;
          const a = it.ang + t * 0.5;
          const rad = r * 1.30 * it.rad;
          const px = cx + Math.cos(a) * rad;
          const py = wy + Math.sin(a) * rad * 0.95;
          const sink = easeInCubic(outWheel);
          ctx.save();
          ctx.globalAlpha = 1 - outWheel;
          ctx.translate(lerp(px, cx, sink), lerp(py, wy, sink));
          ctx.rotate(it.spin * t + sink * 5);
          ctx.scale(easeOutBack(ap, 1.4), easeOutBack(ap, 1.4));
          trash(ctx, it.kind, 96 * u * it.size * lerp(1, 0.2, sink), 0);
          ctx.restore();
        }

        // слово
        wordSlam(ctx, CFG.word1, cx, Y(0.205), W * 0.92, 215 * u, {
          slam: slam(t, T.b1, 0.42, 1.9), tracking: 2 * u,
          fill: C.white, stroke: C.ink, strokeW: 20 * u, shadow: C.red, shadowY: 16 * u
        });

        // лента
        const ap = seg(t, T.b1 + 0.24, T.b1 + 0.48);
        if (ap > 0) {
          ctx.save();
          ctx.globalAlpha = ap;
          const sc = easeOutBack(ap, 1.6);
          ctx.translate(cx, Y(0.815));
          ctx.scale(sc, sc);
          band(ctx, 0, 0, W * 0.70, 92 * u, C.ink, C.yellow, 6 * u, 22 * u);
          label(ctx, CFG.sub, 0, 2 * u, { size: 40 * u, tracking: 2 * u, fill: C.yellow, align: 'center' });
          ctx.restore();
        }
        ctx.restore();
      }

      /* ------------------------------ 2. МУСОРДРОП ------------------------------ */
      if (t > T.b2 - 0.04 && t < T.b3 + 0.4) {
        const out2 = seg(t, T.b3 - 0.02, T.b3 + 0.14);

        const fl = pulse(t, T.b2 - 0.02, 0.13);
        if (fl > 0.01) {
          ctx.save();
          ctx.globalAlpha = clamp(fl * 0.92);
          ctx.fillStyle = C.white;
          ctx.fillRect(-W, -H, W * 3, H * 3);
          ctx.restore();
        }

        // бак
        const binScale = easeOutBack(seg(t, T.b2 + 0.06, T.b2 + 0.4), 1.5) * lerp(1, 0.4, out2);
        ctx.save();
        ctx.translate(cx, Y(0.705));
        ctx.scale(binScale * punch, binScale * punch);
        drawBin(ctx, M * 0.42, Math.max(0, Math.sin(t * 5) * 10 * u) + out2 * 60 * u, seg(t, T.b2 + 0.1, T.b2 + 0.9));
        ctx.restore();

        // мусор сыпется в бак
        for (const d of rainTrash) {
          const tt = t - (T.b2 - 0.02);
          if (tt < 0) continue;
          const span = 1 / d.sp;
          const ph = ((d.ph * span + tt) % span) / span;
          const px = cx + d.spread * W * 0.30 * (1 - ph * 0.5);
          const py = lerp(-H * 0.14, Y(0.66), ph);
          ctx.save();
          ctx.globalAlpha = 1 - out2;
          ctx.translate(px, py);
          ctx.rotate(tt * d.spin + d.ph * 6);
          trash(ctx, d.kind, d.sz * M * lerp(1, 0.3, out2), 0);
          ctx.restore();
        }

        // слово
        wordSlam(ctx, CFG.word2, cx, Y(0.255), W * 0.90, 200 * u, {
          slam: slam(t, T.b2 + 0.02, 0.4, 1.9), tracking: 2 * u,
          alpha: 1 - seg(t, T.b3 - 0.04, T.b3 + 0.02),
          fill: C.yellow, stroke: C.ink, strokeW: 20 * u, shadow: C.crimson, shadowY: 14 * u
        });

        // лента
        const ap = seg(t, T.b2 + 0.18, T.b2 + 0.36);
        if (ap > 0) {
          ctx.save();
          ctx.globalAlpha = ap * (1 - out2);
          ctx.translate(cx, Y(0.455));
          const sc = easeOutBack(ap, 1.6);
          ctx.scale(sc, sc);
          band(ctx, 0, 0, W * 0.64, 86 * u, C.ink, C.red, 6 * u, 20 * u);
          label(ctx, CFG.sub, 0, 2 * u, { size: 36 * u, tracking: 1 * u, fill: C.white, align: 'center' });
          ctx.restore();
        }
      }

      /* ------------------------------ 3. РУБАП + ЛУТ ---------------------------- */
      const moneyFade = t > T.b3 + 0.02 ? seg(t, T.b3 + 0.02, T.b3 + 0.22) : 0;
      if (t > T.b3 - 0.04) {
        const fl = pulse(t, T.b3 - 0.02, 0.09);
        if (fl > 0.01) {
          ctx.save();
          ctx.globalAlpha = clamp(fl * 0.8);
          ctx.fillStyle = C.white;
          ctx.fillRect(-W, -H, W * 3, H * 3);
          ctx.restore();
        }

        // звезда-вспышка за АК
        const st = easeOutElastic(seg(t, T.b3 + 0.02, T.b3 + 0.5));
        if (st > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.60));
          ctx.rotate(t * 0.35);
          ctx.scale(st, st);
          A.burst(ctx, 0, 0, 14, M * 0.38, M * 0.25, 0, C.yellow, C.ink, 7 * u);
          ctx.restore();
        }

        // деньги (под текстом)
        if (moneyFade > 0) {
          for (const m of money) {
            const tt = t - (T.b3 + 0.02);
            const span = 1 / m.sp;
            const ph = ((m.ph * span + tt) % span) / span;
            const py = lerp(-H * 0.12, H * 1.1, ph);
            const px = X(m.x) + Math.sin(tt * 1.5 + m.ph * 7) * W * 0.03;
            ctx.save();
            ctx.globalAlpha = moneyFade * 0.95;
            ctx.translate(px, py);
            ctx.rotate(m.rot + tt * m.spin);
            if (m.kind === 'bill') bill(ctx, 0, 0, 116 * u * m.sz, 54 * u * m.sz, 0);
            else coin(ctx, 0, 0, 28 * u * m.sz, 0);
            ctx.restore();
          }
        }

        // АК
        const popA = easeOutElastic(seg(t, T.b3 + 0.02, T.b3 + 0.5));
        ctx.save();
        ctx.translate(cx, Y(0.60));
        ctx.rotate(-0.10 + Math.sin(t * 2.2) * 0.02);
        ctx.scale(popA * punch, popA * punch);
        skin(ctx, 'ak', M * 0.46, 0);
        ctx.restore();

        // нож + слиток
        const b1 = easeOutBack(seg(t, T.b3 + 0.26, T.b3 + 0.52), 1.6);
        ctx.save();
        ctx.translate(X(0.17), Y(0.745));
        ctx.rotate(-0.4);
        ctx.scale(b1, b1);
        skin(ctx, 'knife', M * 0.20, 0);
        ctx.restore();

        const b2 = easeOutBack(seg(t, T.b3 + 0.34, T.b3 + 0.6), 1.6);
        ctx.save();
        ctx.translate(X(0.82), Y(0.735));
        ctx.rotate(0.3);
        ctx.scale(b2, b2);
        skin(ctx, 'bar', M * 0.21, 0);
        ctx.restore();

        // слово
        wordSlam(ctx, CFG.word3, cx, Y(0.15), W * 0.92, 270 * u, {
          slam: slam(t, T.b3 + 0.18, 0.42, 2.0), tracking: 4 * u,
          fill: C.white, stroke: C.ink, strokeW: 22 * u, shadow: C.gold, shadowY: 18 * u
        });

        // x1000
        const bx = easeOutElastic(seg(t, T.b3 + 0.36, T.b3 + 0.78));
        if (bx > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.305));
          ctx.rotate(-0.05);
          const k = bx * (0.9 + env * 0.35);
          ctx.scale(k, k);
          band(ctx, 0, 0, 280 * u, 96 * u, C.red, C.ink, 8 * u, 24 * u);
          label(ctx, CFG.mult2, 0, 2 * u, { size: 68 * u, fill: C.white, stroke: C.ink, strokeW: 9 * u, align: 'center', tracking: 2 * u });
          ctx.restore();
        }
      }

      /* ------------------------------ искры/брызги ----------------------------- */
      const burstAt = [[T.b1 + 0.04, 0.235], [T.b2 + 0.04, 0.255], [T.b3 - 0.01, 0.60]];
      for (const [bt, by] of burstAt) {
        const dt = t - bt;
        if (dt < 0 || dt > 0.85) continue;
        for (const s of sparks) {
          const d = s.d * 0.62 * M * easeOutCubic(clamp(dt / 0.5));
          const px = cx + Math.cos(s.a) * d * s.sp * 1.4;
          const py = Y(by) + Math.sin(s.a) * d * s.sp;
          ctx.save();
          ctx.globalAlpha = (1 - clamp(dt / 0.85)) * 0.95;
          sparkle(ctx, px, py, 26 * u * s.s, dt * 3 + s.a, s.a > 3 ? C.white : C.yellow);
          ctx.restore();
        }
      }

      /* ---------------------------------- CTA ---------------------------------- */
      if (t > T.cta) {
        const p = seg(t, T.cta, T.cta + 0.3);
        const by = lerp(H + 300 * u, Y(0.855), easeOutBack(p, 1.5));

        rrect(ctx, W * 0.045, by - 112 * u, W * 0.91, 224 * u, 26 * u);
        A.fillStroke(ctx, C.ink, C.yellow, 8 * u);

        label(ctx, CFG.cta, cx, by - 44 * u, {
          size: fitSize(ctx, CFG.cta, W * 0.80, 66 * u), fill: C.white, align: 'center', tracking: 1 * u
        });

        const bpx = cx - W * 0.04;
        const bpy = by + 54 * u;
        band(ctx, bpx, bpy, W * 0.58, 62 * u, C.red, C.ink, 5 * u, 15 * u);
        label(ctx, CFG.ctaSub, bpx - 16 * u, bpy + 2 * u, { size: 32 * u, fill: C.white, align: 'center', tracking: 1 * u });
        const bob = Math.sin(t * 9) * 9 * u;
        arrowDown(ctx, cx + W * 0.27, bpy + bob, 46 * u, C.yellow, C.ink, 6 * u);
      }

      /* ------------------------------- бегущая строка --------------------------- */
      if (t > 0.30) {
        const ap = easeOutCubic(seg(t, 0.30, 0.48));
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
        const off = -(((t - 0.30) * 240 * u) % tw);
        label(ctx, txt, off, ty + th / 2 + 1 * u, { size: 32 * u, tracking: 2 * u, fill: C.yellow, align: 'left' });
        ctx.restore();
      }

      ctx.restore();
    }
  };

  g.SCENES = g.SCENES || [];
  g.SCENES.push(scene);
})(typeof globalThis !== 'undefined' ? globalThis : window);
