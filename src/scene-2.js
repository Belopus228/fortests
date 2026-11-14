/* =======================================================================
   Сцена 2 — «БУРМОЛДА»   (звук: [Меллстрой]_рифм......а ру .mp3, 4.15 c)

   «…найди свою бурмолду… бурмолда точка ру»

   Всё действие — в одном небольшом чёрном окне сайта burmolda.ru:
   окно открывается, заголовок «НАЙДИ СВОЮ БУРМОЛДУ», сетка кадров,
   кадр находится и открывается превью, на «точка ру» подсвечивается
   адресная строка и домен. В конце окно закрывается.
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
    lines: ['НАЙДИ СВОЮ', 'БУРМОЛДУ'],
    brand: 'БУРМОЛДА',
    domain: 'burmolda.ru',
    chip: 'ССЫЛКА В ОПИСАНИИ',
    badge: 'НАШЁЛ!',
    ticker: 'BURMOLDA.RU  •  НАЙДИ СВОЮ БУРМОЛДУ  •  МЭЛ ФУТАЖЭС  •  '
  };

  /* ------------------------------- тайминги ------------------------------- */
  const T = { in: 0.04, l1: 0.12, l2: 0.32, grid: 0.50, found: 1.92, open: 2.24, domain: 3.26, outro: 4.45, tail: 1.0 };

  const CODES = ['0:11', '0:26', '0:08', '1:12', '0:37', '0:19'];

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
    id: 'burmolda',
    name: 'Бурмолда',
    tail: T.tail,
    cfg: CFG,
    draw(ctx, W, H, t, E) {
      const env = E.env(t);
      const u = Math.min(W, H) / 1080;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const photos = A.photos || [];
      const winW = W * 0.84, winH = H * 0.66;

      /* интро / аутро окна */
      const open = easeOutBack(seg(t, T.in, T.in + 0.32), 1.5);
      const shut = easeInCubic(seg(t, T.outro + 0.22, T.outro + 0.64));
      const sx = 1 - shut;
      const sy = 1 - shut;
      const winScale = open * (1 + env * 0.006);

      ctx.save();
      ctx.translate(cx + Math.sin(t * 61) * env * 5 * u, cy + (1 - open) * 90 * u);

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
      const picked = 4;

      if (t < T.open + 0.3) {
        for (let i = 0; i < cols * rows; i++) {
          const c = i % cols, r2 = Math.floor(i / cols);
          const ap = seg(t, T.grid + i * 0.045, T.grid + i * 0.045 + 0.2);
          if (ap <= 0) continue;
          const px = M.x + c * (cw + gap) + cw / 2;
          const py = M.y + r2 * (chh + gap) + chh / 2;
          const isPicked = i === picked;
          photoTile(ctx, {
            img: photos[(i * 2 + 1) % Math.max(photos.length, 1)] || null,
            x: px, y: py, w: cw, h: chh,
            rot: 0, scale: easeOutBack(clamp(ap), 1.4),
            cropX: rr(mulberry32(i * 13 + 3), -0.6, 0.6), cropY: rr(mulberry32(i * 29 + 7), -0.6, 0.6),
            zoom: 1.1, dim: isPicked ? 0 : 0.45 * seg(t, T.found, T.found + 0.3),
            codeText: CODES[i % CODES.length], tag: false, play: true
          });
          if (isPicked && t > T.found) {
            const a = easeOutBack(seg(t, T.found, T.found + 0.28), 1.8);
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(a, a);
            selectionFrame(ctx, 0, 0, cw + 16 * u, chh + 16 * u, 7 * u, C.yellow);
            ctx.restore();
          }
        }
      }

      /* ------------------------------ 4. ПРЕВЬЮ ------------------------------- */
      if (t > T.open) {
        const p = easeOutBack(seg(t, T.open, T.open + 0.34), 1.6);
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
          cropX: 0, cropY: 0.18, zoom: 1.05,
          codeText: '0:09', tag: true, tagText: 'mellstroy', play: true
        });
        selectionFrame(ctx, 0, -46 * u, pw + 22 * u, ph + 22 * u, 8 * u, C.yellow);

        // бейдж «нашёл»
        const bp = easeOutElastic(seg(t, T.open + 0.16, T.open + 0.5));
        ctx.save();
        ctx.translate(-pw / 2 + 86 * u, -46 * u - ph / 2 + 34 * u);
        ctx.rotate(-0.09);
        ctx.scale(bp, bp);
        band(ctx, 0, 0, 148 * u, 46 * u, C.red, C.ink, 4 * u, 10 * u);
        label(ctx, CFG.badge, 0, 1 * u, { size: 24 * u, fill: C.white, align: 'center', tracking: 1 * u });
        ctx.restore();

        // кнопка → домен
        const btnY = -46 * u + ph / 2 + 54 * u;
        if (t < T.domain) {
          const bp2 = easeOutBack(seg(t, T.open + 0.24, T.open + 0.5), 1.5);
          ctx.save();
          ctx.translate(0, btnY);
          ctx.scale(bp2 * (0.97 + env * 0.05), bp2 * (0.97 + env * 0.05));
          const btnW = pw * 0.66, btnH = 58 * u;
          rrect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH * 0.3);
          ctx.fillStyle = C.yellow;
          ctx.fill();
          ctx.lineWidth = 3.5 * u;
          ctx.strokeStyle = C.ink;
          ctx.stroke();
          label(ctx, 'СКАЧАТЬ КАДР', 0, 1 * u, { size: 27 * u, fill: C.ink, align: 'center', tracking: 1.5 * u, fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY });
          ctx.restore();
        } else {
          const dp = easeOutBack(seg(t, T.domain, T.domain + 0.3), 1.6);
          ctx.save();
          ctx.translate(0, btnY);
          ctx.scale(dp * (0.98 + env * 0.05), dp * (0.98 + env * 0.05));
          const bw = pw * 0.70, bh = 58 * u;
          rrect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
          ctx.fillStyle = C.white;
          ctx.fill();
          ctx.lineWidth = 3.5 * u;
          ctx.strokeStyle = C.ink;
          ctx.stroke();
          label(ctx, CFG.domain, 0, 1 * u, {
            size: fitSize(ctx, CFG.domain, bw * 0.72, 30 * u), fill: C.ink, align: 'center', tracking: 0.5 * u,
            fontFn: (s) => '900 ' + s + 'px ' + A.FONT_HEAVY
          });
          ctx.restore();
        }
        ctx.restore();
      }

      /* ------------------------- 5. ПОДСВЕТКА АДРЕСА -------------------------- */
      if (t > T.domain) {
        const adrH = G.barH * 0.56;
        const adrW = winW * 0.60;
        ctx.save();
        rrect(ctx, -adrW / 2, -winH / 2 + G.barH * 0.5 - adrH / 2, adrW, adrH, adrH / 2);
        ctx.lineWidth = 5 * u;
        ctx.strokeStyle = C.yellow;
        ctx.stroke();
        ctx.restore();

        const k = easeInOutCubic(seg(t, T.domain + 0.04, T.domain + 0.4));
        const px = lerp(winW * 0.24, winW * 0.12, k);
        const py = lerp(winH * 0.16, -winH * 0.40, k);
        cursorArrow(ctx, px, py, 40 * u, C.white);
      }

      /* -------------------------------- 6. ФУТЕР ------------------------------ */
      siteFooter(ctx, L, u, {
        brand: CFG.brand, domain: CFG.domain, chip: CFG.chip,
        hi: t > T.domain ? (0.6 + 0.4 * Math.sin((t - T.domain) * 12)) * seg(t, T.domain, T.domain + 0.2) : 0,
        chipScale: 1 + pulse(t, T.domain, 0.35) * 0.05 + pulse(t, T.outro, 0.3) * 0.06,
        arrow: t > T.outro - 0.15, arrowT: t
      });

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
