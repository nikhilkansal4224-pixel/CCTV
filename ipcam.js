// SENTINEL // Phone as Dummy CCTV & IP Camera Integration Engine
// Provides network discovery, subnet probing, credential verification, and MJPEG stream proxying.
// Supports ANY IP, Hostname, DDNS, Cloud Tunnel, HTTP/HTTPS, and local subnets.

const http = require('http');
const https = require('https');
const net = require('net');
const os = require('os');
const crypto = require('crypto');

// Standard camera ports (IP Webcam, IP Camera Lite, DroidCam, Python YOLO, ESP32, Generic MJPEG)
const COMMON_CAMERA_PORTS = [8080, 8081, 8088, 4747, 8000, 80, 5000, 8888, 8082, 8090, 8443, 443];

// Common video and snapshot probe paths
const STREAM_PROBE_PATHS = ['/video', '/videofeed', '/mjpeg', '/live.jpg', '/mjpegfeed', '/'];
const SNAPSHOT_PROBE_PATHS = ['/shot.jpg', '/snapshot.jpg', '/photo.jpg', '/image.jpg', '/capture'];

/**
 * Universal Target Parser: Accepts ANY IP, Hostname, DDNS, ngrok/tunnel, or full URL
 * Examples:
 *   - '192.168.1.50' -> http://192.168.1.50:8080/video
 *   - 'mycamera.ddns.net:8080' -> http://mycamera.ddns.net:8080/video
 *   - 'https://remote-cctv.com:8443/mjpeg' -> https://remote-cctv.com:8443/mjpeg
 *   - 'admin:secret@192.168.1.10:8081/live.jpg' -> http://192.168.1.10:8081/live.jpg (auth preserved)
 */
function parseCameraTarget(params = {}) {
  let raw = '';
  let portParam = null;
  let pathParam = '';
  let userParam = '';
  let passParam = '';

  if (typeof params === 'string') {
    raw = params.trim();
  } else if (params && typeof params === 'object') {
    raw = String(params.ip || params.target || params.url || '').trim();
    portParam = params.port ? Number(params.port) : null;
    pathParam = params.path ? String(params.path).trim() : '';
    userParam = params.user || params.username || '';
    passParam = params.pass || params.password || '';
  }

  let protocol = 'http:';
  let host = '';
  let port = portParam;
  let targetPath = pathParam;
  let username = userParam;
  let password = passParam;

  // 1. Detect URL scheme
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      protocol = u.protocol.toLowerCase();
      host = u.hostname;
      if (u.port) port = Number(u.port);
      if (u.pathname && u.pathname !== '/') {
        targetPath = u.pathname + (u.search || '');
      }
      if (u.username) username = decodeURIComponent(u.username);
      if (u.password) password = decodeURIComponent(u.password);
    } catch (e) {
      raw = raw.replace(/^https?:\/\//i, '');
    }
  }

  // 2. Parse inline auth: user:pass@host
  if (!host && raw.includes('@')) {
    const atIdx = raw.lastIndexOf('@');
    const authPart = raw.slice(0, atIdx);
    raw = raw.slice(atIdx + 1);
    const colonIdx = authPart.indexOf(':');
    if (colonIdx !== -1) {
      if (!username) username = decodeURIComponent(authPart.slice(0, colonIdx));
      if (!password) password = decodeURIComponent(authPart.slice(colonIdx + 1));
    } else {
      if (!username) username = decodeURIComponent(authPart);
    }
  }

  // 3. Parse path from host if present: host/path
  if (!host) {
    const slashIdx = raw.indexOf('/');
    if (slashIdx !== -1) {
      if (!targetPath) targetPath = raw.slice(slashIdx);
      raw = raw.slice(0, slashIdx);
    }

    // 4. Parse port: host:port (handling IPv6 brackets if any)
    const colonIdx = raw.lastIndexOf(':');
    if (colonIdx !== -1 && !raw.includes(']')) {
      const p = Number(raw.slice(colonIdx + 1));
      if (!isNaN(p) && p > 0 && p <= 65535) {
        if (!port) port = p;
        raw = raw.slice(0, colonIdx);
      }
    }

    host = raw.trim();
  }

  // Auto-switch protocol to https if port is 443 or 8443 and protocol wasn't explicitly set
  if ((port === 443 || port === 8443) && protocol === 'http:') {
    protocol = 'https:';
  }

  // Default port based on protocol
  if (!port) {
    port = protocol === 'https:' ? 443 : 8080;
  }

  // Default stream path
  if (!targetPath || targetPath === '/') {
    targetPath = port === 4747 ? '/video' : (port === 8081 ? '/live.jpg' : '/video');
  }

  // Clean brackets from IPv6 host if needed
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }

  return {
    protocol,
    host: host || '127.0.0.1',
    port,
    path: targetPath,
    username,
    password,
    isHttps: protocol === 'https:',
    fullUrl: `${protocol}//${host || '127.0.0.1'}:${port}${targetPath}`,
  };
}

