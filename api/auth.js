require('./_env');
const {
  loginUser,
  verify2FA,
  resend2FACode,
  registerUser,
  authenticateWithGoogle,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  verifySession,
  logoutSession
} = require('./_auth');

function parseBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return req.body || {};
}

module.exports = async function handler(req, res) {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Determine sub-action (e.g., login, google, profile, me)
  let action = '';
  if (req.query && req.query.action) {
    action = String(req.query.action).toLowerCase();
  } else if (req.url) {
    const cleanUrl = req.url.split('?')[0];
    action = cleanUrl.replace(/^\/api\/auth\/?/, '').toLowerCase();
  }

  const token = req.headers.authorization || '';

  try {
    // 1. Google OAuth Client ID
    if (action === 'google-client-id') {
      const clientId = process.env.GOOGLE_CLIENT_ID || '';
      return res.status(200).json({ clientId });
    }

    // 2. Google Sign-In & Sign-Up
    if (action === 'google') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const body = parseBody(req);
      const result = await authenticateWithGoogle(body);
      return res.status(200).json(result);
    }

    // 3. User Login
    if (action === 'login') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const body = parseBody(req);
      const result = await loginUser(body);
      return res.status(200).json({ success: true, ...result });
    }

    // 4. Verify 2FA
    if (action === 'verify-2fa') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const body = parseBody(req);
      const result = await verify2FA(body);
      return res.status(200).json(result);
    }

    // 5. Resend 2FA Code
    if (action === 'resend-code') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const body = parseBody(req);
      const result = await resend2FACode(body);
      return res.status(200).json(result);
    }

    // 6. Register New Operator
    if (action === 'register') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const body = parseBody(req);
      const result = await registerUser(body);
      return res.status(201).json({ success: true, ...result });
    }

    // 7. Verify Session (Who am I?)
    if (action === 'me') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const user = await verifySession(token);
      if (!user) {
        return res.status(401).json({ authenticated: false, error: 'Session expired or invalid.' });
      }
      return res.status(200).json({ authenticated: true, user });
    }

    // 8. Operator Profile (GET & PUT)
    if (action === 'profile') {
      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Session token required.' });
      }
      if (req.method === 'GET') {
        const profile = await getUserProfile(token);
        return res.status(200).json({ success: true, profile });
      }
      if (req.method === 'PUT') {
        const body = parseBody(req);
        const updated = await updateUserProfile(token, body);
        return res.status(200).json({ success: true, profile: updated });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 9. Change Password
    if (action === 'change-password') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const body = parseBody(req);
      const result = await changeUserPassword(token, body);
      return res.status(200).json(result);
    }

    // 10. Logout Session
    if (action === 'logout') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      await logoutSession(token);
      return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    }

    return res.status(404).json({ error: `Unknown auth action: ${action}` });
  } catch (err) {
    const statusCode = (action === 'login' || action === 'verify-2fa' || action === 'profile') ? 401 : 400;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};
