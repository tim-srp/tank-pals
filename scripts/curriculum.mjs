// Writes docs/curriculum.md: what each of the 100 levels teaches (generated from the game data).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const S = require('../src/story.js');
const L = require('../src/levels.js');
const rows = ['# 小蓝坦克 · 课程表', '', '由 `node scripts/curriculum.mjs` 从游戏数据生成。世界 1–5 大致对应一年级，6–10 对应二年级。', ''];
const count = {};
S.WORLDS.forEach((w, wi) => {
  rows.push(`## ${w.emoji} 世界 ${wi + 1} · ${w.name}`, '', '| 关 | 科目 | 内容 | 学到 |', '|---|---|---|---|');
  for (let s = 1; s <= 10; s++) {
    const lv = wi * 10 + s, les = L.levelConfig(lv).lesson;
    count[les.subject] = (count[les.subject] || 0) + 1;
    rows.push(`| ${lv}${s === 10 ? ' 🏰' : ''} | ${les.subject} | ${les.title} | ${les.recap.replace(/\|/g, '/')} |`);
  }
  rows.push('');
});
rows.splice(4, 0, `科目分布：${Object.entries(count).map(([k, v]) => `${k} ${v} 关`).join('，')}。`, '');
writeFileSync('docs/curriculum.md', rows.join('\n'));
console.log(count);
