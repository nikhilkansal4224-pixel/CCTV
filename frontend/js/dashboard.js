/**
 * CCTV Command Center Dashboard Controller
 * Integrates Bento Grid management, Multi-Camera Hub, AI Human Detection, and QR Code Generation
 */

class DashboardController {
  constructor() {
    this.socket = null;
    this.cameraManager = null;
    this.detector = null;

    this.activeHeroCameraId = null;
    this.animationLoopId = null;
    this.currentFilter = 'normal';

    // Telemetry state
    this.telemetry = {
      humanCount: 0,
      movementSpeed: 0,
      threatActive: false,
      totalIncidents: 0
    };

    // DOM Elements
    this.heroVideo = document.getElementById('hero-video');
    this.heroCanvas = document.getElementById('hero-canvas');
    this.heroOverlay = document.getElementById('hero-detection-overlay');
    this.heroCamTitle = document.getElementById('hero-cam-title');
    this.heroCamType = document.getElementById('hero-cam-type');
    this.heroViewport = document.getElementById('surveillance-viewport');

    this.cameraCardsGrid = document.getElementById('camera-cards-grid');
    this.cameraCountBadge = document.getElementById('camera-count-badge');
    this.incidentList = document.getElementById('incident-list');
    this.incidentCountBadge = document.getElementById('incident-count-badge');

    this.humanCountVal = document.getElementById('val-human-count');
    this.movementSpeedVal = document.getElementById('val-movement-speed');
    this.systemThreatIndicator = document.getElementById('system-threat-indicator');
    this.systemStatusText = document.getElementById('system-status-text');

    this.qrBox = document.getElementById('qr-code-box');
    this.urlDisplay = document.getElementById('camera-stream-url');
    this.btnCopyUrl = document.getElementById('btn-copy-url');

    this.btnAddWebcam = document.getElementById('btn-add-webcam');
    this.btnAddSim = document.getElementById('btn-add-sim');
    this.btnSoundToggle = document.getElementById('btn-toggle-sound');
    this.btnClearAlerts = document.getElementById('btn-clear-alerts');
    this.btnSnapshotHero = document.getElementById('btn-snapshot-hero');

    this.sliderConfidence = document.getElementById('slider-confidence');
    this.sliderSensitivity = document.getElementById('slider-sensitivity');
    this.valConfidence = document.getElementById('label-val-confidence');
    this.valSensitivity = document.getElementById('label-val-sensitivity');

    this.init();
  }

  async init() {
    this.initSocket();
    this.initDetector();
    this.initCameraManager();
    this.bindControls();
    await this.fetchNetworkInfo();
    await this.fetchAlertHistory();

    // Default start with a simulated camera so the user immediately sees working AI detection!
    setTimeout(() => {
      if (this.cameraManager.cameras.size === 0) {
        this.cameraManager.addSimulatedFeed('Corridor Cam [AI Demo]');
      }
    }, 600);
  }

