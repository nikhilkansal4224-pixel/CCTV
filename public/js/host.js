// SENTINEL // Host Monitor Script (Multi-Camera Matrix Gateway)

let currentSessionId = null;
let currentSession = null;
let sessionExpiresAt = null;
let timerInterval = null;
let ws = null;
let selectedProtocol = window.location.protocol === 'https:' ? 'https' : 'https';
let selectedHost = window.location.hostname;

// Persistent Host Viewer Identity for multi-device sync
let hostViewerId = sessionStorage.getItem('sentinel_host_viewer_id');
if (!hostViewerId) {
  hostViewerId = 'HOST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  sessionStorage.setItem('sentinel_host_viewer_id', hostViewerId);
}
let currentUserId = null;

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

// Initialize Dashboard (Direct open access, zero login required)
async function initHost() {
  currentUserId = 'USR-OPERATOR';
  const userIdChip = document.getElementById('userIdChip');
  if (userIdChip) userIdChip.textContent = 'ONLINE';
  if (userNameEl) userNameEl.textContent = 'Sentinel Station';
  if (userRoleEl) userRoleEl.textContent = 'Direct Access';

  await loadNetworkInfo();
  await createNewSession();
  setupEventListeners();
}

async function loadNetworkInfo() {
  try {
    const res = await fetch('/api/network-info');
    const data = await res.json();
    
    if (networkHostSelect) {
      networkHostSelect.innerHTML = '';

      const currentHostname = window.location.hostname;
      const isCloudDeployment = currentHostname && currentHostname !== 'localhost' && currentHostname !== '127.0.0.1' && !currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/);

      if (isCloudDeployment || data.isVercel) {
        const cloudHostVal = window.location.host || data.currentHost;
        const cloudOpt = document.createElement('option');
        cloudOpt.value = cloudHostVal;
        cloudOpt.textContent = `Cloud / Vercel (${cloudHostVal})`;
        cloudOpt.selected = true;
        selectedHost = cloudHostVal;
        networkHostSelect.appendChild(cloudOpt);
      } else {
        // Offer Public Cloud WAN relay for mobile phones streaming across 4G/5G cellular
        const wanOpt = document.createElement('option');
        wanOpt.value = 'cctv-supabase.vercel.app';
        wanOpt.textContent = '🌐 Public Cloud WAN (4G/5G Cellular, No Wi-Fi Needed)';
        networkHostSelect.appendChild(wanOpt);
      }

      if (data.allIps) {
        data.allIps.forEach(ip => {
          const opt = document.createElement('option');
          opt.value = ip;
          opt.textContent = ip === 'localhost' ? 'Localhost (This PC)' : `LAN: ${ip}`;
          if (!isCloudDeployment && !data.isVercel) {
            if (ip !== 'localhost' && !selectedHost.includes('.')) {
              opt.selected = true;
              selectedHost = ip;
            } else if (ip === selectedHost) {
              opt.selected = true;
            }
          }
          networkHostSelect.appendChild(opt);
        });
      }

      if (!selectedHost && data.localIp) {
        selectedHost = data.localIp;
        networkHostSelect.value = selectedHost;
      }
    }

    if (window.location.protocol === 'https:' || data.currentProtocol === 'https') {
      selectedProtocol = 'https';
    }

    if (networkProtocolSelect) {
      networkProtocolSelect.value = selectedProtocol;
    }
  } catch (err) {
    console.warn('Network info load failed:', err);
  }
}

