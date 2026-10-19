// SENTINEL // Scanned Remote Camera Script

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session');

let ws = null;
let pc = null;
let localStream = null;
let currentFacingMode = 'environment'; // default rear camera
let isTorchOn = false;
let torchTrack = null;
let currentZoom = 1.0;
let isMicMuted = false;

// Generate or restore persistent unique device ID
let deviceId = sessionStorage.getItem('sentinel_device_id');
if (!deviceId) {
  deviceId = 'CAM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  sessionStorage.setItem('sentinel_device_id', deviceId);
}
let deviceName = sessionStorage.getItem('sentinel_device_name') || '';

// UI Elements
const permissionOverlay = document.getElementById('permissionOverlay');
const btnAllowStart = document.getElementById('btnAllowStart');
const facingSelect = document.getElementById('facingSelect');
const resolutionSelect = document.getElementById('resolutionSelect');
const micAudioToggle = document.getElementById('micAudioToggle');
const sessionTokenDisplay = document.getElementById('sessionTokenDisplay');
const cameraPreviewVideo = document.getElementById('cameraPreviewVideo');
const mobileStatusIndicator = document.getElementById('mobileStatusIndicator');
const mobileStatusDot = document.getElementById('mobileStatusDot');
const mobileStatusText = document.getElementById('mobileStatusText');
const btnFlipCamera = document.getElementById('btnFlipCamera');
const btnToggleTorch = document.getElementById('btnToggleTorch');
const btnToggleMic = document.getElementById('btnToggleMic');
const btnZoom = document.getElementById('btnZoom');
const zoomLabel = document.getElementById('zoomLabel');
const btnMobileEndSession = document.getElementById('btnMobileEndSession');
const streamingControls = document.getElementById('streamingControls');
const errorNotice = document.getElementById('errorNotice');

// Multi-device identity UI elements
const headerDeviceId = document.getElementById('headerDeviceId');
const deviceIdDisplay = document.getElementById('deviceIdDisplay');
const deviceNameInput = document.getElementById('deviceNameInput');
const viewfinderDeviceHud = document.getElementById('viewfinderDeviceHud');
const viewfinderDeviceId = document.getElementById('viewfinderDeviceId');
const viewfinderDeviceName = document.getElementById('viewfinderDeviceName');

// Hardware platform & sensor detection elements
const hardwareDetectBanner = document.getElementById('hardwareDetectBanner');
const hardwareDetectIcon = document.getElementById('hardwareDetectIcon');
const hardwareDetectTitle = document.getElementById('hardwareDetectTitle');
const cameraCountPill = document.getElementById('cameraCountPill');
const micCountPill = document.getElementById('micCountPill');
const detectedCameraNote = document.getElementById('detectedCameraNote');
const micAvailableRow = document.getElementById('micAvailableRow');
const noMicNotice = document.getElementById('noMicNotice');
const micSensorInfo = document.getElementById('micSensorInfo');
const micToggleLabel = document.getElementById('micToggleLabel');

if (headerDeviceId) headerDeviceId.textContent = deviceId;
if (deviceIdDisplay) deviceIdDisplay.textContent = deviceId;
if (deviceNameInput && deviceName) deviceNameInput.value = deviceName;

if (sessionTokenDisplay) {
  sessionTokenDisplay.textContent = sessionId || 'INVALID';
}

// Detect hardware platform (Laptop, Desktop, Mobile, Tablet)
function detectDevicePlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua) || (isAndroid && !/Mobile/i.test(ua)) || (navigator.maxTouchPoints > 1 && window.innerWidth >= 768);
  const isMobile = (isIOS || isAndroid || /Mobile/i.test(ua)) && !isTablet;
  const isMac = /Macintosh|MacIntel/.test(ua);
  const isWindows = /Win32|Win64|Windows/.test(ua);
  const isLinux = /Linux/.test(ua) && !isAndroid;

  let platformName = 'Desktop PC';
  let category = 'laptop';
  let icon = '💻';
  let defaultLabel = 'Desktop Camera';

  if (isMobile) {
    platformName = isIOS ? 'Mobile Phone (iPhone)' : (isAndroid ? 'Mobile Phone (Android)' : 'Mobile Phone');
    category = 'mobile';
    icon = '📱';
    defaultLabel = isIOS ? 'iPhone Camera' : 'Android Camera';
  } else if (isTablet) {
    platformName = isIOS ? 'Tablet (iPad)' : (isAndroid ? 'Tablet (Android)' : 'Tablet');
    category = 'tablet';
    icon = '📱';
    defaultLabel = isIOS ? 'iPad Camera' : 'Tablet Camera';
  } else if (isMac) {
    platformName = 'Laptop / Desktop (macOS)';
    category = 'laptop';
    icon = '💻';
    defaultLabel = 'MacBook Pro Webcam';
  } else if (isWindows) {
    platformName = 'Laptop / PC (Windows)';
    category = 'laptop';
    icon = '💻';
    defaultLabel = 'Windows Webcam';
  } else if (isLinux) {
    platformName = 'Workstation (Linux)';
    category = 'laptop';
    icon = '💻';
    defaultLabel = 'Linux Webcam';
  }

  return { platformName, category, icon, defaultLabel };
}

