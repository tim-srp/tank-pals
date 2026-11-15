'use strict';
(function () {
  const { COLS, ROWS, PLAYER_SPAWN, ROBOT_SPAWNS, levelConfig } = window.LEVELS;
  const S = window.STORY;
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  // ---------- Saved progress & parent settings ----------
  const SAVE_KEY = 'tankpals.v1';
  const DEFAULTS = { unlocked: 1, stars: {}, settings: { dailyLevels: 0, dailyMinutes: 0, voice: true, sound: true, music: true }, words: {}, day: { date: today(), levels: 0, seconds: 0 } };
  let save = load();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === 'object') return { ...DEFAULTS, ...s, words: s.words || {}, settings: { ...DEFAULTS.settings, ...s.settings }, day: { ...DEFAULTS.day, ...s.day } };
    } catch (e) { /* storage unavailable */ }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
  function rollDay() { if (save.day.date !== today()) { save.day = { date: today(), levels: 0, seconds: 0 }; persist(); } }
  function limitReached() {
    rollDay();
    const st = save.settings;
    if (st.dailyLevels > 0 && save.day.levels >= st.dailyLevels) return 'levels';
    if (st.dailyMinutes > 0 && save.day.seconds >= st.dailyMinutes * 60) return 'minutes';
    return null;
  }

  // ---------- Audio ----------
  let actx = null;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
    if (!save.settings.sound) return;
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const sfx = {
    pew: () => tone(880, 0.09, 'square', 0.06, -400),
    pop: () => tone(300, 0.12, 'triangle', 0.15, -150),
    tink: () => tone(1400, 0.06, 'square', 0.05),
    sleep: () => { tone(660, 0.25, 'sine', 0.15, -330); tone(440, 0.35, 'sine', 0.1, -220, 0.18); },
    ding: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.18, 'sine', 0.13, 0, i * 0.07)),
    coin: () => { tone(988, 0.08, 'square', 0.06); tone(1319, 0.16, 'square', 0.06, 0, 0.08); },
    heart: () => [523, 659, 784].forEach((f, i) => tone(f, 0.15, 'triangle', 0.12, 0, i * 0.06)),
    ouch: () => tone(220, 0.25, 'triangle', 0.2, -100),
    bossHit: () => tone(180, 0.15, 'sawtooth', 0.08, -60),
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.13, 0, i * 0.12)),
  };
  // ---------- Background music (original tunes, synthesized live) ----------
  // Notes are semitones above the song root; null is a rest. 32 eighth-note steps = 4 bars.
  const SONGS = {
    hop:   { bpm: 116, chords: [0, 5, 7, 0], mel: [12, null, 9, null, 7, 9, 12, null, 14, null, 12, 9, 7, null, null, null, 9, null, 7, null, 4, 7, 9, null, 7, 4, 2, 4, 0, null, null, null] },
    skip:  { bpm: 108, chords: [0, 5, 7, 0], mel: [0, 4, 7, 4, 9, 7, 4, null, 2, 5, 9, 5, 7, null, null, null, 0, 4, 7, 12, 11, 9, 7, null, 5, 4, 2, null, 0, null, null, null] },
    drift: { bpm: 92, chords: [0, 5, 0, 7], mel: [7, null, 4, null, 0, null, 4, 7, 9, null, 7, null, 4, null, null, null, 5, null, 9, null, 12, null, 9, 7, 4, null, 2, null, 0, null, null, null] },
    boss:  { bpm: 132, chords: [0, 8, 5, 7], mel: [0, null, 3, null, 7, null, 3, 0, 5, null, 8, null, 7, null, null, null, 0, 3, 7, 10, 12, 10, 7, 3, 5, 3, 2, null, 0, null, null, null] },
    menu:  { bpm: 100, chords: [0, 9, 5, 7], mel: [4, null, 7, null, 12, null, 11, 9, 7, null, null, null, 4, null, 5, 7, 9, null, 7, null, 5, null, 4, 2, 0, null, null, null, null, null, null, null] },
  };
  const WORLD_SONGS = ['hop', 'skip', 'drift'];
  const WORLD_KEYS = [0, 2, -3, 5, -1, 3, -2, 4, 1, -4];
  const music = { song: null, key: 0, step: 0, next: 0, timer: null, gain: null };
  function musicFor(level) {
    if (level == null) return ['menu', 0];
    const w = Math.floor((level - 1) / S.LEVELS_PER_WORLD);
    return [S.isBossLevel(level) ? 'boss' : WORLD_SONGS[w % 3], WORLD_KEYS[w]];
  }
  function startMusic(level) {
    const [name, key] = musicFor(level);
    if (!save.settings.music) { stopMusic(); return; }
    const a = audio(); if (!a) return;
    if (music.timer && music.song === name && music.key === key) return;
    stopMusic();
    music.song = name; music.key = key; music.step = 0; music.next = a.currentTime + 0.1;
    music.gain = a.createGain(); music.gain.gain.value = 1; music.gain.connect(a.destination);
    music.timer = setInterval(scheduleMusic, 60);
    scheduleMusic();
  }
  function stopMusic() {
    if (music.timer) clearInterval(music.timer);
    music.timer = null; music.song = null;
    if (music.gain && actx) { const g = music.gain; g.gain.setTargetAtTime(0, actx.currentTime, 0.05); setTimeout(() => g.disconnect(), 400); }
    music.gain = null;
  }
  function note(midi, t, dur, type, vol) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(music.gain); o.start(t); o.stop(t + dur + 0.05);
  }
  function scheduleMusic() {
    if (!actx || !music.gain) return;
    const song = SONGS[music.song], stepDur = 60 / song.bpm / 2;
    while (music.next < actx.currentTime + 0.25) {
      const i = music.step % 32, t = music.next;
      const m = song.mel[i];
      if (m != null) note(72 + music.key + m, t, stepDur * 1.6, 'triangle', 0.045);
      const chord = song.chords[Math.floor(i / 8)];
      if (i % 4 === 0) note(48 + music.key + chord + (i % 8 ? 7 : 0), t, stepDur * 3, 'sine', 0.07);
      if (i % 2 === 1) note(84 + music.key + chord + [4, 7][(i >> 1) % 2], t, stepDur * 0.5, 'sine', 0.012); // soft sparkle
      music.next += stepDur; music.step++;
    }
  }

  // Full screen in Safari (iPadOS supports it for the page; the home-screen app is full screen already).
  const standalone = window.navigator.standalone === true || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  const fsEnabled = !standalone && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function enterFullscreen() {
    if (!fsEnabled || isFullscreen()) return;
    const el = document.documentElement;
    try { const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not allowed */ }
  }

  // iPhone Safari has no page full screen: the home-screen app is the way to play without browser bars.
  const isPhone = /iPhone|iPod/.test(navigator.userAgent) || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600);
  if (isPhone) {
    document.documentElement.classList.add('phone');
    $('rotate-text').textContent = '请把手机横过来玩（如果转不过来，先在控制中心关掉“竖屏锁定”）';
  }
  const showInstallTip = isPhone && !standalone;

  // iOS needs audio to start from a user gesture.
  window.addEventListener('pointerdown', () => { if (save.settings.sound) audio(); }, { once: true });

  let voices = [];
  function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speak(text, interrupt = true, lang = 'zh') {
    if (!save.settings.voice || !('speechSynthesis' in window) || !text) return;
    try {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[🧠📖📚]/gu, ''));
      const en = lang === 'en';
      u.lang = en ? 'en-US' : 'zh-CN'; u.rate = en ? 0.85 : 0.95; u.pitch = 1.1;
      const v = en ? (voices.find(v => /en[-_]US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)))
                   : (voices.find(v => /zh[-_]CN/i.test(v.lang)) || voices.find(v => /zh/i.test(v.lang)));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  // Speak a list of [text, lang] parts one after another.
  function sayParts(parts, interrupt = false) {
    if (!parts) return;
    parts.forEach(([t, l], i) => speak(t, interrupt && i === 0, l));
  }
  function hush() { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }

  // ---------- Canvas ----------
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1, tile = 40, ox = 0, oy = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    safe = safeInsets();
    hudH = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 56) + safe.t;
    const hud = hudH;
    tile = Math.min((W - safe.l - safe.r) / COLS, (H - hud - 6) / ROWS);
    ox = safe.l + (W - safe.l - safe.r - tile * COLS) / 2;
    oy = hud + (H - hud - tile * ROWS) / 2;
    placeIdleJoystick();
  }
  let safe = { t: 0, r: 0, b: 0, l: 0 }, hudH = 56;
  const safeProbe = document.createElement('div');
  safeProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.appendChild(safeProbe);
  function safeInsets() {
    const cs = getComputedStyle(safeProbe), n = (v) => parseFloat(v) || 0;
    return { t: n(cs.paddingTop), r: n(cs.paddingRight), b: n(cs.paddingBottom), l: n(cs.paddingLeft) };
  }
  // iPhone rotation changes the safe areas after the resize event, so measure again a moment later.
  window.addEventListener('orientationchange', () => setTimeout(resize, 300));
  window.addEventListener('resize', resize);

  // ---------- Game state ----------
  const ROBOT_COLORS = ['#ff8a65', '#ba68c8', '#4db6ac', '#f06292', '#7986cb', '#aed581', '#ffb74d', '#4fc3f7', '#e57373', '#9575cd'];
  let G = null; // current level state
  let mode = 'menu'; // menu | story | play | pause | win | oops | rest | ...

  function newLevel(level) {
    const cfg = levelConfig(level, save.words);
    const grid = cfg.map.map(r => r.split(''));
    G = {
      level, cfg, grid,
      player: { x: PLAYER_SPAWN.c, y: PLAYER_SPAWN.r, a: -Math.PI / 2, r: 0.36, shield: 5, inv: 1.2, fireCd: 0, moving: 0, tread: 0 },
      robots: [], bullets: [], pickups: [], parts: [],
      queue: cfg.items.slice(),
      spawnCd: 0.6, total: cfg.items.length + (cfg.boss ? 1 : 0),
      asleep: 0, orderHits: 0, numberedHits: 0, starsGot: 0,
      target: null, lastTarget: null, targetT: 0, doneIdx: new Set(), learned: [],
      time: 0, ended: false, endT: 0, result: null, colorIdx: 0,
    };
    if (cfg.boss) {
      const b = cfg.bossInfo;
      G.robots.push(makeRobot(10, 2.2, null, { boss: true, hp: b.hp, maxHp: b.hp, color: b.color, face: b.face, name: b.name }));
      G.spawnCd = 2.5;
    }
  }

  function makeRobot(x, y, item, extra = {}) {
    return {
      x, y, a: Math.PI / 2, r: extra.boss ? 0.78 : 0.36, item,
      color: extra.color || (item && item.color) || ROBOT_COLORS[(G.colorIdx++) % ROBOT_COLORS.length],
      state: 'spawn', t: 0, moveT: 0, fireT: rand(1.6, 2.8), dir: Math.PI / 2, blink: rand(1, 4), flash: 0, tread: 0,
      ...extra,
    };
  }

  // The robot that answers the current question (the rainbow bonus).
  // Ordered lessons (counting, poems) go by position; others pick one awake robot and keep it.
  function pickTarget() {
    const alive = G.robots.filter(r => r.item && r.state !== 'sleep');
    if (!alive.length) return null;
    if (G.cfg.ordered) return alive.reduce((a, b) => (a.item.idx <= b.item.idx ? a : b));
    if (G.target && alive.includes(G.target)) return G.target;
    const running = alive.filter(r => r.state === 'run');
    const pool = running.length ? running : alive;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function refreshTarget(dt) {
    G.target = pickTarget();
    G.targetT += dt;
    if (G.target !== G.lastTarget) {
      G.lastTarget = G.target; G.targetT = 0;
      if (G.target && G.target.item.say) sayParts(G.target.item.say);
    }
  }
  function repeatQuestion() {
    if (mode === 'play' && G && G.target && G.target.item.say) sayParts(G.target.item.say, true);
  }

  // ---------- Collision helpers ----------
  function solidAt(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 'X';
    const t = G.grid[r][c];
    return (t === 'B' || t === 'S') ? t : null;
  }
  function circleHitsTiles(x, y, rad, breaker) {
    let hit = false;
    for (let r = Math.floor(y - rad); r <= Math.floor(y + rad); r++) {
      for (let c = Math.floor(x - rad); c <= Math.floor(x + rad); c++) {
        const s = solidAt(c, r);
        if (!s) continue;
        const nx = clamp(x, c, c + 1), ny = clamp(y, r, r + 1);
        if ((x - nx) ** 2 + (y - ny) ** 2 < rad * rad - 1e-6) {
          if (breaker && s === 'B') { breakBrick(c, r, false); continue; }
          hit = true;
        }
      }
    }
    return hit;
  }
  function hitsTank(e, x, y) {
    const all = [G.player, ...G.robots];
    for (const o of all) {
      if (o === e || o.state === 'sleep') continue;
      const d2 = (o.x - x) ** 2 + (o.y - y) ** 2, min = (o.r + e.r - 0.04) ** 2;
      if (d2 < min && d2 < (o.x - e.x) ** 2 + (o.y - e.y) ** 2) return true; // only block when getting closer
    }
    return false;
  }
  function tryMove(e, dx, dy, breaker) {
    let blocked = false;
    if (dx) {
      if (!circleHitsTiles(e.x + dx, e.y, e.r, breaker) && !hitsTank(e, e.x + dx, e.y)) e.x += dx; else blocked = true;
    }
    if (dy) {
      if (!circleHitsTiles(e.x, e.y + dy, e.r, breaker) && !hitsTank(e, e.x, e.y + dy)) e.y += dy; else blocked = true;
    }
    return blocked;
  }
  // Slide around corners so little hands don't get stuck on edges.
  function assist(e, dx, dy, step) {
    if (Math.abs(dx) > Math.abs(dy)) {
      const ty = Math.floor(e.y) + 0.5, d = ty - e.y;
      if (Math.abs(d) > 0.01) tryMove(e, 0, Math.sign(d) * Math.min(Math.abs(d), step));
    } else {
      const tx = Math.floor(e.x) + 0.5, d = tx - e.x;
      if (Math.abs(d) > 0.01) tryMove(e, Math.sign(d) * Math.min(Math.abs(d), step), 0);
    }
  }

  function breakBrick(c, r, byPlayer) {
    G.grid[r][c] = '.';
    sfx.pop();
    burst(c + 0.5, r + 0.5, G.cfg.world.theme.brick, 8, 2.5);
    if (byPlayer) {
      const roll = Math.random();
      if (roll < 0.2) G.pickups.push({ x: c + 0.5, y: r + 0.5, kind: 'star', t: 0 });
      else if (roll < 0.28 && G.player.shield < 5) G.pickups.push({ x: c + 0.5, y: r + 0.5, kind: 'heart', t: 0 });
    }
  }

  // ---------- Particles ----------
  function burst(x, y, color, n, speed, kind = 'spark') {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(0.3, 1) * speed;
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.8), max: 0.8, color, kind, size: rand(0.06, 0.12) });
    }
  }
  function floatText(x, y, text, color = '#fff') { G.parts.push({ x, y, vx: 0, vy: -0.9, life: 1.2, max: 1.2, color, kind: 'text', text }); }
  function rainbow(x, y) {
    const cols = ['#ff5252', '#ffab40', '#ffee58', '#69f0ae', '#40c4ff', '#7c4dff'];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      G.parts.push({ x, y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 0.9, max: 0.9, color: cols[i % 6], kind: 'spark', size: 0.12 });
    }
  }

  // ---------- Input ----------
  const input = { jx: 0, jy: 0, fire: false };
  const keys = new Set();
  const joyEl = $('joy'), knobEl = $('joy-knob'), fireEl = $('fire');
  let JOY_R = 70;
  let joyId = null, joyCx = 0, joyCy = 0;
  const firePointers = new Set();
  function placeIdleJoystick() {
    if (joyId != null) return;
    const size = parseFloat(getComputedStyle(joyEl).width) || 170;
    JOY_R = size * 0.41;
    joyCx = Math.max(safe.l + size * 0.75, W * 0.11); joyCy = H - Math.max(safe.b, 10) - size * 0.8;
    joyEl.style.left = joyCx + 'px'; joyEl.style.top = joyCy + 'px';
    knobEl.style.transform = 'translate(0,0)';
  }
  function setKnob(x, y) {
    let dx = x - joyCx, dy = y - joyCy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
    knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    input.jx = dx / JOY_R; input.jy = dy / JOY_R;
  }
  const app = $('app');
  app.addEventListener('pointerdown', (e) => {
    if (mode !== 'play') return;
    if (e.target.closest('button, .screen, #hud-next')) return;
    e.preventDefault();
    if (e.clientX < W * 0.5) {
      if (joyId != null) return;
      joyId = e.pointerId; joyCx = e.clientX; joyCy = Math.max(e.clientY, hudH + JOY_R * 0.6);
      joyEl.style.left = joyCx + 'px'; joyEl.style.top = joyCy + 'px';
      joyEl.classList.add('active'); setKnob(e.clientX, e.clientY);
    } else {
      firePointers.add(e.pointerId); input.fire = true; fireEl.classList.add('active');
    }
  });
  window.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) setKnob(e.clientX, e.clientY); });
  function pointerEnd(e) {
    if (e.pointerId === joyId) { joyId = null; input.jx = input.jy = 0; joyEl.classList.remove('active'); placeIdleJoystick(); }
    if (firePointers.delete(e.pointerId) && !firePointers.size) { input.fire = false; fireEl.classList.remove('active'); }
  }
  window.addEventListener('pointerup', pointerEnd);
  window.addEventListener('pointercancel', pointerEnd);
  function releaseAll() {
    joyId = null; firePointers.clear(); input.jx = input.jy = 0; input.fire = false;
    joyEl.classList.remove('active'); fireEl.classList.remove('active'); placeIdleJoystick();
  }
  // Stop iPad Safari from scrolling, zooming or showing the magnifier.
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.panel, .story-card, .menu-card')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    keys.add(e.key.toLowerCase());
    if ((e.key === 'Escape' || e.key === 'p') && mode === 'play') pause();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  function readInput() {
    let x = input.jx, y = input.jy, fire = input.fire;
    if (keys.size) {
      const k = (a, b) => keys.has(a) || keys.has(b);
      const kx = (k('arrowright', 'd') ? 1 : 0) - (k('arrowleft', 'a') ? 1 : 0);
      const ky = (k('arrowdown', 's') ? 1 : 0) - (k('arrowup', 'w') ? 1 : 0);
      if (kx || ky) { const l = Math.hypot(kx, ky); x = kx / l; y = ky / l; }
      if (keys.has(' ') || keys.has('j')) fire = true;
    }
    return { x, y, fire };
  }

  // ---------- Update ----------
  function update(dt) {
    G.time += dt;
    const p = G.player, cfg = G.cfg;
    const inp = readInput();

    // Player: 360° movement, speed follows how far the stick is pushed.
    const mag = Math.hypot(inp.x, inp.y);
    p.moving = 0;
    if (mag > 0.15) {
      const target = Math.atan2(inp.y, inp.x);
      let diff = ((target - p.a + Math.PI * 3) % TAU) - Math.PI;
      p.a += clamp(diff, -12 * dt, 12 * dt);
      const speed = 3.2 * clamp((mag - 0.15) / 0.75, 0.25, 1);
      const dx = Math.cos(target) * speed * dt, dy = Math.sin(target) * speed * dt;
      if (tryMove(p, dx, dy)) assist(p, dx, dy, speed * dt);
      p.moving = speed; p.tread += speed * dt;
    }
    p.inv = Math.max(0, p.inv - dt);
    p.fireCd -= dt;
    if (inp.fire && p.fireCd <= 0 && !G.ended && G.bullets.filter(b => b.mine).length < 4) {
      p.fireCd = 0.32;
      const bx = p.x + Math.cos(p.a) * 0.55, by = p.y + Math.sin(p.a) * 0.55;
      G.bullets.push({ x: bx, y: by, vx: Math.cos(p.a) * 8, vy: Math.sin(p.a) * 8, mine: true, r: 0.13, life: 3 });
      sfx.pew();
    }

    // Spawn robots one by one.
    const alive = G.robots.filter(r => r.state !== 'sleep' && !r.boss).length;
    G.spawnCd -= dt;
    if (G.queue.length && alive < cfg.maxAlive && G.spawnCd <= 0) {
      const spots = ROBOT_SPAWNS.filter(s => Math.hypot(s.c - p.x, s.r - p.y) > 3 && !G.robots.some(r => r.state !== 'sleep' && Math.hypot(r.x - s.c, r.y - s.r) < r.r + 0.5));
      if (spots.length) {
        const s = spots[Math.floor(Math.random() * spots.length)];
        G.robots.push(makeRobot(s.c, s.r, G.queue.shift()));
        burst(s.c, s.r, '#ffffff', 10, 2);
        G.spawnCd = 1.4;
      }
    }

    // Robots
    for (const r of G.robots) {
      r.blink -= dt; if (r.blink < -0.15) r.blink = rand(2, 5);
      r.flash = Math.max(0, r.flash - dt);
      if (r.state === 'spawn') { r.t += dt; if (r.t > 0.6) { r.state = 'run'; r.t = 0; } continue; }
      if (r.state === 'sleep') {
        r.t += dt;
        if (Math.random() < dt * 2.5) G.parts.push({ x: r.x + 0.2, y: r.y - r.r, vx: 0.3, vy: -0.7, life: 1.2, max: 1.2, color: '#5c6bc0', kind: 'text', text: 'z' });
        continue;
      }
      robotThink(r, dt);
    }
    // Sleeping robots fade away after a nap.
    for (const r of G.robots) {
      if (r.state === 'sleep' && r.t > 1.8 && !r.gone) {
        r.gone = true; burst(r.x, r.y, '#ffffff', 12, 2.2);
        if (!r.boss && Math.random() < 0.35) G.pickups.push({ x: r.x, y: r.y, kind: 'star', t: 0 });
      }
    }
    G.robots = G.robots.filter(r => !r.gone);
    refreshTarget(dt);

    // Bullets
    for (const b of G.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0) { b.dead = true; continue; }
      const c = Math.floor(b.x), rr = Math.floor(b.y);
      const s = solidAt(c, rr);
      if (s) {
        b.dead = true;
        if (s === 'B') breakBrick(c, rr, b.mine);
        else { sfx.tink(); burst(b.x, b.y, '#ffffff', 4, 1.5); }
        continue;
      }
      if (b.mine) {
        for (const r of G.robots) {
          if (r.state === 'sleep' || r.state === 'spawn') continue;
          if ((r.x - b.x) ** 2 + (r.y - b.y) ** 2 < (r.r + b.r) ** 2) { b.dead = true; hitRobot(r); break; }
        }
        if (!b.dead) for (const o of G.bullets) {
          if (!o.mine && !o.dead && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < (o.r + b.r) ** 2) {
            o.dead = b.dead = true; burst(b.x, b.y, '#ffe082', 6, 1.8); sfx.tink(); break;
          }
        }
      } else if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < (p.r + b.r) ** 2) {
        b.dead = true; hurtPlayer();
      }
    }
    G.bullets = G.bullets.filter(b => !b.dead);

    // Pickups
    for (const k of G.pickups) {
      k.t += dt;
      if (Math.hypot(k.x - p.x, k.y - p.y) < 0.65) {
        k.dead = true;
        if (k.kind === 'star') { G.starsGot++; sfx.coin(); floatText(k.x, k.y, '+⭐'); }
        else { p.shield = Math.min(5, p.shield + 1); sfx.heart(); floatText(k.x, k.y, '+❤️'); }
      }
      if (k.t > 14) k.dead = true;
    }
    G.pickups = G.pickups.filter(k => !k.dead);

    // Particles
    for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= q.kind === 'text' ? 1 : 0.96; q.life -= dt; }
    G.parts = G.parts.filter(q => q.life > 0);

    // End of level
    if (!G.ended) {
      if (p.shield <= 0) { G.ended = true; G.result = 'oops'; G.endT = 1.1; }
      else if (!G.queue.length && G.robots.every(r => r.state === 'sleep') && G.asleep >= G.total) { G.ended = true; G.result = 'win'; G.endT = 1.4; sfx.win(); }
    } else {
      G.endT -= dt;
      if (G.endT <= 0) { const res = G.result; G.result = null; if (res) finishLevel(res); }
    }
  }

  function robotThink(r, dt) {
    const p = G.player, cfg = G.cfg;
    const speed = cfg.robotSpeed * (r.boss ? 0.55 : 1);
    r.moveT -= dt;
    if (r.moveT <= 0) {
      // Mostly wander; sometimes drift toward the player.
      if (Math.random() < 0.35) {
        const dx = p.x - r.x, dy = p.y - r.y;
        r.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : Math.PI) : (dy > 0 ? Math.PI / 2 : -Math.PI / 2);
      } else r.dir = Math.floor(Math.random() * 4) * Math.PI / 2;
      r.moveT = rand(1, 2.6);
    }
    let diff = ((r.dir - r.a + Math.PI * 3) % TAU) - Math.PI;
    r.a += clamp(diff, -6 * dt, 6 * dt);
    const dx = Math.cos(r.dir) * speed * dt, dy = Math.sin(r.dir) * speed * dt;
    if (tryMove(r, dx, dy, r.boss)) {
      assist(r, dx, dy, speed * dt);
      if (Math.random() < 0.08) r.moveT = 0;
    }
    r.tread += speed * dt;

    r.fireT -= dt;
    if (r.fireT <= 0 && !G.ended) {
      r.fireT = cfg.fireEvery * rand(0.75, 1.3) * (r.boss ? 0.8 : 1);
      const hidden = G.grid[Math.floor(p.y)]?.[Math.floor(p.x)] === 'G';
      const dist = Math.hypot(p.x - r.x, p.y - r.y);
      let aim = (hidden || dist > 10) ? r.a : Math.atan2(p.y - r.y, p.x - r.x) + rand(-cfg.aimError, cfg.aimError);
      const shots = r.boss ? [-0.35, 0, 0.35] : [0];
      for (const off of shots) {
        const a = aim + off;
        G.bullets.push({ x: r.x + Math.cos(a) * (r.r + 0.1), y: r.y + Math.sin(a) * (r.r + 0.1), vx: Math.cos(a) * cfg.bulletSpeed, vy: Math.sin(a) * cfg.bulletSpeed, mine: false, r: r.boss ? 0.2 : 0.16, life: 6 });
      }
    }
  }

  function hitRobot(r) {
    if (r.boss) {
      r.hp--; r.flash = 0.2; sfx.bossHit(); burst(r.x, r.y, '#ffffff', 6, 2);
      if (r.hp > 0) { floatText(r.x, r.y - r.r, `还差 ${r.hp} 下`, '#fff'); return; }
      sleepRobot(r);
      floatText(r.x, r.y - 1, `${r.name}睡着啦！`, '#ffeb3b');
      speak(`${r.name}睡着啦`);
      return;
    }
    const target = pickTarget();
    let right = target === r;
    // Same character twice in a poem line: either robot counts, keep the order consistent.
    if (!right && target && G.cfg.ordered && target.item.label === r.item.label) {
      [target.item.idx, r.item.idx] = [r.item.idx, target.item.idx]; right = true;
    }
    if (target && target.item.word) {
      const st = save.words[target.item.word] || (save.words[target.item.word] = { r: 0, w: 0 });
      if (right) st.r++; else st.w++;
    }
    sleepRobot(r);
    G.numberedHits++;
    G.doneIdx.add(r.item.idx);
    const shown = r.item.label || '';
    if (right) {
      G.orderHits++; rainbow(r.x, r.y); sfx.ding();
      G.learned.push(r.item.label);
      floatText(r.x, r.y - 0.6, `${shown} 对啦！🌈`, '#fff59d');
      sayParts(r.item.hit, true);
    } else {
      if (shown) floatText(r.x, r.y - 0.6, shown, '#ffffff');
      sayParts(r.item.name, true);
    }
    if (right) { G.target = null; G.lastTarget = null; }
  }
  function sleepRobot(r) { r.state = 'sleep'; r.t = 0; G.asleep++; sfx.sleep(); burst(r.x, r.y, r.color, 10, 2); }

  function hurtPlayer() {
    const p = G.player;
    if (p.inv > 0 || G.ended) return;
    p.shield--; p.inv = 1.6; sfx.ouch(); burst(p.x, p.y, '#90caf9', 10, 2.2);
    floatText(p.x, p.y - 0.6, p.shield > 0 ? '哎呀！' : '没电啦', '#ffffff');
  }

  // ---------- Drawing ----------
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const th = G ? G.cfg.world.theme : S.WORLDS[0].theme;
    ctx.fillStyle = shade(th.floor, -0.12); ctx.fillRect(0, 0, W, H);
    if (!G) return;
    ctx.setTransform(DPR * tile, 0, 0, DPR * tile, DPR * ox, DPR * oy);
    // floor
    ctx.fillStyle = th.floor; rr(0, 0, COLS, ROWS, 0.3); ctx.fill();
    ctx.fillStyle = th.floor2;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if ((r + c) % 2) ctx.fillRect(c, r, 1, 1);
    // blocks
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = G.grid[r][c];
      if (t === 'B') drawBrick(c, r, th); else if (t === 'S') drawSteel(c, r, th);
    }
    for (const k of G.pickups) drawPickup(k);
    for (const r of G.robots) drawRobot(r);
    drawPlayer(G.player);
    for (const b of G.bullets) drawBullet(b);
    // bushes on top: you can hide in them
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (G.grid[r][c] === 'G') drawBush(c, r, th);
    for (const r of G.robots) drawBadge(r);
    for (const q of G.parts) drawPart(q);
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => clamp(Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt)), 0, 255);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function drawBrick(c, r, th) {
    ctx.fillStyle = th.brick; rr(c + 0.03, r + 0.03, 0.94, 0.94, 0.12); ctx.fill();
    ctx.strokeStyle = th.brickLine; ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.moveTo(c + 0.05, r + 0.5); ctx.lineTo(c + 0.95, r + 0.5);
    ctx.moveTo(c + 0.5, r + 0.05); ctx.lineTo(c + 0.5, r + 0.5);
    ctx.moveTo(c + 0.25, r + 0.5); ctx.lineTo(c + 0.25, r + 0.95);
    ctx.moveTo(c + 0.75, r + 0.5); ctx.lineTo(c + 0.75, r + 0.95);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(c + 0.1, r + 0.1, 0.3, 0.08);
  }
  function drawSteel(c, r, th) {
    ctx.fillStyle = th.steelDark; rr(c + 0.02, r + 0.02, 0.96, 0.96, 0.1); ctx.fill();
    ctx.fillStyle = th.steel; rr(c + 0.08, r + 0.08, 0.84, 0.84, 0.08); ctx.fill();
    ctx.fillStyle = th.steelDark;
    for (const [a, b] of [[0.22, 0.22], [0.78, 0.22], [0.22, 0.78], [0.78, 0.78]]) { ctx.beginPath(); ctx.arc(c + a, r + b, 0.06, 0, TAU); ctx.fill(); }
  }
  function drawBush(c, r, th) {
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = th.bush2;
    for (const [a, b, s] of [[0.3, 0.62, 0.32], [0.7, 0.62, 0.32], [0.5, 0.35, 0.34]]) { ctx.beginPath(); ctx.arc(c + a, r + b, s, 0, TAU); ctx.fill(); }
    ctx.fillStyle = th.bush;
    for (const [a, b, s] of [[0.3, 0.58, 0.26], [0.7, 0.58, 0.26], [0.5, 0.32, 0.28]]) { ctx.beginPath(); ctx.arc(c + a, r + b, s, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function drawTreads(len, wid, tread, col) {
    ctx.fillStyle = col;
    rr(-len / 2, -wid / 2 - 0.06, len, 0.2, 0.08); ctx.fill();
    rr(-len / 2, wid / 2 - 0.14, len, 0.2, 0.08); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 0.03;
    const off = (tread * 2) % 0.18;
    ctx.beginPath();
    for (let x = -len / 2 + off; x < len / 2; x += 0.18) {
      ctx.moveTo(x, -wid / 2 - 0.06); ctx.lineTo(x, -wid / 2 + 0.14);
      ctx.moveTo(x, wid / 2 - 0.14); ctx.lineTo(x, wid / 2 + 0.06);
    }
    ctx.stroke();
  }
  function drawEyes(x, y, s, look, closed, blink) {
    for (const side of [-1, 1]) {
      const ex = x, ey = y + side * s * 1.1;
      if (closed || blink) {
        ctx.strokeStyle = '#263238'; ctx.lineWidth = 0.045; ctx.beginPath();
        ctx.arc(ex, ey, s * 0.7, closed ? -Math.PI / 2 - 1 : -Math.PI / 2 - 0.2, closed ? -Math.PI / 2 + 1 : -Math.PI / 2 + 0.2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, s, 0, TAU); ctx.fill();
        ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(ex + s * 0.35 * look, ey, s * 0.55, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + s * 0.15, ey - s * 0.3, s * 0.2, 0, TAU); ctx.fill();
      }
    }
  }
  function drawPlayer(p) {
    if (p.inv > 0 && Math.floor(p.inv * 10) % 2 === 0 && G.time > 1.3) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
    drawTreads(0.86, 0.78, p.tread, '#37474f');
    ctx.fillStyle = '#2f6fe4'; rr(-0.36, -0.3, 0.72, 0.6, 0.16); ctx.fill();
    ctx.fillStyle = '#5b93ff'; rr(-0.3, -0.24, 0.6, 0.48, 0.13); ctx.fill();
    ctx.fillStyle = '#2457c5'; rr(0.1, -0.07, 0.5, 0.14, 0.06); ctx.fill(); // barrel
    ctx.fillStyle = '#ffd54f'; rr(0.5, -0.09, 0.12, 0.18, 0.04); ctx.fill();
    ctx.fillStyle = '#7fb0ff'; ctx.beginPath(); ctx.arc(0, 0, 0.22, 0, TAU); ctx.fill();
    drawEyes(0.06, 0, 0.075, 1, false, false);
    ctx.restore();
    if (p.inv > 0) { ctx.strokeStyle = 'rgba(144,202,249,.7)'; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.arc(p.x, p.y, 0.52, 0, TAU); ctx.stroke(); }
  }
  function drawRobot(r) {
    let scale = 1;
    if (r.state === 'spawn') scale = clamp(r.t / 0.6, 0.1, 1);
    if (r.state === 'sleep' && r.t > 1.4) scale = clamp(1 - (r.t - 1.4) / 0.4, 0, 1);
    const asleep = r.state === 'sleep';
    const body = asleep ? '#b0bec5' : (r.flash > 0 ? '#ffffff' : r.color);
    ctx.save(); ctx.translate(r.x, r.y); ctx.scale(scale, scale);
    if (r.boss) {
      const s = r.r;
      ctx.rotate(Math.sin(G.time * 3) * 0.05);
      ctx.fillStyle = '#455a64'; rr(-s, -s * 0.95, s * 2, s * 1.9, s * 0.4); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, s * 0.88, 0, TAU); ctx.fill();
      ctx.font = `${s * 1.1}px "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = asleep ? 0.5 : 1; ctx.fillText(r.face, 0, s * 0.05); ctx.globalAlpha = 1;
      if (asleep) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `bold ${s * 0.6}px sans-serif`; ctx.fillText('💤', s * 0.5, -s * 0.6); }
      ctx.restore();
      return;
    }
    ctx.save(); ctx.rotate(r.a);
    drawTreads(0.82, 0.76, r.tread, asleep ? '#78909c' : '#455a64');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, 0.33, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(-0.08, -0.1, 0.14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#263238'; rr(0.02, -0.2, 0.26, 0.4, 0.1); ctx.fill(); // face screen
    ctx.restore();
    // eyes always drawn upright so robots look friendly
    const fx = Math.cos(r.a) * 0.15, fy = Math.sin(r.a) * 0.15;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(-Math.PI / 2);
    for (const side of [-1, 1]) {
      const ex = 0, ey = side * 0.085;
      if (asleep || r.blink < 0) {
        ctx.strokeStyle = '#80deea'; ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(ex, ey - 0.04); ctx.lineTo(ex, ey + 0.04); ctx.stroke();
      } else { ctx.fillStyle = '#80deea'; ctx.beginPath(); ctx.arc(ex, ey, 0.05, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    // antenna
    ctx.strokeStyle = '#455a64'; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(-0.05, -0.28); ctx.lineTo(-0.12, -0.46); ctx.stroke();
    ctx.fillStyle = asleep ? '#90a4ae' : (Math.sin(G.time * 6 + r.x) > 0 ? '#ffeb3b' : '#ff7043'); ctx.beginPath(); ctx.arc(-0.12, -0.48, 0.06, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawBadge(r) {
    if (r.state === 'sleep') return;
    if (r.boss) {
      const w = 1.6, x = r.x - w / 2, y = r.y - r.r - 0.35;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(x, y, w, 0.18, 0.09); ctx.fill();
      ctx.fillStyle = '#ff5252'; rr(x, y, w * (r.hp / r.maxHp), 0.18, 0.09); ctx.fill();
      return;
    }
    if (!r.item) return;
    // After 12 seconds without finding it, the answer starts to glow as a gentle hint.
    const hint = G.target === r && G.targetT > 12;
    const label = r.item.label;
    const x = r.x, y = r.y - 0.66;
    if (!label) { // colour lessons: the robot's colour is the answer
      if (hint) { ctx.strokeStyle = `hsla(${(G.time * 200) % 360},90%,60%,.95)`; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.arc(r.x, r.y, 0.5, 0, TAU); ctx.stroke(); }
      return;
    }
    const pinyin = /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i.test(label);
    const emoji = /\p{Extended_Pictographic}/u.test(label);
    const size = emoji ? 0.42 : pinyin ? 0.3 : label.length >= 3 ? 0.28 : label.length === 2 && !/^\d+$/.test(label) ? 0.32 : 0.4;
    // Draw in screen pixels: emoji and small text render badly when scaled from tiny font sizes.
    const T = tile, px = ox + x * T, py = oy + y * T;
    ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.font = `bold ${Math.round(size * T)}px -apple-system, "PingFang SC", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = emoji ? 0.66 * T : Math.max(0.56 * T, ctx.measureText(label).width + 0.24 * T), h = (emoji ? 0.6 : 0.52) * T;
    if (hint) {
      ctx.strokeStyle = `hsla(${(G.time * 200) % 360},90%,60%,.95)`; ctx.lineWidth = 0.07 * T;
      rr(px - w / 2 - 0.06 * T, py - h / 2 - 0.06 * T, w + 0.12 * T, h + 0.12 * T, 0.3 * T); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(px - w / 2, py - h / 2 + 0.04 * T, w, h, 0.24 * T); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(px - w / 2, py - h / 2, w, h, 0.24 * T); ctx.fill();
    ctx.fillStyle = '#263238';
    ctx.fillText(label, px, py + 0.02 * T);
    ctx.restore();
  }
  function drawBullet(b) {
    if (b.mine) {
      ctx.fillStyle = 'rgba(255,235,59,.35)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(171,71,188,.3)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ab47bc'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, TAU); ctx.fill();
    }
  }
  function star(x, y, R, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    ctx.closePath();
  }
  function drawPickup(k) {
    if (k.t > 11 && Math.floor(k.t * 6) % 2) return;
    const y = k.y + Math.sin(k.t * 4) * 0.06;
    if (k.kind === 'star') { ctx.fillStyle = '#ffca28'; star(k.x, y, 0.3, 0.13); ctx.fill(); ctx.strokeStyle = '#f57f17'; ctx.lineWidth = 0.04; ctx.stroke(); }
    else {
      ctx.fillStyle = '#ff5c8a'; ctx.beginPath();
      ctx.moveTo(k.x, y + 0.25);
      ctx.bezierCurveTo(k.x - 0.4, y - 0.02, k.x - 0.18, y - 0.32, k.x, y - 0.1);
      ctx.bezierCurveTo(k.x + 0.18, y - 0.32, k.x + 0.4, y - 0.02, k.x, y + 0.25);
      ctx.fill();
    }
  }
  function drawPart(q) {
    const a = clamp(q.life / q.max, 0, 1);
    ctx.globalAlpha = a;
    if (q.kind === 'text') {
      ctx.font = `bold ${q.text.length > 3 ? 0.36 : 0.44}px -apple-system, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 0.08; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.strokeText(q.text, q.x, q.y);
      ctx.fillStyle = q.color; ctx.fillText(q.text, q.x, q.y);
    } else { ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // ---------- HUD ----------
  const hudCache = {};
  function setHud(id, html) { if (hudCache[id] !== html) { hudCache[id] = html; $(id).innerHTML = html; } }
  function updateHud() {
    const p = G.player;
    setHud('hud-shield', '❤️'.repeat(Math.max(0, p.shield)) + '<span style="opacity:.25">' + '❤️'.repeat(5 - Math.max(0, p.shield)) + '</span>');
    setHud('hud-level', `${G.cfg.world.emoji} 第 ${G.level} 关`);
    setHud('hud-next', questionHtml());
    setHud('hud-robots', `🤖 ${G.total - G.asleep}`);
    setHud('hud-stars', `⭐ ${G.starsGot}`);
  }
  function questionHtml() {
    const L = G.cfg.lesson, tag = `<span class="tag s-${L.subject}">${L.subject}</span>`;
    if (L.kind === 'poem') {
      const cur = G.target ? G.target.item.idx : -1;
      return tag + `《${L.poem.title}》 ` + [...L.line].map((ch, i) => `<span class="${G.doneIdx.has(i) ? 'done' : i === cur ? 'cur' : 'todo'}">${ch}</span>`).join('');
    }
    if (G.target) return tag + G.target.item.cue + (G.target.item.say ? ' <span class="replay">🔊</span>' : '');
    if (G.cfg.boss && G.robots.some(r => r.boss && r.state !== 'sleep')) return `${G.cfg.bossInfo.face} 让大块头睡着`;
    return tag + (G.queue.length ? '机器人马上来…' : '🌈 找机器人');
  }
  let toastTimer = 0;
  function toast(text, secs = 3) { $('toast').textContent = text; $('toast').classList.remove('hidden'); toastTimer = secs; }

  // ---------- Screens & flow ----------
  const SCREENS = ['menu', 'select', 'story', 'pause', 'win', 'oops', 'rest', 'finale', 'howto', 'gate', 'parent', 'words'];
  function show(name) {
    for (const s of SCREENS) $('scr-' + s).classList.toggle('hidden', s !== name);
    const playing = name === null;
    $('hud').classList.toggle('hidden', !G || name === 'menu' || name === 'select' || name === 'howto' || name === 'words');
    $('controls').classList.toggle('hidden', !playing);
    if (!playing) releaseAll();
  }
  function goMenu() { mode = 'menu'; G = null; hush(); show('menu'); startMusic(null); $('btn-fullscreen').classList.toggle('hidden', !fsEnabled || isFullscreen()); $('install-tip').classList.toggle('hidden', !showInstallTip); $('btn-continue').textContent = save.unlocked > 1 ? `继续冒险 · 第 ${Math.min(save.unlocked, S.LEVEL_COUNT)} 关` : '开始冒险'; }

  let selectWorld = 0;
  function goSelect() {
    mode = 'select'; G = null; hush(); show('select');
    selectWorld = Math.floor((Math.min(save.unlocked, S.LEVEL_COUNT) - 1) / S.LEVELS_PER_WORLD);
    renderSelect();
  }
  function renderSelect() {
    const tabs = $('world-tabs'); tabs.innerHTML = '';
    S.WORLDS.forEach((w, i) => {
      const b = document.createElement('button');
      b.textContent = w.emoji; b.title = w.name;
      const first = i * S.LEVELS_PER_WORLD + 1;
      if (first > save.unlocked) b.classList.add('locked');
      if (i === selectWorld) b.classList.add('on');
      b.onclick = () => { selectWorld = i; renderSelect(); };
      tabs.appendChild(b);
    });
    $('select-title').textContent = `${S.WORLDS[selectWorld].emoji} ${S.WORLDS[selectWorld].name}`;
    const grid = $('level-grid'); grid.innerHTML = '';
    for (let s = 1; s <= S.LEVELS_PER_WORLD; s++) {
      const L = selectWorld * S.LEVELS_PER_WORLD + s;
      const b = document.createElement('button');
      const locked = L > save.unlocked;
      const stars = save.stars[L] || 0;
      b.innerHTML = locked ? `🔒<small>${L}</small>` : `${s === S.LEVELS_PER_WORLD ? S.WORLDS[selectWorld].boss.face : L}<small>${'★'.repeat(stars)}${'☆'.repeat(stars ? 3 - stars : 0)}</small>`;
      if (s === S.LEVELS_PER_WORLD) b.classList.add('boss');
      if (locked) b.classList.add('locked');
      b.dataset.level = L;
      b.onclick = () => { if (!locked) startLevel(L); };
      grid.appendChild(b);
    }
  }

  // Story cards
  let storyLines = [], storyIdx = 0, storyDone = null;
  function showStory(level, lines, done) {
    mode = 'story'; storyLines = lines; storyIdx = 0; storyDone = done;
    const w = S.worldOf(level);
    $('story-world').textContent = `${w.emoji} ${w.name}`;
    const L = G && G.cfg.lesson;
    $('story-level').textContent = `第 ${level} 关` + (S.isBossLevel(level) ? ' · 大块头' : '') + (L ? ` · ${L.subject} · ${L.title}` : '');
    show('story'); renderStory();
  }
  function renderStory() {
    const [who, text, card] = storyLines[storyIdx];
    $('scr-story').classList.toggle('is-card', !!card);
    $('story-dots').textContent = storyLines.map((_, i) => i === storyIdx ? '●' : '○').join('');
    $('story-next').textContent = storyIdx === storyLines.length - 1 ? '出发！' : '继续 ▶';
    if (card) {
      $('story-face').innerHTML = card.color ? `<span class="swatch" style="background:${card.color}"></span>` : card.pic;
      $('story-name').textContent = card.letter ? 'New letter 新字母 · Bee 老师' : 'New word 新单词 · Bee 老师';
      $('story-text').innerHTML = `<span class="card-word">${card.word}</span><span class="card-zh">${card.zh}</span><span class="card-tap">🔊 点图片再听一遍</span>`;
      sayCard(card);
      return;
    }
    $('story-face').textContent = who.face;
    $('story-name').textContent = who.name;
    $('story-text').textContent = text;
    $('story-dots').textContent = storyLines.map((_, i) => i === storyIdx ? '●' : '○').join('');
    $('story-next').textContent = storyIdx === storyLines.length - 1 ? '出发！' : '继续 ▶';
    speak(text);
  }
  function sayCard(card) {
    if (card.letter) { speak(card.letter, true, 'en'); speak(card.letter, false, 'en'); speak(card.zh, false, 'en'); return; }
    speak(card.word, true, 'en'); speak(card.word, false, 'en'); speak(card.zh, false, 'zh');
  }
  $('story-face').addEventListener('click', (e) => {
    e.stopPropagation();
    const entry = storyLines[storyIdx];
    if (entry && entry[2]) sayCard(entry[2]); else if (entry) speak(entry[1]);
  });
  function storyAdvance(skip) {
    if (!skip && storyIdx < storyLines.length - 1) { storyIdx++; renderStory(); return; }
    hush(); const d = storyDone; storyDone = null; if (d) d();
  }

  function startLevel(level) {
    const lim = limitReached();
    if (lim) return goRest(lim);
    newLevel(level);
    resize();
    startMusic(level);
    showStory(level, levelIntroLines(level), () => play());
  }
  function levelIntroLines(level) {
    const lines = S.storyBefore(level).slice();
    const cfg = G.cfg;
    if (cfg.boss) lines.push([S.GRANDPA, `打败${cfg.bossInfo.name}要碰它 ${cfg.bossInfo.hp} 下。它的小跟班身上也有题目哦。`]);
    const L = cfg.lesson;
    lines.push([L.teacher || { name: `扳手爷爷 · ${L.subject}`, face: { '语文': '📝', '数学': '🔢', '英语': '🔤', '常识': '💡' }[L.subject] }, L.teach]);
    if (L.cards) for (const c of L.cards) lines.push([L.teacher, '', c]);
    return lines;
  }
  function play() {
    startMusic(G.level);
    mode = 'play'; show(null); last = performance.now();
    if (save.settings.dailyMinutes > 0 && limitReached() === 'minutes') toast('今天的时间到啦，打完这一关就休息吧');
  }
  function pause() { if (mode !== 'play') return; mode = 'pause'; show('pause'); stopMusic(); }
  function resume() { mode = 'play'; show(null); last = performance.now(); startMusic(G.level); }

  function finishLevel(result) {
    if (result === 'oops') {
      if (limitReached()) return goRest(limitReached());
      mode = 'oops'; show('oops'); speak('护盾用完啦，没关系，再来一次！'); return;
    }
    const L = G.level, p = G.player;
    const rating = p.shield >= 4 ? 3 : p.shield >= 2 ? 2 : 1;
    save.stars[L] = Math.max(save.stars[L] || 0, rating);
    save.unlocked = Math.max(save.unlocked, Math.min(L + 1, S.LEVEL_COUNT));
    rollDay(); save.day.levels++; persist();
    mode = 'win'; show('win');
    $('win-stars').textContent = '⭐'.repeat(rating) + '☆'.repeat(3 - rating);
    $('win-title').textContent = ['', '过关啦！', '真厉害！', '太棒啦！'][rating];
    const n = G.cfg.items.length;
    $('win-detail').innerHTML = `捡到 ⭐ ${G.starsGot} 颗　·　🌈 答对 ${G.orderHits} / ${n}<br><span class="muted">${G.cfg.lesson.subject} · ${G.cfg.lesson.title}</span>`;
    speak($('win-title').textContent);
  }
  function afterWin() {
    const L = G.level;
    const recap = [[G.cfg.lesson.teacher || { name: '扳手爷爷', face: '📚' }, G.cfg.lesson.recap]];
    showStory(L, [...recap, ...S.storyAfter(L, G.asleep)], () => {
      if (L >= S.LEVEL_COUNT) return goFinale();
      const lim = limitReached();
      if (lim) return goRest(lim);
      startLevel(L + 1);
    });
  }
  function goRest(reason) {
    stopMusic();
    mode = 'rest'; G = null; show('rest');
    const st = save.settings;
    $('rest-detail').textContent = reason === 'levels'
      ? `今天已经玩了 ${save.day.levels} 关。小蓝要去充电睡觉了，明天再来吧！`
      : `今天已经玩了 ${st.dailyMinutes} 分钟。小蓝要去充电睡觉了，明天再来吧！`;
    speak('今天的冒险结束啦，明天再来吧！');
  }
  function goFinale() {
    mode = 'finale'; G = null; show('finale');
    const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
    $('finale-detail').textContent = `小蓝帮 10 个世界的机器人都睡了好觉，还和乱码云成了朋友。一共拿到 ${total} 颗过关星！`;
    speak('全部通关！你是最棒的小坦克！');
  }

  // Word book: every English word taught so far, tap to hear it.
  function wordState(w) {
    const st = save.words[w];
    if (!st) return 'new';
    if (st.r >= 3 && st.r >= st.w * 2) return 'good';
    return st.w > st.r ? 'weak' : 'ok';
  }
  function openWords() {
    mode = 'words'; G = null; hush(); show('words');
    const words = window.LESSONS.introducedBefore(save.unlocked);
    const grid = $('word-grid'); grid.innerHTML = '';
    $('words-empty').classList.toggle('hidden', words.length > 0);
    const good = words.filter(o => wordState(o.w) === 'good').length;
    $('words-summary').textContent = words.length ? `学过 ${words.length} 个单词，掌握了 ${good} 个 ⭐` : '';
    for (const o of words) {
      const b = document.createElement('button');
      const state = wordState(o.w);
      b.className = 'word ' + state;
      const pic = o.type === 'c' ? `<span class="swatch small" style="background:${{ red: '#f44336', blue: '#2196f3', yellow: '#fdd835', green: '#43a047', pink: '#f48fb1', purple: '#8e24aa', black: '#37474f', white: '#fafafa' }[o.w]}"></span>` : o.pic;
      b.innerHTML = `<span class="pic">${pic}</span><b>${o.w}</b><small>${o.zh}</small><i>${state === 'good' ? '⭐' : state === 'weak' ? '🔁' : ''}</i>`;
      b.onclick = () => { speak(o.w, true, 'en'); speak(o.zh, false, 'zh'); };
      grid.appendChild(b);
    }
  }

  // Parent gate
  let gateAnswer = 0, gateThen = null;
  function openGate(then) {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    gateAnswer = a * b; gateThen = then;
    $('gate-q').textContent = `${a} × ${b}`; $('gate-input').value = ''; $('gate-msg').textContent = '';
    hush(); show('gate');
    setTimeout(() => $('gate-input').focus(), 50);
  }
  function checkGate() {
    if (parseInt($('gate-input').value, 10) === gateAnswer) { $('gate-input').blur(); const t = gateThen; gateThen = null; t && t(); }
    else { $('gate-msg').textContent = '不对哦，请家长来回答'; $('gate-input').value = ''; }
  }
  function openParent() { mode = 'parent'; G = null; show('parent'); renderParent(); }
  function seg(id, options, current, onPick) {
    const el = $(id); el.innerHTML = '';
    for (const [val, label] of options) {
      const b = document.createElement('button'); b.textContent = label;
      if (val === current) b.classList.add('on');
      b.onclick = () => { onPick(val); persist(); renderParent(); };
      el.appendChild(b);
    }
  }
  function renderParent() {
    rollDay();
    const st = save.settings;
    seg('set-levels', [[0, '不限'], [1, '1'], [2, '2'], [3, '3'], [5, '5'], [10, '10']], st.dailyLevels, v => st.dailyLevels = v);
    seg('set-minutes', [[0, '不限'], [10, '10'], [15, '15'], [20, '20'], [30, '30'], [45, '45'], [60, '60']], st.dailyMinutes, v => st.dailyMinutes = v);
    seg('set-voice', [[true, '开'], [false, '关']], st.voice, v => st.voice = v);
    seg('set-sound', [[true, '开'], [false, '关']], st.sound, v => st.sound = v);
    seg('set-music', [[true, '开'], [false, '关']], st.music, v => { st.music = v; if (!v) stopMusic(); });
    const words = window.LESSONS.introducedBefore(save.unlocked);
    const good = words.filter(o => wordState(o.w) === 'good'), weak = words.filter(o => wordState(o.w) === 'weak');
    $('parent-today').innerHTML = `今天已玩 ${save.day.levels} 关、${Math.floor(save.day.seconds / 60)} 分钟。已解锁到第 ${save.unlocked} 关。<br>英语单词：学过 ${words.length} 个，掌握 ${good.length} 个` + (weak.length ? `，需要多练：${weak.map(o => o.w).join('、')}` : '') + '。';
  }

  // Button wiring
  const on = (id, fn) => $(id).addEventListener('click', fn);
  on('btn-fullscreen', () => { enterFullscreen(); $('btn-fullscreen').classList.add('hidden'); });
  on('btn-continue', () => enterFullscreen() || startLevel(Math.min(save.unlocked, S.LEVEL_COUNT)));
  on('btn-select', goSelect);
  on('btn-words', openWords);
  on('btn-howto', () => { mode = 'howto'; show('howto'); });
  on('btn-parent', () => openGate(openParent));
  on('btn-rest-parent', () => openGate(openParent));
  on('btn-rest-menu', goMenu);
  on('btn-finale-menu', goMenu);
  on('btn-pause', pause);
  $('hud-next').addEventListener('pointerdown', (e) => { e.stopPropagation(); repeatQuestion(); });
  on('btn-resume', resume);
  on('btn-restart', () => startLevel(G.level));
  on('btn-pause-select', goSelect);
  on('btn-pause-menu', goMenu);
  on('btn-win-next', afterWin);
  on('btn-win-select', goSelect);
  on('btn-oops-retry', () => startLevel(G.level));
  on('btn-oops-select', goSelect);
  on('story-next', (e) => { e.stopPropagation(); storyAdvance(false); });
  on('story-skip', (e) => { e.stopPropagation(); storyAdvance(true); });
  $('scr-story').addEventListener('click', (e) => { if (!e.target.closest('button')) storyAdvance(false); });
  on('gate-ok', checkGate);
  $('gate-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkGate(); });
  on('gate-cancel', goMenu);
  on('parent-back', goMenu);
  on('btn-reset-today', () => { save.day = { date: today(), levels: 0, seconds: 0 }; persist(); renderParent(); });
  on('btn-unlock-all', () => { save.unlocked = S.LEVEL_COUNT; persist(); renderParent(); });
  on('btn-reset-all', () => { if (confirm('确定清空全部进度吗？')) { save.unlocked = 1; save.stars = {}; save.words = {}; persist(); renderParent(); } });
  document.querySelectorAll('[data-go="menu"]').forEach(b => b.addEventListener('click', goMenu));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); persist(); stopMusic(); } else if (mode === 'menu') startMusic(null); });

  // ---------- Main loop ----------
  let last = performance.now(), saveTimer = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (G && mode === 'play') {
      update(dt);
      save.day.seconds += dt; saveTimer += dt;
      if (saveTimer > 5) { saveTimer = 0; persist(); }
      updateHud();
    }
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.add('hidden'); }
    draw();
    requestAnimationFrame(frame);
  }

  // Test hook (used by the automated end-to-end tests).
  window.__tank = {
    get G() { return G; }, get music() { return { song: music.song, playing: !!music.timer }; }, get mode() { return mode; }, get save() { return save; },
    target: () => G && G.target && { label: G.target.item.label, idx: G.target.item.idx, cue: G.target.item.cue },
    pickTarget: () => G && pickTarget(),
    startLevel, goMenu, persist,
    tileToScreen: (c, r) => ({ x: ox + c * tile, y: oy + r * tile }),
  };

  resize(); goMenu(); requestAnimationFrame(frame);
})();
