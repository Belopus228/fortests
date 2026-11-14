/* =======================================================================
   Runtime: звук, плеер, запись видео, интерфейс
   ======================================================================= */
(function () {
  'use strict';
  const A = window.Ads;
  const SCENE = window.SCENES[window.SCENES.length - 1];
  const META = window.__META__ || { title: 'Реклама', audio: '' };

  const $ = (id) => document.getElementById(id);
  const cv = $('cv');
  const ctx = cv.getContext('2d', { alpha: false });
  const stage = $('stage') || document.querySelector('.stage');
  const btnPlay = $('btnPlay');
  const btnRestart = $('btnRestart');
  const btnRecord = $('btnRecord');
  const btnFrame = $('btnFrame');
  const loopBox = $('loop');
  const aspectSel = $('aspect');
  const qualitySel = $('quality');
  const seek = $('seek');
  const tCur = $('tCur');
  const tTot = $('tTot');
  const statusEl = $('status');

  let audioCtx = null;
  let master = null;
  let buffer = null;
  let env = () => 0;
  let total = 4;
  let W = 1080, H = 1920;
  let playing = false;
  let offset = 0;
  let tStart = 0;
  let srcNode = null;
  let lastT = -1;

  let recording = false;
  let recT0 = 0;
  let recorder = null;
  let recSrc = null;
  let recDest = null;
  let recStream = null;
  let chunks = [];

  const setStatus = (txt, kind) => {
    statusEl.textContent = txt;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  };

  /* ------------------------------ размеры ------------------------------ */
  function applySize() {
    const q = +qualitySel.value;
    const map = { '9:16': [q, Math.round((q * 16) / 9)], '1:1': [q, q], '16:9': [Math.round((q * 16) / 9), q] };
    const [w, h] = map[aspectSel.value] || map['9:16'];
    W = w; H = h;
    cv.width = W; cv.height = H;
    if (stage) {
      stage.style.setProperty('--w', W);
      stage.style.setProperty('--h', H);
    }
    draw(clockTime());
  }

  /* -------------------------------- звук -------------------------------- */
  async function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    master.connect(audioCtx.destination);

    const res = await fetch(window.__AUDIO__);
    const ab = await res.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(ab);
    env = A.makeEnvelope(buffer.getChannelData(0), buffer.sampleRate, 200);
    total = buffer.duration + SCENE.tail;
    seek.value = 0;
    tTot.textContent = total.toFixed(2);
    setStatus('Звук загружен: ' + buffer.duration.toFixed(2) + ' с + ' + SCENE.tail.toFixed(1) + ' с концовки = ' + total.toFixed(2) + ' с', 'ok');
    draw(0);
  }

  /* ------------------------------- плеер -------------------------------- */
  function stopSrc() {
    if (srcNode) {
      try { srcNode.onended = null; srcNode.stop(); } catch (e) {}
      try { srcNode.disconnect(); } catch (e) {}
      srcNode = null;
    }
  }

  function clockTime() {
    if (!audioCtx) return offset;
    if (recording) return Math.min(total, Math.max(0, audioCtx.currentTime - recT0));
    if (playing) return Math.min(total, offset + (audioCtx.currentTime - tStart));
    return offset;
  }

  function play(from) {
    if (!buffer || recording) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    stopSrc();
    offset = from === undefined ? offset : from;
    if (offset >= total - 0.01) offset = 0;
    srcNode = audioCtx.createBufferSource();
    srcNode.buffer = buffer;
    srcNode.connect(master);
    srcNode.start(0, Math.min(offset, Math.max(0, buffer.duration - 0.01)));
    tStart = audioCtx.currentTime;
    playing = true;
    updatePlayBtn();
  }

  function pause() {
    if (!playing) return;
    offset = clockTime();
    playing = false;
    stopSrc();
    updatePlayBtn();
  }

  function restart() {
    offset = 0;
    if (playing) play(0);
    else draw(0);
    updatePlayBtn();
  }

  function updatePlayBtn() {
    btnPlay.textContent = playing ? '❚❚ Пауза' : '▶ Играть';
    btnPlay.classList.toggle('playing', playing);
  }

  function endOfClip() {
    if (loopBox.checked) {
      play(0);
    } else {
      playing = false;
      offset = total;
      stopSrc();
      updatePlayBtn();
    }
  }

  /* ------------------------------- отрисовка ----------------------------- */
  function draw(t) {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = A.C.key;
    ctx.fillRect(0, 0, W, H);
    try {
      SCENE.draw(ctx, W, H, t, { env, dur: buffer ? buffer.duration : 0, total });
    } catch (e) {
      console.error(e);
      setStatus('Ошибка отрисовки: ' + e.message, 'err');
    }
  }

  function updateTimeline(t) {
    if (document.activeElement !== seek) seek.value = String(Math.round((t / total) * 1000));
    tCur.textContent = t.toFixed(2);
  }

  function frame() {
    let t = clockTime();
    if (playing && t >= total - 0.005) endOfClip();
    if (Math.abs(t - lastT) > 1e-4 || !playing) {
      draw(t);
      lastT = t;
    }
    updateTimeline(t);
    requestAnimationFrame(frame);
  }

  /* ------------------------------- запись ------------------------------- */
  function pickMime() {
    const list = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    if (!window.MediaRecorder) return '';
    for (const m of list) {
      try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {}
    }
    return '';
  }

  async function startRecord() {
    if (recording) return;
    if (!buffer) { setStatus('Звук ещё не загрузился', 'err'); return; }
    if (!window.MediaRecorder || !cv.captureStream) {
      setStatus('Браузер не умеет записывать canvas. Открой в Chrome.', 'err');
      return;
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    pause();

    const mime = pickMime();
    const ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';

    recStream = cv.captureStream(60);
    recDest = audioCtx.createMediaStreamDestination();
    recSrc = audioCtx.createBufferSource();
    recSrc.buffer = buffer;
    recSrc.connect(recDest);
    recSrc.connect(master);
    recDest.stream.getAudioTracks().forEach((tr) => recStream.addTrack(tr));

    try {
      recorder = new MediaRecorder(recStream, {
        mimeType: mime || undefined,
        videoBitsPerSecond: 16_000_000,
        audioBitsPerSecond: 192_000
      });
    } catch (e) {
      recorder = new MediaRecorder(recStream);
    }

    chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = () => finishRecord(mime, ext);

    recording = true;
    offset = 0;
    draw(0);
    recT0 = audioCtx.currentTime + 0.12;
    recSrc.start(recT0, 0);
    recorder.start(250);

    btnRecord.classList.add('busy');
    btnRecord.textContent = '● Идёт запись…';
    setStatus('Записываю ' + total.toFixed(1) + ' с в реальном времени — не переключай вкладку.', 'warn');

    setTimeout(stopRecord, (total + 0.45) * 1000);
  }

  function stopRecord() {
    if (!recording || !recorder) return;
    try { recorder.stop(); } catch (e) {}
    try { if (recSrc) recSrc.stop(); } catch (e) {}
  }

  function finishRecord(mime, ext) {
    recording = false;
    playing = false;
    offset = total;
    try { recStream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    btnRecord.classList.remove('busy');
    btnRecord.textContent = '⏺ Записать видео';

    if (!chunks.length) {
      setStatus('Запись не получилась — попробуй ещё раз в Chrome.', 'err');
      return;
    }
    const blob = new Blob(chunks, { type: mime || 'video/webm' });
    const name = 'rubap-' + SCENE.id + '-' + W + 'x' + H + '.' + ext;
    downloadBlob(blob, name);
    setStatus('Готово: ' + name + ' (' + (blob.size / 1048576).toFixed(1) + ' МБ)', 'ok');
    chunks = [];
    draw(total);
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function saveFrame() {
    const t = clockTime();
    draw(t);
    cv.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, 'rubap-' + SCENE.id + '-frame-' + t.toFixed(2) + 's.png');
      setStatus('Кадр ' + t.toFixed(2) + ' с сохранён в PNG', 'ok');
    }, 'image/png');
  }

  /* -------------------------------- события ------------------------------ */
  btnPlay.addEventListener('click', () => (playing ? pause() : play()));
  btnRestart.addEventListener('click', restart);
  btnRecord.addEventListener('click', startRecord);
  btnFrame.addEventListener('click', saveFrame);
  aspectSel.addEventListener('change', applySize);
  qualitySel.addEventListener('change', applySize);
  seek.addEventListener('input', () => {
    const t = (seek.value / 1000) * total;
    if (playing) play(t);
    else { offset = t; draw(t); }
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') restart();
    if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') saveFrame();
  });

  /* --------------------------------- старт -------------------------------- */
  const titleEl = $('title');
  if (titleEl) titleEl.textContent = META.title || 'Зелёный ролик';
  const subEl = $('subtitle');
  if (subEl) subEl.textContent = META.audio ? 'звук: ' + META.audio : '';
  applySize();
  total = SCENE.tail + 4;
  draw(0);
  requestAnimationFrame(frame);

  initAudio().catch((e) => {
    console.error(e);
    setStatus('Не удалось загрузить звук: ' + e.message, 'err');
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { lastT = -1; draw(clockTime()); });
  }
})();
