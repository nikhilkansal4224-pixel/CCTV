const WebSocket = require('ws');

async function testSignaling() {
  console.log('--- Starting WebRTC Signaling & Session Lifecycle Test ---');
  
  // 1. Create Session
  const createRes = await fetch('http://localhost:3000/api/sessions/create?host=localhost&protocol=http', { method: 'POST' });
  const session = await createRes.json();
  console.log('✓ Session Created:', session.sessionId, 'Expires in:', session.ttlSeconds, 's');

  const wsHost = new WebSocket('ws://localhost:3000');
  const wsCamera = new WebSocket('ws://localhost:3000');

  let hostGotJoined = false;
  let hostGotCameraJoined = false;
  let hostGotCameraReady = false;
  let hostGotOffer = false;
  let cameraGotAnswer = false;
  let sessionTerminated = false;

  await new Promise((resolve, reject) => {
    let connectCount = 0;
    function checkReady() {
      connectCount++;
      if (connectCount === 2) resolve();
    }
    wsHost.on('open', checkReady);
    wsCamera.on('open', checkReady);
  });

  // Host listener
  wsHost.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log('[Host Received]:', msg.type);

    if (msg.type === 'joined') {
      hostGotJoined = true;
    }
    if (msg.type === 'camera-joined') {
      hostGotCameraJoined = true;
    }
    if (msg.type === 'camera-ready') {
      hostGotCameraReady = true;
    }
    if (msg.type === 'offer') {
      hostGotOffer = true;
      // Host sends answer back
      wsHost.send(JSON.stringify({
        type: 'answer',
        sessionId: session.sessionId,
        sdp: { type: 'answer', sdp: 'mock-sdp-answer-data' }
      }));
    }
    if (msg.type === 'session-ended') {
      sessionTerminated = true;
    }
  });

  // Camera listener
  wsCamera.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log('[Camera Received]:', msg.type);

    if (msg.type === 'answer') {
      cameraGotAnswer = true;
    }
  });

  // Join sessions
  wsHost.send(JSON.stringify({ type: 'join', sessionId: session.sessionId, role: 'host' }));
  await new Promise(r => setTimeout(r, 200));

  wsCamera.send(JSON.stringify({ type: 'join', sessionId: session.sessionId, role: 'camera' }));
  await new Promise(r => setTimeout(r, 200));

  // Camera triggers ready and offer
  wsCamera.send(JSON.stringify({
    type: 'camera-ready',
    sessionId: session.sessionId,
    facingMode: 'environment',
    resolution: '1280x720',
  }));
  await new Promise(r => setTimeout(r, 200));

  wsCamera.send(JSON.stringify({
    type: 'offer',
    sessionId: session.sessionId,
    sdp: { type: 'offer', sdp: 'mock-sdp-offer-data' },
  }));
  await new Promise(r => setTimeout(r, 400));

  // End session
  wsHost.send(JSON.stringify({
    type: 'end-session',
    sessionId: session.sessionId,
    reason: 'End test',
  }));
  await new Promise(r => setTimeout(r, 300));

  wsHost.close();
  wsCamera.close();

  console.log('\n--- Test Verification Checklist ---');
  console.log('✓ Host joined session:', hostGotJoined);
  console.log('✓ Host received camera paired event:', hostGotCameraJoined);
  console.log('✓ Host received camera permission granted event:', hostGotCameraReady);
  console.log('✓ Host received WebRTC SDP offer:', hostGotOffer);
  console.log('✓ Camera received WebRTC SDP answer:', cameraGotAnswer);
  console.log('✓ Session terminated cleanly on both ends:', sessionTerminated);

  if (hostGotJoined && hostGotCameraJoined && hostGotCameraReady && hostGotOffer && cameraGotAnswer && sessionTerminated) {
    console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟');
    process.exit(0);
  } else {
    console.error('\n❌ Some test conditions failed');
    process.exit(1);
  }
}

testSignaling().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
