const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const os = require('os');
const express = require('express');
const cookieParser = require('cookie-parser');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');
const selfsigned = require('selfsigned');
const auth = require('./auth');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Public directory resolution supporting Vercel serverless bundles and local development
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Protected Host Dashboard Route (requires authentication)
app.get(['/', '/index.html'], auth.requireAuth, (req, res) => {
  const primaryPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(primaryPath)) {
    return res.sendFile(primaryPath);
  }
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve public static assets (login.html, camera.html, css, js)
app.use(express.static(PUBLIC_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Port configuration
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Auto-generate or load SSL certificate for HTTPS
const SSL_DIR = path.join(__dirname, 'ssl');
const KEY_PATH = path.join(SSL_DIR, 'server.key');
const CERT_PATH = path.join(SSL_DIR, 'server.crt');

function getLocalIp(req) {
  if (req && req.query && req.query.host) {
    return req.query.host;
  }
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip internal (127.0.0.1) and non-ipv4 addresses
      if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function getAllIps() {
  const ips = ['localhost'];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
        if (!ips.includes(net.address)) {
          ips.push(net.address);
        }
      }
    }
  }
  return ips;
}

async function getOrGenerateCert() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    return {
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH),
    };
  }

  console.log('[Security] Generating self-signed TLS certificates for secure mobile camera access...');
  const localIp = getLocalIp();
  const attrs = [{ name: 'commonName', value: localIp }];
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
    { type: 7, ip: localIp },
  ];

  const pems = await selfsigned.generate(attrs, {
    days: 365,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames }],
  });

  if (!fs.existsSync(SSL_DIR)) {
    fs.mkdirSync(SSL_DIR, { recursive: true });
  }

  fs.writeFileSync(KEY_PATH, pems.private);
  fs.writeFileSync(CERT_PATH, pems.cert);
  return { key: pems.private, cert: pems.cert };
}

// In-Memory Session Storage
// sessionId -> { id, createdAt, expiresAt, status: 'waiting'|'active'|'ended', hostWs, sleepTimer, cameras: Map<deviceId, { deviceId, deviceName, ws, status, joinedAt, sleepTimer }> }
const sessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours max session lifetime (no forced 10-minute cutoff)

function createSession() {
  const id = crypto.randomBytes(6).toString('hex'); // 12-char hex ID
  const now = Date.now();
  const session = {
    id,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    status: 'waiting',
    hostWs: null,
    sleepTimer: { active: false, expiresAt: null, durationMinutes: null },
    cameras: new Map(), // Map<deviceId, { deviceId, deviceName, ws, status, joinedAt, facingMode, resolution, sleepTimer }>
  };
  sessions.set(id, session);
  return session;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    // 1. Check Individual Device Sleep Timers
    if (session.cameras) {
      for (const [devId, cam] of session.cameras.entries()) {
        if (cam.sleepTimer && cam.sleepTimer.active && cam.sleepTimer.expiresAt && cam.sleepTimer.expiresAt <= now) {
          console.log(`[SleepTimer] Device ${devId} sleep timer expired. Disconnecting device.`);
          const sleepNotice = JSON.stringify({
            type: 'device-sleep',
            sessionId: id,
            deviceId: devId,
            reason: 'Individual sleep timer reached',
          });
          if (cam.ws && cam.ws.readyState === 1) {
            cam.ws.send(sleepNotice);
            cam.ws.close();
          }
          session.cameras.delete(devId);
          if (session.cameras.size === 0) {
            session.status = 'waiting';
          }
          if (session.hostWs && session.hostWs.readyState === 1) {
            session.hostWs.send(JSON.stringify({
              type: 'camera-disconnected',
              sessionId: id,
              deviceId: devId,
              reason: 'Sleep timer reached',
              totalCameras: session.cameras.size,
            }));
          }
        }
      }
    }

    // 2. Check Master / Global Sleep Timer (All Cameras at once)
    if (session.sleepTimer && session.sleepTimer.active && session.sleepTimer.expiresAt && session.sleepTimer.expiresAt <= now) {
      console.log(`[SleepTimer] Master sleep timer expired for session ${id}. Putting all cameras to sleep.`);
      session.sleepTimer.active = false;
      const allSleepNotice = JSON.stringify({
        type: 'all-sleep',
        sessionId: id,
        reason: 'Master sleep timer reached',
      });

      if (session.hostWs && session.hostWs.readyState === 1) {
        session.hostWs.send(allSleepNotice);
      }
      if (session.cameras) {
        for (const [devId, cam] of session.cameras.entries()) {
          if (cam.ws && cam.ws.readyState === 1) {
            cam.ws.send(allSleepNotice);
            cam.ws.close();
          }
        }
        session.cameras.clear();
      }
      session.status = 'waiting';
    }

    // 3. Stale session cleanup (only if ended or past 24-hour lifetime)
    if (session.status === 'ended' || (session.expiresAt && session.expiresAt <= now)) {
      const expiredMsg = JSON.stringify({ type: 'session-expired', sessionId: id });
      if (session.hostWs && session.hostWs.readyState === 1) {
        session.hostWs.send(expiredMsg);
        session.hostWs.close();
      }
      if (session.cameras) {
        for (const cam of session.cameras.values()) {
          if (cam.ws && cam.ws.readyState === 1) {
            cam.ws.send(expiredMsg);
            cam.ws.close();
          }
        }
      }
      sessions.delete(id);
    }
  }
}

