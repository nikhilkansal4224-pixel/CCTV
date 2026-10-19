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

// Protected Host Dashboard Route (requires authentication)
app.get(['/', '/index.html'], auth.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve public static assets (login.html, camera.html, css, js)
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
// sessionId -> { id, createdAt, expiresAt, status: 'waiting'|'paired'|'streaming'|'ended', hostWs, cameraWs }
const sessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

function createSession() {
  const id = crypto.randomBytes(6).toString('hex'); // 12-char hex ID
  const now = Date.now();
  const session = {
    id,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    status: 'waiting',
    hostWs: null,
    cameraWs: null,
  };
  sessions.set(id, session);
  return session;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt <= now || session.status === 'ended') {
      if (session.hostWs && session.hostWs.readyState === 1) {
        session.hostWs.send(JSON.stringify({ type: 'session-expired', sessionId: id }));
        session.hostWs.close();
      }
      if (session.cameraWs && session.cameraWs.readyState === 1) {
        session.cameraWs.send(JSON.stringify({ type: 'session-expired', sessionId: id }));
        session.cameraWs.close();
      }
      sessions.delete(id);
    }
  }
}
setInterval(cleanupSessions, 20 * 1000);

// --- Authentication Endpoints ---

// Operator Login
app.post('/api/auth/login', (req, res) => {
  const { username, password, remember } = req.body;
  const user = auth.authenticate(username, password);

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
});

// Operator Registration
app.post('/api/auth/register', (req, res) => {
  const { username, password, role, displayName } = req.body;
  try {
    const user = auth.register(username, password, role, displayName);
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
  const hostHeader = req.get('host') || '';
  const isHttps = req.secure || req.protocol === 'https';

  res.json({
    localIp,
    allIps,
    httpPort: HTTP_PORT,
    httpsPort: HTTPS_PORT,
    currentHost: hostHeader,
    currentProtocol: isHttps ? 'https' : 'http',
    httpUrl: `http://${localIp}:${HTTP_PORT}`,
    httpsUrl: `https://${localIp}:${HTTPS_PORT}`,
  });
});

// Create new temporary session (requires authenticated operator)
app.post('/api/sessions/create', auth.requireAuth, (req, res) => {
  const session = createSession();
  session.operator = req.user.username;
  const host = req.query.host || getLocalIp(req);
  const preferProtocol = req.query.protocol || (req.secure ? 'https' : 'http');
  const port = preferProtocol === 'https' ? HTTPS_PORT : HTTP_PORT;
  const baseUrl = `${preferProtocol}://${host}:${port}`;
  const cameraUrl = `${baseUrl}/camera.html?session=${session.id}`;

  res.json({
    sessionId: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    ttlSeconds: Math.floor(SESSION_TTL_MS / 1000),
    cameraUrl,
    status: session.status,
    host,
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

  res.json({
    sessionId: session.id,
    status: session.status,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.max(0, Math.floor((session.expiresAt - now) / 1000)),
    isPaired: !!session.cameraWs,
  });
});

// Render QR code image as DataURL or SVG
app.get('/api/sessions/:id/qr', async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).send('Session expired or not found');
  }

  const host = req.query.host || getLocalIp(req);
  const protocol = req.query.protocol || 'https';
  const port = protocol === 'https' ? HTTPS_PORT : HTTP_PORT;
  const cameraUrl = `${protocol}://${host}:${port}/camera.html?session=${session.id}`;

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
    const terminateMsg = JSON.stringify({ type: 'session-ended', sessionId: session.id });
    if (session.hostWs && session.hostWs.readyState === 1) {
      session.hostWs.send(terminateMsg);
    }
    if (session.cameraWs && session.cameraWs.readyState === 1) {
      session.cameraWs.send(terminateMsg);
    }
    sessions.delete(session.id);
  }
  res.json({ success: true, message: 'Session terminated' });
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
  if (session.cameraWs && session.cameraWs.readyState === 1) {
    session.cameraWs.send(extendNotice);
  }

  res.json({
    success: true,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.floor((session.expiresAt - Date.now()) / 1000),
  });
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
          ws.send(JSON.stringify({
            type: 'joined',
            role: 'host',
            sessionId,
            status: session.status,
            hasCamera: !!session.cameraWs,
          }));
        } else if (role === 'camera') {
          // Enforce single-camera pairing security
          if (session.cameraWs && session.cameraWs !== ws && session.cameraWs.readyState === 1) {
            return ws.send(JSON.stringify({
              type: 'error',
              message: 'Another camera is already connected to this session',
            }));
          }

          session.cameraWs = ws;
          session.status = 'paired';

          ws.send(JSON.stringify({
            type: 'joined',
            role: 'camera',
            sessionId,
            status: session.status,
          }));

          // Notify the host monitor that phone scanned and joined
          if (session.hostWs && session.hostWs.readyState === 1) {
            session.hostWs.send(JSON.stringify({
              type: 'camera-joined',
              sessionId,
              timestamp: Date.now(),
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
        currentSession.status = 'streaming';
        if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
          currentSession.hostWs.send(JSON.stringify({
            type: 'camera-ready',
            facingMode: data.facingMode,
            resolution: data.resolution,
          }));
        }
        return;
      }

      // WebRTC Offer from Camera to Host
      if (type === 'offer') {
        if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
          currentSession.hostWs.send(JSON.stringify({
            type: 'offer',
            sdp: data.sdp,
          }));
        }
        return;
      }

      // WebRTC Answer from Host to Camera
      if (type === 'answer') {
        if (currentSession.cameraWs && currentSession.cameraWs.readyState === 1) {
          currentSession.cameraWs.send(JSON.stringify({
            type: 'answer',
            sdp: data.sdp,
          }));
        }
        return;
      }

      // ICE Candidate Relay between peers
      if (type === 'ice-candidate') {
        const targetWs = boundRole === 'camera' ? currentSession.hostWs : currentSession.cameraWs;
        if (targetWs && targetWs.readyState === 1) {
          targetWs.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: data.candidate,
          }));
        }
        return;
      }

      // Stream Stats telemetry
      if (type === 'telemetry') {
        const targetWs = boundRole === 'camera' ? currentSession.hostWs : currentSession.cameraWs;
        if (targetWs && targetWs.readyState === 1) {
          targetWs.send(JSON.stringify({
            type: 'telemetry',
            stats: data.stats,
          }));
        }
        return;
      }

      // Explicit End Session request from either peer
      if (type === 'end-session') {
        currentSession.status = 'ended';
        const endNotice = JSON.stringify({
          type: 'session-ended',
          sessionId: currentSession.id,
          reason: data.reason || 'User ended session',
        });
        if (currentSession.hostWs && currentSession.hostWs.readyState === 1) {
          currentSession.hostWs.send(endNotice);
        }
        if (currentSession.cameraWs && currentSession.cameraWs.readyState === 1) {
          currentSession.cameraWs.send(endNotice);
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
          if (boundRole === 'camera' && session.cameraWs === ws) {
            session.cameraWs = null;
            if (session.status === 'streaming' || session.status === 'paired') {
              session.status = 'waiting';
            }
            if (session.hostWs && session.hostWs.readyState === 1) {
              session.hostWs.send(JSON.stringify({
                type: 'camera-disconnected',
                sessionId: boundSessionId,
              }));
            }
          } else if (boundRole === 'host' && session.hostWs === ws) {
            session.hostWs = null;
            if (session.cameraWs && session.cameraWs.readyState === 1) {
              session.cameraWs.send(JSON.stringify({
                type: 'host-disconnected',
                sessionId: boundSessionId,
              }));
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

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
