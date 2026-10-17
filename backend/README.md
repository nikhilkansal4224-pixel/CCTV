# ARGUS CCTV — Backend API (Render Hosting)

RESTful API and WebRTC signalling backend for ARGUS Surreal CCTV, built for deployment to **Render** (https://render.com).

## 🚀 Deploying to Render

### Method A: Blueprint 1-Click Deploy (Fastest)
1. Push this folder to a GitHub repository (or deploy from a monorepo specifying root directory as `backend`).
2. Log into [dashboard.render.com](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Select your repository. Render will automatically detect `render.yaml` and configure the web service with all environment variables, health checks, and build settings.
5. Click **Apply**.

### Method B: Manual Web Service
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your repository.
3. Configure the settings:
   - **Name:** `argus-cctv-api`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Health Check Path:** `/api/health`
4. Add Environment Variables:
   - `MONGODB_URI`: `mongodb+srv://Vercel-Admin-atlas-sky-chair:7JvEYgqj5UogP7tH@atlas-sky-chair.cqvbpkj.mongodb.net/?retryWrites=true&w=majority`
   - `DB_NAME`: `cctv_surveillance`
   - `PORT`: `10000`
5. Click **Create Web Service**.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Initialize or reseed database
npm run db:init

# Start API server locally
npm start
```

The server listens on `http://localhost:3001` (or `$PORT`).

## 📡 API Endpoints
- `GET  /api/health` — Container & MongoDB health check
- `GET  /api/mongodb/status` — Database telemetry
- `GET  /api/network-ip` — Public & local IP telemetry
- `POST /api/cameras/register` — Mobile camera peer registration
- `GET  /api/events` — Surveillance detection log journal
- `POST /api/events` — Log new AI human motion event
- `POST /api/auth/login` — Operator authentication
- `GET  /api/auth/me` — Verify session identity
- `GET  /api/auth/profile` — Operator profile & clearance
