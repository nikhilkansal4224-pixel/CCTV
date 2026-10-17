/**
 * CCTV WebRTC & Multi-Camera Stream Manager
 * Manages peer-to-peer WebRTC connections & Socket.IO frame streaming for connected devices
 */

class CameraManager {
  constructor(socket) {
    this.socket = socket;
    this.cameras = new Map(); // cameraId -> { id, name, type, stream, videoElement, canvasElement, peerConnection }
    this.peerConnections = new Map(); // socketId -> RTCPeerConnection
    
    // Callbacks
    this.onCameraAdded = null;
    this.onCameraRemoved = null;
    this.onCameraListUpdated = null;
    this.onRemoteFrame = null;

    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    this.initSocketEvents();
  }

  initSocketEvents() {
    if (!this.socket) return;

    // Camera list update from server
    this.socket.on('camera-list-update', (camList) => {
      console.log('[Manager] Camera list update received:', camList);
      if (this.onCameraListUpdated) {
        this.onCameraListUpdated(camList);
      }
    });

    // A new camera joined
    this.socket.on('camera-joined', (camInfo) => {
      console.log(`[Manager] Remote camera joined: ${camInfo.name} (${camInfo.id})`);
      this.registerRemoteCamera(camInfo);
    });

    // A camera disconnected
    this.socket.on('camera-left', ({ cameraId }) => {
      console.log(`[Manager] Camera left: ${cameraId}`);
      this.removeCamera(cameraId);
    });

    // Fallback direct frame relay from mobile phone
    this.socket.on('camera-frame', (data) => {
      const { cameraId, cameraName, image } = data;
      if (!this.cameras.has(cameraId)) {
        this.registerRemoteCamera({ id: cameraId, name: cameraName, type: 'mobile' });
      }
      if (this.onRemoteFrame) {
        this.onRemoteFrame(cameraId, image, data.isPortrait, data.width, data.height);
      }
    });

    // WebRTC Offer received from remote camera
    this.socket.on('webrtc-offer', async ({ senderSocketId, offer, cameraId }) => {
      console.log(`[WebRTC] Received offer from ${senderSocketId} for camera ${cameraId}`);
      try {
        const pc = new RTCPeerConnection(this.rtcConfig);
        this.peerConnections.set(senderSocketId, pc);

        pc.ontrack = (event) => {
          console.log(`[WebRTC] Received remote stream track from ${senderSocketId}`);
          const stream = event.streams[0];
          this.attachRemoteStream(cameraId, stream);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.socket.emit('webrtc-ice-candidate', {
              targetSocketId: senderSocketId,
              candidate: event.candidate
            });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socket.emit('webrtc-answer', {
          targetSocketId: senderSocketId,
          answer: answer,
          cameraId: cameraId
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    // WebRTC ICE Candidate received
    this.socket.on('webrtc-ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = this.peerConnections.get(senderSocketId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Error adding ICE candidate:', e);
        }
      }
    });
  }

  /**
   * Add Local Laptop Camera / Webcam
   */
  async addLocalWebcam(name = 'Laptop Main Webcam') {
    const id = 'local-webcam-' + Date.now();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      const cameraObj = {
        id,
        name,
        type: 'webcam',
        stream,
        joinedAt: new Date().toISOString(),
        isLocal: true
      };

      this.cameras.set(id, cameraObj);

      if (this.onCameraAdded) {
        this.onCameraAdded(cameraObj);
      }

      return cameraObj;
    } catch (err) {
      console.error('[Manager] Failed to access local webcam:', err);
      throw err;
    }
  }

  /**
   * Register Remote Phone or Camera Node
   */
  registerRemoteCamera(camInfo) {
    if (this.cameras.has(camInfo.id)) return this.cameras.get(camInfo.id);

    const cameraObj = {
      id: camInfo.id,
      name: camInfo.name,
      type: camInfo.type || 'mobile',
      stream: null,
      joinedAt: camInfo.joinedAt || new Date().toISOString(),
      isLocal: false
    };

    this.cameras.set(camInfo.id, cameraObj);

    if (this.onCameraAdded) {
      this.onCameraAdded(cameraObj);
    }

    return cameraObj;
  }

  /**
   * Attach incoming WebRTC MediaStream to camera object
   */
  attachRemoteStream(cameraId, stream) {
    let cam = this.cameras.get(cameraId);
    if (!cam) {
      cam = this.registerRemoteCamera({ id: cameraId, name: `Mobile Feed #${cameraId.slice(0, 4)}`, type: 'mobile' });
    }
    cam.stream = stream;

    const videoEl = document.getElementById(`video-${cameraId}`);
    if (videoEl) {
      videoEl.srcObject = stream;
      videoEl.play().catch(e => console.warn('Autoplay prevented:', e));
    }
  }

  /**
   * Remove a camera
   */
  removeCamera(cameraId) {
    const cam = this.cameras.get(cameraId);
    if (cam) {
      if (cam.stream && cam.isLocal) {
        cam.stream.getTracks().forEach(track => track.stop());
      }
      this.cameras.delete(cameraId);
      if (this.onCameraRemoved) {
        this.onCameraRemoved(cameraId);
      }
    }
  }

  /**
   * Add a Simulated Test Feed with canvas animation for instant demonstration
   * @param {string} name 
   * @param {boolean} isPortrait 
   */
  addSimulatedFeed(name = 'Simulated Corridor Camera', isPortrait = false) {
    const id = 'sim-cam-' + Date.now();
    const canvas = document.createElement('canvas');
    canvas.width = isPortrait ? 360 : 640;
    canvas.height = isPortrait ? 640 : 360;
    const ctx = canvas.getContext('2d');

    let humanX = 40;
    let humanDirection = 1;

    function renderSimulatedScene() {
      // Background corridor
      ctx.fillStyle = isPortrait ? '#0a0d1a' : '#0a0d17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Perspective grid lines
      ctx.strokeStyle = isPortrait ? 'rgba(255, 0, 127, 0.15)' : 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= canvas.width; i += (isPortrait ? 40 : 60)) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height);
        ctx.lineTo(canvas.width / 2, canvas.height * 0.4);
        ctx.stroke();
      }

