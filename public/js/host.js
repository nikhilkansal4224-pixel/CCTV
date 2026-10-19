// SENTINEL // Host Monitor Script

let currentSessionId = null;
let sessionExpiresAt = null;
let timerInterval = null;
let ws = null;
let pc = null;
let statsMonitor = null;
let remoteStream = null;
let selectedProtocol = window.location.protocol === 'https:' ? 'https' : 'https';
let selectedHost = window.location.hostname;

// Elements
const connectionStatusPill = document.getElementById('connectionStatusPill');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const countdownDisplay = document.getElementById('countdownDisplay');
const sessionUrlInput = document.getElementById('sessionUrlInput');
const btnCopyLink = document.getElementById('btnCopyLink');
const btnOpenLink = document.getElementById('btnOpenLink');
const btnNewSession = document.getElementById('btnNewSession');
const btnEndSession = document.getElementById('btnEndSession');
const remoteVideo = document.getElementById('remoteVideo');
const standbyOverlay = document.getElementById('standbyOverlay');
const viewportReticle = document.getElementById('viewportReticle');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

// Network controls
const networkHostSelect = document.getElementById('networkHostSelect');
const networkProtocolSelect = document.getElementById('networkProtocolSelect');

// HUD Telemetry Elements
const hudFps = document.getElementById('hudFps');
const hudBitrate = document.getElementById('hudBitrate');
const hudRes = document.getElementById('hudRes');
const hudLatency = document.getElementById('hudLatency');
const liveTimestamp = document.getElementById('liveTimestamp');

// Controls
const btnFullscreen = document.getElementById('btnFullscreen');
const btnSnapshot = document.getElementById('btnSnapshot');
const btnAspect = document.getElementById('btnAspect');
const btnToggleReticle = document.getElementById('btnToggleReticle');
const videoStage = document.getElementById('videoStage');

// User Profile Elements
const userNameEl = document.getElementById('userName');
const userRoleEl = document.getElementById('userRole');
const userAvatarEl = document.getElementById('userAvatar');
const btnLogout = document.getElementById('btnLogout');

// Clock watermark
setInterval(() => {
  if (liveTimestamp) {
    const now = new Date();
    liveTimestamp.textContent = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }
}, 1000);

async function checkAuthAndProfile() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      window.location.href = '/login.html?returnTo=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    const data = await res.json();
    if (data.user) {
      if (userNameEl) userNameEl.textContent = data.user.displayName || data.user.username;
      if (userRoleEl) userRoleEl.textContent = data.user.role || 'Operator';
      if (userAvatarEl) {
        const initial = (data.user.displayName || data.user.username || 'A')[0].toUpperCase();
        userAvatarEl.textContent = initial;
      }
      return true;
    }
  } catch (err) {
    console.warn('Auth check error:', err);
  }
  window.location.href = '/login.html';
  return false;
}

// Initialize Dashboard
async function initHost() {
  const isAuthed = await checkAuthAndProfile();
  if (!isAuthed) return;
  await loadNetworkInfo();
  await createNewSession();
  setupEventListeners();
}

async function loadNetworkInfo() {
  try {
    const res = await fetch('/api/network-info');
    const data = await res.json();
    
    if (networkHostSelect && data.allIps) {
      networkHostSelect.innerHTML = '';
      data.allIps.forEach(ip => {
        const opt = document.createElement('option');
        opt.value = ip;
        opt.textContent = ip === 'localhost' ? 'Localhost (This PC)' : `LAN: ${ip}`;
        // Prefer LAN IP by default so phone scanner works out of the box
        if (ip !== 'localhost' && !selectedHost.includes('.')) {
          opt.selected = true;
          selectedHost = ip;
        } else if (ip === selectedHost) {
          opt.selected = true;
        }
        networkHostSelect.appendChild(opt);
      });
      if (!selectedHost && data.localIp) {
        selectedHost = data.localIp;
        networkHostSelect.value = selectedHost;
      }
    }

    if (networkProtocolSelect) {
      networkProtocolSelect.value = selectedProtocol;
    }
  } catch (err) {
    console.warn('Network info load failed:', err);
  }
}

async function createNewSession() {
  cleanupCurrentSession();

  updateStatus('waiting', 'GENERATING SESSION...');

  try {
    const queryParams = new URLSearchParams({
      protocol: selectedProtocol,
      host: selectedHost,
    });

    const res = await fetch(`/api/sessions/create?${queryParams.toString()}`, { method: 'POST' });
    const data = await res.json();

    currentSessionId = data.sessionId;
    sessionExpiresAt = data.expiresAt;

    sessionUrlInput.value = data.cameraUrl;
    btnOpenLink.href = data.cameraUrl;

    // Load QR Code SVG
    await loadQrCode(currentSessionId);

    // Start Expiry Timer
    startCountdown(data.expiresAt);

    // Connect Signaling WebSocket
    connectWebSocket(currentSessionId);

    updateStatus('waiting', 'WAITING FOR SCANNER');
    setStep(1);
    showToast('New secure session generated');
  } catch (err) {
    console.error('Session init error:', err);
    updateStatus('ended', 'ERROR INITIALIZING');
    showToast('Failed to create session');
  }
}

