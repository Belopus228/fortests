/* =======================================================================
   Сцена 1 — «МЭЛ ФУТАЖЭС»  (звук: [Меллстрой]_рифм......нлайн.mp3, 3.79 c)

   «Забери свой лучший кадр… мэл футажэс онлайн!»

   Всё действие — в одном небольшом чёрном окне сайта mellfootages.online:
   окно открывается, внутри заголовок, сетка футажей, превью кадра,
   внизу бренд, домен и плашка «ССЫЛКА В ОПИСАНИИ». В конце окно закрывается.
   ======================================================================= */
(function (g) {
  'use strict';
  const A = g.Ads;
  const {
    clamp, lerp, seg, easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack, easeOutElastic,
    pulse, mulberry32, rr, C,
    rrect, circle, band, label, labelWidth, fitSize,
    photoTile, selectionFrame, cursorArrow, darkSite, siteLayout, siteFooter
  } = A;

  /* ------------------------------ настройки ------------------------------- */
  const CFG = {
    lines: ['ЗАБЕРИ СВОЙ', 'ЛУЧШИЙ КАДР'],
    brand: 'МЭЛ ФУТАЖЭС',
    badge: 'ОНЛАЙН',
    domain: 'mellfootages.online',
    chip: 'ССЫЛКА В ОПИСАНИИ',
    ticker: 'MELLFOOTAGES.ONLINE  •  ЛУЧШИЕ КАДРЫ МЕЛЛСТРОЯ  •  СКАЧАЙ СВОЙ  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { in: 0.04, l1: 0.14, l2: 0.30, grid: 0.48, pick: 1.80, online: 3.26, outro: 4.10, tail: 1.0 };

  const CODES = ['0:07', '0:12', '0:31', '1:04', '0:19', '0:44'];

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
    label(ctx, text, 0, 0, Object.assign({}, o, { size: fs, slam: undefined, align: 'center' }));
    ctx.restore();
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
      const cy = H * 0.5;
      const Y = (v) => H * v;
      const photos = A.photos || [];
      const winW = W * 0.84, winH = H * 0.66;

      /* интро / аутро окна */
      const open = easeOutBack(seg(t, T.in, T.in + 0.32), 1.5);
      const shut = easeInCubic(seg(t, T.outro + 0.22, T.outro + 0.64));
      const sx = 1 - shut;
      const sy = 1 - shut;
      const winScale = open * (1 + env * 0.006);

      ctx.save();
      ctx.translate(cx + Math.sin(t * 57) * env * 5 * u, cy + (1 - open) * 90 * u);

      const L = siteLayout(winW, winH, u * 1.35);
      const yF = L.footer.y + L.footer.h / 2;

      ctx.scale(winScale, winScale);
      ctx.translate(0, yF);
      ctx.scale(sx, sy);
      ctx.translate(0, -yF);

      /* ------------------------------ 1. ОКНО -------------------------------- */
      const G = darkSite(ctx, winW, winH, u * 1.35, CFG.domain);
      const cont = L.content;

      /* ------------------------------ 2. ЗАГОЛОВОК --------------------------- */
      if (t > T.l1 - 0.02) {
        wordSlam(ctx, CFG.lines[0], cont.x + cont.w / 2, L.title1Y, cont.w * 0.92, 52 * u, {
          slam: slam(t, T.l1, 0.36, 1.8), tracking: 1 * u, fill: C.white
        });
        wordSlam(ctx, CFG.lines[1], cont.x + cont.w / 2, L.title2Y, cont.w * 0.92, 56 * u, {
          slam: slam(t, T.l2, 0.36, 1.8), tracking: 1 * u, fill: C.yellow
        });
      }

      /* -------------------------------- 3. СЕТКА ------------------------------ */
      const M = L.media;
      const gap = 12 * u;
      const cols = 3, rows = 2;
      const cw = (M.w - gap * (cols - 1)) / cols;
      const chh = (M.h - gap * (rows - 1)) / rows;

      if (t < T.pick + 0.4) {
        for (let i = 0; i < cols * rows; i++) {
          const c = i % cols, r2 = Math.floor(i / cols);
          const ap = seg(t, T.grid + i * 0.045, T.grid + i * 0.045 + 0.2);
          if (ap <= 0) continue;
          const px = M.x + c * (cw + gap) + cw / 2;
          const py = M.y + r2 * (chh + gap) + chh / 2;
          photoTile(ctx, {
            img: photos[i % Math.max(photos.length, 1)] || null,
            x: px, y: py, w: cw, h: chh,
            rot: 0, scale: easeOutBack(clamp(ap), 1.4),
            cropX: rr(mulberry32(i * 77 + 5), -0.6, 0.6), cropY: rr(mulberry32(i * 31 + 9), -0.6, 0.6),
            zoom: 1.1, dim: 0.45 * seg(t, T.pick, T.pick + 0.3),
            codeText: CODES[i % CODES.length], tag: false, play: true
          });
        }
      }

      /* ------------------------------ 4. ПРЕВЬЮ ------------------------------- */
      if (t > T.pick) {
        const p = easeOutBack(seg(t, T.pick, T.pick + 0.34), 1.6);
        ctx.save();
        ctx.beginPath();
        ctx.rect(M.x - 4 * u, M.y - 4 * u, M.w + 8 * u, M.h + 8 * u);
        ctx.clip();
        ctx.fillStyle = 'rgba(9,10,14,0.94)';
        ctx.fillRect(M.x, M.y, M.w, M.h);

        ctx.translate(M.x + M.w / 2, M.y + M.h / 2);
        ctx.scale(p, p);

        let ph = Math.min(M.h - 100 * u, M.w * 0.86 * 0.58);
        let pw = ph / 0.58;
        if (pw > M.w * 0.86) { pw = M.w * 0.86; ph = pw * 0.58; }

        photoTile(ctx, {
          img: photos[0] || null,
          x: 0, y: -46 * u, w: pw, h: ph,
          rot: 0, scale: 1,
          cropX: 0, cropY: 0.15, zoom: 1.05,
          codeText: '0:09', tag: true, tagText: 'mellstroy', play: true
        });
        selectionFrame(ctx, 0, -46 * u, pw + 22 * u, ph + 22 * u, 8 * u, C.yellow);

        // кнопка
        const bp = easeOutBack(seg(t, T.pick + 0.2, T.pick + 0.46), 1.5);
        ctx.save();
        ctx.translate(0, -46 * u + ph / 2 + 54 * u);
        ctx.scale(bp * (0.97 + env * 0.05), bp * (0.97 + env * 0.05));
        const btnW = pw * 0.66, btnH = 60 * u;
        rrect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH * 0.3);
        ctx.fillStyle = C.yellow;
        ctx.fill();
        ctx.lineWidth = 3.5 * u;
        ctx.strokeStyle = C.ink;
        ctx.stroke();
        label(ctx, 'СКАЧАТЬ КАДР', 0, 1 * u, { size: 28 * u, fill: C.ink, align: 'center', tracking: 1.5 * u, fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY });
        ctx.restore();
        ctx.restore();
      }

      /* ------------------------------ 5. КУРСОР ------------------------------- */
      if (t > 1.0 && t < T.pick + 0.3) {
        const k = easeInOutCubic(seg(t, 1.0, T.pick - 0.06));
        const px = lerp(M.x + M.w * 0.78, M.x + M.w * 0.52, k);
        const py = lerp(M.y + M.h * 0.55, M.y + M.h * 0.2, k);
        const click = pulse(t, T.pick - 0.05, 0.2);
        cursorArrow(ctx, px, py, 40 * u * (1 - click * 0.15), C.white);
        if (click > 0.01) {
          circle(ctx, px, py, 12 * u + click * 28 * u, null, C.yellow, 6 * u * click);
        }
      }

      /* -------------------------------- 7. ФУТЕР ------------------------------ */
      siteFooter(ctx, L, u, {
        brand: CFG.brand, domain: CFG.domain, chip: CFG.chip,
        chipScale: 1 + pulse(t, T.online, 0.35) * 0.05 + pulse(t, T.outro, 0.3) * 0.06,
        arrow: t > T.outro - 0.15, arrowT: t
      });

      /* чип «ОНЛАЙН» на шапке окна */
      const on = easeOutBack(seg(t, T.online, T.online + 0.3), 1.8);
      if (on > 0) {
        ctx.save();
        ctx.translate(winW * 0.5 - 168 * u, -winH / 2 + G.barH * 0.52);
        ctx.rotate(-0.06);
        ctx.scale(on * (0.95 + env * 0.18), on * (0.95 + env * 0.18));
        band(ctx, 0, 0, 132 * u, 42 * u, C.red, C.ink, 4 * u, 10 * u);
        label(ctx, CFG.badge, 0, 1 * u, { size: 22 * u, fill: C.white, align: 'center', tracking: 1.5 * u });
        ctx.restore();
      }

      ctx.restore();

      /* ------------------------------- бегущая строка --------------------------- */
      if (t > 0.28 && shut < 0.6) {
        const ap = easeOutCubic(seg(t, 0.28, 0.45));
        ctx.save();
        const th = 52 * u;
        const ty = lerp(H, H - th - 12 * u, ap);
        ctx.fillStyle = C.ink;
        ctx.fillRect(0, ty, W, th);
        ctx.beginPath();
        ctx.rect(0, ty, W, th);
        ctx.clip();
        const txt = CFG.ticker + CFG.ticker;
        const tw = labelWidth(ctx, txt, { size: 26 * u, tracking: 2 * u });
        const off = -(((t - 0.28) * 210 * u) % tw);
        label(ctx, txt, off, ty + th / 2 + 1 * u, { size: 26 * u, tracking: 2 * u, fill: C.yellow, align: 'left' });
        ctx.restore();
      }
    }
  };

  g.SCENES = g.SCENES || [];
  g.SCENES.push(scene);
})(typeof globalThis !== 'undefined' ? globalThis : window);
