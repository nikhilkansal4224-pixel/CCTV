const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');
const { loginUser, verify2FA, resend2FACode, registerUser, authenticateWithGoogle, getUserProfile, updateUserProfile, changeUserPassword, verifySession, logoutSession, DEFAULT_ADMIN } = require('./api/_auth');

let localtunnel = null;
try {
  localtunnel = require('localtunnel');
} catch (e) { }

// Auto-load .env configuration file if present
require('./api/_env');

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'cctv_surveillance';

// MongoDB Client State
let mongoClient = null;
let db = null;
let eventsCollection = null;
let camerasCollection = null;
let mongoConnected = false;
let mongoError = null;

// Tunnel State (For connection across different Wi-Fi / cellular data worldwide)
let globalTunnel = null;
let tunnelUrl = null;
let tunnelType = null;
let tunnelPassword = null;

async function fetchPublicIp() {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ip || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function startLocaltunnel(port) {
  if (!localtunnel) return;
  fetchPublicIp().then(async (ip) => {
    tunnelPassword = ip;
    try {
      console.log('🌐 Launching Localtunnel fallback...');
      globalTunnel = await localtunnel({ port });
      tunnelUrl = globalTunnel.url;
      tunnelType = 'localtunnel';

      console.log(`\n======================================================`);
      console.log(`🚀 GLOBAL HTTPS CCTV LINK (ANY WI-FI / 4G / 5G):`);
      console.log(`> Mobile Link:    ${tunnelUrl}/camera.html`);
      if (tunnelPassword) {
        console.log(`> Tunnel Password: ${tunnelPassword} (if prompted on mobile)`);
      }
      console.log(`======================================================\n`);

      globalTunnel.on('close', () => {
        tunnelUrl = null;
        setTimeout(() => startLocaltunnel(port), 5000);
      });
    } catch (err) {
      console.warn('Localtunnel error:', err.message);
    }
  });
}

function startTunnel(port) {
  const cfBinary = path.join(__dirname, 'bin', 'cloudflared');
  if (fs.existsSync(cfBinary)) {
    try {
      console.log('🌐 Launching Cloudflare Global Tunnel (Zero Password, Any Wi-Fi)...');
      const cfProc = spawn(cfBinary, ['tunnel', '--url', `http://localhost:${port}`]);

      cfProc.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        const match = text.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/i);
        if (match && !tunnelUrl) {
          tunnelUrl = match[1];
          tunnelType = 'cloudflare';
          tunnelPassword = null;
          console.log(`\n======================================================`);
          console.log(`🚀 CLOUDFLARE GLOBAL CCTV LINK (ANY WI-FI / 4G / 5G):`);
          console.log(`> Mobile Link:    ${tunnelUrl}/camera.html`);
          console.log(`======================================================\n`);
        }
      });

      cfProc.on('error', (err) => {
        console.warn('Cloudflare error, falling back to localtunnel:', err.message);
        startLocaltunnel(port);
      });
      return;
    } catch (e) {
      startLocaltunnel(port);
    }
  } else {
    startLocaltunnel(port);
  }
}

async function connectToMongo() {
  try {
    mongoClient = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    eventsCollection = db.collection('events');
    camerasCollection = db.collection('cameras');
    mongoConnected = true;
    mongoError = null;
    console.log(`🍃 Connected to MongoDB: ${MONGO_URI}/${DB_NAME}`);
  } catch (err) {
    mongoConnected = false;
    mongoError = err.message;
    console.warn(`⚠️  MongoDB connection error (${MONGO_URI}):`, err.message);
    setTimeout(connectToMongo, 10000);
  }
}

