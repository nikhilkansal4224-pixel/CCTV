const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const candidates = [
      path.resolve(__dirname, '..', '.env'),
      path.resolve(process.cwd(), '.env')
    ];

    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key && (process.env[key] === undefined || process.env[key] === '')) {
              process.env[key] = val;
            }
          }
        }
        break; // loaded primary .env
      }
    }
  } catch (e) {
    // Ignore error in serverless or read-only filesystem
  }
}

// Auto-load on require
loadEnv();

module.exports = { loadEnv };
