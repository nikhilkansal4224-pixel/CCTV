// SENTINEL // Multi-Host Concurrent Viewing & MongoDB Atlas Verification Test
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-atlas-cyan-cable:GO5m4HuFO2Q7reXe@atlas-cyan-cable.x0vjscl.mongodb.net/?retryWrites=true&w=majority';

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

async function run() {
  console.log('\n======================================================');
  console.log('  TESTING MULTI-HOST CONCURRENT VIEWING & MONGODB');
  console.log('======================================================\n');

  // [1] Verify MongoDB Atlas connection directly
  console.log('[1/4] Verifying MongoDB Atlas User Storage...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('sentinel_cctv');
  const usersCollection = db.collection('users');
  const count = await usersCollection.countDocuments();
  assert(count > 0, `MongoDB Atlas "users" collection exists with ${count} users`);

  // [2] Register new user with unique ID
  const testUser = `sync_user_${Date.now()}`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUser,
      password: 'password123',
      displayName: 'Multi-Device Test Officer',
      role: 'Surveillance Officer',
    }),
  });
  const regData = await regRes.json();
  assert(regData.success, 'Registration endpoint returned success');
  assert(regData.user.userId && regData.user.userId.startsWith('USR-'), `Generated unique User ID: ${regData.user.userId}`);

  // Verify in MongoDB Atlas directly
  const savedUser = await usersCollection.findOne({ username: testUser });
  assert(savedUser !== null, 'User document verified directly inside MongoDB Atlas');
  assert(savedUser.userId === regData.user.userId, `MongoDB document has matching userId: ${savedUser.userId}`);

  // [3] Login and test multi-device session sync
  console.log('\n[2/4] Testing Multi-Device Session Synchronization...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser, password: 'password123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const cookieHeader = loginRes.headers.get('set-cookie');

  // Device #1 (e.g. Laptop) opens main page and requests session
  const host1Res = await fetch(`${BASE_URL}/api/sessions/create`, {
    method: 'POST',
    headers: { 'Cookie': cookieHeader, 'Authorization': `Bearer ${token}` },
  });
  const host1Data = await host1Res.json();
  const sessionId = host1Data.sessionId;
  assert(sessionId && sessionId.length === 12, `Host #1 generated session: ${sessionId}`);

  // Device #2 (e.g. iPad or secondary phone) opens main page with same user login
  const host2Res = await fetch(`${BASE_URL}/api/sessions/create`, {
    method: 'POST',
    headers: { 'Cookie': cookieHeader, 'Authorization': `Bearer ${token}` },
  });
  const host2Data = await host2Res.json();
  assert(host2Data.sessionId === sessionId, `Host #2 automatically synced to same session: ${host2Data.sessionId}`);
  assert(host2Data.userId === regData.user.userId, `Host #2 identified with user ID: ${host2Data.userId}`);

  // [4] Test Concurrent Multi-Host WebSocket & WebRTC Signaling
  console.log('\n[3/4] Testing Simultaneous Multi-Host WebRTC Signaling...');
  const host1Ws = new WebSocket(WS_URL);
  const host2Ws = new WebSocket(WS_URL);
  const cameraWs = new WebSocket(WS_URL);

  let host1Joined = false;
  let host2Joined = false;
  let host1ReceivedOffer = false;
  let host2ReceivedOffer = false;

  await new Promise((resolve) => {
    let connectedCount = 0;
    const checkReady = () => {
      connectedCount++;
      if (connectedCount === 3) resolve();
    };
    host1Ws.on('open', checkReady);
    host2Ws.on('open', checkReady);
    cameraWs.on('open', checkReady);
  });

  // Listeners on both hosts attached BEFORE sending join
  host1Ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'joined') host1Joined = true;
    if (msg.type === 'offer') {
      host1ReceivedOffer = true;
      // Host 1 responds with answer
      host1Ws.send(JSON.stringify({
        type: 'answer',
        sessionId,
        deviceId: msg.deviceId,
        hostViewerId: 'HOST-LAPTOP',
        sdp: { type: 'answer', sdp: 'fake-sdp-host-1' },
      }));
    }
  });

  host2Ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'joined') host2Joined = true;
    if (msg.type === 'offer') {
      host2ReceivedOffer = true;
      // Host 2 responds with answer
      host2Ws.send(JSON.stringify({
        type: 'answer',
        sessionId,
        deviceId: msg.deviceId,
        hostViewerId: 'HOST-TABLET',
        sdp: { type: 'answer', sdp: 'fake-sdp-host-2' },
      }));
    }
  });

  host1Ws.send(JSON.stringify({
    type: 'join',
    role: 'host',
    sessionId,
    hostViewerId: 'HOST-LAPTOP',
    userId: regData.user.userId,
  }));

  host2Ws.send(JSON.stringify({
    type: 'join',
    role: 'host',
    sessionId,
    hostViewerId: 'HOST-TABLET',
    userId: regData.user.userId,
  }));

  await new Promise(r => setTimeout(r, 200));

  // Now Camera pairs to session
  let cameraReceivedAnswers = [];
  cameraWs.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'answer') {
      cameraReceivedAnswers.push(msg.hostViewerId || 'UNKNOWN');
    }
  });

  cameraWs.send(JSON.stringify({
    type: 'join',
    role: 'camera',
    sessionId,
    deviceId: 'CAM-LIVING-ROOM',
    deviceName: 'Living Room Camera',
  }));

  await new Promise(r => setTimeout(r, 150));

  cameraWs.send(JSON.stringify({
    type: 'camera-ready',
    sessionId,
    deviceId: 'CAM-LIVING-ROOM',
    facingMode: 'environment',
    resolution: '1080p',
  }));

  // Camera sends offer broadcast to all watching hosts
  cameraWs.send(JSON.stringify({
    type: 'offer',
    sessionId,
    deviceId: 'CAM-LIVING-ROOM',
    sdp: { type: 'offer', sdp: 'fake-camera-sdp' },
  }));

  await new Promise(r => setTimeout(r, 300));

  assert(host1Joined, 'Host #1 (Laptop) successfully connected to surveillance session');
  assert(host2Joined, 'Host #2 (Tablet) successfully connected to surveillance session');
  assert(host1ReceivedOffer, 'Host #1 received camera WebRTC offer');
  assert(host2ReceivedOffer, 'Host #2 received camera WebRTC offer simultaneously');
  assert(cameraReceivedAnswers.includes('HOST-LAPTOP'), 'Camera received WebRTC handshake answer from Host #1');
  assert(cameraReceivedAnswers.includes('HOST-TABLET'), 'Camera received WebRTC handshake answer from Host #2');

  // [5] Close Host #1 and verify Host #2 remains streaming
  console.log('\n[4/4] Testing Host Isolation...');
  host1Ws.close();
  await new Promise(r => setTimeout(r, 150));

  let host2StillLive = host2Ws.readyState === WebSocket.OPEN;
  assert(host2StillLive, 'Host #2 remains connected and active after Host #1 disconnects');

  cameraWs.close();
  host2Ws.close();
  await client.close();

  console.log('\n======================================================');
  console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