function buildBaseUrl(req, hostParam, protocolParam) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = forwardedHost || req.headers.host || '';
  const isVercel = Boolean(process.env.VERCEL || hostHeader.includes('vercel.app'));
  const proto = protocolParam || req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');

  const targetHost = hostParam || req.query.host;

  if (targetHost) {
    if (targetHost.includes(':') || targetHost.includes('vercel.app') || (isVercel && !targetHost.match(/^\d+\.\d+\.\d+\.\d+$/) && targetHost !== 'localhost')) {
      return `${proto}://${targetHost}`;
    }
    const port = proto === 'https' ? HTTPS_PORT : HTTP_PORT;
    return `${proto}://${targetHost}:${port}`;
  }

  if (isVercel || (hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1') && !/^\d+\.\d+\.\d+\.\d+/.test(hostHeader))) {
    return `${proto}://${hostHeader}`;
  }

  const host = getLocalIp(req);
  const port = proto === 'https' ? HTTPS_PORT : HTTP_PORT;
  return `${proto}://${host}:${port}`;
}

// Serverless-friendly cleanup invocation
if (!process.env.VERCEL) {
  setInterval(cleanupSessions, 1000); // 1-second cadence for responsive sleep timers
}

app.use((req, res, next) => {
  if (process.env.VERCEL) {
    cleanupSessions();
  }
  next();
});

// --- Authentication Endpoints ---

// Operator Login (MongoDB + Local Fallback)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, remember } = req.body;
    const user = await auth.authenticate(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid operator credentials' });
    }

    // 7 days if remember, otherwise 24 hours
    const maxAge = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const token = auth.generateToken(user, maxAge);

    res.cookie('sentinel_token', token, {
      httpOnly: true,
      secure: req.secure || req.protocol === 'https',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    res.json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Authentication processing error' });
  }
});