// Enumerate only cameras and microphones that actually exist on this hardware
async function enumerateHardwareSensors(platform) {
  if (hardwareDetectIcon) hardwareDetectIcon.textContent = platform.icon;
  if (hardwareDetectTitle) hardwareDetectTitle.textContent = platform.platformName;

  // Pre-fill camera name input if empty
  if (deviceNameInput && !deviceNameInput.value.trim()) {
    deviceNameInput.value = platform.defaultLabel;
    deviceName = platform.defaultLabel;
  }

  facingSelect.innerHTML = '';

  let videoDevices = [];
  let audioDevices = [];

  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      audioDevices = allDevices.filter(d => d.kind === 'audioinput');
    } catch (e) {
      console.warn('enumerateDevices error:', e);
    }
  }

  // --- 1. POPULATE CAMERAS THAT ACTUALLY EXIST ---
  if (platform.category === 'laptop') {
    // LAPTOP / DESKTOP: Typically only has 1 front webcam, no rear back camera!
    if (videoDevices.length > 0) {
      videoDevices.forEach((dev, idx) => {
        const opt = document.createElement('option');
        opt.value = dev.deviceId || 'user';
        opt.textContent = dev.label || (videoDevices.length === 1 ? 'Built-in Webcam (Front Sensor)' : `Webcam #${idx + 1}`);
        facingSelect.appendChild(opt);
      });
      if (detectedCameraNote) detectedCameraNote.textContent = `${videoDevices.length} Webcam Available`;
      if (cameraCountPill) {
        cameraCountPill.textContent = `🎥 ${videoDevices.length} Webcam`;
        cameraCountPill.classList.add('ready');
      }
    } else {
      const opt = document.createElement('option');
      opt.value = 'user';
      opt.textContent = 'Built-in Webcam (Front Sensor)';
      facingSelect.appendChild(opt);
      if (cameraCountPill) cameraCountPill.textContent = `🎥 1 Webcam (Default)`;
    }
  } else {
    // MOBILE / TABLET: Has rear + front cameras
    if (videoDevices.length >= 2) {
      const backOpt = document.createElement('option');
      backOpt.value = 'environment';
      backOpt.textContent = 'Back Camera (Main Sensor)';
      backOpt.selected = true;
      facingSelect.appendChild(backOpt);

      const frontOpt = document.createElement('option');
      frontOpt.value = 'user';
      frontOpt.textContent = 'Front Camera (Selfie / Ultra-wide)';
      facingSelect.appendChild(frontOpt);

      videoDevices.slice(2).forEach((dev, idx) => {
        const opt = document.createElement('option');
        opt.value = dev.deviceId;
        opt.textContent = dev.label || `Aux Lens #${idx + 1}`;
        facingSelect.appendChild(opt);
      });

      if (detectedCameraNote) detectedCameraNote.textContent = `${videoDevices.length} Lenses Available`;
      if (cameraCountPill) {
        cameraCountPill.textContent = `🎥 ${videoDevices.length} Lenses`;
        cameraCountPill.classList.add('ready');
      }
    } else if (videoDevices.length === 1) {
      const opt = document.createElement('option');
      opt.value = 'environment';
      opt.textContent = 'Main Camera Sensor';
      facingSelect.appendChild(opt);
      if (cameraCountPill) cameraCountPill.textContent = `🎥 1 Camera`;
    } else {
      const backOpt = document.createElement('option');
      backOpt.value = 'environment';
      backOpt.textContent = 'Back Camera (Main Sensor)';
      backOpt.selected = true;
      facingSelect.appendChild(backOpt);

      const frontOpt = document.createElement('option');
      frontOpt.value = 'user';
      frontOpt.textContent = 'Front Camera (Selfie)';
      facingSelect.appendChild(frontOpt);
      if (cameraCountPill) cameraCountPill.textContent = `🎥 2 Cameras (Default)`;
    }
  }

  // Always append Virtual CCTV Test Pattern
  const simOpt = document.createElement('option');
  simOpt.value = 'simulator';
  simOpt.textContent = 'Virtual CCTV Test Pattern (No Hardware Required)';
  facingSelect.appendChild(simOpt);

  // --- 2. POPULATE MICROPHONES THAT ACTUALLY EXIST ---
  if (audioDevices.length > 0) {
    if (micAvailableRow) micAvailableRow.style.display = 'block';
    if (noMicNotice) noMicNotice.style.display = 'none';
    const firstMic = audioDevices[0];
    const micName = firstMic.label || (platform.category === 'laptop' ? 'Internal Microphone (Built-in)' : 'Built-in Device Mic');
    if (micSensorInfo) micSensorInfo.textContent = `Detected: ${micName}`;
    if (micToggleLabel) micToggleLabel.textContent = `Transmit Audio (${micName})`;
    if (micCountPill) {
      micCountPill.textContent = `🎙️ ${audioDevices.length} Mic`;
      micCountPill.classList.add('ready');
    }
  } else {
    if (micAudioToggle) micAudioToggle.checked = false;
    if (micAvailableRow) micAvailableRow.style.display = 'none';
    if (noMicNotice) noMicNotice.style.display = 'block';
    if (micCountPill) micCountPill.textContent = '🎙️ No Mic';
  }
}

