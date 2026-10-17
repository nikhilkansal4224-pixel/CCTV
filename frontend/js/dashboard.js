/**
 * CCTV Command Center Dashboard Controller
 * Features:
 * - Dynamic Multi-Camera Auto-Grid Matrix (auto-adapts all cameras to max size)
 * - Individual Camera Remove (trash) buttons & solo-focus mode
 * - Concurrent AI Human Movement Detection across all active cameras
 * - Glassmorphic Settings Modal with persistence & live surrealism toggles
 * - Dynamic QR Code Mobile Pairing & Socket.io WebRTC management
 */

class DashboardController {
  constructor() {
    this.socket = null;
    this.cameraManager = null;
    this.detector = null;

    // Active matrix cells: cameraId -> { cellEl, videoEl, canvasEl, overlayCanvasEl, filterIndex }
    this.matrixCells = new Map();
    this.activeSoloCameraId = null;
    this.animationLoopId = null;
    this.filterModes = ['normal', 'night', 'thermal', 'surreal'];

    // Settings preferences with localStorage persistence
    this.settings = this.loadSettings();

    // DOM Elements
    this.matrixGrid = document.getElementById('surveillance-matrix-grid');
    this.matrixEmptyState = document.getElementById('matrix-empty-state');
    this.matrixActiveBadge = document.getElementById('matrix-active-count-badge');
    this.bentoHeroPanel = document.getElementById('bento-hero-panel');
    this.btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen-matrix');
    this.labelFullscreen = document.getElementById('label-fullscreen');

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

    this.sliderConfidence = document.getElementById('slider-confidence');
    this.sliderSensitivity = document.getElementById('slider-sensitivity');
    this.valConfidence = document.getElementById('label-val-confidence');
    this.valSensitivity = document.getElementById('label-val-sensitivity');

    // Settings Modal Elements
    this.settingsModal = document.getElementById('settings-modal');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings-modal');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.btnResetDefaults = document.getElementById('btn-reset-defaults');
    this.btnClearSettingsLogs = document.getElementById('btn-settings-clear-logs');
    this.btnDisconnectAll = document.getElementById('btn-disconnect-all-cams');

    this.init();
  }

  loadSettings() {
    const defaultSettings = {
      confidence: 55,
      sensitivity: 15,
      soundEnabled: true,
      autoMaxGrid: true,
      autoFocusBreach: true,
      showEye: true,
      showGears: true,
      showOrbs: true
    };
    try {
      const stored = localStorage.getItem('cctv_system_settings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('cctv_system_settings', JSON.stringify(this.settings));
    this.applySettingsToApp();
  }

  applySettingsToApp() {
    // Apply to Detector
    if (this.detector) {
      this.detector.minConfidence = this.settings.confidence / 100;
      this.detector.motionSensitivity = this.settings.sensitivity;
      this.detector.soundEnabled = this.settings.soundEnabled;
    }

    // Apply to sliders in main UI
    if (this.sliderConfidence) {
      this.sliderConfidence.value = this.settings.confidence;
      this.valConfidence.innerText = `${this.settings.confidence}%`;
    }
    if (this.sliderSensitivity) {
      this.sliderSensitivity.value = this.settings.sensitivity;
      this.valSensitivity.innerText = `${this.settings.sensitivity} px`;
    }

    // Apply sound button state
    if (this.btnSoundToggle) {
      this.btnSoundToggle.classList.toggle('active', this.settings.soundEnabled);
      this.btnSoundToggle.querySelector('span').innerText = this.settings.soundEnabled ? 'Audio Siren (ON)' : 'Audio Siren (OFF)';
    }

    // Apply to Surrealism visual elements
    if (window.surrealEngine) {
      window.surrealEngine.showEye = this.settings.showEye;
      window.surrealEngine.showGears = this.settings.showGears;
    }
    document.querySelectorAll('.surreal-glow-orb').forEach(orb => {
      orb.style.display = this.settings.showOrbs ? 'block' : 'none';
    });
  }

  async init() {
    this.initSocket();
    this.initDetector();
    this.initCameraManager();
    this.bindControls();
    this.bindSettingsModal();
    this.applySettingsToApp();
    await this.fetchNetworkInfo();
    await this.fetchAlertHistory();

    // Start with 1 default simulated camera so user immediately sees working AI detection
    setTimeout(() => {
      if (this.cameraManager.cameras.size === 0) {
        this.cameraManager.addSimulatedFeed('Corridor Cam [Simulated #01]');
      }
    }, 600);

    // Launch continuous detection loop for all matrix cells
    this.startMatrixDetectionLoop();
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
      minConfidence: this.settings.confidence / 100,
      motionSensitivity: this.settings.sensitivity,
      onAlert: (alertData) => this.handleDetectionAlert(alertData),
      onTelemetryUpdate: ({ status, model }) => {
        console.log('[AI Detector Status]', status, model);
      }
    });
    this.detector.soundEnabled = this.settings.soundEnabled;
  }

