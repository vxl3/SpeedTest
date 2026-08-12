module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let received = 0;
  req.on('data', data => { received += data.length; });
  req.on('end', () => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.status(200).json({ received });
  });
};