// Generate animated CCTV test pattern simulator stream
function createSimulatorStream(width = 1280, height = 720) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  function draw() {
    frame++;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const scanY = (frame * 3) % height;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, scanY, width, 6);

    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.moveTo(cx - 90, cy); ctx.lineTo(cx + 90, cy);
    ctx.moveTo(cx, cy - 90); ctx.lineTo(cx, cy + 90);
    ctx.stroke();

    const angle = (frame * 0.035) % (Math.PI * 2);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 70, cy + Math.sin(angle) * 70);
    ctx.stroke();

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SENTINEL // SURVEILLANCE TEST SIMULATOR', 40, 50);

    const now = new Date();
    ctx.font = '16px monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`TIMESTAMP : ${now.toISOString().replace('T', ' ').slice(0, 19)} UTC`, 40, 85);
    ctx.fillText(`CHANNEL   : ${deviceId || 'CAM-01'} [VIRTUAL ENCRYPTED LINK]`, 40, 115);
    ctx.fillText(`SESSION   : ${sessionId || 'DEV-MODE'}`, 40, 145);
    ctx.fillText(`FRAME     : #${frame}`, 40, 175);

    requestAnimationFrame(draw);
  }
  draw();

  return canvas.captureStream(30);
}

let camSleepTimer = { active: false, expiresAt: null, durationMinutes: null };
let camSleepInterval = null;

function initCamSleepTimerTicker() {
  if (camSleepInterval) clearInterval(camSleepInterval);
  camSleepInterval = setInterval(() => {
    updateCamSleepTimerUI();
  }, 1000);
}

function updateCamSleepTimerUI() {
  const mobileSleepPill = document.getElementById('mobileSleepPill');
  const mobileSleepText = document.getElementById('mobileSleepText');
  const camSleepBadge = document.getElementById('camSleepBadge');
  const btnCamSleepTimer = document.getElementById('btnCamSleepTimer');
  const now = Date.now();

  if (camSleepTimer && camSleepTimer.active && camSleepTimer.expiresAt) {
    const remaining = Math.max(0, Math.floor((camSleepTimer.expiresAt - now) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const txt = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (mobileSleepPill) mobileSleepPill.style.display = 'inline-flex';
    if (mobileSleepText) mobileSleepText.textContent = txt;
    if (camSleepBadge) {
      camSleepBadge.textContent = remaining > 60 ? `${mins}m` : `${mins}:${String(secs).padStart(2, '0')}`;
      camSleepBadge.style.display = 'block';
    }
    if (btnCamSleepTimer) btnCamSleepTimer.classList.add('active');

    const popover = document.getElementById('camSleepPopover');
    if (popover) {
      popover.querySelectorAll('.sleep-menu-item').forEach(b => {
        const val = b.getAttribute('data-minutes');
        b.classList.toggle('active', val !== 'custom' && Number(val) === camSleepTimer.durationMinutes);
      });
    }

    if (remaining <= 0) {
      camSleepTimer.active = false;
      if (mobileSleepPill) mobileSleepPill.style.display = 'none';
      if (camSleepBadge) camSleepBadge.style.display = 'none';
      if (btnCamSleepTimer) btnCamSleepTimer.classList.remove('active');
      handleSessionEnded('Individual device sleep timer reached. Camera sensor powered down.');
    }
  } else {
    if (mobileSleepPill) mobileSleepPill.style.display = 'none';
    if (camSleepBadge) camSleepBadge.style.display = 'none';
    if (btnCamSleepTimer) btnCamSleepTimer.classList.remove('active');
    const popover = document.getElementById('camSleepPopover');
    if (popover) {
      popover.querySelectorAll('.sleep-menu-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-minutes') === '0');
      });
    }
  }
}