  initCameraManager() {
    this.cameraManager = new CameraManager(this.socket);

    this.cameraManager.onCameraAdded = (camera) => {
      this.addCameraToMatrixGrid(camera);
      this.updateGridMetrics();
    };

    this.cameraManager.onCameraRemoved = (cameraId) => {
      this.removeCameraFromMatrixGrid(cameraId);
      this.updateGridMetrics();
    };

    this.cameraManager.onRemoteFrame = (cameraId, imageDataUrl, isPortrait) => {
      const cell = this.matrixCells.get(cameraId);
      if (cell && cell.canvasEl) {
        const img = new Image();
        img.onload = () => {
          if (cell.videoEl) cell.videoEl.style.display = 'none';
          cell.canvasEl.style.display = 'block';
          cell.canvasEl.width = img.width;
          cell.canvasEl.height = img.height;
          const ctx = cell.canvasEl.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const portrait = isPortrait !== undefined ? isPortrait : img.height > img.width;
          if (cell.isPortrait !== portrait) {
            cell.isPortrait = portrait;
            cell.cellEl.classList.toggle('is-portrait', portrait);
            if (portrait && !cell.cellEl.classList.contains('aspect-cover')) {
              cell.cellEl.classList.add('aspect-contain');
            }
            const badge = cell.cellEl.querySelector(`#aspect-badge-${cameraId}`);
            if (badge) {
              badge.className = `aspect-badge ${portrait ? 'portrait' : 'landscape'}`;
              badge.innerText = portrait ? '9:16 VERTICAL' : '16:9 HORIZONTAL';
            }
            this.recalculateMatrixLayout();
          }
        };
        img.src = imageDataUrl;
      }
    };
  }

