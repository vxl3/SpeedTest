module.exports = (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || '—').split(',')[0].trim().replace(/^::ffff:/, '');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.status(200).json({ ip, server: process.env.VERCEL_REGION || req.headers.host });
};