async function loadQrCode(sessionId) {
  qrCodeContainer.innerHTML = '<div class="qr-skeleton">Loading QR...</div>';
  try {
    const queryParams = new URLSearchParams({
      protocol: selectedProtocol,
      host: selectedHost,
    });
    const qrRes = await fetch(`/api/sessions/${sessionId}/qr?${queryParams.toString()}`);
    if (!qrRes.ok) throw new Error('QR fetch failed');
    const svgText = await qrRes.text();
    qrCodeContainer.innerHTML = svgText;
  } catch (err) {
    qrCodeContainer.innerHTML = '<div class="qr-skeleton">Failed to render QR</div>';
  }
}

function startCountdown(expiresAt) {
  if (timerInterval) clearInterval(timerInterval);

  function update() {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    countdownDisplay.textContent = `${mins}:${secs}`;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      countdownDisplay.textContent = 'EXPIRED';
      countdownDisplay.parentElement.classList.add('expired');
      handleSessionExpired();
    }
  }

  update();
  timerInterval = setInterval(update, 1000);
}

function updateStatus(state, label) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = label;
}

function setStep(activeStep) {
  [step1, step2, step3, step4].forEach((el, idx) => {
    if (el) {
      if (idx + 1 === activeStep) {
        el.className = 'step-item active';
      } else if (idx + 1 < activeStep) {
        el.className = 'step-item';
      } else {
        el.className = 'step-item';
      }
    }
  });
}

// WebSocket Signaling
function connectWebSocket(sessionId) {
  const wsUrl = window.getWebSocketUrl();
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'join',
      sessionId,
      role: 'host',
    }));
  };

  ws.onmessage = async (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    switch (msg.type) {
      case 'joined':
        console.log('[Host] Joined session:', msg.sessionId);
        break;

      case 'camera-joined':
        updateStatus('waiting', 'DEVICE PAIRED — REQUESTING PERMISSION');
        setStep(2);
        showToast('Smartphone scanned QR code!');
        break;

      case 'camera-ready':
        updateStatus('waiting', 'PERMISSION GRANTED — STARTING WEBRTC');
        setStep(3);
        showToast('Camera consent granted on remote phone');
        break;

      case 'offer':
        await handleRemoteOffer(msg.sdp);
        break;

      case 'ice-candidate':
        if (pc && msg.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
        break;

      case 'telemetry':
        // Optional camera side telemetry
        break;

      case 'camera-disconnected':
        handleCameraDisconnected();
        break;

      case 'session-ended':
        handleSessionEnded(msg.reason);
        break;

      case 'session-expired':
        handleSessionExpired();
        break;
    }
  };

  ws.onclose = () => {
    console.log('[Host] WebSocket connection closed');
  };
}

// WebRTC PeerConnection Setup
async function handleRemoteOffer(sdp) {
  if (pc) {
    pc.close();
  }

  pc = new RTCPeerConnection(window.RTC_CONFIG);

  pc.onicecandidate = (event) => {
    if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ice-candidate',
        sessionId: currentSessionId,
        candidate: event.candidate,
      }));
    }
  };

  pc.ontrack = (event) => {
    console.log('[Host] Received remote video stream track:', event.streams[0]);
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
    remoteVideo.classList.add('active');
    standbyOverlay.style.display = 'none';
    viewportReticle.classList.add('active');

    updateStatus('live', 'LIVE STREAM ENCRYPTED');
    setStep(4);
    btnEndSession.style.display = 'inline-flex';

    // Start stats monitoring
    if (statsMonitor) statsMonitor.stop();
    statsMonitor = new window.RTCStatsMonitor(pc, (stats) => {
      if (hudFps) hudFps.textContent = `${stats.fps} fps`;
      if (hudBitrate) hudBitrate.textContent = `${stats.bitrate} kbps`;
      if (hudRes) hudRes.textContent = stats.width ? `${stats.width}x${stats.height}` : '720p HD';
      if (hudLatency) hudLatency.textContent = `${stats.rtt} ms`;
    });
    statsMonitor.start();

    showToast('Secure WebRTC live stream connected!');
  };

  pc.oniceconnectionstatechange = () => {
    console.log('[Host] ICE State:', pc.iceConnectionState);
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
      updateStatus('ended', 'STREAM DISCONNECTED');
    }
  };

  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'answer',
      sessionId: currentSessionId,
      sdp: pc.localDescription,
    }));
  }
}

