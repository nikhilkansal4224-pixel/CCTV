module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const publicUrl = `${proto}://${host}`;

  res.status(200).json({
    ips: [host],
    primaryIp: host,
    port: proto === 'https' ? 443 : 80,
    tunnelUrl: publicUrl,
    tunnelType: 'vercel',
    tunnelPassword: null,
    hasTunnel: true,
    isVercel: true,
    hostHeader: host
  });
};
