// End-to-end tests in real browsers at iPad size, with real multi-touch input.
// Chromium drives the touch flows (CDP multi-touch); WebKit (Safari's engine) checks rendering and the same flows.
import { chromium, webkit } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { serve } from '../scripts/serve.mjs';

const PORT = 8799, URL = `http://localhost:${PORT}/`;
const OUT = 'test-output';
await mkdir(OUT, { recursive: true });
const server = await serve(PORT);
const IPAD = { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true };
let passed = 0;
async function step(name, fn) { process.stdout.write(`  • ${name} … `); await fn(); passed++; console.log('ok'); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function open(browserType, label) {
  const browser = await browserType.launch();
  const ctx = await browser.newContext({ ...IPAD, ...(browserType === chromium ? {} : {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  await page.waitForFunction(() => window.__tank && window.__tank.mode === 'menu');
  return { browser, page, errors, label };
}
const mode = (page) => page.evaluate(() => window.__tank.mode);
const visible = (page, id) => page.locator('#' + id).isVisible();
async function tapThroughStory(page) {
  await page.waitForFunction(() => window.__tank.mode === 'story');
  for (let i = 0; i < 12 && (await mode(page)) === 'story'; i++) await page.locator('#story-next').tap();
  await page.waitForFunction(() => window.__tank.mode === 'play');
}
// Put every robot to sleep in order by placing the player's energy balls on them (uses the real collision code).
async function winByShooting(page) {
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => {
      const t = window.__tank, G = t.G;
      if (!G || t.mode !== 'play') return 'done';
      G.player.inv = 5; // keep the test player safe
      const exp = t.expectedNumber();
      const target = G.robots.find(r => r.state === 'run' && r.num === exp) || (exp == null && G.robots.find(r => r.state === 'run' && r.boss));
      if (target && !G.bullets.some(b => b.mine)) G.bullets.push({ x: target.x, y: target.y, vx: 0.01, vy: 0, mine: true, r: 0.13, life: 1 });
      return 'go';
    });
    if (st === 'done') return;
    await sleep(60);
  }
  throw new Error('could not finish level');
}
async function touch(cdp, type, points) { await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, i) => ({ x: p.x, y: p.y, id: p.id ?? i })) }); }

