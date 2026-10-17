# 👁️ ARGUS // Surreal Multi-Camera CCTV & Neural Detection Matrix

This repository is split into two independent deployments:
- **[`backend/`](./backend)**: Node.js API server & MongoDB connection, configured for hosting on **[Render](https://render.com)**.
- **[`frontend/`](./frontend)**: Glassmorphic surveillance dashboard, mobile camera node & AI detection interface, configured for hosting on **[Vercel](https://vercel.com)**.

![Surreal CCTV Background](frontend/assets/images/surreal_bg.jpg)

---

## 🌟 Key Features

1. **Multi-Camera WebRTC Hub (Any Network / Cross-Wi-Fi)**:
   - **Cross-Wi-Fi & Cellular Mobile Pairing**: Connects phones on **completely different Wi-Fi networks or mobile cellular data (4G/5G)** via an automatic global HTTPS Cloudflare/Localtunnel tunnel.
   - **HTTPS Camera Permissions**: Mobile browsers (iOS Safari and Android Chrome) strictly require HTTPS for camera streaming; the built-in tunnel provides secure SSL certificates so camera permissions are granted instantly.
   - **Multi-STUN NAT Traversal**: Uses Google & Twilio STUN/TURN relays to establish peer-to-peer WebRTC video streams across separate subnets and firewalls.
   - **Laptop / Local Webcams**: Single-click activation of integrated front cameras.
   - **Fast 4-Digit Room PIN**: Simple PIN code (e.g. `PIN: 4829`) with 1-click copy or manual input on mobile.
   - **Simulated AI Test Feed**: Immediate demonstration feed with synthetic walking silhouettes to test AI human detection, radar waveforms, and sirens without physical cameras.

2. **Local MongoDB Database Integration**:
   - Automatically connected to your local MongoDB server (`mongodb://localhost:27017/cctv_surveillance`).
   - Automatically stores all human & motion detection events, confidence scores, and snapshots permanently.
   - Restores past surveillance history upon page load and includes a 1-click "Clear All MongoDB Events" control.
   - Real-time MongoDB health indicator in the header telemetry bar.

3. **Transparent White Frosted Glassmorphism**:
   - Pristine luminous white frosted glass bento boxes (`rgba(255, 255, 255, 0.09)`) with crisp multi-layered borders and backdrop blur over the dark surrealist cosmic dreamscape.
   - **TensorFlow.js COCO-SSD**: Real-time neural network detection pinpointing human presence (`person`), confidence scores, and cybernetic target brackets.
   - **Pixel-Difference Motion Engine**: Real-time 60fps frame luminance delta analysis that tracks motion intensity (0%–100%) and renders a dynamic neon waveform.
   - **Web Audio Alert Synthesizer**: Zero-asset radar chirps and intruder warning sirens synthesized via the browser's Web Audio API.

3. **Surrealism & Glassmorphic Bento Grid Aesthetic**:
   - **Living Surreal Background**: Floating refractive glass spheres, twinkling celestial stardust, and mouse parallax layered over a surrealist cosmic eye dreamscape.
   - **Threat Shockwave Ripple**: Detects human movement and triggers a synchronized cosmic alarm pulse across the celestial eye and background nebula.
   - **Bento Grid**: Asymmetric, high-density dashboard with frosted glass blur (`backdrop-filter`), multi-layer glows, and cyberpunk HUD overlays.
   - **Vision Modes**: Normal RGB, Night Vision (IR phosphor green), Thermal FLIR, and Cyber HUD.

4. **Surveillance Event Journal & Evidence Snapshots**:
   - Auto-captures timestamped snapshots with target bounding boxes whenever a human or motion spike is detected.
   - Interactive Lightbox modal to inspect and download high-resolution captured evidence.

5. **Security Gatekeeper, Google OAuth & Two-Step Authentication (2FA)**:
   - **Google 1-Click Login & Sign Up**: One-click authentication with Google Identity Services (`gsi/client`). Automatically provisions new Operator accounts or logs in returning operators instantly.
   - **Unified Credentials Screen**: Operator ID/Username and Password combined into a single login prompt.
   - **Two-Step Verification Gate**: When 2-step auth is enabled, operators are transferred to the secondary authentication options screen offering 3 verification methods:
     1. **Passkey (Biometric / WebAuthn)**: Instant authorization via Touch ID, Face ID, Windows Hello, or device passkey.
     2. **PIN from Email**: 6-digit one-time passcode dispatched to the operator's registered email (with real-time simulated testing preview).
     3. **Security Key**: Hardware FIDO2 / USB security key or 4-digit Master Security Key PIN.
   - **Lock Console (`Ctrl+L` / `Esc`)**: Instantly locks the surveillance terminal with a PIN overlay without interrupting active camera feeds or AI human detection.
   - **MongoDB & Memory Persistence**: Session tokens, users, and 2FA challenges persist automatically in MongoDB with in-memory fallback for serverless deployments.

### 🛡️ Operator Access Methods

| Method | Type | Action / Details |
| :--- | :--- | :--- |
| **Google Sign-In / Sign-Up** | **1-Click OAuth** | Click **Continue with Google** / **Sign up with Google** |
| **Credentials Login** | **Operator ID & Pass** | ID: `admin`, Password: `password123` |
| **Quick Demo Access** | **1-Click Autofill** | Click **⚡ QUICK DEMO ACCESS** to autofill & submit |
| **2-Step Auth (Passkey)** | **Biometrics** | Touch ID / Face ID / Windows Hello WebAuthn |
| **2-Step Auth (Email PIN)** | **6-Digit OTP** | Enter 6-digit code or click Simulated Email Pill |
| **2-Step Auth (Security Key)** | **Hardware/PIN** | Enter Master PIN: **`7777`** |
| **Console Screen Lock** | **Fast Freeze** | Press **`Ctrl + L`** or click **🔒 Lock**; PIN **`7777`** to resume |

---

### ⚙️ Operator Settings & 2-Step Auth Setup
- Access by clicking **`⚙️ Settings`** in the header session pill.
- **Account Details**: View permanent Operator ID, Security Clearance, edit Callsign/Display Name, and configure registered Email.
- **2-Step Auth Setup**:
  - Master Toggle: Enable or disable 2-Step Authentication enforcement on login.
  - **Passkey**: Test device biometric hardware readiness.
  - **PIN from Email**: Verify registered email and test one-time PIN dispatch.
  - **Security Key**: Configure custom 4-to-6 digit Master Security Key PIN (default: `7777`).
- **Security Password**: Change security password with current password verification.

---

## 🚀 Quick Start

### 1. Launch the Server
```bash
npm start
```
or
```bash
node server.js
```

### 2. Access the Dashboard
- **Main Surveillance Hub**: Open `http://localhost:3001/` in your browser.
- **Mobile Camera Uplink**: Open the displayed Wi-Fi IP (e.g. `http://172.20.10.13:3001/camera.html`) on your phone, or simply **scan the QR code** on the Hub screen!

---

## ☁️ Deploying to Vercel

The project is fully configured for Vercel with Serverless Functions in [`api/`](file:///Users/nikhil/Documents/GitHub/CCTV/api) and native global HTTPS (no tunnels needed on Vercel!).

### Method 1: Deploy with Vercel CLI (1-Click)
Run the following in your terminal:
```bash
npm run deploy
```
*(If prompted by Vercel CLI, log in and confirm default settings).*

### Method 2: Deploy via GitHub
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel serverless deployment"
   git push origin main
   ```
2. In [Vercel Dashboard](https://vercel.com/new), click **Import Project** and select this repository.
3. (Optional) Under **Environment Variables**, add:
   - `MONGODB_URI`: your cloud MongoDB Atlas connection string (e.g. `mongodb+srv://...`).
   *Note: If `MONGODB_URI` is omitted, the app automatically runs using an in-memory cloud store with zero configuration required!*
4. Click **Deploy**. Vercel will give you a live production URL: `https://<your-project>.vercel.app`.

---

## 📱 Mobile Camera Features (`camera.html`)
- Rear (Environment) / Front (Selfie) Camera lens switcher.
- Torch / Flashlight hardware toggle.
- Screen WakeLock (prevents the phone from sleeping while streaming).
- Real-time battery telemetry reported to the Hub.
