// SENTINEL // Host Monitor Script (Multi-Camera Matrix Gateway)

let currentSessionId = null;
let sessionExpiresAt = null;
let timerInterval = null;
let ws = null;
let selectedProtocol = window.location.protocol === 'https:' ? 'https' : 'https';
let selectedHost = window.location.hostname;

// Multi-Camera Peer Storage: deviceId -> CameraPeer
// CameraPeer: { deviceId, deviceName, pc, stream, videoEl, cardEl, statsMonitor, stats, isMuted, status }
const cameraPeers = new Map();
let currentViewMode = 'grid'; // 'grid' | 'focus'
let focusedDeviceId = null;

// UI Elements
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
const standbyOverlay = document.getElementById('standbyOverlay');
const cameraGrid = document.getElementById('cameraGrid');
const cameraCountBadge = document.getElementById('cameraCountBadge');
const hudTotalCam = document.getElementById('hudTotalCam');
const hudActiveStream = document.getElementById('hudActiveStream');
const btnModeGrid = document.getElementById('btnModeGrid');
const btnModeFocus = document.getElementById('btnModeFocus');
const connectedRosterCard = document.getElementById('connectedRosterCard');
const rosterCountBadge = document.getElementById('rosterCountBadge');
const rosterList = document.getElementById('rosterList');

// Master Sleep Timer Elements
const btnMasterSleepTimer = document.getElementById('btnMasterSleepTimer');
const masterSleepTimerLabel = document.getElementById('masterSleepTimerLabel');
const masterSleepTimerMenu = document.getElementById('masterSleepTimerMenu');
const viewportSleepWidget = document.getElementById('viewportSleepWidget');
const btnViewportSleepTrigger = document.getElementById('btnViewportSleepTrigger');
const viewportSleepLabel = document.getElementById('viewportSleepLabel');

let masterSleepTimer = { active: false, expiresAt: null, durationMinutes: null };
let sleepTimerInterval = null;

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

// Network controls
const networkHostSelect = document.getElementById('networkHostSelect');
const networkProtocolSelect = document.getElementById('networkProtocolSelect');

// User Profile Elements
const userNameEl = document.getElementById('userName');
const userRoleEl = document.getElementById('userRole');
const userAvatarEl = document.getElementById('userAvatar');
const btnLogout = document.getElementById('btnLogout');

// Global Viewport Toolbar & Recording Elements
const btnRecord = document.getElementById('btnRecord');
const recordTimer = document.getElementById('recordTimer');
const recordIcon = document.getElementById('recordIcon');
const btnMuteAudio = document.getElementById('btnMuteAudio');
const audioIcon = document.getElementById('audioIcon');
const btnSnapshot = document.getElementById('btnSnapshot');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnExtendSession = document.getElementById('btnExtendSession');
const eventLogContainer = document.getElementById('eventLogContainer');
const btnClearLog = document.getElementById('btnClearLog');
const videoStage = document.getElementById('videoStage');

let mediaRecorder = null;
let recordedChunks = [];
let recordInterval = null;
let recordSeconds = 0;
let isAudioMuted = true;

function logEvent(tag, message) {
  if (!eventLogContainer) return;
  const time = new Date().toTimeString().split(' ')[0];
  const row = document.createElement('div');
  row.innerHTML = `<span style="color: var(--text-tertiary);">[${time}]</span> <strong style="color: #ffffff;">[${tag}]</strong> ${message}`;
  eventLogContainer.appendChild(row);
  eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
}

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

  updateStatus('waiting', 'GENERATING MATRIX SESSION...');

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

    updateStatus('waiting', 'WAITING FOR CAMERAS');
    setStep(1);
    updateCameraMatrixCounts();
    showToast('New secure multi-device gateway ready');
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

function initSleepTimerTicker() {
  if (sleepTimerInterval) clearInterval(sleepTimerInterval);
  sleepTimerInterval = setInterval(() => {
    const now = Date.now();
    updateMasterSleepTimerDisplay(now);
    cameraPeers.forEach(peer => {
      updateTileSleepDisplay(peer, now);
    });
  }, 1000);
}

