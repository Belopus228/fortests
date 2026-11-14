#!/usr/bin/env node
/* =======================================================================
   Сборка автономных HTML-роликов.
   Запуск:  node build.mjs
   На выходе:
     upgrader-rubap-1.html  — сцена «Апгрейдер»  (звук «…а ру .mp3»)
     upgrader-rubap-2.html  — сцена «Слот/Рубап» (звук «…нлайн.mp3»)
   Внутрь каждого файла зашиваются: шрифты, звук (base64), движок и сцена.
   ======================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const readB64 = (p) => fs.readFileSync(path.join(root, p)).toString('base64');

/* ------------------------------- шрифты ------------------------------- */
const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

function fontFace(family, file, weight, range) {
  const b64 = readB64('src/fonts/' + file);
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;` +
    `src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
}

const fontsCss = [
  fontFace('Russo One', 'russo-one-cyrillic-400-normal.woff2', 400, CYR),
  fontFace('Russo One', 'russo-one-latin-400-normal.woff2', 400, LAT),
  fontFace('Montserrat', 'montserrat-cyrillic-900-normal.woff2', 900, CYR),
  fontFace('Montserrat', 'montserrat-latin-900-normal.woff2', 900, LAT)
].join('\n');

/* ------------------------------- проверки ------------------------------- */
function assertSyntax(code, label) {
  try { new Function(code); }
  catch (e) { throw new Error('Синтаксическая ошибка в ' + label + ': ' + e.message); }
}

const templateRaw = read('src/template.html');

/* все id, которые ищет рантайм, должны быть в шаблоне */
const runtimeSrc = read('src/runtime.js');
const wantedIds = new Set();
for (const m of runtimeSrc.matchAll(/\$\('([a-zA-Z0-9_-]+)'\)/g)) wantedIds.add(m[1]);
for (const m of runtimeSrc.matchAll(/getElementById\('([a-zA-Z0-9_-]+)'\)/g)) wantedIds.add(m[1]);
const missing = [...wantedIds].filter((id) => !new RegExp('id="' + id + '"').test(templateRaw));
if (missing.length) throw new Error('В шаблоне нет элементов с id: ' + missing.join(', '));

/* -------------------------------- сборка ------------------------------- */
const template = templateRaw;
const style = read('src/style.css');
const common = read('src/common.js');
const runtime = read('src/runtime.js');

const jobs = [
  {
    out: 'upgrader-rubap-1.html',
    scene: 'src/scene-1.js',
    audio: '[Меллстрой]_рифм......а ру .mp3',
    title: 'АПГРЕЙДЕР · мусордроп · рубап — зелёный ролик',
    titleShort: 'АПГРЕЙДЕР → РУБАП'
  },
  {
    out: 'upgrader-rubap-2.html',
    scene: 'src/scene-2.js',
    audio: '[Меллстрой]_рифм......нлайн.mp3',
    title: 'МУСОР → РУБАП · слот-джекпот — зелёный ролик',
    titleShort: 'МУСОР → РУБАП · ДЖЕКПОТ'
  }
];

assertSyntax(common, 'src/common.js');
assertSyntax(runtimeSrc, 'src/runtime.js');

for (const job of jobs) {
  const scene = read(job.scene);
  assertSyntax(scene, job.scene);
  const audioB64 = readB64(job.audio);
  let html = template
    .replace('{{FONTS}}', () => fontsCss)
    .replace('{{STYLE}}', () => style)
    .replace('{{TITLE}}', () => job.title)
    .replace('{{COMMON}}', () => common)
    .replace('{{SCENE}}', () => scene)
    .replace('{{RUNTIME}}', () => runtime)
    .replace(/\{\{TITLE_SHORT\}\}/g, () => job.titleShort)
    .replace('{{TITLE_JSON}}', () => JSON.stringify(job.title))
    .replace('{{AUDIO_NAME_JSON}}', () => JSON.stringify(job.audio))
    .replace('{{AUDIO_B64}}', () => `data:audio/mpeg;base64,${audioB64}`);

  html = html.replace(/\{\{[A-Z_]+\}\}/g, (m) => {
    throw new Error('Не подставлен плейсхолдер: ' + m);
  });

  fs.writeFileSync(path.join(root, job.out), html);
  console.log('✓', job.out, (html.length / 1024).toFixed(0) + ' КБ');
}