/**
 * Discover local IPv4 subnets from all network interfaces
 */
function getLocalSubnets() {
  const subnets = [];
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const netInfo of interfaces[name]) {
      if ((netInfo.family === 'IPv4' || netInfo.family === 4) && !netInfo.internal) {
        const parts = netInfo.address.split('.');
        if (parts.length === 4) {
          const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
          if (!subnets.includes(prefix)) {
            subnets.push(prefix);
          }
        }
      }
    }
  }

  // Fallback to standard private subnet if none found
  if (subnets.length === 0) {
    subnets.push('192.168.1');
  }

  return subnets;
}

/**
 * Fast TCP probe to check if a specific port is open on a host
 */
function probeTcpPort(host, port, timeoutMs = 300) {
  return new Promise((resolve) => {
    let responded = false;
    const socket = new net.Socket();
    socket.setNoDelay(true);
    socket.unref();

    const finish = (isOpen) => {
      if (!responded) {
        responded = true;
        try {
          socket.destroy();
        } catch (e) {}
        resolve(isOpen);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => finish(true));
    socket.on('timeout', () => finish(false));
    socket.on('error', () => finish(false));

    try {
      socket.connect(port, host);
    } catch (e) {
      finish(false);
    }
  });
}

/**
 * Make an HTTP/HTTPS probe to check for IP Camera signature and verify credentials
 */
function probeCameraHttp(host, port, username, password, timeoutMs = 1200, isHttps = false) {
  return new Promise((resolve) => {
    const authHeader = (username || password)
      ? 'Basic ' + Buffer.from(`${username || ''}:${password || ''}`).toString('base64')
      : undefined;

    const probeClient = isHttps ? https : http;
    const headers = {
      'User-Agent': 'Sentinel-CCTV-Gateway/2.0',
      'Accept': 'text/html,application/json,image/*,*/*',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const req = probeClient.request(
      {
        host,
        port,
        path: '/status.json',
        method: 'GET',
        headers,
        timeout: timeoutMs,
        rejectUnauthorized: false, // Allow self-signed SSL on local/DDNS cameras
      },
      (res) => {
        let rawBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          if (rawBody.length < 2048) rawBody += chunk;
        });

        res.on('end', () => {
          const serverHeader = (res.headers['server'] || '').toLowerCase();
          const contentType = (res.headers['content-type'] || '').toLowerCase();
          const authRequired = res.statusCode === 401;
          const authSuccess = res.statusCode >= 200 && res.statusCode < 300;

          let isIpCam = false;
          let appBrand = 'IP Camera';
          let streamPath = '/video';
          let snapshotPath = '/shot.jpg';

          if (rawBody.includes('YOLO') || port === 8088 || serverHeader.includes('yolo')) {
            isIpCam = true;
            appBrand = 'Sentinel YOLOv8 AI Camera';
            streamPath = '/video';
            snapshotPath = '/shot.jpg';
          } else if (serverHeader.includes('ip webcam') || rawBody.includes('IP Webcam') || rawBody.includes('cur_video')) {
            isIpCam = true;
            appBrand = 'IP Webcam (Android)';
            streamPath = '/video';
            snapshotPath = '/shot.jpg';
          } else if (serverHeader.includes('droidcam') || port === 4747) {
            isIpCam = true;
            appBrand = 'DroidCam';
            streamPath = '/video';
            snapshotPath = '/shot.jpg';
          } else if (port === 8081 || rawBody.includes('MJPEG') || contentType.includes('image') || contentType.includes('mixed-replace')) {
            isIpCam = true;
            appBrand = 'IP Camera Lite (iOS)';
            streamPath = '/live.jpg';
            snapshotPath = '/snapshot.jpg';
          } else if (rawBody.includes('esp32') || serverHeader.includes('esp32')) {
            isIpCam = true;
            appBrand = 'ESP32-CAM Stream';
            streamPath = ':81/stream';
            snapshotPath = '/capture';
          } else if (authRequired || authSuccess || res.statusCode === 200) {
            isIpCam = true;
            appBrand = isHttps ? 'Secure IP Camera (HTTPS)' : 'Generic IP Camera';
            streamPath = port === 8081 ? '/live.jpg' : '/video';
            snapshotPath = '/shot.jpg';
          }

          resolve({
            host,
            port,
            protocol: isHttps ? 'https:' : 'http:',
            isIpCam,
            appBrand,
            streamPath,
            snapshotPath,
            statusCode: res.statusCode,
            authRequired,
            authSuccess,
            serverHeader,
            contentType,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.on('error', () => {
      // If HTTP failed on port 443/8443, try HTTPS fallback
      if (!isHttps && (port === 443 || port === 8443 || port === 8080)) {
        probeCameraHttp(host, port, username, password, timeoutMs, true).then(resolve);
      } else {
        resolve(null);
      }
    });

    req.end();
  });
}

/**
 * Scan the network to locate cameras via IP, Hostname, or Subnet sweep
 */
async function scanNetwork({ username, password, targetIp, port, subnet, timeoutMs = 400 }) {
  const discovered = [];

  // 1. If user provided a specific Target IP / Hostname / Stream URL
  if (targetIp && String(targetIp).trim().length > 0) {
    const target = parseCameraTarget({
      ip: targetIp,
      port,
      user: username,
      pass: password,
    });

    const portsToScan = port ? [Number(port)] : (target.port ? [target.port] : [8080, 8081, 8088, 4747, 8000, 80, 8443, 443]);

    for (const p of portsToScan) {
      const tcpOpen = await probeTcpPort(target.host, p, timeoutMs);
      if (tcpOpen) {
        const httpResult = await probeCameraHttp(target.host, p, target.username, target.password, 1200, target.isHttps || p === 443 || p === 8443);
        if (httpResult) {
          discovered.push({
            ip: target.host,
            port: p,
            protocol: httpResult.protocol || target.protocol,
            streamPath: target.path !== '/video' ? target.path : httpResult.streamPath,
            snapshotPath: httpResult.snapshotPath || '/shot.jpg',
            name: `${httpResult.appBrand} [${target.host}:${p}]`,
            authStatus: httpResult.authSuccess ? 'authenticated' : (httpResult.authRequired ? 'unauthorized' : 'open'),
            brand: httpResult.appBrand,
            url: `${httpResult.protocol || target.protocol}//${target.host}:${p}${target.path || httpResult.streamPath}`,
          });
        }
      }
    }

    return {
      success: true,
      mode: 'targeted',
      scannedCount: portsToScan.length,
      cameras: discovered,
    };
  }

  // 2. High-Speed Subnet Multi-Port Auto-Scan
  const subnets = subnet ? [subnet] : getLocalSubnets();
  const candidateHosts = [];

  // Scan all discovered subnets (Wi-Fi, hotspot, tethering)
  for (const sub of subnets) {
    for (let i = 1; i <= 254; i++) {
      candidateHosts.push(`${sub}.${i}`);
    }
  }

  // Include localhost & loopback
  candidateHosts.unshift('127.0.0.1');

  // Candidate camera ports for zero-configuration broad auto-scan
  const portsToProbe = port ? [Number(port)] : [8080, 8081, 8088, 4747, 8000];

  // Batch probe candidates with high concurrency
  const BATCH_SIZE = 60;
  for (let i = 0; i < candidateHosts.length; i += BATCH_SIZE) {
    const chunk = candidateHosts.slice(i, i + BATCH_SIZE);
    const probes = chunk.map(async (host) => {
      for (const p of portsToProbe) {
        const isOpen = await probeTcpPort(host, p, timeoutMs);
        if (isOpen) {
          const httpInfo = await probeCameraHttp(host, p, username, password, 1000);
          if (httpInfo && httpInfo.isIpCam) {
            discovered.push({
              ip: host,
              port: p,
              protocol: httpInfo.protocol || 'http:',
              streamPath: httpInfo.streamPath,
              snapshotPath: httpInfo.snapshotPath,
              name: `${httpInfo.appBrand} [${host}:${p}]`,
              authStatus: httpInfo.authSuccess ? 'authenticated' : (httpInfo.authRequired ? 'unauthorized' : 'open'),
              brand: httpInfo.appBrand,
              url: `http://${host}:${p}${httpInfo.streamPath}`,
            });
            break; // Found camera on this host, move to next
          }
        }
      }
    });

    await Promise.all(probes);
  }

  return {
    success: true,
    mode: 'auto_scan',
    subnetsScanned: subnets,
    portsScanned: portsToProbe,
    scannedCount: candidateHosts.length,
    cameras: discovered,
  };
}

/**
 * Proxy live video stream from ANY IP, Hostname, or URL (HTTP or HTTPS) to browser
 */
function proxyStream(req, res) {
  const { ip, port, path: streamPath, user, pass } = req.query;

  if (!ip) {
    return res.status(400).send('Missing required ip parameter');
  }

  const target = parseCameraTarget({
    ip,
    port,
    path: streamPath,
    user,
    pass,
  });

  const authHeader = (target.username || target.password)
    ? 'Basic ' + Buffer.from(`${target.username}:${target.password}`).toString('base64')
    : undefined;

  const headers = {
    'User-Agent': 'Sentinel-CCTV-Gateway/2.0',
    'Accept': 'multipart/x-mixed-replace, image/jpeg, image/*, */*',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const client = target.isHttps ? https : http;

  const upstreamReq = client.request(
    {
      host: target.host,
      port: target.port,
      path: target.path,
      method: 'GET',
      headers,
      timeout: 10000,
      rejectUnauthorized: false, // Allow self-signed SSL on local IP cams / DDNS
    },
    (upstreamRes) => {
      if (upstreamRes.statusCode === 401) {
        return res.status(401).json({
          error: 'Authentication failed. Please verify the CCTV ID and Password.',
        });
      }

      if (upstreamRes.statusCode >= 400) {
        return res.status(upstreamRes.statusCode).json({
          error: `Upstream camera returned HTTP ${upstreamRes.statusCode}`,
        });
      }

      // Relay stream headers
      const contentType = upstreamRes.headers['content-type'] || 'multipart/x-mixed-replace; boundary=--jpgboundary';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate, pre-check=0, post-check=0, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Connection': 'close',
        'Access-Control-Allow-Origin': '*',
      });

      upstreamRes.pipe(res);

      upstreamRes.on('error', (err) => {
        console.warn(`[IPCam Proxy] Stream pipe error (${target.host}:${target.port}):`, err.message);
        try {
          res.end();
        } catch (e) {}
      });
    }
  );

  upstreamReq.on('timeout', () => {
    upstreamReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: `Connection to camera at ${target.host}:${target.port} timed out` });
    }
  });

  upstreamReq.on('error', (err) => {
    console.warn(`[IPCam Proxy] Upstream request error (${target.host}:${target.port}):`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: `Cannot reach camera at ${target.host}:${target.port}: ${err.message}` });
    }
  });

  req.on('close', () => {
    upstreamReq.destroy();
  });

  upstreamReq.end();
}