function updateMasterSleepTimerDisplay(now) {
  if (masterSleepTimer && masterSleepTimer.active && masterSleepTimer.expiresAt) {
    const remaining = Math.max(0, Math.floor((masterSleepTimer.expiresAt - now) / 1000));
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    const label = `🌙 ${mins}:${secs}`;

    if (masterSleepTimerLabel) masterSleepTimerLabel.textContent = label;
    if (viewportSleepLabel) viewportSleepLabel.textContent = label;
    if (btnMasterSleepTimer) btnMasterSleepTimer.classList.add('active');
    if (btnViewportSleepTrigger) btnViewportSleepTrigger.classList.add('active');

    if (countdownDisplay) countdownDisplay.textContent = `${mins}:${secs}`;

    if (masterSleepTimerMenu) {
      const items = masterSleepTimerMenu.querySelectorAll('.sleep-menu-item');
      items.forEach(btn => {
        const val = btn.getAttribute('data-minutes');
        btn.classList.toggle('active', val !== 'custom' && Number(val) === masterSleepTimer.durationMinutes);
      });
    }

    if (remaining <= 0) {
      masterSleepTimer.active = false;
      if (masterSleepTimerLabel) masterSleepTimerLabel.textContent = 'Sleep: Off';
      if (viewportSleepLabel) viewportSleepLabel.textContent = 'Sleep: Off';
      if (btnMasterSleepTimer) btnMasterSleepTimer.classList.remove('active');
      if (btnViewportSleepTrigger) btnViewportSleepTrigger.classList.remove('active');
    }
  } else {
    if (masterSleepTimerLabel) masterSleepTimerLabel.textContent = 'Sleep: Off';
    if (viewportSleepLabel) viewportSleepLabel.textContent = 'Sleep: Off';
    if (btnMasterSleepTimer) btnMasterSleepTimer.classList.remove('active');
    if (btnViewportSleepTrigger) btnViewportSleepTrigger.classList.remove('active');

    if (masterSleepTimerMenu) {
      const items = masterSleepTimerMenu.querySelectorAll('.sleep-menu-item');
      items.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-minutes') === '0');
      });
    }
  }
}

function updateTileSleepDisplay(peer, now) {
  if (!peer || !peer.cardEl) return;
  const badge = peer.cardEl.querySelector('.tile-sleep-badge');
  const btn = peer.cardEl.querySelector('.btn-tile-sleep');

  if (peer.sleepTimer && peer.sleepTimer.active && peer.sleepTimer.expiresAt) {
    const remaining = Math.max(0, Math.floor((peer.sleepTimer.expiresAt - now) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const txt = remaining > 60 ? `${mins}m` : `${mins}:${String(secs).padStart(2, '0')}`;

    if (badge) {
      badge.textContent = txt;
      badge.style.display = 'block';
    }
    if (btn) {
      btn.classList.add('active');
      btn.title = `Sleep Timer: ${txt} remaining [Click to change]`;
    }

    if (remaining <= 0) {
      peer.sleepTimer.active = false;
      if (badge) badge.style.display = 'none';
      if (btn) {
        btn.classList.remove('active');
        btn.title = `Set Sleep Timer for this Camera`;
      }
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (btn) {
      btn.classList.remove('active');
      btn.title = `Set Sleep Timer for this Camera`;
    }
  }
}

async function setMasterSleepTimer(minutes) {
  const numMinutes = (minutes !== null && minutes !== undefined && !isNaN(minutes) && Number(minutes) > 0)
    ? Number(minutes)
    : null;
  const active = numMinutes !== null;
  const expiresAt = active ? Date.now() + numMinutes * 60 * 1000 : null;

  masterSleepTimer = { active, expiresAt, durationMinutes: numMinutes };
  updateMasterSleepTimerDisplay(Date.now());

  // Also sync locally to all peers
  cameraPeers.forEach(peer => {
    peer.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };
    updateTileSleepDisplay(peer, Date.now());
  });

  try {
    await fetch(`/api/sessions/${currentSessionId}/sleep-timer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'all', minutes: numMinutes }),
    });
  } catch (e) {}

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'set-sleep-timer',
      sessionId: currentSessionId,
      target: 'all',
      minutes: numMinutes,
    }));
  }

  showToast(active ? `Master Sleep Timer: ${numMinutes} minute${numMinutes === 1 ? '' : 's'}` : 'Master Sleep Timer turned Off');
  logEvent('SLEEP', active ? `Master sleep timer configured: ${numMinutes}m for all devices` : 'Master sleep timer turned Off (stay awake)');
}

async function setDeviceSleepTimer(deviceId, minutes) {
  const peer = cameraPeers.get(deviceId);
  if (!peer) return;

  const numMinutes = (minutes !== null && minutes !== undefined && !isNaN(minutes) && Number(minutes) > 0)
    ? Number(minutes)
    : null;
  const active = numMinutes !== null;
  const expiresAt = active ? Date.now() + numMinutes * 60 * 1000 : null;

  peer.sleepTimer = { active, expiresAt, durationMinutes: numMinutes };
  updateTileSleepDisplay(peer, Date.now());

  try {
    await fetch(`/api/sessions/${currentSessionId}/sleep-timer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: deviceId, minutes: numMinutes }),
    });
  } catch (e) {}

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'set-sleep-timer',
      sessionId: currentSessionId,
      target: deviceId,
      minutes: numMinutes,
    }));
  }

  showToast(active ? `Sleep Timer for [${peer.deviceName}]: ${numMinutes}m` : `Sleep Timer disabled for [${peer.deviceName}]`);
  logEvent('SLEEP', active ? `Sleep timer set for ${peer.deviceName} [${deviceId}]: ${numMinutes}m` : `Sleep timer turned Off for ${peer.deviceName} [${deviceId}]`);
}

