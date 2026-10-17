# ARGUS CCTV — Frontend Web Site (Vercel Hosting)

Client-side surveillance interface, live camera grid, and AI detector frontend for ARGUS Surreal CCTV, built for instant deployment to **Vercel** (https://vercel.com).

## 🚀 Deploying to Vercel

### Method A: Vercel CLI
```bash
cd frontend
npx vercel --prod
```

### Method B: Git Integration (dashboard.vercel.com)
1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo.
3. If deploying from a monorepo, set the **Root Directory** to `frontend`.
4. Framework Preset: **Other**.
5. Click **Deploy**.

---

## 🔗 Connecting to your Render API

Once your backend API is deployed on Render (e.g. `https://argus-cctv-api.onrender.com`):

1. **Option 1 (In App):** Open your Vercel site in browser &rarr; click **Settings (⚙️)** &rarr; **🌐 Cloud API (Render)** &rarr; paste your Render URL &rarr; click **Save API URL**.
2. **Option 2 (URL Query):** Add `?api=https://argus-cctv-api.onrender.com` to your Vercel site URL.
3. **Option 3 (Default Constant):** Open `js/api-config.js` and set:
   ```javascript
   const DEFAULT_RENDER_API = 'https://argus-cctv-api.onrender.com';
   ```

---

## 🛠️ Local Development

```bash
# Serve frontend locally on port 3000
npm start
```