// Operator Registration (MongoDB + Local Fallback)
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role, displayName } = req.body;
  try {
    const user = await auth.register(username, password, role, displayName);
    const maxAge = 24 * 60 * 60 * 1000;
    const token = auth.generateToken(user, maxAge);

    res.cookie('sentinel_token', token, {
      httpOnly: true,
      secure: req.secure || req.protocol === 'https',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Database & Persistence Health Status
app.get('/api/db/status', (req, res) => {
  res.json(require('./db').getStatus());
});

// Operator Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('sentinel_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

// Current Authenticated Operator Info
app.get('/api/auth/me', auth.optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.status(401).json({ authenticated: false, user: null });
  }
});

// --- REST Endpoints ---

// Get network information (local IP, all available IPs, ports, URLs)
app.get('/api/network-info', (req, res) => {
  const localIp = getLocalIp(req);
  const allIps = getAllIps();
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = forwardedHost || req.get('host') || 'localhost';
  const isVercel = Boolean(process.env.VERCEL || hostHeader.includes('vercel.app'));
  const isHttps = req.secure || req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https';

  const httpUrl = isVercel ? `https://${hostHeader}` : `http://${localIp}:${HTTP_PORT}`;
  const httpsUrl = isVercel ? `https://${hostHeader}` : `https://${localIp}:${HTTPS_PORT}`;

  res.json({
    localIp,
    allIps,
    httpPort: HTTP_PORT,
    httpsPort: HTTPS_PORT,
    currentHost: hostHeader,
    currentProtocol: isHttps ? 'https' : 'http',
    httpUrl,
    httpsUrl,
    isVercel,
  });
});

// Create new temporary session (requires authenticated operator)
app.post('/api/sessions/create', auth.requireAuth, (req, res) => {
  const session = createSession();
  session.operator = req.user.username;
  const baseUrl = buildBaseUrl(req, req.query.host, req.query.protocol);
  const cameraUrl = `${baseUrl}/camera.html?session=${session.id}`;
  const preferProtocol = req.query.protocol || (req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http');

  res.json({
    sessionId: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    ttlSeconds: Math.floor(SESSION_TTL_MS / 1000),
    cameraUrl,
    status: session.status,
    host: req.query.host || getLocalIp(req),
    protocol: preferProtocol,
    operator: req.user.username,
  });
});

// Get session details
app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  const now = Date.now();
  if (session.expiresAt <= now) {
    session.status = 'ended';
    return res.status(410).json({ error: 'Session expired' });
  }

  const cameraList = session.cameras ? Array.from(session.cameras.values()).map(c => ({
    deviceId: c.deviceId,
    deviceName: c.deviceName,
    status: c.status,
    sleepTimer: c.sleepTimer || { active: false, expiresAt: null, durationMinutes: null },
  })) : [];

  const sleepRemaining = (session.sleepTimer && session.sleepTimer.active && session.sleepTimer.expiresAt)
    ? Math.max(0, Math.floor((session.sleepTimer.expiresAt - now) / 1000))
    : null;

  res.json({
    sessionId: session.id,
    status: session.status,
    expiresAt: session.expiresAt,
    remainingSeconds: sleepRemaining !== null ? sleepRemaining : Math.max(0, Math.floor((session.expiresAt - now) / 1000)),
    sleepTimer: session.sleepTimer || { active: false, expiresAt: null, durationMinutes: null },
    cameraCount: cameraList.length,
    isPaired: cameraList.length > 0,
    cameras: cameraList,
  });
});

// Render QR code image as DataURL or SVG
app.get('/api/sessions/:id/qr', async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).send('Session expired or not found');
  }

  const baseUrl = buildBaseUrl(req, req.query.host, req.query.protocol);
  const cameraUrl = `${baseUrl}/camera.html?session=${session.id}`;

  try {
    const qrSvg = await QRCode.toString(cameraUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#09090b',
      },
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(qrSvg);
  } catch (err) {
    res.status(500).send('Error generating QR code');
  }
});

// Explicitly terminate session
app.post('/api/sessions/:id/end', (req, res) => {
  const session = sessions.get(req.params.id);
  if (session) {
    session.status = 'ended';
    const terminateMsg = JSON.stringify({ type: 'session-ended', sessionId: session.id, reason: 'Session ended by operator' });
    if (session.hostWs && session.hostWs.readyState === 1) {
      session.hostWs.send(terminateMsg);
    }
    if (session.cameras) {
      for (const cam of session.cameras.values()) {
        if (cam.ws && cam.ws.readyState === 1) {
          cam.ws.send(terminateMsg);
        }
      }
    }
    sessions.delete(session.id);
  }
  res.json({ success: true, message: 'Session terminated' });
});

