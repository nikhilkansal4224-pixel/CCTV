const { getUserProfile, updateUserProfile } = require('../_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: Session token required.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const profile = await getUserProfile(token);
      res.status(200).json({ success: true, profile });
    } catch (err) {
      res.status(401).json({ success: false, error: err.message });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const updated = await updateUserProfile(token, body);
      res.status(200).json({ success: true, profile: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
