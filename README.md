# AETHER • Omniscient Surrealist CCTV Surveillance Matrix

An AI-powered multi-camera CCTV surveillance system featuring mobile camera pairing via QR code, real-time human movement detection, automatic vertical & horizontal feed management, auto-sizing surveillance matrix, camera removal controls, dedicated settings page, dark Bento Grid architecture, glassmorphism styling, and an interactive surrealist dreamscape background.

---

## 🏛️ Project Architecture

```
CCTV/
├── backend/
│   ├── package.json          # Express, Socket.IO, CORS dependencies
│   └── server.js             # REST APIs, WebRTC signaling & LAN IP autodetector
├── frontend/
│   ├── index.html            # Main Surveillance Command Center Dashboard & Settings Modal
│   ├── camera.html           # Mobile Camera Client (opened when scanning QR code)
│   ├── css/
│   │   ├── dashboard.css     # Bento Grid, Auto-Max Grid Matrix, Settings modal & dark glassmorphism
│   │   ├── surrealism.css    # Surrealist floating orbs, lighting meshes
│   │   └── camera.css        # Mobile viewfinder HUD & torch controls
│   └── js/
│       ├── surrealism.js     # Animated cosmic eye, Dalí gears & stardust canvas with feature toggles
│       ├── detector.js       # TensorFlow.js COCO-SSD + optical movement tracking
│       ├── webrtc.js         # Multi-camera WebRTC peer manager & frame relay
│       ├── dashboard.js      # Auto-grid layout orchestrator, camera removal & settings controller
│       └── camera-streamer.js# Mobile camera capture, orientation detection & stream transmitter
└── package.json              # Top-level runner (`npm start`)
```

---

## 🚀 Key Features

### 1. 📱 Intelligent Vertical (Portrait) & Horizontal (Landscape) Feed Management
- **Automatic Orientation Detection**: Automatically inspects video stream dimensions (`videoWidth` vs `videoHeight`):
  - **Vertical Feeds (9:16 Portrait)**: When holding a phone upright, the feed is tagged with a magenta `9:16 VERTICAL` badge.
  - **Horizontal Feeds (16:9 Landscape)**: Laptop webcams and phones in landscape orientation are tagged with a cyan `16:9 HORIZONTAL` badge.
- **Adaptive Matrix Grid Balancing**:
  - **Mixed Layouts (Vertical Mobile + Horizontal Laptop)**: The grid automatically balances column ratios (e.g. `0.9fr 1.6fr`) so vertical phones get their natural tall proportion and horizontal webcams get a wide proportion without awkward stretching.
  - **Single Vertical Camera**: Centered with a stylish portrait card (`max-width: 480px; aspect-ratio: 9/16`).
  - **Dual Vertical Cameras**: Centered 2-column portrait layout.
- **Ambient Frosted Glassmorphism Background**: Portrait feeds in letterbox mode display a soft, ethereal blurred reflection behind the video, replacing ugly black bars.
- **Fit vs Fill Toggle Button**: Every camera tile includes an **Aspect Mode Toggle (Fit / Fill)** button to cycle between `object-fit: contain` (see 100% of the sensor with zero cropping) and `object-fit: cover` (fill tile).
- **Pixel-Perfect AI Bounding Boxes**: Neural detection bounding boxes automatically adapt to vertical and horizontal dimensions, ensuring targeting brackets align with detected humans on any device.

### 2. 🔲 Auto-Sizing Multi-Camera Grid Matrix (Max Size Mode)
- **Automatic Grid Scaling**: When multiple cameras are connected, the system automatically calculates the optimal rows and columns to maximize each camera feed:
  - **1 Camera**: Expands to 100% full viewport.
  - **2 Cameras**: 2 balanced columns filling the entire height.
  - **3 Cameras**: 3 columns auto-balanced across the viewport width.
  - **4 Cameras**: 2x2 grid maximizing all 4 feeds equally.
  - **5-6 Cameras**: 3x2 grid auto-maximizing all 6 feeds.
- **Concurrent AI Human Detection**: Every active camera in the matrix concurrently runs neural human detection and optical motion tracking.
- **Solo Focus (⛶)**: Click the expand button on any feed to zoom that specific camera into full view, and restore anytime.
- **Fullscreen Matrix Toggle**: Expand the entire surveillance grid to fill your monitor.

### 3. 🗑️ Camera Removal & Disconnect Controls
- **Remove Camera Button**: Every camera tile features a red-highlighted **Trash / Disconnect (🗑️)** button.
- **Instant Clean Up**: Clicking it immediately releases hardware media tracks, cancels simulation loops, notifies connected mobile devices (`force-disconnect`), and automatically re-expands the remaining cameras to their new maximum sizes.

### 4. ⚙️ Dedicated Settings Page & Preferences Modal
Accessible via the **"⚙️ Settings"** button in the header, with 4 comprehensive configuration tabs:
- **AI & Movement Detection**:
  - Detection Confidence Threshold slider (30% - 95%)
  - Movement Vector Sensitivity slider (5px - 50px)
  - Synthesized Web Audio Radar Siren toggle
- **Camera Grid**:
  - Auto Maximize All Active Cameras toggle
  - Auto-Focus on Movement Breach toggle (briefly highlights breached camera)
- **Surrealism Visuals**:
  - Toggle Celestial Omniscient Eye
  - Toggle Salvador Dalí Melting Gears
  - Toggle Ambient Bioluminescent Orbs
- **System & Network**:
  - Local LAN Host display (`http://<ip>:5001`)
  - Incident Log Reset
  - Disconnect All Cameras button
  - Reset to Factory Defaults button
- All preferences are persisted in `localStorage` and applied live!

---

## ⚡ Quick Start

### 1. Start the Server
```bash
npm start
```

### 2. Access the Application
- **Command Center Dashboard**: [http://localhost:5001/index.html](http://localhost:5001/index.html) (or `http://<your-lan-ip>:5001/index.html`)
- **Mobile Camera Client**: [http://<your-lan-ip>:5001/camera.html](http://<your-lan-ip>:5001/camera.html) (or scan the QR code on screen)
- **Quick Test**: Click **"📱 Add Vertical Cam"** and **"Add Horizontal Feed"** in the top bar to test mixed vertical and horizontal feeds side-by-side!
