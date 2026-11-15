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
      const labels = c.items.map(i => i.label || i.color), says = c.items.map(i => JSON.stringify(i.say) + i.cue);
      assert.equal(new Set(labels).size, labels.length, `level ${lv} answers must be distinct: ${labels}`);
      assert.equal(new Set(says).size, says.length, `level ${lv} questions must be distinct`);
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
    if (les.subject === '英语') assert.ok(c.items.every(i => i.hit.some(h => h[1] === 'en')), `level ${lv} English is spoken`);
    if (les.cards) assert.ok(les.cards.length === c.items.length || les.kind === 'letter', `level ${lv} cards`);
  }
  assert.ok(subjects['英语'] >= 55, JSON.stringify(subjects));
  assert.ok(subjects['语文'] >= 15 && subjects['数学'] >= 15, JSON.stringify(subjects));
  assert.equal(L.levelConfig(55).order, 'desc');
});

test('English starts from zero and grows', () => {
  const l1 = L.levelConfig(1).lesson;
  assert.equal(l1.subject, '英语'); assert.ok(l1.cards.length === 4);
  assert.deepEqual(l1.cards.map(c => c.word), ['cat', 'dog', 'bird', 'fish']);
  assert.match(L.levelConfig(2).lesson.title, /听音找图/);
  assert.match(L.levelConfig(22).lesson.title, /看图认词/);
  assert.match(L.levelConfig(67).lesson.title, /听句子/);
  assert.match(L.levelConfig(5).lesson.title, /字母 A–D/);
  assert.match(L.levelConfig(85).lesson.title, /拼单词/);
  assert.match(L.levelConfig(59).lesson.title, /英语算术/);
  assert.equal(L.levelConfig(8).lesson.title, '古诗《咏鹅》');
  const LS = require('../src/lessons.js');
  assert.equal(LS.introducedBefore(101).length, 82);
  assert.equal(LS.enNum(47), 'forty-seven');
});

test('review brings back words the child missed', () => {
  const plain = L.levelConfig(47).items.map(i => i.word);
  const missed = L.levelConfig(47, { cat: { r: 0, w: 3 }, pig: { r: 1, w: 4 } }).items.map(i => i.word);
  assert.ok(missed.includes('cat') && missed.includes('pig'), missed.join());
  assert.notDeepEqual(plain, missed);
});

test('difficulty grows gently', () => {
  assert.ok(L.levelConfig(100).robotSpeed > L.levelConfig(1).robotSpeed);
  assert.ok(L.levelConfig(100).fireEvery < L.levelConfig(1).fireEvery);
  assert.ok(L.levelConfig(1).items.length <= 4);
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