function startCountdown() {
  initSleepTimerTicker();
}

function updateStatus(state, label) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = label;
}

function setStep(activeStep) {
  [step1, step2, step3, step4].forEach((el, idx) => {
    if (el) {
      el.className = (idx + 1 <= activeStep) ? 'step-item active' : 'step-item';
    }
  });
}

// Update Counts, Roster, and Grid Attributes
function updateCameraMatrixCounts() {
  const total = cameraPeers.size;
  const live = Array.from(cameraPeers.values()).filter(p => p.status === 'live').length;

  if (cameraCountBadge) cameraCountBadge.textContent = `${total} Device${total === 1 ? '' : 's'}`;
  if (hudTotalCam) hudTotalCam.textContent = total;
  if (hudActiveStream) hudActiveStream.textContent = live;
  if (rosterCountBadge) rosterCountBadge.textContent = `${total} Online`;

  if (cameraGrid) {
    cameraGrid.setAttribute('data-count', Math.min(Math.max(total, 1), 9));
  }

  if (total === 0) {
    if (standbyOverlay) standbyOverlay.style.display = 'flex';
    if (connectedRosterCard) connectedRosterCard.style.display = 'none';
    if (btnEndSession) btnEndSession.style.display = 'none';
    if (viewportSleepWidget) viewportSleepWidget.style.display = 'none';
    updateStatus('waiting', 'WAITING FOR CAMERAS');
    setStep(1);
    focusedDeviceId = null;
  } else {
    if (standbyOverlay) standbyOverlay.style.display = 'none';
    if (connectedRosterCard) connectedRosterCard.style.display = 'block';
    if (btnEndSession) btnEndSession.style.display = 'inline-flex';
    if (viewportSleepWidget) viewportSleepWidget.style.display = 'block';
    if (live > 0) {
      updateStatus('live', `${live} ENCRYPTED FEED${live === 1 ? '' : 'S'} LIVE`);
      setStep(4);
    } else {
      updateStatus('waiting', `${total} DEVICE${total === 1 ? '' : 'S'} PAIRED — AWAITING CONSENT`);
      setStep(2);
    }
  }

  renderConnectedRoster();
}

