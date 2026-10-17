/**
 * ARGUS SURREAL CCTV // MAIN HUB CONTROLLER
 * Manages Transparent White Bento Grid layout, PeerJS WebRTC hub for mobile cameras,
 * local webcam integration, virtual demo feeds, QR code pairing,
 * real-time AI human detection loop, and local MongoDB event persistence.
 */

class ArgusHubApp {
  constructor() {
    this.cameras = new Map(); // id -> { id, label, stream, videoEl, type }
    this.activeCameraId = null;
    this.peer = null;
    this.roomId = this.getOrGenerateRoomId();
    this.detector = null;
    this.qrCodeInstance = null;
    this.networkIp = window.location.hostname;
    this.port = window.location.port || '3001';
    this.tunnelUrl = null;
    this.tunnelPassword = null;
    this.networkMode = 'global'; // 'global' (HTTPS tunnel across any Wi-Fi) or 'local' (same Wi-Fi)
    this.isDetecting = true;
    this.fps = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.mongoConnected = false;
    this.mongoEventsCount = 0;

    // Waveform history for the radar
    this.motionHistory = new Array(40).fill(0);

    // DOM Elements
    this.primaryVideo = document.getElementById('primaryVideo');
    this.hudCanvas = document.getElementById('hudCanvas');
    this.camWall = document.getElementById('camWallGrid');
    this.eventList = document.getElementById('eventsList');
    this.primaryCamBadge = document.getElementById('primaryCamBadge');
    this.primaryFpsBadge = document.getElementById('primaryFpsBadge');
    this.primaryResBadge = document.getElementById('primaryResBadge');
    this.threatAlertBanner = document.getElementById('threatAlertBanner');
    this.humanCountEl = document.getElementById('humanCountStat');
    this.motionIntensityEl = document.getElementById('motionIntensityStat');
    this.waveformCanvas = document.getElementById('waveformCanvas');
    this.qrContainer = document.getElementById('qrCodeContainer');
    this.mobileLinkInput = document.getElementById('mobileLinkInput');
    this.displayRoomPin = document.getElementById('displayRoomPin');
    this.tunnelPassBox = document.getElementById('tunnelPassBox');
    this.tunnelPassCode = document.getElementById('tunnelPassCode');
    this.btnModeGlobal = document.getElementById('btnModeGlobal');
    this.btnModeLocal = document.getElementById('btnModeLocal');
    this.btnCopyTunnelPass = document.getElementById('btnCopyTunnelPass');
    this.sensitivitySlider = document.getElementById('sensitivitySlider');
    this.sensitivityVal = document.getElementById('sensitivityVal');
    this.btnToggleAudio = document.getElementById('btnToggleAudio');
    this.dbEventsCountBadge = document.getElementById('dbEventsCountBadge');

    // Lightbox modal elements
    this.snapModal = document.getElementById('snapModal');
    this.snapModalImg = document.getElementById('snapModalImg');
    this.snapModalTitle = document.getElementById('snapModalTitle');
    this.snapModalDownload = document.getElementById('snapModalDownload');

    // View Modes & Dynamic Sizing Controls
    this.viewMode = localStorage.getItem('argus_view_mode') || 'focus';
    this.feedHeight = parseInt(localStorage.getItem('argus_feed_height') || '420', 10);
    this.viewportSingle = document.getElementById('viewportSingle');
    this.galleryMatrix = document.getElementById('galleryMatrixContainer');
    this.feedHeightSlider = document.getElementById('feedHeightSlider');
    this.feedHeightVal = document.getElementById('feedHeightValue');

    this.init();
  }

  getOrGenerateRoomId() {
    let id = localStorage.getItem('argus_room_id');
    if (!id || id.length > 5) {
      // Clean 4-character alphanumeric PIN
      id = Math.floor(1000 + Math.random() * 9000).toString();
      localStorage.setItem('argus_room_id', id);
    }
    return id;
  }

  async init() {
    if (this.displayRoomPin) {
      this.displayRoomPin.textContent = this.roomId;
    }

    // 0. Setup Viewport Sizing & View Mode Presets
    this.applyFeedHeight(this.feedHeight);
    this.setViewMode(this.viewMode);

    // 1. Fetch server's local network IP for mobile device reachability
    await this.detectNetworkIp();

    // 2. Check local MongoDB status & load historical events
    await this.checkMongoStatus();
    await this.loadHistoricalEventsFromMongo();

    // 3. Generate QR Code & Mobile URL
    this.setupQrCode();

    // 4. Initialize PeerJS WebRTC Hub
    this.initPeerHub();

    // 5. Initialize Neural Detector
    this.initDetector();

    // 6. Setup UI Event Listeners & Controls
    this.setupEventListeners();

    // 7. Start Render & Detection Loop
    this.startDetectionLoop();

    // 8. Start Waveform Animation Loop
    this.startWaveformLoop();
  }