// ---------------- Chromium: full flows with real touch ----------------
console.log('Chromium (touch):');
{
  const { browser, page, errors } = await open(chromium);
  const cdp = await page.context().newCDPSession(page);

  await step('menu shows, with a full-screen button, and screenshot', async () => {
    assert.ok(await visible(page, 'scr-menu'));
    assert.ok(await visible(page, 'btn-fullscreen'));
    await page.screenshot({ path: `${OUT}/01-menu.png` });
  });

  await step('start adventure → story cards → play', async () => {
    await page.locator('#btn-continue').tap();
    await page.waitForFunction(() => window.__tank.mode === 'story');
    await page.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 }); // start enters full screen
    assert.match(await page.locator('#story-text').textContent(), /乱码云/);
    await page.screenshot({ path: `${OUT}/02-story.png` });
    await tapThroughStory(page);
    assert.ok(await visible(page, 'controls'));
  });

  await step('joystick drives the tank 360° and fire button shoots (two fingers at once)', async () => {
    await sleep(300);
    const before = await page.evaluate(() => ({ ...window.__tank.G.player }));
    // left thumb lands, then drags up-right; right thumb holds fire
    await touch(cdp, 'touchStart', [{ x: 200, y: 650, id: 1 }]);
    await touch(cdp, 'touchStart', [{ x: 200, y: 650, id: 1 }, { x: 1050, y: 700, id: 2 }]);
    await touch(cdp, 'touchMove', [{ x: 200, y: 560, id: 1 }, { x: 1050, y: 700, id: 2 }]);
    let maxBullets = 0;
    for (let i = 0; i < 10; i++) { await sleep(60); maxBullets = Math.max(maxBullets, await page.evaluate(() => window.__tank.G.bullets.filter(b => b.mine).length)); }
    const mid = await page.evaluate(() => ({ ...window.__tank.G.player }));
    assert.ok(mid.y < before.y - 0.3, `tank should move up (y ${before.y} → ${mid.y})`);
    assert.ok(Math.abs(mid.a + Math.PI / 2) < 0.2, 'tank faces up');
    assert.ok(maxBullets >= 1, 'fire should shoot');
    await page.screenshot({ path: `${OUT}/03-play-touch.png` });
    // now steer right only
    await touch(cdp, 'touchMove', [{ x: 290, y: 650, id: 1 }, { x: 1050, y: 700, id: 2 }]);
    await sleep(500);
    const right = await page.evaluate(() => ({ ...window.__tank.G.player }));
    assert.ok(Math.abs(right.a) < 0.2, `tank turns right (a=${right.a})`);
    // light push = slower than full push
    await touch(cdp, 'touchMove', [{ x: 200, y: 622, id: 1 }, { x: 1050, y: 700, id: 2 }]);
    await sleep(100);
    const slow = await page.evaluate(() => window.__tank.G.player.moving);
    await touch(cdp, 'touchMove', [{ x: 200, y: 560, id: 1 }, { x: 1050, y: 700, id: 2 }]);
    await sleep(100);
    const fast = await page.evaluate(() => window.__tank.G.player.moving);
    assert.ok(slow > 0 && fast > slow * 1.5, `light push slower (${slow}) than full push (${fast})`);
    await touch(cdp, 'touchEnd', []);
    await sleep(150);
    const stopped = await page.evaluate(() => ({ moving: window.__tank.G.player.moving, x: window.__tank.G.player.x }));
    await sleep(200);
    const still = await page.evaluate(() => window.__tank.G.player.x);
    assert.equal(stopped.moving, 0, 'releasing stops the tank');
    assert.equal(still, stopped.x);
  });

  await step('page did not scroll or zoom during touch play', async () => {
    const s = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY, z: window.visualViewport.scale }));
    assert.deepEqual(s, { x: 0, y: 0, z: 1 });
  });

  await step('background music plays the world tune during play', async () => {
    const m = await page.evaluate(() => window.__tank.music);
    assert.deepEqual(m, { song: 'hop', playing: true });
  });

  await step('pause / resume (music stops while paused)', async () => {
    await page.locator('#btn-pause').tap();
    assert.equal(await mode(page), 'pause');
    assert.equal((await page.evaluate(() => window.__tank.music)).playing, false);
    const t = await page.evaluate(() => window.__tank.G.time); await sleep(300);
    assert.equal(await page.evaluate(() => window.__tank.G.time), t, 'time frozen while paused');
    await page.locator('#btn-resume').tap();
    assert.equal(await mode(page), 'play');
    assert.equal((await page.evaluate(() => window.__tank.music)).playing, true);
  });

  await step('robots spawn with numbers; hitting in order gives rainbow bonus; level 1 is won', async () => {
    await page.waitForFunction(() => window.__tank.G.robots.some(r => r.state === 'run'), null, { timeout: 8000 });
    await page.screenshot({ path: `${OUT}/04-robots.png` });
    await winByShooting(page);
    await page.waitForFunction(() => window.__tank.mode === 'win', null, { timeout: 8000 });
    const g = await page.evaluate(() => ({ order: window.__tank.G.orderHits, n: window.__tank.G.cfg.numbers.length, unlocked: window.__tank.save.unlocked }));
    assert.equal(g.order, g.n, 'all hit in order');
    assert.equal(g.unlocked, 2);
    await page.screenshot({ path: `${OUT}/05-win.png` });
  });

  await step('after-win story, then level 2 intro story', async () => {
    await page.locator('#btn-win-next').tap();
    await page.waitForFunction(() => window.__tank.mode === 'story');
    assert.match(await page.locator('#story-text').textContent(), /醒过来/);
    await page.locator('#story-next').tap();
    await page.waitForFunction(() => window.__tank.mode === 'story' && /第 2 关/.test(document.getElementById('story-level').textContent));
    await tapThroughStory(page);
    assert.equal(await page.evaluate(() => window.__tank.G.level), 2);
  });

  await step('getting hit loses shield; 0 shield shows the gentle retry screen', async () => {
    await page.evaluate(() => { const G = window.__tank.G; G.player.inv = 0; G.player.shield = 1; G.bullets.push({ x: G.player.x, y: G.player.y, vx: 0, vy: 0.01, mine: false, r: 0.16, life: 1 }); });
    await page.waitForFunction(() => window.__tank.mode === 'oops', null, { timeout: 5000 });
    await page.screenshot({ path: `${OUT}/06-oops.png` });
    await page.locator('#btn-oops-retry').tap();
    await tapThroughStory(page);
    assert.equal(await page.evaluate(() => window.__tank.G.player.shield), 5);
  });

  await step('breaking a brick by shooting it', async () => {
    const ok = await page.evaluate(() => {
      const G = window.__tank.G;
      for (let r = 0; r < 11; r++) for (let c = 0; c < 20; c++) if (G.grid[r][c] === 'B' && (G.grid[r + 1][c] === '.' || G.grid[r + 1][c] === 'G')) {
        G.bullets.push({ x: c + 0.5, y: r + 1.2, vx: 0, vy: -4, mine: true, r: 0.13, life: 1 }); window.__brick = [c, r]; return true;
      }
      return false;
    });
    assert.ok(ok);
    await page.waitForFunction(() => { const [c, r] = window.__brick; return window.__tank.G.grid[r][c] === '.'; }, null, { timeout: 3000 });
  });

  await step('boss level (10) and countdown world (level 55) can be won', async () => {
    await page.evaluate(() => { window.__tank.save.unlocked = 100; window.__tank.startLevel(10); });
    await tapThroughStory(page);
    assert.ok(await page.evaluate(() => window.__tank.G.robots.some(r => r.boss)));
    assert.equal((await page.evaluate(() => window.__tank.music)).song, 'boss');
    await sleep(800);
    await page.screenshot({ path: `${OUT}/07-boss.png` });
    await winByShooting(page);
    await page.waitForFunction(() => window.__tank.mode === 'win', null, { timeout: 10000 });
    await page.locator('#btn-win-next').tap();
    assert.match(await page.locator('#story-text').textContent(), /稻草人|谢谢/);
    await page.evaluate(() => window.__tank.startLevel(55));
    await tapThroughStory(page);
    assert.equal(await page.evaluate(() => window.__tank.G.cfg.order), 'desc');
    await winByShooting(page);
    await page.waitForFunction(() => window.__tank.mode === 'win', null, { timeout: 10000 });
    const g = await page.evaluate(() => ({ order: window.__tank.G.orderHits, n: window.__tank.G.cfg.numbers.length }));
    assert.equal(g.order, g.n, 'countdown order rewarded');
  });

  await step('level select shows 10 worlds with 10 levels each', async () => {
    await page.locator('#btn-win-select').tap();
    assert.equal(await page.locator('#world-tabs button').count(), 10);
    assert.equal(await page.locator('#level-grid button').count(), 10);
    await page.locator('#world-tabs button').nth(9).tap();
    assert.match(await page.locator('#select-title').textContent(), /云朵城堡/);
    await page.screenshot({ path: `${OUT}/08-select.png` });
    await page.locator('#level-grid button[data-level="100"]').tap();
    await page.waitForFunction(() => window.__tank.mode === 'story');
    assert.match(await page.locator('#story-text').textContent(), /闪电|核心/);
  });

  await step('parent gate rejects wrong answer, accepts right one; daily level limit enforced', async () => {
    await page.evaluate(() => window.__tank.goMenu());
    await page.locator('#btn-parent').tap();
    await page.locator('#gate-input').fill('1');
    await page.locator('#gate-ok').tap();
    assert.equal(await mode(page), 'menu'); // still on gate screen (mode unchanged)
    assert.ok(await visible(page, 'scr-gate'));
    const q = await page.locator('#gate-q').textContent();
    const [a, b] = q.split('×').map(s => parseInt(s, 10));
    await page.locator('#gate-input').fill(String(a * b));
    await page.locator('#gate-ok').tap();
    assert.ok(await visible(page, 'scr-parent'));
    await page.locator('#btn-reset-today').tap();
    await page.locator('#set-music button', { hasText: '关' }).tap();
    assert.equal(await page.evaluate(() => window.__tank.save.settings.music), false);
    assert.equal((await page.evaluate(() => window.__tank.music)).playing, false);
    await page.locator('#set-music button', { hasText: '开' }).tap();
    await page.locator('#set-levels button', { hasText: /^1$/ }).tap();
    await page.screenshot({ path: `${OUT}/09-parent.png` });
    assert.equal(await page.evaluate(() => window.__tank.save.settings.dailyLevels), 1);
    await page.locator('#parent-back').tap();
    await page.evaluate(() => window.__tank.startLevel(3));
    await tapThroughStory(page);
    await winByShooting(page);
    await page.waitForFunction(() => window.__tank.mode === 'win', null, { timeout: 10000 });
    await page.locator('#btn-win-next').tap();
    await page.locator('#story-next').tap();
    await page.waitForFunction(() => window.__tank.mode === 'rest');
    await page.screenshot({ path: `${OUT}/10-rest.png` });
    await page.locator('#btn-rest-menu').tap();
    await page.locator('#btn-continue').tap();
    assert.equal(await mode(page), 'rest', 'still resting after limit');
  });

  await step('settings survive a reload; daily minutes limit enforced', async () => {
    await page.evaluate(() => { const s = window.__tank.save; s.settings.dailyLevels = 0; s.settings.dailyMinutes = 10; s.day.seconds = 601; window.__tank.persist(); });
    await page.reload();
    await page.waitForFunction(() => window.__tank && window.__tank.mode === 'menu');
    assert.equal(await page.evaluate(() => window.__tank.save.settings.dailyMinutes), 10);
    assert.match(await page.locator('#btn-continue').textContent(), /继续冒险/);
    await page.locator('#btn-continue').tap();
    assert.equal(await mode(page), 'rest');
    assert.match(await page.locator('#rest-detail').textContent(), /10 分钟/);
  });

  await step('time running out mid-level lets the child finish the level first', async () => {
    await page.evaluate(() => { const s = window.__tank.save; s.day.seconds = 590; window.__tank.persist(); window.__tank.startLevel(4); });
    await tapThroughStory(page);
    await sleep(11000);
    assert.equal(await mode(page), 'play', 'still playing after the limit passed');
    await winByShooting(page);
    await page.waitForFunction(() => window.__tank.mode === 'win', null, { timeout: 10000 });
    await page.locator('#btn-win-next').tap();
    await page.locator('#story-next').tap();
    await page.waitForFunction(() => window.__tank.mode === 'rest');
  });

  await step('portrait shows rotate hint', async () => {
    await page.evaluate(() => document.fullscreenElement && document.exitFullscreen());
    await sleep(300);
    await page.setViewportSize({ width: 820, height: 1180 });
    assert.ok(await visible(page, 'rotate'));
    await page.setViewportSize({ width: 1180, height: 820 });
    assert.ok(!(await visible(page, 'rotate')));
  });

  await step('no JavaScript errors', async () => { assert.deepEqual(errors, []); });
  await browser.close();
}