async function createNewSession(forceNew = false) {
  cleanupCurrentSession();

  updateStatus('waiting', 'GENERATING MATRIX SESSION...');

  try {
    const queryParams = new URLSearchParams({
      protocol: selectedProtocol,
      host: selectedHost,
      forceNew: forceNew ? 'true' : 'false',
    });

    const res = await fetch(`/api/sessions/create?${queryParams.toString()}`, { method: 'POST' });
    const data = await res.json();

    currentSessionId = data.sessionId;
    currentSession = data;
    sessionExpiresAt = data.expiresAt;
    if (data.userId && !currentUserId) {
      currentUserId = data.userId;
      const userIdChip = document.getElementById('userIdChip');
      if (userIdChip) userIdChip.textContent = currentUserId;
    }

    if (sessionUrlInput) sessionUrlInput.value = data.cameraUrl;
    if (btnOpenLink) btnOpenLink.href = data.cameraUrl;

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
  if (qrCodeContainer) qrCodeContainer.innerHTML = '<div class="qr-skeleton">Loading QR...</div>';
  try {
    const queryParams = new URLSearchParams({
      protocol: selectedProtocol,
      host: selectedHost,
    });
    const qrRes = await fetch(`/api/sessions/${sessionId}/qr?${queryParams.toString()}`);
    if (!qrRes.ok) throw new Error('QR fetch failed');
    const svgText = await qrRes.text();
    if (qrCodeContainer) qrCodeContainer.innerHTML = svgText;
  } catch (err) {
    if (qrCodeContainer) qrCodeContainer.innerHTML = '<div class="qr-skeleton">Failed to render QR</div>';
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
        <!-- Remote Torch Toggle -->
        <button class="tile-btn btn-tile-torch" title="Toggle Remote Phone Flashlight">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>

        <!-- Remote Camera Lens Flip -->
        <button class="tile-btn btn-tile-flip" title="Flip Remote Camera (Front/Rear)">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

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
      <!-- Real-Time AI Entity Detection Overlay Canvas -->
      <canvas class="tile-canvas-ai"></canvas>

      <!-- Waiting / Connecting Overlay -->
      <div class="tile-waiting-overlay">
        <div class="tile-waiting-spinner"></div>
        <div style="font-size: 0.8rem; font-weight: 600; color: #ffffff;">Awaiting Hardware Consent</div>
        <div style="font-size: 0.7rem; color: var(--text-tertiary);">User must tap "Allow & Start Camera" on device</div>
      </div>

      <!-- Real-Time CCTV On-Screen Display (OSD) -->
      <div class="tile-osd-bar">
        <span class="tile-osd-time">--:--:--</span>
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

      <!-- AI Entity Detection Telemetry Pill -->
      <div class="tile-entity-pill" style="display: none;">
        <span class="ai-pill-dot"></span>
        <span class="ai-pill-text">AI ACTIVE</span>
      </div>
    </div>
  `;

  const videoEl = cardEl.querySelector('.tile-video');
  const canvasAi = cardEl.querySelector('.tile-canvas-ai');
  const entityPill = cardEl.querySelector('.tile-entity-pill');
  const btnSnap = cardEl.querySelector('.btn-tile-snap');
  const btnMute = cardEl.querySelector('.btn-tile-mute');
  const btnFocus = cardEl.querySelector('.btn-tile-focus');
  const btnKick = cardEl.querySelector('.btn-tile-kick');
  const btnSleep = cardEl.querySelector('.btn-tile-sleep');
  const sleepMenu = cardEl.querySelector('.tile-sleep-menu');

  const btnTorch = cardEl.querySelector('.btn-tile-torch');
  const btnFlip = cardEl.querySelector('.btn-tile-flip');

  if (btnTorch) {
    btnTorch.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'remote-toggle-torch',
          sessionId: currentSessionId,
          deviceId,
        }));
        showToast(`Sent torch toggle signal to [${cleanName}]`);
      }
    });
  }

  if (btnFlip) {
    btnFlip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'remote-flip-camera',
          sessionId: currentSessionId,
          deviceId,
        }));
        showToast(`Flipping camera lens on [${cleanName}]...`);
      }
    });
  }

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

  if (cameraGrid) cameraGrid.appendChild(cardEl);

  const initialSleepTimer = masterSleepTimer && masterSleepTimer.active
    ? { ...masterSleepTimer }
    : { active: false, expiresAt: null, durationMinutes: null };

  const peer = {
    deviceId,
    deviceName: cleanName,
    pc: null,
    stream: null,
    videoEl,
    canvasAi,
    entityPill,
    cardEl,
    statsMonitor: null,
    stats: { fps: 0, bitrate: 0, width: 0, height: 0, rtt: 0 },
    isMuted: true,
    status: 'waiting',
    sleepTimer: initialSleepTimer,
    trackedTargets: [],
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

let patrolInterval = null;
let isPatrolActive = false;

function togglePatrolMode() {
  isPatrolActive = !isPatrolActive;
  const btn = document.getElementById('btnModePatrol');
  if (btn) btn.classList.toggle('active', isPatrolActive);

  if (isPatrolActive) {
    if (cameraGrid) cameraGrid.classList.remove('quad-layout');
    const qBtn = document.getElementById('btnModeQuad');
    if (qBtn) qBtn.classList.remove('active');
    showToast('Auto-Patrol Mode ACTIVE: Rotating cameras every 8s');
    startPatrolCycle();
  } else {
    stopPatrolCycle();
    restoreGridView();
    showToast('Auto-Patrol Mode OFF');
  }
}

function startPatrolCycle() {
  if (patrolInterval) clearInterval(patrolInterval);
  let currentIndex = 0;
  const ids = Array.from(cameraPeers.keys());
  if (ids.length > 0) focusCamera(ids[0]);

  patrolInterval = setInterval(() => {
    const list = Array.from(cameraPeers.keys());
    if (list.length === 0) return;
    currentIndex = (currentIndex + 1) % list.length;
    focusCamera(list[currentIndex]);
  }, 8000);
}

function stopPatrolCycle() {
  if (patrolInterval) {
    clearInterval(patrolInterval);
    patrolInterval = null;
  }
  isPatrolActive = false;
  const btn = document.getElementById('btnModePatrol');
  if (btn) btn.classList.remove('active');
}

function toggleQuadLayout() {
  stopPatrolCycle();
  restoreGridView();
  const isQuad = cameraGrid ? cameraGrid.classList.toggle('quad-layout') : false;
  const qBtn = document.getElementById('btnModeQuad');
  if (qBtn) qBtn.classList.toggle('active', isQuad);
  if (btnModeGrid) btnModeGrid.classList.toggle('active', !isQuad);
  showToast(isQuad ? 'Quad View (2x2) Activated' : 'Standard Grid View Activated');
}

// Disconnect single device initiated by host
function disconnectDevice(deviceId) {
  const peer = cameraPeers.get(deviceId);
  const name = peer ? peer.deviceName : deviceId;

  if (confirm(`Disconnect camera [${name}] from surveillance matrix?`)) {
    if (!peer?.isLocalHostCam && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'disconnect-device',
        sessionId: currentSessionId,
        deviceId,
      }));
    }
    teardownCameraPeer(deviceId);
    logEvent('SYS', `Camera disconnected: ${name} [${deviceId}]`);
    showToast(`Disconnected camera ${name}`);
  }
}

function teardownCameraPeer(deviceId) {
  if (!cameraPeers.has(deviceId)) return;
  const peer = cameraPeers.get(deviceId);

  if (peer.isIpCam) {
    if (peer.imgEl) {
      peer.imgEl.src = '';
      try { peer.imgEl.remove(); } catch (e) {}
    }
  }

  if (peer.stream) {
    try {
      peer.stream.getTracks().forEach(t => t.stop());
    } catch (e) {}
  }
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
  if (!peer) return showToast('Camera device not found');

  const isIpCam = peer.isIpCam && peer.imgEl;
  const media = isIpCam ? peer.imgEl : peer.videoEl;
  const naturalWidth = media ? (media.videoWidth || media.naturalWidth) : 0;
  const naturalHeight = media ? (media.videoHeight || media.naturalHeight) : 0;

  if (!media || !naturalWidth) {
    return showToast('Cannot snapshot: camera stream not active yet');
  }

  const canvas = document.createElement('canvas');
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(media, 0, 0, canvas.width, canvas.height);

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
      hostViewerId,
      userId: currentUserId,
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

      case 'error':
        logEvent('WARN', `Session signaling notice: ${msg.message}`);
        if (msg.message && (msg.message.includes('Session not found') || msg.message.includes('Invalid or expired session'))) {
          showToast('Session expired or invalidated. Regenerating fresh gateway session...');
          setTimeout(() => createNewSession(true), 1200);
        }
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
        hostViewerId,
        candidate: event.candidate,
      }));
    }
  };

  pc.ontrack = (event) => {
    console.log(`[Host] Received live video track for [${deviceId}]:`, event.streams[0]);
    peer.stream = event.streams[0];
    peer.videoEl.srcObject = peer.stream;
    peer.videoEl.style.display = 'block';
    if (peer.imgEl) peer.imgEl.style.display = 'none';
    peer.videoEl.muted = true;
    peer.videoEl.playsInline = true;
    peer.videoEl.autoplay = true;

    // Trigger video playback immediately to satisfy browser autoplay requirements
    const playPromise = peer.videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`[Host] Autoplay deferred for [${deviceId}], awaiting interaction:`, err);
      });
    }

    peer.status = 'live';

    // Hide waiting overlay, show live badge and telemetry hud
    const waitOverlay = peer.cardEl.querySelector('.tile-waiting-overlay');
    if (waitOverlay) waitOverlay.style.display = 'none';

    const liveBadge = peer.cardEl.querySelector('.tile-live-badge');
    if (liveBadge) {
      liveBadge.style.display = 'inline-flex';
      liveBadge.innerHTML = `<span class="badge-dot"></span><span>REC LIVE</span>`;
    }

    const hudEl = peer.cardEl.querySelector('.tile-hud');
    if (hudEl) hudEl.style.display = 'flex';

    peer.videoEl.addEventListener('loadedmetadata', () => {
      const resEl = peer.cardEl.querySelector('.tile-res');
      if (resEl && peer.videoEl.videoWidth) {
        resEl.textContent = `${peer.videoEl.videoWidth}x${peer.videoEl.videoHeight}`;
      }
      peer.videoEl.play().catch(() => {});
    });

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
      hostViewerId,
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
    if (peer.stream) {
      try { peer.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
    }
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
  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', async () => {
      const urlToCopy = sessionUrlInput ? sessionUrlInput.value : (currentSession?.cameraUrl || '');
      try {
        await navigator.clipboard.writeText(urlToCopy);
        showToast('Camera link copied to clipboard!');
      } catch (e) {
        if (sessionUrlInput) {
          sessionUrlInput.select();
          document.execCommand('copy');
        }
        showToast('Camera link copied!');
      }
    });
  }

  // End Entire Session Button
  if (btnEndSession) {
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
  }

  // New QR / Session Button (Forces generation of fresh session token)
  if (btnNewSession) {
    btnNewSession.addEventListener('click', () => {
      createNewSession(true);
    });
  }

  // View Mode Buttons (Grid vs Focus)
  if (btnModeGrid) {
    btnModeGrid.addEventListener('click', () => {
      stopPatrolCycle();
      if (cameraGrid) cameraGrid.classList.remove('quad-layout');
      const qBtn = document.getElementById('btnModeQuad');
      if (qBtn) qBtn.classList.remove('active');
      restoreGridView();
    });
  }

  const btnModeQuad = document.getElementById('btnModeQuad');
  if (btnModeQuad) {
    btnModeQuad.addEventListener('click', toggleQuadLayout);
  }

  const btnModePatrol = document.getElementById('btnModePatrol');
  if (btnModePatrol) {
    btnModePatrol.addEventListener('click', togglePatrolMode);
  }

  if (btnModeFocus) {
    btnModeFocus.addEventListener('click', () => {
      stopPatrolCycle();
      const firstLive = Array.from(cameraPeers.keys())[0];
      if (firstLive) {
        focusCamera(firstLive);
      } else {
        showToast('No active cameras to focus yet');
      }
    });
  }

  // Fullscreen toggle
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (videoStage && videoStage.requestFullscreen) {
          videoStage.requestFullscreen().catch(err => alert(err.message));
        }
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });
  }

  // Global Snapshot Frame (Focus camera or first live camera)
  if (btnSnapshot) {
    btnSnapshot.addEventListener('click', () => {
      const targetId = focusedDeviceId || Array.from(cameraPeers.keys())[0];
      if (!targetId) {
        return showToast('No active camera feed to capture');
      }
      captureTileSnapshot(targetId);
    });
  }

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

  // Host Add Local Camera of Current Device buttons
  const btnHostAddLocalCamera = document.getElementById('btnHostAddLocalCamera');
  const btnQuickAddHostCam = document.getElementById('btnQuickAddHostCam');
  const btnDockAddLocalCam = document.getElementById('btnDockAddLocalCam');

  if (btnHostAddLocalCamera) {
    btnHostAddLocalCamera.addEventListener('click', () => {
      addCurrentDeviceCameraToMatrix();
    });
  }
  if (btnQuickAddHostCam) {
    btnQuickAddHostCam.addEventListener('click', () => {
      addCurrentDeviceCameraToMatrix();
    });
  }
  if (btnDockAddLocalCam) {
    btnDockAddLocalCam.addEventListener('click', () => {
      addCurrentDeviceCameraToMatrix();
    });
  }

  // Initialize Phone as Dummy CCTV Controls
  initDummyCctvControls();

  // AI Entity Detection Toolbar Button and Menu
  const btnToggleEntityDetect = document.getElementById('btnToggleEntityDetect');
  const aiDetectMenu = document.getElementById('aiDetectMenu');
  const btnAiToggleState = document.getElementById('btnAiToggleState');
  const btnAiAudioChime = document.getElementById('btnAiAudioChime');

  if (btnToggleEntityDetect) {
    btnToggleEntityDetect.addEventListener('click', (e) => {
      e.stopPropagation();
      if (aiDetectMenu) {
        aiDetectMenu.style.display = aiDetectMenu.style.display === 'block' ? 'none' : 'block';
      }
    });
  }

  if (btnAiToggleState) {
    btnAiToggleState.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEntityDetection();
    });
  }

  if (btnAiAudioChime) {
    btnAiAudioChime.addEventListener('click', (e) => {
      e.stopPropagation();
      aiDetectorState.audioChime = !aiDetectorState.audioChime;
      btnAiAudioChime.classList.toggle('active', aiDetectorState.audioChime);
      updateAiUi();
      showToast(aiDetectorState.audioChime ? 'Detection audio chime ON' : 'Detection audio chime OFF');
    });
  }

  if (aiDetectMenu) {
    aiDetectMenu.querySelectorAll('[data-engine]').forEach(engBtn => {
      engBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        aiDetectMenu.querySelectorAll('[data-engine]').forEach(b => b.classList.remove('active'));
        engBtn.classList.add('active');
        aiDetectorState.engine = engBtn.getAttribute('data-engine');
        showToast(`AI Engine: ${aiDetectorState.engine.toUpperCase()}`);
        logEvent('AI', `Engine switched to ${aiDetectorState.engine.toUpperCase()}`);
        aiDetectorState.model = null;
        aiDetectorState.yoloModel = null;
        if (aiDetectorState.enabled) {
          await initAiModel();
        }
      });
    });

    aiDetectMenu.querySelectorAll('[data-filter]').forEach(filterBtn => {
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        aiDetectMenu.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        filterBtn.classList.add('active');
        aiDetectorState.filter = filterBtn.getAttribute('data-filter');
        showToast(`AI Entity Filter: ${aiDetectorState.filter.toUpperCase()}`);
        logEvent('AI', `Filter updated to: ${aiDetectorState.filter.toUpperCase()}`);
      });
    });
  }

  // Dismiss dropdowns on outside click
  document.addEventListener('click', () => {
    if (masterSleepTimerMenu) masterSleepTimerMenu.style.display = 'none';
    if (aiDetectMenu) aiDetectMenu.style.display = 'none';
    document.querySelectorAll('.tile-sleep-menu').forEach(m => m.style.display = 'none');
  });
}

// --- Real-Time AI Entity Detection Engine (Ultralytics YOLOv8 & COCO-SSD) ---
const aiDetectorState = {
  enabled: false,
  engine: 'yolov8', // 'yolov8' | 'coco'
  model: null,
  yoloModel: null,
  loading: false,
  filter: 'all', // 'all' | 'person' | 'vehicle' | 'animal'
  audioChime: true,
  lastChimeTime: 0,
  intervalId: null,
};

async function initAiModel() {
  aiDetectorState.loading = true;
  updateAiUi();

  // 1. Ultralytics YOLOv8 ONNX Engine
  if (aiDetectorState.engine === 'yolov8') {
    if (window.sentinelYolo) {
      try {
        await window.sentinelYolo.load();
        aiDetectorState.yoloModel = window.sentinelYolo;
        aiDetectorState.loading = false;
        updateAiUi();
        showToast('Ultralytics YOLOv8 Neural Vision active');
        logEvent('AI', 'YOLOv8 Neural Vision Engine loaded (ONNX Runtime Web)');
        return aiDetectorState.yoloModel;
      } catch (err) {
        console.warn('YOLOv8 load failed, falling back to COCO-SSD:', err);
      }
    }
  }

  // 2. Fallback: COCO-SSD MobileNet Engine
  if (window.cocoSsd) {
    try {
      aiDetectorState.model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
      aiDetectorState.loading = false;
      updateAiUi();
      showToast('AI Entity Detection model initialized');
      logEvent('AI', 'Neural Vision Model loaded (COCO-SSD MobileNetV2)');
      return aiDetectorState.model;
    } catch (e) {
      console.warn('AI model load warning, fallback active:', e);
    }
  }

  aiDetectorState.loading = false;
  updateAiUi();
  return null;
}

function updateAiUi() {
  const btn = document.getElementById('btnToggleEntityDetect');
  const badge = document.getElementById('aiDetectBadge');
  const stateLabel = document.getElementById('aiStateLabel');
  const chimeLabel = document.getElementById('aiChimeLabel');

  if (btn) {
    btn.classList.toggle('active', aiDetectorState.enabled);
    btn.classList.toggle('loading', aiDetectorState.loading);
  }
  if (badge) {
    badge.textContent = aiDetectorState.loading
      ? 'AI LOAD'
      : (aiDetectorState.enabled ? (aiDetectorState.engine === 'yolov8' ? 'YOLOv8 ON' : 'AI LIVE') : 'AI OFF');
  }
  if (stateLabel) {
    stateLabel.textContent = aiDetectorState.enabled ? 'ACTIVE' : 'OFF';
    stateLabel.style.color = aiDetectorState.enabled ? '#10b981' : '#ef4444';
  }
  if (chimeLabel) {
    chimeLabel.textContent = aiDetectorState.audioChime ? 'ON' : 'OFF';
    chimeLabel.style.color = aiDetectorState.audioChime ? '#10b981' : '#ef4444';
  }
}

async function toggleEntityDetection() {
  aiDetectorState.enabled = !aiDetectorState.enabled;
  updateAiUi();

  if (aiDetectorState.enabled) {
    showToast(`AI Entity Detection activated (${aiDetectorState.engine.toUpperCase()})`);
    logEvent('AI', `AI Entity Vision scanning active [${aiDetectorState.engine.toUpperCase()}] (Filter: ${aiDetectorState.filter.toUpperCase()})`);
    if (!aiDetectorState.model && !aiDetectorState.yoloModel && !aiDetectorState.loading) {
      await initAiModel();
    }
    startDetectionLoop();
  } else {
    stopDetectionLoop();
    clearAllAiCanvases();
    showToast('AI Entity Detection disabled');
    logEvent('AI', 'AI Entity Vision paused');
  }
}

function getFormattedCctvTimestamp() {
  const d = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(Math.floor(d.getMilliseconds() / 10), 2)}`;
}

let aiAnimFrameId = null;
let aiLoopTimer = null;
let isAiLoopRunning = false;

function startDetectionLoop() {
  stopDetectionLoop();
  isAiLoopRunning = true;
  startAiRenderLoop();
  scheduleNextAiScan(60);
}

function stopDetectionLoop() {
  isAiLoopRunning = false;
  if (aiLoopTimer) {
    clearTimeout(aiLoopTimer);
    aiLoopTimer = null;
  }
  if (aiDetectorState.intervalId) {
    clearInterval(aiDetectorState.intervalId);
    aiDetectorState.intervalId = null;
  }
  stopAiRenderLoop();
}

function scheduleNextAiScan(delayMs = 120) {
  if (!isAiLoopRunning || !aiDetectorState.enabled) return;
  if (aiLoopTimer) clearTimeout(aiLoopTimer);
  aiLoopTimer = setTimeout(async () => {
    if (!isAiLoopRunning || !aiDetectorState.enabled) return;
    try {
      await scanAllCameraFeeds();
    } catch (e) {
      console.warn('[AI Scan] Loop warning:', e);
    }
    scheduleNextAiScan(120);
  }, delayMs);
}

function startAiRenderLoop() {
  if (aiAnimFrameId) cancelAnimationFrame(aiAnimFrameId);

  function renderFrame() {
    const now = performance.now();
    const timeStr = getFormattedCctvTimestamp();

    cameraPeers.forEach(peer => {
      // 1. Update Real-Time CCTV On-Screen Display (OSD) timecode
      const osdTime = peer.cardEl.querySelector('.tile-osd-time');
      if (osdTime) {
        osdTime.textContent = timeStr;
      }

      // 2. Render smooth interpolated AI detection reticles
      const canvas = peer.canvasAi;
      const media = (peer.isIpCam && peer.imgEl) ? peer.imgEl : peer.videoEl;
      if (!canvas || !media) return;

      const targetW = Math.round(media.clientWidth || canvas.clientWidth || 640);
      const targetH = Math.round(media.clientHeight || canvas.clientHeight || 480);

      if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!aiDetectorState.enabled || !peer.trackedTargets || peer.trackedTargets.length === 0) {
        if (peer.entityPill && (!peer.trackedTargets || peer.trackedTargets.length === 0)) {
          peer.entityPill.style.display = 'none';
        }
        return;
      }

      let activeCount = 0;
      const activeCounts = {};

      peer.trackedTargets = peer.trackedTargets.filter(trk => {
        // Exponential coordinate smoothing (EMA Lerp) for 60fps silky motion
        trk.current[0] += (trk.target[0] - trk.current[0]) * 0.32;
        trk.current[1] += (trk.target[1] - trk.current[1]) * 0.32;
        trk.current[2] += (trk.target[2] - trk.current[2]) * 0.32;
        trk.current[3] += (trk.target[3] - trk.current[3]) * 0.32;

        // Smooth opacity decay (persists for 380ms before fading out smoothly)
        const age = now - trk.lastSeen;
        if (age < 380) {
          trk.opacity = Math.min(1.0, trk.opacity + 0.18);
        } else {
          trk.opacity = Math.max(0.0, trk.opacity - 0.06);
        }

        if (trk.opacity <= 0.01) return false;

        drawCctvTargetReticle(ctx, trk);
        activeCount++;
        activeCounts[trk.class] = (activeCounts[trk.class] || 0) + 1;
        return true;
      });

      // Update tile entity pill
      if (peer.entityPill) {
        if (activeCount > 0) {
          const summary = Object.entries(activeCounts).map(([k, v]) => `${v} ${k.toUpperCase()}`).join(', ');
          const textEl = peer.entityPill.querySelector('.ai-pill-text');
          if (textEl) textEl.textContent = `YOLO: ${summary}`;
          peer.entityPill.style.display = 'inline-flex';
        } else {
          peer.entityPill.style.display = 'none';
        }
      }
    });

    aiAnimFrameId = requestAnimationFrame(renderFrame);
  }

  aiAnimFrameId = requestAnimationFrame(renderFrame);
}

function stopAiRenderLoop() {
  if (aiAnimFrameId) {
    cancelAnimationFrame(aiAnimFrameId);
    aiAnimFrameId = null;
  }
}

function clearAllAiCanvases() {
  cameraPeers.forEach(peer => {
    peer.trackedTargets = [];
    peer.cardEl.classList.remove('cctv-alert-active');
    if (peer.canvasAi) {
      const ctx = peer.canvasAi.getContext('2d');
      ctx.clearRect(0, 0, peer.canvasAi.width, peer.canvasAi.height);
    }
    if (peer.entityPill) {
      peer.entityPill.style.display = 'none';
    }
  });
}

let isScanningAi = false;
async function scanAllCameraFeeds() {
  if (!aiDetectorState.enabled || isScanningAi) return;
  isScanningAi = true;

  try {
    for (const peer of cameraPeers.values()) {
      const isIpCam = peer.isIpCam && peer.imgEl;
      const media = isIpCam ? peer.imgEl : peer.videoEl;
      const canvas = peer.canvasAi;
      if (!media || !canvas) continue;

      if (!isIpCam && (media.readyState < 2 || media.videoWidth === 0)) continue;
      if (isIpCam && (!media.complete || !media.naturalWidth)) continue;

      let rawDetections = [];
      if (aiDetectorState.engine === 'yolov8') {
        const yolo = aiDetectorState.yoloModel || window.sentinelYolo;
        if (yolo && yolo.session) {
          try {
            rawDetections = await yolo.detect(media, 0.35);
          } catch (err) {
            console.warn('YOLOv8 inference error:', err);
          }
        } else if (!aiDetectorState.loading) {
          initAiModel();
        }
      } else if (aiDetectorState.model) {
        try {
          rawDetections = await aiDetectorState.model.detect(media);
        } catch (err) {}
      }

      const filtered = filterDetections(rawDetections, media, canvas);
      updatePeerTrackedTargets(peer, filtered);

      // Yield 12ms to browser event loop between camera inferences
      await new Promise(r => setTimeout(r, 12));
    }
  } catch (e) {
    console.warn('[AI Scan] Notice:', e);
  } finally {
    isScanningAi = false;
  }
}

const VEHICLE_CLASSES = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'train', 'airplane', 'boat'];
const ANIMAL_CLASSES = ['dog', 'cat', 'bird', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'];

function filterDetections(raw, media, canvas) {
  const naturalWidth = media.videoWidth || media.naturalWidth || 640;
  const naturalHeight = media.videoHeight || media.naturalHeight || 480;
  const scaleX = canvas.width / naturalWidth;
  const scaleY = canvas.height / naturalHeight;

  return raw
    .filter(item => {
      if (item.score < 0.40) return false;
      if (aiDetectorState.filter === 'person') return item.class === 'person';
      if (aiDetectorState.filter === 'vehicle') return VEHICLE_CLASSES.includes(item.class);
      if (aiDetectorState.filter === 'animal') return ANIMAL_CLASSES.includes(item.class);
      return true;
    })
    .map(item => ({
      class: item.class,
      score: item.score,
      x: item.bbox[0] * scaleX,
      y: item.bbox[1] * scaleY,
      width: item.bbox[2] * scaleX,
      height: item.bbox[3] * scaleY,
    }));
}

function updatePeerTrackedTargets(peer, detections) {
  if (!peer.trackedTargets) peer.trackedTargets = [];
  const now = performance.now();
  const matchedTargetIds = new Set();

  detections.forEach(det => {
    // Find closest existing target by Euclidean center distance
    let bestIdx = -1;
    let bestDist = 140; // max matching radius in pixels

    peer.trackedTargets.forEach((trk, idx) => {
      if (trk.class !== det.class) return;
      const detCx = det.x + det.width / 2;
      const detCy = det.y + det.height / 2;
      const trkCx = trk.target[0] + trk.target[2] / 2;
      const trkCy = trk.target[1] + trk.target[3] / 2;
      const dist = Math.hypot(detCx - trkCx, detCy - trkCy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });

    if (bestIdx >= 0) {
      matchedTargetIds.add(bestIdx);
      const trk = peer.trackedTargets[bestIdx];
      trk.target = [det.x, det.y, det.width, det.height];
      trk.score = det.score;
      trk.lastSeen = now;
    } else {
      // Add new tracked target with initial position
      peer.trackedTargets.push({
        id: Math.random(),
        class: det.class,
        score: det.score,
        current: [det.x, det.y, det.width, det.height],
        target: [det.x, det.y, det.width, det.height],
        lastSeen: now,
        opacity: 0.1,
      });
    }
  });

  // CCTV Intrusion Alert when a human/person is identified
  const hasHuman = detections.some(d => d.class === 'person' && d.score >= 0.48);
  if (hasHuman) {
    peer.cardEl.classList.add('cctv-alert-active');
    const wallNow = Date.now();
    if (aiDetectorState.audioChime && (wallNow - aiDetectorState.lastChimeTime > 5000)) {
      aiDetectorState.lastChimeTime = wallNow;
      if (window.sentinelAudio) {
        window.sentinelAudio.play('alert');
      }
      logEvent('ALARM', `CCTV INTRUSION ALERT: Person detected on ${peer.deviceName} [${peer.deviceId}]`);
    }
  } else {
    // Graceful removal after person leaves
    if (!peer.lastAlertClear || (now - peer.lastAlertClear > 1000)) {
      peer.cardEl.classList.remove('cctv-alert-active');
      peer.lastAlertClear = now;
    }
  }
}

function drawCctvTargetReticle(ctx, trk) {
  const [x, y, w, h] = trk.current;
  const isPerson = trk.class === 'person';
  const isVehicle = VEHICLE_CLASSES.includes(trk.class);
  const isAnimal = ANIMAL_CLASSES.includes(trk.class);

  const strokeColor = isPerson ? '#10b981' : (isVehicle ? '#06b6d4' : (isAnimal ? '#c084fc' : '#f59e0b'));
  const bracketLen = Math.min(24, Math.max(8, w * 0.22), Math.max(8, h * 0.22));

  ctx.save();
  ctx.globalAlpha = trk.opacity;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = 8;

  // Semi-transparent target area tint
  ctx.fillStyle = isPerson ? 'rgba(16, 185, 129, 0.07)' : 'rgba(6, 182, 212, 0.05)';
  ctx.fillRect(x, y, w, h);

  // 4 Cybernetic Tactical Corner Brackets
  ctx.beginPath();
  // Top-left
  ctx.moveTo(x, y + bracketLen);
  ctx.lineTo(x, y);
  ctx.lineTo(x + bracketLen, y);
  // Top-right
  ctx.moveTo(x + w - bracketLen, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + bracketLen);
  // Bottom-right
  ctx.moveTo(x + w, y + h - bracketLen);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - bracketLen, y + h);
  // Bottom-left
  ctx.moveTo(x + bracketLen, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - bracketLen);
  ctx.stroke();

  // Tactical Center Crosshair Reticle
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy);
  ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5);
  ctx.stroke();

  // High-Contrast Cybernetic Target Tag
  const label = `[${trk.class.toUpperCase()} ${Math.round(trk.score * 100)}%]`;
  ctx.font = 'bold 11px monospace';
  const textWidth = ctx.measureText(label).width;

  const tagY = Math.max(0, y - 20);
  ctx.fillStyle = 'rgba(4, 4, 8, 0.92)';
  ctx.fillRect(x, tagY, textWidth + 12, 19);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, tagY, textWidth + 12, 19);

  ctx.fillStyle = strokeColor;
  ctx.fillText(label, x + 6, tagY + 13);

  ctx.restore();
}

