module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || '409626745185-pm588om09c00kgf5rcvha3voie7ap021.apps.googleusercontent.com';

  res.status(200).json({
    clientId
  });
};
