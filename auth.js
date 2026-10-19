// SENTINEL // Authentication & User Management Engine
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_FILE = path.join(DATA_DIR, 'auth_secret.key');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignored on read-only environments (e.g. Vercel serverless)
}

let inMemorySecret = null;
// Ensure persistent HMAC secret key
function getSecretKey() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }
  if (inMemorySecret) {
    return inMemorySecret;
  }
  try {
    if (fs.existsSync(SECRET_FILE)) {
      return fs.readFileSync(SECRET_FILE, 'utf8').trim();
    }
  } catch (e) {}

  const secret = crypto.randomBytes(32).toString('hex');
  inMemorySecret = secret;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SECRET_FILE, secret, 'utf8');
  } catch (e) {
    // Read-only filesystem
  }
  return secret;
}

const SECRET_KEY = getSecretKey();

// Password hashing using PBKDF2 (SHA-512 with 10,000 iterations)
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, storedHash, salt) {
  const { hash } = hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (hashBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, storedBuffer);
}

const db = require('./db');

// Connect to MongoDB asynchronously
db.connectDB().catch(err => {
  console.warn('[Auth] Database connection notice:', err.message);
});

// Seed default users file if needed
function initDefaultUsersFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const defaultSalt = crypto.randomBytes(16).toString('hex');
      const { hash } = hashPassword('password123', defaultSalt);
      const defaultUsers = [
        {
          id: 'user_admin',
          username: 'admin',
          hash,
          salt: defaultSalt,
          role: 'Chief Security Operator',
          displayName: 'Administrator',
          createdAt: new Date().toISOString(),
        },
      ];
      try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf8');
      } catch (e) {}
      return defaultUsers;
    }
  } catch (err) {
    // Read-only filesystem fallback
  }
}
initDefaultUsersFile();

// Users Database Management (Synchronous fallback for non-async callers)
function loadUsers() {
  initDefaultUsersFile();
  try {
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse users.json, recreating empty store:', err);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// User Authentication (MongoDB + local fallback)
async function authenticate(username, password) {
  if (!username || !password) return null;
  const user = await db.findUserByUsername(username);
  if (!user) return null;

  if (verifyPassword(password, user.hash, user.salt)) {
    const rawId = user.id || 'admin';
    const fallbackUserId = 'USR-' + rawId.replace('user_', '').substring(0, 8).toUpperCase();
    const formattedUserId = user.userId || fallbackUserId;

    // Update lastLoginAt and ensure userId is stored in MongoDB
    db.updateUser(user.username, {
      userId: formattedUserId,
      lastLoginAt: new Date().toISOString(),
    }).catch(() => {});

    return {
      id: user.id,
      userId: formattedUserId,
      username: user.username,
      role: user.role,
      displayName: user.displayName || user.username,
      activeSessionId: user.activeSessionId || null,
    };
  }
  return null;
}

// Register New Operator (MongoDB + local fallback)
async function register(username, password, role = 'Security Operator', displayName = '') {
  if (!username || username.trim().length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const cleanUsername = username.trim().toLowerCase();
  const existingUser = await db.findUserByUsername(cleanUsername);
  if (existingUser) {
    throw new Error('Username is already taken');
  }

  const { hash, salt } = hashPassword(password);
  const hexCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  const newUser = {
    id: `user_${hexCode.toLowerCase()}`,
    userId: `USR-${hexCode}`,
    username: username.trim(),
    hash,
    salt,
    role: role || 'Security Operator',
    displayName: displayName.trim() || username.trim(),
    activeSessionId: null,
    createdAt: new Date().toISOString(),
  };

  await db.insertUser(newUser);

  return {
    id: newUser.id,
    userId: newUser.userId,
    username: newUser.username,
    role: newUser.role,
    displayName: newUser.displayName,
    activeSessionId: null,
  };
}

// Token generation & verification (Base64url JSON + HMAC-SHA256 signature)
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

function generateToken(user, expiresInMs = 7 * 24 * 60 * 60 * 1000) { // 7 days
  const rawId = user.id || 'admin';
  const fallbackUserId = 'USR-' + rawId.replace('user_', '').substring(0, 8).toUpperCase();
  const formattedUserId = user.userId || fallbackUserId;

  const payload = {
    sub: user.id,
    userId: formattedUserId,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    activeSessionId: user.activeSessionId || null,
    exp: Date.now() + expiresInMs,
  };

  const headerStr = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerStr}.${payloadStr}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(dataToSign).digest('base64url');

  return `${dataToSign}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerStr, payloadStr, signature] = parts;
  const dataToSign = `${headerStr}.${payloadStr}`;
  const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(dataToSign).digest('base64url');

  if (signature !== expectedSignature) {
    return null; // Invalid signature
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadStr));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Extract token from Request (Cookie or Authorization Bearer)
function getTokenFromReq(req) {
  if (req.cookies && req.cookies.sentinel_token) {
    return req.cookies.sentinel_token;
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

// Authentication Middleware
function requireAuth(req, res, next) {
  const token = getTokenFromReq(req);
  const user = verifyToken(token);

  if (user) {
    req.user = user;
    return next();
  }

  // If API request, return 401 Unauthorized
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.', redirect: '/login.html' });
  }

  // If HTML document request, redirect to login page
  const returnTo = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/login.html?returnTo=${returnTo}`);
}

// Optional Auth (attaches user if valid token exists, but doesn't block)
function optionalAuth(req, res, next) {
  const token = getTokenFromReq(req);
  const user = verifyToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

module.exports = {
  authenticate,
  register,
  generateToken,
  verifyToken,
  getTokenFromReq,
  requireAuth,
  optionalAuth,
  loadUsers,
};