  async detectNetworkIp() {
    try {
      const res = await fetch(window.apiUrl('/api/network-ip'));
      if (res.ok) {
        const data = await res.json();
        if (data.primaryIp) {
          this.networkIp = data.primaryIp;
          this.port = data.port || this.port;
        }
        this.tunnelUrl = data.tunnelUrl || null;
        this.tunnelPassword = data.tunnelPassword || null;

        // Default to global HTTPS if available so mobile works on ANY Wi-Fi
        this.networkMode = this.tunnelUrl ? 'global' : 'local';

        if (this.tunnelPassCode && this.tunnelPassword) {
          this.tunnelPassCode.textContent = this.tunnelPassword;
        }
        if (this.tunnelPassBox) {
          this.tunnelPassBox.style.display = (this.networkMode === 'global' && this.tunnelPassword) ? 'flex' : 'none';
        }
      }
    } catch (e) {
      console.log('Local network IP API not reachable, using current host.');
    }
  }

  async checkMongoStatus() {
    try {
      const res = await fetch(window.apiUrl('/api/mongodb/status'));
      if (res.ok) {
        const data = await res.json();
        this.mongoConnected = data.connected;
        this.mongoEventsCount = data.eventsCount || 0;

        if (this.dbEventsCountBadge) {
          this.dbEventsCountBadge.textContent = `${this.mongoEventsCount} IN MONGODB`;
        }

        if (data.connected) {
          this.updatePill('statusMongoPill', 'active', 'MONGODB CONNECTED [27017]');
        } else {
          this.updatePill('statusMongoPill', 'alert', 'MONGODB RECONNECTING...');
        }
      }
    } catch (e) {
      this.updatePill('statusMongoPill', 'alert', 'MONGODB OFFLINE');
    }
  }