function handleCameraDisconnected() {
  updateStatus('waiting', 'CAMERA DISCONNECTED');
  showToast('Remote camera disconnected');
  resetStreamView();
}

function handleSessionEnded(reason) {
  updateStatus('ended', 'SESSION TERMINATED');
  showToast(reason || 'Session ended');
  resetStreamView();
  if (timerInterval) clearInterval(timerInterval);
}

function handleSessionExpired() {
  updateStatus('ended', 'SESSION EXPIRED');
  showToast('Session expired. Generate a new QR code.');
  resetStreamView();
}

function resetStreamView() {
  if (statsMonitor) statsMonitor.stop();
  if (remoteVideo) {
    remoteVideo.srcObject = null;
    remoteVideo.classList.remove('active');
  }
  if (standbyOverlay) standbyOverlay.style.display = 'flex';
  if (viewportReticle) viewportReticle.classList.remove('active');
  if (hudFps) hudFps.textContent = '-- fps';
  if (hudBitrate) hudBitrate.textContent = '-- kbps';
  if (hudRes) hudRes.textContent = '--';
  if (hudLatency) hudLatency.textContent = '-- ms';
}

function cleanupCurrentSession() {
  if (statsMonitor) statsMonitor.stop();
  if (timerInterval) clearInterval(timerInterval);
  if (pc) {
    pc.close();
    pc = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  resetStreamView();
}

// User Actions
function setupEventListeners() {
  // Copy Session URL
  btnCopyLink.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(sessionUrlInput.value);
      showToast('Camera link copied to clipboard!');
    } catch (e) {
      sessionUrlInput.select();
      document.execCommand('copy');
      showToast('Camera link copied!');
    }
  });

  // End Session Button
  btnEndSession.addEventListener('click', async () => {
    if (!currentSessionId) return;
    if (confirm('Are you sure you want to end this camera session? The remote camera will be immediately closed.')) {
      try {
        await fetch(`/api/sessions/${currentSessionId}/end`, { method: 'POST' });
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'end-session', sessionId: currentSessionId, reason: 'Host terminated session' }));
        }
      } catch (e) {}
      handleSessionEnded('You ended the session');
    }
  });

  // New QR / Session Button
  btnNewSession.addEventListener('click', () => {
    createNewSession();
  });

  // Fullscreen toggle
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      videoStage.requestFullscreen().catch(err => alert(err.message));
    } else {
      document.exitFullscreen();
    }
  });

  // Capture Snapshot Frame
  btnSnapshot.addEventListener('click', () => {
    if (!remoteVideo || !remoteVideo.videoWidth) {
      return showToast('No active video feed to capture');
    }
    const canvas = document.createElement('canvas');
    canvas.width = remoteVideo.videoWidth;
    canvas.height = remoteVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);

    // Add watermark
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(`SENTINEL // ${new Date().toISOString()}`, 20, canvas.height - 24);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = `cctv-capture-${Date.now()}.jpg`;
    a.click();
    showToast('Snapshot saved to Downloads');
  });

  // Aspect ratio toggle
  let isCover = false;
  btnAspect.addEventListener('click', () => {
    isCover = !isCover;
    remoteVideo.style.objectFit = isCover ? 'cover' : 'contain';
    btnAspect.classList.toggle('active', isCover);
    showToast(isCover ? 'Aspect: Fill / Cover' : 'Aspect: Fit / Contain');
  });

  // Crosshair reticle toggle
  let reticleEnabled = true;
  btnToggleReticle.addEventListener('click', () => {
    reticleEnabled = !reticleEnabled;
    viewportReticle.style.display = reticleEnabled ? 'block' : 'none';
    btnToggleReticle.classList.toggle('active', reticleEnabled);
  });

  // Network Host & Protocol Selector changes
  if (networkHostSelect) {
    networkHostSelect.addEventListener('change', () => {
      selectedHost = networkHostSelect.value;
      createNewSession();
      showToast(`Switched target to ${selectedHost}`);
    });
  }

  if (networkProtocolSelect) {
    networkProtocolSelect.addEventListener('change', () => {
      selectedProtocol = networkProtocolSelect.value;
      createNewSession();
      showToast(`Switched protocol to ${selectedProtocol.toUpperCase()}`);
    });
  }

  // Sign out button
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out of the Sentinel Gateway?')) {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {}
        window.location.href = '/login.html';
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', initHost);
