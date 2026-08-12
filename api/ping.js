module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.status(200).json({ ok: true, serverTime: Date.now() });
};
