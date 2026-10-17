/**
 * ARGUS SURREAL CCTV // MOBILE CAMERA TRANSMITTER NODE
 * Handles WebRTC PeerJS live video uplink, camera flip (front/back), torch toggle,
 * battery reporting, screen wake lock, and registration to local MongoDB.
 */

class ArgusCameraNode {
  constructor() {
    this.peer = null;
    this.currentStream = null;
    this.activeCall = null;
    this.dataConn = null;
    this.facingMode = 'environment'; // Start with back camera
    this.hasTorch = false;
    this.torchOn = false;
    this.wakeLock = null;

    // Elements
    this.videoEl = document.getElementById('mobilePreview');
    this.statusPill = document.getElementById('mobileStatusPill');
    this.statusText = document.getElementById('mobileStatusText');
    this.roomIdEl = document.getElementById('mobileRoomId');
    this.flipBtn = document.getElementById('btnFlipCam');
    this.torchBtn = document.getElementById('btnTorch');
    this.batteryEl = document.getElementById('batteryLevel');
    this.roomDialog = document.getElementById('mobileRoomDialog');
    this.inputManualPin = document.getElementById('inputManualPin');
    this.btnConnectManualPin = document.getElementById('btnConnectManualPin');
    this.btnChangeRoom = document.getElementById('btnChangeRoom');
    this.btnTapToStart = document.getElementById('btnTapToStart');

    // Parse URL room parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    this.roomId = (urlParams.get('room') || localStorage.getItem('argus_last_room') || '').toUpperCase().trim();
    this.camName = urlParams.get('name') || `Mobile Lens (${navigator.userAgent.includes('iPhone') ? 'iPhone' : (navigator.userAgent.includes('Android') ? 'Android' : 'Mobile')})`;

    this.init();
  }

  async init() {
    this.bindEvents();
    this.requestWakeLock();
    this.monitorBattery();

    if (!this.roomId) {
      this.showRoomDialog();
    } else {
      if (this.roomIdEl) this.roomIdEl.textContent = this.roomId;
      localStorage.setItem('argus_last_room', this.roomId);
      await this.startCamera();
      this.connectToHub();
    }
  }

  showRoomDialog() {
    if (this.roomDialog) {
      this.roomDialog.style.display = 'flex';
      if (this.inputManualPin) {
        this.inputManualPin.focus();
      }
    }
  }

  hideRoomDialog() {
    if (this.roomDialog) {
      this.roomDialog.style.display = 'none';
    }
  }