  async loadHistoricalEventsFromMongo() {
    try {
      const res = await fetch(window.apiUrl('/api/events'));
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          const placeholder = this.eventList ? this.eventList.querySelector('.empty-log-placeholder') : null;
          if (placeholder) placeholder.remove();

          data.events.reverse().forEach(evt => {
            this.addEventToLog(evt, false);
          });
        }
      }
    } catch (e) {
      console.warn('Could not load historical events from MongoDB:', e);
    }
  }

  getMobilePairingUrl() {
    // If Global Mode and Tunnel is active, use global public HTTPS URL (works on ANY Wi-Fi / 4G / 5G worldwide!)
    if (this.networkMode === 'global' && this.tunnelUrl) {
      return `${this.tunnelUrl}/camera.html?room=${this.roomId}`;
    }

    // Local LAN mode (same Wi-Fi)
    const protocol = window.location.protocol;
    const host = (this.networkIp === 'localhost' || this.networkIp === '127.0.0.1')
      ? window.location.hostname
      : this.networkIp;
    const portPart = this.port ? `:${this.port}` : '';
    return `${protocol}//${host}${portPart}/camera.html?room=${this.roomId}`;
  }

  setupQrCode() {
    const mobileUrl = this.getMobilePairingUrl();
    if (this.mobileLinkInput) {
      this.mobileLinkInput.value = mobileUrl;
    }

    if (this.tunnelPassBox) {
      this.tunnelPassBox.style.display = (this.networkMode === 'global' && this.tunnelPassword) ? 'flex' : 'none';
    }

    if (this.qrContainer) {
      this.qrContainer.innerHTML = '';
      try {
        this.qrCodeInstance = new QRCode(this.qrContainer, {
          text: mobileUrl,
          width: 124,
          height: 124,
          colorDark: '#05070d',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.warn('QRCode library error:', err);
      }
    }
  }

  initPeerHub() {
    const hubId = `argus-hub-${this.roomId}`;
    console.log('Registering Hub Peer ID:', hubId);

    // Multi-STUN & TURN for reliable cross-network P2P connections
    this.peer = new Peer(hubId, {
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
      console.log('Argus CCTV Hub is listening on PeerJS ID:', id);
      this.updatePill('statusHubPill', 'active', 'HUB ONLINE');
    });

    this.peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        if (data.type === 'IDENTIFY') {
          console.log('Mobile device identified:', data.camName);
        }
      });
    });

    this.peer.on('call', (call) => {
      console.log('Incoming camera stream call from:', call.peer);
      call.answer();

      call.on('stream', (remoteStream) => {
        const camId = call.peer;
        const camLabel = (call.metadata && call.metadata.camName) || `Mobile Lens (${camId.slice(-4)})`;
        this.addCameraFeed(camId, camLabel, remoteStream, 'mobile');
      });

      call.on('close', () => {
        this.removeCameraFeed(call.peer);
      });

      call.on('error', (err) => {
        this.removeCameraFeed(call.peer);
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Hub PeerJS Error:', err);
      if (err.type === 'unavailable-id') {
        this.roomId = Math.floor(1000 + Math.random() * 9000).toString();
        localStorage.setItem('argus_room_id', this.roomId);
        if (this.displayRoomPin) this.displayRoomPin.textContent = this.roomId;
        this.setupQrCode();
        this.initPeerHub();
      }
    });
  }

  initDetector() {
    this.detector = new ArgusDetector({
      sensitivity: parseFloat(this.sensitivitySlider ? this.sensitivitySlider.value : 0.45),
      onStatusChange: (info) => {
        const dotState = info.status === 'ready' ? 'active' : (info.status === 'fallback' ? 'active' : 'alert');
        this.updatePill('statusAiPill', dotState, info.message.toUpperCase());
      },
      onMotionUpdate: (val) => {
        if (this.motionIntensityEl) {
          this.motionIntensityEl.textContent = `${Math.round(val)}%`;
        }
        this.motionHistory.push(val);
        if (this.motionHistory.length > 40) this.motionHistory.shift();
      },
      onDetection: (event) => {
        this.handleDetectionEvent(event);
      }
    });

    this.detector.loadModel();
  }

  handleDetectionEvent(event) {
    // 1. Show HUD Threat Banner
    if (this.threatAlertBanner) {
      this.threatAlertBanner.classList.add('active');
      const text = this.threatAlertBanner.querySelector('.banner-text');
      if (text) {
        text.textContent = event.type === 'HUMAN_DETECTED'
          ? `WARNING: HUMAN INTRUSION DETECTED // ${event.camLabel.toUpperCase()} [${event.confidence}%]`
          : `CAUTION: MOTION SPIKE DETECTED // ${event.camLabel.toUpperCase()}`;
      }
      setTimeout(() => {
        this.threatAlertBanner.classList.remove('active');
      }, 3000);
    }

    // Flash detected tile in multi-camera gallery mode
    if (this.galleryMatrix && event.type === 'HUMAN_DETECTED') {
      const activeTile = this.galleryMatrix.querySelector(`.gallery-tile[data-cam-id="${this.activeCameraId}"]`);
      if (activeTile) {
        activeTile.classList.add('detected-human');
        setTimeout(() => activeTile.classList.remove('detected-human'), 3500);
      }
    }

    // 2. Add to Surveillance Event Log UI
    this.addEventToLog(event, true);

    // 3. Persist Event to MongoDB Backend
    fetch(window.apiUrl('/api/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
    .then(res => res.json())
    .then(() => {
      this.mongoEventsCount++;
      if (this.dbEventsCountBadge) {
        this.dbEventsCountBadge.textContent = `${this.mongoEventsCount} IN MONGODB`;
      }
    })
    .catch(err => console.warn('Failed saving event to MongoDB:', err));
  }

  addEventToLog(event, isNew = true) {
    if (!this.eventList) return;

    const placeholder = this.eventList.querySelector('.empty-log-placeholder');
    if (placeholder) placeholder.remove();

    const item = document.createElement('div');
    item.className = 'event-item';

    const isHuman = event.type === 'HUMAN_DETECTED';
    const tagClass = isHuman ? 'event-tag' : 'event-tag-cyan';
    const badgeText = isHuman ? `HUMAN (${event.confidence}%)` : `MOTION (${event.motionIntensity || event.confidence}%)`;

    item.innerHTML = `
      <img src="${event.snapshot || 'assets/images/surreal_bg.jpg'}" class="event-snap-thumb" alt="Detection Snapshot">
      <div class="event-info">
        <div class="event-title">${isHuman ? '🚨 Human Presence Confirmed' : '⚡ Motion Activity Alert'}</div>
        <div class="event-meta">
          <span style="color: var(--accent-cyan);">${event.camLabel}</span>
          <span>${event.timestamp}</span>
          <span class="${tagClass}">${badgeText}</span>
        </div>
      </div>
    `;

    item.addEventListener('click', () => {
      this.openSnapshotModal(event);
    });

    if (isNew) {
      this.eventList.insertBefore(item, this.eventList.firstChild);
    } else {
      this.eventList.appendChild(item);
    }

    if (this.eventList.children.length > 50) {
      this.eventList.removeChild(this.eventList.lastChild);
    }
  }

  openSnapshotModal(event) {
    if (!this.snapModal || !this.snapModalImg) return;
    this.snapModalImg.src = event.snapshot;
    if (this.snapModalTitle) {
      this.snapModalTitle.textContent = `${event.camLabel} // ${event.type} [${event.timestamp}]`;
    }
    if (this.snapModalDownload) {
      this.snapModalDownload.href = event.snapshot;
      this.snapModalDownload.download = `argus-cctv-${Date.now()}.jpg`;
    }
    this.snapModal.classList.add('active');
  }

  closeSnapshotModal() {
    if (this.snapModal) {
      this.snapModal.classList.remove('active');
    }
  }

  addCameraFeed(id, label, stream, type = 'mobile') {
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    video.play().catch(e => console.log('Video play error:', e));

    this.cameras.set(id, { id, label, stream, videoEl: video, type });

    this.renderWallThumbnails();
    this.renderGalleryMatrix();

    if (!this.activeCameraId || this.cameras.size === 1) {
      this.selectPrimaryCamera(id);
    }

    this.updateCamCountBadge();
  }

  removeCameraFeed(id) {
    const cam = this.cameras.get(id);
    if (cam) {
      if (cam.stream && cam.stream.getTracks) {
        cam.stream.getTracks().forEach(t => t.stop());
      }
      this.cameras.delete(id);
    }

    if (this.activeCameraId === id) {
      const remaining = Array.from(this.cameras.keys());
      if (remaining.length > 0) {
        this.selectPrimaryCamera(remaining[0]);
      } else {
        this.activeCameraId = null;
        if (this.primaryVideo) this.primaryVideo.srcObject = null;
        if (this.primaryCamBadge) this.primaryCamBadge.textContent = 'NO CAM SELECTED';
      }
    }

    this.renderWallThumbnails();
    this.renderGalleryMatrix();
    this.updateCamCountBadge();
  }

  selectPrimaryCamera(id) {
    const cam = this.cameras.get(id);
    if (!cam) return;

    this.activeCameraId = id;
    if (this.primaryVideo) {
      this.primaryVideo.srcObject = cam.stream;
      this.primaryVideo.play().catch(e => console.log('Primary play error:', e));
    }
    if (this.primaryCamBadge) {
      this.primaryCamBadge.textContent = cam.label.toUpperCase();
    }

    this.renderWallThumbnails();

    if (this.galleryMatrix) {
      this.galleryMatrix.querySelectorAll('.gallery-tile').forEach(t => {
        t.classList.toggle('active-tile', t.getAttribute('data-cam-id') === id);
      });
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    localStorage.setItem('argus_view_mode', mode);

    // Update active button state
    document.querySelectorAll('[data-view-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view-mode') === mode);
    });

    if (mode === 'focus') {
      if (this.viewportSingle) this.viewportSingle.style.display = 'flex';
      if (this.galleryMatrix) this.galleryMatrix.style.display = 'none';
    } else {
      if (this.viewportSingle) this.viewportSingle.style.display = 'none';
      if (this.galleryMatrix) {
        this.galleryMatrix.style.display = 'grid';
        this.galleryMatrix.classList.remove('layout-grid-many', 'layout-split', 'layout-quad');
        if (mode === 'split') {
          this.galleryMatrix.classList.add('layout-split');
        } else if (mode === 'quad') {
          this.galleryMatrix.classList.add('layout-quad');
        } else {
          this.galleryMatrix.classList.add('layout-grid-many');
        }
      }
      this.renderGalleryMatrix();
    }
  }

  applyFeedHeight(height) {
    const clamped = Math.max(180, Math.min(900, height));
    this.feedHeight = clamped;
    localStorage.setItem('argus_feed_height', clamped);
    document.documentElement.style.setProperty('--feed-viewport-height', `${clamped}px`);

    if (this.feedHeightSlider) {
      this.feedHeightSlider.value = clamped;
    }
    if (this.feedHeightVal) {
      this.feedHeightVal.textContent = `${clamped}px`;
    }

    // Update active preset buttons (S, M, L)
    document.querySelectorAll('[data-feed-size]').forEach(btn => {
      const sizeType = btn.getAttribute('data-feed-size');
      const isPreset = (sizeType === 'compact' && clamped <= 300) ||
                       (sizeType === 'medium' && clamped > 300 && clamped <= 480) ||
                       (sizeType === 'large' && clamped > 480);
      btn.classList.toggle('active', isPreset);
    });
  }

  renderGalleryMatrix() {
    if (!this.galleryMatrix || this.viewMode === 'focus') return;
    this.galleryMatrix.innerHTML = '';

    if (this.cameras.size === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.style.gridColumn = '1 / -1';
      emptyNotice.style.display = 'flex';
      emptyNotice.style.flexDirection = 'column';
      emptyNotice.style.alignItems = 'center';
      emptyNotice.style.justifyContent = 'center';
      emptyNotice.style.height = '100%';
      emptyNotice.style.minHeight = '200px';
      emptyNotice.style.color = 'var(--text-muted)';
      emptyNotice.style.gap = '0.6rem';
      emptyNotice.innerHTML = `
        <div style="font-size: 2.2rem; opacity: 0.6;">📹</div>
        <div style="font-family: var(--font-hud); font-size: 0.85rem; letter-spacing: 0.05em; color: #fff;">NO CAMERA FEEDS CONNECTED</div>
        <div style="font-size: 0.75rem; text-align: center; max-width: 340px; line-height: 1.4;">
          Connect mobile camera via QR code, enable laptop camera, or add demo feed to view concurrent surveillance streams in this multi-lens matrix.
        </div>
      `;
      this.galleryMatrix.appendChild(emptyNotice);
      return;
    }

    this.cameras.forEach((cam, id) => {
      const tile = document.createElement('div');
      tile.className = `gallery-tile ${id === this.activeCameraId ? 'active-tile' : ''}`;
      tile.setAttribute('data-cam-id', id);

      const vid = document.createElement('video');
      vid.autoplay = true;
      vid.playsInline = true;
      vid.muted = true;
      vid.srcObject = cam.stream;
      vid.play().catch(e => console.log('Gallery tile play error:', e));

      const overlay = document.createElement('div');
      overlay.className = 'gallery-tile-overlay';
      overlay.innerHTML = `
        <div class="gallery-tile-top">
          <span class="gallery-tile-title">${cam.label}</span>
          <div class="status-pill" style="padding: 0.2rem 0.5rem; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);">
            <span class="status-dot active" style="width: 5px; height: 5px;"></span>
            <span style="font-size: 0.65rem; color: #fff;">LIVE</span>
          </div>
        </div>
        <div class="gallery-tile-actions">
          <button class="glass-btn glass-btn-primary btn-focus-tile" style="padding: 0.3rem 0.65rem; font-size: 0.72rem;" title="Focus this camera feed">
            🎯 Focus
          </button>
          <button class="glass-btn btn-snap-tile" style="padding: 0.3rem 0.65rem; font-size: 0.72rem;" title="Capture snapshot from this lens">
            📸 Snap
          </button>
          <button class="glass-btn glass-btn-danger btn-remove-tile" style="padding: 0.3rem 0.55rem; font-size: 0.72rem;" title="Disconnect Feed">
            ✕
          </button>
        </div>
      `;

      // Event listeners for tile controls
      overlay.querySelector('.btn-focus-tile').addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectPrimaryCamera(id);
        this.setViewMode('focus');
      });

      overlay.querySelector('.btn-snap-tile').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.detector) {
          const snap = this.detector.captureSnapshot(vid, null);
          if (snap) {
            this.handleDetectionEvent({
              type: 'MANUAL_SNAPSHOT',
              camLabel: cam.label,
              confidence: 100,
              motionIntensity: 0,
              timestamp: new Date().toLocaleTimeString(),
              snapshot: snap
            });
          }
        }
      });

      overlay.querySelector('.btn-remove-tile').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeCameraFeed(id);
      });

      tile.appendChild(vid);
      tile.appendChild(overlay);

      tile.addEventListener('click', () => {
        this.selectPrimaryCamera(id);
      });

      this.galleryMatrix.appendChild(tile);
    });
  }

  renderWallThumbnails() {
    if (!this.camWall) return;

    const existingThumbs = this.camWall.querySelectorAll('.thumb-card');
    existingThumbs.forEach(t => t.remove());

    const addBtnSlot = this.camWall.querySelector('.cam-add-slot');

    this.cameras.forEach((cam, id) => {
      const card = document.createElement('div');
      card.className = `thumb-card ${id === this.activeCameraId ? 'active-primary' : ''}`;

      const thumbVid = document.createElement('video');
      thumbVid.className = 'thumb-video';
      thumbVid.autoplay = true;
      thumbVid.playsInline = true;
      thumbVid.muted = true;
      thumbVid.srcObject = cam.stream;

      const overlay = document.createElement('div');
      overlay.className = 'thumb-overlay';
      overlay.innerHTML = `
        <div class="thumb-tag">${cam.label}</div>
        <div class="thumb-bottom">
          <span style="font-family: var(--font-hud); font-size: 0.65rem; color: var(--accent-emerald);">● LIVE</span>
          <button class="thumb-btn-remove" title="Disconnect Feed">✕</button>
        </div>
      `;

      card.appendChild(thumbVid);
      card.appendChild(overlay);

      card.addEventListener('click', (e) => {
        if (e.target.closest('.thumb-btn-remove')) {
          this.removeCameraFeed(id);
          return;
        }
        this.selectPrimaryCamera(id);
      });

      if (addBtnSlot) {
        this.camWall.insertBefore(card, addBtnSlot);
      } else {
        this.camWall.appendChild(card);
      }
    });
  }

  updateCamCountBadge() {
    const badge = document.getElementById('activeCamCountBadge');
    if (badge) {
      badge.textContent = `${this.cameras.size} CAMERAS`;
    }
  }

  updatePill(pillId, dotClass, text) {
    const pill = document.getElementById(pillId);
    if (!pill) return;
    const dot = pill.querySelector('.status-dot');
    const label = pill.querySelector('.pill-text');
    if (dot) {
      dot.className = `status-dot ${dotClass}`;
    }
    if (label) {
      label.textContent = text;
    }
  }

  async addLaptopCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      const id = `laptop-webcam-${Date.now()}`;
      this.addCameraFeed(id, 'Laptop Primary Lens', stream, 'local');
    } catch (err) {
      console.error('Laptop camera error:', err);
      alert('Could not access laptop webcam. Please ensure camera permissions are allowed in your browser.');
    }
  }

  addSimulatedDemoCamera() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let walkerX = 50;
    let walkerDir = 1;

    function drawSimulatedFeed() {
      ctx.fillStyle = '#080c16';
      ctx.fillRect(0, 0, 640, 480);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 640; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, 480);
        ctx.lineTo(320, 180);
        ctx.stroke();
      }

      walkerX += walkerDir * 2.2;
      if (walkerX > 520) walkerDir = -1;
      if (walkerX < 60) walkerDir = 1;

      const wy = 230;
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(walkerX, wy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(walkerX - 14, wy + 16, 28, 65);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#cbd5e1';
      const legOffset = Math.sin(walkerX * 0.1) * 16;
      ctx.beginPath();
      ctx.moveTo(walkerX - 8, wy + 80);
      ctx.lineTo(walkerX - 12 + legOffset, wy + 140);
      ctx.moveTo(walkerX + 8, wy + 80);
      ctx.lineTo(walkerX + 12 - legOffset, wy + 140);
      ctx.stroke();

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`SIMULATED FEED // SYNTHETIC HUMAN TEST RUN`, 20, 30);

      requestAnimationFrame(drawSimulatedFeed);
    }

    drawSimulatedFeed();

    const stream = canvas.captureStream(30);
    const id = `sim-cam-${Date.now()}`;
    this.addCameraFeed(id, 'Corridor AI Demo Feed', stream, 'simulated');
  }

  async startDetectionLoop() {
    const loop = async () => {
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFrameTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = now;
        if (this.primaryFpsBadge) this.primaryFpsBadge.textContent = `${this.fps} FPS`;
      }

      if (this.isDetecting && this.primaryVideo && this.activeCameraId) {
        const cam = this.cameras.get(this.activeCameraId);
        const camLabel = cam ? cam.label : 'Active Cam';

        if (this.primaryVideo.videoWidth && this.primaryResBadge) {
          this.primaryResBadge.textContent = `${this.primaryVideo.videoWidth}x${this.primaryVideo.videoHeight}`;
        }

        if (this.detector) {
          const result = await this.detector.detectFrame(this.primaryVideo, this.hudCanvas, camLabel);
          if (result && this.humanCountEl) {
            this.humanCountEl.textContent = `${result.humans.length}`;
            if (result.humans.length > 0) {
              this.humanCountEl.classList.add('danger');
            } else {
              this.humanCountEl.classList.remove('danger');
            }
          }
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  startWaveformLoop() {
    if (!this.waveformCanvas) return;
    const ctx = this.waveformCanvas.getContext('2d');

    const drawWave = () => {
      const w = (this.waveformCanvas.width = this.waveformCanvas.clientWidth || 300);
      const h = (this.waveformCanvas.height = this.waveformCanvas.clientHeight || 70);

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();

      const step = w / (this.motionHistory.length - 1);
      ctx.beginPath();
      ctx.moveTo(0, h - (this.motionHistory[0] / 100) * h);

      for (let i = 1; i < this.motionHistory.length; i++) {
        const val = this.motionHistory[i];
        const x = i * step;
        const y = h - (val / 100) * (h * 0.85) - 4;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      requestAnimationFrame(drawWave);
    };

    requestAnimationFrame(drawWave);
  }

  setupEventListeners() {
    const btnAddLaptop = document.getElementById('btnAddLaptop');
    if (btnAddLaptop) {
      btnAddLaptop.addEventListener('click', () => this.addLaptopCamera());
    }

    const btnAddSim = document.getElementById('btnAddSim');
    if (btnAddSim) {
      btnAddSim.addEventListener('click', () => this.addSimulatedDemoCamera());
    }

    const slotAdd = document.getElementById('slotAddCam');
    if (slotAdd) {
      slotAdd.addEventListener('click', () => this.addLaptopCamera());
    }

    // Network Mode Switcher (Global HTTPS vs Local Wi-Fi)
    if (this.btnModeGlobal) {
      this.btnModeGlobal.addEventListener('click', () => {
        this.networkMode = 'global';
        this.btnModeGlobal.classList.add('active');
        if (this.btnModeLocal) this.btnModeLocal.classList.remove('active');
        this.setupQrCode();
      });
    }

    if (this.btnModeLocal) {
      this.btnModeLocal.addEventListener('click', () => {
        this.networkMode = 'local';
        this.btnModeLocal.classList.add('active');
        if (this.btnModeGlobal) this.btnModeGlobal.classList.remove('active');
        this.setupQrCode();
      });
    }

    if (this.btnCopyTunnelPass && this.tunnelPassCode) {
      this.btnCopyTunnelPass.addEventListener('click', () => {
        navigator.clipboard.writeText(this.tunnelPassCode.textContent.trim()).then(() => {
          const original = this.btnCopyTunnelPass.textContent;
          this.btnCopyTunnelPass.textContent = 'COPIED!';
          setTimeout(() => { this.btnCopyTunnelPass.textContent = original; }, 1800);
        });
      });
    }

    const btnCopyLink = document.getElementById('btnCopyLink');
    if (btnCopyLink && this.mobileLinkInput) {
      btnCopyLink.addEventListener('click', () => {
        navigator.clipboard.writeText(this.mobileLinkInput.value).then(() => {
          const originalText = btnCopyLink.textContent;
          btnCopyLink.textContent = 'COPIED!';
          setTimeout(() => { btnCopyLink.textContent = originalText; }, 1800);
        });
      });
    }

    const btnCopyPin = document.getElementById('btnCopyPin');
    if (btnCopyPin && this.displayRoomPin) {
      btnCopyPin.addEventListener('click', () => {
        navigator.clipboard.writeText(this.displayRoomPin.textContent.trim()).then(() => {
          const originalText = btnCopyPin.textContent;
          btnCopyPin.textContent = 'COPIED!';
          setTimeout(() => { btnCopyPin.textContent = originalText; }, 1800);
        });
      });
    }

    // 1-Click Launch Mobile Lens in Tab
    const btnOpenMobileTab = document.getElementById('btnOpenMobileTab');
    if (btnOpenMobileTab) {
      btnOpenMobileTab.addEventListener('click', () => {
        window.open(this.getMobilePairingUrl(), '_blank', 'width=480,height=800');
      });
    }

    // Clear MongoDB Events
    const btnClearEvents = document.getElementById('btnClearEvents');
    if (btnClearEvents) {
      btnClearEvents.addEventListener('click', async () => {
        if (window.argusAuth && (!window.argusAuth.currentUser || window.argusAuth.isLocked)) {
          if (window.argusAuth.isLocked) {
            window.argusAuth.showLockOverlay();
          } else {
            window.argusAuth.showGatekeeper();
          }
          return;
        }

        if (confirm('Clear all surveillance events from MongoDB?')) {
          const headers = {};
          if (window.argusAuth && window.argusAuth.token) {
            headers['Authorization'] = `Bearer ${window.argusAuth.token}`;
          }
          await fetch(window.apiUrl('/api/events'), { method: 'DELETE', headers });
          if (this.eventList) {
            this.eventList.innerHTML = `
              <div class="empty-log-placeholder" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.8rem; font-family: var(--font-hud);">
                Awaiting human motion telemetry events...
              </div>
            `;
          }
          this.mongoEventsCount = 0;
          if (this.dbEventsCountBadge) {
            this.dbEventsCountBadge.textContent = '0 IN MONGODB';
          }
        }
      });
    }

    if (this.sensitivitySlider && this.sensitivityVal) {
      this.sensitivitySlider.addEventListener('input', (e) => {
        const val = e.target.value;
        this.sensitivityVal.textContent = `${Math.round(val * 100)}%`;
        if (this.detector) {
          this.detector.sensitivity = parseFloat(val);
        }
      });
    }

    if (this.btnToggleAudio) {
      this.btnToggleAudio.addEventListener('click', () => {
        if (!this.detector) return;
        this.detector.audioAlertEnabled = !this.detector.audioAlertEnabled;
        if (this.detector.audioAlertEnabled) {
          this.btnToggleAudio.textContent = '🔊 AUDIO ALARM ON';
          this.btnToggleAudio.classList.remove('glass-btn-danger');
          this.btnToggleAudio.classList.add('glass-btn-primary');
        } else {
          this.btnToggleAudio.textContent = '🔇 AUDIO MUTED';
          this.btnToggleAudio.classList.remove('glass-btn-primary');
          this.btnToggleAudio.classList.add('glass-btn-danger');
        }
      });
    }

    // View Mode Switcher (Single Focus, Gallery, Split, Quad)
    const viewModeBtns = document.querySelectorAll('[data-view-mode]');
    viewModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-view-mode');
        this.setViewMode(mode);
      });
    });

    // Feed Size Presets (S, M, L)
    const feedSizeBtns = document.querySelectorAll('[data-feed-size]');
    feedSizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-feed-size');
        if (preset === 'compact') this.applyFeedHeight(260);
        else if (preset === 'medium') this.applyFeedHeight(420);
        else if (preset === 'large') this.applyFeedHeight(580);
      });
    });

    // Custom Feed Height Slider
    if (this.feedHeightSlider) {
      this.feedHeightSlider.addEventListener('input', (e) => {
        const h = parseInt(e.target.value, 10);
        this.applyFeedHeight(h);
      });
    }

    const viewportContainer = document.querySelector('.viewport-container');
    const filterChips = document.querySelectorAll('.chip-btn[data-filter]');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const filter = chip.getAttribute('data-filter');
        if (viewportContainer) {
          viewportContainer.className = 'viewport-container';
          if (filter !== 'normal') {
            viewportContainer.classList.add(`filter-${filter}`);
          }
        }
      });
    });

    const btnFullscreen = document.getElementById('btnFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        const target = (this.viewMode === 'focus' ? this.viewportSingle : this.galleryMatrix) || viewportContainer;
        if (!document.fullscreenElement) {
          if (target && target.requestFullscreen) {
            target.requestFullscreen().catch(err => console.warn(err));
          }
        } else {
          document.exitFullscreen();
        }
      });
    }

    const btnManualSnap = document.getElementById('btnManualSnap');
    if (btnManualSnap && this.detector && this.primaryVideo) {
      btnManualSnap.addEventListener('click', () => {
        const snap = this.detector.captureSnapshot(this.primaryVideo, this.hudCanvas);
        if (snap) {
          const cam = this.cameras.get(this.activeCameraId);
          this.handleDetectionEvent({
            type: 'MANUAL_SNAPSHOT',
            camLabel: cam ? cam.label : 'Active View',
            confidence: 100,
            motionIntensity: Math.round(this.detector.motionPercent),
            timestamp: new Date().toLocaleTimeString(),
            snapshot: snap
          });
        }
      });
    }

    const btnCloseModal = document.getElementById('btnCloseModal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => this.closeSnapshotModal());
    }
    if (this.snapModal) {
      this.snapModal.addEventListener('click', (e) => {
        if (e.target === this.snapModal) this.closeSnapshotModal();
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.argusHub = new ArgusHubApp();
});