/**
 * Proxy a single snapshot frame from ANY IP or URL
 */
function proxySnapshot(req, res) {
  const { ip, port, path: snapPath, user, pass } = req.query;

  if (!ip) {
    return res.status(400).send('Missing required ip parameter');
  }

  const target = parseCameraTarget({
    ip,
    port,
    path: snapPath || '/shot.jpg',
    user,
    pass,
  });

  const authHeader = (target.username || target.password)
    ? 'Basic ' + Buffer.from(`${target.username}:${target.password}`).toString('base64')
    : undefined;

  const headers = {
    'User-Agent': 'Sentinel-CCTV-Gateway/2.0',
    'Accept': 'image/jpeg, image/*, */*',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const client = target.isHttps ? https : http;

  const upstreamReq = client.request(
    {
      host: target.host,
      port: target.port,
      path: target.path,
      method: 'GET',
      headers,
      timeout: 6000,
      rejectUnauthorized: false,
    },
    (upstreamRes) => {
      if (upstreamRes.statusCode === 401) {
        return res.status(401).json({ error: 'Authentication failed for snapshot' });
      }

      res.writeHead(200, {
        'Content-Type': upstreamRes.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
      });

      upstreamRes.pipe(res);
    }
  );

  upstreamReq.on('timeout', () => {
    upstreamReq.destroy();
    if (!res.headersSent) res.status(504).send('Snapshot request timed out');
  });

  upstreamReq.on('error', (err) => {
    if (!res.headersSent) res.status(502).send(`Error: ${err.message}`);
  });

  upstreamReq.end();
}

/**
 * Synthetic / Mock Live MJPEG Feed generator for offline testing and verification
 */
function createMockMjpegStream(req, res, user = 'admin') {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--frameboundary',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'close',
    'Access-Control-Allow-Origin': '*',
  });

  // Minimal valid 1x1 JPEG frame
  const sampleJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x80, 0xff, 0xd9
  ]);

  const interval = setInterval(() => {
    try {
      res.write(`--frameboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${sampleJpeg.length}\r\n\r\n`);
      res.write(sampleJpeg);
      res.write('\r\n');
    } catch (e) {
      clearInterval(interval);
    }
  }, 200);

  req.on('close', () => {
    clearInterval(interval);
  });
}

module.exports = {
  parseCameraTarget,
  scanNetwork,
  proxyStream,
  proxySnapshot,
  createMockMjpegStream,
  getLocalSubnets,
  COMMON_CAMERA_PORTS,
};