  /**
   * Dynamically adds and maximizes a camera inside the Auto-Grid Surveillance Matrix
   */
  addCameraToMatrixGrid(camera) {
    if (this.matrixCells.has(camera.id)) return;

    if (this.matrixEmptyState) {
      this.matrixEmptyState.style.display = 'none';
    }

    const cell = document.createElement('div');
    cell.className = 'matrix-camera-cell';
    cell.id = `matrix-cell-${camera.id}`;

    // Header HUD with camera info & Action buttons (Remove, Solo Focus, Snapshot, Filter)
    cell.innerHTML = `
      <div class="matrix-cell-header">
        <div class="matrix-cell-title-pill">
          <span class="status-indicator-dot" style="width:7px; height:7px;"></span>
          <span class="cam-cell-name">${camera.name}</span>
          <span style="opacity:0.5;">|</span>
          <span style="font-size:10px; color:var(--neon-cyan);">${camera.type.toUpperCase()}</span>
          <span class="aspect-badge ${camera.canvas && camera.canvas.height > camera.canvas.width ? 'portrait' : 'landscape'}" id="aspect-badge-${camera.id}">
            ${camera.canvas && camera.canvas.height > camera.canvas.width ? '9:16 VERTICAL' : '16:9 HORIZONTAL'}
          </span>
        </div>

        <div class="matrix-cell-actions">
          <!-- Fit / Fill Mode Toggle for Vertical/Horizontal feeds -->
          <button class="btn-cam-action" id="btn-aspect-${camera.id}" title="Toggle Fit / Fill Mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="9" y1="18" x2="15" y2="18"/>
            </svg>
          </button>

          <!-- Vision Filter Toggle -->
          <button class="btn-cam-action" id="btn-filter-${camera.id}" title="Toggle Vision Filter (Night/Thermal/Surreal)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M2 12c2.5-5 6.5-8 10-8s7.5 3 10 8c-2.5 5-6.5 8-10 8s-7.5-3-10-8z"/>
            </svg>
          </button>

          <!-- Snapshot Button -->
          <button class="btn-cam-action" id="btn-snap-${camera.id}" title="Capture High-Res Snapshot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>

          <!-- Solo Focus / Maximize Button -->
          <button class="btn-cam-action" id="btn-solo-${camera.id}" title="Solo Maximize Feed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>

          <!-- Remove Camera Button (User requested) -->
          <button class="btn-cam-action danger" id="btn-remove-${camera.id}" title="Remove / Disconnect Camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Live Stream Surface -->
      <video id="matrix-video-${camera.id}" autoplay playsinline muted style="${camera.stream ? 'display:block;' : 'display:none;'}"></video>
      <canvas id="matrix-feed-canvas-${camera.id}" class="matrix-feed-canvas" style="${camera.canvas || !camera.stream ? 'display:block;' : 'display:none;'}"></canvas>

      <!-- AI Human Movement Detection & HUD Targeting Canvas -->
      <canvas id="matrix-overlay-${camera.id}" class="matrix-detection-canvas"></canvas>
    `;

    this.matrixGrid.appendChild(cell);

    const videoEl = cell.querySelector(`#matrix-video-${camera.id}`);
    const feedCanvasEl = cell.querySelector(`#matrix-feed-canvas-${camera.id}`);
    const overlayCanvasEl = cell.querySelector(`#matrix-overlay-${camera.id}`);

    if (camera.stream && videoEl) {
      videoEl.srcObject = camera.stream;
      videoEl.play().catch(e => console.warn('Stream play error:', e));
    }

    const cellObj = {
      cameraId: camera.id,
      cameraName: camera.name,
      cellEl: cell,
      videoEl,
      canvasEl: feedCanvasEl,
      overlayCanvasEl,
      filterIndex: 0
    };

    this.matrixCells.set(camera.id, cellObj);

    // Bind Cell Buttons
    // 1. Remove Camera Button
    const btnRemove = cell.querySelector(`#btn-remove-${camera.id}`);
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmAndRemoveCamera(camera.id, camera.name);
    });

    // 2. Solo Focus Button
    const btnSolo = cell.querySelector(`#btn-solo-${camera.id}`);
    btnSolo.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSoloFocus(camera.id);
    });

    // 3. Snapshot Button
    const btnSnap = cell.querySelector(`#btn-snap-${camera.id}`);
    btnSnap.addEventListener('click', (e) => {
      e.stopPropagation();
      this.takeCameraSnapshot(camera.id);
    });

    // 4. Vision Filter Toggle
    const btnFilter = cell.querySelector(`#btn-filter-${camera.id}`);
    btnFilter.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cycleVisionFilter(cellObj);
    });

    // 5. Fit / Fill Aspect Mode Toggle
    const btnAspect = cell.querySelector(`#btn-aspect-${camera.id}`);
    btnAspect.addEventListener('click', (e) => {
      e.stopPropagation();
      const isContain = cell.classList.toggle('aspect-contain');
      cell.classList.toggle('aspect-cover', !isContain);
      btnAspect.classList.toggle('active', isContain);
    });

    this.recalculateMatrixLayout();
  }

  /**
   * Recalculates CSS grid layout so all cameras auto-arrange in their maximum sizes
   * Intelligently balances vertical vs horizontal camera counts
   */
  recalculateMatrixLayout() {
    const count = this.matrixCells.size;
    const portraitCount = Array.from(this.matrixCells.values()).filter(c => c.isPortrait).length;

    this.matrixGrid.setAttribute('data-count', count.toString());
    this.matrixGrid.setAttribute('data-portraits', portraitCount.toString());

    if (count === 0 && this.matrixEmptyState) {
      this.matrixEmptyState.style.display = 'flex';
    } else if (this.matrixEmptyState) {
      this.matrixEmptyState.style.display = 'none';
    }

    this.matrixActiveBadge.innerText = `${count} ${count === 1 ? 'CAMERA' : 'CAMERAS'} ACTIVE (${portraitCount} VERTICAL)`;
  }

  /**
   * Remove Camera by ID (Local, remote phone, or simulated)
   */
  confirmAndRemoveCamera(cameraId, cameraName) {
    console.log(`[Matrix] Removing camera: ${cameraName} (${cameraId})`);

    // Emit remove event to server to notify phone or other dashboards
    if (this.socket && this.socket.connected) {
      this.socket.emit('remove-camera', { cameraId });
    }

    // Remove from local camera manager
    this.cameraManager.removeCamera(cameraId);
    this.removeCameraFromMatrixGrid(cameraId);
    this.updateGridMetrics();
  }

  removeCameraFromMatrixGrid(cameraId) {
    const cellObj = this.matrixCells.get(cameraId);
    if (cellObj) {
      if (this.activeSoloCameraId === cameraId) {
        this.activeSoloCameraId = null;
      }
      cellObj.cellEl.remove();
      this.matrixCells.delete(cameraId);
      this.recalculateMatrixLayout();
    }
  }

  toggleSoloFocus(cameraId) {
    const cell = this.matrixCells.get(cameraId);
    if (!cell) return;

    if (this.activeSoloCameraId === cameraId) {
      // Exit Solo Focus
      this.activeSoloCameraId = null;
      cell.cellEl.classList.remove('solo-focus');
      cell.cellEl.querySelector(`#btn-solo-${cameraId}`).classList.remove('active');
    } else {
      // Enter Solo Focus
      if (this.activeSoloCameraId) {
        const prev = this.matrixCells.get(this.activeSoloCameraId);
        if (prev) {
          prev.cellEl.classList.remove('solo-focus');
          prev.cellEl.querySelector(`#btn-solo-${this.activeSoloCameraId}`).classList.remove('active');
        }
      }
      this.activeSoloCameraId = cameraId;
      cell.cellEl.classList.add('solo-focus');
      cell.cellEl.querySelector(`#btn-solo-${cameraId}`).classList.add('active');
    }
  }

  cycleVisionFilter(cellObj) {
    cellObj.filterIndex = (cellObj.filterIndex + 1) % this.filterModes.length;
    const mode = this.filterModes[cellObj.filterIndex];

    const targets = [cellObj.videoEl, cellObj.canvasEl];
    targets.forEach(el => {
      if (!el) return;
      el.classList.remove('filter-night', 'filter-thermal', 'filter-surreal');
      if (mode !== 'normal') {
        el.classList.add(`filter-${mode}`);
      }
    });

    const btn = cellObj.cellEl.querySelector(`#btn-filter-${cellObj.cameraId}`);
    if (btn) {
      btn.classList.toggle('active', mode !== 'normal');
    }
  }

  takeCameraSnapshot(cameraId) {
    const cell = this.matrixCells.get(cameraId);
    if (!cell) return;
    const cam = this.cameraManager.cameras.get(cameraId);
    const source = cam && cam.stream ? cell.videoEl : cam && cam.canvas ? cam.canvas : cell.canvasEl;

    const snap = this.detector.captureSnapshot(
      source,
      source.videoWidth || source.width || 640,
      source.videoHeight || source.height || 480
    );

    if (snap) {
      const a = document.createElement('a');
      a.href = snap;
      a.download = `AETHER-${cam ? cam.name.replace(/\s+/g, '_') : 'Camera'}-${Date.now()}.jpg`;
      a.click();
    }
  }

  /**
   * Continuous multi-feed AI detection across all active auto-maximized camera cells
   */
  startMatrixDetectionLoop() {
    let totalDetectedInTick = 0;
    let maxSpeedInTick = 0;

    const runDetection = async () => {
      totalDetectedInTick = 0;
      maxSpeedInTick = 0;

      for (const [camId, cellObj] of this.matrixCells.entries()) {
        const cam = this.cameraManager.cameras.get(camId);
        if (!cam) continue;

        const source = cam.stream ? cellObj.videoEl : cam.canvas ? cam.canvas : cellObj.canvasEl;
        if (!source) continue;

        // Detect native feed orientation (Vertical vs Horizontal)
        const srcW = source.videoWidth || source.naturalWidth || source.width || 0;
        const srcH = source.videoHeight || source.naturalHeight || source.height || 0;
        if (srcW > 0 && srcH > 0) {
          const isPortrait = srcH > srcW;
          if (cellObj.isPortrait !== isPortrait) {
            cellObj.isPortrait = isPortrait;
            cellObj.cellEl.classList.toggle('is-portrait', isPortrait);
            if (isPortrait && !cellObj.cellEl.classList.contains('aspect-cover')) {
              cellObj.cellEl.classList.add('aspect-contain');
            }
            const badge = cellObj.cellEl.querySelector(`#aspect-badge-${camId}`);
            if (badge) {
              badge.className = `aspect-badge ${isPortrait ? 'portrait' : 'landscape'}`;
              badge.innerText = isPortrait ? '9:16 VERTICAL' : '16:9 HORIZONTAL';
            }
            this.recalculateMatrixLayout();
          }
        }

        // Render simulation frame if it's a simulated feed
        if (cam.canvas && cellObj.canvasEl) {
          if (cellObj.canvasEl.width !== cam.canvas.width) {
            cellObj.canvasEl.width = cam.canvas.width;
            cellObj.canvasEl.height = cam.canvas.height;
          }
          const ctx = cellObj.canvasEl.getContext('2d');
          ctx.drawImage(cam.canvas, 0, 0);
        }

        const telemetry = await this.detector.processFrame(
          source,
          cellObj.overlayCanvasEl,
          camId,
          cam.name
        );

        if (telemetry) {
          totalDetectedInTick += telemetry.humanCount;
          if (telemetry.movementSpeed > maxSpeedInTick) {
            maxSpeedInTick = telemetry.movementSpeed;
          }

          if (telemetry.humanCount > 0 && this.settings.autoFocusBreach) {
            cellObj.cellEl.classList.add('threat-detected');
            setTimeout(() => cellObj.cellEl.classList.remove('threat-detected'), 1500);
          }
        }
      }

      this.humanCountVal.innerText = totalDetectedInTick;
      this.movementSpeedVal.innerText = maxSpeedInTick;

      if (totalDetectedInTick > 0) {
        this.humanCountVal.classList.add('alert');
        this.systemThreatIndicator.classList.add('threat');
        this.systemStatusText.innerText = 'HUMAN PERIMETER BREACH';
      } else {
        this.humanCountVal.classList.remove('alert');
        this.systemThreatIndicator.classList.remove('threat');
        this.systemStatusText.innerText = 'SURVEILLANCE SECURE';
      }

      this.animationLoopId = requestAnimationFrame(runDetection);
    };

    this.animationLoopId = requestAnimationFrame(runDetection);
  }

  handleDetectionAlert(alertData) {
    // Send to backend API
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    }).catch(e => console.warn('Alert post failed:', e));

    // Flash Cell
    const cell = this.matrixCells.get(alertData.cameraId);
    if (cell) {
      cell.cellEl.classList.add('threat-detected');
      setTimeout(() => cell.cellEl.classList.remove('threat-detected'), 2500);
    }
  }

  prependIncident(alert, increment = true) {
    if (this.incidentList.querySelector('div[style*="Awaiting optical"]')) {
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
      this.incidentCountBadge.innerText = `${this.incidentList.children.length} INCIDENTS`;
    }
  }

  updateGridMetrics() {
    const count = this.matrixCells.size;
    this.cameraCountBadge.innerText = `${count} ACTIVE`;
    const countMetric = document.getElementById('val-active-cameras');
    if (countMetric) countMetric.innerText = count;
  }

  async fetchNetworkInfo() {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      const mobileUrl = data.cameraStreamUrl;
      this.urlDisplay.innerText = mobileUrl;
      
      const lanEl = document.getElementById('settings-lan-ip');
      if (lanEl) lanEl.innerText = `${data.localIp}:${data.port}`;

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
        await this.cameraManager.addLocalWebcam(`Laptop Cam #${Math.floor(Math.random() * 90 + 10)}`);
      } catch (err) {
        alert('Webcam permission denied or camera not found: ' + err.message);
      }
    });

    // Add Simulated Horizontal Feed
    this.btnAddSim.addEventListener('click', () => {
      this.cameraManager.addSimulatedFeed(`Simulated Zone #${Math.floor(Math.random() * 90 + 10)}`, false);
    });

    // Add Simulated Vertical Mobile Feed (User requested vertical/horizontal management)
    const btnSimVert = document.getElementById('btn-add-sim-vertical');
    if (btnSimVert) {
      btnSimVert.addEventListener('click', () => {
        this.cameraManager.addSimulatedFeed(`Mobile Phone [9:16 Vertical #${Math.floor(Math.random() * 90 + 10)}]`, true);
      });
    }

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
      const active = !this.settings.soundEnabled;
      this.saveSettings({ soundEnabled: active });
    });

    // Clear Alerts
    this.btnClearAlerts.addEventListener('click', async () => {
      await fetch('/api/alerts', { method: 'DELETE' });
    });

    // Sliders
    this.sliderConfidence.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.valConfidence.innerText = `${val}%`;
      this.saveSettings({ confidence: val });
    });

    this.sliderSensitivity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.valSensitivity.innerText = `${val} px`;
      this.saveSettings({ sensitivity: val });
    });

    // Fullscreen Matrix Toggle
    this.btnToggleFullscreen.addEventListener('click', () => {
      const isFull = this.bentoHeroPanel.classList.toggle('fullscreen-matrix');
      this.labelFullscreen.innerText = isFull ? 'Restore Grid' : 'Fullscreen Matrix';
    });
  }

  /**
   * Bind Settings Modal Tabs & Controls
   */
  bindSettingsModal() {
    this.btnOpenSettings.addEventListener('click', () => {
      this.populateSettingsInputs();
      this.settingsModal.classList.add('open');
    });

    this.btnCloseSettings.addEventListener('click', () => {
      this.settingsModal.classList.remove('open');
    });

    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.settingsModal.classList.remove('open');
      }
    });

    // Tab buttons
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.settings-section-view').forEach(s => s.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        const targetView = document.getElementById(tabId);
        if (targetView) targetView.classList.add('active');
      });
    });

    // Settings Sliders live labels
    const sConf = document.getElementById('settings-slider-conf');
    const sConfLabel = document.getElementById('settings-label-conf');
    sConf.addEventListener('input', (e) => {
      sConfLabel.innerText = `${e.target.value}%`;
    });

    const sSens = document.getElementById('settings-slider-sens');
    const sSensLabel = document.getElementById('settings-label-sens');
    sSens.addEventListener('input', (e) => {
      sSensLabel.innerText = `${e.target.value} px`;
    });

    // Save Settings Button
    this.btnSaveSettings.addEventListener('click', () => {
      const newSettings = {
        confidence: parseInt(sConf.value),
        sensitivity: parseInt(sSens.value),
        soundEnabled: document.getElementById('settings-toggle-sound').checked,
        autoMaxGrid: document.getElementById('settings-toggle-auto-max').checked,
        autoFocusBreach: document.getElementById('settings-toggle-autofocus').checked,
        showEye: document.getElementById('settings-toggle-eye').checked,
        showGears: document.getElementById('settings-toggle-gears').checked,
        showOrbs: document.getElementById('settings-toggle-orbs').checked
      };

      this.saveSettings(newSettings);
      this.settingsModal.classList.remove('open');

      // Visual Confirmation
      const orig = this.btnSaveSettings.innerText;
      this.btnSaveSettings.innerText = 'Saved!';
      setTimeout(() => this.btnSaveSettings.innerText = orig, 1500);
    });

    // Reset Defaults
    this.btnResetDefaults.addEventListener('click', () => {
      localStorage.removeItem('cctv_system_settings');
      this.settings = this.loadSettings();
      this.populateSettingsInputs();
      this.applySettingsToApp();
      alert('Preferences reset to default configuration.');
    });

    // Clear Logs from Settings
    this.btnClearSettingsLogs.addEventListener('click', async () => {
      await fetch('/api/alerts', { method: 'DELETE' });
      alert('Incident logs cleared.');
    });

    // Disconnect All Cameras
    this.btnDisconnectAll.addEventListener('click', () => {
      if (confirm('Disconnect all optical camera feeds?')) {
        const allIds = Array.from(this.matrixCells.keys());
        allIds.forEach(id => this.confirmAndRemoveCamera(id, 'Camera'));
      }
    });
  }

  populateSettingsInputs() {
    document.getElementById('settings-slider-conf').value = this.settings.confidence;
    document.getElementById('settings-label-conf').innerText = `${this.settings.confidence}%`;

    document.getElementById('settings-slider-sens').value = this.settings.sensitivity;
    document.getElementById('settings-label-sens').innerText = `${this.settings.sensitivity} px`;

    document.getElementById('settings-toggle-sound').checked = this.settings.soundEnabled;
    document.getElementById('settings-toggle-auto-max').checked = this.settings.autoMaxGrid;
    document.getElementById('settings-toggle-autofocus').checked = this.settings.autoFocusBreach;
    document.getElementById('settings-toggle-eye').checked = this.settings.showEye;
    document.getElementById('settings-toggle-gears').checked = this.settings.showGears;
    document.getElementById('settings-toggle-orbs').checked = this.settings.showOrbs;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new DashboardController();
});