async function setCameraSleepTimer(minutes) {
  const numMinutes = (minutes !== null && minutes !== undefined && !isNaN(minutes) && Number(minutes) > 0)
    ? Number(minutes)
    : null;
  const active = numMinutes !== null;
  const expiresAt = active ? Date.now() + numMinutes * 60 * 1000 : null;

  camSleepTimer = { active, expiresAt, durationMinutes: numMinutes };
  updateCamSleepTimerUI();

  try {
    await fetch(`/api/sessions/${sessionId}/sleep-timer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: deviceId, minutes: numMinutes }),
    });
  } catch (e) {}

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'set-sleep-timer',
      sessionId,
      target: deviceId,
      minutes: numMinutes,
    }));
  }

  window.showToast(active ? `Sleep Timer: ${numMinutes} minute${numMinutes === 1 ? '' : 's'}` : 'Sleep Timer turned Off');
}

let streamStartTime = null;
let streamClockInterval = null;
let audioContext = null;
let audioAnalyser = null;
let vuAnimFrame = null;

function startStreamClock() {
  streamStartTime = Date.now();
  const clockEl = document.getElementById('streamClockDisplay');
  const hud = document.getElementById('viewfinderStreamHud');
  if (hud) hud.style.display = 'inline-flex';
  if (streamClockInterval) clearInterval(streamClockInterval);
  streamClockInterval = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - streamStartTime) / 1000);
    const hrs = Math.floor(elapsedSec / 3600);
    const mins = Math.floor((elapsedSec % 3600) / 60);
    const secs = elapsedSec % 60;
    if (clockEl) {
      clockEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

function startAudioMeter(stream) {
  try {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    const meterEl = document.getElementById('audioVuMeter');
    if (meterEl) meterEl.style.display = 'inline-flex';
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (audioContext) audioContext.close().catch(() => {});
    audioContext = new AudioCtx();
    const source = audioContext.createMediaStreamSource(stream);
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 32;
    source.connect(audioAnalyser);
    const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
    const bars = meterEl ? meterEl.querySelectorAll('.vu-bar') : [];

    function updateMeter() {
      if (!audioAnalyser) return;
      audioAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      bars.forEach((bar, idx) => {
        const factor = (idx + 1) * 3;
        const h = Math.max(3, Math.min(14, (avg / 255) * factor * 5));
        bar.style.height = `${h}px`;
      });
      vuAnimFrame = requestAnimationFrame(updateMeter);
    }
    updateMeter();
  } catch (e) {
    console.warn('Audio VU meter error:', e);
  }
}

// Initial Boot
async function initCamera() {
  // Wire up location suggestion chips
  document.querySelectorAll('.location-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const loc = chip.getAttribute('data-loc');
      if (deviceNameInput) {
        deviceNameInput.value = loc;
        deviceName = loc;
        sessionStorage.setItem('sentinel_device_name', loc);
      }
      document.querySelectorAll('.location-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Handle manual session token entry if missing from URL
  if (!sessionId) {
    const sessionManualBox = document.getElementById('sessionManualBox');
    if (sessionManualBox) sessionManualBox.style.display = 'block';
    const manualBtn = document.getElementById('btnManualConnect');
    const manualInput = document.getElementById('manualSessionInput');
    if (manualBtn && manualInput) {
      manualBtn.addEventListener('click', () => {
        const val = manualInput.value.trim();
        if (val) {
          window.location.href = `/camera.html?session=${encodeURIComponent(val)}`;
        }
      });
      manualInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = manualInput.value.trim();
          if (val) window.location.href = `/camera.html?session=${encodeURIComponent(val)}`;
        }
      });
    }
    showError('Pairing key required. Please scan the QR code from the host monitor or enter the session key.');
    return;
  }

  // Detect platform and enumerate real hardware sensors
  const platform = detectDevicePlatform();
  await enumerateHardwareSensors(platform);

  // Verify session validity with server
  try {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) {
      if (res.status === 410) {
        showError('This camera session has expired. Please ask the host for a new QR code.');
      } else {
        showError('Session not found or already terminated.');
      }
      return;
    }
    const sessionData = await res.json();
    if (sessionData.sleepTimer) {
      camSleepTimer = sessionData.sleepTimer;
      updateCamSleepTimerUI();
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }

  // Connect signaling
  connectWebSocket();

  // User explicitly clicks "Add Camera of Current Device"
  btnAllowStart.addEventListener('click', handleUserConsentAndStart);
  btnFlipCamera.addEventListener('click', toggleCameraFacing);
  btnToggleTorch.addEventListener('click', toggleTorch);
  btnMobileEndSession.addEventListener('click', handleEndSessionClick);
  const btnHeaderExit = document.getElementById('btnHeaderExit');
  if (btnHeaderExit) btnHeaderExit.addEventListener('click', handleEndSessionClick);

  if (btnToggleMic) btnToggleMic.addEventListener('click', toggleMicMute);
  if (btnZoom) btnZoom.addEventListener('click', toggleDigitalZoom);

  // Sleep Timer Button & Popover
  const btnCamSleepTimer = document.getElementById('btnCamSleepTimer');
  const camSleepPopover = document.getElementById('camSleepPopover');
  if (btnCamSleepTimer && camSleepPopover) {
    btnCamSleepTimer.addEventListener('click', (e) => {
      e.stopPropagation();
      camSleepPopover.style.display = camSleepPopover.style.display === 'block' ? 'none' : 'block';
    });

    camSleepPopover.querySelectorAll('.sleep-menu-item').forEach(itemBtn => {
      itemBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        camSleepPopover.style.display = 'none';
        const val = itemBtn.getAttribute('data-minutes');
        if (val === 'custom') {
          const input = prompt('Enter sleep duration in minutes for this camera:', '45');
          if (input && !isNaN(input) && Number(input) > 0) {
            setCameraSleepTimer(Number(input));
          }
        } else {
          setCameraSleepTimer(Number(val));
        }
      });
    });

    document.addEventListener('click', () => {
      camSleepPopover.style.display = 'none';
    });
  }

  initCamSleepTimerTicker();
}

function updateStatus(state, text) {
  mobileStatusDot.className = `status-dot ${state}`;
  mobileStatusText.textContent = text;
  if (state === 'live') {
    mobileStatusIndicator.classList.add('streaming');
  } else {
    mobileStatusIndicator.classList.remove('streaming');
  }
}

function showError(msg) {
  if (errorNotice) {
    errorNotice.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 0.35rem;">⚠️ Access Alert</div>
      <div>${msg}</div>
    `;
    errorNotice.style.display = 'block';
  }
  if (btnAllowStart) {
    btnAllowStart.disabled = false;
  }
  updateStatus('ended', 'SESSION ERROR');
}

// Signaling WebSocket / Serverless Universal Channel
function connectWebSocket() {
  if (window.UniversalSignalingChannel) {
    ws = new window.UniversalSignalingChannel({
      sessionId,
      role: 'camera',
      deviceId,
      deviceName: deviceName || `Camera ${deviceId}`,
    });
  } else {
    const wsUrl = window.getWebSocketUrl();
    ws = new WebSocket(wsUrl);
  }

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'join',
      sessionId,
      role: 'camera',
      deviceId,
      deviceName: deviceName || `Camera ${deviceId}`,
    }));
    updateStatus('waiting', 'CONNECTED TO HOST');
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
        console.log('[Camera] Successfully paired with session as', msg.deviceId || deviceId);
        if (msg.deviceId) {
          deviceId = msg.deviceId;
          sessionStorage.setItem('sentinel_device_id', deviceId);
          if (headerDeviceId) headerDeviceId.textContent = deviceId;
          if (deviceIdDisplay) deviceIdDisplay.textContent = deviceId;
        }
        if (msg.sleepTimer) {
          camSleepTimer = msg.sleepTimer;
          updateCamSleepTimerUI();
        }
        break;

      case 'answer':
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          console.log('[Camera] WebRTC Handshake Complete');
        }
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

      case 'sleep-timer-updated':
        if (msg.target === 'all' || msg.deviceId === deviceId) {
          camSleepTimer = msg.sleepTimer || { active: false, expiresAt: null, durationMinutes: null };
          updateCamSleepTimerUI();
          if (camSleepTimer.active) {
            window.showToast(`Sleep Timer updated: ${camSleepTimer.durationMinutes}m`);
          } else {
            window.showToast('Sleep Timer disabled');
          }
        }
        break;

      case 'device-sleep':
        handleSessionEnded('Individual device sleep timer reached. Camera sensor powered down.');
        break;

      case 'all-sleep':
        handleSessionEnded('Master sleep timer reached. Camera sensor powered down.');
        break;

      case 'device-kicked':
        handleSessionEnded(`Disconnected by host operator: ${msg.reason || 'Kicked from grid'}`);
        break;

      case 'session-extended':
        window.showToast('Host extended session duration (+10 mins)');
        break;

      case 'session-ended':
        handleSessionEnded(msg.reason || 'Session closed by host');
        break;

      case 'session-expired':
        handleSessionEnded('Session expired');
        break;

      case 'error':
        showError(msg.message);
        break;
    }
  };

  ws.onclose = () => {
    console.log('[Camera] WebSocket closed');
  };
}