  initSocket() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('[Dashboard] Connected to server socket:', this.socket.id);
      this.socket.emit('join-dashboard');
      this.systemStatusText.innerText = 'SURVEILLANCE ONLINE';
    });

    this.socket.on('disconnect', () => {
      this.systemStatusText.innerText = 'OFFLINE - RECONNECTING';
    });

    this.socket.on('new-alert', (alert) => {
      this.prependIncident(alert);
    });

    this.socket.on('alerts-cleared', () => {
      this.incidentList.innerHTML = '<div style="color: #64748b; font-size: 13px; text-align: center; padding: 20px;">No incidents recorded yet</div>';
      this.incidentCountBadge.innerText = '0 INCIDENTS';
    });
  }

  initDetector() {
    this.detector = new HumanMotionDetector({
      minConfidence: parseFloat(this.sliderConfidence.value) / 100,
      motionSensitivity: parseInt(this.sliderSensitivity.value),
      onAlert: (alertData) => this.handleDetectionAlert(alertData),
      onTelemetryUpdate: ({ status, model }) => {
        const badge = document.getElementById('ai-model-badge');
        if (badge) badge.innerText = model;
      }
    });
  }

  initCameraManager() {
    this.cameraManager = new CameraManager(this.socket);

    this.cameraManager.onCameraAdded = (camera) => {
      this.renderCameraCard(camera);
      this.updateCameraCount();
      if (!this.activeHeroCameraId) {
        this.setHeroCamera(camera.id);
      }
    };

    this.cameraManager.onCameraRemoved = (cameraId) => {
      const card = document.getElementById(`cam-card-${cameraId}`);
      if (card) card.remove();
      this.updateCameraCount();

      if (this.activeHeroCameraId === cameraId) {
        const remaining = Array.from(this.cameraManager.cameras.keys());
        if (remaining.length > 0) {
          this.setHeroCamera(remaining[0]);
        } else {
          this.resetHeroViewport();
        }
      }
    };

    this.cameraManager.onRemoteFrame = (cameraId, imageDataUrl) => {
      // Update thumbnail preview
      const thumbImg = document.getElementById(`cam-thumb-img-${cameraId}`);
      if (thumbImg) {
        thumbImg.src = imageDataUrl;
      }

      // If this camera is the hero, draw image onto hero canvas
      if (this.activeHeroCameraId === cameraId) {
        const img = new Image();
        img.onload = () => {
          this.heroVideo.style.display = 'none';
          this.heroCanvas.style.display = 'block';
          this.heroCanvas.width = img.width;
          this.heroCanvas.height = img.height;
          const ctx = this.heroCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          this.processDetectionFrame(this.heroCanvas);
        };
        img.src = imageDataUrl;
      }
    };
  }

  async fetchNetworkInfo() {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      const mobileUrl = data.cameraStreamUrl;
      this.urlDisplay.innerText = mobileUrl;

      // Render Dynamic QR Code
      this.qrBox.innerHTML = '';
      if (window.QRCode) {
        new QRCode(this.qrBox, {
          text: mobileUrl,
          width: 116,
          height: 116,
          colorDark: '#05070d',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        // Fallback standard QR service if script fails
        this.qrBox.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=116x116&data=${encodeURIComponent(mobileUrl)}" alt="QR Code" style="width:100%;height:100%;border-radius:8px;" />`;
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching network info:', err);
    }
  }

  async fetchAlertHistory() {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.alerts && data.alerts.length > 0) {
        this.incidentList.innerHTML = '';
        data.alerts.forEach(a => this.prependIncident(a, false));
        this.incidentCountBadge.innerText = `${data.alerts.length} INCIDENTS`;
      }
    } catch (e) {
      console.warn('[Dashboard] Could not fetch alerts:', e);
    }
  }

  bindControls() {
    // Add Local Webcam
    this.btnAddWebcam.addEventListener('click', async () => {
      try {
        await this.cameraManager.addLocalWebcam('Laptop Integrated Cam');
      } catch (err) {
        alert('Webcam permission denied or camera not found: ' + err.message);
      }
    });

    // Add Simulated Corridor Feed
    this.btnAddSim.addEventListener('click', () => {
      this.cameraManager.addSimulatedFeed(`Simulated Zone #${Math.floor(Math.random() * 90 + 10)}`);
    });

    // Copy URL
    this.btnCopyUrl.addEventListener('click', () => {
      const text = this.urlDisplay.innerText;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        this.btnCopyUrl.style.color = '#00ff9d';
        setTimeout(() => this.btnCopyUrl.style.color = '', 1500);
      }
    });

    // Sound Alarm Toggle
    this.btnSoundToggle.addEventListener('click', () => {
      const active = this.detector.soundEnabled = !this.detector.soundEnabled;
      this.btnSoundToggle.classList.toggle('active', active);
      this.btnSoundToggle.querySelector('span').innerText = active ? 'Audio Siren (ON)' : 'Audio Siren (OFF)';
    });

    // Clear Alerts
    this.btnClearAlerts.addEventListener('click', async () => {
      await fetch('/api/alerts', { method: 'DELETE' });
    });

    // Snapshot Hero
    this.btnSnapshotHero.addEventListener('click', () => {
      this.takeManualSnapshot();
    });

    // Sliders
    this.sliderConfidence.addEventListener('input', (e) => {
      const val = e.target.value;
      this.valConfidence.innerText = `${val}%`;
      this.detector.minConfidence = parseFloat(val) / 100;
    });

    this.sliderSensitivity.addEventListener('input', (e) => {
      const val = e.target.value;
      this.valSensitivity.innerText = `${val} px`;
      this.detector.motionSensitivity = parseInt(val);
    });

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        this.setVisionFilter(filter);
      });
    });
  }

  setVisionFilter(filterName) {
    this.currentFilter = filterName;
    this.heroVideo.className = 'hero-video-feed';
    this.heroCanvas.className = 'hero-canvas-feed';

    if (filterName === 'night') {
      this.heroVideo.classList.add('filter-night');
      this.heroCanvas.classList.add('filter-night');
    } else if (filterName === 'thermal') {
      this.heroVideo.classList.add('filter-thermal');
      this.heroCanvas.classList.add('filter-thermal');
    } else if (filterName === 'surreal') {
      this.heroVideo.classList.add('filter-surreal');
      this.heroCanvas.classList.add('filter-surreal');
    }
  }

  setHeroCamera(cameraId) {
    this.activeHeroCameraId = cameraId;
    const cam = this.cameraManager.cameras.get(cameraId);
    if (!cam) return;

    // Highlight active card
    document.querySelectorAll('.camera-node-card').forEach(card => card.classList.remove('active-hero'));
    const activeCard = document.getElementById(`cam-card-${cameraId}`);
    if (activeCard) activeCard.classList.add('active-hero');

    this.heroCamTitle.innerText = cam.name;
    this.heroCamType.innerText = cam.type.toUpperCase();

    if (cam.stream) {
      this.heroCanvas.style.display = 'none';
      this.heroVideo.style.display = 'block';
      this.heroVideo.srcObject = cam.stream;
      this.heroVideo.play().catch(e => console.warn('Hero video play prevented:', e));
      this.startContinuousHeroDetection();
    } else if (cam.canvas) {
      // Direct canvas feed
      this.heroVideo.style.display = 'none';
      this.heroCanvas.style.display = 'block';
      this.startContinuousHeroDetection();
    }
  }

  resetHeroViewport() {
    this.activeHeroCameraId = null;
    this.heroVideo.srcObject = null;
    this.heroCamTitle.innerText = 'NO FEED CONNECTED';
    this.heroCamType.innerText = 'STANDBY';
    const ctx = this.heroOverlay.getContext('2d');
    ctx.clearRect(0, 0, this.heroOverlay.width, this.heroOverlay.height);
  }

  startContinuousHeroDetection() {
    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
    }

    const loop = async () => {
      const cam = this.cameraManager.cameras.get(this.activeHeroCameraId);
      if (cam) {
        const source = cam.stream ? this.heroVideo : cam.canvas ? cam.canvas : this.heroCanvas;
        await this.processDetectionFrame(source);
      }
      this.animationLoopId = requestAnimationFrame(loop);
    };

    this.animationLoopId = requestAnimationFrame(loop);
  }

  async processDetectionFrame(sourceElement) {
    if (!sourceElement || !this.detector) return;
    const cam = this.cameraManager.cameras.get(this.activeHeroCameraId);
    const camName = cam ? cam.name : 'Surveillance Feed';

    const telemetry = await this.detector.processFrame(
      sourceElement,
      this.heroOverlay,
      this.activeHeroCameraId,
      camName
    );

    if (telemetry) {
      this.humanCountVal.innerText = telemetry.humanCount;
      this.movementSpeedVal.innerText = telemetry.movementSpeed;

      if (telemetry.humanCount > 0) {
        this.humanCountVal.classList.add('alert');
        this.systemThreatIndicator.classList.add('threat');
        this.systemStatusText.innerText = 'HUMAN PERIMETER BREACH';
      } else {
        this.humanCountVal.classList.remove('alert');
        this.systemThreatIndicator.classList.remove('threat');
        this.systemStatusText.innerText = 'SURVEILLANCE SECURE';
      }
    }
  }

  handleDetectionAlert(alertData) {
    // Send to backend API
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    }).catch(e => console.warn('Alert post failed:', e));

    // Flash Hero Viewport
    this.heroViewport.classList.add('threat-pulse');
    setTimeout(() => this.heroViewport.classList.remove('threat-pulse'), 1200);

    // Flash Camera Card
    const card = document.getElementById(`cam-card-${alertData.cameraId}`);
    if (card) {
      card.classList.add('threat-detected');
      setTimeout(() => card.classList.remove('threat-detected'), 2500);
    }
  }

  prependIncident(alert, increment = true) {
    if (this.incidentList.querySelector('div[style*="No incidents"]')) {
      this.incidentList.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'incident-item';
    const timeStr = new Date(alert.timestamp).toLocaleTimeString();

    item.innerHTML = `
      <img class="incident-thumb" src="${alert.snapshot || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" fill="%231a2035"><rect width="60" height="40"/></svg>'}" alt="Incident">
      <div class="incident-details">
        <div class="incident-title">
          <span>${alert.type}</span>
          <span class="incident-conf-badge">${alert.confidence}% CONF</span>
        </div>
        <div class="incident-time">${alert.cameraName} • ${timeStr}</div>
      </div>
    `;

    this.incidentList.prepend(item);

    if (increment) {
      this.telemetry.totalIncidents++;
      this.incidentCountBadge.innerText = `${this.incidentList.children.length} INCIDENTS`;
    }
  }

  renderCameraCard(camera) {
    let existing = document.getElementById(`cam-card-${camera.id}`);
    if (existing) return;

    const card = document.createElement('div');
    card.className = `camera-node-card ${camera.id === this.activeHeroCameraId ? 'active-hero' : ''}`;
    card.id = `cam-card-${camera.id}`;

    card.innerHTML = `
      <div class="cam-preview-frame">
        <span class="cam-badge-top">${camera.type.toUpperCase()}</span>
        ${camera.stream ? `<video id="thumb-video-${camera.id}" autoplay playsinline muted></video>` : ''}
        ${camera.canvas ? `<canvas id="thumb-canvas-${camera.id}"></canvas>` : ''}
        ${!camera.stream && !camera.canvas ? `<img id="cam-thumb-img-${camera.id}" alt="Feed Preview" />` : ''}
      </div>
      <div class="cam-node-footer">
        <div>
          <div class="cam-node-name">${camera.name}</div>
          <div class="cam-node-type">${camera.isLocal ? 'Integrated Sensor' : 'Mobile WebRTC Sensor'}</div>
        </div>
        <button class="filter-btn" style="padding: 4px 8px; font-size: 10px;">VIEW HERO</button>
      </div>
    `;

    card.addEventListener('click', () => {
      this.setHeroCamera(camera.id);
    });

    this.cameraCardsGrid.appendChild(card);

    // Bind stream or canvas to thumbnail
    if (camera.stream) {
      const thumbVid = document.getElementById(`thumb-video-${camera.id}`);
      if (thumbVid) {
        thumbVid.srcObject = camera.stream;
        thumbVid.play().catch(e => console.warn(e));
      }
    } else if (camera.canvas) {
      const thumbCanvas = document.getElementById(`thumb-canvas-${camera.id}`);
      if (thumbCanvas) {
        thumbCanvas.width = 320;
        thumbCanvas.height = 180;
        const ctx = thumbCanvas.getContext('2d');
        setInterval(() => {
          ctx.drawImage(camera.canvas, 0, 0, 320, 180);
        }, 100);
      }
    }
  }

  updateCameraCount() {
    const count = this.cameraManager.cameras.size;
    this.cameraCountBadge.innerText = `${count} ACTIVE`;
    const countMetric = document.getElementById('val-active-cameras');
    if (countMetric) countMetric.innerText = count;
  }

  takeManualSnapshot() {
    const cam = this.cameraManager.cameras.get(this.activeHeroCameraId);
    const source = cam && cam.stream ? this.heroVideo : cam && cam.canvas ? cam.canvas : this.heroCanvas;
    if (!source) return;

    const snap = this.detector.captureSnapshot(source, source.videoWidth || source.width || 640, source.videoHeight || source.height || 480);
    if (snap) {
      const a = document.createElement('a');
      a.href = snap;
      a.download = `CCTV-Snapshot-${Date.now()}.jpg`;
      a.click();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new DashboardController();
});