// Add camera of current device directly to host matrix
async function addCurrentDeviceCameraToMatrix() {
  const deviceId = 'LOCAL-HOST-CAM';
  if (cameraPeers.has(deviceId)) {
    showToast('Current device camera is already active in matrix.');
    focusCamera(deviceId);
    return;
  }

  try {
    showToast('Requesting local camera access...');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });
    } catch (err) {
      // Audio or strict video constraint might have failed; try fallback to video only
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
    }

    const peer = getOrCreateCameraTile(deviceId, 'Host Station (This Device)');
    peer.isLocalHostCam = true;
    peer.stream = stream;
    peer.videoEl.srcObject = stream;
    peer.videoEl.muted = true; // Always muted locally to prevent acoustic feedback howl
    peer.videoEl.playsInline = true;
    peer.videoEl.autoplay = true;
    peer.videoEl.style.display = 'block';
    if (peer.imgEl) peer.imgEl.style.display = 'none';
    peer.isMuted = true;
    peer.status = 'live';

    peer.videoEl.play().catch(e => console.warn('Local camera play error:', e));

    const waitingOverlay = peer.cardEl.querySelector('.tile-waiting-overlay');
    if (waitingOverlay) waitingOverlay.style.display = 'none';
    const liveBadge = peer.cardEl.querySelector('.tile-live-badge');
    if (liveBadge) {
      liveBadge.style.display = 'inline-flex';
      liveBadge.innerHTML = `<span class="badge-dot"></span><span>LOCAL LIVE</span>`;
    }
    const hud = peer.cardEl.querySelector('.tile-hud');
    if (hud) hud.style.display = 'flex';

    peer.videoEl.addEventListener('loadedmetadata', () => {
      const resEl = peer.cardEl.querySelector('.tile-res');
      if (resEl) resEl.textContent = `${peer.videoEl.videoWidth}x${peer.videoEl.videoHeight}`;
      const fpsEl = peer.cardEl.querySelector('.tile-fps');
      if (fpsEl) fpsEl.textContent = '30';
      const rateEl = peer.cardEl.querySelector('.tile-rate');
      if (rateEl) rateEl.textContent = 'HARDWARE';
      peer.videoEl.play().catch(() => {});
    }, { once: true });

    updateCameraMatrixCounts();
    logEvent('SYS', 'Added current device camera to local surveillance matrix');
    showToast('Camera of current device added successfully!');
  } catch (err) {
    console.error('Failed to access current device camera:', err);
    showToast('Camera access denied or unavailable: ' + (err.message || err.name));
  }
}