// Render Sidebar Connected Device Roster
function renderConnectedRoster() {
  if (!rosterList) return;
  rosterList.innerHTML = '';

  cameraPeers.forEach(peer => {
    const item = document.createElement('div');
    item.className = 'roster-item';
    const isLive = peer.status === 'live';

    item.innerHTML = `
      <div class="roster-item-info">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span class="status-dot ${isLive ? 'live' : 'waiting'}" style="width: 7px; height: 7px;"></span>
          <span class="roster-item-name">${escapeHtml(peer.deviceName)}</span>
        </div>
        <div class="roster-item-meta">ID: <strong>${escapeHtml(peer.deviceId)}</strong> • ${isLive ? 'Live 720p' : 'Pairing'}</div>
      </div>
      <button class="roster-kick-btn" title="Disconnect this camera" data-device-id="${peer.deviceId}">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    const kickBtn = item.querySelector('.roster-kick-btn');
    kickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      disconnectDevice(peer.deviceId);
    });

    item.addEventListener('click', () => {
      focusCamera(peer.deviceId);
    });

    rosterList.appendChild(item);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Get or Create Camera Grid Tile
function getOrCreateCameraTile(deviceId, deviceName) {
  if (cameraPeers.has(deviceId)) {
    const peer = cameraPeers.get(deviceId);
    if (deviceName && deviceName !== peer.deviceName) {
      peer.deviceName = deviceName;
      const nameEl = peer.cardEl.querySelector('.tile-device-name');
      if (nameEl) nameEl.textContent = deviceName;
    }
    return peer;
  }

  const cleanName = deviceName || `Camera ${deviceId}`;

  const cardEl = document.createElement('div');
  cardEl.className = 'camera-tile';
  cardEl.id = `tile-${deviceId}`;

  cardEl.innerHTML = `
    <div class="tile-header">
      <div class="tile-identity">
        <span class="tile-device-id">${escapeHtml(deviceId)}</span>
        <span class="tile-device-name">${escapeHtml(cleanName)}</span>
      </div>

      <div class="tile-header-actions">
        <!-- Snapshot Frame -->
        <button class="tile-btn btn-tile-snap" title="Snapshot Frame">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- Audio Mute / Listen Toggle -->
        <button class="tile-btn btn-tile-mute" title="Audio Listen / Mute">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>

        <!-- Focus / Maximize Feed -->
        <button class="tile-btn btn-tile-focus" title="Focus Single Camera">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        <!-- Individual Device Sleep Timer -->
        <div class="tile-sleep-wrap">
          <button class="tile-btn btn-tile-sleep" title="Sleep Timer for ${escapeHtml(deviceId)}">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span class="tile-sleep-badge" style="display: none;"></span>
          </button>
          <div class="tile-sleep-menu" style="display: none;">
            <div class="sleep-menu-header">Sleep Timer [${escapeHtml(deviceId)}]</div>
            <button class="sleep-menu-item active" data-minutes="0">Off (Stay Awake)</button>
            <button class="sleep-menu-item" data-minutes="5">5 min</button>
            <button class="sleep-menu-item" data-minutes="15">15 min</button>
            <button class="sleep-menu-item" data-minutes="30">30 min</button>
            <button class="sleep-menu-item" data-minutes="60">1 hour</button>
            <button class="sleep-menu-item" data-minutes="custom">Custom...</button>
          </div>
        </div>

        <!-- Disconnect Device -->
        <button class="tile-btn danger btn-tile-kick" title="Disconnect Camera">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="tile-video-wrap">
      <video class="tile-video" autoplay playsinline muted></video>

      <!-- Waiting / Connecting Overlay -->
      <div class="tile-waiting-overlay">
        <div class="tile-waiting-spinner"></div>
        <div style="font-size: 0.8rem; font-weight: 600; color: #ffffff;">Awaiting Hardware Consent</div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary);">User must tap "Allow & Start Camera" on device</div>
      </div>

      <!-- Live Badge -->
      <div class="tile-live-badge" style="display: none;">
        <span class="badge-dot"></span>
        <span>REC LIVE</span>
      </div>

      <!-- Tile Telemetry HUD -->
      <div class="tile-hud" style="display: none;">
        <span>FPS: <strong class="tile-fps">--</strong></span>
        <span>RES: <strong class="tile-res">--</strong></span>
        <span>RATE: <strong class="tile-rate">--</strong></span>
      </div>
    </div>
  `;

  const videoEl = cardEl.querySelector('.tile-video');
  const btnSnap = cardEl.querySelector('.btn-tile-snap');
  const btnMute = cardEl.querySelector('.btn-tile-mute');
  const btnFocus = cardEl.querySelector('.btn-tile-focus');
  const btnKick = cardEl.querySelector('.btn-tile-kick');
  const btnSleep = cardEl.querySelector('.btn-tile-sleep');
  const sleepMenu = cardEl.querySelector('.tile-sleep-menu');

  btnSnap.addEventListener('click', (e) => {
    e.stopPropagation();
    captureTileSnapshot(deviceId);
  });

  btnMute.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTileAudio(deviceId);
  });

  btnFocus.addEventListener('click', (e) => {
    e.stopPropagation();
    focusCamera(deviceId);
  });

  btnKick.addEventListener('click', (e) => {
    e.stopPropagation();
    disconnectDevice(deviceId);
  });

  if (btnSleep && sleepMenu) {
    btnSleep.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.tile-sleep-menu').forEach(m => {
        if (m !== sleepMenu) m.style.display = 'none';
      });
      if (masterSleepTimerMenu) masterSleepTimerMenu.style.display = 'none';
      sleepMenu.style.display = sleepMenu.style.display === 'block' ? 'none' : 'block';
    });

    sleepMenu.querySelectorAll('.sleep-menu-item').forEach(itemBtn => {
      itemBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sleepMenu.style.display = 'none';
        const val = itemBtn.getAttribute('data-minutes');
        if (val === 'custom') {
          const input = prompt(`Enter sleep duration in minutes for [${cleanName}]:`, '45');
          if (input && !isNaN(input) && Number(input) > 0) {
            setDeviceSleepTimer(deviceId, Number(input));
          }
        } else {
          setDeviceSleepTimer(deviceId, Number(val));
        }
      });
    });
  }

  cameraGrid.appendChild(cardEl);

  const initialSleepTimer = masterSleepTimer && masterSleepTimer.active
    ? { ...masterSleepTimer }
    : { active: false, expiresAt: null, durationMinutes: null };

  const peer = {
    deviceId,
    deviceName: cleanName,
    pc: null,
    stream: null,
    videoEl,
    cardEl,
    statsMonitor: null,
    stats: { fps: 0, bitrate: 0, width: 0, height: 0, rtt: 0 },
    isMuted: true,
    status: 'waiting',
    sleepTimer: initialSleepTimer,
  };

  cameraPeers.set(deviceId, peer);
  updateCameraMatrixCounts();
  return peer;
}

// Focus Mode vs Grid Mode
function focusCamera(deviceId) {
  if (focusedDeviceId === deviceId) {
    // Unfocus back to grid
    restoreGridView();
    return;
  }

  focusedDeviceId = deviceId;
  currentViewMode = 'focus';

  cameraPeers.forEach((peer, id) => {
    if (id === deviceId) {
      peer.cardEl.classList.add('focused');
      // Add return banner if not already there
      let banner = peer.cardEl.querySelector('.focus-return-banner');
      if (!banner) {
        banner = document.createElement('button');
        banner.className = 'focus-return-banner';
        banner.innerHTML = `
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Grid View</span>
        `;
        banner.addEventListener('click', (e) => {
          e.stopPropagation();
          restoreGridView();
        });
        peer.cardEl.appendChild(banner);
      }
      banner.style.display = 'inline-flex';
    } else {
      peer.cardEl.classList.remove('focused');
      const banner = peer.cardEl.querySelector('.focus-return-banner');
      if (banner) banner.style.display = 'none';
    }
  });

  if (btnModeGrid) btnModeGrid.classList.remove('active');
  if (btnModeFocus) btnModeFocus.classList.add('active');
}

function restoreGridView() {
  focusedDeviceId = null;
  currentViewMode = 'grid';

  cameraPeers.forEach(peer => {
    peer.cardEl.classList.remove('focused');
    const banner = peer.cardEl.querySelector('.focus-return-banner');
    if (banner) banner.style.display = 'none';
  });

  if (btnModeGrid) btnModeGrid.classList.add('active');
  if (btnModeFocus) btnModeFocus.classList.remove('active');
}

// Disconnect single device initiated by host
function disconnectDevice(deviceId) {
  const peer = cameraPeers.get(deviceId);
  const name = peer ? peer.deviceName : deviceId;

  if (confirm(`Disconnect camera [${name}] from surveillance matrix?`)) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'disconnect-device',
        sessionId: currentSessionId,
        deviceId,
      }));
    }
    teardownCameraPeer(deviceId);
    logEvent('SYS', `Camera kicked by operator: ${name} [${deviceId}]`);
    showToast(`Disconnected camera ${name}`);
  }
}

function teardownCameraPeer(deviceId) {
  if (!cameraPeers.has(deviceId)) return;
  const peer = cameraPeers.get(deviceId);

  if (peer.statsMonitor) peer.statsMonitor.stop();
  if (peer.pc) {
    try { peer.pc.close(); } catch (e) {}
  }
  if (peer.videoEl) {
    peer.videoEl.srcObject = null;
  }
  if (peer.cardEl && peer.cardEl.parentNode) {
    peer.cardEl.parentNode.removeChild(peer.cardEl);
  }

  cameraPeers.delete(deviceId);
  if (focusedDeviceId === deviceId) {
    restoreGridView();
  }
  updateCameraMatrixCounts();
}

// Toggle audio listening for single device
function toggleTileAudio(deviceId) {
  const peer = cameraPeers.get(deviceId);
  if (!peer || !peer.videoEl) return;

  peer.isMuted = !peer.isMuted;
  peer.videoEl.muted = peer.isMuted;

  const btnMute = peer.cardEl.querySelector('.btn-tile-mute');
  if (btnMute) btnMute.classList.toggle('active', !peer.isMuted);

  showToast(`${peer.deviceName}: ${peer.isMuted ? 'Muted' : 'Audio Listening'}`);
  logEvent('AUDIO', `${peer.isMuted ? 'Muted' : 'Listening to'} ${peer.deviceName} [${deviceId}]`);
}

// Capture frame snapshot for single device
function captureTileSnapshot(deviceId) {
  const peer = cameraPeers.get(deviceId);
  if (!peer || !peer.videoEl || !peer.videoEl.videoWidth) {
    return showToast('Cannot snapshot: camera stream not active yet');
  }

  const video = peer.videoEl;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Digital Watermark
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8;
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  ctx.fillText(`SENTINEL // ${peer.deviceName} [${deviceId}] // ${time} UTC`, 24, canvas.height - 28);

  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/jpeg', 0.95);
  a.download = `sentinel_${deviceId}_${Date.now()}.jpg`;
  a.click();

  showToast(`Snapshot saved: ${peer.deviceName}`);
  logEvent('SNAP', `Snapshot captured from ${peer.deviceName} [${deviceId}]`);
  if (window.sentinelAudio) window.sentinelAudio.play('snapshot');
}

// WebSocket / Serverless Universal Signaling
function connectWebSocket(sessionId) {
  if (window.UniversalSignalingChannel) {
    ws = new window.UniversalSignalingChannel({
      sessionId,
      role: 'host',
    });
  } else {
    const wsUrl = window.getWebSocketUrl();
    ws = new WebSocket(wsUrl);
  }

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
        logEvent('SYS', `Signaling channel open (#${msg.sessionId})`);
        if (msg.sleepTimer) {
          masterSleepTimer = msg.sleepTimer;
          updateMasterSleepTimerDisplay(Date.now());
        }
        if (msg.cameras && Array.isArray(msg.cameras)) {
          msg.cameras.forEach(c => {
            const peer = getOrCreateCameraTile(c.deviceId, c.deviceName);
            if (c.sleepTimer) {
              peer.sleepTimer = c.sleepTimer;
              updateTileSleepDisplay(peer, Date.now());
            }
          });
        }
        break;

      case 'camera-joined': {
        const peer = getOrCreateCameraTile(msg.deviceId, msg.deviceName);
        if (msg.sleepTimer) {
          peer.sleepTimer = msg.sleepTimer;
          updateTileSleepDisplay(peer, Date.now());
        }
        showToast(`Device paired: ${msg.deviceName} [${msg.deviceId}]`);
        logEvent('PEER', `Device joined grid: ${msg.deviceName} [${msg.deviceId}]`);
        if (window.sentinelAudio) window.sentinelAudio.play('connect');
        break;
      }

      case 'camera-ready': {
        const peer = getOrCreateCameraTile(msg.deviceId, msg.deviceName);
        peer.status = 'ready';
        showToast(`Camera permission granted on [${msg.deviceId}]`);
        logEvent('CONSENT', `Camera permission granted: ${peer.deviceName} [${msg.deviceId}] (${msg.facingMode || 'Lens'} / ${msg.resolution || '720p'})`);
        const overlayText = peer.cardEl.querySelector('.tile-waiting-overlay div:nth-child(2)');
        if (overlayText) overlayText.textContent = 'Establishing Encrypted WebRTC Link...';
        break;
      }

      case 'offer':
        await handleRemoteOffer(msg.deviceId, msg.sdp);
        break;

      case 'ice-candidate':
        if (msg.deviceId && cameraPeers.has(msg.deviceId)) {
          const peer = cameraPeers.get(msg.deviceId);
          if (peer.pc && msg.candidate) {
            try {
              await peer.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.error('Error adding ICE candidate:', e);
            }
          }
        }
        break;

      case 'sleep-timer-updated':
        if (msg.target === 'all') {
          masterSleepTimer = msg.sleepTimer || { active: false, expiresAt: null, durationMinutes: null };
          updateMasterSleepTimerDisplay(Date.now());
          cameraPeers.forEach(peer => {
            peer.sleepTimer = { ...masterSleepTimer };
            updateTileSleepDisplay(peer, Date.now());
          });
          if (masterSleepTimer.active) {
            logEvent('SLEEP', `Master sleep timer updated: ${masterSleepTimer.durationMinutes}m for all devices`);
          } else {
            logEvent('SLEEP', 'Master sleep timer turned Off (stay awake)');
          }
        } else if (msg.deviceId && cameraPeers.has(msg.deviceId)) {
          const peer = cameraPeers.get(msg.deviceId);
          peer.sleepTimer = msg.sleepTimer || { active: false, expiresAt: null, durationMinutes: null };
          updateTileSleepDisplay(peer, Date.now());
          if (peer.sleepTimer.active) {
            logEvent('SLEEP', `Sleep timer set for ${peer.deviceName} [${msg.deviceId}]: ${peer.sleepTimer.durationMinutes}m`);
          } else {
            logEvent('SLEEP', `Sleep timer canceled for ${peer.deviceName} [${msg.deviceId}]`);
          }
        }
        break;

      case 'all-sleep':
        logEvent('SLEEP', 'Master sleep timer reached. Powering down all camera feeds.');
        showToast('Master sleep timer reached: all cameras put to sleep');
        if (window.sentinelAudio) window.sentinelAudio.play('disconnect');
        cameraPeers.forEach(peer => teardownCameraPeer(peer.deviceId));
        updateCameraMatrixCounts();
        break;

      case 'camera-disconnected':
        teardownCameraPeer(msg.deviceId);
        showToast(`Camera [${msg.deviceId}] disconnected`);
        logEvent('WARN', `Camera device disconnected: [${msg.deviceId}]`);
        if (window.sentinelAudio) window.sentinelAudio.play('disconnect');
        break;

      case 'session-extended':
        sessionExpiresAt = msg.expiresAt;
        if (btnExtendSession) btnExtendSession.style.display = 'none';
        showToast('Session extended (+10 mins)');
        logEvent('SYS', 'Session duration extended +10 minutes');
        break;

      case 'session-ended':
        handleSessionEnded(msg.reason);
        logEvent('TERM', msg.reason || 'Session terminated');
        if (window.sentinelAudio) window.sentinelAudio.play('disconnect');
        break;

      case 'session-expired':
        handleSessionExpired();
        logEvent('TERM', 'Session expired by countdown');
        if (window.sentinelAudio) window.sentinelAudio.play('disconnect');
        break;
    }
  };

  ws.onclose = () => {
    console.log('[Host] WebSocket connection closed');
  };
}