// Explicitly disconnect a single camera device (keeps session and other cameras alive)
app.post('/api/sessions/:id/cameras/:deviceId/end', (req, res) => {
  const session = sessions.get(req.params.id);
  if (session && session.cameras && session.cameras.has(req.params.deviceId)) {
    const cam = session.cameras.get(req.params.deviceId);
    if (cam.ws && cam.ws.readyState === 1) {
      cam.ws.send(JSON.stringify({
        type: 'device-kicked',
        sessionId: session.id,
        deviceId: req.params.deviceId,
        reason: 'Device ended connection',
      }));
      cam.ws.close();
    }
    session.cameras.delete(req.params.deviceId);
    if (session.cameras.size === 0) {
      session.status = 'waiting';
    }
    if (session.hostWs && session.hostWs.readyState === 1) {
      session.hostWs.send(JSON.stringify({
        type: 'camera-disconnected',
        sessionId: session.id,
        deviceId: req.params.deviceId,
        totalCameras: session.cameras.size,
      }));
    }
  }
  res.json({ success: true, message: 'Device disconnected' });
});

// --- Serverless / Vercel HTTP Signaling Endpoints (Fallback when WebSocket unavailable) ---
app.post('/api/signaling/send', (req, res) => {
  const { sessionId, target, sender, message } = req.body;
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!session.signalingMessages) {
    session.signalingMessages = [];
  }

  const packet = {
    id: crypto.randomBytes(4).toString('hex'),
    target, // 'host' | 'camera' | 'all' | deviceId
    sender,
    message,
    timestamp: Date.now(),
  };

  session.signalingMessages.push(packet);
  if (session.signalingMessages.length > 100) {
    session.signalingMessages.shift();
  }

  // Also forward to WebSocket if open
  if (target === 'host' && session.hostWs && session.hostWs.readyState === 1) {
    session.hostWs.send(JSON.stringify(message));
  } else if (session.cameras && session.cameras.has(target)) {
    const cam = session.cameras.get(target);
    if (cam.ws && cam.ws.readyState === 1) {
      cam.ws.send(JSON.stringify(message));
    }
  }

  res.json({ success: true, messageId: packet.id });
});

app.get('/api/signaling/poll', (req, res) => {
  const { sessionId, role, deviceId, since } = req.query;
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found', messages: [] });
  }

  const sinceTime = parseInt(since, 10) || 0;
  const msgs = (session.signalingMessages || []).filter(m => {
    if (m.timestamp <= sinceTime) return false;
    if (role === 'host') {
      return m.target === 'host' || m.target === 'all';
    } else if (role === 'camera') {
      return m.target === 'all' || m.target === 'camera' || m.target === deviceId;
    }
    return false;
  });

  res.json({
    messages: msgs.map(m => m.message),
    lastTimestamp: msgs.length > 0 ? msgs[msgs.length - 1].timestamp : sinceTime,
  });
});

// Extend active session duration (+10 minutes)
app.post('/api/sessions/:id/extend', auth.optionalAuth, (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session || session.status === 'ended') {
    return res.status(404).json({ error: 'Session not found or already ended' });
  }

  const additionalMs = 10 * 60 * 1000;
  session.expiresAt = Math.max(Date.now(), session.expiresAt) + additionalMs;

  const extendNotice = JSON.stringify({
    type: 'session-extended',
    sessionId: session.id,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.floor((session.expiresAt - Date.now()) / 1000),
  });

  if (session.hostWs && session.hostWs.readyState === 1) {
    session.hostWs.send(extendNotice);
  }
  if (session.cameras) {
    for (const cam of session.cameras.values()) {
      if (cam.ws && cam.ws.readyState === 1) {
        cam.ws.send(extendNotice);
      }
    }
  }

  res.json({
    success: true,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.floor((session.expiresAt - Date.now()) / 1000),
  });
});