function stopCurrentDeviceCamera() {
  const deviceId = 'LOCAL-HOST-CAM';
  if (cameraPeers.has(deviceId)) {
    teardownCameraPeer(deviceId);
    showToast('Current device camera removed');
  }
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

// --- Phone as Dummy CCTV Controller & Stream Gateway ---
function initDummyCctvControls() {
  const modal = document.getElementById('dummyCctvModal');
  const btnClose = document.getElementById('btnCloseCctvModal');
  const btnCancel = document.getElementById('btnCancelCctvModal');
  const btnGuideSwitch = document.getElementById('btnGuideSwitchToConnect');
  const btnTogglePass = document.getElementById('btnToggleCctvPass');
  const inputPass = document.getElementById('cctvInputPass');
  const inputUser = document.getElementById('cctvInputUser');
  const inputIp = document.getElementById('cctvInputIp');
  const inputPort = document.getElementById('cctvInputPort');
  const btnToggleAdv = document.getElementById('btnToggleCctvAdvanced');
  const advBody = document.getElementById('cctvAdvancedBody');
  const advChevron = document.getElementById('cctvAdvancedChevron');
  const btnScan = document.getElementById('btnScanCctvNetwork');
  const btnScanLabel = document.getElementById('btnScanLabel');
  const scanStatus = document.getElementById('cctvScanStatus');
  const scanHeadline = document.getElementById('cctvStatusHeadline');
  const scanDetail = document.getElementById('cctvStatusDetail');
  const resultsBox = document.getElementById('cctvResultsBox');
  const resultsList = document.getElementById('cctvResultsList');

  const triggers = [
    document.getElementById('btnHostAddDummyCctv'),
    document.getElementById('btnQuickAddDummyCctv'),
    document.getElementById('btnDockAddDummyCctv')
  ];

  triggers.forEach(trigger => {
    if (trigger) {
      trigger.addEventListener('click', () => {
        openDummyCctvModal();
      });
    }
  });

  function openDummyCctvModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    switchTab('connect');
    if (inputUser && !inputUser.value) inputUser.value = 'admin';
    if (inputPass) inputPass.focus();
  }

  function closeDummyCctvModal() {
    if (!modal) return;
    modal.style.display = 'none';
    if (scanStatus) scanStatus.style.display = 'none';
  }

  if (btnClose) btnClose.addEventListener('click', closeDummyCctvModal);
  if (btnCancel) btnCancel.addEventListener('click', closeDummyCctvModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDummyCctvModal();
    });
  }

  const tabBtnConnect = document.getElementById('tabBtnCctvConnect');
  const tabBtnQr = document.getElementById('tabBtnCctvQr');
  const tabBtnGuide = document.getElementById('tabBtnCctvGuide');
  const tabConnect = document.getElementById('cctvTabConnect');
  const tabQr = document.getElementById('cctvTabQr');
  const tabGuide = document.getElementById('cctvTabGuide');
  const modalQrContainer = document.getElementById('modalQrCodeContainer');
  const btnModalCopyLink = document.getElementById('btnModalCopyLink');
  const btnModalOpenWebcam = document.getElementById('btnModalOpenPhoneWebcam');

  function switchTab(target) {
    if (target === 'connect') {
      tabBtnConnect?.classList.add('active');
      tabBtnQr?.classList.remove('active');
      tabBtnGuide?.classList.remove('active');
      if (tabConnect) tabConnect.style.display = 'block';
      if (tabQr) tabQr.style.display = 'none';
      if (tabGuide) tabGuide.style.display = 'none';
    } else if (target === 'qr') {
      tabBtnQr?.classList.add('active');
      tabBtnConnect?.classList.remove('active');
      tabBtnGuide?.classList.remove('active');
      if (tabQr) tabQr.style.display = 'block';
      if (tabConnect) tabConnect.style.display = 'none';
      if (tabGuide) tabGuide.style.display = 'none';

      // Load session QR SVG into modal for zero-install instant phone pairing
      if (modalQrContainer && qrCodeContainer && qrCodeContainer.innerHTML) {
        modalQrContainer.innerHTML = qrCodeContainer.innerHTML;
      }
    } else {
      tabBtnGuide?.classList.add('active');
      tabBtnConnect?.classList.remove('active');
      tabBtnQr?.classList.remove('active');
      if (tabGuide) tabGuide.style.display = 'block';
      if (tabConnect) tabConnect.style.display = 'none';
      if (tabQr) tabQr.style.display = 'none';
    }
  }

  if (tabBtnConnect) tabBtnConnect.addEventListener('click', () => switchTab('connect'));
  if (tabBtnQr) tabBtnQr.addEventListener('click', () => switchTab('qr'));
  if (tabBtnGuide) tabBtnGuide.addEventListener('click', () => switchTab('guide'));
  if (btnGuideSwitch) btnGuideSwitch.addEventListener('click', () => switchTab('connect'));

  if (btnModalCopyLink) {
    btnModalCopyLink.addEventListener('click', () => {
      if (currentSession && currentSession.cameraUrl) {
        navigator.clipboard.writeText(currentSession.cameraUrl).then(() => {
          showToast('✓ Mobile CCTV Link copied to clipboard!');
        }).catch(() => {
          showToast(currentSession.cameraUrl);
        });
      }
    });
  }

  if (btnModalOpenWebcam) {
    btnModalOpenWebcam.addEventListener('click', () => {
      if (currentSession && currentSession.cameraUrl) {
        window.open(currentSession.cameraUrl, '_blank');
      }
    });
  }

  if (btnTogglePass && inputPass) {
    btnTogglePass.addEventListener('click', () => {
      const isPass = inputPass.type === 'password';
      inputPass.type = isPass ? 'text' : 'password';
      btnTogglePass.style.color = isPass ? '#10b981' : '';
    });
  }

  if (btnToggleAdv && advBody) {
    btnToggleAdv.addEventListener('click', () => {
      const isVisible = advBody.style.display === 'block';
      advBody.style.display = isVisible ? 'none' : 'block';
      if (advChevron) advChevron.classList.toggle('rotated', !isVisible);
    });
  }

  document.querySelectorAll('.cctv-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cctv-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (inputPort) inputPort.value = chip.getAttribute('data-port');
    });
  });

  const scopeBadge = document.getElementById('cctvScopeBadge');

  if (inputIp) {
    inputIp.addEventListener('input', () => {
      const val = inputIp.value.trim();
      if (!val) {
        if (scopeBadge) scopeBadge.style.display = 'none';
        return;
      }

      let badgeHtml = '';
      if (/^https?:\/\//i.test(val)) {
        try {
          const u = new URL(val);
          if (u.port && inputPort) inputPort.value = u.port;
          badgeHtml = `<span style="display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;"><span>🔗</span> Direct Stream URL (${u.protocol.toUpperCase().replace(':', '')})</span>`;
        } catch (e) {
          badgeHtml = `<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem;">URL Format</span>`;
        }
      } else if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.0\.0\.1|localhost)/.test(val)) {
        badgeHtml = `<span style="display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;"><span>📶</span> Local Subnet (LAN)</span>`;
        if (val.includes(':') && !val.includes(']')) {
          const parts = val.split(':');
          if (parts[1] && !isNaN(Number(parts[1]))) {
            if (inputPort) inputPort.value = parts[1];
          }
        }
      } else {
        badgeHtml = `<span style="display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;"><span>🌐</span> Remote WAN / Any IP</span>`;
        if (val.includes(':') && !val.includes(']')) {
          const parts = val.split(':');
          if (parts[1] && !isNaN(Number(parts[1]))) {
            if (inputPort) inputPort.value = parts[1];
          }
        }
      }

      if (scopeBadge) {
        scopeBadge.style.display = 'block';
        scopeBadge.innerHTML = badgeHtml;
      }
    });
  }

  if (btnScan) {
    btnScan.addEventListener('click', async () => {
      const username = inputUser?.value?.trim() || 'admin';
      const password = inputPass?.value || '';
      const ip = inputIp?.value?.trim() || '';
      const port = inputPort?.value?.trim() || '';

      if (scanStatus) {
        scanStatus.style.display = 'flex';
        scanHeadline.textContent = ip ? `Probing Target: ${ip}...` : 'Auto-Detecting Phone CCTV...';
        scanDetail.textContent = ip
          ? 'Connecting to target address across video streaming ports...'
          : 'Zero setup: sweeping local network interfaces for active camera feeds...';
      }
      if (resultsBox) resultsBox.style.display = 'none';
      if (resultsList) resultsList.innerHTML = '';
      btnScan.disabled = true;
      if (btnScanLabel) btnScanLabel.textContent = 'Auto-Scanning Network...';

      try {
        logEvent('NET', `Auto-scan initiated for CCTV [ID: ${username}]`);
        const res = await fetch('/api/ipcam/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            ip: ip || undefined,
            port: port ? Number(port) : undefined,
          }),
        });

        const data = await res.json();
        btnScan.disabled = false;
        if (btnScanLabel) btnScanLabel.textContent = '⚡ Auto-Detect & Connect CCTV Feed';

        if (data.cameras && data.cameras.length > 0) {
          // If exactly 1 camera is found, automatically connect immediately without user having to enter or click anything!
          if (data.cameras.length === 1) {
            const cam = data.cameras[0];
            closeDummyCctvModal();
            connectDummyCctvFeed({
              ip: cam.ip,
              port: cam.port,
              streamPath: cam.streamPath || '/video',
              snapshotPath: cam.snapshotPath || '/shot.jpg',
              name: cam.name || `Dummy CCTV [${cam.ip}]`,
              username,
              password,
            });
            showToast(`✓ Auto-Connected to ${cam.brand || cam.name}! Zero IP/port setup needed.`);
            logEvent('CCTV', `Auto-connected live feed from ${cam.ip}:${cam.port}`);
          } else {
            scanHeadline.textContent = `Located ${data.cameras.length} CCTV Device(s)!`;
            scanDetail.textContent = 'Select camera to stream:';
            renderCctvResults(data.cameras, username, password);
          }
        } else {
          scanHeadline.textContent = 'No Running Camera App Detected';
          scanDetail.textContent = 'Make sure "Start server" is tapped in IP Webcam on your phone, or use Instant QR:';
          showToast('No active camera detected. Tap Instant QR below or start phone server.');
          renderDirectConnectOption(ip || '192.168.1.50', port || '8080', username, password);
        }
      } catch (err) {
        console.error('IPCam scan error:', err);
        btnScan.disabled = false;
        if (btnScanLabel) btnScanLabel.textContent = '⚡ Auto-Detect & Connect CCTV Feed';
        if (scanHeadline) scanHeadline.textContent = 'Scan encountered an error';
        if (scanDetail) scanDetail.textContent = err.message || 'Network probe failed';
        showToast('Network scan error: ' + err.message);
        renderDirectConnectOption(ip || '192.168.1.50', port || '8080', username, password);
      }
    });
  }

  function renderCctvResults(cameras, username, password) {
    if (!resultsBox || !resultsList) return;
    resultsList.innerHTML = '';
    resultsBox.style.display = 'block';

    cameras.forEach(cam => {
      const item = document.createElement('div');
      item.className = 'cctv-device-item';

      const authBadge = cam.authStatus === 'authenticated'
        ? '<span style="color: #10b981; font-size: 0.68rem; font-weight: 700;">[CLEARANCE GRANTED]</span>'
        : (cam.authStatus === 'unauthorized' ? '<span style="color: #ef4444; font-size: 0.68rem; font-weight: 700;">[AUTH REQUIRED]</span>' : '');

      item.innerHTML = `
        <div class="cctv-device-info">
          <span class="cctv-device-badge"></span>
          <div>
            <div class="cctv-device-name">${escapeHtml(cam.name || cam.brand || 'Dummy CCTV')} ${authBadge}</div>
            <div class="cctv-device-ip">IP: ${cam.ip}:${cam.port} &bull; Path: ${cam.streamPath || '/video'}</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm btn-connect-cctv-item" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
          <span>Connect Feed</span>
        </button>
      `;

      const btnConnect = item.querySelector('.btn-connect-cctv-item');
      btnConnect.addEventListener('click', () => {
        closeDummyCctvModal();
        connectDummyCctvFeed({
          ip: cam.ip,
          port: cam.port,
          streamPath: cam.streamPath || '/video',
          snapshotPath: cam.snapshotPath || '/shot.jpg',
          name: cam.name || `Dummy CCTV [${cam.ip}]`,
          username,
          password,
        });
      });

      resultsList.appendChild(item);
    });
  }

  function renderDirectConnectOption(ip, port, username, password) {
    if (!resultsBox || !resultsList) return;
    resultsList.innerHTML = '';
    resultsBox.style.display = 'block';

    const item = document.createElement('div');
    item.className = 'cctv-device-item';
    item.innerHTML = `
      <div class="cctv-device-info">
        <span class="cctv-device-badge" style="background: #3b82f6;"></span>
        <div>
          <div class="cctv-device-name">Direct Target: ${escapeHtml(ip)}${port ? ':' + port : ''}</div>
          <div class="cctv-device-ip">Connect directly via Sentinel Gateway Proxy (Any IP / WAN / LAN)</div>
        </div>
      </div>
      <div style="display: flex; gap: 0.4rem;">
        <button class="btn btn-primary btn-sm" id="btnForceConnectCctv" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
          <span>Connect Feed</span>
        </button>
      </div>
    `;

    item.querySelector('#btnForceConnectCctv').addEventListener('click', () => {
      closeDummyCctvModal();
      connectDummyCctvFeed({
        ip,
        port: port ? Number(port) : 8080,
        streamPath: String(port) === '4747' ? '/video' : (String(port) === '8081' ? '/live.jpg' : '/video'),
        snapshotPath: '/shot.jpg',
        name: `CCTV [${ip}]`,
        username,
        password,
      });
    });

    resultsList.appendChild(item);

    // Also add shortcut for Local YOLO stream on port 8088
    const yoloItem = document.createElement('div');
    yoloItem.className = 'cctv-device-item';
    yoloItem.style.marginTop = '0.5rem';
    yoloItem.innerHTML = `
      <div class="cctv-device-info">
        <span class="cctv-device-badge" style="background: #10b981;"></span>
        <div>
          <div class="cctv-device-name">Sentinel Local AI Camera Stream (Port 8088)</div>
          <div class="cctv-device-ip">Direct local loopback YOLO stream: http://127.0.0.1:8088/video</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="btnConnectLocalYolo" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
        <span>Connect AI Feed</span>
      </button>
    `;

    yoloItem.querySelector('#btnConnectLocalYolo').addEventListener('click', () => {
      closeDummyCctvModal();
      connectDummyCctvFeed({
        ip: '127.0.0.1',
        port: 8088,
        streamPath: '/video',
        snapshotPath: '/shot.jpg',
        name: 'Sentinel YOLO AI Cam [127.0.0.1:8088]',
        username: '',
        password: '',
      });
    });

    resultsList.appendChild(yoloItem);

    // Also add shortcut to Instant QR tab (Zero app, zero IP, zero port)
    const qrItem = document.createElement('div');
    qrItem.className = 'cctv-device-item';
    qrItem.style.marginTop = '0.5rem';
    qrItem.innerHTML = `
      <div class="cctv-device-info">
        <span class="cctv-device-badge" style="background: #a855f7;"></span>
        <div>
          <div class="cctv-device-name">📱 Instant Mobile QR Pairing (Zero App / No IP / No Port)</div>
          <div class="cctv-device-ip">Just point phone camera at QR code — streams directly in browser!</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="btnSwitchToQrTab" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: #a855f7; border-color: #a855f7;">
        <span>View QR Code</span>
      </button>
    `;

    qrItem.querySelector('#btnSwitchToQrTab').addEventListener('click', () => {
      switchTab('qr');
    });

    resultsList.appendChild(qrItem);
  }
}