// Explicit User Consent Step (Browser Camera Permissions)
async function handleUserConsentAndStart() {
  btnAllowStart.disabled = true;
  btnAllowStart.textContent = 'Requesting Permission...';

  const sourceChoice = facingSelect.value || 'environment';
  const resChoice = resolutionSelect.value || '720';
  const wantAudio = micAudioToggle ? micAudioToggle.checked : false;

  const width = resChoice === '1080' ? 1920 : 1280;
  const height = resChoice === '1080' ? 1080 : 720;

  try {
    if (sourceChoice === 'simulator') {
      // VIRTUAL SURVEILLANCE TEST PATTERN STREAM
      localStream = createSimulatorStream(width, height);
      console.log('[Camera] Started Virtual Surveillance Test Pattern Simulator');
    } else {
      // Real Hardware Camera Request
      const videoConstraint = sourceChoice.length > 20
        ? { deviceId: { exact: sourceChoice }, width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30 } }
        : { facingMode: { ideal: sourceChoice }, width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30 } };

      const constraints = {
        audio: wantAudio,
        video: videoConstraint,
      };

      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Camera] User explicitly granted camera permissions');
    }

    // Attach stream to local preview viewfinder
    cameraPreviewVideo.srcObject = localStream;
    cameraPreviewVideo.classList.add('active');

    // Check for torch capability on rear camera
    const videoTrack = localStream.getVideoTracks()[0];
    torchTrack = videoTrack;
    const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    if (capabilities.torch) {
      btnToggleTorch.style.display = 'flex';
    } else {
      btnToggleTorch.style.display = 'none';
    }

    // Show mic toggle if audio track exists
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack && btnToggleMic) {
      btnToggleMic.style.display = 'flex';
    }

    // Hide permission overlay & show active viewfinder controls
    permissionOverlay.style.display = 'none';
    streamingControls.style.display = 'flex';

    // Start live HUD clock & Audio VU meter
    startStreamClock();
    if (audioTrack) {
      startAudioMeter(localStream);
    }
    const streamResBadge = document.getElementById('streamResBadge');
    if (streamResBadge) {
      streamResBadge.textContent = `${height}P • 30FPS`;
    }

    // Store chosen device name
    if (deviceNameInput && deviceNameInput.value.trim()) {
      deviceName = deviceNameInput.value.trim();
      sessionStorage.setItem('sentinel_device_name', deviceName);
    }
    if (!deviceName) {
      deviceName = `Camera ${deviceId}`;
    }

    if (viewfinderDeviceHud) {
      viewfinderDeviceHud.style.display = 'flex';
      if (viewfinderDeviceId) viewfinderDeviceId.textContent = deviceId;
      if (viewfinderDeviceName) viewfinderDeviceName.textContent = deviceName;
    }

    updateStatus('live', 'LIVE STREAMING');
    window.showToast(`Camera live: streaming as [${deviceId}]`);

    // Notify host that camera is ready
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'camera-ready',
        sessionId,
        deviceId,
        deviceName,
        facingMode: sourceChoice,
        resolution: `${width}x${height}`,
        hasAudio: !!audioTrack,
      }));
    }

    // Start WebRTC PeerConnection and create SDP offer
    await startPeerConnection();
  } catch (err) {
    console.error('Camera permission denied or error:', err);
    btnAllowStart.disabled = false;
    btnAllowStart.innerHTML = `
      <span class="btn-hero-icon">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v6m3-3H9" />
        </svg>
      </span>
      <span>Retry Add Camera of Current Device</span>
    `;

    let guidance = `Camera access error: ${err.message}`;
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      guidance = `
        <strong>Camera Permission Was Denied</strong><br>
        • iOS Safari: Tap 'aA' in address bar → Website Settings → Camera → Allow.<br>
        • Android Chrome: Tap Lock icon in address bar → Permissions → Camera → Allow.<br>
        <em>Tip: You can also select "Virtual CCTV Test Pattern" above to test without hardware camera!</em>
      `;
    } else if (err.name === 'NotFoundError') {
      guidance = 'No camera sensor was found. You can select "Virtual CCTV Test Pattern" above to test.';
    } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      guidance = 'Mobile browsers require HTTPS for camera access over LAN Wi-Fi. Please open the HTTPS link from the QR code.';
    }
    showError(guidance);
  }
}
// Toggle Microphone Mute during live stream
function toggleMicMute() {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  isMicMuted = !isMicMuted;
  audioTrack.enabled = !isMicMuted;
  btnToggleMic.classList.toggle('active', !isMicMuted);
  window.showToast(isMicMuted ? 'Microphone Muted' : 'Microphone Live');
}

