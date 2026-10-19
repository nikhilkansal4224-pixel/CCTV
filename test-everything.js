const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
let authToken = null;
let authCookie = null;

async function runTestSuite() {
  console.log('======================================================');
  console.log('  SENTINEL SYSTEM: COMPREHENSIVE TEST SUITE');
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

  // --- 1. AUTHENTICATION & SECURITY TESTS ---
  console.log('[1/4] Testing Authentication & Security Gateways...');

  // Test 1.1: Unauthenticated request to / returns 302 redirect
  const rootRes = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
  assert(rootRes.status === 302, 'Unauthenticated root access returns 302 redirect');
  assert(rootRes.headers.get('location')?.includes('/login.html'), 'Redirect target is /login.html');

  // Test 1.2: Unauthenticated request to protected API returns 401
  const unauthApiRes = await fetch(`${BASE_URL}/api/sessions/create`, { method: 'POST' });
  assert(unauthApiRes.status === 401, 'POST /api/sessions/create without auth returns 401');

  // Test 1.3: Login with invalid password fails
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
  });
  assert(badLoginRes.status === 401, 'Login with invalid password rejected with 401');

  // Test 1.4: Login with valid admin credentials succeeds
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password123', remember: true }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success, 'Login with admin credentials succeeds');
  authToken = loginData.token;
  authCookie = loginRes.headers.get('set-cookie');
  assert(!!authToken && !!authCookie, 'Authentication token and cookie issued');

  // Test 1.5: GET /api/auth/me returns operator details
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: authCookie },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.authenticated && meData.user.username === 'admin', '/api/auth/me identifies operator');

  // Test 1.6: Register new operator
  const testOperator = `test_op_${Date.now().toString().slice(-4)}`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testOperator,
      password: 'securepassword123',
      role: 'Surveillance Officer',
      displayName: 'Officer Test',
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.success && regData.user.username === testOperator, 'Operator registration succeeds');

  // Test 1.7: Duplicate registration fails
  const dupRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testOperator,
      password: 'securepassword123',
    }),
  });
  assert(dupRegRes.status === 400, 'Duplicate username registration rejected with 400');

  // --- 2. SESSION & QR GENERATION TESTS ---
  console.log('\n[2/4] Testing Session Creation & QR Generation...');

  // Test 2.1: Create session with authenticated cookie
  const sessionRes = await fetch(`${BASE_URL}/api/sessions/create?host=127.0.0.1&protocol=http`, {
    method: 'POST',
    headers: { Cookie: authCookie },
  });
  const sessionData = await sessionRes.json();
  assert(sessionRes.status === 200 && !!sessionData.sessionId, 'Session generated successfully');
  const sessionId = sessionData.sessionId;

  // Test 2.2: Retrieve session details
  const getSessionRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
  const getSessionData = await getSessionRes.json();
  assert(getSessionRes.status === 200 && getSessionData.sessionId === sessionId, 'Session metadata retrieved');
  assert(getSessionData.status === 'waiting' && !getSessionData.isPaired, 'Session initial state is waiting');

  // Test 2.3: Generate QR Code SVG
  const qrRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}/qr?host=127.0.0.1&protocol=http`);
  const qrSvg = await qrRes.text();
  assert(qrRes.status === 200 && qrRes.headers.get('content-type')?.includes('image/svg+xml'), 'QR code served as image/svg+xml');
  assert(qrSvg.includes('<svg') && qrSvg.includes('</svg>'), 'QR code SVG valid XML structure');

  // --- 3. WEBSOCKET & WEBRTC SIGNALING TESTS ---
  console.log('\n[3/4] Testing WebSocket Signaling & P2P WebRTC Handshake...');

  const wsHost = new WebSocket('ws://localhost:3000');
  const wsCamera = new WebSocket('ws://localhost:3000');

  await new Promise(resolve => {
    let count = 0;
    const check = () => { if (++count === 2) resolve(); };
    wsHost.on('open', check);
    wsCamera.on('open', check);
  });

  let hostJoined = false;
  let cameraJoined = false;
  let cameraJoinedNotice = false;
  let cameraReadyNotice = false;
  let offerRelayed = false;
  let answerRelayed = false;
  let iceRelayed = false;
  let duplicateRejected = false;

  wsHost.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'joined') hostJoined = true;
    if (msg.type === 'camera-joined') cameraJoinedNotice = true;
    if (msg.type === 'camera-ready') cameraReadyNotice = true;
    if (msg.type === 'offer') {
      offerRelayed = true;
      wsHost.send(JSON.stringify({ type: 'answer', sessionId, sdp: { type: 'answer', sdp: 'v=0...' } }));
    }
    if (msg.type === 'ice-candidate') iceRelayed = true;
  });

  wsCamera.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'joined') cameraJoined = true;
    if (msg.type === 'answer') answerRelayed = true;
  });

  // Host joins
  wsHost.send(JSON.stringify({ type: 'join', sessionId, role: 'host' }));
  await new Promise(r => setTimeout(r, 150));
  assert(hostJoined, 'Host joined signaling session');

  // Camera joins
  wsCamera.send(JSON.stringify({ type: 'join', sessionId, role: 'camera' }));
  await new Promise(r => setTimeout(r, 150));
  assert(cameraJoined && cameraJoinedNotice, 'Camera paired and host received camera-joined notice');

  // Test 3.3: Enforce single-camera pairing security (second camera should be rejected)
  const wsCameraDuplicate = new WebSocket('ws://localhost:3000');
  await new Promise(r => wsCameraDuplicate.on('open', r));
  wsCameraDuplicate.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'error' && msg.message.includes('Another camera is already connected')) {
      duplicateRejected = true;
    }
  });
  wsCameraDuplicate.send(JSON.stringify({ type: 'join', sessionId, role: 'camera' }));
  await new Promise(r => setTimeout(r, 200));
  assert(duplicateRejected, 'Single-camera pairing security enforced (rogue camera rejected)');
  wsCameraDuplicate.close();

  // Test 3.4: Camera-ready permission notification
  wsCamera.send(JSON.stringify({ type: 'camera-ready', sessionId, facingMode: 'environment', resolution: '1280x720' }));
  await new Promise(r => setTimeout(r, 150));
  assert(cameraReadyNotice, 'Host received camera-ready hardware consent notice');

  // Test 3.5: SDP Offer & Answer negotiation
  wsCamera.send(JSON.stringify({ type: 'offer', sessionId, sdp: { type: 'offer', sdp: 'v=0...' } }));
  await new Promise(r => setTimeout(r, 250));
  assert(offerRelayed, 'WebRTC SDP offer relayed to host');
  assert(answerRelayed, 'WebRTC SDP answer returned to camera');

  // Test 3.6: ICE Candidate relay
  wsCamera.send(JSON.stringify({ type: 'ice-candidate', sessionId, candidate: { candidate: 'candidate:1 1 UDP...' } }));
  await new Promise(r => setTimeout(r, 150));
  assert(iceRelayed, 'ICE candidates exchanged between peers');

  // Clean close sockets
  wsHost.close();
  wsCamera.close();

  // Test 3.7: Session extension (+10 minutes)
  const extendRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}/extend`, { method: 'POST' });
  const extendData = await extendRes.json();
  assert(extendRes.status === 200 && extendData.success && extendData.remainingSeconds > 600, 'Session duration successfully extended by +10 minutes');

  // --- 4. SESSION TERMINATION & CLEANUP TESTS ---
  console.log('\n[4/4] Testing Session Termination & Cleanup...');

  // Test 4.1: Explicit session termination
  const endRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}/end`, { method: 'POST' });
  const endData = await endRes.json();
  assert(endRes.status === 200 && endData.success, 'Session explicitly terminated via API');

  // Test 4.2: Terminated session should return 404 or ended status
  const afterEndRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
  assert(afterEndRes.status === 404, 'Terminated session deleted from active memory');

  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
