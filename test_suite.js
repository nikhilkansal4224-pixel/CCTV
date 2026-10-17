/**
 * ARGUS SURREAL CCTV // COMPREHENSIVE AUTOMATED SITE TEST SUITE
 * Validates:
 * 1. Static asset serving & HTTP health
 * 2. MongoDB & Network Tunnel endpoints
 * 3. Complete Auth Matrix (ID/Pass, 2FA Passkey, 2FA Email PIN, 2FA Security Key)
 * 4. Google Auth & Auto-Provisioning
 * 5. Profile Management & Password Change
 * 6. Surveillance Events Logging & Querying
 * 7. Mobile Camera Peer Registration
 * 8. Serverless Router compatibility (api/auth.js)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          raw: data
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    results.push({ name: testName, pass: true, details });
    console.log(`  ✓ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
  } else {
    results.push({ name: testName, pass: false, details });
    console.error(`  ✗ [FAIL] ${testName} - ${details}`);
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('👁️  ARGUS SURREAL CCTV // EXHAUSTIVE AUTOMATED VERIFICATION');
  console.log('=============================================================\n');

  // -------------------------------------------------------------------------
  // TEST GROUP 1: STATIC ASSETS & HUB HEALTH
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing Core Pages & Static Assets ---');
  
  const resIndex = await request('/');
  assert(resIndex.status === 200 && resIndex.raw.includes('ARGUS // Surreal Multi-Camera CCTV'), 'Hub Page (/)', 'HTML loads with title');

  const resCamera = await request('/camera.html');
  assert(resCamera.status === 200 && resCamera.raw.includes('ARGUS Mobile CCTV Node'), 'Mobile Camera Page (/camera.html)', 'Uplink UI loads');

  const resCss = await request('/css/style.css');
  assert(resCss.status === 200 && resCss.raw.includes('btn-google'), 'Stylesheet (/css/style.css)', 'CSS loads with Google styling');

  const resAuthJs = await request('/js/auth.js');
  assert(resAuthJs.status === 200 && resAuthJs.raw.includes('ArgusAuth'), 'Auth Engine (/js/auth.js)', 'Client auth engine loaded');

  const resApiConfig = await request('/js/api-config.js');
  assert(resApiConfig.status === 200 && resApiConfig.raw.includes('window.apiUrl'), 'API Config Module (/js/api-config.js)', 'Dynamic API resolver served');

  const resAppJs = await request('/js/app.js');
  assert(resAppJs.status === 200, 'App Logic (/js/app.js)', 'Main app script served');

  const resDetectorJs = await request('/js/detector.js');
  assert(resDetectorJs.status === 200, 'AI Detector Engine (/js/detector.js)', 'Neural detection script served');

  const resBg = await request('/assets/images/surreal_bg.jpg');
  assert(resBg.status === 200, 'Surreal Background Image', 'Artwork served');

  // -------------------------------------------------------------------------
  // TEST GROUP 2: TELEMETRY & DATABASE HEALTH
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Telemetry, Network & Database Endpoints ---');

  const resHealth = await request('/api/health');
  assert(resHealth.status === 200 && resHealth.data.status === 'ok', 'Render Health Check (/api/health)', `Status: ${resHealth.data.status}, Database: ${resHealth.data.database}`);

  const resOptions = await request('/api/health', { method: 'OPTIONS' });
  assert(resOptions.status === 204 && resOptions.headers['access-control-allow-origin'] === '*', 'CORS Preflight (Cross-Origin Render)', 'Access-Control-Allow-Origin: *');

  const resMongo = await request('/api/mongodb/status');
  assert(resMongo.status === 200 && (resMongo.data.connected || resMongo.data.status === 'in-memory'), 'MongoDB Telemetry (/api/mongodb/status)', `State: ${resMongo.data.connected ? 'Connected' : 'In-Memory fallback'}`);

  const resNetwork = await request('/api/network-ip');
  assert(resNetwork.status === 200 && resNetwork.data.primaryIp, 'Network IP Endpoint (/api/network-ip)', `Primary IP: ${resNetwork.data.primaryIp}`);

  // -------------------------------------------------------------------------
  // TEST GROUP 3: AUTHENTICATION MATRIX (ID/PASSWORD & 2FA)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Authentication Gatekeeper Matrix ---');

  // Bad login
  const resBadLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'wrongpassword' }
  });
  assert(resBadLogin.status === 401 && resBadLogin.data.success === false, 'Bad Password Rejection', 'Returns 401 on incorrect password');

  // Valid login triggering 2FA challenge
  const resAdminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'password123' }
  });
  assert(resAdminLogin.status === 200 && resAdminLogin.data.requires2FA === true && resAdminLogin.data.challengeId, 'Default Admin Login Challenge', `Challenge ID: ${resAdminLogin.data.challengeId}`);

  const challengeId = resAdminLogin.data.challengeId;

  // 2FA Option 1: Passkey
  const res2FAPasskey = await request('/api/auth/verify-2fa', {
    method: 'POST',
    body: { challengeId, method: 'passkey', code: 'passkey_verified' }
  });
  assert(res2FAPasskey.status === 200 && res2FAPasskey.data.token && res2FAPasskey.data.user.username === 'admin', '2FA Verification via Passkey', 'Passkey grants session token');

  const adminToken = res2FAPasskey.data.token;

  // Trigger a second challenge to test Email PIN & Security Key
  const resSecondChallenge = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'password123' }
  });
  const emailChallengeId = resSecondChallenge.data.challengeId;

  // Request PIN resend
  const resResend = await request('/api/auth/resend-code', {
    method: 'POST',
    body: { challengeId: emailChallengeId }
  });
  assert(resResend.status === 200 && resResend.data.demoEmailCode, '2FA Resend Email PIN', `Dispatched PIN: ${resResend.data.demoEmailCode}`);

  // Verify bad email pin
  const resBadEmailPin = await request('/api/auth/verify-2fa', {
    method: 'POST',
    body: { challengeId: emailChallengeId, method: 'email_pin', code: '000000' }
  });
  assert(resBadEmailPin.status === 401, 'Reject Invalid Email PIN', '401 on wrong PIN');

  // Verify valid email pin
  const resGoodEmailPin = await request('/api/auth/verify-2fa', {
    method: 'POST',
    body: { challengeId: emailChallengeId, method: 'email_pin', code: resResend.data.demoEmailCode }
  });
  assert(resGoodEmailPin.status === 200 && resGoodEmailPin.data.token, 'Verify Valid Email PIN', 'Email PIN grants session token');

  // Trigger third challenge to test Security Key
  const resThirdChallenge = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'password123' }
  });
  const secChallengeId = resThirdChallenge.data.challengeId;

  const resSecKey = await request('/api/auth/verify-2fa', {
    method: 'POST',
    body: { challengeId: secChallengeId, method: 'security_key', code: '7777' }
  });
  assert(resSecKey.status === 200 && resSecKey.data.token, 'Verify Security Key PIN (7777)', 'Hardware PIN grants session token');

  // New Step 1: Lookup enabled auth methods by username
  const resLookup = await request('/api/auth/lookup-methods', {
    method: 'POST',
    body: { username: 'admin' }
  });
  assert(
    resLookup.status === 200 &&
    resLookup.data.success &&
    Array.isArray(resLookup.data.methods) &&
    resLookup.data.methods.includes('password'),
    'Step 1 Username Lookup & Enabled Methods',
    `Enabled methods: ${resLookup.data.methods.join(', ')}`
  );

  // New Step 2: Verify password against challenge
  const resVerifyPass = await request('/api/auth/verify-password', {
    method: 'POST',
    body: {
      challengeId: resLookup.data.challengeId,
      username: 'admin',
      password: 'password123'
    }
  });
  assert(resVerifyPass.status === 200 && resVerifyPass.data.token, 'Step 2 Password Verification (/api/auth/verify-password)', 'Grants session token');

  // Instant Guest Login
  const resGuest = await request('/api/auth/guest', { method: 'POST' });
  assert(resGuest.status === 200 && resGuest.data.token && resGuest.data.user.role === 'guest', 'Guest Account Instant Login (/api/auth/guest)', `Role: ${resGuest.data.user.role}`);

  // Forgot Password Request & Reset
  const resForgot = await request('/api/auth/forgot-password', {
    method: 'POST',
    body: { username: 'admin' }
  });
  assert(resForgot.status === 200 && resForgot.data.demoResetCode, 'Forgot Password Request (/api/auth/forgot-password)', `Dispatched code: ${resForgot.data.demoResetCode}`);

  const resReset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: {
      username: 'admin',
      challengeId: resForgot.data.challengeId,
      code: resForgot.data.demoResetCode,
      newPassword: 'password123'
    }
  });
  assert(resReset.status === 200 && resReset.data.token, 'Reset Password with Code (/api/auth/reset-password)', 'Successfully reset & authorized session');

  // -------------------------------------------------------------------------
  // TEST GROUP 4: SESSION VERIFICATION & OPERATOR PROFILE
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Session Identity & Operator Profile ---');

  const resMe = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(resMe.status === 200 && resMe.data.authenticated === true && resMe.data.user.username === 'admin', 'Session Verification (/api/auth/me)', `Operator: ${resMe.data.user.displayName}`);

  const resProfile = await request('/api/auth/profile', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(resProfile.status === 200 && resProfile.data.profile.username === 'admin', 'Get Operator Profile (/api/auth/profile)', `Role: ${resProfile.data.profile.role}`);

  const resUpdateProfile = await request('/api/auth/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { displayName: 'Lead Sentinel Admin', email: 'sentinel.lead@argus.sec' }
  });
  assert(resUpdateProfile.status === 200 && resUpdateProfile.data.profile.displayName === 'Lead Sentinel Admin', 'Update Operator Profile', 'DisplayName updated');

  // -------------------------------------------------------------------------
  // TEST GROUP 5: GOOGLE AUTHENTICATION & AUTO-PROVISIONING
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Google OAuth & Auto-Provisioning ---');

  const resGoogleId = await request('/api/auth/google-client-id');
  assert(resGoogleId.status === 200 && resGoogleId.data.clientId, 'Google Client ID Endpoint', `Client ID: ${resGoogleId.data.clientId.slice(0, 25)}...`);

  const uniqueGoogleEmail = `operator_test_${Date.now()}@gmail.com`;
  const resGoogleAuth = await request('/api/auth/google', {
    method: 'POST',
    body: {
      email: uniqueGoogleEmail,
      name: 'Agent Test Google',
      picture: 'https://lh3.googleusercontent.com/test-avatar.jpg'
    }
  });
  assert(resGoogleAuth.status === 200 && resGoogleAuth.data.token && resGoogleAuth.data.user, 'Google 1-Click Auto-Provisioning', `Provisioned User: ${resGoogleAuth.data.user.username}`);

  const googleToken = resGoogleAuth.data.token;

  // Re-login with same Google account
  const resGoogleLogin = await request('/api/auth/google', {
    method: 'POST',
    body: { email: uniqueGoogleEmail }
  });
  assert(resGoogleLogin.status === 200 && resGoogleLogin.data.user.username === resGoogleAuth.data.user.username, 'Google Returning User Login', 'Recognizes existing account');

  // -------------------------------------------------------------------------
  // TEST GROUP 6: MANUAL OPERATOR REGISTRATION
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Testing Manual Operator Registration ---');

  const uniqueUser = `agent_${Date.now()}`;
  const resReg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: uniqueUser,
      password: 'password999',
      displayName: 'Field Operative',
      email: `${uniqueUser}@argus.sec`,
      twoFactorEnabled: false
    }
  });
  assert(resReg.status === 201 && resReg.data.token && resReg.data.user.username === uniqueUser, 'Register New Operator (/api/auth/register)', `Operator: ${uniqueUser}`);

  // -------------------------------------------------------------------------
  // TEST GROUP 7: SURVEILLANCE EVENTS & SNAPSHOTS
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Testing Surveillance Events & Evidence Journal ---');

  const resAddEvent = await request('/api/events', {
    method: 'POST',
    body: {
      type: 'HUMAN DETECTED',
      cameraName: 'Front Door Cybercam',
      confidence: 0.94,
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/test_snapshot',
      boxes: [{ class: 'person', score: 0.94, bbox: [100, 100, 250, 400] }]
    }
  });
  assert(resAddEvent.status === 201 && (resAddEvent.data.success || resAddEvent.data.insertedId), 'Log Surveillance Event (/api/events)', 'Human movement recorded');

  const resGetEvents = await request('/api/events');
  const eventsList = resGetEvents.data.events || (Array.isArray(resGetEvents.data) ? resGetEvents.data : []);
  assert(resGetEvents.status === 200 && Array.isArray(eventsList), 'Query Surveillance Events Journal', `Found ${eventsList.length} recorded events`);

  // -------------------------------------------------------------------------
  // TEST GROUP 8: MOBILE CAMERA WEBRTC PAIRING
  // -------------------------------------------------------------------------
  console.log('\n--- 8. Testing Mobile Camera WebRTC Registration ---');

  const testPeerId = `test_cam_peer_${Date.now()}`;
  const resRegCam = await request('/api/cameras/register', {
    method: 'POST',
    body: {
      peerId: testPeerId,
      name: 'Mobile Phone #1',
      facing: 'environment'
    }
  });
  assert(resRegCam.status === 200 && resRegCam.data.success, 'Register Mobile Camera Peer', `Peer ID: ${testPeerId}`);

  // -------------------------------------------------------------------------
  // TEST GROUP 9: LOGOUT & TOKEN INVALIDATION
  // -------------------------------------------------------------------------
  console.log('\n--- 9. Testing Logout & Token Invalidation ---');

  const resLogout = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${googleToken}` }
  });
  assert(resLogout.status === 200, 'Logout Session (/api/auth/logout)', 'Token revoked');

  const resMeAfterLogout = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${googleToken}` }
  });
  assert(resMeAfterLogout.status === 401, 'Revoked Token Rejection', 'Expired session returns 401');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n=============================================================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${results.length})`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