      // Simulated human silhouette walking
      humanX += 2.2 * humanDirection;
      if (humanX > canvas.width - 90 || humanX < 40) {
        humanDirection *= -1;
      }

      const hY = canvas.height * 0.38;
      const hScale = 1.3;

      // Draw walking humanoid silhouette
      ctx.fillStyle = '#d0d7e5';
      // Head
      ctx.beginPath();
      ctx.arc(humanX + 20, hY, 14 * hScale, 0, Math.PI * 2);
      ctx.fill();
      // Torso
      ctx.fillRect(humanX + 6, hY + 14, 28 * hScale, 45 * hScale);
      // Legs
      const legPhase = Math.sin(Date.now() * 0.008) * 12;
      ctx.lineWidth = 6 * hScale;
      ctx.strokeStyle = '#d0d7e5';
      ctx.beginPath();
      ctx.moveTo(humanX + 12, hY + 60);
      ctx.lineTo(humanX + 8 - legPhase, hY + 110);
      ctx.moveTo(humanX + 28, hY + 60);
      ctx.lineTo(humanX + 32 + legPhase, hY + 110);
      ctx.stroke();

      // CCTV Timestamp watermark
      ctx.fillStyle = 'rgba(0, 255, 157, 0.85)';
      ctx.font = '11px monospace';
      ctx.fillText(`CAM-04 TEST SIMULATION • ${new Date().toLocaleTimeString()}`, 15, 25);
    }

    const interval = setInterval(renderSimulatedScene, 40);
    const stream = canvas.captureStream ? canvas.captureStream(25) : null;

    const cameraObj = {
      id,
      name,
      type: 'simulated',
      stream,
      canvas,
      interval,
      joinedAt: new Date().toISOString(),
      isLocal: true
    };

    this.cameras.set(id, cameraObj);

    if (this.onCameraAdded) {
      this.onCameraAdded(cameraObj);
    }

    return cameraObj;
  }
}