  bindEvents() {
    if (this.flipBtn) {
      this.flipBtn.addEventListener('click', () => this.toggleCameraFlip());
    }
    if (this.torchBtn) {
      this.torchBtn.addEventListener('click', () => this.toggleTorch());
    }
    if (this.btnChangeRoom) {
      this.btnChangeRoom.addEventListener('click', () => this.showRoomDialog());
    }
    if (this.btnConnectManualPin && this.inputManualPin) {
      this.btnConnectManualPin.addEventListener('click', () => {
        const pin = this.inputManualPin.value.trim().toUpperCase();
        if (pin) {
          this.roomId = pin;
          localStorage.setItem('argus_last_room', this.roomId);
          if (this.roomIdEl) this.roomIdEl.textContent = this.roomId;
          this.hideRoomDialog();
          this.startCamera().then(() => this.connectToHub());
        }
      });
      this.inputManualPin.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.btnConnectManualPin.click();
        }
      });
    }

    if (this.btnTapToStart) {
      this.btnTapToStart.addEventListener('click', async () => {
        this.btnTapToStart.style.display = 'none';
        await this.startCamera();
        this.connectToHub();
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.requestWakeLock();
      }
    });
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {}
    }
  }

  async monitorBattery() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        const updateBattery = () => {
          const pct = Math.round(battery.level * 100);
          if (this.batteryEl) this.batteryEl.textContent = `${pct}%`;
          if (this.dataConn && this.dataConn.open) {
            this.dataConn.send({ type: 'TELEMETRY', battery: pct });
          }
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
      } catch (e) {}
    }
  }

  async startCamera() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t => t.stop());
    }

    this.setStatus('INITIALIZING LENS...', 'warning');

    const constraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: false
    };

    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoEl) {
        this.videoEl.srcObject = this.currentStream;
        await this.videoEl.play().catch(() => {
          if (this.btnTapToStart) this.btnTapToStart.style.display = 'flex';
        });
      }

      const track = this.currentStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        this.hasTorch = true;
        if (this.torchBtn) this.torchBtn.style.display = 'inline-flex';
      } else {
        if (this.torchBtn) this.torchBtn.style.display = 'none';
      }

      this.setStatus('LENS ACTIVE', 'ready');

      // Replace track if call is ongoing
      if (this.activeCall && this.activeCall.peerConnection) {
        const senders = this.activeCall.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(this.currentStream.getVideoTracks()[0]);
        }
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      this.setStatus('CAMERA ACCESS REQUIRED', 'danger');
      if (this.btnTapToStart) this.btnTapToStart.style.display = 'flex';
    }
  }

  async toggleCameraFlip() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    await this.startCamera();
  }

  async toggleTorch() {
    if (!this.hasTorch || !this.currentStream) return;
    try {
      const track = this.currentStream.getVideoTracks()[0];
      this.torchOn = !this.torchOn;
      await track.applyConstraints({ advanced: [{ torch: this.torchOn }] });
      if (this.torchBtn) {
        this.torchBtn.style.color = this.torchOn ? '#00f0ff' : '#ffffff';
        this.torchBtn.style.borderColor = this.torchOn ? '#00f0ff' : 'var(--border-glass)';
      }
    } catch (err) {}
  }

  connectToHub() {
    if (!this.roomId) return;
    const hubId = `argus-hub-${this.roomId}`;
    const clientId = `argus-cam-${Math.random().toString(36).substring(2, 8)}`;

    this.setStatus('CONNECTING TO HUB...', 'warning');

    // Register to MongoDB backend
    fetch('/api/cameras/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camId: clientId,
        camName: this.camName,
        type: 'mobile',
        facingMode: this.facingMode
      })
    }).catch(() => {});

    // Initialize PeerJS client
    this.peer = new Peer(clientId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun.relay.metered.ca:80' }
        ]
      }
    });

    this.peer.on('open', (id) => {
      this.initiateCallToHub(hubId);
    });

    this.peer.on('error', (err) => {
      console.warn('Peer error:', err);
      this.setStatus(`PEER: ${err.type || 'RETRYING'}`, 'danger');
      setTimeout(() => this.initiateCallToHub(hubId), 4000);
    });

    this.peer.on('disconnected', () => {
      this.setStatus('RECONNECTING...', 'danger');
      this.peer.reconnect();
    });
  }

  initiateCallToHub(hubId) {
    if (!this.currentStream) {
      setTimeout(() => this.initiateCallToHub(hubId), 1000);
      return;
    }

    this.setStatus('UPLINKING...', 'warning');

    // Data Channel
    try {
      this.dataConn = this.peer.connect(hubId, {
        metadata: { name: this.camName, facingMode: this.facingMode }
      });
      this.dataConn.on('open', () => {
        this.dataConn.send({
          type: 'IDENTIFY',
          camName: this.camName,
          clientType: 'MOBILE_CCTV'
        });
      });
    } catch (e) {}

    // Video Call
    try {
      this.activeCall = this.peer.call(hubId, this.currentStream, {
        metadata: { camName: this.camName, type: 'MOBILE_CAMERA' }
      });

      this.activeCall.on('close', () => {
        this.setStatus('HUB CLOSED STREAM', 'warning');
      });

      this.activeCall.on('error', (err) => {
        this.setStatus('UPLINK ERROR', 'danger');
      });

      this.setStatus('LIVE TO HUB // 1080p', 'active');
    } catch (err) {
      this.setStatus('FAILED TO CALL HUB', 'danger');
    }
  }

  setStatus(text, state) {
    if (this.statusText) this.statusText.textContent = text;
    if (this.statusPill) {
      const dot = this.statusPill.querySelector('.status-dot');
      if (dot) {
        dot.className = 'status-dot';
        if (state === 'active') dot.classList.add('active');
        if (state === 'danger') dot.classList.add('alert');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cameraNode = new ArgusCameraNode();
});