// Configure Sleep Timer:
// target: 'all' (Master Sleep Timer) or specific deviceId (e.g. 'CAM-XXXX')
// minutes: 0 / null (turn off) or positive number (e.g. 5, 15, 30, 60, 120)
app.post('/api/sessions/:id/sleep-timer', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session || session.status === 'ended') {
    return res.status(404).json({ error: 'Session not found or already ended' });
  }

  const { target, minutes } = req.body;
  const now = Date.now();
  const numMinutes = (minutes !== null && minutes !== undefined && !isNaN(minutes) && Number(minutes) > 0)
    ? Number(minutes)
    : null;
  const active = numMinutes !== null;
  const expiresAt = active ? now + numMinutes * 60 * 1000 : null;

  if (!target || target === 'all') {
    // Configure Master Sleep Timer for entire session / all cameras
    session.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };

    // Also update all currently connected cameras to sync with master timer
    if (session.cameras) {
      for (const cam of session.cameras.values()) {
        cam.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };
      }
    }

    const updateNotice = JSON.stringify({
      type: 'sleep-timer-updated',
      sessionId: session.id,
      target: 'all',
      sleepTimer: session.sleepTimer,
      remainingSeconds: active ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null,
    });

    if (session.hostWs && session.hostWs.readyState === 1) {
      session.hostWs.send(updateNotice);
    }
    if (session.cameras) {
      for (const cam of session.cameras.values()) {
        if (cam.ws && cam.ws.readyState === 1) {
          cam.ws.send(updateNotice);
        }
      }
    }

    return res.json({
      success: true,
      target: 'all',
      sleepTimer: session.sleepTimer,
      remainingSeconds: active ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null,
    });
  } else {
    // Configure Individual Sleep Timer for specific deviceId
    const deviceId = target;
    if (session.cameras && session.cameras.has(deviceId)) {
      const cam = session.cameras.get(deviceId);
      cam.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };

      const updateNotice = JSON.stringify({
        type: 'sleep-timer-updated',
        sessionId: session.id,
        target: deviceId,
        deviceId,
        sleepTimer: cam.sleepTimer,
        remainingSeconds: active ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null,
      });

      if (session.hostWs && session.hostWs.readyState === 1) {
        session.hostWs.send(updateNotice);
      }
      if (cam.ws && cam.ws.readyState === 1) {
        cam.ws.send(updateNotice);
      }

      return res.json({
        success: true,
        target: deviceId,
        deviceId,
        sleepTimer: cam.sleepTimer,
        remainingSeconds: active ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null,
      });
    } else {
      return res.status(404).json({ error: `Device ${deviceId} not found in this session` });
    }
  }
});

