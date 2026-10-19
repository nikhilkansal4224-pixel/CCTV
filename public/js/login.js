// SENTINEL // Operator Authentication Controller

const urlParams = new URLSearchParams(window.location.search);
const returnTo = urlParams.get('returnTo') || '/';

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const formLogin = document.getElementById('formLogin');
const formRegister = document.getElementById('formRegister');
const authAlert = document.getElementById('authAlert');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginRemember = document.getElementById('loginRemember');
const btnLoginSubmit = document.getElementById('btnLoginSubmit');
const toggleLoginPwd = document.getElementById('toggleLoginPwd');

const regUsername = document.getElementById('regUsername');
const regDisplayName = document.getElementById('regDisplayName');
const regRole = document.getElementById('regRole');
const regPassword = document.getElementById('regPassword');
const btnRegisterSubmit = document.getElementById('btnRegisterSubmit');

function showAlert(message, type = 'error') {
  authAlert.textContent = message;
  authAlert.className = `auth-alert ${type}`;
  authAlert.style.display = 'block';
}

function clearAlert() {
  authAlert.style.display = 'none';
  authAlert.textContent = '';
}

// Tab Switching
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  formLogin.style.display = 'block';
  formRegister.style.display = 'none';
  clearAlert();
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  formRegister.style.display = 'block';
  formLogin.style.display = 'none';
  clearAlert();
});

// Password visibility toggle
if (toggleLoginPwd) {
  toggleLoginPwd.addEventListener('click', () => {
    const isPwd = loginPassword.type === 'password';
    loginPassword.type = isPwd ? 'text' : 'password';
  });
}

// Check if user is already logged in
async function checkExistingAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        window.location.href = returnTo;
      }
    }
  } catch (err) {
    // Ignore network error on check
  }
}

// Handle Sign In
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  const remember = loginRemember.checked;

  if (!username || !password) {
    return showAlert('Please enter both username and password.');
  }

  btnLoginSubmit.disabled = true;
  btnLoginSubmit.innerHTML = `<span>Verifying Clearance...</span>`;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials.');
    }

    showAlert('Clearance Granted. Redirecting to Gateway...', 'success');
    setTimeout(() => {
      window.location.href = returnTo;
    }, 600);
  } catch (err) {
    showAlert(err.message);
    btnLoginSubmit.disabled = false;
    btnLoginSubmit.innerHTML = `<span>Authorize Access</span> <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>`;
  }
});

// Handle Register Operator
formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const username = regUsername.value.trim();
  const displayName = regDisplayName.value.trim();
  const role = regRole.value;
  const password = regPassword.value;

  if (!username || !password) {
    return showAlert('Username and password are required.');
  }

  btnRegisterSubmit.disabled = true;
  btnRegisterSubmit.innerHTML = `<span>Enrolling Operator...</span>`;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role, displayName }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    showAlert('Operator profile enrolled successfully! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = returnTo;
    }, 800);
  } catch (err) {
    showAlert(err.message);
    btnRegisterSubmit.disabled = false;
    btnRegisterSubmit.innerHTML = `<span>Create Operator Profile</span>`;
  }
});

window.addEventListener('DOMContentLoaded', checkExistingAuth);
