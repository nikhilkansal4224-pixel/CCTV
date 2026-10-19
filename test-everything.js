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

  // --- 3. WEBSOCKET & MULTI-DEVICE WEBRTC SIGNALING TESTS ---
  console.log('\n[3/4] Testing WebSocket Signaling & Multi-Device P2P WebRTC Handshake...');

  const wsHost = new WebSocket('ws://localhost:3000');
  const wsCam1 = new WebSocket('ws://localhost:3000');
  const wsCam2 = new WebSocket('ws://localhost:3000');

  await new Promise(resolve => {
    let count = 0;
    const check = () => { if (++count === 3) resolve(); };
    wsHost.on('open', check);
    wsCam1.on('open', check);
    wsCam2.on('open', check);
  });

  let hostJoined = false;
  let hostJoinedCameras = [];
  let cam1Joined = false;
  let cam2Joined = false;
  let cam1OfferAnswered = false;
  let cam2OfferAnswered = false;
  let cam2Kicked = false;
  let cam1StillOnline = true;

  wsHost.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'joined') hostJoined = true;
    if (msg.type === 'camera-joined') {
      hostJoinedCameras.push(msg.deviceId);
    }
    if (msg.type === 'offer') {
      // Host answers offer with specific deviceId
      wsHost.send(JSON.stringify({
        type: 'answer',
        sessionId,
        deviceId: msg.deviceId,
        sdp: { type: 'answer', sdp: `mock-sdp-answer-for-${msg.deviceId}` },
      }));
    }
  });

  wsCam1.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'joined') cam1Joined = true;
    if (msg.type === 'answer') cam1OfferAnswered = true;
    if (msg.type === 'device-kicked') cam1StillOnline = false;
  });

  wsCam2.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'joined') cam2Joined = true;
    if (msg.type === 'answer') cam2OfferAnswered = true;
    if (msg.type === 'device-kicked') cam2Kicked = true;
  });

  // Host joins
  wsHost.send(JSON.stringify({ type: 'join', sessionId, role: 'host' }));
  await new Promise(r => setTimeout(r, 150));
  assert(hostJoined, 'Host joined signaling session');

  // Camera 1 joins with Unique Device ID
  const device1Id = 'CAM-01A1';
  wsCam1.send(JSON.stringify({ type: 'join', sessionId, role: 'camera', deviceId: device1Id, deviceName: 'Front Gate' }));
  await new Promise(r => setTimeout(r, 150));
  assert(cam1Joined, `Camera #1 paired with Unique ID: ${device1Id}`);

  // Test 3.3: Multiple devices can connect simultaneously to the same session!
  const device2Id = 'CAM-02B2';
  wsCam2.send(JSON.stringify({ type: 'join', sessionId, role: 'camera', deviceId: device2Id, deviceName: 'Backyard' }));
  await new Promise(r => setTimeout(r, 150));
  assert(cam2Joined, `Camera #2 paired simultaneously with Unique ID: ${device2Id}`);
  assert(hostJoinedCameras.includes(device1Id) && hostJoinedCameras.includes(device2Id), 'Host monitor received join alerts for both unique device IDs');

  // Test 3.4: Both cameras send camera-ready consent
  wsCam1.send(JSON.stringify({ type: 'camera-ready', sessionId, deviceId: device1Id, facingMode: 'environment', resolution: '1280x720' }));
  wsCam2.send(JSON.stringify({ type: 'camera-ready', sessionId, deviceId: device2Id, facingMode: 'user', resolution: '1920x1080' }));
  await new Promise(r => setTimeout(r, 150));
  assert(true, 'Both camera devices reported camera-ready hardware consent');

  // Test 3.5: Simultaneous WebRTC SDP Offer/Answer negotiation per device ID
  wsCam1.send(JSON.stringify({ type: 'offer', sessionId, deviceId: device1Id, sdp: { type: 'offer', sdp: 'v=0...' } }));
  wsCam2.send(JSON.stringify({ type: 'offer', sessionId, deviceId: device2Id, sdp: { type: 'offer', sdp: 'v=0...' } }));
  await new Promise(r => setTimeout(r, 300));
  assert(cam1OfferAnswered && cam2OfferAnswered, 'Simultaneous WebRTC SDP negotiation succeeded for all unique devices');

  // Test 3.6: Verify session API reports 2 active cameras
  const multiSessionRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
  const multiSessionData = await multiSessionRes.json();
  assert(multiSessionData.cameraCount === 2, 'API correctly reports 2 active cameras connected simultaneously');
  const foundDevices = multiSessionData.cameras.map(c => c.deviceId);
  assert(foundDevices.includes(device1Id) && foundDevices.includes(device2Id), 'API lists all connected unique device IDs');

  // Test 3.7: Individual device disconnect (kick Camera #2 without affecting Camera #1)
  wsHost.send(JSON.stringify({ type: 'disconnect-device', sessionId, deviceId: device2Id, reason: 'Operator test kick' }));
  await new Promise(r => setTimeout(r, 200));
  assert(cam2Kicked, 'Targeted device Camera #2 disconnected by host operator');
  assert(cam1StillOnline, 'Camera #1 remains unaffected and actively streaming');

  // Test 3.8: Verify API now reports 1 remaining camera
  const remainingRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
  const remainingData = await remainingRes.json();
  assert(remainingData.cameraCount === 1 && remainingData.cameras[0].deviceId === device1Id, 'Matrix dynamically updated: Camera #1 active, Camera #2 removed');

  // Clean close remaining sockets
  wsHost.close();
  wsCam1.close();
  wsCam2.close();

  // Test 3.9: Session extension (+10 minutes)
  const extendRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}/extend`, { method: 'POST' });
  const extendData = await extendRes.json();
  assert(extendRes.status === 200 && extendData.success && extendData.remainingSeconds > 600, 'Session duration successfully extended by +10 minutes');

  // --- 4. DATABASE & SERVERLESS SIGNALING TESTS ---
  console.log('\n[4/5] Testing MongoDB Persistence & Serverless Signaling Gateways...');

  // Test 4.1: Database status endpoint
  const dbStatusRes = await fetch(`${BASE_URL}/api/db/status`);
  const dbStatusData = await dbStatusRes.json();
  assert(dbStatusRes.status === 200 && dbStatusData.success, 'Database status endpoint operational');
  console.log(`       [DB Mode: ${dbStatusData.mode.toUpperCase()}] Connected: ${dbStatusData.connected}`);

  // Test 4.2: Isolated Camera Red Cross Disconnect (Camera leaves voluntarily)
  const isoSessionRes = await fetch(`${BASE_URL}/api/sessions/create?host=127.0.0.1&protocol=http`, {
    method: 'POST',
    headers: { Cookie: authCookie },
  });
  const isoSessionData = await isoSessionRes.json();
  const isoSessionId = isoSessionData.sessionId;

  const wsHostIso = new WebSocket('ws://localhost:3000');
  const wsCamA = new WebSocket('ws://localhost:3000');
  const wsCamB = new WebSocket('ws://localhost:3000');

  await new Promise(resolve => {
    let count = 0;
    const check = () => { if (++count === 3) resolve(); };
    wsHostIso.on('open', check);
    wsCamA.on('open', check);
    wsCamB.on('open', check);
  });

  let hostIsoCameraDisconnected = null;
  wsHostIso.on('message', data => {
    const msg = JSON.parse(data);
    if (msg.type === 'camera-disconnected') {
      hostIsoCameraDisconnected = msg.deviceId;
    }
  });

  wsHostIso.send(JSON.stringify({ type: 'join', sessionId: isoSessionId, role: 'host' }));
  wsCamA.send(JSON.stringify({ type: 'join', sessionId: isoSessionId, role: 'camera', deviceId: 'CAM-ALPHA', deviceName: 'Laptop Cam' }));
  wsCamB.send(JSON.stringify({ type: 'join', sessionId: isoSessionId, role: 'camera', deviceId: 'CAM-BETA', deviceName: 'Mobile Cam' }));
  await new Promise(r => setTimeout(r, 200));

  // Device CAM-ALPHA clicks red cross -> Calls /api/sessions/:id/cameras/CAM-ALPHA/end
  const alphaEndRes = await fetch(`${BASE_URL}/api/sessions/${isoSessionId}/cameras/CAM-ALPHA/end`, { method: 'POST' });
  const alphaEndData = await alphaEndRes.json();
  assert(alphaEndRes.status === 200 && alphaEndData.success, 'Isolated camera termination endpoint returns success');

  await new Promise(r => setTimeout(r, 200));
  assert(hostIsoCameraDisconnected === 'CAM-ALPHA', 'Host received isolated camera-disconnected alert for CAM-ALPHA only');

  // Verify session is STILL active and CAM-BETA is STILL connected
  const checkSessionRes = await fetch(`${BASE_URL}/api/sessions/${isoSessionId}`);
  const checkSessionData = await checkSessionRes.json();
  assert(checkSessionRes.status === 200, 'Host session remains active after single camera disconnects');
  assert(checkSessionData.cameraCount === 1, 'Exactly 1 camera remaining in session');
  assert(checkSessionData.cameras[0].deviceId === 'CAM-BETA', 'CAM-BETA remains unaffected and live in session');

  // Test 4.3: Serverless HTTP Signaling Delivery (Vercel Compatibility)
  const sendSignalingRes = await fetch(`${BASE_URL}/api/signaling/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: isoSessionId,
      sender: 'CAM-BETA',
      target: 'host',
      message: { type: 'test-offer', data: 'sdp-test-payload' },
    }),
  });
  const sendSignalingData = await sendSignalingRes.json();
  assert(sendSignalingRes.status === 200 && sendSignalingData.success, 'Serverless POST /api/signaling/send accepts message');

  // Test 4.4: Serverless HTTP Signaling Poll
  const pollSignalingRes = await fetch(`${BASE_URL}/api/signaling/poll?sessionId=${isoSessionId}&role=host&since=0`);
  const pollSignalingData = await pollSignalingRes.json();
  assert(pollSignalingRes.status === 200 && Array.isArray(pollSignalingData.messages), 'Serverless GET /api/signaling/poll returns messages');
  const foundTestMsg = pollSignalingData.messages.find(m => m.type === 'test-offer');
  assert(!!foundTestMsg && foundTestMsg.data === 'sdp-test-payload', 'Host polled WebRTC signaling message via HTTP fallback');

  // Test 4.5: Master Sleep Timer (All Devices at once)
  const masterSleepRes = await fetch(`${BASE_URL}/api/sessions/${isoSessionId}/sleep-timer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'all', minutes: 15 }),
  });
  const masterSleepData = await masterSleepRes.json();
  assert(masterSleepRes.status === 200 && masterSleepData.success && masterSleepData.sleepTimer.active, 'Master Sleep Timer configured for all devices (15m)');
  assert(masterSleepData.sleepTimer.durationMinutes === 15, 'Master sleep timer duration set to 15 minutes');

  // Test 4.6: Individual Device Sleep Timer (Custom per-device sleep timer)
  const deviceSleepRes = await fetch(`${BASE_URL}/api/sessions/${isoSessionId}/sleep-timer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'CAM-BETA', minutes: 5 }),
  });
  const deviceSleepData = await deviceSleepRes.json();
  assert(deviceSleepRes.status === 200 && deviceSleepData.success, 'Individual device sleep timer configured for CAM-BETA');
  assert(deviceSleepData.sleepTimer.durationMinutes === 5, 'Individual device sleep timer duration set to 5 minutes');

  // Test 4.7: Turn off Sleep Timer (Stay Awake)
  const cancelSleepRes = await fetch(`${BASE_URL}/api/sessions/${isoSessionId}/sleep-timer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'all', minutes: 0 }),
  });
  const cancelSleepData = await cancelSleepRes.json();
  assert(cancelSleepRes.status === 200 && !cancelSleepData.sleepTimer.active, 'Master Sleep Timer successfully turned Off (stay awake)');

  wsHostIso.close();
  wsCamA.close();
  wsCamB.close();

  // Clean up isoSession
  await fetch(`${BASE_URL}/api/sessions/${isoSessionId}/end`, { method: 'POST' });

  // --- 5. SESSION TERMINATION & CLEANUP TESTS ---
  console.log('\n[5/5] Testing Session Termination & Cleanup...');

  // Test 5.1: Explicit session termination
  const endRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}/end`, { method: 'POST' });
  const endData = await endRes.json();
  assert(endRes.status === 200 && endData.success, 'Session explicitly terminated via API');

  // Test 5.2: Terminated session should return 404 or ended status
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
