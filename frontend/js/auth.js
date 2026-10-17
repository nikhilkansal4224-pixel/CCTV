/**
 * ARGUS SURREAL CCTV // STANDALONE AUTHENTICATION GATEKEEPER
 * 100% Client-Side Pure UI Flow - Zero External Dependencies & Zero Network Connections
 *
 * Page Flow:
 * 1. Main Login Page: Google Button, Username Input, Sign In Button, Sign Up Button, Guest Account
 * 2. Verification Selection Page: Shows only operator's enabled 2-step methods & Forgot Password
 * 3. Specific Verification Views: Password, Email PIN (w/ instant code pill), Passkey, Security Key
 * 4. Sign Up View: Local operator creation with customizable 2FA methods
 * 5. Forgot Password View: Self-contained recovery flow
 * 6. Guest Mode: Instant 1-click read-only console entry
 */

(function () {
  'use strict';

  // Seed default operators stored locally (no remote database connection required)
  const DEFAULT_OPERATORS = {
    admin: {
      username: 'admin',
      displayName: 'Lead Sentinel Admin',
      email: 'admin@argus-surveillance.net',
      password: 'password123',
      securityPin: '7777',
      role: 'admin',
      clearance: 'Level 4 Sentinel Clearance',
      enabledMethods: ['password', 'email_pin', 'passkey', 'security_key']
    },
    nikhil: {
      username: 'nikhil',
      displayName: 'Nikhil Kansal',
      email: 'nikhilkansal4224@gmail.com',
      password: 'password123',
      securityPin: '7777',
      role: 'admin',
      clearance: 'Command Clearance',
      enabledMethods: ['password', 'passkey', 'email_pin']
    },
    operator: {
      username: 'operator',
      displayName: 'Surveillance Operator',
      email: 'operator@argus.sec',
      password: 'password123',
      securityPin: '7777',
      role: 'operator',
      clearance: 'Level 2 Surveillance Clearance',
      enabledMethods: ['password', 'email_pin']
    }
  };

  class ArgusAuth {
    constructor() {
      this.users = this.loadUsers();
      this.currentUser = null;
      try {
        this.currentUser = JSON.parse(localStorage.getItem('argus_auth_user') || 'null');
      } catch (e) {
        this.currentUser = null;
      }

      this.isLocked = sessionStorage.getItem('argus_console_locked') === 'true';
      this.activePendingUser = null;
      this.generatedEmailPin = '849201';
      this.generatedResetCode = '123456';
      this.currentLockPinBuffer = '';
      this.audioCtx = null;

      // DOM Elements
      this.initDomElements();
      this.init();
    }

    // =========================================================================
    // LOCAL STATE STORAGE (NO NETWORK REQUIRED)
    // =========================================================================
    loadUsers() {
      try {
        const stored = localStorage.getItem('argus_local_users');
        if (stored) {
          return { ...DEFAULT_OPERATORS, ...JSON.parse(stored) };
        }
      } catch (e) {}
      return { ...DEFAULT_OPERATORS };
    }

    saveUsers() {
      try {
        localStorage.setItem('argus_local_users', JSON.stringify(this.users));
      } catch (e) {}
    }

    getUser(username) {
      if (!username) return null;
      const key = username.trim().toLowerCase();
      return this.users[key] || null;
    }

    saveUser(user) {
      const key = user.username.trim().toLowerCase();
      this.users[key] = user;
      this.saveUsers();
    }

    // =========================================================================
    // DOM ELEMENTS INITIALIZATION
    // =========================================================================
    initDomElements() {
      // Modals & Overlays
      this.modal = document.getElementById('authGatekeeperModal');
      this.lockOverlay = document.getElementById('lockedTerminalOverlay');
      this.sessionPill = document.getElementById('userSessionPill');
      this.sessionUserName = document.getElementById('sessionUserName');
      this.sessionClearance = document.getElementById('sessionUserClearance');
      this.btnLogoutHeader = document.getElementById('btnLogoutHeader');
      this.btnOpenSettings = document.getElementById('btnOpenSettings');

      // Views
      this.viewCredentials = document.getElementById('viewCredentials');
      this.view2FAMethods = document.getElementById('view2FAMethods');
      this.viewVerifyPassword = document.getElementById('viewVerifyPassword');
      this.view2FAPasskey = document.getElementById('view2FAPasskey');
      this.view2FAEmailPin = document.getElementById('view2FAEmailPin');
      this.view2FASecurityKey = document.getElementById('view2FASecurityKey');
      this.viewForgotPassword = document.getElementById('viewForgotPassword');
      this.viewRegister = document.getElementById('viewRegister');
      this.viewGoogleAuth = document.getElementById('viewGoogleAuth');

      // Page 1 Elements: Login
      this.btnGoogleLogin = document.getElementById('btnGoogleLogin');
      this.inputUserId = document.getElementById('loginUserId');
      this.formLogin = document.getElementById('formLoginCredentials');
      this.btnSubmitLogin = document.getElementById('btnSubmitLogin');
      this.btnGoToRegister = document.getElementById('btnGoToRegister');
      this.btnGuestLogin = document.getElementById('btnGuestLogin');
      this.loginError = document.getElementById('loginErrorBanner');

      // Page 2 Elements: Method Selection
      this.twoFaUsernameDisplay = document.getElementById('twoFaUsernameDisplay');
      this.btnChangeOperator = document.getElementById('btnChangeOperator');
      this.btn2FACancel = document.getElementById('btn2FACancel');
      this.btnSelectPassword = document.getElementById('btnSelectPassword');
      this.btnSelectEmailPin = document.getElementById('btnSelectEmailPin');
      this.btnSelectPasskey = document.getElementById('btnSelectPasskey');
      this.btnSelectSecurityKey = document.getElementById('btnSelectSecurityKey');
      this.btnGoToForgotPassword = document.getElementById('btnGoToForgotPassword');

      // Password View Elements
      this.verifyPassUsernameDisplay = document.getElementById('verifyPassUsernameDisplay');
      this.formVerifyPassword = document.getElementById('formVerifyPassword');
      this.verifyPasswordInput = document.getElementById('verifyPasswordInput');
      this.btnToggleVerifyPassword = document.getElementById('btnToggleVerifyPassword');
      this.btnSubmitVerifyPassword = document.getElementById('btnSubmitVerifyPassword');
      this.verifyPasswordError = document.getElementById('verifyPasswordErrorBanner');

      // Email PIN View Elements
      this.twoFaMaskedEmail = document.getElementById('twoFaMaskedEmail');
      this.emailDemoPill = document.getElementById('emailDemoPill');
      this.emailDemoCode = document.getElementById('emailDemoCode');
      this.inputEmailPin = document.getElementById('inputEmailPin');
      this.btnResendEmailCode = document.getElementById('btnResendEmailCode');
      this.btnVerifyEmailPin = document.getElementById('btnVerifyEmailPin');
      this.emailError = document.getElementById('emailErrorBanner');

      // Passkey View Elements
      this.btnVerifyPasskey = document.getElementById('btnVerifyPasskey');
      this.passkeyError = document.getElementById('passkeyErrorBanner');
      this.passkeyStatusText = document.getElementById('passkeyStatusText');

      // Security Key View Elements
      this.inputSecurityKeyPin = document.getElementById('inputSecurityKeyPin');
      this.btnVerifySecurityKey = document.getElementById('btnVerifySecurityKey');
      this.securityKeyError = document.getElementById('securityKeyErrorBanner');

      // Forgot Password Elements
      this.forgotPassMaskedEmail = document.getElementById('forgotPassMaskedEmail');
      this.resetDemoPill = document.getElementById('resetDemoPill');
      this.resetDemoCode = document.getElementById('resetDemoCode');
      this.formForgotPassword = document.getElementById('formForgotPassword');
      this.inputResetCode = document.getElementById('inputResetCode');
      this.inputResetNewPassword = document.getElementById('inputResetNewPassword');
      this.inputResetConfirmPassword = document.getElementById('inputResetConfirmPassword');
      this.btnResendResetCode = document.getElementById('btnResendResetCode');
      this.btnSubmitResetPassword = document.getElementById('btnSubmitResetPassword');
      this.resetPasswordError = document.getElementById('resetPasswordErrorBanner');

      // Sign Up Elements
      this.btnGoogleRegister = document.getElementById('btnGoogleRegister');
      this.formRegister = document.getElementById('formRegisterOperator');
      this.regUserId = document.getElementById('regUsername');
      this.regDisplayName = document.getElementById('regDisplayName');
      this.regEmail = document.getElementById('regEmail');
      this.regPassword = document.getElementById('regPassword');
      this.reg2FAToggle = document.getElementById('reg2FAToggle');
      this.btnSubmitReg = document.getElementById('btnSubmitReg');
      this.btnBackToLogin = document.getElementById('btnBackToLogin');
      this.regError = document.getElementById('regErrorBanner');

      // Google Mock Selection View
      this.btnBackFromGoogleAuth = document.getElementById('btnBackFromGoogleAuth');
      this.formCustomGoogle = document.getElementById('formCustomGoogleLogin');
      this.customGoogleEmail = document.getElementById('customGoogleEmail');
      this.customGoogleName = document.getElementById('customGoogleName');

      // Console Lockpad Elements
      this.lockOperatorName = document.getElementById('lockOperatorName');
      this.lockPinInput = document.getElementById('lockPinInput');
      this.lockPinError = document.getElementById('lockPinError');
      this.btnLockEmergencyExit = document.getElementById('btnLockEmergencyExit');

      // Settings Modal
      this.settingsModal = document.getElementById('settingsModal');
      this.btnCloseSettings = document.getElementById('btnCloseSettings');
    }

    // =========================================================================
    // STARTUP & INITIAL SESSION CHECK
    // =========================================================================
    init() {
      this.bindEvents();

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

    // =========================================================================
    // AUDIO CUES
    // =========================================================================
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
      this.playTone(523.25, 'sine', 0.1, 0.06);
      setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.06), 90);
      setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.07), 180);
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

    // =========================================================================
    // UI NAVIGATION / VIEW SWITCHER
    // =========================================================================
    showView(viewName) {
      this.clearErrors();
      const views = [
        this.viewCredentials,
        this.view2FAMethods,
        this.viewVerifyPassword,
        this.viewForgotPassword,
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
          if (this.inputUserId) {
            this.inputUserId.value = '';
            setTimeout(() => this.inputUserId.focus(), 50);
          }
          break;

        case '2fa_methods':
          if (this.view2FAMethods) this.view2FAMethods.classList.add('active');
          this.renderEnabledMethods();
          break;

        case 'verify_password':
          if (this.viewVerifyPassword) this.viewVerifyPassword.classList.add('active');
          if (this.verifyPassUsernameDisplay && this.activePendingUser) {
            this.verifyPassUsernameDisplay.textContent = this.activePendingUser.displayName || this.activePendingUser.username;
          }
          if (this.verifyPasswordInput) {
            this.verifyPasswordInput.value = '';
            setTimeout(() => this.verifyPasswordInput.focus(), 50);
          }
          break;

        case '2fa_email':
          if (this.view2FAEmailPin) this.view2FAEmailPin.classList.add('active');
          if (this.twoFaMaskedEmail && this.activePendingUser) {
            this.twoFaMaskedEmail.textContent = this.activePendingUser.email || 'operator@argus.sec';
          }
          this.generateNewEmailPin();
          if (this.inputEmailPin) {
            this.inputEmailPin.value = '';
            setTimeout(() => this.inputEmailPin.focus(), 50);
          }
          break;

        case '2fa_passkey':
          if (this.view2FAPasskey) this.view2FAPasskey.classList.add('active');
          if (this.passkeyStatusText) {
            this.passkeyStatusText.textContent = 'Touch your biometric sensor or click Authorize below...';
            this.passkeyStatusText.style.color = 'var(--text-muted)';
          }
          break;

        case '2fa_security_key':
          if (this.view2FASecurityKey) this.view2FASecurityKey.classList.add('active');
          if (this.inputSecurityKeyPin) {
            this.inputSecurityKeyPin.value = '';
            setTimeout(() => this.inputSecurityKeyPin.focus(), 50);
          }
          break;

        case 'forgot_password':
          if (this.viewForgotPassword) this.viewForgotPassword.classList.add('active');
          if (this.forgotPassMaskedEmail && this.activePendingUser) {
            this.forgotPassMaskedEmail.textContent = this.activePendingUser.email || 'operator@argus.sec';
          }
          this.generateNewResetCode();
          if (this.inputResetCode) {
            this.inputResetCode.value = '';
            setTimeout(() => this.inputResetCode.focus(), 50);
          }
          break;

        case 'register':
          if (this.viewRegister) this.viewRegister.classList.add('active');
          if (this.regUserId) setTimeout(() => this.regUserId.focus(), 50);
          break;

        case 'google_auth':
          if (this.viewGoogleAuth) this.viewGoogleAuth.classList.add('active');
          break;
      }
    }

    clearErrors() {
      const errorBanners = [
        this.loginError,
        this.verifyPasswordError,
        this.emailError,
        this.passkeyError,
        this.securityKeyError,
        this.resetPasswordError,
        this.regError
      ];
      errorBanners.forEach(el => {
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

    // =========================================================================
    // EVENT BINDINGS
    // =========================================================================
    bindEvents() {
      // 1. Password reveal toggle
      if (this.btnToggleVerifyPassword && this.verifyPasswordInput) {
        this.btnToggleVerifyPassword.addEventListener('click', () => {
          this.playKeyClick();
          const isPass = this.verifyPasswordInput.type === 'password';
          this.verifyPasswordInput.type = isPass ? 'text' : 'password';
          this.btnToggleVerifyPassword.textContent = isPass ? '🔒' : '👁️';
        });
      }

      // 2. Main Login Form: Username entered -> Go to Verification Selection
      if (this.formLogin) {
        this.formLogin.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleInitialUsernameSubmit();
        });
      }

      // 3. Continue with Google Button -> Open Google Picker View
      if (this.btnGoogleLogin) {
        this.btnGoogleLogin.addEventListener('click', () => {
          this.playRadarScan();
          this.showView('google_auth');
        });
      }

      // 4. Sign Up Button on Login Screen
      if (this.btnGoToRegister) {
        this.btnGoToRegister.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('register');
        });
      }

      // 5. Guest Account Button on Login Screen
      if (this.btnGuestLogin) {
        this.btnGuestLogin.addEventListener('click', () => {
          this.handleGuestLogin();
        });
      }

      // 6. Verification Selection Page: Method Buttons
      if (this.btnSelectPassword) {
        this.btnSelectPassword.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('verify_password');
        });
      }

      if (this.btnSelectEmailPin) {
        this.btnSelectEmailPin.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('2fa_email');
        });
      }

      if (this.btnSelectPasskey) {
        this.btnSelectPasskey.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('2fa_passkey');
        });
      }

      if (this.btnSelectSecurityKey) {
        this.btnSelectSecurityKey.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('2fa_security_key');
        });
      }

      // 7. Change Operator / Back links
      if (this.btnChangeOperator) {
        this.btnChangeOperator.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('credentials');
        });
      }

      if (this.btn2FACancel) {
        this.btn2FACancel.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('credentials');
        });
      }

      // Generic back to 2FA methods buttons
      document.querySelectorAll('.btn-back-to-2fa-methods').forEach(btn => {
        btn.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('2fa_methods');
        });
      });

      // 8. Forgot Password links
      if (this.btnGoToForgotPassword) {
        this.btnGoToForgotPassword.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('forgot_password');
        });
      }
      document.querySelectorAll('.btn-trigger-forgot-pass').forEach(btn => {
        btn.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('forgot_password');
        });
      });

      // 9. Password Verification Form
      if (this.formVerifyPassword) {
        this.formVerifyPassword.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleVerifyPassword();
        });
      }

      // 10. Email PIN View
      if (this.emailDemoPill && this.inputEmailPin) {
        this.emailDemoPill.addEventListener('click', () => {
          this.playKeyClick();
          this.inputEmailPin.value = this.generatedEmailPin;
        });
      }
      if (this.btnResendEmailCode) {
        this.btnResendEmailCode.addEventListener('click', () => {
          this.playKeyClick();
          this.generateNewEmailPin();
        });
      }
      if (this.btnVerifyEmailPin) {
        this.btnVerifyEmailPin.addEventListener('click', () => {
          this.handleVerifyEmailPin();
        });
      }
      if (this.inputEmailPin) {
        this.inputEmailPin.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleVerifyEmailPin();
          }
        });
      }

      // 11. Passkey Verification View
      if (this.btnVerifyPasskey) {
        this.btnVerifyPasskey.addEventListener('click', () => {
          this.handleVerifyPasskey();
        });
      }

      // 12. Security Key Verification View
      if (this.btnVerifySecurityKey) {
        this.btnVerifySecurityKey.addEventListener('click', () => {
          this.handleVerifySecurityKey();
        });
      }
      if (this.inputSecurityKeyPin) {
        this.inputSecurityKeyPin.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleVerifySecurityKey();
          }
        });
      }

      // 13. Forgot Password Form
      if (this.resetDemoPill && this.inputResetCode) {
        this.resetDemoPill.addEventListener('click', () => {
          this.playKeyClick();
          this.inputResetCode.value = this.generatedResetCode;
        });
      }
      if (this.btnResendResetCode) {
        this.btnResendResetCode.addEventListener('click', () => {
          this.playKeyClick();
          this.generateNewResetCode();
        });
      }
      if (this.formForgotPassword) {
        this.formForgotPassword.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleResetPasswordSubmit();
        });
      }

      // 14. Sign Up View Form
      if (this.formRegister) {
        this.formRegister.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleRegisterSubmit();
        });
      }
      if (this.btnBackToLogin) {
        this.btnBackToLogin.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('credentials');
        });
      }
      if (this.btnGoogleRegister) {
        this.btnGoogleRegister.addEventListener('click', () => {
          this.playRadarScan();
          this.showView('google_auth');
        });
      }

      // 15. Google Mock Operator Choosers
      document.querySelectorAll('.btn-choose-google').forEach(btn => {
        btn.addEventListener('click', () => {
          const email = btn.getAttribute('data-email');
          const name = btn.getAttribute('data-name');
          this.authorizeGoogleOperator(email, name);
        });
      });

      if (this.formCustomGoogle) {
        this.formCustomGoogle.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = this.customGoogleEmail ? this.customGoogleEmail.value.trim() : '';
          const name = this.customGoogleName && this.customGoogleName.value.trim()
            ? this.customGoogleName.value.trim()
            : email.split('@')[0];
          if (email) this.authorizeGoogleOperator(email, name);
        });
      }

      if (this.btnBackFromGoogleAuth) {
        this.btnBackFromGoogleAuth.addEventListener('click', () => {
          this.playKeyClick();
          this.showView('credentials');
        });
      }

      // 16. Header Logout
      if (this.btnLogoutHeader) {
        this.btnLogoutHeader.addEventListener('click', () => {
          this.logout();
        });
      }

      // 17. Console Lock Keypad
      document.querySelectorAll('.lock-key').forEach(key => {
        key.addEventListener('click', () => {
          const val = key.getAttribute('data-val');
          if (val) this.handleLockPinKeypad(val);
        });
      });
      if (this.btnLockEmergencyExit) {
        this.btnLockEmergencyExit.addEventListener('click', () => {
          this.logout();
        });
      }

      // 18. Settings Modal Close
      if (this.btnCloseSettings && this.settingsModal) {
        this.btnCloseSettings.addEventListener('click', () => {
          this.settingsModal.classList.remove('active');
        });
      }
      if (this.btnOpenSettings && this.settingsModal) {
        this.btnOpenSettings.addEventListener('click', () => {
          this.playKeyClick();
          this.settingsModal.classList.add('active');
        });
      }
    }

    // =========================================================================
    // FLOW STEP 1: USERNAME ENTRY -> VERIFICATION SELECTION
    // =========================================================================
    handleInitialUsernameSubmit() {
      const rawUser = this.inputUserId ? this.inputUserId.value.trim() : '';
      if (!rawUser) {
        this.showError(this.loginError, 'Please enter an Operator ID / Username.');
        return;
      }

      this.playKeyClick();
      let user = this.getUser(rawUser);

      // If user doesn't exist yet, auto-provision temporary local operator
      if (!user) {
        user = {
          username: rawUser,
          displayName: rawUser.charAt(0).toUpperCase() + rawUser.slice(1),
          email: `${rawUser.toLowerCase()}@argus-surveillance.net`,
          password: 'password123',
          securityPin: '7777',
          role: 'operator',
          clearance: 'Sentinel Clearance',
          enabledMethods: ['password', 'email_pin', 'passkey', 'security_key']
        };
        this.saveUser(user);
      }

      this.activePendingUser = user;
      if (this.twoFaUsernameDisplay) {
        this.twoFaUsernameDisplay.textContent = user.displayName || user.username;
      }

      // Transport immediately to Page 2: Select how to verify!
      this.showView('2fa_methods');
    }

    // =========================================================================
    // FLOW STEP 2: RENDER ONLY ENABLED VERIFICATION METHODS FOR USER
    // =========================================================================
    renderEnabledMethods() {
      const user = this.activePendingUser || this.getUser('admin');
      const methods = (user && Array.isArray(user.enabledMethods))
        ? user.enabledMethods
        : ['password', 'email_pin', 'passkey', 'security_key'];

      // Show or hide based on user settings
      if (this.btnSelectPassword) {
        this.btnSelectPassword.style.display = methods.includes('password') ? 'flex' : 'none';
      }
      if (this.btnSelectEmailPin) {
        this.btnSelectEmailPin.style.display = methods.includes('email_pin') ? 'flex' : 'none';
      }
      if (this.btnSelectPasskey) {
        this.btnSelectPasskey.style.display = methods.includes('passkey') ? 'flex' : 'none';
      }
      if (this.btnSelectSecurityKey) {
        this.btnSelectSecurityKey.style.display = methods.includes('security_key') ? 'flex' : 'none';
      }
    }

    // =========================================================================
    // FLOW STEP 3A: PASSWORD VERIFICATION
    // =========================================================================
    handleVerifyPassword() {
      const password = this.verifyPasswordInput ? this.verifyPasswordInput.value : '';
      if (!password) {
        this.showError(this.verifyPasswordError, 'Please enter your security password.');
        return;
      }

      const user = this.activePendingUser || this.getUser('admin');
      if (user && user.password && user.password !== password) {
        this.showError(this.verifyPasswordError, 'Incorrect security password. Default is password123');
        return;
      }

      // Authorized!
      this.completeLogin(user);
    }

    // =========================================================================
    // FLOW STEP 3B: EMAIL PIN VERIFICATION
    // =========================================================================
    generateNewEmailPin() {
      this.generatedEmailPin = Math.floor(100000 + Math.random() * 900000).toString();
      if (this.emailDemoCode) this.emailDemoCode.textContent = this.generatedEmailPin;
    }

    handleVerifyEmailPin() {
      const entered = this.inputEmailPin ? this.inputEmailPin.value.trim() : '';
      if (!entered || entered.length !== 6) {
        this.showError(this.emailError, 'Please enter the 6-digit PIN code.');
        return;
      }

      if (entered !== this.generatedEmailPin && entered !== '849201') {
        this.showError(this.emailError, 'Invalid PIN code. Click the simulated email pill to auto-fill.');
        return;
      }

      this.completeLogin(this.activePendingUser || this.getUser('admin'));
    }

    // =========================================================================
    // FLOW STEP 3C: PASSKEY BIOMETRIC SCAN
    // =========================================================================
    handleVerifyPasskey() {
      this.playRadarScan();
      if (this.passkeyStatusText) {
        this.passkeyStatusText.textContent = 'Biometric scan authenticating...';
        this.passkeyStatusText.style.color = 'var(--accent-cyan)';
      }

      if (this.btnVerifyPasskey) {
        this.btnVerifyPasskey.disabled = true;
        this.btnVerifyPasskey.textContent = '⚡ Scanning Biometrics...';
      }

      setTimeout(() => {
        if (this.btnVerifyPasskey) {
          this.btnVerifyPasskey.disabled = false;
          this.btnVerifyPasskey.textContent = '⚡ Authorize with Passkey';
        }
        this.completeLogin(this.activePendingUser || this.getUser('admin'));
      }, 700);
    }

    // =========================================================================
    // FLOW STEP 3D: HARDWARE SECURITY KEY PIN
    // =========================================================================
    handleVerifySecurityKey() {
      const pin = this.inputSecurityKeyPin ? this.inputSecurityKeyPin.value.trim() : '';
      const user = this.activePendingUser || this.getUser('admin');
      const expected = (user && user.securityPin) ? user.securityPin : '7777';

      if (!pin) {
        this.showError(this.securityKeyError, 'Please enter your Security Key PIN.');
        return;
      }

      if (pin !== expected && pin !== '7777') {
        this.showError(this.securityKeyError, 'Invalid Security Key PIN. (Default is 7777)');
        return;
      }

      this.completeLogin(user);
    }

    // =========================================================================
    // FLOW STEP 4: FORGOT PASSWORD RESET
    // =========================================================================
    generateNewResetCode() {
      this.generatedResetCode = Math.floor(100000 + Math.random() * 900000).toString();
      if (this.resetDemoCode) this.resetDemoCode.textContent = this.generatedResetCode;
    }

    handleResetPasswordSubmit() {
      const code = this.inputResetCode ? this.inputResetCode.value.trim() : '';
      const newPass = this.inputResetNewPassword ? this.inputResetNewPassword.value : '';
      const confirmPass = this.inputResetConfirmPassword ? this.inputResetConfirmPassword.value : '';

      if (!code || (code !== this.generatedResetCode && code !== '123456')) {
        this.showError(this.resetPasswordError, 'Invalid verification code. Click the demo pill to fill.');
        return;
      }

      if (!newPass || newPass.length < 6) {
        this.showError(this.resetPasswordError, 'Password must be at least 6 characters.');
        return;
      }

      if (newPass !== confirmPass) {
        this.showError(this.resetPasswordError, 'Passwords do not match.');
        return;
      }

      const user = this.activePendingUser || this.getUser('admin');
      user.password = newPass;
      this.saveUser(user);

      this.completeLogin(user);
    }

    // =========================================================================
    // FLOW STEP 5: SIGN UP NEW OPERATOR
    // =========================================================================
    handleRegisterSubmit() {
      const username = this.regUserId ? this.regUserId.value.trim().toLowerCase() : '';
      const displayName = this.regDisplayName && this.regDisplayName.value.trim()
        ? this.regDisplayName.value.trim()
        : username;
      const email = this.regEmail ? this.regEmail.value.trim() : `${username}@argus.sec`;
      const password = this.regPassword ? this.regPassword.value : '';
      const twoFaEnabled = this.reg2FAToggle ? this.reg2FAToggle.checked : true;

      if (!username || username.length < 3) {
        this.showError(this.regError, 'Username must be at least 3 characters.');
        return;
      }

      if (!password || password.length < 6) {
        this.showError(this.regError, 'Password must be at least 6 characters.');
        return;
      }

      const newUser = {
        username,
        displayName,
        email,
        password,
        securityPin: '7777',
        role: 'operator',
        clearance: 'Operator Clearance Level 2',
        enabledMethods: twoFaEnabled
          ? ['password', 'email_pin', 'passkey', 'security_key']
          : ['password']
      };

      this.saveUser(newUser);
      this.completeLogin(newUser);
    }

    // =========================================================================
    // FLOW STEP 6: GOOGLE MOCK & GUEST ACCOUNTS
    // =========================================================================
    authorizeGoogleOperator(email, displayName) {
      this.playRadarScan();
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      let user = this.getUser(username);
      if (!user) {
        user = {
          username,
          displayName: displayName || username,
          email,
          password: 'password123',
          securityPin: '7777',
          role: 'admin',
          clearance: 'Google Verified Clearance',
          enabledMethods: ['password', 'passkey', 'email_pin']
        };
        this.saveUser(user);
      }
      this.completeLogin(user);
    }

    handleGuestLogin() {
      this.playRadarScan();
      const guestUser = {
        username: `guest_${Math.random().toString(36).substring(2, 6)}`,
        displayName: 'Guest Operator',
        email: 'guest@argus.surveillance',
        role: 'guest',
        clearance: 'Level 1 Monitor Clearance (Read-Only)',
        enabledMethods: ['password']
      };
      this.completeLogin(guestUser);
    }

    // =========================================================================
    // FINALIZE LOGIN & CONSOLE ACCESS
    // =========================================================================
    completeLogin(user) {
      this.playSuccessChime();
      this.currentUser = user;
      localStorage.setItem('argus_auth_user', JSON.stringify(user));
      this.isLocked = false;
      sessionStorage.removeItem('argus_console_locked');

      this.updateHeaderSession();
      this.hideGatekeeper();
      this.hideLockOverlay();
    }

    updateHeaderSession() {
      if (this.sessionPill) {
        this.sessionPill.style.display = 'flex';
      }
      if (this.sessionUserName && this.currentUser) {
        this.sessionUserName.textContent = this.currentUser.displayName || this.currentUser.username;
      }
      if (this.sessionClearance && this.currentUser) {
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

    logout() {
      this.playTone(300, 'sine', 0.12, 0.05);
      this.currentUser = null;
      this.activePendingUser = null;
      this.isLocked = false;
      localStorage.removeItem('argus_auth_user');
      sessionStorage.removeItem('argus_console_locked');

      this.hideLockOverlay();
      this.showGatekeeper();
    }

    // =========================================================================
    // CONSOLE LOCK OVERLAY & KEYPAD
    // =========================================================================
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
    }

    hideLockOverlay() {
      if (this.lockOverlay) {
        this.lockOverlay.classList.remove('active');
        this.lockOverlay.style.display = 'none';
        this.lockOverlay.style.visibility = 'hidden';
        this.lockOverlay.style.pointerEvents = 'none';
        this.lockOverlay.style.opacity = '0';
      }
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
          if (this.currentLockPinBuffer === '7777') {
            this.playSuccessChime();
            this.isLocked = false;
            sessionStorage.removeItem('argus_console_locked');
            this.hideLockOverlay();
          } else {
            this.showError(this.lockPinError, 'Incorrect PIN. Default is 7777');
            this.currentLockPinBuffer = '';
            this.updateLockPinDisplay();
          }
        }, 150);
      }
    }

    updateLockPinDisplay() {
      const dots = this.lockOverlay ? this.lockOverlay.querySelectorAll('.lock-pin-dot') : [];
      dots.forEach((dot, idx) => {
        if (idx < this.currentLockPinBuffer.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    }
  }

  // Instantiate globally on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.argusAuth = new ArgusAuth();
    });
  } else {
    window.argusAuth = new ArgusAuth();
  }
})();
