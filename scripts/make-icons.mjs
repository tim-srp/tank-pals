// Renders the app icon (a smiling blue tank) to PNG with a headless browser.
import { chromium } from 'playwright';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#bfe3a4"/>
  <circle cx="256" cy="230" r="190" fill="#d6f0ff"/>
  <rect x="96" y="300" width="320" height="70" rx="35" fill="#37474f"/>
  <circle cx="140" cy="335" r="20" fill="#78909c"/><circle cx="210" cy="335" r="20" fill="#78909c"/><circle cx="302" cy="335" r="20" fill="#78909c"/><circle cx="372" cy="335" r="20" fill="#78909c"/>
  <rect x="120" y="210" width="272" height="110" rx="40" fill="#2f6fe4"/>
  <rect x="300" y="170" width="150" height="38" rx="19" fill="#2457c5"/>
  <rect x="430" y="164" width="34" height="50" rx="10" fill="#ffd54f"/>
  <circle cx="256" cy="200" r="78" fill="#7fb0ff"/>
  <circle cx="226" cy="190" r="20" fill="#fff"/><circle cx="286" cy="190" r="20" fill="#fff"/>
  <circle cx="232" cy="192" r="11" fill="#263238"/><circle cx="292" cy="192" r="11" fill="#263238"/>
  <path d="M226 228 Q256 252 286 228" stroke="#263238" stroke-width="9" fill="none" stroke-linecap="round"/>
  <text x="400" y="110" font-size="70" font-family="sans-serif" font-weight="bold" fill="#5c6bc0">z</text>
  <text x="440" y="70" font-size="48" font-family="sans-serif" font-weight="bold" fill="#5c6bc0">z</text>
</svg>`;
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}">`);
  await page.screenshot({ path: `icons/icon-${size}.png` });
}
await browser.close();
console.log('icons written');
