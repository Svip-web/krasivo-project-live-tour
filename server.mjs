import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const port = Number(process.env.KRASIVO_PREVIEW_PORT || 4186);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.webp':'image/webp', '.png':'image/png', '.woff2':'font/woff2', '.mp4':'video/mp4', '.svg':'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const headers = { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache', 'Accept-Ranges':'bytes' };
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
      if (start > end || start >= info.size) { res.writeHead(416, { 'Content-Range':`bytes */${info.size}` }); res.end(); return; }
      res.writeHead(206, { ...headers, 'Content-Range':`bytes ${start}-${end}/${info.size}`, 'Content-Length':end-start+1 });
      createReadStream(file, { start, end }).pipe(res);
    } else { res.writeHead(200, { ...headers, 'Content-Length':info.size }); if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res); }
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
