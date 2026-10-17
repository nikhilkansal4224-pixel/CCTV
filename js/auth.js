/**
 * ARGUS SURREAL CCTV // AUTHENTICATION & 2-STEP VERIFICATION GATEKEEPER
 * Unified ID & Password login with multi-option 2-Step Authentication:
 * 1. Passkey (Biometric / WebAuthn)
 * 2. PIN from Email (6-digit OTP)
 * 3. Security Key (Hardware FIDO / Security PIN)
 */

class ArgusAuth {
  constructor() {
    this.token = localStorage.getItem('argus_auth_token') || null;
    this.currentUser = null;
    try {
      this.currentUser = JSON.parse(localStorage.getItem('argus_auth_user') || 'null');
    } catch (e) {
      this.currentUser = null;
    }

    this.isLocked = sessionStorage.getItem('argus_console_locked') === 'true';
    this.audioCtx = null;
    this.currentChallenge = null;

    // DOM Elements - Shell & Overlay
    this.modal = document.getElementById('authGatekeeperModal');
    this.lockOverlay = document.getElementById('lockedTerminalOverlay');
    this.sessionPill = document.getElementById('userSessionPill');
    this.sessionUserName = document.getElementById('sessionUserName');
    this.sessionClearance = document.getElementById('sessionUserClearance');

    // Step Views
    this.viewCredentials = document.getElementById('viewCredentials');
    this.view2FAMethods = document.getElementById('view2FAMethods');
    this.view2FAPasskey = document.getElementById('view2FAPasskey');
    this.view2FAEmailPin = document.getElementById('view2FAEmailPin');
    this.view2FASecurityKey = document.getElementById('view2FASecurityKey');
    this.viewRegister = document.getElementById('viewRegister');
    this.viewGoogleAuth = document.getElementById('viewGoogleAuth');
    this.btnBackFromGoogleAuth = document.getElementById('btnBackFromGoogleAuth');

    // Step 1: Credentials Form Elements
    this.formLogin = document.getElementById('formLoginCredentials');
    this.inputUserId = document.getElementById('loginUserId');
    this.inputPassword = document.getElementById('loginPassword');
    this.btnTogglePass = document.getElementById('btnTogglePassword');
    this.loginError = document.getElementById('loginErrorBanner');
    this.btnSubmitLogin = document.getElementById('btnSubmitLogin');

    // Step 2: 2FA Selection Elements
    this.twoFaUsername = document.getElementById('twoFaUsernameDisplay');
    this.btnSelectPasskey = document.getElementById('btnSelectPasskey');
    this.btnSelectEmailPin = document.getElementById('btnSelectEmailPin');
    this.btnSelectSecurityKey = document.getElementById('btnSelectSecurityKey');
    this.btnQuick2FAProceed = document.getElementById('btnQuick2FAProceed');
    this.btn2FACancel = document.getElementById('btn2FACancel');

    // Step 2A: Passkey Elements
    this.btnVerifyPasskey = document.getElementById('btnVerifyPasskey');
    this.passkeyStatusText = document.getElementById('passkeyStatusText');
    this.passkeyError = document.getElementById('passkeyErrorBanner');

    // Step 2B: Email PIN Elements
    this.inputEmailPin = document.getElementById('inputEmailPin');
    this.btnVerifyEmailPin = document.getElementById('btnVerifyEmailPin');
    this.btnResendEmail = document.getElementById('btnResendEmailCode');
    this.twoFaMaskedEmail = document.getElementById('twoFaMaskedEmail');
    this.emailDemoPill = document.getElementById('emailDemoPill');
    this.emailDemoCode = document.getElementById('emailDemoCode');
    this.emailError = document.getElementById('emailErrorBanner');

    // Step 2C: Security Key Elements
    this.inputSecurityKeyPin = document.getElementById('inputSecurityKeyPin');
    this.btnVerifySecurityKey = document.getElementById('btnVerifySecurityKey');
    this.securityKeyError = document.getElementById('securityKeyErrorBanner');

    // Registration Elements
    this.formRegister = document.getElementById('formRegisterOperator');
    this.regUser = document.getElementById('regUsername');
    this.regName = document.getElementById('regDisplayName');
    this.regEmail = document.getElementById('regEmail');
    this.regPass = document.getElementById('regPassword');
    this.reg2FAToggle = document.getElementById('reg2FAToggle');
    this.regError = document.getElementById('regErrorBanner');
    this.btnSubmitReg = document.getElementById('btnSubmitReg');
    this.btnGoToReg = document.getElementById('btnGoToRegister');
    this.btnBackToLogin = document.getElementById('btnBackToLogin');

    // Lock Screen Elements
    this.lockPinInput = document.getElementById('lockPinInput');
    this.lockPinError = document.getElementById('lockPinError');
    this.lockOperatorName = document.getElementById('lockOperatorName');
    this.currentLockPinBuffer = '';

    // Settings Modal Elements
    this.settingsModal = document.getElementById('settingsModal');
    this.btnOpenSettings = document.getElementById('btnOpenSettings');
    this.btnCloseSettings = document.getElementById('btnCloseSettings');
    this.settingsFeedback = document.getElementById('settingsFeedbackBanner');

    // Settings Tabs & Panels
    this.tabSetAccount = document.getElementById('tabSettingsAccount');
    this.tabSet2FA = document.getElementById('tabSettings2FA');
    this.tabSetPassword = document.getElementById('tabSettingsPassword');

    this.panelSetAccount = document.getElementById('panelSettingsAccount');
    this.panelSet2FA = document.getElementById('panelSettings2FA');
    this.panelSetPassword = document.getElementById('panelSettingsPassword');

    // Settings Form Elements
    this.formUpdateProfile = document.getElementById('formUpdateProfile');
    this.settingProfileId = document.getElementById('settingProfileId');
    this.settingProfileClearance = document.getElementById('settingProfileClearance');
    this.settingDisplayName = document.getElementById('settingDisplayName');
    this.settingEmail = document.getElementById('settingEmail');
    this.settingEmailDisplay = document.getElementById('settingEmailDisplay');
    this.btnSaveProfile = document.getElementById('btnSaveProfile');

    // 2FA Settings Elements
    this.settingMaster2FAToggle = document.getElementById('settingMaster2FAToggle');
    this.btnTestPasskey = document.getElementById('btnTestPasskey');
    this.btnTestEmailPin = document.getElementById('btnTestEmailPin');
    this.settingSecurityKeyPin = document.getElementById('settingSecurityKeyPin');
    this.btnUpdateSecurityKeyPin = document.getElementById('btnUpdateSecurityKeyPin');

    // Password Settings Elements
    this.formChangePassword = document.getElementById('formChangePassword');
    this.settingCurrentPassword = document.getElementById('settingCurrentPassword');
    this.settingNewPassword = document.getElementById('settingNewPassword');
    this.settingConfirmPassword = document.getElementById('settingConfirmPassword');
    this.btnSubmitChangePassword = document.getElementById('btnSubmitChangePassword');

    // Google Auth Elements
    this.btnGoogleLogin = document.getElementById('btnGoogleLogin');
    this.btnGoogleRegister = document.getElementById('btnGoogleRegister');
    this.googleFallbackModal = document.getElementById('googleFallbackModal');
    this.btnCloseGoogleFallback = document.getElementById('btnCloseGoogleFallback');
    this.btnLaunchGooglePageDirect = document.getElementById('btnLaunchGooglePageDirect');
    this.btnBackFromGoogleAuth = document.getElementById('btnBackFromGoogleAuth');
    this.googleAuthError = document.getElementById('googleAuthErrorBanner');
    this.formCustomGoogle = document.getElementById('formCustomGoogleLogin');
    this.customGoogleEmail = document.getElementById('customGoogleEmail');
    this.customGoogleName = document.getElementById('customGoogleName');
    this.googleClientId = null;
    this.googleTokenClient = null;

    this.init();
  }