// WebRTC PeerConnection Setup for specific Camera Device
async function handleRemoteOffer(deviceId, sdp) {
  const peer = getOrCreateCameraTile(deviceId);

  if (peer.pc) {
    try { peer.pc.close(); } catch (e) {}
  }

  const pc = new RTCPeerConnection(window.RTC_CONFIG);
  peer.pc = pc;

  pc.onicecandidate = (event) => {
    if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ice-candidate',
        sessionId: currentSessionId,
        deviceId,
        candidate: event.candidate,
      }));
    }
  };

  pc.ontrack = (event) => {
    console.log(`[Host] Received video track for [${deviceId}]:`, event.streams[0]);
    peer.stream = event.streams[0];
    peer.videoEl.srcObject = peer.stream;
    peer.status = 'live';

    // Hide waiting overlay, show live badge and hud
    const waitOverlay = peer.cardEl.querySelector('.tile-waiting-overlay');
    if (waitOverlay) waitOverlay.style.display = 'none';

    const liveBadge = peer.cardEl.querySelector('.tile-live-badge');
    if (liveBadge) liveBadge.style.display = 'flex';

    const hudEl = peer.cardEl.querySelector('.tile-hud');
    if (hudEl) hudEl.style.display = 'flex';

    updateCameraMatrixCounts();
    showToast(`Live feed active: ${peer.deviceName} [${deviceId}]`);

    // Individual camera stats monitoring
    if (peer.statsMonitor) peer.statsMonitor.stop();
    peer.statsMonitor = new window.RTCStatsMonitor(pc, (stats) => {
      peer.stats = stats;
      const fpsEl = peer.cardEl.querySelector('.tile-fps');
      const rateEl = peer.cardEl.querySelector('.tile-rate');
      const resEl = peer.cardEl.querySelector('.tile-res');

      if (fpsEl) fpsEl.textContent = `${stats.fps}fps`;
      if (rateEl) rateEl.textContent = `${stats.bitrate}k`;
      if (resEl) resEl.textContent = stats.width ? `${stats.width}x${stats.height}` : '720p';
    });
    peer.statsMonitor.start();
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`[Host] ICE State for [${deviceId}]:`, pc.iceConnectionState);
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
      peer.status = 'waiting';
      const liveBadge = peer.cardEl.querySelector('.tile-live-badge');
      if (liveBadge) liveBadge.style.display = 'none';
      updateCameraMatrixCounts();
    }
  };

  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'answer',
      sessionId: currentSessionId,
      deviceId,
      sdp: pc.localDescription,
    }));
  }
}

