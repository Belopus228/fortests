/* =======================================================================
   Сцена 1 — «МЭЛ ФУТАЖЭС»   (звук: [Меллстрой]_рифм......а ру .mp3, 4.15 c)

   Текст звука:
     «Забери свой лучший кадр… мэл футажэс онлайн!»
   Тайминги по фразам:
     0.10–1.74  «ЗАБЕРИ СВОЙ ЛУЧШИЙ КАДР» — открывается окошко, из него
                 вылетает сайт — стена футажей
     2.06–3.00  «МЭЛ ФУТАЖЭС»  — один кадр выделяется и увеличивается
     3.24–3.80  «ОНЛАЙН»
     3.86–5.15  призыв к действию
   ======================================================================= */
(function (g) {
  'use strict';
  const A = g.Ads;
  const {
    TAU, clamp, lerp, seg, smooth, easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack,
    easeOutElastic, pulse, mulberry32, rr, C,
    rrect, circle, band, label, labelWidth, fitSize, trash, sparkle, arrowDown,
    photoTile, browserWindow, selectionFrame, cursorArrow, FONT_DISPLAY
  } = A;

  /* ------------------------------ настройки -------------------------------
     Меняй слова под свой ролик — остальное подстроится само.               */
  const CFG = {
    lines: ['ЗАБЕРИ СВОЙ', 'ЛУЧШИЙ КАДР'],
    brand: 'МЭЛ ФУТАЖЭС',
    brand2: 'ОНЛАЙН',
    url: 'mel-footage.online',
    cta: 'ЗАЛЕТАЙ НА МЭЛ ФУТАЖЭС',
    ctaSub: 'ССЫЛКА В ОПИСАНИИ',
    ticker: 'МЭЛ ФУТАЖЭС  •  ОНЛАЙН  •  ЛУЧШИЕ ФУТАЖИ  •  БУРМОЛДА.РУ  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { win: 0.10, l1: 0.16, l2: 0.36, wall: 0.46, pick: 1.76, brand: 2.06, online: 3.26, cta: 3.86, tail: 1.0 };

  const R = mulberry32(20261115);

  /* стена футажей: сетка + «вылетающие» за край экрана */
  const SLOTS = [];
  const cols = [0.24, 0.50, 0.76];
  const rows = [0.365, 0.545, 0.725];
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < cols.length; ci++) {
      SLOTS.push({
        fx: cols[ci], fy: rows[ri],
        rot: (ri * 3 + ci) % 2 ? 0.035 : -0.03,
        cropX: rr(R, -0.7, 0.7), cropY: rr(R, -0.7, 0.7),
        zoom: rr(R, 1.0, 1.25),
        code: ['0:07', '0:12', '0:31', '1:04', '0:19', '0:44'][Math.floor(rr(R, 0, 6))],
        delay: 0.46 + (ri + ci) * 0.055
      });
    }
  }
  const EDGE = [
    { fx: -0.06, fy: 0.44, rot: -0.28, cropX: 0.5, cropY: 0 },
    { fx: 1.06, fy: 0.40, rot: 0.26, cropX: -0.5, cropY: 0.2 },
    { fx: -0.04, fy: 0.80, rot: 0.22, cropX: 0.3, cropY: -0.3 },
    { fx: 1.04, fy: 0.76, rot: -0.2, cropX: -0.3, cropY: 0.4 }
  ].map((o) => ({ ...o, zoom: 1.1, code: '0:23', delay: 0.55 }));

  const sparks = Array.from({ length: 22 }, () => ({
    a: rr(R, 0, TAU), d: rr(R, 0.25, 1), s: rr(R, 0.4, 1), sp: rr(R, 0.6, 1.6)
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
    id: 'melstroy-footage',
    name: 'Мэл футажэс',
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
      const punch = 1 + env * 0.035;

      ctx.save();
      if (t > 0.1) {
        const sh = env * 7 * u;
        ctx.translate(Math.sin(t * 57) * sh, Math.cos(t * 43) * sh);
      }

      /* ------------------------------ 1. ОКНО САЙТА ---------------------------- */
      if (t > T.win - 0.02 && t < T.pick + 0.55) {
        const open = easeOutBack(seg(t, T.win, T.win + 0.34), 1.7);
        const shrink = easeInOutCubic(seg(t, T.pick, T.pick + 0.32));
        const sc = open * lerp(1, 0.42, shrink);
        browserWindow(ctx, {
          x: cx, y: Y(0.545), w: W * 0.68, h: H * 0.34,
          u: u * 1.6, scale: sc, url: CFG.url, img: photos[1] || null
        });
      }

      /* ----------------------------- 2. СТЕНА ФУТАЖЕЙ -------------------------- */
      const pickedIdx = 4;
      const pickT = T.pick;

      function tilePos(slot, i, isEdge) {
        const baseX = X(slot.fx), baseY = Y(slot.fy);
        const fromX = cx, fromY = Y(0.545);
        const p = seg(t, slot.delay, slot.delay + 0.55);
        const k = easeOutBack(clamp(p), 1.5);
        let x = lerp(fromX, baseX, k);
        let y = lerp(fromY, baseY, k);
        let sc = lerp(0.15, 1, easeOutCubic(clamp(p)));

        if (!isEdge && i === pickedIdx) {
          // выбранный кадр: наезжает и увеличивается
          const z = easeOutBack(seg(t, pickT, pickT + 0.4), 1.6);
          const zz = lerp(1, 2.05, z);
          x = lerp(x, cx, z);
          y = lerp(y, Y(0.575), z);
          sc *= zz;
        } else if (!isEdge) {
          // остальные отходят и притухают
          const d = easeInOutCubic(seg(t, pickT, pickT + 0.4));
          x = lerp(x, lerp(baseX, cx, 0.06), d);
          y = y + (y < Y(0.575) ? -1 : 1) * 22 * u * d;
          sc *= lerp(1, 0.72, d);
        }
        return { x, y, sc, p };
      }

      const tileW = W * 0.27, tileH = W * 0.27 * 0.92;
      const all = SLOTS.map((s, i) => ({ slot: s, i, edge: false })).concat(EDGE.map((s, i) => ({ slot: s, i: i + 9, edge: true })));

      all.sort((a, b) => (a.i === pickedIdx ? 1 : 0) - (b.i === pickedIdx ? 1 : 0));
      for (const item of all) {
        const s = item.slot;
        const pr = tilePos(s, item.i, item.edge);
        if (pr.p <= 0) continue;
        const dim = item.edge ? 0 : (item.i === pickedIdx ? 0 : 0.55 * seg(t, pickT, pickT + 0.35));
        photoTile(ctx, {
          img: (item.i === pickedIdx ? (photos[1] || photos[0]) : photos[item.i % Math.max(photos.length, 1)]) || null,
          x: pr.x, y: pr.y, w: tileW, h: tileH,
          rot: s.rot * (1 - (item.i === pickedIdx ? seg(t, pickT, pickT + 0.4) : 0)),
          scale: pr.sc * (item.i === pickedIdx ? punch : 1) * (item.edge ? 1.1 : 1),
          cropX: s.cropX, cropY: s.cropY, zoom: s.zoom,
          dim, codeText: s.code, tag: !item.edge,
          play: item.i === pickedIdx
        });
      }

      /* --------------------------- 3. ВЫДЕЛЕНИЕ КАДРА -------------------------- */
      if (t > pickT) {
        const a = easeOutBack(seg(t, pickT + 0.08, pickT + 0.42), 1.8);
        const hw = tileW * 1.85 * 0.5 + 30 * u;
        const hh = tileH * 1.85 * 0.5 + 30 * u;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.translate(cx, Y(0.575));
        ctx.scale(a, a);
        selectionFrame(ctx, 0, 0, hw * 2, hh * 2, 14 * u, C.yellow);
        selectionFrame(ctx, 0, 0, hw * 2 - 16 * u, hh * 2 - 16 * u, 6 * u, C.white);
        ctx.restore();

        // вспышка-«клик»
        const fl = pulse(t, pickT + 0.02, 0.16);
        if (fl > 0.01) {
          ctx.save();
          ctx.globalAlpha = clamp(fl * 0.85);
          ctx.fillStyle = C.white;
          ctx.fillRect(-W, -H, W * 3, H * 3);
          ctx.restore();
        }

        // искры вокруг выбранного кадра
        const dt = t - pickT;
        if (dt < 0.8) {
          for (const s of sparks) {
            const d = s.d * 0.45 * M * easeOutCubic(clamp(dt / 0.45));
            ctx.save();
            ctx.globalAlpha = 1 - clamp(dt / 0.8);
            sparkle(ctx, cx + Math.cos(s.a) * d * s.sp, Y(0.575) + Math.sin(s.a) * d * s.sp, 24 * u * s.s, dt * 3 + s.a, s.a > 3 ? C.white : C.yellow);
            ctx.restore();
          }
        }
      }

      /* -------------------------------- 4. ТЕКСТЫ ------------------------------ */
      // «ЗАБЕРИ СВОЙ / ЛУЧШИЙ КАДР»
      if (t < T.pick + 0.12) {
        const exit = easeInCubic(seg(t, T.pick - 0.14, T.pick + 0.06));
        ctx.save();
        ctx.translate(0, -exit * H * 0.45);
        wordSlam(ctx, CFG.lines[0], cx, Y(0.098), W * 0.86, 96 * u, {
          slam: slam(t, T.l1, 0.42, 1.9), tracking: 2 * u,
          fill: C.white, stroke: C.ink, strokeW: 16 * u, shadow: C.red, shadowY: 12 * u
        });
        wordSlam(ctx, CFG.lines[1], cx, Y(0.172), W * 0.86, 104 * u, {
          slam: slam(t, T.l2, 0.42, 1.9), tracking: 2 * u,
          fill: C.yellow, stroke: C.ink, strokeW: 16 * u, shadow: C.crimson, shadowY: 12 * u
        });
        ctx.restore();
      }

      // «МЭЛ ФУТАЖЭС»
      if (t > T.brand - 0.02) {
        const out3 = easeInCubic(seg(t, T.cta - 0.1, T.cta + 0.08));
        wordSlam(ctx, CFG.brand, cx, Y(0.135), W * 0.86, 150 * u, {
          slam: slam(t, T.brand, 0.4, 2), tracking: 3 * u,
          fill: C.white, stroke: C.ink, strokeW: 20 * u, shadow: C.gold, shadowY: 14 * u,
          alpha: 1
        });

        // «ОНЛАЙН»
        const on = easeOutBack(seg(t, T.online, T.online + 0.3), 1.7);
        if (on > 0) {
          ctx.save();
          ctx.translate(cx, Y(0.258));
          ctx.rotate(-0.05);
          ctx.scale(on * (0.95 + env * 0.25), on * (0.95 + env * 0.25));
          ctx.translate(0, -out3 * 900 * u);
          band(ctx, 0, 0, W * 0.56, 86 * u, C.red, C.ink, 8 * u, 22 * u);
          label(ctx, CFG.brand2, 0, 3 * u, { size: fitSize(ctx, CFG.brand2, W * 0.46, 60 * u), fill: C.white, stroke: C.ink, strokeW: 7 * u, align: 'center', tracking: 2 * u });
          ctx.restore();
        }
      }

      /* --------------------------------- курсор -------------------------------- */
      if (t > 1.0 && t < T.cta) {
        const p = easeInOutCubic(seg(t, 1.0, 1.75));
        const px = lerp(W * 0.78, cx + W * 0.10, p);
        const py = lerp(Y(0.80), Y(0.60), p);
        const click = pulse(t, T.pick, 0.2);
        cursorArrow(ctx, px, py, 54 * u * (1 - click * 0.12), C.white);
        if (click > 0.01) {
          ctx.save();
          ctx.globalAlpha = 1;
          circle(ctx, px, py, 18 * u + click * 40 * u, null, C.yellow, 8 * u * click);
          ctx.restore();
        }
      }

      /* ---------------------------------- CTA ---------------------------------- */
      if (t > T.cta) {
        const p = seg(t, T.cta, T.cta + 0.3);
        const by = lerp(H + 320 * u, Y(0.878), easeOutBack(p, 1.5));

        rrect(ctx, W * 0.045, by - 112 * u, W * 0.91, 224 * u, 26 * u);
        A.fillStroke(ctx, C.ink, C.yellow, 8 * u);

        label(ctx, CFG.cta, cx, by - 42 * u, {
          size: fitSize(ctx, CFG.cta, W * 0.80, 64 * u), fill: C.white, align: 'center', tracking: 1 * u
        });

        const bpx = cx - W * 0.04;
        const bpy = by + 56 * u;
        band(ctx, bpx, bpy, W * 0.58, 62 * u, C.red, C.ink, 5 * u, 15 * u);
        label(ctx, CFG.ctaSub, bpx - 16 * u, bpy + 2 * u, { size: 32 * u, fill: C.white, align: 'center', tracking: 1 * u });
        const bob = Math.sin(t * 9) * 9 * u;
        arrowDown(ctx, cx + W * 0.27, bpy + bob, 46 * u, C.yellow, C.ink, 6 * u);
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
