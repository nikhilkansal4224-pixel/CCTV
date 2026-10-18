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

window.RTC_CONFIG = RTC_CONFIG;
window.getWebSocketUrl = getWebSocketUrl;
window.showToast = showToast;
window.RTCStatsMonitor = RTCStatsMonitor;