// Digital Zoom Toggle (1x -> 1.5x -> 2x -> 2.5x -> 3x -> 1x)
function toggleDigitalZoom() {
  const zoomLevels = [1.0, 1.5, 2.0, 2.5, 3.0];
  const nextIdx = (zoomLevels.indexOf(currentZoom) + 1) % zoomLevels.length;
  currentZoom = zoomLevels[nextIdx];

  if (zoomLabel) zoomLabel.textContent = `${currentZoom}x`;
  cameraPreviewVideo.style.transform = `scale(${currentZoom})`;
  window.showToast(`Zoom: ${currentZoom}x`);

  // Also apply hardware zoom constraint if supported
  if (torchTrack && torchTrack.getCapabilities) {
    const caps = torchTrack.getCapabilities();
    if (caps.zoom) {
      const targetHwZoom = Math.min(caps.zoom.max, Math.max(caps.zoom.min, currentZoom));
      torchTrack.applyConstraints({ advanced: [{ zoom: targetHwZoom }] }).catch(() => {});
    }
  }
}

// WebRTC Offer Generation
async function startPeerConnection() {
  if (pc) {
    pc.close();
  }

  pc = new RTCPeerConnection(window.RTC_CONFIG);

  // Add camera tracks to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.onicecandidate = (event) => {
    if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ice-candidate',
        sessionId,
        deviceId,
        candidate: event.candidate,
      }));
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log('[Camera] ICE Connection State:', pc.iceConnectionState);
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      updateStatus('live', 'LIVE STREAM ENCRYPTED');
    } else if (pc.iceConnectionState === 'disconnected') {
      updateStatus('ended', 'HOST DISCONNECTED');
    }
  };

  const offer = await pc.createOffer({
    offerToReceiveAudio: false,
    offerToReceiveVideo: false,
  });
  await pc.setLocalDescription(offer);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'offer',
      sessionId,
      deviceId,
      sdp: pc.localDescription,
    }));
  }
}

