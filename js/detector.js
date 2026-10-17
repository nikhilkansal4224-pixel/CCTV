/**
 * ARGUS SURREAL CCTV // NEURAL HUMAN & MOTION DETECTION ENGINE
 * Powered by TensorFlow.js COCO-SSD + Real-Time Pixel-Difference Motion Engine
 * Synthesizes Web Audio alerts and renders futuristic Glass HUD overlays.
 */

class ArgusDetector {
  constructor(options = {}) {
    this.model = null;
    this.isModelLoading = false;
    this.isModelReady = false;
    this.sensitivity = options.sensitivity || 0.45; // Minimum confidence for human
    this.motionThreshold = options.motionThreshold || 12; // Pixel delta threshold
    this.motionPercent = 0;
    this.audioAlertEnabled = true;
    this.autoSnapshotEnabled = true;

    // Callbacks
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onDetection = options.onDetection || (() => {});
    this.onMotionUpdate = options.onMotionUpdate || (() => {});

    // State tracking
    this.lastDetectionTime = 0;
    this.cooldownMs = 2500; // Cooldown between snapshot & siren alerts
    this.previousFrameData = null;

    // Web Audio Synthesizer
    this.audioCtx = null;

    // Offscreen canvas for fast motion differencing
    this.diffCanvas = document.createElement('canvas');
    this.diffCanvas.width = 160;
    this.diffCanvas.height = 120;
    this.diffCtx = this.diffCanvas.getContext('2d', { willReadFrequently: true });

    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  resumeAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playRadarPing() {
    if (!this.audioAlertEnabled || !this.audioCtx) return;
    this.resumeAudio();
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, this.audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch (e) {}
  }

  playIntruderAlarm() {
    if (!this.audioAlertEnabled || !this.audioCtx) return;
    this.resumeAudio();
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.2);
      osc.frequency.linearRampToValueAtTime(440, now + 0.4);
      osc.frequency.linearRampToValueAtTime(920, now + 0.6);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  async loadModel() {
    if (this.model || this.isModelLoading) return;
    this.isModelLoading = true;
    this.onStatusChange({ status: 'loading', message: 'Loading Neural COCO-SSD Human Detector...' });

    try {
      if (typeof cocoSsd === 'undefined') {
        throw new Error('COCO-SSD script not loaded from CDN yet.');
      }
      this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.isModelReady = true;
      this.isModelLoading = false;
      this.onStatusChange({ status: 'ready', message: 'Neural AI Sentinel Active' });
    } catch (err) {
      console.warn('AI Model load failed or offline, switching to Motion Pixel Sentinel fallback:', err);
      this.isModelLoading = false;
      this.onStatusChange({ status: 'fallback', message: 'Motion Sentinel Active (Pixel Engine)' });
    }
  }

  /**
   * Fast frame differencing to compute motion magnitude %
   */
  computeMotionDelta(video) {
    if (!video || video.readyState < 2) return 0;

    const w = this.diffCanvas.width;
    const h = this.diffCanvas.height;
    this.diffCtx.drawImage(video, 0, 0, w, h);
    const frame = this.diffCtx.getImageData(0, 0, w, h);
    const data = frame.data;
    const len = data.length;

    if (!this.previousFrameData) {
      this.previousFrameData = new Uint8ClampedArray(data);
      return 0;
    }

    let diffCount = 0;
    const totalPixels = len / 4;

    for (let i = 0; i < len; i += 4) {
      // Grayscale luminance difference
      const curr = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const prev = (this.previousFrameData[i] * 0.299 + this.previousFrameData[i + 1] * 0.587 + this.previousFrameData[i + 2] * 0.114);
      if (Math.abs(curr - prev) > this.motionThreshold) {
        diffCount++;
      }
      // Store current frame
      this.previousFrameData[i] = data[i];
      this.previousFrameData[i + 1] = data[i + 1];
      this.previousFrameData[i + 2] = data[i + 2];
    }

    const motionPercent = Math.min(100, (diffCount / totalPixels) * 350);
    this.motionPercent = motionPercent;
    this.onMotionUpdate(motionPercent);
    return motionPercent;
  }

  /**
   * Runs human detection inference & motion tracking
   */
  async detectFrame(video, hudCanvas, camLabel = 'Camera 01') {
    if (!video || video.readyState < 2 || !hudCanvas) return null;

    const ctx = hudCanvas.getContext('2d');
    const width = (hudCanvas.width = video.videoWidth || video.clientWidth || 640);
    const height = (hudCanvas.height = video.videoHeight || video.clientHeight || 480);

    // 1. Calculate real-time motion intensity
    const motionVal = this.computeMotionDelta(video);

    // 2. Clear canvas for fresh overlay
    ctx.clearRect(0, 0, width, height);

    let detectedHumans = [];

    // 3. Neural inference if model is available
    if (this.model && this.isModelReady) {
      try {
        const predictions = await this.model.detect(video);
        detectedHumans = predictions.filter(
          pred => pred.class === 'person' && pred.score >= this.sensitivity
        );
      } catch (err) {
        // Continue with motion
      }
    }

    // 4. Draw Sci-Fi Cybernetic HUD overlays for detected humans
    if (detectedHumans.length > 0) {
      detectedHumans.forEach((human, idx) => {
        const [x, y, w, h] = human.bbox;
        const confPercent = Math.round(human.score * 100);

        this.drawHumanBoundingBox(ctx, x, y, w, h, confPercent, idx + 1);
      });

      // Check alert trigger
      const now = Date.now();
      if (now - this.lastDetectionTime > this.cooldownMs) {
        this.lastDetectionTime = now;

        // Capture snapshot
        const snapshotUrl = this.captureSnapshot(video, hudCanvas);

        // Sound alert
        this.playIntruderAlarm();

        // Trigger surreal cosmic background pulse
        if (typeof window.triggerSurrealShockwave === 'function') {
          window.triggerSurrealShockwave();
        }

        // Notify app
        this.onDetection({
          type: 'HUMAN_DETECTED',
          camLabel,
          count: detectedHumans.length,
          confidence: Math.round(detectedHumans[0].score * 100),
          motionIntensity: Math.round(motionVal),
          timestamp: new Date().toLocaleTimeString(),
          snapshot: snapshotUrl
        });
      }
    } else if (motionVal > 35) {
      // Significant motion without confirmed human bounding box
      const now = Date.now();
      if (now - this.lastDetectionTime > this.cooldownMs) {
        this.lastDetectionTime = now;
        this.playRadarPing();

        const snapshotUrl = this.captureSnapshot(video, hudCanvas);
        this.onDetection({
          type: 'MOTION_DETECTED',
          camLabel,
          count: 0,
          confidence: Math.round(motionVal),
          motionIntensity: Math.round(motionVal),
          timestamp: new Date().toLocaleTimeString(),
          snapshot: snapshotUrl
        });
      }
    }

    return {
      humans: detectedHumans,
      motionPercent: motionVal
    };
  }

  /**
   * Draw cybernetic glass target bracket with corners and status tag
   */
  drawHumanBoundingBox(ctx, x, y, w, h, conf, targetId) {
    ctx.save();

    // 1. Target Bounding Box Glow
    ctx.strokeStyle = 'rgba(255, 42, 95, 0.85)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff2a5f';
    ctx.shadowBlur = 15;

    // Corner brackets length
    const corner = Math.min(w * 0.2, h * 0.2, 28);

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + corner);
    ctx.lineTo(x, y);
    ctx.lineTo(x + corner, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - corner, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + corner);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - corner);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + corner, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - corner, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - corner);
    ctx.stroke();

    // Subtle translucent tint inside target box
    ctx.fillStyle = 'rgba(255, 42, 95, 0.08)';
    ctx.fillRect(x, y, w, h);

    // Center Crosshair
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Target Tag Pill Header
    const tagText = `HUMAN #${targetId} [${conf}%]`;
    ctx.font = '600 11px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(tagText).width;

    ctx.fillStyle = 'rgba(12, 17, 30, 0.9)';
    ctx.fillRect(x, Math.max(0, y - 24), textWidth + 24, 22);

    ctx.strokeStyle = '#ff2a5f';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, Math.max(0, y - 24), textWidth + 24, 22);

    // Red beacon dot
    ctx.fillStyle = '#ff2a5f';
    ctx.beginPath();
    ctx.arc(x + 10, Math.max(0, y - 24) + 11, 4, 0, Math.PI * 2);
    ctx.fill();

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, x + 18, Math.max(0, y - 24) + 15);

    ctx.restore();
  }

  /**
   * Captures snapshot merged with HUD markers
   */
  captureSnapshot(video, hudCanvas) {
    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 480;
      snapCanvas.height = 360;
      const snapCtx = snapCanvas.getContext('2d');

      // Draw video frame
      snapCtx.drawImage(video, 0, 0, 480, 360);

      // Draw HUD overlay scaled
      if (hudCanvas) {
        snapCtx.drawImage(hudCanvas, 0, 0, 480, 360);
      }

      // Add timestamp watermark
      snapCtx.font = '10px "JetBrains Mono", monospace';
      snapCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      snapCtx.fillRect(10, 335, 230, 18);
      snapCtx.fillStyle = '#00f0ff';
      snapCtx.fillText(`ARGUS CCTV // ${new Date().toISOString()}`, 15, 348);

      return snapCanvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn('Snapshot capture failed:', e);
      return '';
    }
  }
}
