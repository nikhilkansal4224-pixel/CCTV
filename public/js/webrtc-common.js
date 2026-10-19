// SENTINEL // WebRTC Shared Utilities

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

function showToast(message, duration = 3000) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Telemetry monitor for WebRTC stats
class RTCStatsMonitor {
  constructor(peerConnection, onStatsUpdate) {
    this.pc = peerConnection;
    this.onStatsUpdate = onStatsUpdate;
    this.intervalId = null;
    this.prevBytesReceived = 0;
    this.prevTimestamp = 0;
  }

  start() {
    this.stop();
    this.intervalId = setInterval(async () => {
      if (!this.pc || this.pc.connectionState !== 'connected') return;

      try {
        const stats = await this.pc.getStats();
        let fps = 0;
        let bitrate = 0;
        let width = 0;
        let height = 0;
        let rtt = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            fps = report.framesPerSecond || 0;
            width = report.frameWidth || 0;
            height = report.frameHeight || 0;

            const now = report.timestamp;
            const bytes = report.bytesReceived;
            if (this.prevTimestamp > 0) {
              const deltaMs = now - this.prevTimestamp;
              const deltaBytes = bytes - this.prevBytesReceived;
              bitrate = Math.round((deltaBytes * 8) / (deltaMs / 1000) / 1000); // kbps
            }
            this.prevBytesReceived = bytes;
            this.prevTimestamp = now;
          }

          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = Math.round((report.currentRoundTripTime || 0) * 1000); // ms
          }
        });

        if (this.onStatsUpdate) {
          this.onStatsUpdate({ fps, bitrate, width, height, rtt });
        }
      } catch (e) {
        // Stats error or peer closed
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Cyber Audio Synthesizer (Zero-dependency Web Audio API)
class SentinelAudio {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('sentinel_audio_enabled') !== 'false';
  }

  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('sentinel_audio_enabled', this.enabled ? 'true' : 'false');
    if (this.enabled) this.play('click');
    return this.enabled;
  }

  play(type) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'connect') {
        // Futuristic two-tone rising chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'disconnect') {
        // Descending power-off tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'snapshot') {
        // Crisp camera shutter sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'record') {
        // Pulse blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        // Subtle UI click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      // Audio autoplay policy or non-supported context
    }
  }
}

// Universal Signaling Channel:
// Primary: WebSocket (Node.js, Docker, Render, VPS)
// Fallback: HTTP Long-Polling (Vercel Serverless where long-lived WebSockets are prohibited)
class UniversalSignalingChannel {
  constructor({ sessionId, role, deviceId, deviceName }) {
    this.sessionId = sessionId;
    this.role = role; // 'host' | 'camera'
    this.deviceId = deviceId || '';
    this.deviceName = deviceName || '';
    this.mode = 'connecting'; // 'ws' | 'http' | 'closed'
    this.readyState = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED

    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;

    this.ws = null;
    this.pollInterval = null;
    this.lastPollTimestamp = Date.now();
    this.isClosed = false;

    this._init();
  }

  _init() {
    // Attempt standard WebSocket first
    const wsUrl = getWebSocketUrl();
    let wsConnected = false;
    let wsConnectTimeout = null;

    try {
      this.ws = new WebSocket(wsUrl);

      wsConnectTimeout = setTimeout(() => {
        if (!wsConnected && !this.isClosed) {
          console.warn('[Signaling] WebSocket timeout, falling back to HTTP serverless signaling');
          this._fallbackToHttp();
        }
      }, 3500);

      this.ws.onopen = () => {
        wsConnected = true;
        clearTimeout(wsConnectTimeout);
        this.mode = 'ws';
        this.readyState = 1;
        console.log('[Signaling] Connected via WebSocket transport');
        if (this.onopen) this.onopen();
      };

      this.ws.onmessage = (event) => {
        if (this.onmessage) this.onmessage(event);
      };

      this.ws.onerror = (err) => {
        if (!wsConnected) {
          clearTimeout(wsConnectTimeout);
          console.warn('[Signaling] WebSocket error during handshake, falling back to HTTP polling:', err);
          this._fallbackToHttp();
        } else if (this.onerror) {
          this.onerror(err);
        }
      };

      this.ws.onclose = () => {
        if (wsConnected) {
          this.readyState = 3;
          if (this.onclose) this.onclose();
        }
      };
    } catch (err) {
      console.warn('[Signaling] WebSocket creation failed, falling back to HTTP:', err);
      this._fallbackToHttp();
    }
  }

  _fallbackToHttp() {
    if (this.mode === 'http' || this.isClosed) return;
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    this.mode = 'http';
    this.readyState = 1; // Mark as open for HTTP fallback
    console.log('[Signaling] Activated HTTP serverless signaling (Vercel-compatible)');

    if (this.onopen) {
      this.onopen();
    }

    // Start polling loop
    this.pollInterval = setInterval(() => this._pollMessages(), 800);
    this._pollMessages();
  }

  async _pollMessages() {
    if (this.isClosed || this.mode !== 'http') return;
    try {
      const q = new URLSearchParams({
        sessionId: this.sessionId,
        role: this.role,
        deviceId: this.deviceId,
        since: this.lastPollTimestamp.toString(),
      });
      const res = await fetch(`/api/signaling/poll?${q.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.lastTimestamp) {
        this.lastPollTimestamp = Math.max(this.lastPollTimestamp, data.lastTimestamp);
      }

      if (data.messages && Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          if (this.onmessage) {
            this.onmessage({ data: JSON.stringify(msg) });
          }
        }
      }
    } catch (e) {
      // Network hiccup
    }
  }

  send(data) {
    if (this.isClosed) return;

    if (this.mode === 'ws' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return;
    }

    // HTTP signaling delivery
    let parsed = data;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        parsed = { text: data };
      }
    }

    let target = 'all';
    if (this.role === 'camera') {
      target = 'host';
    } else if (this.role === 'host') {
      target = parsed.deviceId || 'all';
    }

    fetch('/api/signaling/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        sender: this.deviceId || this.role,
        target,
        message: parsed,
      }),
    }).catch(err => {
      console.warn('[Signaling] HTTP send error:', err);
    });
  }

  close() {
    this.isClosed = true;
    this.readyState = 3;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    if (this.onclose) this.onclose();
  }
}

const sentinelAudio = new SentinelAudio();

window.RTC_CONFIG = RTC_CONFIG;
window.getWebSocketUrl = getWebSocketUrl;
window.showToast = showToast;
window.RTCStatsMonitor = RTCStatsMonitor;
window.sentinelAudio = sentinelAudio;
window.UniversalSignalingChannel = UniversalSignalingChannel;