// Switch between Front and Rear Camera
async function toggleCameraFacing() {
  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  facingSelect.value = currentFacingMode;

  // Stop current tracks
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }

  try {
    const resChoice = resolutionSelect.value || '720';
    const width = resChoice === '1080' ? 1920 : 1280;
    const height = resChoice === '1080' ? 1080 : 720;

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { exact: currentFacingMode },
        width: { ideal: width },
        height: { ideal: height },
      },
    });

    cameraPreviewVideo.srcObject = localStream;

    // Replace video track in RTCPeerConnection
    const newVideoTrack = localStream.getVideoTracks()[0];
    torchTrack = newVideoTrack;

    if (pc) {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
      }
    }

    // Update mirror class for front selfie camera
    if (currentFacingMode === 'user') {
      cameraPreviewVideo.style.transform = 'scaleX(-1)';
      btnToggleTorch.style.display = 'none';
    } else {
      cameraPreviewVideo.style.transform = 'none';
      const capabilities = newVideoTrack.getCapabilities ? newVideoTrack.getCapabilities() : {};
      btnToggleTorch.style.display = capabilities.torch ? 'flex' : 'none';
    }

    window.showToast(`Switched to ${currentFacingMode === 'user' ? 'Front' : 'Rear'} Camera`);
  } catch (e) {
    console.error('Camera toggle failed:', e);
    // Fallback without exact facingMode
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  }
}

