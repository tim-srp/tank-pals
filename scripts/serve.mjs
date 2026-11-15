// Tiny static server for local testing: node scripts/serve.mjs [port]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(fileURLToPath(import.meta.url), '../..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
export function serve(port = 8765) {
  const server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(root, p));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try { const data = await readFile(file); res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(data); }
    catch { res.writeHead(404).end('not found'); }
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 8765);
  serve(port).then(() => console.log(`http://localhost:${port}/`));
}
