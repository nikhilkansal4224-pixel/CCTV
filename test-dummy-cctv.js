// SENTINEL // Phone as Dummy CCTV & IP Camera Integration Test Suite

const { EventEmitter } = require('events');
const ipcam = require('./ipcam');

class MockRequest extends EventEmitter {
  constructor(query = {}, headers = {}) {
    super();
    this.query = query;
    this.headers = headers;
    this.method = 'GET';
  }
}

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
    this.headersSent = false;
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
    this.headersSent = true;
    return this;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  send(data) {
    this.body = data;
    this.emit('finish');
    return this;
  }

  json(data) {
    this.body = data;
    this.emit('finish');
    return this;
  }

  write(chunk) {
    this.chunks.push(chunk);
    this.emit('data', chunk);
    return true;
  }

  end(data) {
    if (data) this.chunks.push(data);
    this.emit('finish');
    return this;
  }
}

async function runTestSuite() {
  console.log('======================================================');
  console.log('  SENTINEL: PHONE AS DUMMY CCTV TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. LOCAL SUBNET DISCOVERY ---
  console.log('[1/4] Testing Subnet Discovery Engine...');
  const subnets = ipcam.getLocalSubnets();
  assert(Array.isArray(subnets) && subnets.length > 0, `Discovered active subnets: ${subnets.join(', ')}`);
  assert(subnets.every(s => /^\d+\.\d+\.\d+$/.test(s)), 'Subnet format is valid 3-octet prefix (e.g. 192.168.1)');

  // --- 2. NETWORK SCANNER MODULE ---
  console.log('\n[2/4] Testing Network Scanner & Probe Engine...');
  const scanResult = await ipcam.scanNetwork({
    username: 'admin',
    password: 'password123',
    targetIp: '127.0.0.1',
    port: 8080,
    timeoutMs: 100,
  });

  assert(scanResult.success === true, 'scanNetwork completed without throwing');
  assert(scanResult.mode === 'targeted', 'Recognized targeted IP scan mode');
  assert(Array.isArray(scanResult.cameras), 'Returns cameras array');

  // --- 3. MOCK STREAM GENERATOR & PROXY VALIDATION ---
  console.log('\n[3/4] Testing Stream Proxy & Validation Logic...');

  // Test 3.1: Missing IP / Port returns 400
  const badReq = new MockRequest({}, {});
  const badRes = new MockResponse();
  ipcam.proxyStream(badReq, badRes);
  assert(badRes.statusCode === 400, 'proxyStream returns 400 when IP or Port is missing');

  // Test 3.2: Missing IP / Port on snapshot returns 400
  const badSnapReq = new MockRequest({}, {});
  const badSnapRes = new MockResponse();
  ipcam.proxySnapshot(badSnapReq, badSnapRes);
  assert(badSnapRes.statusCode === 400, 'proxySnapshot returns 400 when IP or Port is missing');

  // Test 3.3: Mock MJPEG stream emits multipart headers and frames
  const streamReq = new MockRequest({}, {});
  const streamRes = new MockResponse();
  ipcam.createMockMjpegStream(streamReq, streamRes, 'testOperator');
  assert(streamRes.statusCode === 200, 'Mock MJPEG stream starts with 200 status');
  const contentType = streamRes.headers['Content-Type'] || '';
  assert(contentType.includes('multipart/x-mixed-replace'), `Content-Type contains multipart/x-mixed-replace (${contentType})`);

  // Wait for at least one frame chunk to be written
  await new Promise((resolve) => {
    streamRes.once('data', () => {
      assert(streamRes.chunks.length > 0, `Mock stream successfully produced frame data (${streamRes.chunks.length} chunks)`);
      streamReq.emit('close'); // clean up interval
      resolve();
    });
  });

  // --- 4. VERIFY CAMERA PORT CONSTANTS & PROFILES ---
  console.log('\n[4/5] Testing IP Camera Ports & App Profiles...');
  assert(ipcam.COMMON_CAMERA_PORTS.includes(8080), 'Includes port 8080 (IP Webcam on Android)');
  assert(ipcam.COMMON_CAMERA_PORTS.includes(8081), 'Includes port 8081 (IP Camera Lite on iOS)');
  assert(ipcam.COMMON_CAMERA_PORTS.includes(4747), 'Includes port 4747 (DroidCam)');
  assert(ipcam.COMMON_CAMERA_PORTS.includes(8088), 'Includes port 8088 (Sentinel YOLO Stream)');
  assert(ipcam.COMMON_CAMERA_PORTS.includes(8443), 'Includes port 8443 (Secure SSL Camera)');

  // --- 5. UNIVERSAL TARGET PARSER (ANY IP / WAN / DDNS / URL) ---
  console.log('\n[5/5] Testing Universal Target Parser (Any IP / WAN / DDNS / URL)...');
  const t1 = ipcam.parseCameraTarget('192.168.1.50');
  assert(t1.host === '192.168.1.50' && t1.port === 8080 && t1.protocol === 'http:', 'Parses plain LAN IP correctly');

  const t2 = ipcam.parseCameraTarget('mycamera.ddns.net:8082');
  assert(t2.host === 'mycamera.ddns.net' && t2.port === 8082 && t2.protocol === 'http:', 'Parses WAN DDNS host and port');

  const t3 = ipcam.parseCameraTarget('https://cctv.cloudproxy.com:8443/mjpeg');
  assert(t3.host === 'cctv.cloudproxy.com' && t3.port === 8443 && t3.protocol === 'https:' && t3.path === '/mjpeg', 'Parses HTTPS secure cloud stream URL');

  const t4 = ipcam.parseCameraTarget('http://operator:topsecret@10.0.0.15:4747/video');
  assert(t4.host === '10.0.0.15' && t4.port === 4747 && t4.username === 'operator' && t4.password === 'topsecret', 'Parses inline HTTP basic credentials in URL');

  console.log('\n======================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
