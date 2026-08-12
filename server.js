const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const chunk = crypto.randomBytes(256 * 1024);

function headers(res, type) {
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
function clientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '—').split(',')[0].trim().replace(/^::ffff:/, '');
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/ping') {
    headers(res, 'application/json');
    return res.end(JSON.stringify({ ok: true, serverTime: Date.now() }));
  }
  if (url.pathname === '/api/info') {
    headers(res, 'application/json');
    return res.end(JSON.stringify({ ip: clientIp(req), server: process.env.SERVER_NAME || req.headers.host }));
  }
  if (url.pathname === '/api/download') {
    // Stream the test data gradually and honour back-pressure. This is essential
    // on mobile browsers/proxies; queuing a huge response can make a test report 0.
    let bytes = Math.min(Math.max(Number(url.searchParams.get('bytes')) || 25_000_000, 1_000_000), 200_000_000);
    headers(res, 'application/octet-stream');
    // A declared length lets mobile preview proxies begin forwarding immediately.
    res.setHeader('Content-Length', bytes);
    let closed = false;
    // `req.close` can fire once the incoming GET request is read, even while
    // its response is still being sent. Watch the response instead.
    res.on('close', () => { closed = true; });
    const send = () => {
      if (closed || res.writableEnded) return;
      if (bytes <= 0) return res.end();
      const out = bytes >= chunk.length ? chunk : chunk.subarray(0, bytes);
      bytes -= out.length;
      if (res.write(out)) setImmediate(send);
      else res.once('drain', send);
    };
    return send();
  }
  if (url.pathname === '/api/upload' && req.method === 'POST') {
    let received = 0;
    req.on('data', d => { received += d.length; });
    req.on('end', () => { headers(res, 'application/json'); res.end(JSON.stringify({ received })); });
    return;
  }
  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  file = path.normalize(path.join(PUBLIC, file));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file); const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8' };
    headers(res, types[ext] || 'application/octet-stream'); res.end(data);
  });
});
server.listen(PORT, '0.0.0.0', () => console.log(`Speed test is listening on ${PORT}`));
