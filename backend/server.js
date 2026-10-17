const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10MB for video frame buffers
});

const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve frontend as static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// In-Memory Storage for connected cameras and alert logs
const connectedCameras = new Map();
const alertIncidents = [];
const MAX_ALERTS = 50;

// Helper to determine active local IPv4 address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prioritize Wi-Fi and Ethernet interfaces
        const isWifiOrEth = name.toLowerCase().includes('en') || 
                            name.toLowerCase().includes('wlan') || 
                            name.toLowerCase().includes('eth') ||
                            name.toLowerCase().includes('wi-fi');
        candidates.push({ name, address: iface.address, priority: isWifiOrEth ? 1 : 2 });
      }
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates.length > 0 ? candidates[0].address : '127.0.0.1';
}

// REST APIs
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    camerasCount: connectedCameras.size,
    alertsCount: alertIncidents.length
  });
});

app.get('/api/network', (req, res) => {
  const localIp = getLocalIpAddress();
  const host = req.get('host') || `${localIp}:${PORT}`;
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${localIp}:${PORT}`;
  
  res.json({
    localIp,
    port: PORT,
    baseUrl,
    cameraStreamUrl: `${baseUrl}/camera.html`,
    dashboardUrl: `${baseUrl}/index.html`
  });
});

app.get('/api/cameras', (req, res) => {
  const list = Array.from(connectedCameras.values()).map(cam => ({
    id: cam.id,
    name: cam.name,
    type: cam.type, // 'mobile', 'webcam', 'simulated'
    joinedAt: cam.joinedAt,
    lastSeen: cam.lastSeen,
    hasTorch: !!cam.hasTorch
  }));
  res.json({ cameras: list });
});

app.delete('/api/cameras/:id', (req, res) => {
  const { id } = req.params;
  let removed = false;
  for (const [sId, cam] of connectedCameras.entries()) {
    if (cam.id === id || sId === id) {
      io.to(sId).emit('force-disconnect');
      connectedCameras.delete(sId);
      io.to('dashboards').emit('camera-left', { cameraId: cam.id });
      io.to('dashboards').emit('camera-list-update', Array.from(connectedCameras.values()));
      removed = true;
      break;
    }
  }
  res.json({ success: true, removed, cameraId: id });
});

app.post('/api/alerts', (req, res) => {
  const { cameraId, cameraName, confidence, type, snapshot, message } = req.body;
  
  const alert = {
    id: 'ALT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    cameraId: cameraId || 'unknown',
    cameraName: cameraName || 'Camera Feed',
    confidence: confidence ? Math.round(confidence * 100) : 92,
    type: type || 'Human Movement Detected',
    message: message || 'Human subject detected within target perimeter',
    snapshot: snapshot || null
  };

  alertIncidents.unshift(alert);
  if (alertIncidents.length > MAX_ALERTS) {
    alertIncidents.pop();
  }

  // Broadcast alert to connected dashboards
  io.emit('new-alert', alert);

  res.status(201).json({ success: true, alert });
});

app.get('/api/alerts', (req, res) => {
  res.json({ alerts: alertIncidents });
});

app.delete('/api/alerts', (req, res) => {
  alertIncidents.length = 0;
  io.emit('alerts-cleared');
  res.json({ success: true, message: 'All alert incidents cleared' });
});

// Socket.io Realtime Signaling & Frame Relay
io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  // Register a dashboard client
  socket.on('join-dashboard', () => {
    socket.join('dashboards');
    console.log(`[Dashboard] Client joined dashboard room: ${socket.id}`);
    
    // Send initial list of cameras
    socket.emit('camera-list-update', Array.from(connectedCameras.values()));
  });

  // Register a camera client (e.g. mobile or laptop)
  socket.on('register-camera', (data) => {
    const cameraId = data.id || socket.id;
    const cameraInfo = {
      id: cameraId,
      socketId: socket.id,
      name: data.name || `Mobile Node #${cameraId.slice(0, 4)}`,
      type: data.type || 'mobile',
      joinedAt: new Date().toISOString(),
      lastSeen: Date.now(),
      hasTorch: !!data.hasTorch
    };

    connectedCameras.set(socket.id, cameraInfo);
    socket.join('cameras');
    console.log(`[Camera] Registered ${cameraInfo.name} (${cameraInfo.id})`);

    // Notify all dashboards
    io.to('dashboards').emit('camera-joined', cameraInfo);
    io.to('dashboards').emit('camera-list-update', Array.from(connectedCameras.values()));
  });

  // Fallback direct frame relay (Ultra reliable when WebRTC p2p is traversing strict NAT)
  socket.on('stream-frame', (data) => {
    const cam = connectedCameras.get(socket.id);
    if (cam) {
      cam.lastSeen = Date.now();
      socket.to('dashboards').emit('camera-frame', {
        cameraId: cam.id,
        cameraName: cam.name,
        image: data.image,
        isPortrait: !!data.isPortrait,
        width: data.width,
        height: data.height,
        timestamp: data.timestamp || Date.now()
      });
    }
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc-offer', (data) => {
    // Camera sends offer to dashboard or vice-versa
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('webrtc-offer', {
        senderSocketId: socket.id,
        offer: data.offer,
        cameraId: data.cameraId
      });
    } else {
      socket.to('dashboards').emit('webrtc-offer', {
        senderSocketId: socket.id,
        offer: data.offer,
        cameraId: data.cameraId
      });
    }
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc-answer', (data) => {
    io.to(data.targetSocketId).emit('webrtc-answer', {
      senderSocketId: socket.id,
      answer: data.answer,
      cameraId: data.cameraId
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('webrtc-ice-candidate', (data) => {
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('webrtc-ice-candidate', {
        senderSocketId: socket.id,
        candidate: data.candidate
      });
    } else {
      socket.broadcast.emit('webrtc-ice-candidate', {
        senderSocketId: socket.id,
        candidate: data.candidate
      });
    }
  });

  // Remote controls: flashlight, switch camera front/back
  socket.on('control-camera', (data) => {
    const { targetCameraId, action, value } = data;
    for (const [sId, cam] of connectedCameras.entries()) {
      if (cam.id === targetCameraId || sId === targetCameraId) {
        io.to(sId).emit('remote-control', { action, value });
        break;
      }
    }
  });

  // Explicit camera removal requested by dashboard
  socket.on('remove-camera', ({ cameraId }) => {
    for (const [sId, cam] of connectedCameras.entries()) {
      if (cam.id === cameraId || sId === cameraId) {
        console.log(`[Camera] Disconnecting camera: ${cam.name} (${cam.id})`);
        io.to(sId).emit('force-disconnect');
        connectedCameras.delete(sId);
        io.to('dashboards').emit('camera-left', { cameraId: cam.id });
        io.to('dashboards').emit('camera-list-update', Array.from(connectedCameras.values()));
        break;
      }
    }
  });

  // Human detection broadcast from camera or detector
  socket.on('human-detected-event', (eventData) => {
    socket.to('dashboards').emit('human-detected', eventData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (connectedCameras.has(socket.id)) {
      const cam = connectedCameras.get(socket.id);
      console.log(`[Camera] Disconnected: ${cam.name} (${cam.id})`);
      connectedCameras.delete(socket.id);
      io.to('dashboards').emit('camera-left', { cameraId: cam.id });
      io.to('dashboards').emit('camera-list-update', Array.from(connectedCameras.values()));
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIpAddress();
  console.log(`\n======================================================`);
  console.log(`👁️  AI CCTV SURVEILLANCE SYSTEM INITIALIZED`);
  console.log(`📡 Local Network Host: http://${ip}:${PORT}`);
  console.log(`🖥️  Command Center Dashboard: http://${ip}:${PORT}/index.html`);
  console.log(`📱 Mobile Camera Connect:     http://${ip}:${PORT}/camera.html`);
  console.log(`======================================================\n`);
});
