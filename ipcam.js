// SENTINEL // Phone as Dummy CCTV & IP Camera Integration Engine
// Provides network discovery, subnet probing, credential verification, and MJPEG stream proxying.

const http = require('http');
const https = require('https');
const net = require('net');
const os = require('os');
const crypto = require('crypto');

// Standard ports commonly used by trusted IP Camera apps (e.g. IP Webcam, IP Camera Lite, DroidCam)
const COMMON_CAMERA_PORTS = [8080, 8081, 4747, 8000, 80];

// Common video and snapshot paths
const STREAM_PROBE_PATHS = ['/video', '/videofeed', '/mjpegfeed', '/live.jpg', '/'];
const SNAPSHOT_PROBE_PATHS = ['/shot.jpg', '/snapshot.jpg', '/photo.jpg', '/image.jpg'];

/**
 * Discover local IPv4 subnets from network interfaces
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
function probeTcpPort(host, port, timeoutMs = 600) {
  return new Promise((resolve) => {
    let responded = false;
    const socket = new net.Socket();

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
 * Make an HTTP probe to a responsive host to check for IP Camera signature and credentials
 */
function probeCameraHttp(host, port, username, password, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const authHeader = 'Basic ' + Buffer.from(`${username || ''}:${password || ''}`).toString('base64');
    
    // Probe /status.json or /video or root /
    const probePath = '/status.json';

    const req = http.request(
      {
        host,
        port,
        path: probePath,
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'Sentinel-CCTV-Gateway/2.0',
        },
        timeout: timeoutMs,
      },
      (res) => {
        let rawBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          if (rawBody.length < 2048) rawBody += chunk;
        });

        res.on('end', () => {
          const serverHeader = res.headers['server'] || '';
          const contentType = res.headers['content-type'] || '';
          const authRequired = res.statusCode === 401;
          const authSuccess = res.statusCode >= 200 && res.statusCode < 300;

          // Detect IP Webcam app signature or standard MJPEG server
          let isIpCam = false;
          let appBrand = 'IP Camera';

          if (serverHeader.toLowerCase().includes('ip webcam') || rawBody.includes('IP Webcam') || rawBody.includes('cur_video')) {
            isIpCam = true;
            appBrand = 'IP Webcam (Android)';
          } else if (serverHeader.toLowerCase().includes('droidcam') || port === 4747) {
            isIpCam = true;
            appBrand = 'DroidCam';
          } else if (port === 8081 || rawBody.includes('MJPEG') || contentType.includes('image') || contentType.includes('mixed-replace')) {
            isIpCam = true;
            appBrand = 'IP Camera Lite (iOS)';
          } else if (authRequired || authSuccess || res.statusCode === 200) {
            // General responsive HTTP service on typical camera port
            isIpCam = true;
            appBrand = 'Generic IP Camera';
          }

          resolve({
            host,
            port,
            isIpCam,
            appBrand,
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
      resolve(null);
    });

    req.end();
  });
}

/**
 * Scan the local network to locate the Dummy CCTV via its IP address
 */