connectToMongo();

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Bypass-Tunnel-Reminder');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Auth: Login (ID & Password, triggers 2-Step verification if enabled)
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const result = await loginUser(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...result }));
    } catch (err) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API Auth: 2-Step Authentication Verification (Passkey, Email PIN, Security Key)
  if (pathname === '/api/auth/verify-2fa' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const result = await verify2FA(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API Auth: Resend 2-Step Email Verification PIN
  if (pathname === '/api/auth/resend-code' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const result = await resend2FACode(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API Auth: Google Sign-In & Sign-Up
  if (pathname === '/api/auth/google' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const result = await authenticateWithGoogle(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API Auth: Google OAuth Client ID
  if (pathname === '/api/auth/google-client-id' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      clientId: process.env.GOOGLE_CLIENT_ID || '473264498286-5l7grtjn65fbm8jq57v141hefb185uum.apps.googleusercontent.com'
    }));
    return;
  }

  // API Auth: Register new operator
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const result = await registerUser(data);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...result }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API Auth: Session verification (Who am I?)
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const authHeader = req.headers['authorization'];
    const user = await verifySession(authHeader);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ authenticated: false, error: 'Session expired or invalid.' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ authenticated: true, user }));
    return;
  }

  // API Auth: Profile Details & 2-Step Auth Configuration (GET, PUT)
  if (pathname === '/api/auth/profile') {
    const authHeader = req.headers['authorization'];
    if (req.method === 'GET') {
      try {
        const profile = await getUserProfile(authHeader);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, profile }));
      } catch (err) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'PUT') {
      try {
        const data = await readJsonBody(req);
        const updated = await updateUserProfile(authHeader, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, profile: updated }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }
  }

  // API Auth: Change Password
  if (pathname === '/api/auth/change-password' && req.method === 'POST') {
    const authHeader = req.headers['authorization'];
    try {
      const data = await readJsonBody(req);
      const result = await changeUserPassword(authHeader, data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API Auth: Logout
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const authHeader = req.headers['authorization'];
    await logoutSession(authHeader);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Logged out successfully.' }));
    return;
  }

  // API 1: Network & Global Tunnel Info for mobile QR pairing
  if (pathname === '/api/network-ip') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const ips = getLocalIpAddresses();
    res.end(JSON.stringify({
      ips,
      primaryIp: ips[0] || 'localhost',
      port: server.address() ? server.address().port : PORT,
      tunnelUrl: tunnelUrl,
      tunnelType: tunnelType,
      tunnelPassword: tunnelPassword,
      hasTunnel: !!tunnelUrl,
      hostHeader: req.headers.host
    }));
    return;
  }

  // API 2: MongoDB Connection Status
  if (pathname === '/api/mongodb/status') {
    let count = 0;
    if (mongoConnected && eventsCollection) {
      try {
        count = await eventsCollection.countDocuments();
      } catch (e) { }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connected: mongoConnected,
      uri: MONGO_URI,
      database: DB_NAME,
      eventsCount: count,
      error: mongoError
    }));
    return;
  }

  // API 3: Events Endpoint (GET, POST, DELETE)
  if (pathname === '/api/events') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (!mongoConnected || !eventsCollection) {
        res.end(JSON.stringify({ events: [], connected: false }));
        return;
      }
      try {
        const events = await eventsCollection.find({})
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray();
        res.end(JSON.stringify({ events, connected: true }));
      } catch (err) {
        res.end(JSON.stringify({ events: [], error: err.message, connected: false }));
      }
      return;
    }

    if (req.method === 'POST') {
      try {
        const data = await readJsonBody(req);
        const eventDoc = {
          type: data.type || 'MOTION_DETECTED',
          camLabel: data.camLabel || 'Camera 01',
          count: Number(data.count || 0),
          confidence: Number(data.confidence || 0),
          motionIntensity: Number(data.motionIntensity || 0),
          timestamp: data.timestamp || new Date().toLocaleTimeString(),
          snapshot: data.snapshot || '',
          createdAt: new Date()
        };

        if (mongoConnected && eventsCollection) {
          const result = await eventsCollection.insertOne(eventDoc);
          eventDoc._id = result.insertedId;
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event: eventDoc, mongoSaved: mongoConnected }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'DELETE') {
      if (mongoConnected && eventsCollection) {
        await eventsCollection.deleteMany({});
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'All CCTV events cleared' }));
      return;
    }
  }

  // API 4: Register Camera Node in MongoDB
  if (pathname === '/api/cameras/register' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const camDoc = {
        camId: data.camId,
        camName: data.camName || 'Remote Camera',
        type: data.type || 'mobile',
        battery: data.battery || null,
        facingMode: data.facingMode || 'environment',
        userAgent: req.headers['user-agent'] || '',
        lastSeen: new Date()
      };

      if (mongoConnected && camerasCollection) {
        await camerasCollection.updateOne(
          { camId: camDoc.camId },
          { $set: camDoc },
          { upsert: true }
        );
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, registered: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Static File resolution
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!path.extname(filePath)) {
        const withHtml = filePath + '.html';
        if (fs.existsSync(withHtml)) {
          filePath = withHtml;
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function startServer(port) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const ips = getLocalIpAddresses();
    console.log(`\n======================================================`);
    console.log(`👁️  ARGUS SURREAL CCTV SERVER RUNNING`);
    console.log(`🍃  MONGODB: ${MONGO_URI}/${DB_NAME}`);
    console.log(`======================================================`);
    console.log(`> Local Hub:      http://localhost:${port}`);
    ips.forEach(ip => {
      console.log(`> Local Mobile:   http://${ip}:${port}/camera.html`);
    });
    console.log(`======================================================\n`);

    // Start Global Public HTTPS Tunnel for cross-Wi-Fi and mobile cellular connections
    startTunnel(port);
  });
}

startServer(PORT);
