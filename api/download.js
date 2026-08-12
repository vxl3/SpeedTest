const crypto = require('crypto');
const chunk = crypto.randomBytes(256 * 1024);

module.exports = (req, res) => {
  let bytes = Math.min(Math.max(Number(req.query.bytes) || 1_000_000, 65_536), 10_000_000);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', String(bytes));
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  let closed = false;
  res.on('close', () => { closed = true; });
  function send() {
    if (closed || res.writableEnded) return;
    if (bytes <= 0) return res.end();
    const out = bytes >= chunk.length ? chunk : chunk.subarray(0, bytes);
    bytes -= out.length;
    if (res.write(out)) setImmediate(send);
    else res.once('drain', send);
  }
  send();
};
