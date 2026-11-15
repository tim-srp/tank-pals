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

test('every level has a lesson the child can answer', () => {
  const subjects = {};
  for (let lv = 1; lv <= S.LEVEL_COUNT; lv++) {
    const c = L.levelConfig(lv), les = c.lesson;
    subjects[les.subject] = (subjects[les.subject] || 0) + 1;
    assert.ok(c.items.length >= 3 && c.items.length <= 8, `level ${lv} item count ${c.items.length}`);
    assert.ok(les.teach && les.recap && les.title, `level ${lv} texts`);
    for (const it of c.items) {
      assert.ok(it.hit && it.hit.length, `level ${lv} hit speech`);
      if (!les.ordered) {
        assert.ok(it.cue && it.say, `level ${lv} needs a question`);
        assert.ok(it.label || it.color, `level ${lv} label`);
      }
    }
    if (!les.ordered) {
      const labels = c.items.map(i => i.label || i.color), cues = c.items.map(i => i.cue);
      assert.equal(new Set(labels).size, labels.length, `level ${lv} answers must be distinct`);
      assert.equal(new Set(cues).size, cues.length, `level ${lv} questions must be distinct`);
    } else {
      const idx = c.items.map(i => i.idx).sort((a, b) => a - b);
      assert.deepEqual(idx, idx.map((_, i) => i), `level ${lv} order`);
    }
    if (les.kind === 'math') for (const it of c.items) {
      const m = it.cue.match(/(\d+) ([+−×]) (\d+)/);
      const [a, op, b] = [Number(m[1]), m[2], Number(m[3])];
      const ans = op === '+' ? a + b : op === '−' ? a - b : a * b;
      assert.equal(String(ans), it.label, `level ${lv}: ${it.cue}`);
      assert.ok(ans >= 0 && ans <= 100);
    }
    if (les.kind === 'poem') assert.equal(c.items.map(i => i.label).join(''), les.line);
    if (les.subject === '英语') assert.ok(c.items.every(i => i.say[0][1] === 'en'));
  }
  assert.ok(subjects['语文'] >= 50, `语文 ${subjects['语文']}`);
  assert.ok(subjects['数学'] >= 15 && subjects['英语'] >= 15 && subjects['常识'] >= 4, JSON.stringify(subjects));
  assert.equal(L.levelConfig(55).order, 'desc');
});

test('lesson difficulty follows the grades', () => {
  assert.match(L.levelConfig(7).lesson.title, /5 以内加法/);
  assert.match(L.levelConfig(87).lesson.title, /乘法口诀 6–9/);
  assert.equal(L.levelConfig(5).lesson.title, '古诗《咏鹅》');
  assert.equal(L.levelConfig(40).lesson.line, '疑是地上霜');
  assert.equal(L.levelConfig(4).lesson.subject, '英语');
});

test('difficulty grows gently', () => {
  assert.ok(L.levelConfig(100).robotSpeed > L.levelConfig(1).robotSpeed);
  assert.ok(L.levelConfig(100).fireEvery < L.levelConfig(1).fireEvery);
  assert.ok(L.levelConfig(1).items.length <= 3);
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