// ---------------- WebKit (Safari engine) ----------------
console.log('WebKit (Safari engine):');
{
  const { browser, page, errors } = await open(webkit);
  await step('menu renders', async () => { await page.screenshot({ path: `${OUT}/w1-menu.png` }); assert.ok(await visible(page, 'scr-menu')); });
  await step('start, play, robots, keyboard move, win level 1', async () => {
    await page.locator('#btn-continue').tap();
    await tapThroughStory(page);
    const y0 = await page.evaluate(() => window.__tank.G.player.y);
    await page.keyboard.down('ArrowUp'); await sleep(400); await page.keyboard.up('ArrowUp');
    assert.ok((await page.evaluate(() => window.__tank.G.player.y)) < y0 - 0.3);
    await page.waitForFunction(() => window.__tank.G.robots.some(r => r.state === 'run'), null, { timeout: 8000 });
    await sleep(1200);
    await page.screenshot({ path: `${OUT}/w2-play.png` });
    await winByShooting(page);
    await page.waitForFunction(() => window.__tank.mode === 'win', null, { timeout: 8000 });
  });
  await step('pointer touches drive joystick in WebKit', async () => {
    await page.evaluate(() => window.__tank.startLevel(1));
    await tapThroughStory(page);
    const y0 = await page.evaluate(() => window.__tank.G.player.y);
    await page.evaluate(() => {
      const app = document.getElementById('app');
      const ev = (type, x, y, id, target = app) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: id, pointerType: 'touch', isPrimary: id === 1 }));
      ev('pointerdown', 200, 650, 1); ev('pointermove', 200, 560, 1, window);
      ev('pointerdown', 1050, 700, 2);
      window.__end = () => { ev('pointerup', 200, 560, 1, window); ev('pointerup', 1050, 700, 2, window); };
    });
    await sleep(500);
    const g = await page.evaluate(() => ({ y: window.__tank.G.player.y, shots: window.__tank.G.bullets.filter(b => b.mine).length }));
    await page.evaluate(() => window.__end());
    assert.ok(g.y < y0 - 0.3, 'moved up'); assert.ok(g.shots >= 1, 'fired');
  });
  await step('story card renders in WebKit', async () => {
    await page.evaluate(() => window.__tank.startLevel(41));
    await page.waitForFunction(() => window.__tank.mode === 'story');
    await page.screenshot({ path: `${OUT}/w3-story.png` });
  });
  await step('no JavaScript errors', async () => { assert.deepEqual(errors, []); });
  await browser.close();
}

server.close();
console.log(`\n${passed} e2e checks passed. Screenshots in ${OUT}/`);