// Toggle Flashlight / Torch (if hardware supported)
async function toggleTorch() {
  if (!torchTrack) return;
  try {
    isTorchOn = !isTorchOn;
    await torchTrack.applyConstraints({
      advanced: [{ torch: isTorchOn }]
    });
    btnToggleTorch.classList.toggle('active', isTorchOn);
    window.showToast(isTorchOn ? 'Torch On' : 'Torch Off');
  } catch (err) {
    console.error('Torch error:', err);
    window.showToast('Torch not supported on this lens');
  }
}

// Explicit End Session action (Only terminates THIS camera device!)
async function handleEndSessionClick() {
  if (confirm('Disconnect this camera? Other cameras in this session will remain active.')) {
    try {
      await fetch(`/api/sessions/${sessionId}/cameras/${deviceId}/end`, { method: 'POST' });
    } catch (e) {}
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'leave-device',
        sessionId,
        deviceId,
        reason: 'Camera disconnected by device owner',
      }));
    }
    handleSessionEnded('You disconnected this camera. Other cameras in this session remain active.');
  }
}

// Hardware Safe Exit & Window Close Function
window.closeWindowSafe = function() {
  console.log('[Camera] Attempting window close...');

  // 1. Try browser window.close()
  try {
    window.close();
  } catch (e) {}

  // 2. Try window.open self hack (works in some Chrome/Android & desktop webviews)
  try {
    window.open('', '_self', '');
    window.close();
  } catch (e) {}

  // 3. Fallback: if browser sandbox prohibits script tab closing:
  setTimeout(() => {
    // If navigation history exists, try returning back
    if (window.history && window.history.length > 1) {
      window.history.back();
      return;
    }

    // Show clear feedback and return to dashboard button
    const notice = document.getElementById('closeWindowHelpNotice');
    if (notice) notice.style.display = 'block';

    const btn = document.getElementById('btnCloseWindowSafe');
    if (btn) {
      btn.innerHTML = `
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Return to Dashboard</span>
      `;
      btn.onclick = () => { window.location.href = '/login.html'; };
    }
  }, 200);
};

// Hardware Cleanup & Termination
function handleSessionEnded(reason) {
  if (camSleepInterval) {
    clearInterval(camSleepInterval);
    camSleepInterval = null;
  }

  // HARDWARE SAFETY: Stop all camera sensor tracks immediately!
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      track.stop();
      console.log('[Camera] Sensor track stopped:', track.label);
    });
    localStream = null;
  }

  if (cameraPreviewVideo) {
    cameraPreviewVideo.srcObject = null;
    cameraPreviewVideo.classList.remove('active');
  }

  if (pc) {
    pc.close();
    pc = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  // Display clean ended modal
  streamingControls.style.display = 'none';
  permissionOverlay.style.display = 'flex';
  permissionOverlay.innerHTML = `
    <div class="permission-modal">
      <div class="permission-shield" style="border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h2 class="permission-title">Session Ended</h2>
      <p class="permission-text">${reason || 'The camera connection has been terminated.'}</p>
      <div class="consent-notice-box" style="text-align: center; border-color: rgba(16, 185, 129, 0.3);">
        <div class="consent-notice-title" style="justify-content: center; color: #a7f3d0;">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Camera Sensor Powered Off
        </div>
        <p class="consent-notice-desc">All video streaming has stopped and browser hardware permissions were released. You can safely close this tab.</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; width: 100%;">
        <button class="btn btn-outline btn-block" id="btnCloseWindowSafe" onclick="window.closeWindowSafe()">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Close Window</span>
        </button>
        <button class="btn btn-primary btn-block" onclick="window.location.href='/login.html'">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Return to Dashboard</span>
        </button>
      </div>
      <div id="closeWindowHelpNotice" style="display: none; margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-tertiary); text-align: center;">
        ℹ️ Camera sensors are powered down. Your browser prevents scripts from auto-closing tabs opened via QR scan. You can safely swipe this tab closed or tap above to return.
      </div>
    </div>
  `;

  updateStatus('ended', 'SESSION TERMINATED');
  window.showToast('Session terminated');
}

window.addEventListener('DOMContentLoaded', initCamera);
