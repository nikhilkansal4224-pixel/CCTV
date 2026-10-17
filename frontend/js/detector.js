/**
 * AI Human & Movement Detection Engine
 * Integrates TensorFlow.js COCO-SSD for neural person recognition
 * + Centroid Displacement & Optical Motion Differencing for movement tracking.
 */

class HumanMotionDetector {
  constructor(options = {}) {
    this.minConfidence = options.minConfidence || 0.55;
    this.motionSensitivity = options.motionSensitivity || 15; // displacement threshold
    this.model = null;
    this.isModelLoading = false;
    this.isModelReady = false;
    
    // Per-camera tracking states: { lastCentroids: [], prevFrameData: null, lastAlertTime: 0 }
    this.trackers = new Map();
    
    // Callbacks
    this.onAlert = options.onAlert || null;
    this.onTelemetryUpdate = options.onTelemetryUpdate || null;

    this.initAudioAlarm();
    this.loadModel();
  }

  initAudioAlarm() {
    this.audioCtx = null;
    this.soundEnabled = true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  playRadarPing() {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    const now = this.audioCtx.currentTime;
    
    // Dual frequency harmonic warning pulse
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.28);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1320, now);
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.28);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.33);
    osc2.stop(now + 0.33);
  }

  async loadModel() {
    if (this.isModelLoading || this.isModelReady) return;
    this.isModelLoading = true;
    console.log('[AI Detector] Initializing Neural Human Detection Engine...');

    try {
      if (window.cocoSsd) {
        this.model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
        this.isModelReady = true;
        console.log('✅ [AI Detector] COCO-SSD Human Detection Model Loaded Successfully!');
        if (this.onTelemetryUpdate) {
          this.onTelemetryUpdate({ status: 'ACTIVE_NEURAL', model: 'COCO-SSD MobileNet' });
        }
      } else {
        console.warn('[AI Detector] cocoSsd not yet in window, retrying in 1s...');
        setTimeout(() => this.loadModel(), 1000);
      }
    } catch (err) {
      console.error('[AI Detector] Failed to load COCO-SSD model:', err);
      this.isModelReady = false;
      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({ status: 'OPTICAL_FALLBACK', model: 'Frame Differencing' });
      }
    } finally {
      this.isModelLoading = false;
    }
  }

  getTracker(cameraId) {
    if (!this.trackers.has(cameraId)) {
      this.trackers.set(cameraId, {
        prevCentroids: [],
        lastAlertTime: 0,
        consecutiveDetections: 0,
        prevFrameData: null,
        lastSnapshot: null
      });
    }
    return this.trackers.get(cameraId);
  }

  /**
   * Process a video element or canvas feed
   * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} source 
   * @param {HTMLCanvasElement} overlayCanvas 
   * @param {string} cameraId 
   * @param {string} cameraName 
   */
  async processFrame(source, overlayCanvas, cameraId, cameraName = 'Camera') {
    if (!source || !overlayCanvas) return;
    if (source.videoWidth === 0 && source.width === 0) return;

    const width = source.videoWidth || source.naturalWidth || source.width || 640;
    const height = source.videoHeight || source.naturalHeight || source.height || 480;

    if (overlayCanvas.width !== width || overlayCanvas.height !== height) {
      overlayCanvas.width = width;
      overlayCanvas.height = height;
    }

    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const tracker = this.getTracker(cameraId);
    let detectedHumans = [];
    let isMoving = false;
    let maxMovementSpeed = 0;

    if (this.isModelReady && this.model) {
      try {
        const predictions = await this.model.detect(source);
        // Filter solely for human beings with confidence >= threshold
        detectedHumans = predictions.filter(
          p => p.class === 'person' && p.score >= this.minConfidence
        );
      } catch (e) {
        // Source might be busy or transitioning
      }
    }

    // Optical Motion Differencing Fallback or Hybrid Augmentation
    const opticalMotion = this.computeOpticalMotion(source, width, height, tracker);
    
    // Evaluate Human Tracking & Movement Dynamics
    const currentCentroids = [];
    const now = Date.now();

    if (detectedHumans.length > 0) {
      for (const human of detectedHumans) {
        const [x, y, w, h] = human.bbox;
        const cx = x + w / 2;
        const cy = y + h / 2;
        currentCentroids.push({ x: cx, y: cy, w, h, score: human.score });

        // Calculate velocity relative to closest prior centroid
        let minDisplacement = 0;
        if (tracker.prevCentroids.length > 0) {
          const distances = tracker.prevCentroids.map(prev => Math.hypot(cx - prev.x, cy - prev.y));
          minDisplacement = Math.min(...distances);
        }

        if (minDisplacement > maxMovementSpeed) {
          maxMovementSpeed = minDisplacement;
        }

        // Subject movement criteria: centroid movement OR optical movement inside bounding box
        if (minDisplacement > this.motionSensitivity || opticalMotion.intensity > 12) {
          isMoving = true;
        }

        // Draw HUD overlay targeting brackets & metadata
        this.renderTargetHUD(ctx, x, y, w, h, human.score, isMoving);
      }

      tracker.consecutiveDetections++;
    } else if (opticalMotion.intensity > 25) {
      // General Motion Detection fallback
      isMoving = true;
      maxMovementSpeed = opticalMotion.intensity;
      this.renderMotionBox(ctx, opticalMotion.box, opticalMotion.intensity);
    } else {
      tracker.consecutiveDetections = 0;
    }

    tracker.prevCentroids = currentCentroids;

    // Trigger Alert when Human Movement is confirmed
    if ((detectedHumans.length > 0 && isMoving) || (detectedHumans.length > 0 && tracker.consecutiveDetections > 3)) {
      if (now - tracker.lastAlertTime > 3500) { // Throttle alerts to avoid spamming
        tracker.lastAlertTime = now;
        
        // Capture snapshot thumbnail
        const snapshot = this.captureSnapshot(source, width, height);
        tracker.lastSnapshot = snapshot;

        const topConfidence = detectedHumans.length > 0 ? detectedHumans[0].score : 0.88;
        
        // Play acoustic radar warning
        this.playRadarPing();

        const alertPayload = {
          cameraId,
          cameraName,
          confidence: topConfidence,
          humanCount: detectedHumans.length,
          velocity: Math.round(maxMovementSpeed),
          snapshot,
          timestamp: new Date().toISOString(),
          type: 'Human Movement Detected',
          message: `Identified ${detectedHumans.length} human subject(s) with active movement vector (${Math.round(maxMovementSpeed)} px/s)`
        };

        if (this.onAlert) {
          this.onAlert(alertPayload);
        }
      }
    }

    // Return live frame telemetry
    return {
      humanCount: detectedHumans.length,
      isMoving,
      movementSpeed: Math.round(maxMovementSpeed),
      opticalIntensity: opticalMotion.intensity
    };
  }

  renderTargetHUD(ctx, x, y, w, h, score, isMoving) {
    const color = isMoving ? '#ff0055' : '#00f0ff';
    const tag = isMoving ? 'HUMAN • MOVING' : 'HUMAN • DETECTED';
    const confStr = `${Math.round(score * 100)}%`;

    ctx.save();
    
    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Cyberpunk Corner Brackets
    const cornerSize = Math.min(22, w * 0.25, h * 0.25);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerSize, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerSize, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cornerSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - cornerSize);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cornerSize, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerSize, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cornerSize);
    ctx.stroke();

    // Subtle Target Reticle in Center
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Target Label Tag Banner
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const text = `${tag} [${confStr}]`;
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillStyle = isMoving ? 'rgba(255, 0, 85, 0.85)' : 'rgba(0, 240, 255, 0.85)';
    ctx.fillRect(x, Math.max(0, y - 22), textWidth + 14, 20);

    ctx.fillStyle = '#05070d';
    ctx.fillText(text, x + 7, Math.max(14, y - 8));

    ctx.restore();
  }

  renderMotionBox(ctx, box, intensity) {
    if (!box) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText(`MOTION DETECTED [${intensity}%]`, box.x + 4, box.y - 4);
    ctx.restore();
  }

  computeOpticalMotion(source, width, height, tracker) {
    // Downscale for ultra-fast motion estimation
    const thumbW = 64;
    const thumbH = 48;
    
    if (!this.motionCanvas) {
      this.motionCanvas = document.createElement('canvas');
      this.motionCanvas.width = thumbW;
      this.motionCanvas.height = thumbH;
      this.motionCtx = this.motionCanvas.getContext('2d', { willReadFrequently: true });
    }

    try {
      this.motionCtx.drawImage(source, 0, 0, thumbW, thumbH);
      const currentData = this.motionCtx.getImageData(0, 0, thumbW, thumbH).data;

      if (!tracker.prevFrameData) {
        tracker.prevFrameData = currentData;
        return { intensity: 0, box: null };
      }

      let diffCount = 0;
      let minX = thumbW, maxX = 0, minY = thumbH, maxY = 0;

      for (let i = 0; i < currentData.length; i += 4) {
        // Luminance difference
        const diff = Math.abs(currentData[i] - tracker.prevFrameData[i]) +
                     Math.abs(currentData[i + 1] - tracker.prevFrameData[i + 1]) +
                     Math.abs(currentData[i + 2] - tracker.prevFrameData[i + 2]);

        if (diff > 85) {
          diffCount++;
          const pixelIndex = i / 4;
          const px = pixelIndex % thumbW;
          const py = Math.floor(pixelIndex / thumbW);
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }

      tracker.prevFrameData = currentData;
      const totalPixels = thumbW * thumbH;
      const ratio = (diffCount / totalPixels) * 100;

      let box = null;
      if (diffCount > 15 && maxX > minX) {
        const scaleX = width / thumbW;
        const scaleY = height / thumbH;
        box = {
          x: minX * scaleX,
          y: minY * scaleY,
          w: (maxX - minX) * scaleX,
          h: (maxY - minY) * scaleY
        };
      }

      return { intensity: Math.min(100, Math.round(ratio * 4)), box };
    } catch (e) {
      return { intensity: 0, box: null };
    }
  }

  captureSnapshot(source, width, height) {
    try {
      const snapCanvas = document.createElement('canvas');
      // Compact thumbnail for fast transfer and storage
      const snapW = Math.min(width, 480);
      const snapH = Math.round((snapW / width) * height);
      snapCanvas.width = snapW;
      snapCanvas.height = snapH;
      const snapCtx = snapCanvas.getContext('2d');
      snapCtx.drawImage(source, 0, 0, snapW, snapH);
      return snapCanvas.toDataURL('image/jpeg', 0.65);
    } catch (e) {
      return null;
    }
  }
}
