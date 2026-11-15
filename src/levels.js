// Level generation: every level number always produces the same map and robots (seeded).
'use strict';
(function (root) {
  const STORY = root.STORY || (typeof require !== 'undefined' ? require('./story.js') : null);
  const LESSONS = root.LESSONS || (typeof require !== 'undefined' ? require('./lessons.js') : null);
  const COLS = 20, ROWS = 12;
  // Tiles: '.' floor, 'B' brick (breakable), 'S' steel (solid), 'G' bush (drive-through, hides you)
  const PLAYER_SPAWN = { c: 9.5, r: 10.5 };
  const ROBOT_SPAWNS = [{ c: 1.5, r: 1.5 }, { c: 10, r: 1.5 }, { c: 18.5, r: 1.5 }];

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Cells kept empty so nobody spawns stuck.
  function reserved(c, r) {
    if (r >= 9 && c >= 7 && c <= 12) return true; // player home
    if (r <= 2 && (c <= 2 || c >= 17 || (c >= 8 && c <= 11))) return true; // robot spawns
    return false;
  }

  function generateMap(level) {
    const boss = STORY.isBossLevel(level);
    const t = (level - 1) / (STORY.LEVEL_COUNT - 1);
    for (let attempt = 0; attempt < 200; attempt++) {
      const R = rng(level * 7919 + attempt * 104729 + 17);
      const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
      const density = boss ? 0.12 : lerp(0.2, 0.3, t) + R() * 0.04;
      const steelChance = boss ? 0.15 : lerp(0.04, 0.24, t);
      const half = COLS / 2;
      let placed = 0;
      const target = density * ROWS * half;
      let guard = 0;
      while (placed < target && guard++ < 500) {
        const shape = Math.floor(R() * 5);
        const c0 = Math.floor(R() * half), r0 = Math.floor(R() * ROWS);
        const tile = R() < 0.18 ? 'G' : (R() < steelChance ? 'S' : 'B');
        let cells = [];
        if (shape === 0) for (let i = 0; i < 2 + Math.floor(R() * 3); i++) cells.push([c0 + i, r0]);
        else if (shape === 1) for (let i = 0; i < 2 + Math.floor(R() * 2); i++) cells.push([c0, r0 + i]);
        else if (shape === 2) cells = [[c0, r0], [c0 + 1, r0], [c0, r0 + 1], [c0 + 1, r0 + 1]];
        else if (shape === 3) cells = [[c0, r0], [c0 + 1, r0], [c0, r0 + 1]];
        else cells = [[c0, r0]];
        for (const [c, r] of cells) {
          if (c < 0 || c >= half || r < 0 || r >= ROWS) continue;
          if (reserved(c, r) || g[r][c] !== '.') continue;
          g[r][c] = tile;
          g[r][COLS - 1 - c] = tile; // mirror
          placed++;
        }
      }
      if (connected(g)) return g.map(row => row.join(''));
    }
    // Fallback: an empty field always works.
    return Array.from({ length: ROWS }, () => '.'.repeat(COLS));
  }

  // Every spawn point must be reachable from the player without shooting anything,
  // and most of the floor should be reachable too.
  function connected(g) {
    const open = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && (g[r][c] === '.' || g[r][c] === 'G');
    const seen = new Set();
    const start = [Math.floor(PLAYER_SPAWN.c), Math.floor(PLAYER_SPAWN.r)];
    const q = [start];
    seen.add(start.join());
    while (q.length) {
      const [c, r] = q.shift();
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = (c + dc) + ',' + (r + dr);
        if (!seen.has(k) && open(c + dc, r + dr)) { seen.add(k); q.push([c + dc, r + dr]); }
      }
    }
    for (const s of ROBOT_SPAWNS) if (!seen.has(Math.floor(s.c) + ',' + Math.floor(s.r))) return false;
    let total = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (open(c, r)) total++;
    return seen.size >= total * 0.8;
  }

  function shuffle(arr, R) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }

  function levelConfig(level) {
    const t = (level - 1) / (STORY.LEVEL_COUNT - 1);
    const stage = STORY.stageOf(level);
    const world = STORY.worldOf(level);
    const boss = STORY.isBossLevel(level);
    const lesson = LESSONS.lessonFor(level);
    const R = rng(level * 4243 + 7);
    const items = lesson.items.map((it, i) => ({ ...it, idx: it.idx ?? i }));
    // Spawn order: poems come out in order, everything else is mixed so kids have to look.
    if (!lesson.inOrder) shuffle(items, R);
    return {
      level, world, stage, boss,
      map: generateMap(level),
      lesson, items,
      ordered: lesson.ordered,
      order: world.rule.order,
      maxAlive: Math.min(3 + Math.floor((level - 1) / 25), 5),
      robotSpeed: lerp(0.9, 1.9, t) + stage * 0.02,
      fireEvery: lerp(3.8, 2.0, t),
      bulletSpeed: lerp(2.8, 4.6, t),
      aimError: lerp(0.45, 0.18, t),
      bossInfo: boss ? world.boss : null,
    };
  }

  const LEVELS = { COLS, ROWS, PLAYER_SPAWN, ROBOT_SPAWNS, levelConfig, generateMap, connected, rng };
  if (typeof module !== 'undefined') module.exports = LEVELS; else root.LEVELS = LEVELS;
})(typeof window !== 'undefined' ? window : globalThis);
