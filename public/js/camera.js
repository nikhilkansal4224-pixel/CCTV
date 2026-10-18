// SENTINEL // Scanned Remote Camera Script

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session');

let ws = null;
let pc = null;
let localStream = null;
let currentFacingMode = 'environment'; // default rear camera
let isTorchOn = false;
let torchTrack = null;

// UI Elements
const permissionOverlay = document.getElementById('permissionOverlay');
const btnAllowStart = document.getElementById('btnAllowStart');
const facingSelect = document.getElementById('facingSelect');
const resolutionSelect = document.getElementById('resolutionSelect');
const sessionTokenDisplay = document.getElementById('sessionTokenDisplay');
const cameraPreviewVideo = document.getElementById('cameraPreviewVideo');
const mobileStatusIndicator = document.getElementById('mobileStatusIndicator');
const mobileStatusDot = document.getElementById('mobileStatusDot');
const mobileStatusText = document.getElementById('mobileStatusText');
const btnFlipCamera = document.getElementById('btnFlipCamera');
const btnToggleTorch = document.getElementById('btnToggleTorch');
const btnMobileEndSession = document.getElementById('btnMobileEndSession');
const streamingControls = document.getElementById('streamingControls');
const errorNotice = document.getElementById('errorNotice');

if (sessionTokenDisplay) {
  sessionTokenDisplay.textContent = sessionId || 'INVALID';
}

// Initial Boot
async function initCamera() {
  if (!sessionId) {
    showError('Invalid or missing session ID in link. Please re-scan QR code.');
    return;
  }

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
  } catch (err) {
    console.error('Session check failed:', err);
  }

  // Connect signaling WebSocket
  connectWebSocket();

  // User must explicitly click "Allow & Start Camera"
  btnAllowStart.addEventListener('click', handleUserConsentAndStart);
  btnFlipCamera.addEventListener('click', toggleCameraFacing);
  btnToggleTorch.addEventListener('click', toggleTorch);
  btnMobileEndSession.addEventListener('click', handleEndSessionClick);
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
    errorNotice.textContent = msg;
    errorNotice.style.display = 'block';
  }
  if (btnAllowStart) {
    btnAllowStart.disabled = true;
  }
  updateStatus('ended', 'SESSION ERROR');
}

// Signaling WebSocket
function connectWebSocket() {
  const wsUrl = window.getWebSocketUrl();
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'join',
      sessionId,
      role: 'camera',
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
        console.log('[Camera] Successfully paired with session');
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

  currentFacingMode = facingSelect.value || 'environment';
  const resChoice = resolutionSelect.value || '720';

  const width = resChoice === '1080' ? 1920 : 1280;
  const height = resChoice === '1080' ? 1080 : 720;

  const constraints = {
    audio: false,
    video: {
      facingMode: { ideal: currentFacingMode },
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: 30 },
    },
  };

  try {
    // STANDARD BROWSER CAMERA CONSENT PROMPT
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('[Camera] User explicitly granted camera permissions');

    // Attach stream to local preview viewfinder
    cameraPreviewVideo.srcObject = localStream;
    cameraPreviewVideo.classList.add('active');

    // Check for torch capability on rear camera
    const track = localStream.getVideoTracks()[0];
    torchTrack = track;
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    if (capabilities.torch) {
      btnToggleTorch.style.display = 'flex';
    } else {
      btnToggleTorch.style.display = 'none';
    }

    // Hide permission overlay & show active viewfinder controls
    permissionOverlay.style.display = 'none';
    streamingControls.style.display = 'flex';

    updateStatus('live', 'LIVE STREAMING');
    window.showToast('Camera live: streaming to host');

    // Notify host that camera is ready
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'camera-ready',
        sessionId,
        facingMode: currentFacingMode,
        resolution: `${width}x${height}`,
      }));
    }

    // Start WebRTC PeerConnection and create SDP offer
    await startPeerConnection();
  } catch (err) {
    console.error('Camera permission denied or error:', err);
    btnAllowStart.disabled = false;
    btnAllowStart.innerHTML = `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Retry Allow & Start Camera`;

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      showError('Camera permission was denied. Please allow camera access in browser site settings and reload.');
    } else if (err.name === 'NotFoundError') {
      showError('No camera sensor found on this device.');
    } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      showError('Camera requires HTTPS on mobile devices. Please open the HTTPS link from the QR code.');
    } else {
      showError(`Camera access error: ${err.message}`);
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

// Explicit End Session action
async function handleEndSessionClick() {
  if (confirm('Are you sure you want to end this camera session? Camera access will terminate immediately.')) {
    try {
      await fetch(`/api/sessions/${sessionId}/end`, { method: 'POST' });
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'end-session',
          sessionId,
          reason: 'Camera device owner ended the session',
        }));
      }
    } catch (e) {}
    handleSessionEnded('You ended the camera session');
  }
}

// Hardware Cleanup & Termination
function handleSessionEnded(reason) {
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
      <button class="btn btn-outline btn-block" onclick="window.close()">Close Window</button>
    </div>
  `;

  updateStatus('ended', 'SESSION TERMINATED');
  window.showToast('Session terminated');
}

window.addEventListener('DOMContentLoaded', initCamera);
