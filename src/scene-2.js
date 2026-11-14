/* =======================================================================
   Сцена 2 — «СЛОТ: МУСОР → РУБАП»  (звук: [Меллстрой]_рифм......нлайн.mp3, 3.79 c)
   Тайминги по фразам звука:
     0.05–1.45  «МУСОР»   — крутится слот с мусором
     1.45–1.85  барабаны встают, вспышка
     1.85–3.25  «РУБАП»   — джекпот, счётчик, деньги
     3.25–4.80  призыв к действию
   ======================================================================= */
(function (g) {
  'use strict';
  const A = g.Ads;
  const {
    TAU, clamp, lerp, seg, smooth, easeOutCubic, easeInCubic, easeOutBack,
    easeOutElastic, easeInOutCubic, pulse, mulberry32, rr, C,
    rrect, poly, circle, ring, coin, bill, sparkle, band, label, labelWidth, fitSize,
    trash, skin, arrowDown, FONT_DISPLAY
  } = A;

  /* ------------------------------ настройки ------------------------------- */
  const CFG = {
    word1: 'МУСОР',
    word2: 'РУБАП',
    sub: 'МУСОР  →  РУБАП',
    mult: 'x1000',
    win: '1 000 000 ₽',
    cta: 'ЗАЛЕТАЙ НА РУБАП',
    ctaSub: 'ССЫЛКА В ОПИСАНИИ',
    ticker: 'РУБАП  •  МУСОР  В  ДЕЛО  •  x1000  •  ЗАЛЕТАЙ  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { intro: 0.02, a: 0.06, lock: 1.46, jackpot: 1.84, cta: 3.26, tail: 1.0 };

  const R = mulberry32(777123);
  const ITEMS = ['banana', 'boot', 'sock', 'bottle', 'can', 'paper', 'bag'];

  const reels = [
    { stop: T.lock + 0.06, speed: 13.5, offset: 0 },
    { stop: T.lock + 0.16, speed: 15.0, offset: 3 },
    { stop: T.lock + 0.26, speed: 12.5, offset: 5 }
  ];

  const money = Array.from({ length: 22 }, () => ({
    kind: R() < 0.68 ? 'bill' : 'coin',
    x: rr(R, -0.02, 1.02),
    ph: R(),
    sp: rr(R, 0.42, 0.80),
    sz: rr(R, 0.9, 1.3),
    rot: rr(R, -1.2, 1.2),
    spin: rr(R, -1.6, 1.6),
    from: rr(R, 0, 0.3)
  }));

  const sparks = Array.from({ length: 26 }, () => ({
    a: rr(R, 0, TAU), d: rr(R, 0.3, 1.0), s: rr(R, 0.4, 1.05), sp: rr(R, 0.6, 1.6)
  }));

  /* -------------------------------- хелперы -------------------------------- */
  function slam(t, t0, dur, from) {
    const x = seg(t, t0, t0 + dur);
    const k = easeOutBack(x, 1.9);
    return { sx: lerp(1.12, 1, k), sy: lerp(from === undefined ? 2 : from, 1, k) };
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

  /** позиция ленты барабана (в «иконках»), плавно доводится до целого */
  function reelPos(t, r) {
    const p0 = r.offset + r.stop * r.speed;
    const base = Math.floor(p0);
    const frac = p0 - base;
    const k = easeOutCubic(seg(t, r.stop, r.stop + 0.22));
    return base + frac * (1 - k);
  }

  const WIN_SET = ['bar', 'knife', 'glove'];

  function drawReel(ctx, x, y, w, h, t, r, k, win) {
    ctx.save();
    rrect(ctx, x, y, w, h, 16 * k);
    ctx.fillStyle = C.ink2;
    ctx.fill();
    ctx.clip();

    const cellH = win ? h : h * 0.52;
    const iconS = Math.min(w * (win ? 0.94 : 0.74), cellH * (win ? 0.80 : 0.86));
    const pos = reelPos(t, r);
    const base = Math.floor(pos);
    const frac = pos - base;
    const set = win ? WIN_SET : ITEMS;

    const from = win ? 0 : -2, to = win ? 0 : 2;
    for (let i = from; i <= to; i++) {
      const raw = base + i;
      const idx = ((raw % set.length) + set.length) % set.length;
      const iy = y + h / 2 + (i - frac) * cellH;
      ctx.save();
      ctx.translate(x + w / 2, iy);
      if (win) {
        circle(ctx, 0, 0, iconS * 0.66, C.cream, C.gold, 5 * k);
        skin(ctx, set[idx], iconS * 1.05, 0);
      } else {
        trash(ctx, set[idx], iconS, 0);
      }
      ctx.restore();
    }

    // блик стекла
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.20);
    ctx.lineTo(x + w, y + h * 0.08);
    ctx.lineTo(x + w, y + h * 0.14);
    ctx.lineTo(x, y + h * 0.26);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.fill();

    rrect(ctx, x, y, w, h, 16 * k);
    ctx.lineWidth = 8 * k;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.restore();
  }

  /* --------------------------------- сцена --------------------------------- */
  const scene = {
    id: 'scene2',
    name: 'Слот / Рубап',
    tail: T.tail,
    cfg: CFG,
    draw(ctx, W, H, t, E) {
      const env = E.env(t);
      const u = Math.min(W, H) / 1080;
      const cx = W * 0.5;
      const X = (v) => W * v;
      const Y = (v) => H * v;
      const M = Math.min(W, H);
      const punch = 1 + env * 0.04;

      ctx.save();
      if (t > 0.1) {
        const sh = env * 8 * u;
        ctx.translate(Math.sin(t * 59) * sh, Math.cos(t * 53) * sh);
      }

      const jp = seg(t, T.jackpot, T.jackpot + 0.3); // прогресс джекпота

      /* ------------------------ фон-лучи на джекпоте ------------------------- */
      if (t > T.jackpot - 0.05) {
        const a = seg(t, T.jackpot - 0.05, T.jackpot + 0.25);
        ctx.save();
        ctx.translate(cx, Y(0.52));
        ctx.globalAlpha = 1;
        ctx.rotate(t * 0.3);
        for (let i = 0; i < 18; i++) {
          const ang = (i / 18) * TAU;
          const w = i % 2 ? 0.030 : 0.018;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang - w) * W * 1.1, Math.sin(ang - w) * W * 1.1);
          ctx.lineTo(Math.cos(ang + w) * W * 1.1, Math.sin(ang + w) * W * 1.1);
          ctx.closePath();
          ctx.fillStyle = i % 2 ? C.crimson : C.gold;
          ctx.fill();
        }
        ctx.restore();
      }

      /* -------------------------- звезда за машиной --------------------------- */
      if (t > T.jackpot - 0.02) {
        const st = easeOutElastic(seg(t, T.jackpot, T.jackpot + 0.45));
        if (st > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.545));
          ctx.rotate(-t * 0.22);
          ctx.scale(st, st);
          A.burst(ctx, 0, 0, 16, W * 0.38, W * 0.26, 0, C.yellow, C.ink, 8 * u);
          ctx.restore();
        }
      }

      /* ------------------------------- слот-машина ---------------------------- */
      {
        const frameW = W * 0.88, frameH = H * 0.275;
        const fx = cx - frameW / 2, fy = Y(0.545) - frameH / 2;
        const win = t > T.lock + 0.34;

        // масштаб: на джекпоте машина «подпрыгивает» и золотеет
        const jump = t > T.jackpot ? Math.sin(clamp(seg(t, T.jackpot, T.jackpot + 0.5)) * Math.PI) * 40 * u : 0;
        ctx.save();
        ctx.translate(cx, Y(0.545) - jump);
        ctx.scale(punch, punch);
        ctx.translate(-cx, -Y(0.545));

        // корпус
        rrect(ctx, fx, fy, frameW, frameH, 34 * u);
        A.fillStroke(ctx, win ? C.gold : C.crimson, C.ink, 10 * u);
        rrect(ctx, fx + 16 * u, fy + 16 * u, frameW - 32 * u, frameH - 32 * u, 24 * u);
        A.fillStroke(ctx, C.ink, C.gold, 6 * u);

        // лампочки по периметру
        const bulbs = 14;
        for (let i = 0; i < bulbs * 2; i++) {
          const on = Math.sin(t * 9 + i * 1.3) > 0 ? 1 : 0.35;
          let bx, by;
          if (i < bulbs) { bx = fx + (i / (bulbs - 1)) * frameW; by = fy; }
          else { bx = fx + ((i - bulbs) / (bulbs - 1)) * frameW; by = fy + frameH; }
          ctx.globalAlpha = on;
          circle(ctx, bx, by, 9 * u, C.yellow, C.ink, 3 * u);
          ctx.globalAlpha = 1;
        }

        // «777»
        const topW = W * 0.30;
        band(ctx, cx, fy + 2 * u, topW, 68 * u, C.ink, C.yellow, 6 * u, 16 * u);
        label(ctx, '777', cx, fy + 4 * u, {
          size: 44 * u, fill: win ? C.white : C.yellow, align: 'center', tracking: 5 * u
        });

        // барабаны
        const pad = 42 * u;
        const rw = (frameW - pad * 2 - 24 * u * 2) / 3;
        const rh = frameH - pad * 2;
        for (let i = 0; i < 3; i++) {
          const rx = fx + pad + i * (rw + 24 * u);
          drawReel(ctx, rx, fy + pad, rw, rh, t, reels[i], u, win);
        }

        ctx.restore();
      }

      /* ------------------------------ призовая плашка -------------------------- */
      if (t > 0.42 && t < T.cta + 0.05) {
        const ap = easeOutBack(seg(t, 0.42, 0.68), 1.6);
        ctx.save();
        ctx.translate(cx, Y(0.752));
        ctx.rotate(-0.03);
        ctx.scale(ap * (1 + env * 0.05), ap * (1 + env * 0.05));
        band(ctx, 0, 0, W * 0.56, 96 * u, C.ink, C.gold, 7 * u, 24 * u);
        label(ctx, CFG.mult, 0, 2 * u, { size: 60 * u, fill: C.yellow, stroke: C.ink, strokeW: 8 * u, align: 'center', tracking: 3 * u });
        ctx.restore();
      }

      /* -------------------------------- вспышка ------------------------------- */
      const fl1 = pulse(t, T.jackpot - 0.03, 0.12);
      if (fl1 > 0.01) {
        ctx.save();
        ctx.globalAlpha = clamp(fl1 * 0.85);
        ctx.fillStyle = C.white;
        ctx.fillRect(-W, -H, W * 3, H * 3);
        ctx.restore();
      }

      /* -------------------------------- слово 1 ------------------------------- */
      if (t < T.jackpot + 0.05) {
        wordSlam(ctx, CFG.word1, cx, Y(0.215), W * 0.88, 210 * u, {
          slam: slam(t, T.a + 0.05, 0.4, 1.9), tracking: 3 * u,
          fill: C.yellow, stroke: C.ink, strokeW: 20 * u, shadow: C.crimson, shadowY: 16 * u
        });

        const ap = seg(t, T.a + 0.25, T.a + 0.45);
        if (ap > 0) {
          ctx.save();
          ctx.globalAlpha = ap;
          ctx.translate(cx, Y(0.355));
          const sc = easeOutBack(ap, 1.5);
          ctx.scale(sc, sc);
          band(ctx, 0, 0, W * 0.66, 84 * u, C.ink, C.red, 6 * u, 20 * u);
          label(ctx, CFG.sub, 0, 2 * u, { size: 38 * u, tracking: 1 * u, fill: C.white, align: 'center' });
          ctx.restore();
        }
      }

      /* --------------------------------- деньги -------------------------------- */
      const mf = t > T.jackpot + 0.02 ? seg(t, T.jackpot + 0.02, T.jackpot + 0.24) : 0;
      if (mf > 0) {
        for (const m of money) {
          const tt = t - (T.jackpot + 0.02) - m.from;
          if (tt < 0) continue;
          const span = 1 / m.sp;
          const ph = ((m.ph * span + tt) % span) / span;
          const py = lerp(-H * 0.12, H * 1.1, ph);
          const px = X(m.x) + Math.sin(tt * 1.6 + m.ph * 7) * W * 0.03;
          ctx.save();
          ctx.globalAlpha = mf * 0.95;
          ctx.translate(px, py);
          ctx.rotate(m.rot + tt * m.spin);
          if (m.kind === 'bill') bill(ctx, 0, 0, 118 * u * m.sz, 54 * u * m.sz, 0);
          else coin(ctx, 0, 0, 28 * u * m.sz, 0);
          ctx.restore();
        }
      }

      /* ------------------------------ джекпот-надпись -------------------------- */
      if (t > T.jackpot - 0.02) {

        wordSlam(ctx, CFG.word2, cx, Y(0.205), W * 0.90, 240 * u, {
          slam: slam(t, T.jackpot + 0.06, 0.42, 2.1), tracking: 4 * u,
          fill: C.white, stroke: C.ink, strokeW: 22 * u, shadow: C.gold, shadowY: 18 * u
        });

        // счётчик
        const cp = easeOutCubic(seg(t, T.jackpot + 0.18, T.jackpot + 1.0));
        const val = Math.round(1000000 * cp);
        const txt = String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
        const cw = W * 0.86;
        ctx.save();
        ctx.translate(cx, Y(0.325));
        ctx.scale(1 + env * 0.05, 1 + env * 0.05);
        band(ctx, 0, 0, cw, 96 * u, C.ink, C.yellow, 7 * u, 22 * u);
        label(ctx, txt, 0, 3 * u, { size: 56 * u, fill: C.gold, align: 'center', tracking: 1 * u, stroke: C.ink, strokeW: 8 * u });
        ctx.restore();
      }

      /* ---------------------------------- искры -------------------------------- */
      for (const [bt, by] of [[T.a + 0.06, 0.215], [T.jackpot + 0.02, 0.50]]) {
        const dt = t - bt;
        if (dt < 0 || dt > 0.85) continue;
        for (const s of sparks) {
          const d = s.d * 0.6 * M * easeOutCubic(clamp(dt / 0.5));
          ctx.save();
          ctx.globalAlpha = (1 - clamp(dt / 0.85)) * 0.95;
          sparkle(ctx, cx + Math.cos(s.a) * d * s.sp * 1.4, Y(by) + Math.sin(s.a) * d * s.sp, 26 * u * s.s, dt * 3 + s.a, s.a > 3 ? C.white : C.yellow);
          ctx.restore();
        }
      }

      /* ---------------------------------- CTA ---------------------------------- */
      if (t > T.cta) {
        const p = seg(t, T.cta, T.cta + 0.3);
        const by = lerp(H + 300 * u, Y(0.878), easeOutBack(p, 1.5));

        rrect(ctx, W * 0.045, by - 112 * u, W * 0.91, 224 * u, 26 * u);
        A.fillStroke(ctx, C.ink, C.gold, 8 * u);

        label(ctx, CFG.cta, cx, by - 44 * u, {
          size: fitSize(ctx, CFG.cta, W * 0.80, 68 * u), fill: C.white, align: 'center', tracking: 1 * u
        });

        const bpx = cx - W * 0.04;
        const bpy = by + 54 * u;
        band(ctx, bpx, bpy, W * 0.58, 62 * u, C.red, C.ink, 5 * u, 15 * u);
        label(ctx, CFG.ctaSub, bpx - 16 * u, bpy + 2 * u, { size: 32 * u, fill: C.white, align: 'center', tracking: 1 * u });
        const bob = Math.sin(t * 9) * 9 * u;
        arrowDown(ctx, cx + W * 0.27, bpy + bob, 46 * u, C.yellow, C.ink, 6 * u);
      }

      /* ------------------------------- бегущая строка --------------------------- */
      if (t > 0.34) {
        const ap = easeOutCubic(seg(t, 0.34, 0.52));
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
        const off = -(((t - 0.34) * 240 * u) % tw);
        label(ctx, txt, off, ty + th / 2 + 1 * u, { size: 32 * u, tracking: 2 * u, fill: C.yellow, align: 'left' });
        ctx.restore();
      }

      ctx.restore();
    }
  };

  g.SCENES = g.SCENES || [];
  g.SCENES.push(scene);
})(typeof globalThis !== 'undefined' ? globalThis : window);