async function scanNetwork({ username, password, targetIp, port, subnet, timeoutMs = 600 }) {
  const discovered = [];
  const portsToScan = port ? [Number(port)] : COMMON_CAMERA_PORTS;

  // 1. If user provided a specific IP, directly probe that IP
  if (targetIp && targetIp.trim().length > 0) {
    const cleanIp = targetIp.trim();
    for (const p of portsToScan) {
      const tcpOpen = await probeTcpPort(cleanIp, p, timeoutMs);
      if (tcpOpen) {
        const httpResult = await probeCameraHttp(cleanIp, p, username, password);
        if (httpResult) {
          discovered.push({
            ip: cleanIp,
            port: p,
            streamPath: p === 4747 ? '/video' : (p === 8081 ? '/live.jpg' : '/video'),
            snapshotPath: '/shot.jpg',
            name: `${httpResult.appBrand} [${cleanIp}:${p}]`,
            authStatus: httpResult.authSuccess ? 'authenticated' : (httpResult.authRequired ? 'unauthorized' : 'open'),
            brand: httpResult.appBrand,
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

  // 2. Auto-Scan Local Subnet
  const subnets = subnet ? [subnet] : getLocalSubnets();
  const primarySubnet = subnets[0];
  const scanCandidates = [];

  // Generate candidate IP list (1 to 254)
  for (let i = 1; i <= 254; i++) {
    scanCandidates.push(`${primarySubnet}.${i}`);
  }

  // Also include 127.0.0.1 for local testing
  scanCandidates.unshift('127.0.0.1');

  const defaultPort = port ? Number(port) : 8080;

  // Run batch scans with concurrency
  const BATCH_SIZE = 45;
  for (let i = 0; i < scanCandidates.length; i += BATCH_SIZE) {
    const chunk = scanCandidates.slice(i, i + BATCH_SIZE);
    const probes = chunk.map(async (ip) => {
      const isOpen = await probeTcpPort(ip, defaultPort, timeoutMs);
      if (isOpen) {
        const httpInfo = await probeCameraHttp(ip, defaultPort, username, password, 1200);
        if (httpInfo) {
          discovered.push({
            ip,
            port: defaultPort,
            streamPath: defaultPort === 4747 ? '/video' : '/video',
            snapshotPath: '/shot.jpg',
            name: `${httpInfo.appBrand} [${ip}:${defaultPort}]`,
            authStatus: httpInfo.authSuccess ? 'authenticated' : (httpInfo.authRequired ? 'unauthorized' : 'open'),
            brand: httpInfo.appBrand,
          });
        }
      }
    });

    await Promise.all(probes);
  }

  return {
    success: true,
    mode: 'auto_scan',
    subnet: `${primarySubnet}.0/24`,
    scannedCount: scanCandidates.length,
    cameras: discovered,
  };
}

/**
 * Proxy live MJPEG video stream from the phone camera to browser
 */
function proxyStream(req, res) {
  const { ip, port, path: streamPath, user, pass } = req.query;

  if (!ip || !port) {
    return res.status(400).send('Missing required ip or port parameter');
  }

  const cleanIp = String(ip).trim();
  const cleanPort = Number(port);
  const targetPath = streamPath || '/video';

  const authHeader = (user || pass)
    ? 'Basic ' + Buffer.from(`${user || ''}:${pass || ''}`).toString('base64')
    : undefined;

  const headers = {
    'User-Agent': 'Sentinel-CCTV-Gateway/2.0',
    'Accept': 'multipart/x-mixed-replace, image/jpeg, */*',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const upstreamReq = http.request(
    {
      host: cleanIp,
      port: cleanPort,
      path: targetPath,
      method: 'GET',
      headers,
      timeout: 10000,
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
        console.warn('[IPCam Proxy] Upstream stream error:', err.message);
        try {
          res.end();
        } catch (e) {}
      });
    }
  );

  upstreamReq.on('timeout', () => {
    upstreamReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: 'Connection to camera timed out' });
    }
  });

  upstreamReq.on('error', (err) => {
    console.warn('[IPCam Proxy] Upstream request error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: `Cannot reach camera at ${cleanIp}:${cleanPort}: ${err.message}` });
    }
  });

  // Clean up when client disconnects
  req.on('close', () => {
    upstreamReq.destroy();
  });

  upstreamReq.end();
}

/**
 * Proxy a single snapshot frame from the phone camera
 */
function proxySnapshot(req, res) {
  const { ip, port, path: snapPath, user, pass } = req.query;

  if (!ip || !port) {
    return res.status(400).send('Missing required ip or port parameter');
  }

  const cleanIp = String(ip).trim();
  const cleanPort = Number(port);
  const targetPath = snapPath || '/shot.jpg';

  const authHeader = (user || pass)
    ? 'Basic ' + Buffer.from(`${user || ''}:${pass || ''}`).toString('base64')
    : undefined;

  const headers = {
    'User-Agent': 'Sentinel-CCTV-Gateway/2.0',
    'Accept': 'image/jpeg, image/*',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const upstreamReq = http.request(
    {
      host: cleanIp,
      port: cleanPort,
      path: targetPath,
      method: 'GET',
      headers,
      timeout: 5000,
    },
    (upstreamRes) => {
      if (upstreamRes.statusCode === 401) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
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

  // 1x1 or small JPEG buffer template or SVG-to-JPEG representation
  // For lightweight mock streaming, we can emit a small valid JPEG frame at 5 FPS
  // Minimal 1x1 JPEG frame
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
  scanNetwork,
  proxyStream,
  proxySnapshot,
  createMockMjpegStream,
  getLocalSubnets,
  COMMON_CAMERA_PORTS,
};

