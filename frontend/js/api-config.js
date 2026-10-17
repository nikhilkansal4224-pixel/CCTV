/**
 * ARGUS CCTV // DYNAMIC BACKEND API RESOLVER
 * Enables hosting the backend API on Render (https://render.com)
 * while serving the frontend on Vercel, GitHub Pages, or any origin.
 */

(function () {
  'use strict';

  // Configured default Render API URL (can be customized once deployed to Render)
  // Example: 'https://argus-cctv-api.onrender.com'
  const DEFAULT_RENDER_API = '';

  // Check URL query param override: e.g. ?api=https://my-render-app.onrender.com
  function getQueryApiOverride() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('api')) {
        const val = params.get('api').trim().replace(/\/+$/, '');
        if (val) {
          localStorage.setItem('argus_api_base', val);
          return val;
        }
      }
    } catch (e) {}
    return null;
  }

  function getApiBase() {
    // 1. Query param override
    const queryOverride = getQueryApiOverride();
    if (queryOverride) return queryOverride;

    // 2. Window object override
    if (window.ARGUS_API_BASE && typeof window.ARGUS_API_BASE === 'string') {
      return window.ARGUS_API_BASE.trim().replace(/\/+$/, '');
    }

    // 3. User configured localStorage setting
    try {
      const stored = localStorage.getItem('argus_api_base');
      if (stored && stored.trim()) {
        return stored.trim().replace(/\/+$/, '');
      }
    } catch (e) {}

    // 4. Default Render deployment constant (if defined)
    if (DEFAULT_RENDER_API && DEFAULT_RENDER_API.trim()) {
      return DEFAULT_RENDER_API.trim().replace(/\/+$/, '');
    }

    // 5. Default to same-origin relative path
    return '';
  }

  function setApiBase(url) {
    try {
      if (!url || !url.trim()) {
        localStorage.removeItem('argus_api_base');
        window.ARGUS_API_BASE = '';
      } else {
        const clean = url.trim().replace(/\/+$/, '');
        localStorage.setItem('argus_api_base', clean);
        window.ARGUS_API_BASE = clean;
      }
    } catch (e) {}
  }

  function apiUrl(path) {
    const base = getApiBase();
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return base ? `${base}${cleanPath}` : cleanPath;
  }

  async function testApiConnection(customUrl) {
    const targetBase = customUrl !== undefined ? customUrl.replace(/\/+$/, '') : getApiBase();
    const testUrl = targetBase ? `${targetBase}/api/health` : '/api/health';
    try {
      const res = await fetch(testUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // Export to global scope
  window.getApiBase = getApiBase;
  window.setApiBase = setApiBase;
  window.apiUrl = apiUrl;
  window.testApiConnection = testApiConnection;
})();