function handleSessionEnded(reason) {
  updateStatus('ended', 'SESSION TERMINATED');
  showToast(reason || 'Session ended');
  cleanupCurrentSession();
}

function handleSessionExpired() {
  updateStatus('ended', 'SESSION EXPIRED');
  showToast('Session expired. Generate a new QR code.');
  cleanupCurrentSession();
}

function cleanupCurrentSession() {
  if (timerInterval) clearInterval(timerInterval);

  cameraPeers.forEach(peer => {
    if (peer.statsMonitor) peer.statsMonitor.stop();
    if (peer.pc) {
      try { peer.pc.close(); } catch (e) {}
    }
    if (peer.videoEl) peer.videoEl.srcObject = null;
  });
  cameraPeers.clear();

  if (cameraGrid) cameraGrid.innerHTML = '';
  if (ws) {
    try { ws.close(); } catch (e) {}
    ws = null;
  }
  updateCameraMatrixCounts();
}

// User Actions & Event Listeners
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

  // End Entire Session Button
  btnEndSession.addEventListener('click', async () => {
    if (!currentSessionId) return;
    if (confirm('Are you sure you want to end this surveillance session? All connected cameras will be disconnected.')) {
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

  // View Mode Buttons (Grid vs Focus)
  if (btnModeGrid) {
    btnModeGrid.addEventListener('click', () => {
      restoreGridView();
    });
  }
  if (btnModeFocus) {
    btnModeFocus.addEventListener('click', () => {
      const firstLive = Array.from(cameraPeers.keys())[0];
      if (firstLive) {
        focusCamera(firstLive);
      } else {
        showToast('No active cameras to focus yet');
      }
    });
  }

  // Fullscreen toggle
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      videoStage.requestFullscreen().catch(err => alert(err.message));
    } else {
      document.exitFullscreen();
    }
  });

  // Global Snapshot Frame (Focus camera or first live camera)
  btnSnapshot.addEventListener('click', () => {
    const targetId = focusedDeviceId || Array.from(cameraPeers.keys())[0];
    if (!targetId) {
      return showToast('No active camera feed to capture');
    }
    captureTileSnapshot(targetId);
  });

  // Video Clip Recording Toggle (Active/Focus Camera)
  if (btnRecord) {
    btnRecord.addEventListener('click', () => {
      toggleGlobalVideoRecording();
    });
  }

  // Global Audio Listen / Mute Toggle
  if (btnMuteAudio) {
    btnMuteAudio.addEventListener('click', () => {
      isAudioMuted = !isAudioMuted;
      cameraPeers.forEach(peer => {
        peer.isMuted = isAudioMuted;
        if (peer.videoEl) peer.videoEl.muted = isAudioMuted;
        const btnMute = peer.cardEl?.querySelector('.btn-tile-mute');
        if (btnMute) btnMute.classList.toggle('active', !isAudioMuted);
      });
      btnMuteAudio.classList.toggle('active', !isAudioMuted);
      showToast(isAudioMuted ? 'All room audio muted' : 'Listening to live audio');
      logEvent('AUDIO', isAudioMuted ? 'Host muted audio listening' : 'Host listening to live room audio');
    });
  }

  // Extend Session Button (+10m)
  if (btnExtendSession) {
    btnExtendSession.addEventListener('click', () => {
      extendCurrentSession();
    });
  }

  // Clear Event Log
  if (btnClearLog) {
    btnClearLog.addEventListener('click', () => {
      if (eventLogContainer) {
        eventLogContainer.innerHTML = '<div><span style="color: var(--text-tertiary);">[SYS]</span> Log cleared.</div>';
      }
    });
  }

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

  // Master Sleep Timer Trigger Click (QR widget and Viewport button)
  const toggleMasterSleepMenu = (e) => {
    e.stopPropagation();
    document.querySelectorAll('.tile-sleep-menu').forEach(m => m.style.display = 'none');
    if (masterSleepTimerMenu) {
      masterSleepTimerMenu.style.display = masterSleepTimerMenu.style.display === 'block' ? 'none' : 'block';
    }
  };

  if (btnMasterSleepTimer) btnMasterSleepTimer.addEventListener('click', toggleMasterSleepMenu);
  if (btnViewportSleepTrigger) btnViewportSleepTrigger.addEventListener('click', toggleMasterSleepMenu);

  if (masterSleepTimerMenu) {
    masterSleepTimerMenu.querySelectorAll('.sleep-menu-item').forEach(itemBtn => {
      itemBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        masterSleepTimerMenu.style.display = 'none';
        const val = itemBtn.getAttribute('data-minutes');
        if (val === 'custom') {
          const input = prompt('Enter sleep duration in minutes for ALL cameras:', '45');
          if (input && !isNaN(input) && Number(input) > 0) {
            setMasterSleepTimer(Number(input));
          }
        } else {
          setMasterSleepTimer(Number(val));
        }
      });
    });
  }

  // Dismiss dropdowns on outside click
  document.addEventListener('click', () => {
    if (masterSleepTimerMenu) masterSleepTimerMenu.style.display = 'none';
    document.querySelectorAll('.tile-sleep-menu').forEach(m => m.style.display = 'none');
  });
}

