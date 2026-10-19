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
// sessionId -> { id, createdAt, expiresAt, status: 'waiting'|'active'|'ended', hostWs, cameras: Map<deviceId, { deviceId, deviceName, ws, status, joinedAt }> }
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
    cameras: new Map(), // Map<deviceId, { deviceId, deviceName, ws, status, joinedAt, facingMode, resolution }>
  };
  sessions.set(id, session);
  return session;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt <= now || session.status === 'ended') {
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

  const cameraList = session.cameras ? Array.from(session.cameras.values()).map(c => ({
    deviceId: c.deviceId,
    deviceName: c.deviceName,
    status: c.status,
  })) : [];

  res.json({
    sessionId: session.id,
    status: session.status,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.max(0, Math.floor((session.expiresAt - now) / 1000)),
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

// Explicitly terminate whole session (Host operator only)
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

// Disconnect/leave a single camera device (keeps session and all other cameras active)
app.post('/api/sessions/:id/devices/:deviceId/leave', (req, res) => {
  const session = sessions.get(req.params.id);
  const deviceId = req.params.deviceId;
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.cameras && session.cameras.has(deviceId)) {
    const cam = session.cameras.get(deviceId);
    if (cam.ws && cam.ws.readyState === 1) {
      try { cam.ws.close(); } catch (e) {}
    }
    session.cameras.delete(deviceId);
    if (session.cameras.size === 0 && session.status !== 'ended') {
      session.status = 'waiting';
    }

    if (session.hostWs && session.hostWs.readyState === 1) {
      session.hostWs.send(JSON.stringify({
        type: 'camera-disconnected',
        sessionId: session.id,
        deviceId,
        totalCameras: session.cameras.size,
      }));
    }
  }

  res.json({ success: true, message: `Device ${deviceId} left session` });
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
          }));
          ws.send(JSON.stringify({
            type: 'joined',
            role: 'host',
            sessionId,
            status: session.status,
            totalCameras: session.cameras.size,
            cameras: cameraList,
            hasCamera: session.cameras.size > 0,
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
          session.cameras.set(deviceId, {
            deviceId,
            deviceName,
            ws,
            status: 'paired',
            joinedAt: Date.now(),
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

      // Disconnect a specific camera device (initiated by Host or self-terminated by Device)
      if (type === 'disconnect-device' || type === 'leave-device') {
        const deviceId = boundRole === 'camera' ? (boundDeviceId || data.deviceId) : data.deviceId;
        if (deviceId && currentSession.cameras.has(deviceId)) {
          const cam = currentSession.cameras.get(deviceId);
          if (cam.ws && cam.ws.readyState === 1 && boundRole !== 'camera') {
            cam.ws.send(JSON.stringify({
              type: 'device-kicked',
              sessionId: currentSession.id,
              deviceId,
              reason: data.reason || 'Disconnected by host operator',
            }));
            try { cam.ws.close(); } catch (e) {}
          }
          currentSession.cameras.delete(deviceId);
          if (currentSession.cameras.size === 0 && currentSession.status !== 'ended') {
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
          if (boundRole === 'camera' && ws.readyState === 1) {
            try { ws.close(); } catch (e) {}
          }
        }
        return;
      }

      // Explicit End Entire Session request from either peer
      if (type === 'end-session') {
        currentSession.status = 'ended';
        const endNotice = JSON.stringify({
          type: 'session-ended',
          sessionId: currentSession.id,
          reason: data.reason || 'Session ended by user',
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

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