function connectDummyCctvFeed(cfg) {
  const { ip, port, streamPath, snapshotPath, name, username, password } = cfg;
  const safeId = String(ip).replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '');
  const deviceId = `CCTV-${safeId || 'CAM'}-${port || 8080}`;

  if (cameraPeers.has(deviceId)) {
    showToast(`CCTV (${ip}) is already active in matrix.`);
    focusCamera(deviceId);
    return;
  }

  const cleanName = name || `IP Camera [${ip}]`;
  const peer = getOrCreateCameraTile(deviceId, cleanName);

  peer.isIpCam = true;
  peer.ipCamConfig = { ip, port, streamPath, snapshotPath, username, password };
  peer.status = 'live';

  // Construct secure stream proxy URL supporting ANY IP, Hostname, URL, and credentials
  const streamUrl = `/api/ipcam/stream?ip=${encodeURIComponent(ip)}&port=${encodeURIComponent(port || '')}&path=${encodeURIComponent(streamPath || '')}&user=${encodeURIComponent(username || '')}&pass=${encodeURIComponent(password || '')}&_t=${Date.now()}`;

  // Hide the standard WebRTC video element when active as IP camera
  if (peer.videoEl) {
    peer.videoEl.style.display = 'none';
  }

  // Create or retrieve the MJPEG img element
  let img = peer.cardEl.querySelector('.tile-cctv-img');
  if (!img) {
    img = document.createElement('img');
    img.className = 'tile-cctv-img';
    img.crossOrigin = 'anonymous';
    img.alt = `Live camera feed from ${cleanName}`;
    const wrap = peer.cardEl.querySelector('.tile-video-wrap');
    if (wrap) {
      wrap.insertBefore(img, wrap.firstChild);
    }
  }

  img.style.display = 'block';
  peer.imgEl = img;
  img.src = streamUrl;

  // Track stream resolution and frame activity
  img.addEventListener('load', () => {
    if (img.naturalWidth && img.naturalHeight) {
      const resEl = peer.cardEl.querySelector('.tile-res');
      if (resEl) resEl.textContent = `${img.naturalWidth}x${img.naturalHeight}`;
    }
    const fpsEl = peer.cardEl.querySelector('.tile-fps');
    if (fpsEl) fpsEl.textContent = '30';
  });

  img.addEventListener('error', () => {
    console.warn(`[IPCam] Stream connection notice for ${ip}:${port}`);
  });

  const waitingOverlay = peer.cardEl.querySelector('.tile-waiting-overlay');
  if (waitingOverlay) waitingOverlay.style.display = 'none';
  const liveBadge = peer.cardEl.querySelector('.tile-live-badge');
  if (liveBadge) {
    liveBadge.style.display = 'inline-flex';
    liveBadge.innerHTML = `<span class="badge-dot"></span><span>IP CAM LIVE</span>`;
  }
  const hud = peer.cardEl.querySelector('.tile-hud');
  if (hud) hud.style.display = 'flex';

  const rateEl = peer.cardEl.querySelector('.tile-rate');
  if (rateEl) rateEl.textContent = 'STREAM';

  const fpsEl = peer.cardEl.querySelector('.tile-fps');
  if (fpsEl) fpsEl.textContent = 'LIVE';

  const resEl = peer.cardEl.querySelector('.tile-res');
  if (resEl) resEl.textContent = 'HD 720p';

  updateCameraMatrixCounts();
  logEvent('CCTV', `Located and connected live feed from camera at ${ip}:${port} (${cleanName})`);
  showToast(`Live Feed Connected: ${cleanName}`);
  if (window.sentinelAudio) window.sentinelAudio.play('connect');
}

window.addEventListener('DOMContentLoaded', initHost);