function toggleGlobalVideoRecording() {
  const targetId = focusedDeviceId || Array.from(cameraPeers.keys())[0];
  const peer = targetId ? cameraPeers.get(targetId) : null;

  if (!peer || !peer.stream || !peer.stream.active) {
    showToast('Cannot record: No active video stream to capture');
    return;
  }

  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(recordInterval);
    btnRecord.classList.remove('active');
    btnRecord.style.borderColor = '';
    recordTimer.style.display = 'none';
    showToast(`Video recording saved for ${peer.deviceName}`);
    logEvent('REC', `Video recording saved (${recordSeconds}s)`);
    if (window.sentinelAudio) window.sentinelAudio.play('record');
  } else {
    recordedChunks = [];
    recordSeconds = 0;
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
      mediaRecorder = new MediaRecorder(peer.stream, { mimeType });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sentinel_${peer.deviceId}_clip_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start(1000);
      btnRecord.classList.add('active');
      btnRecord.style.borderColor = '#ef4444';
      recordTimer.style.display = 'inline-block';
      recordTimer.textContent = 'REC 00:00';

      recordInterval = setInterval(() => {
        recordSeconds++;
        const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
        const secs = String(recordSeconds % 60).padStart(2, '0');
        recordTimer.textContent = `REC ${mins}:${secs}`;
      }, 1000);

      showToast(`Recording feed from ${peer.deviceName}...`);
      logEvent('REC', `Started recording clip for [${peer.deviceId}]`);
      if (window.sentinelAudio) window.sentinelAudio.play('record');
    } catch (err) {
      console.error('MediaRecorder error:', err);
      showToast('Recording failed: ' + err.message);
    }
  }
}

async function extendCurrentSession() {
  if (!currentSessionId) return;
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/extend`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      sessionExpiresAt = data.expiresAt;
      startCountdown(data.expiresAt);
      btnExtendSession.style.display = 'none';
      countdownDisplay.parentElement.classList.remove('expired');
      showToast('Session extended by +10 minutes');
      logEvent('AUTH', 'Session duration extended +10 minutes');
    }
  } catch (err) {
    showToast('Failed to extend session');
  }
}

window.addEventListener('DOMContentLoaded', initHost);
