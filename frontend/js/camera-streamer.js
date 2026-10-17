/**
 * Mobile Camera Streamer Controller
 * Runs on mobile browser when connected via QR Code
 */

class MobileCameraStreamer {
  constructor() {
    this.video = document.getElementById('mobile-video');
    this.statusEl = document.getElementById('stream-status-text');
    this.pulseDot = document.getElementById('pulse-indicator');
    this.fpsCounter = document.getElementById('fps-counter');
    this.permissionModal = document.getElementById('permission-modal');
    this.startBtn = document.getElementById('btn-start-stream');
    this.switchCamBtn = document.getElementById('btn-switch-cam');
    this.torchBtn = document.getElementById('btn-torch');

    this.stream = null;
    this.currentFacingMode = 'environment'; // 'environment' (back) or 'user' (front)
    this.isTorchOn = false;
    this.hasTorchCapability = false;
    this.track = null;

    this.peerConnection = null;
    this.socket = null;
    this.isStreaming = false;

    // Generate or read persistent camera ID
    this.cameraId = this.getOrCreateCameraId();
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();

    this.init();
  }

  getOrCreateCameraId() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id');
    if (paramId) return paramId;

    let storedId = localStorage.getItem('cctv_mobile_cam_id');
    if (!storedId) {
      storedId = 'cam-mob-' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('cctv_mobile_cam_id', storedId);
    }
    return storedId;
  }

  init() {
    this.startBtn.addEventListener('click', () => {
      this.permissionModal.style.display = 'none';
      this.startCamera();
    });

    this.switchCamBtn.addEventListener('click', () => this.switchCamera());
    this.torchBtn.addEventListener('click', () => this.toggleTorch());

    this.connectSocket();
  }

  connectSocket() {
    try {
      this.socket = io({
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('[Mobile] Connected to CCTV Hub Socket:', this.socket.id);
        this.updateStatus('CONNECTED TO COMMAND HUB', false);

        if (this.isStreaming) {
          this.registerWithServer();
        }
      });

      this.socket.on('disconnect', () => {
        this.updateStatus('DISCONNECTED - RECONNECTING...', false);
      });

      // Handle WebRTC Answer from Dashboard
      this.socket.on('webrtc-answer', async ({ answer }) => {
        if (this.peerConnection) {
          console.log('[Mobile WebRTC] Answer received from dashboard');
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // Handle ICE Candidates from Dashboard
      this.socket.on('webrtc-ice-candidate', async ({ candidate }) => {
        if (this.peerConnection && candidate) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('[Mobile WebRTC] Error adding ICE candidate:', e);
          }
        }
      });

      // Handle Remote Controls from Dashboard
      this.socket.on('remote-control', (data) => {
        console.log('[Mobile] Received remote control:', data);
        if (data.action === 'toggle-torch') {
          this.toggleTorch();
        } else if (data.action === 'switch-camera') {
          this.switchCamera();
        }
      });

    } catch (e) {
      console.error('[Mobile] Socket initialization error:', e);
    }
  }

  async startCamera() {
    try {
      this.updateStatus('REQUESTING SENSOR ACCESS...', false);

      const constraints = {
        video: {
          facingMode: { ideal: this.currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();

      this.track = this.stream.getVideoTracks()[0];
      this.checkTorchSupport();

      this.isStreaming = true;
      this.updateStatus('LIVE TRANSMISSION ACTIVE', true);

      this.registerWithServer();
      this.setupWebRTC();
      this.startFrameStreamingFallback();
      this.startFpsMonitor();

    } catch (err) {
      console.error('[Mobile] Camera start error:', err);
      alert('Camera access denied or failed: ' + err.message);
      this.updateStatus('CAMERA ERROR', false);
    }
  }

  async switchCamera() {
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    await this.startCamera();
  }

  checkTorchSupport() {
    if (!this.track) return;
    const capabilities = this.track.getCapabilities ? this.track.getCapabilities() : {};
    this.hasTorchCapability = !!capabilities.torch;
    if (this.hasTorchCapability) {
      this.torchBtn.style.display = 'flex';
    } else {
      this.torchBtn.style.opacity = '0.4';
    }
  }

  async toggleTorch() {
    if (!this.track || !this.hasTorchCapability) return;
    try {
      this.isTorchOn = !this.isTorchOn;
      await this.track.applyConstraints({
        advanced: [{ torch: this.isTorchOn }]
      });
      this.torchBtn.classList.toggle('active', this.isTorchOn);
    } catch (e) {
      console.warn('Torch constraint error:', e);
    }
  }

  registerWithServer() {
    if (!this.socket || !this.socket.connected) return;
    const deviceName = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Apple iPhone' :
                       /Android/.test(navigator.userAgent) ? 'Android Mobile' : 'Remote Mobile Unit';

    this.socket.emit('register-camera', {
      id: this.cameraId,
      name: `${deviceName} (${this.cameraId.slice(-4)})`,
      type: 'mobile',
      hasTorch: this.hasTorchCapability
    });
  }

  async setupWebRTC() {
    if (!this.socket || !this.stream) return;

    try {
      if (this.peerConnection) {
        this.peerConnection.close();
      }

      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      this.stream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.stream);
      });

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            cameraId: this.cameraId
          });
        }
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('webrtc-offer', {
        offer: offer,
        cameraId: this.cameraId
      });

      console.log('[Mobile WebRTC] Broadcasted offer for camera:', this.cameraId);
    } catch (e) {
      console.warn('[Mobile WebRTC] WebRTC handshake error, fallback active:', e);
    }
  }

  /**
   * Dual Fallback: High framerate compressed canvas frame relay
   * Guarantees video arrives at dashboard under ANY network configuration
   */
  startFrameStreamingFallback() {
    const frameCanvas = document.createElement('canvas');
    const ctx = frameCanvas.getContext('2d');
    const targetW = 480;

    const sendFrame = () => {
      if (!this.isStreaming || !this.video || this.video.videoWidth === 0) {
        requestAnimationFrame(sendFrame);
        return;
      }

      const w = this.video.videoWidth;
      const h = this.video.videoHeight;
      const targetH = Math.round((targetW / w) * h);

      if (frameCanvas.width !== targetW || frameCanvas.height !== targetH) {
        frameCanvas.width = targetW;
        frameCanvas.height = targetH;
      }

      ctx.drawImage(this.video, 0, 0, targetW, targetH);
      const dataUrl = frameCanvas.toDataURL('image/jpeg', 0.55);

      if (this.socket && this.socket.connected) {
        this.socket.emit('stream-frame', {
          image: dataUrl,
          timestamp: Date.now()
        });
        this.frameCount++;
      }

      setTimeout(sendFrame, 50); // ~20 fps transmission rate
    };

    sendFrame();
  }

  startFpsMonitor() {
    setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.lastFpsUpdate) / 1000;
      const fps = Math.round(this.frameCount / elapsed);
      this.fpsCounter.innerText = `${fps} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }, 1000);
  }

  updateStatus(text, isLive) {
    this.statusEl.innerText = text;
    if (isLive) {
      this.pulseDot.classList.add('live');
    } else {
      this.pulseDot.classList.remove('live');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.streamer = new MobileCameraStreamer();
});