async function start() {
  const sslCredentials = await getOrGenerateCert();

  const httpServer = http.createServer(app);
  const httpsServer = https.createServer(sslCredentials, app);

  // Unified WebSocket server attached to both HTTP and HTTPS
  const wss = new WebSocketServer({ noServer: true });

  function handleUpgrade(request, socket, head) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }

  httpServer.on('upgrade', handleUpgrade);
  httpsServer.on('upgrade', handleUpgrade);

  // --- WebSocket Signaling Protocol ---
  wss.on('connection', (ws, req) => {
    let boundSessionId = null;
    let boundRole = null;
    let boundDeviceId = null;

    ws.on('message', (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (e) {
        return ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON message' }));
      }

      const { type, sessionId } = data;

      if (type === 'join') {
        const { role } = data;
        const session = sessions.get(sessionId);
        if (!session) {
          return ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired session ID' }));
        }
        if (session.status === 'ended') {
          return ws.send(JSON.stringify({ type: 'error', message: 'Session has already ended' }));
        }

        boundSessionId = sessionId;
        boundRole = role;

        if (role === 'host') {
          session.hostWs = ws;
          const cameraList = Array.from(session.cameras.values()).map(c => ({
            deviceId: c.deviceId,
            deviceName: c.deviceName,
            status: c.status,
            sleepTimer: c.sleepTimer || { active: false, expiresAt: null, durationMinutes: null },
          }));
          ws.send(JSON.stringify({
            type: 'joined',
            role: 'host',
            sessionId,
            status: session.status,
            totalCameras: session.cameras.size,
            cameras: cameraList,
            hasCamera: session.cameras.size > 0,
            sleepTimer: session.sleepTimer || { active: false, expiresAt: null, durationMinutes: null },
          }));
        } else if (role === 'camera') {
          // Unique device ID for each camera
          const deviceId = data.deviceId || `CAM-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
          const deviceName = data.deviceName || `Camera ${session.cameras.size + 1}`;

          // If reconnecting with same deviceId, close existing socket
          if (session.cameras.has(deviceId)) {
            const existing = session.cameras.get(deviceId);
            if (existing.ws && existing.ws !== ws && existing.ws.readyState === 1) {
              try { existing.ws.close(); } catch (e) {}
            }
          }

          boundDeviceId = deviceId;
          const camSleepTimer = session.sleepTimer && session.sleepTimer.active ? { ...session.sleepTimer } : { active: false, expiresAt: null, durationMinutes: null };
          session.cameras.set(deviceId, {
            deviceId,
            deviceName,
            ws,
            status: 'paired',
            joinedAt: Date.now(),
            sleepTimer: camSleepTimer,
          });
          session.status = 'active';

          ws.send(JSON.stringify({
            type: 'joined',
            role: 'camera',
            sessionId,
            deviceId,
            deviceName,
            status: 'paired',
            totalCameras: session.cameras.size,
            sleepTimer: camSleepTimer,
          }));

          // Notify the host monitor that a camera scanned and joined
          if (session.hostWs && session.hostWs.readyState === 1) {
            session.hostWs.send(JSON.stringify({
              type: 'camera-joined',
              sessionId,
              deviceId,
              deviceName,
              totalCameras: session.cameras.size,
              timestamp: Date.now(),
              sleepTimer: camSleepTimer,
            }));
          }
        }
        return;
      }

      // All subsequent signaling messages require an active session
      const currentSession = sessions.get(boundSessionId || sessionId);
      if (!currentSession) {
        return ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
      }

      // Camera user explicitly allowed and activated camera
      if (type === 'camera-ready') {
        const deviceId = boundDeviceId || data.deviceId;
        if (deviceId && currentSession.cameras.has(deviceId)) {
          const cam = currentSession.cameras.get(deviceId);
          cam.status = 'streaming';
          cam.facingMode = data.facingMode;
          cam.resolution = data.resolution;
        }

        if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
          currentSession.hostWs.send(JSON.stringify({
            type: 'camera-ready',
            sessionId: currentSession.id,
            deviceId: deviceId,
            deviceName: currentSession.cameras.get(deviceId)?.deviceName || 'Camera',
            facingMode: data.facingMode,
            resolution: data.resolution,
            hasAudio: data.hasAudio,
          }));
        }
        return;
      }

      // WebRTC Offer from Camera to Host
      if (type === 'offer') {
        const deviceId = boundDeviceId || data.deviceId || (currentSession.cameras.keys().next().value);
        if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
          currentSession.hostWs.send(JSON.stringify({
            type: 'offer',
            sessionId: currentSession.id,
            deviceId,
            sdp: data.sdp,
          }));
        }
        return;
      }

      // WebRTC Answer from Host to specific Camera
      if (type === 'answer') {
        let targetCam = null;
        if (data.deviceId && currentSession.cameras.has(data.deviceId)) {
          targetCam = currentSession.cameras.get(data.deviceId);
        } else if (currentSession.cameras.size === 1) {
          targetCam = currentSession.cameras.values().next().value;
        }

        if (targetCam && targetCam.ws && targetCam.ws.readyState === 1) {
          targetCam.ws.send(JSON.stringify({
            type: 'answer',
            sessionId: currentSession.id,
            deviceId: targetCam.deviceId,
            sdp: data.sdp,
          }));
        }
        return;
      }

      // ICE Candidate Relay between peers
      if (type === 'ice-candidate') {
        if (boundRole === 'camera') {
          // Camera sending candidate to Host
          const deviceId = boundDeviceId || data.deviceId;
          if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
            currentSession.hostWs.send(JSON.stringify({
              type: 'ice-candidate',
              sessionId: currentSession.id,
              deviceId,
              candidate: data.candidate,
            }));
          }
        } else {
          // Host sending candidate to specific Camera
          let targetCam = null;
          if (data.deviceId && currentSession.cameras.has(data.deviceId)) {
            targetCam = currentSession.cameras.get(data.deviceId);
          } else if (currentSession.cameras.size === 1) {
            targetCam = currentSession.cameras.values().next().value;
          }

          if (targetCam && targetCam.ws && targetCam.ws.readyState === 1) {
            targetCam.ws.send(JSON.stringify({
              type: 'ice-candidate',
              sessionId: currentSession.id,
              deviceId: targetCam.deviceId,
              candidate: data.candidate,
            }));
          }
        }
        return;
      }

      // Stream Stats telemetry
      if (type === 'telemetry') {
        const deviceId = boundDeviceId || data.deviceId;
        if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
          currentSession.hostWs.send(JSON.stringify({
            type: 'telemetry',
            sessionId: currentSession.id,
            deviceId,
            stats: data.stats,
          }));
        }
        return;
      }

      // Disconnect a specific camera device (initiated by Host)
      if (type === 'disconnect-device') {
        const deviceId = data.deviceId;
        if (deviceId && currentSession.cameras.has(deviceId)) {
          const cam = currentSession.cameras.get(deviceId);
          if (cam.ws && cam.ws.readyState === 1) {
            cam.ws.send(JSON.stringify({
              type: 'device-kicked',
              sessionId: currentSession.id,
              deviceId,
              reason: data.reason || 'Disconnected by host operator',
            }));
            cam.ws.close();
          }
          currentSession.cameras.delete(deviceId);
          if (currentSession.cameras.size === 0) {
            currentSession.status = 'waiting';
          }
          if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
            currentSession.hostWs.send(JSON.stringify({
              type: 'camera-disconnected',
              sessionId: currentSession.id,
              deviceId,
              totalCameras: currentSession.cameras.size,
            }));
          }
        }
        return;
      }

      // Voluntary leave from camera device (e.g. clicking red cross on camera device)
      if (type === 'leave-device' || (type === 'end-session' && boundRole === 'camera')) {
        const deviceId = boundDeviceId || data.deviceId;
        if (deviceId && currentSession.cameras.has(deviceId)) {
          currentSession.cameras.delete(deviceId);
          if (currentSession.cameras.size === 0) {
            currentSession.status = 'waiting';
          }
          if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
            currentSession.hostWs.send(JSON.stringify({
              type: 'camera-disconnected',
              sessionId: currentSession.id,
              deviceId,
              totalCameras: currentSession.cameras.size,
              reason: data.reason || 'Camera device disconnected',
            }));
          }
        }
        return;
      }

      // Configure Sleep Timer via WebSocket (target: 'all' or deviceId)
      if (type === 'set-sleep-timer') {
        const { target, minutes } = data;
        const now = Date.now();
        const numMinutes = (minutes !== null && minutes !== undefined && !isNaN(minutes) && Number(minutes) > 0)
          ? Number(minutes)
          : null;
        const active = numMinutes !== null;
        const expiresAt = active ? now + numMinutes * 60 * 1000 : null;

        if (!target || target === 'all') {
          currentSession.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };
          if (currentSession.cameras) {
            for (const cam of currentSession.cameras.values()) {
              cam.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };
            }
          }
          const updateNotice = JSON.stringify({
            type: 'sleep-timer-updated',
            sessionId: currentSession.id,
            target: 'all',
            sleepTimer: currentSession.sleepTimer,
            remainingSeconds: active ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null,
          });
          if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
            currentSession.hostWs.send(updateNotice);
          }
          if (currentSession.cameras) {
            for (const cam of currentSession.cameras.values()) {
              if (cam.ws && cam.ws.readyState === 1) {
                cam.ws.send(updateNotice);
              }
            }
          }
        } else {
          const devId = target;
          if (currentSession.cameras && currentSession.cameras.has(devId)) {
            const cam = currentSession.cameras.get(devId);
            cam.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };
            const updateNotice = JSON.stringify({
              type: 'sleep-timer-updated',
              sessionId: currentSession.id,
              target: devId,
              deviceId: devId,
              sleepTimer: cam.sleepTimer,
              remainingSeconds: active ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null,
            });
            if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
              currentSession.hostWs.send(updateNotice);
            }
            if (cam.ws && cam.ws.readyState === 1) {
              cam.ws.send(updateNotice);
            }
          }
        }
        return;
      }

      // Explicit End Entire Session request (Host operator terminates session for all devices)
      if (type === 'end-session') {
        currentSession.status = 'ended';
        const endNotice = JSON.stringify({
          type: 'session-ended',
          sessionId: currentSession.id,
          reason: data.reason || 'Session ended by host operator',
        });
        if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
          currentSession.hostWs.send(endNotice);
        }
        for (const cam of currentSession.cameras.values()) {
          if (cam.ws && cam.ws.readyState === 1) {
            cam.ws.send(endNotice);
          }
        }
        sessions.delete(currentSession.id);
        return;
      }

      // Ping / Pong Keepalive & Latency calculation
      if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', clientTime: data.clientTime, serverTime: Date.now() }));
        return;
      }
    });

    ws.on('close', () => {
      if (boundSessionId) {
        const session = sessions.get(boundSessionId);
        if (session) {
          if (boundRole === 'camera' && boundDeviceId) {
            session.cameras.delete(boundDeviceId);
            if (session.cameras.size === 0) {
              session.status = 'waiting';
            }
            if (session.hostWs && session.hostWs.readyState === 1) {
              session.hostWs.send(JSON.stringify({
                type: 'camera-disconnected',
                sessionId: boundSessionId,
                deviceId: boundDeviceId,
                totalCameras: session.cameras.size,
              }));
            }
          } else if (boundRole === 'host' && session.hostWs === ws) {
            session.hostWs = null;
            const hostDisconNotice = JSON.stringify({
              type: 'host-disconnected',
              sessionId: boundSessionId,
            });
            for (const cam of session.cameras.values()) {
              if (cam.ws && cam.ws.readyState === 1) {
                cam.ws.send(hostDisconNotice);
              }
            }
          }
        }
      }
    });
  });

  // Start Servers
  httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`\n======================================================`);
    console.log(`  SENTINEL // QR-Based Camera Access System`);
    console.log(`======================================================`);
    console.log(`  [HTTP Server]  http://localhost:${HTTP_PORT}`);
    console.log(`  [LAN Access]   http://${localIp}:${HTTP_PORT}`);
    console.log(`------------------------------------------------------`);
  });

  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`  [HTTPS Server] https://localhost:${HTTPS_PORT}`);
    console.log(`  [LAN Secure]   https://${localIp}:${HTTPS_PORT}`);
    console.log(`  * Note: Camera access on mobile requires HTTPS when`);
    console.log(`    accessed via LAN IP (${localIp}).`);
    console.log(`======================================================\n`);
  });
}

// Standalone execution or Vercel serverless export
if (require.main === module && !process.env.VERCEL) {
  start().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = app;

