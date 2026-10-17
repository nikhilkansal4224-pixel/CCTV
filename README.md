# AETHER • Omniscient Surrealist CCTV Surveillance Matrix

An AI-powered multi-camera CCTV surveillance system featuring mobile camera pairing via QR code, real-time human movement detection, dark Bento Grid architecture, glassmorphism styling, and an interactive surrealist dreamscape background.

---

## 🏛️ Project Architecture

The system is organized into clean, decoupled `frontend` and `backend` modules:

```
CCTV/
├── backend/
│   ├── package.json          # Express, Socket.IO, CORS dependencies
│   └── server.js             # REST APIs, WebRTC signaling & LAN IP autodetector
├── frontend/
│   ├── index.html            # Main Surveillance Command Center Dashboard
│   ├── camera.html           # Mobile Camera Client (opened when scanning QR code)
│   ├── css/
│   │   ├── dashboard.css     # Bento Grid, dark UI, glassmorphic panels
│   │   ├── surrealism.css    # Surrealist floating orbs, lighting meshes
│   │   └── camera.css        # Mobile viewfinder HUD & torch controls
│   └── js/
│       ├── surrealism.js     # Animated cosmic eye, Dalí gears & stardust canvas
│       ├── detector.js       # TensorFlow.js COCO-SSD + optical movement tracking
│       ├── webrtc.js         # Multi-camera WebRTC peer manager & frame relay
│       ├── dashboard.js      # Bento Grid UI orchestrator & audio synthesizer
│       └── camera-streamer.js# Mobile camera capture, torch & stream transmitter
└── package.json              # Top-level convenient runner
```

---

## 🚀 Key Features

### 1. 📱 Multi-Camera Connectivity (Mobile & Laptop)
- **Instant QR Code Mobile Pairing**: The dashboard detects your machine's local Wi-Fi IP address (e.g. `http://10.12.55.163:5001/camera.html`) and generates a live QR code.
- **Scan & Stream**: Point your phone camera at the QR code on the screen; it instantly opens `camera.html` in your mobile browser and begins transmitting video.
- **Switch Lens & Torch**: Toggle between rear and selfie cameras, or turn on the mobile flashlight directly.
- **One-Click Laptop Webcam**: Click **"Add Laptop Cam"** to stream your computer's built-in webcam.
- **Simulated Test Feed**: Click **"Add Simulation Feed"** to test human movement detection immediately without any extra hardware.

### 2. 👁️ Real-Time Human Movement Detection
- **Neural Object Recognition**: Utilizes **TensorFlow.js COCO-SSD** running client-side on WebGL/WASM to identify human subjects with high precision.
- **Dynamic Movement Vector Tracking**: Tracks subject centroids $(\Delta x, \Delta y)$ across frames combined with optical differencing to distinguish walking or moving humans from static backgrounds.
- **Cyberpunk HUD Targeting**: Displays neon corner brackets, confidence percentages (`[HUMAN • MOVING 94%]`), and centroid tracking reticles.
- **Acoustic Radar Warning**: Synthesizes a futuristic radar warning chime using the **Web Audio API**.
- **Incident Snapshot Reel**: Automatically captures photographic snapshots of detected humans and stores them with timestamps and confidence scores in the backend incident log.

### 3. 🎨 Visual Design: Dark UI, Bento Grid, Glassmorphism & Surrealism
- **Bento Grid**: Asymmetric, high-tech modular cards:
  - **Primary Hero Surveillance Viewport** (Live AI tracking, Night Vision, Thermal IR, Surrealist filter toggles, snapshot downloader).
  - **Mobile Pairing Hub** (Live QR Code + 1-click URL copy).
  - **Human Movement Matrix** (Subject counter, speed gauge, perimeter threat state).
  - **Connected Optical Nodes** (Interactive multi-camera thumbnail grid; click any feed to make it the hero viewport).
  - **Incident Reel & Detection Log** (Snapshot cards of intrusion events).
  - **Surveillance Control Deck** (Confidence slider, movement sensitivity slider, audio siren toggle).
- **Glassmorphism**: Frosted glass panels (`backdrop-filter: blur(24px)`), translucent specular gradients, and neon rim highlights.
- **Surrealism in Background**:
  - Full-screen interactive canvas rendering the **Omniscient Surrealist Celestial Eye** with golden armillary rings that subtly track your cursor.
  - Salvador Dalí-inspired melting clock gears and floating fluid spheres drifting with cosmic physics.

---

## ⚡ Quick Start

### 1. Install & Start
In the root directory, run:
```bash
npm start
```
*(Or navigate to `backend` and run `npm start`)*

### 2. Access the System
- **Command Center Dashboard**: Open [http://localhost:5001/index.html](http://localhost:5001/index.html) (or `http://<your-lan-ip>:5001/index.html`) in your browser.
- **Mobile Camera**: Scan the QR code displayed on the dashboard with any phone connected to the same Wi-Fi network, or open `http://<your-lan-ip>:5001/camera.html`.

---

## 📡 Backend APIs

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | System uptime, connected camera count, alert count |
| `/api/network` | `GET` | Auto-detected local LAN IP address and mobile stream URL |
| `/api/cameras` | `GET` | List of currently registered camera nodes |
| `/api/alerts` | `GET` | Retrieve recent human movement incident logs |
| `/api/alerts` | `POST` | Record a new human detection incident with snapshot |
| `/api/alerts` | `DELETE` | Clear all incident logs |

---

## 🔒 Socket.IO Real-Time Channels
- `join-dashboard`: Registers dashboard client for live stream updates.
- `register-camera`: Registers a new mobile or webcam node.
- `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate`: WebRTC P2P streaming negotiation.
- `stream-frame`: High-speed fallback frame relay for zero-configuration connectivity across complex networks.
- `remote-control`: Dashboard commands to trigger mobile flashlight or switch camera lens.
