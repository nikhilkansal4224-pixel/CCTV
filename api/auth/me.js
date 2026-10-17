const { verifySession } = require('../_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = req.headers.authorization || (req.query && req.query.token);
  const user = await verifySession(token);

  if (!user) {
    res.status(401).json({ authenticated: false, error: 'Session expired or invalid.' });
    return;
  }

  res.status(200).json({ authenticated: true, user });
};