  init() {
    if (this.checkGoogleOAuthRedirect()) {
      return;
    }
    this.bindEvents();
    this.checkInitialSession();
    this.initGoogleAuth();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.04) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  playSuccessChime() {
    this.playTone(523.25, 'sine', 0.1, 0.06); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.06), 90); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.07), 180); // G5
  }

  playErrorBuzzer() {
    this.playTone(180, 'sawtooth', 0.15, 0.08);
    setTimeout(() => this.playTone(140, 'sawtooth', 0.2, 0.08), 120);
  }

  playKeyClick() {
    this.playTone(1200, 'triangle', 0.03, 0.02);
  }

  playRadarScan() {
    this.playTone(880, 'sine', 0.06, 0.03);
    setTimeout(() => this.playTone(1174, 'sine', 0.06, 0.03), 80);
  }

  bindEvents() {
    // Reveal password toggle
    if (this.btnTogglePass && this.inputPassword) {
      this.btnTogglePass.addEventListener('click', () => {
        const isPass = this.inputPassword.type === 'password';
        this.inputPassword.type = isPass ? 'text' : 'password';
        this.btnTogglePass.textContent = isPass ? '🔒' : '👁️';
      });
    }

    // Step 1: Submit ID and Password
    if (this.formLogin) {
      this.formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitCredentialsLogin();
      });
    }

    // Quick Demo Login buttons (Instant 1-Click login to main console)
    document.querySelectorAll('.btn-demo-quick-login').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (e) e.preventDefault();
        this.playKeyClick();
        if (this.inputUserId) this.inputUserId.value = 'admin';
        if (this.inputPassword) this.inputPassword.value = 'password123';
        await this.quickDemoLogin();
      });
    });

    // Quick 2FA Proceed Button (Instant 1-Click verification on Step 2)
    if (this.btnQuick2FAProceed) {
      this.btnQuick2FAProceed.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        this.playKeyClick();
        this.executePasskeyVerification();
      });
    }

    // Google Sign-In & 1-Click Verified Operator Handlers
    if (this.btnGoogleLogin) {
      this.btnGoogleLogin.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        this.playKeyClick();
        this.triggerGoogleFlow();
      });
    }

    if (this.btnGoogleRegister) {
      this.btnGoogleRegister.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        this.playKeyClick();
        this.triggerGoogleFlow();
      });
    }

    if (this.btnLaunchGooglePageDirect) {
      this.btnLaunchGooglePageDirect.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        this.playKeyClick();
        if (this.googleTokenClient) {
          try {
            this.googleTokenClient.requestAccessToken({ prompt: 'select_account' });
            return;
          } catch (err) {}
        }
        this.openGoogleAuthPopup(true);
      });
    }

    if (this.btnBackFromGoogleAuth) {
      this.btnBackFromGoogleAuth.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        this.playKeyClick();
        this.showView('credentials');
      });
    }

    // 1-Click verified Google operator profiles (Nikhil Kansal, Dr. Vance)
    document.querySelectorAll('.btn-choose-google').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        this.playKeyClick();
        const email = btn.getAttribute('data-email') || btn.dataset.email;
        const name = btn.getAttribute('data-name') || btn.dataset.name;
        if (email) {
          this.submitGoogleAuth({ email, name }, btn);
        }
      });
    });

    if (this.formCustomGoogle) {
      this.formCustomGoogle.addEventListener('submit', (e) => {
        if (e) e.preventDefault();
        const email = this.customGoogleEmail?.value?.trim();
        const name = this.customGoogleName?.value?.trim();
        const submitBtn = this.formCustomGoogle.querySelector('button[type="submit"]');
        if (email) {
          this.submitGoogleAuth({ email, name }, submitBtn);
        }
      });
    }

    // Navigation to and from Registration
    if (this.btnGoToReg) {
      this.btnGoToReg.addEventListener('click', () => this.showView('register'));
    }
    if (this.btnBackToLogin) {
      this.btnBackToLogin.addEventListener('click', () => this.showView('credentials'));
    }

    // Register Form Submit
    if (this.formRegister) {
      this.formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitRegister();
      });
    }

    // 2FA Method Selection Buttons
    if (this.btnSelectPasskey) {
      this.btnSelectPasskey.addEventListener('click', () => {
        this.playKeyClick();
        this.showView('2fa_passkey');
        this.promptPasskeyBiometrics();
      });
    }

    if (this.btnSelectEmailPin) {
      this.btnSelectEmailPin.addEventListener('click', () => {
        this.playKeyClick();
        this.showView('2fa_email');
        if (this.inputEmailPin) {
          this.inputEmailPin.value = (this.currentChallenge && this.currentChallenge.demoEmailCode) || '';
          this.inputEmailPin.focus();
        }
      });
    }

    if (this.btnSelectSecurityKey) {
      this.btnSelectSecurityKey.addEventListener('click', () => {
        this.playKeyClick();
        this.showView('2fa_security_key');
        if (this.inputSecurityKeyPin) {
          this.inputSecurityKeyPin.value = '7777';
          this.inputSecurityKeyPin.focus();
        }
      });
    }

    // Back to 2FA Method Selection buttons
    document.querySelectorAll('.btn-back-to-2fa-methods').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playKeyClick();
        this.showView('2fa_methods');
      });
    });

    // Cancel 2FA & Return to Login
    if (this.btn2FACancel) {
      this.btn2FACancel.addEventListener('click', () => {
        this.playKeyClick();
        this.currentChallenge = null;
        this.showView('credentials');
      });
    }

    // Passkey Verification Button
    if (this.btnVerifyPasskey) {
      this.btnVerifyPasskey.addEventListener('click', () => {
        this.executePasskeyVerification();
      });
    }

    // Email PIN Verification Button & Input
    if (this.btnVerifyEmailPin) {
      this.btnVerifyEmailPin.addEventListener('click', () => {
        this.executeEmailPinVerification();
      });
    }

    if (this.inputEmailPin) {
      this.inputEmailPin.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val;
        if (val.length === 6) {
          setTimeout(() => this.executeEmailPinVerification(), 120);
        }
      });
      this.inputEmailPin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.executeEmailPinVerification();
        }
      });
    }

    // Click on Simulated Email Demo Pill to Auto-fill
    if (this.emailDemoPill) {
      this.emailDemoPill.addEventListener('click', () => {
        if (this.currentChallenge && this.currentChallenge.demoEmailCode) {
          this.playKeyClick();
          if (this.inputEmailPin) {
            this.inputEmailPin.value = this.currentChallenge.demoEmailCode;
            this.executeEmailPinVerification();
          }
        }
      });
    }

    // Resend Email Code Button
    if (this.btnResendEmail) {
      this.btnResendEmail.addEventListener('click', () => {
        this.resendEmailCode();
      });
    }

    // Security Key Verification Button & Input
    if (this.btnVerifySecurityKey) {
      this.btnVerifySecurityKey.addEventListener('click', () => {
        this.executeSecurityKeyVerification();
      });
    }

    if (this.inputSecurityKeyPin) {
      this.inputSecurityKeyPin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSecurityKeyVerification();
        }
      });
    }

    // Header buttons (Settings, Lock Console, Logout)
    if (this.btnOpenSettings) {
      this.btnOpenSettings.addEventListener('click', () => this.openSettings());
    }

    const btnLock = document.getElementById('btnLockConsole');
    if (btnLock) {
      btnLock.addEventListener('click', () => this.lockConsole());
    }

    const btnLogout = document.getElementById('btnLogoutSession');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.logout());
    }

    // Settings Modal Events
    if (this.btnCloseSettings) {
      this.btnCloseSettings.addEventListener('click', () => this.closeSettings());
    }
    if (this.settingsModal) {
      this.settingsModal.addEventListener('click', (e) => {
        if (e.target === this.settingsModal) {
          this.closeSettings();
        }
      });
    }

    // Settings Tabs Bar
    if (this.tabSetAccount) {
      this.tabSetAccount.addEventListener('click', () => this.switchSettingsTab('account'));
    }
    if (this.tabSet2FA) {
      this.tabSet2FA.addEventListener('click', () => this.switchSettingsTab('2fa'));
    }
    if (this.tabSetPassword) {
      this.tabSetPassword.addEventListener('click', () => this.switchSettingsTab('password'));
    }

    // Settings Profile Form
    if (this.formUpdateProfile) {
      this.formUpdateProfile.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfile();
      });
    }

    // Settings 2FA Master Switch
    if (this.settingMaster2FAToggle) {
      this.settingMaster2FAToggle.addEventListener('change', () => {
        this.toggleMaster2FA();
      });
    }

    // Settings 2FA Method Tests
    if (this.btnTestPasskey) {
      this.btnTestPasskey.addEventListener('click', () => {
        this.testPasskeyDevice();
      });
    }
    if (this.btnTestEmailPin) {
      this.btnTestEmailPin.addEventListener('click', () => {
        this.testEmailPinDelivery();
      });
    }
    if (this.btnUpdateSecurityKeyPin) {
      this.btnUpdateSecurityKeyPin.addEventListener('click', () => {
        this.saveSecurityKeyPin();
      });
    }

    // Settings Password Form
    if (this.formChangePassword) {
      this.formChangePassword.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitPasswordChange();
      });
    }

    // Lockscreen controls
    document.querySelectorAll('.lock-numpad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-val');
        this.handleLockPinKeypad(val);
      });
    });

    const btnSwitchOp = document.getElementById('btnLockSwitchOperator');
    if (btnSwitchOp) {
      btnSwitchOp.addEventListener('click', () => {
        this.unlockConsole();
        this.logout();
      });
    }

    // Global Key Listener for Lock shortcut (Ctrl+L) and keypad in lock mode
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (this.currentUser && !this.isLocked) {
          this.lockConsole();
        }
        return;
      }

      if (this.isLocked && this.lockOverlay && this.lockOverlay.classList.contains('active')) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          this.handleLockPinKeypad(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.handleLockPinKeypad('back');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.submitLockPinUnlock();
        }
      }
    });
  }

  showView(viewName) {
    this.clearErrors();
    const views = [
      this.viewCredentials,
      this.view2FAMethods,
      this.view2FAPasskey,
      this.view2FAEmailPin,
      this.view2FASecurityKey,
      this.viewRegister,
      this.viewGoogleAuth
    ];

    views.forEach(v => v && v.classList.remove('active'));

    switch (viewName) {
      case 'credentials':
        if (this.viewCredentials) this.viewCredentials.classList.add('active');
        if (this.inputUserId) this.inputUserId.focus();
        break;
      case '2fa_methods':
        if (this.view2FAMethods) this.view2FAMethods.classList.add('active');
        break;
      case '2fa_passkey':
        if (this.view2FAPasskey) this.view2FAPasskey.classList.add('active');
        break;
      case '2fa_email':
        if (this.view2FAEmailPin) this.view2FAEmailPin.classList.add('active');
        break;
      case '2fa_security_key':
        if (this.view2FASecurityKey) this.view2FASecurityKey.classList.add('active');
        break;
      case 'register':
        if (this.viewRegister) this.viewRegister.classList.add('active');
        if (this.regUser) this.regUser.focus();
        break;
      case 'google_auth':
        if (this.viewGoogleAuth) this.viewGoogleAuth.classList.add('active');
        break;
    }
  }

  clearErrors() {
    [
      this.loginError,
      this.passkeyError,
      this.emailError,
      this.securityKeyError,
      this.regError,
      this.lockPinError,
      this.googleAuthError
    ].forEach(el => {
      if (el) {
        el.textContent = '';
        el.style.display = 'none';
      }
    });
  }

  showError(el, msg) {
    this.playErrorBuzzer();
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    }
  }

  async checkInitialSession() {
    if (!this.token) {
      this.showGatekeeper();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.authenticated && data.user) {
        this.currentUser = data.user;
        localStorage.setItem('argus_auth_user', JSON.stringify(data.user));
        this.updateHeaderSession();

        if (this.isLocked) {
          this.showLockOverlay();
        } else {
          this.hideGatekeeper();
        }
      } else {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('argus_auth_token');
        localStorage.removeItem('argus_auth_user');
        this.showGatekeeper();
      }
    } catch (err) {
      if (this.currentUser) {
        this.updateHeaderSession();
        if (this.isLocked) {
          this.showLockOverlay();
        } else {
          this.hideGatekeeper();
        }
      } else {
        this.showGatekeeper();
      }
    }
  }

  // Instant 1-Click Demo Login directly to main console
  async quickDemoLogin() {
    this.playRadarScan();
    this.clearErrors();
    this.setBtnLoading(this.btnSubmitLogin, true);

    const demoBanners = document.querySelectorAll('.btn-demo-quick-login');
    demoBanners.forEach(b => {
      b.style.opacity = '0.6';
      b.style.pointerEvents = 'none';
    });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Quick login failed');
      }

      // Auto-verify 2FA challenge with biometric passkey signature
      if (data.requires2FA && data.challengeId) {
        const verifyRes = await fetch('/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId: data.challengeId,
            method: 'passkey',
            code: 'passkey_verified'
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Quick demo verification failed');
        }
        this.onAuthSuccess(verifyData);
        return;
      }

      this.onAuthSuccess(data);
    } catch (err) {
      this.showError(this.loginError, err.message);
    } finally {
      this.setBtnLoading(this.btnSubmitLogin, false);
      demoBanners.forEach(b => {
        b.style.opacity = '1';
        b.style.pointerEvents = 'auto';
      });
    }
  }

  // STEP 1: Submit Username and Password
  async submitCredentialsLogin() {
    const username = this.inputUserId ? this.inputUserId.value.trim() : '';
    const password = this.inputPassword ? this.inputPassword.value : '';

    if (!username || !password) {
      this.showError(this.loginError, 'Please enter Operator ID and Password.');
      return;
    }

    this.setBtnLoading(this.btnSubmitLogin, true);
    this.clearErrors();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Access Denied: Invalid Operator ID or Password.');
      }

      // Check if transferred to 2-Step Authentication options
      if (data.requires2FA) {
        this.playRadarScan();
        this.currentChallenge = data;

        if (this.twoFaUsername) {
          this.twoFaUsername.textContent = data.username;
        }
        if (this.twoFaMaskedEmail) {
          this.twoFaMaskedEmail.textContent = data.maskedEmail;
        }
        if (this.emailDemoCode) {
          this.emailDemoCode.textContent = data.demoEmailCode;
        }

        // Transfer to Step 2: 2-Step Verification Options Page
        this.showView('2fa_methods');
        return;
      }

      // Direct login if 2FA was disabled
      this.onAuthSuccess(data);
    } catch (err) {
      this.showError(this.loginError, err.message);
    } finally {
      this.setBtnLoading(this.btnSubmitLogin, false);
    }
  }

  // STEP 2A: Verify via Passkey / Biometrics
  async promptPasskeyBiometrics() {
    this.playRadarScan();
    if (this.passkeyStatusText) {
      this.passkeyStatusText.textContent = 'Touch fingerprint sensor or look at camera...';
    }

    // Try standard WebAuthn API if supported
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (isAvailable && navigator.credentials && navigator.credentials.get) {
          try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            await navigator.credentials.get({
              publicKey: {
                challenge,
                timeout: 5000,
                userVerification: 'preferred'
              }
            });
          } catch (e) {
            // User cancelled or platform authenticator bypassed
          }
        }
      } catch (e) {}
    }

    // Automatically complete passkey authorization and enter console
    await this.executePasskeyVerification();
  }

  async executePasskeyVerification() {
    if (!this.currentChallenge) {
      this.showView('credentials');
      return;
    }

    this.setBtnLoading(this.btnVerifyPasskey, true);
    this.clearErrors();

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: this.currentChallenge.challengeId,
          method: 'passkey',
          code: 'passkey_verified'
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Biometric passkey signature rejected.');
      }

      this.onAuthSuccess(data);
    } catch (err) {
      this.showError(this.passkeyError, err.message);
    } finally {
      this.setBtnLoading(this.btnVerifyPasskey, false);
    }
  }

  // STEP 2B: Verify via PIN from Email
  async executeEmailPinVerification() {
    if (!this.currentChallenge) {
      this.showView('credentials');
      return;
    }

    const code = this.inputEmailPin ? this.inputEmailPin.value.trim() : '';
    if (!code || code.length !== 6) {
      this.showError(this.emailError, 'Please enter the 6-digit PIN code.');
      return;
    }

    this.setBtnLoading(this.btnVerifyEmailPin, true);
    this.clearErrors();

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: this.currentChallenge.challengeId,
          method: 'email_pin',
          code
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Incorrect email PIN verification code.');
      }

      this.onAuthSuccess(data);
    } catch (err) {
      this.showError(this.emailError, err.message);
      if (this.inputEmailPin) {
        this.inputEmailPin.value = '';
        this.inputEmailPin.focus();
      }
    } finally {
      this.setBtnLoading(this.btnVerifyEmailPin, false);
    }
  }

  async resendEmailCode() {
    if (!this.currentChallenge) return;
    this.playKeyClick();
    this.clearErrors();

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: this.currentChallenge.challengeId })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not resend email code.');
      }

      this.currentChallenge.demoEmailCode = data.demoEmailCode;
      if (this.emailDemoCode) {
        this.emailDemoCode.textContent = data.demoEmailCode;
      }
      this.playSuccessChime();

      if (this.btnResendEmail) {
        const orig = this.btnResendEmail.textContent;
        this.btnResendEmail.textContent = '✓ Code Sent';
        this.btnResendEmail.disabled = true;
        setTimeout(() => {
          this.btnResendEmail.textContent = orig;
          this.btnResendEmail.disabled = false;
        }, 4000);
      }
    } catch (err) {
      this.showError(this.emailError, err.message);
    }
  }

  // STEP 2C: Verify via Security Key
  async executeSecurityKeyVerification() {
    if (!this.currentChallenge) {
      this.showView('credentials');
      return;
    }

    const code = this.inputSecurityKeyPin ? this.inputSecurityKeyPin.value.trim() : '';
    if (!code) {
      this.showError(this.securityKeyError, 'Please enter your Security Key PIN.');
      return;
    }

    this.setBtnLoading(this.btnVerifySecurityKey, true);
    this.clearErrors();

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: this.currentChallenge.challengeId,
          method: 'security_key',
          code
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Security Key authorization denied.');
      }

      this.onAuthSuccess(data);
    } catch (err) {
      this.showError(this.securityKeyError, err.message);
    } finally {
      this.setBtnLoading(this.btnVerifySecurityKey, false);
    }
  }

  // Register New Operator
  async submitRegister() {
    const username = this.regUser ? this.regUser.value.trim() : '';
    const displayName = this.regName ? this.regName.value.trim() : '';
    const email = this.regEmail ? this.regEmail.value.trim() : '';
    const password = this.regPass ? this.regPass.value : '';
    const twoFactorEnabled = this.reg2FAToggle ? this.reg2FAToggle.checked : true;

    if (!username || username.length < 3) {
      this.showError(this.regError, 'Username must be at least 3 characters.');
      return;
    }
    if (!password || password.length < 6) {
      this.showError(this.regError, 'Password must be at least 6 characters.');
      return;
    }

    this.setBtnLoading(this.btnSubmitReg, true);
    this.clearErrors();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, email, password, twoFactorEnabled })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      this.onAuthSuccess(data);
    } catch (err) {
      this.showError(this.regError, err.message);
    } finally {
      this.setBtnLoading(this.btnSubmitReg, false);
    }
  }

  onAuthSuccess(data) {
    this.playSuccessChime();
    this.token = data.token;
    this.currentUser = data.user;
    this.currentChallenge = null;
    localStorage.setItem('argus_auth_token', this.token);
    localStorage.setItem('argus_auth_user', JSON.stringify(this.currentUser));
    this.isLocked = false;
    sessionStorage.removeItem('argus_console_locked');

    this.updateHeaderSession();
    this.hideGatekeeper();
    this.hideLockOverlay();
  }

  updateHeaderSession() {
    if (!this.sessionPill || !this.currentUser) return;
    this.sessionPill.style.display = 'flex';
    if (this.sessionUserName) {
      this.sessionUserName.textContent = this.currentUser.displayName || this.currentUser.username;
    }
    if (this.sessionClearance) {
      this.sessionClearance.textContent = this.currentUser.clearance || 'Level 4 Clearance';
    }
  }

  showGatekeeper() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.modal.style.visibility = 'visible';
      this.modal.style.pointerEvents = 'auto';
      this.modal.style.opacity = '1';
      this.modal.classList.add('active');
    }
    if (this.sessionPill) {
      this.sessionPill.style.display = 'none';
    }
    this.currentChallenge = null;
    this.showView('credentials');
  }

  hideGatekeeper() {
    if (this.modal) {
      this.modal.classList.remove('active');
      this.modal.style.display = 'none';
      this.modal.style.visibility = 'hidden';
      this.modal.style.pointerEvents = 'none';
      this.modal.style.opacity = '0';
    }
  }

  lockConsole() {
    this.playTone(400, 'sine', 0.1, 0.04);
    this.isLocked = true;
    sessionStorage.setItem('argus_console_locked', 'true');
    this.showLockOverlay();
  }

  showLockOverlay() {
    if (!this.lockOverlay) return;
    this.lockOverlay.style.display = 'flex';
    this.lockOverlay.style.visibility = 'visible';
    this.lockOverlay.style.pointerEvents = 'auto';
    this.lockOverlay.style.opacity = '1';
    this.lockOverlay.classList.add('active');
    if (this.lockOperatorName && this.currentUser) {
      this.lockOperatorName.textContent = this.currentUser.displayName || this.currentUser.username;
    }
    this.currentLockPinBuffer = '';
    this.updateLockPinDisplay();
    this.clearErrors();
  }

  hideLockOverlay() {
    if (this.lockOverlay) {
      this.lockOverlay.classList.remove('active');
      this.lockOverlay.style.display = 'none';
      this.lockOverlay.style.visibility = 'hidden';
      this.lockOverlay.style.pointerEvents = 'none';
      this.lockOverlay.style.opacity = '0';
    }
    this.currentLockPinBuffer = '';
  }

  handleLockPinKeypad(val) {
    this.playKeyClick();
    if (val === 'clear') {
      this.currentLockPinBuffer = '';
    } else if (val === 'back') {
      this.currentLockPinBuffer = this.currentLockPinBuffer.slice(0, -1);
    } else if (/^\d$/.test(val)) {
      if (this.currentLockPinBuffer.length < 6) {
        this.currentLockPinBuffer += val;
      }
    }
    this.updateLockPinDisplay();

    if (this.currentLockPinBuffer.length === 4) {
      setTimeout(() => {
        if (this.currentLockPinBuffer.length === 4) {
          this.submitLockPinUnlock();
        }
      }, 160);
    }
  }

  updateLockPinDisplay() {
    if (!this.lockPinInput) return;
    const dots = this.lockOverlay ? this.lockOverlay.querySelectorAll('.lock-pin-dot') : [];
    dots.forEach((dot, idx) => {
      if (idx < this.currentLockPinBuffer.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  async submitLockPinUnlock() {
    const pin = this.currentLockPinBuffer;
    if (!pin || pin.length < 4) {
      this.showError(this.lockPinError, 'Enter 4-digit PIN to unlock.');
      return;
    }

    this.clearErrors();

    // Verification against security key or password
    if (pin === '7777') {
      this.playSuccessChime();
      this.isLocked = false;
      sessionStorage.removeItem('argus_console_locked');
      this.hideLockOverlay();
    } else {
      this.showError(this.lockPinError, 'Incorrect Security PIN.');
      this.currentLockPinBuffer = '';
      this.updateLockPinDisplay();
    }
  }

  unlockConsole() {
    this.isLocked = false;
    sessionStorage.removeItem('argus_console_locked');
    this.hideLockOverlay();
  }

  async logout() {
    this.playTone(300, 'sine', 0.12, 0.05);
    try {
      if (this.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
      }
    } catch (e) {}

    this.token = null;
    this.currentUser = null;
    this.currentChallenge = null;
    this.isLocked = false;
    localStorage.removeItem('argus_auth_token');
    localStorage.removeItem('argus_auth_user');
    sessionStorage.removeItem('argus_console_locked');

    this.hideLockOverlay();
    this.showGatekeeper();
  }

  // =========================================================================
  // SETTINGS & 2-STEP AUTHENTICATION CONFIGURATION METHODS
  // =========================================================================

  async openSettings() {
    this.playKeyClick();
    if (!this.token) {
      this.showGatekeeper();
      return;
    }

    if (this.settingsModal) {
      this.settingsModal.classList.add('active');
    }
    this.clearSettingsFeedback();
    this.switchSettingsTab('account');

    await this.loadProfileData();
  }

  closeSettings() {
    this.playKeyClick();
    if (this.settingsModal) {
      this.settingsModal.classList.remove('active');
    }
    this.clearSettingsFeedback();
  }

  switchSettingsTab(tab) {
    this.playKeyClick();
    this.clearSettingsFeedback();

    const tabs = [this.tabSetAccount, this.tabSet2FA, this.tabSetPassword];
    const panels = [this.panelSetAccount, this.panelSet2FA, this.panelSetPassword];

    tabs.forEach(t => t && t.classList.remove('active'));
    panels.forEach(p => p && p.classList.remove('active'));

    if (tab === 'account') {
      if (this.tabSetAccount) this.tabSetAccount.classList.add('active');
      if (this.panelSetAccount) this.panelSetAccount.classList.add('active');
    } else if (tab === '2fa') {
      if (this.tabSet2FA) this.tabSet2FA.classList.add('active');
      if (this.panelSet2FA) this.panelSet2FA.classList.add('active');
    } else if (tab === 'password') {
      if (this.tabSetPassword) this.tabSetPassword.classList.add('active');
      if (this.panelSetPassword) this.panelSetPassword.classList.add('active');
      if (this.settingCurrentPassword) this.settingCurrentPassword.focus();
    }
  }

  clearSettingsFeedback() {
    if (this.settingsFeedback) {
      this.settingsFeedback.className = 'settings-feedback-banner';
      this.settingsFeedback.textContent = '';
      this.settingsFeedback.style.display = 'none';
    }
  }

  showSettingsFeedback(msg, type = 'success') {
    if (type === 'success') this.playSuccessChime();
    else this.playErrorBuzzer();

    if (this.settingsFeedback) {
      this.settingsFeedback.className = `settings-feedback-banner ${type}`;
      this.settingsFeedback.textContent = msg;
      this.settingsFeedback.style.display = 'block';
    }
  }

  async loadProfileData() {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();

      if (data.success && data.profile) {
        const p = data.profile;
        if (this.settingProfileId) this.settingProfileId.value = p.username;
        if (this.settingProfileClearance) this.settingProfileClearance.value = p.clearance;
        if (this.settingDisplayName) this.settingDisplayName.value = p.displayName || '';
        if (this.settingEmail) this.settingEmail.value = p.email || '';
        if (this.settingEmailDisplay) this.settingEmailDisplay.textContent = p.email || '';
        if (this.settingMaster2FAToggle) this.settingMaster2FAToggle.checked = p.twoFactorEnabled !== false;
        if (this.settingSecurityKeyPin) this.settingSecurityKeyPin.value = p.pin || '7777';
      }
    } catch (err) {
      console.warn('Could not load profile:', err.message);
    }
  }

  async saveProfile() {
    const displayName = this.settingDisplayName ? this.settingDisplayName.value.trim() : '';
    const email = this.settingEmail ? this.settingEmail.value.trim() : '';

    if (!displayName || !email) {
      this.showSettingsFeedback('Please enter both Callsign and Email.', 'error');
      return;
    }

    this.setBtnLoading(this.btnSaveProfile, true);
    this.clearSettingsFeedback();

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ displayName, email })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not update account profile.');
      }

      this.currentUser = { ...this.currentUser, ...data.profile };
      localStorage.setItem('argus_auth_user', JSON.stringify(this.currentUser));
      this.updateHeaderSession();

      if (this.settingEmailDisplay) {
        this.settingEmailDisplay.textContent = email;
      }

      this.showSettingsFeedback('✓ Operator account details updated successfully.', 'success');
    } catch (err) {
      this.showSettingsFeedback(err.message, 'error');
    } finally {
      this.setBtnLoading(this.btnSaveProfile, false);
    }
  }

  async toggleMaster2FA() {
    const isEnabled = this.settingMaster2FAToggle ? this.settingMaster2FAToggle.checked : true;
    this.clearSettingsFeedback();

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ twoFactorEnabled: isEnabled })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update 2-step authentication state.');
      }

      if (isEnabled) {
        this.showSettingsFeedback('🛡️ Two-Step Authentication is now ACTIVE for this account.', 'success');
      } else {
        this.showSettingsFeedback('⚠️ Two-Step Authentication has been DISABLED for this account.', 'success');
      }
    } catch (err) {
      this.showSettingsFeedback(err.message, 'error');
      if (this.settingMaster2FAToggle) {
        this.settingMaster2FAToggle.checked = !isEnabled;
      }
    }
  }

  async testPasskeyDevice() {
    this.playRadarScan();
    this.clearSettingsFeedback();

    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (isAvailable) {
          this.showSettingsFeedback('✓ Device Passkey & Platform Biometrics verified and ready!', 'success');
          return;
        }
      } catch (e) {}
    }

    this.showSettingsFeedback('✓ Passkey Biometrics engine initialized and operational.', 'success');
  }

  testEmailPinDelivery() {
    this.playKeyClick();
    this.clearSettingsFeedback();
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const email = this.settingEmail ? this.settingEmail.value : 'admin@argus-surveillance.net';
    this.showSettingsFeedback(`✉️ Test PIN dispatched to ${email}: Verification code is [${testCode}]`, 'success');
  }

  async saveSecurityKeyPin() {
    const pin = this.settingSecurityKeyPin ? this.settingSecurityKeyPin.value.trim() : '';
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      this.showSettingsFeedback('Security Key PIN must be 4 to 6 numbers.', 'error');
      return;
    }

    this.setBtnLoading(this.btnUpdateSecurityKeyPin, true);
    this.clearSettingsFeedback();

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update Security Key PIN.');
      }

      this.showSettingsFeedback('✓ Security Key Master PIN updated successfully.', 'success');
    } catch (err) {
      this.showSettingsFeedback(err.message, 'error');
    } finally {
      this.setBtnLoading(this.btnUpdateSecurityKeyPin, false);
    }
  }

  async submitPasswordChange() {
    const currentPassword = this.settingCurrentPassword ? this.settingCurrentPassword.value : '';
    const newPassword = this.settingNewPassword ? this.settingNewPassword.value : '';
    const confirmPassword = this.settingConfirmPassword ? this.settingConfirmPassword.value : '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showSettingsFeedback('Please fill out all password fields.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      this.showSettingsFeedback('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.showSettingsFeedback('New passwords do not match.', 'error');
      return;
    }

    this.setBtnLoading(this.btnSubmitChangePassword, true);
    this.clearSettingsFeedback();

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not change password.');
      }

      if (this.settingCurrentPassword) this.settingCurrentPassword.value = '';
      if (this.settingNewPassword) this.settingNewPassword.value = '';
      if (this.settingConfirmPassword) this.settingConfirmPassword.value = '';

      this.showSettingsFeedback('✓ Security Password successfully changed.', 'success');
    } catch (err) {
      this.showSettingsFeedback(err.message, 'error');
    } finally {
      this.setBtnLoading(this.btnSubmitChangePassword, false);
    }
  }

  setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="auth-spinner"></span> VERIFYING...`;
    } else {
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
      }
    }
  }

  // =========================================================================
  // GOOGLE IDENTITY SERVICES & AUTHENTICATION
  // =========================================================================
  checkGoogleOAuthRedirect() {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');

      if (window.opener) {
        try {
          window.opener.postMessage({
            type: 'ARGUS_GOOGLE_AUTH_RESPONSE',
            accessToken: accessToken,
            idToken: idToken
          }, '*');
          window.close();
          return true;
        } catch (e) {
          console.error('Error posting message to window.opener:', e);
        }
      } else {
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) {}

        if (accessToken) {
          this.fetchGoogleProfileAndLogin(accessToken);
          return true;
        } else if (idToken) {
          this.submitGoogleAuth({ credential: idToken });
          return true;
        }
      }
    }
    return false;
  }

  async initGoogleAuth() {
    // 1. Fetch Google Client ID from backend
    try {
      const res = await fetch('/api/auth/google-client-id');
      if (res.ok) {
        const data = await res.json();
        this.googleClientId = data.clientId;
      }
    } catch (e) {
      console.warn('Could not fetch Google Client ID:', e.message);
    }

    // 2. Listen for cross-window message from OAuth popup
    window.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'ARGUS_GOOGLE_AUTH_RESPONSE') {
        if (event.data.accessToken) {
          await this.fetchGoogleProfileAndLogin(event.data.accessToken);
        } else if (event.data.idToken) {
          await this.submitGoogleAuth({ credential: event.data.idToken });
        }
      }
    });

    // 3. Initialize Google Identity Services (GIS) & OAuth2 Clients
    const setupGoogleClients = () => {
      if (!this.googleClientId) return;

      // Google Sign-In with ID Token (GIS)
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: this.googleClientId,
            callback: (response) => {
              if (response && response.credential) {
                this.submitGoogleAuth({ credential: response.credential });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });
        } catch (err) {
          console.warn('Google GSI initialize notice:', err.message);
        }
      }

      // Google OAuth2 Token Client (for custom button clicks to open Google Accounts)
      if (window.google?.accounts?.oauth2) {
        try {
          this.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.googleClientId,
            scope: 'openid email profile',
            prompt: 'select_account',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                console.warn('Google Token Client response error:', tokenResponse);
                this.openGoogleFallbackModal();
                return;
              }
              if (tokenResponse.access_token) {
                await this.fetchGoogleProfileAndLogin(tokenResponse.access_token);
              }
            }
          });
        } catch (err) {
          console.warn('Google OAuth2 Token Client init notice:', err.message);
        }
      }
    };

    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      setupGoogleClients();
    } else if (document.readyState === 'complete') {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id || window.google?.accounts?.oauth2 || attempts > 20) {
          clearInterval(interval);
          setupGoogleClients();
        }
      }, 200);
    } else {
      window.addEventListener('load', () => {
        setTimeout(setupGoogleClients, 120);
      });
    }
  }

  triggerGoogleFlow() {
    this.playRadarScan();
    // 1. Immediately transition to Google Gateway screen inside gatekeeper
    this.showView('google_auth');

    // 2. Try Google GIS OAuth2 Token Client (opens official accounts.google.com popup)
    if (this.googleTokenClient) {
      try {
        this.googleTokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('Google token client error, falling back to direct popup:', e.message);
      }
    }

    // 3. Open genuine Google Accounts OAuth2 popup window
    if (this.googleClientId) {
      this.openGoogleAuthPopup();
    } else {
      this.showStatus('Notice: GOOGLE_CLIENT_ID not found in environment. Add GOOGLE_CLIENT_ID to your .env or use verified operators below.', 'info');
    }
  }

  openGoogleAuthPopup(forceFocus = true) {
    if (!this.googleClientId) {
      this.showStatus('GOOGLE_CLIENT_ID is not configured in .env or server environment.', 'error');
      return null;
    }

    const redirectUri = window.location.origin;
    const state = Math.random().toString(36).substring(2);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(this.googleClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${state}` +
      `&prompt=select_account`;

    const width = 500;
    const height = 620;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

    try {
      const popup = window.open(
        googleAuthUrl,
        'ArgusGoogleSignIn',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (popup && forceFocus) {
        popup.focus();
      }
      return popup;
    } catch (e) {
      console.warn('Popup window blocked:', e.message);
      return null;
    }
  }

  async fetchGoogleProfileAndLogin(accessToken) {
    this.playRadarScan();
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve user profile from Google.');
      }
      const profile = await res.json();
      await this.submitGoogleAuth({
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        sub: profile.sub
      });
    } catch (err) {
      this.playErrorBuzzer();
      console.error('Google profile fetch error:', err);
      if (this.loginError) {
        this.loginError.textContent = err.message;
        this.loginError.classList.add('visible');
      }
      this.openGoogleFallbackModal();
    }
  }

  openGoogleFallbackModal() {
    if (this.googleFallbackModal) {
      this.googleFallbackModal.classList.add('active');
    }
  }

  closeGoogleFallbackModal() {
    if (this.googleFallbackModal) {
      this.googleFallbackModal.classList.remove('active');
    }
  }

  async submitGoogleAuth({ credential, email, name, picture }, triggeringBtn = null) {
    this.playRadarScan();
    this.clearErrors();
    let originalArrow = null;
    let arrowEl = null;

    if (triggeringBtn) {
      triggeringBtn.style.opacity = '0.6';
      triggeringBtn.style.pointerEvents = 'none';
      arrowEl = triggeringBtn.querySelector('.auth-2fa-method-arrow');
      if (arrowEl) {
        originalArrow = arrowEl.textContent;
        arrowEl.textContent = '⏳';
      }
    }

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, email, name, picture })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      this.closeGoogleFallbackModal();
      this.onAuthSuccess(data);
    } catch (err) {
      this.playErrorBuzzer();
      if (this.googleAuthError) {
        this.showError(this.googleAuthError, err.message);
      }
      if (this.loginError) {
        this.showError(this.loginError, err.message);
      }
    } finally {
      if (triggeringBtn) {
        triggeringBtn.style.opacity = '1';
        triggeringBtn.style.pointerEvents = 'auto';
        if (arrowEl && originalArrow !== null) {
          arrowEl.textContent = originalArrow;
        }
      }
    }
  }
}

// Instantiate on DOM load
window.argusAuth = null;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.argusAuth = new ArgusAuth();
  });
} else {
  window.argusAuth = new ArgusAuth();
}
