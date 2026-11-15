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
  const DEFAULTS = { unlocked: 1, stars: {}, settings: { dailyLevels: 0, dailyMinutes: 0, voice: true, sound: true }, day: { date: today(), levels: 0, seconds: 0 } };
  let save = load();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === 'object') return { ...DEFAULTS, ...s, settings: { ...DEFAULTS.settings, ...s.settings }, day: { ...DEFAULTS.day, ...s.day } };
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
  // iOS needs audio to start from a user gesture.
  window.addEventListener('pointerdown', () => { if (save.settings.sound) audio(); }, { once: true });

  let voices = [];
  function loadVoices() { try { voices = speechSynthesis.getVoices().filter(v => /zh/i.test(v.lang)); } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speak(text, interrupt = true) {
    if (!save.settings.voice || !('speechSynthesis' in window)) return;
    try {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[🧠📖]/gu, ''));
      u.lang = 'zh-CN'; u.rate = 0.95; u.pitch = 1.1;
      const v = voices.find(v => /zh[-_]CN/i.test(v.lang)) || voices[0];
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
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
    const hud = 56 + safeTop();
    tile = Math.min(W / COLS, (H - hud - 6) / ROWS);
    ox = (W - tile * COLS) / 2;
    oy = hud + (H - hud - tile * ROWS) / 2;
    placeIdleJoystick();
  }
  const safeProbe = document.createElement('div');
  safeProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top)';
  document.body.appendChild(safeProbe);
  function safeTop() { return parseFloat(getComputedStyle(safeProbe).paddingTop) || 0; }
  window.addEventListener('resize', resize);

  // ---------- Game state ----------
  const ROBOT_COLORS = ['#ff8a65', '#ba68c8', '#4db6ac', '#f06292', '#7986cb', '#aed581', '#ffb74d', '#4fc3f7', '#e57373', '#9575cd'];
  let G = null; // current level state
  let mode = 'menu'; // menu | story | play | pause | win | oops | rest | ...

  function newLevel(level) {
    const cfg = levelConfig(level);
    const grid = cfg.map.map(r => r.split(''));
    G = {
      level, cfg, grid,
      player: { x: PLAYER_SPAWN.c, y: PLAYER_SPAWN.r, a: -Math.PI / 2, r: 0.36, shield: 5, inv: 1.2, fireCd: 0, moving: 0, tread: 0 },
      robots: [], bullets: [], pickups: [], parts: [],
      queue: cfg.numbers.slice(),
      spawnCd: 0.6, total: cfg.numbers.length + (cfg.boss ? 1 : 0),
      asleep: 0, orderHits: 0, numberedHits: 0, starsGot: 0,
      time: 0, ended: false, endT: 0, result: null, colorIdx: 0,
    };
    if (cfg.boss) {
      const b = cfg.bossInfo;
      G.robots.push(makeRobot(10, 2.2, null, { boss: true, hp: b.hp, maxHp: b.hp, color: b.color, face: b.face, name: b.name }));
      G.spawnCd = 2.5;
    }
  }

  function makeRobot(x, y, num, extra = {}) {
    return {
      x, y, a: Math.PI / 2, r: extra.boss ? 0.78 : 0.36, num,
      color: extra.color || ROBOT_COLORS[(G.colorIdx++) % ROBOT_COLORS.length],
      state: 'spawn', t: 0, moveT: 0, fireT: rand(1.6, 2.8), dir: Math.PI / 2, blink: rand(1, 4), flash: 0, tread: 0,
      ...extra,
    };
  }

  // Which number should be hit next to earn the rainbow bonus.
  function expectedNumber() {
    const nums = G.robots.filter(r => r.num != null && r.state !== 'sleep').map(r => r.num);
    if (!nums.length) return null;
    return G.cfg.order === 'desc' ? Math.max(...nums) : Math.min(...nums);
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
  const JOY_R = 70;
  let joyId = null, joyCx = 0, joyCy = 0;
  const firePointers = new Set();
  function placeIdleJoystick() {
    if (joyId != null) return;
    joyCx = Math.max(130, W * 0.11); joyCy = H - 140;
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
    if (e.target.closest('button, .screen')) return;
    e.preventDefault();
    if (e.clientX < W * 0.5) {
      if (joyId != null) return;
      joyId = e.pointerId; joyCx = e.clientX; joyCy = Math.max(e.clientY, 100);
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
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.panel, .story-card')) e.preventDefault(); }, { passive: false });
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
    const expected = expectedNumber();
    sleepRobot(r);
    G.numberedHits++;
    if (r.num === expected) {
      G.orderHits++; rainbow(r.x, r.y); sfx.ding();
      floatText(r.x, r.y - 0.6, `${r.num} 对啦！🌈`, '#fff59d');
      speak(S.chineseNumber(r.num), false);
    } else {
      floatText(r.x, r.y - 0.6, String(r.num), '#ffffff');
      speak(S.chineseNumber(r.num), false);
    }
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
    if (r.num == null) return;
    const exp = expectedNumber() === r.num;
    const x = r.x, y = r.y - 0.62;
    if (exp) {
      ctx.strokeStyle = `hsla(${(G.time * 200) % 360},90%,60%,.95)`; ctx.lineWidth = 0.07;
      ctx.beginPath(); ctx.arc(x, y, 0.3 + Math.sin(G.time * 6) * 0.03, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 0.25, 0, TAU); ctx.fill();
    ctx.fillStyle = exp ? '#e65100' : '#37474f';
    ctx.font = `bold ${r.num >= 10 ? 0.26 : 0.32}px -apple-system, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(r.num), x, y + 0.02);
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
    const exp = expectedNumber();
    const hint = G.cfg.order === 'desc' ? '倒着数' : '按顺序';
    setHud('hud-next', exp != null ? `${hint}，下一个：<b>${exp}</b>` : (G.cfg.boss ? `${G.cfg.bossInfo.face} 让大块头睡着` : '🌈 找机器人'));
    setHud('hud-robots', `🤖 ${G.total - G.asleep}`);
    setHud('hud-stars', `⭐ ${G.starsGot}`);
  }
  let toastTimer = 0;
  function toast(text, secs = 3) { $('toast').textContent = text; $('toast').classList.remove('hidden'); toastTimer = secs; }

  // ---------- Screens & flow ----------
  const SCREENS = ['menu', 'select', 'story', 'pause', 'win', 'oops', 'rest', 'finale', 'howto', 'gate', 'parent'];
  function show(name) {
    for (const s of SCREENS) $('scr-' + s).classList.toggle('hidden', s !== name);
    const playing = name === null;
    $('hud').classList.toggle('hidden', !G || name === 'menu' || name === 'select' || name === 'howto');
    $('controls').classList.toggle('hidden', !playing);
    if (!playing) releaseAll();
  }
  function goMenu() { mode = 'menu'; G = null; hush(); show('menu'); $('btn-continue').textContent = save.unlocked > 1 ? `继续冒险 · 第 ${Math.min(save.unlocked, S.LEVEL_COUNT)} 关` : '开始冒险'; }

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
    $('story-level').textContent = S.isBossLevel(level) ? `第 ${level} 关 · 大块头` : `第 ${level} 关`;
    show('story'); renderStory();
  }
  function renderStory() {
    const [who, text] = storyLines[storyIdx];
    $('story-face').textContent = who.face;
    $('story-name').textContent = who.name;
    $('story-text').textContent = text;
    $('story-dots').textContent = storyLines.map((_, i) => i === storyIdx ? '●' : '○').join('');
    $('story-next').textContent = storyIdx === storyLines.length - 1 ? '出发！' : '继续 ▶';
    speak(text);
  }
  function storyAdvance(skip) {
    if (!skip && storyIdx < storyLines.length - 1) { storyIdx++; renderStory(); return; }
    hush(); const d = storyDone; storyDone = null; if (d) d();
  }

  function startLevel(level) {
    const lim = limitReached();
    if (lim) return goRest(lim);
    newLevel(level);
    resize();
    showStory(level, levelIntroLines(level), () => play());
  }
  function levelIntroLines(level) {
    const lines = S.storyBefore(level).slice();
    const cfg = G.cfg;
    if (cfg.boss) lines.push([S.GRANDPA, `打败${cfg.bossInfo.name}要碰它 ${cfg.bossInfo.hp} 下。`]);
    else lines.push([S.GRANDPA, `这一关有 ${cfg.numbers.length} 个机器人。${cfg.world.rule.hint}。`]);
    return lines;
  }
  function play() {
    mode = 'play'; show(null); last = performance.now();
    if (save.settings.dailyMinutes > 0 && limitReached() === 'minutes') toast('今天的时间到啦，打完这一关就休息吧');
  }
  function pause() { if (mode !== 'play') return; mode = 'pause'; show('pause'); }
  function resume() { mode = 'play'; show(null); last = performance.now(); }

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
    const numbered = G.cfg.numbers.length;
    $('win-detail').innerHTML = `捡到 ⭐ ${G.starsGot} 颗` + (numbered ? `　·　🌈 按顺序 ${G.orderHits} / ${numbered}` : '');
    speak($('win-title').textContent);
  }
  function afterWin() {
    const L = G.level;
    showStory(L, S.storyAfter(L, G.asleep), () => {
      if (L >= S.LEVEL_COUNT) return goFinale();
      const lim = limitReached();
      if (lim) return goRest(lim);
      startLevel(L + 1);
    });
  }
  function goRest(reason) {
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
    $('parent-today').textContent = `今天已玩 ${save.day.levels} 关、${Math.floor(save.day.seconds / 60)} 分钟。已解锁到第 ${save.unlocked} 关。`;
  }

  // Button wiring
  const on = (id, fn) => $(id).addEventListener('click', fn);
  on('btn-continue', () => startLevel(Math.min(save.unlocked, S.LEVEL_COUNT)));
  on('btn-select', goSelect);
  on('btn-howto', () => { mode = 'howto'; show('howto'); });
  on('btn-parent', () => openGate(openParent));
  on('btn-rest-parent', () => openGate(openParent));
  on('btn-rest-menu', goMenu);
  on('btn-finale-menu', goMenu);
  on('btn-pause', pause);
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
  on('btn-reset-all', () => { if (confirm('确定清空全部进度吗？')) { save.unlocked = 1; save.stars = {}; persist(); renderParent(); } });
  document.querySelectorAll('[data-go="menu"]').forEach(b => b.addEventListener('click', goMenu));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); persist(); } });

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
    get G() { return G; }, get mode() { return mode; }, get save() { return save; },
    expectedNumber: () => G && expectedNumber(),
    startLevel, goMenu, persist,
    tileToScreen: (c, r) => ({ x: ox + c * tile, y: oy + r * tile }),
  };

  resize(); goMenu(); requestAnimationFrame(frame);
})();
