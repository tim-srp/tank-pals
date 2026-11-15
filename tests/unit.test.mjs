import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../src/story.js');
const L = require('../src/levels.js');

test('there are 100 levels in 10 worlds', () => {
  assert.equal(S.LEVEL_COUNT, 100);
  assert.equal(S.WORLDS.length, 10);
});

test('every level has a valid, reachable map', () => {
  for (let lv = 1; lv <= S.LEVEL_COUNT; lv++) {
    const m = L.generateMap(lv);
    assert.equal(m.length, L.ROWS, `level ${lv} rows`);
    for (const row of m) assert.match(row, /^[.BSG]{20}$/, `level ${lv} row`);
    assert.ok(L.connected(m.map(r => r.split(''))), `level ${lv} connected`);
    assert.notEqual(m.join(''), '.'.repeat(240), `level ${lv} should not fall back to an empty field`);
  }
});

test('maps are deterministic and differ between levels', () => {
  assert.deepEqual(L.generateMap(7), L.generateMap(7));
  assert.notDeepEqual(L.generateMap(7), L.generateMap(8));
});

test('robot numbers follow each world rule', () => {
  for (let lv = 1; lv <= S.LEVEL_COUNT; lv++) {
    const c = L.levelConfig(lv);
    assert.equal(new Set(c.numbers).size, c.numbers.length, `level ${lv} distinct numbers`);
    assert.ok(c.numbers.length >= 2 && c.numbers.length <= 10);
    const rule = S.worldOf(lv).rule;
    const sorted = [...c.numbers].sort((a, b) => a - b);
    if (rule.kind === 'count') sorted.forEach((n, i) => assert.equal(n, rule.start + i * rule.step));
    if (rule.kind === 'random') assert.ok(sorted.every(n => n >= 1 && n <= rule.max));
    assert.ok(c.robotSpeed > 0 && c.fireEvery > 0 && c.maxAlive >= 2);
  }
  assert.equal(L.levelConfig(55).order, 'desc');
});

test('difficulty grows gently', () => {
  assert.ok(L.levelConfig(100).robotSpeed > L.levelConfig(1).robotSpeed);
  assert.ok(L.levelConfig(100).fireEvery < L.levelConfig(1).fireEvery);
  assert.ok(L.levelConfig(1).numbers.length <= 3);
});

test('every level has story before and after', () => {
  for (let lv = 1; lv <= S.LEVEL_COUNT; lv++) {
    const before = S.storyBefore(lv), after = S.storyAfter(lv, 3);
    assert.ok(before.length >= 1 && after.length >= 1, `level ${lv}`);
    for (const [who, text] of [...before, ...after]) { assert.ok(who.name && who.face); assert.ok(text.length > 3); }
  }
  assert.ok(S.isBossLevel(10) && S.isBossLevel(100) && !S.isBossLevel(11));
  assert.match(S.storyAfter(100, 1).map(l => l[1]).join(''), /彩虹/);
});

test('chinese numbers', () => {
  assert.deepEqual([1, 10, 11, 20, 35, 100].map(S.chineseNumber), ['一', '十', '十一', '二十', '三十五', '一百']);
});
