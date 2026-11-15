// Checks the published site: loads, plays, installs the offline cache, and reloads offline.
import { chromium, webkit } from 'playwright';
const URL = process.argv[2] || 'https://tim-srp.github.io/tank-pals/';
for (const bt of [webkit, chromium]) {
  const browser = await bt.launch();
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  await page.waitForFunction(() => window.__tank?.mode === 'menu');
  await page.locator('#btn-continue').click();
  await page.waitForFunction(() => window.__tank.mode === 'story');
  const icon = await page.evaluate(async () => (await fetch('icons/icon-180.png')).status);
  let offline = 'skipped';
  if (bt === chromium) {
    await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 15000 });
    await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 });
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => window.__tank?.mode === 'menu', null, { timeout: 10000 });
    offline = 'works offline';
  }
  console.log(bt.name(), { icon, offline, errors });
  await browser.close();
}
