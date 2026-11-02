# SENTINEL // QR-Based WebRTC Camera Access System

A professional, high-performance web application that enables secure, temporary peer-to-peer camera connections between devices via a dynamic QR code.

Built with a **dark-and-white cyber-precision aesthetic**, zero-trust privacy architecture, and pure WebRTC peer-to-peer streaming with explicit browser permissions.

---

## Key Features

- **Operator Authentication Gate**: Secure PBKDF2 SHA-512 clearance portal with session tokens in HTTP-only cookies, protecting the Host Monitor from unauthorized access.
- **Large Prominent QR Code**: Crisp SVG QR code generated with ephemeral session tokens.
- **Explicit Consent**: Zero camera activation without physical interaction and explicit tap on `"Allow & Start Camera"`. Standard browser permissions (`navigator.mediaDevices.getUserMedia`) are strictly respected.
- **Peer-to-Peer Encryption**: Direct end-to-end video streaming between devices using WebRTC DTLS/SRTP 256-bit encryption. Zero video frames are stored or analyzed on any cloud server.
- **Short-Lived Ephemeral Sessions**: 10-minute validity countdown timer with automatic session termination and token invalidation.
- **Real-Time Connection & Telemetry Indicators**: Live HUD monitoring resolution, frame rate (FPS), bitrate (kbps), round-trip latency (RTT ms), and ICE connection states.
- **Instant Hardware Shutdown ("End Session")**: Physical sensor tracks (`track.stop()`) are immediately stopped upon ending the session, safely releasing the camera lens.
- **Dual HTTP & HTTPS Support**: Automatically generates self-signed TLS certificates on startup (`https://<LAN-IP>:3443`), enabling mobile browsers (iOS Safari, Android Chrome) to grant camera permissions over local Wi-Fi without restriction.
- **Snapshot Capture & Viewfinder Tools**: Built-in snapshot frame grabber with timestamp watermark, aspect ratio toggle (fit/fill), crosshair framing reticle, front/rear camera switcher, and flashlight/torch support.
- **Phone as Dummy CCTV Gateway**: Turn any spare mobile phone into an IP surveillance camera using verified, safe apps from Google Play and Apple App Store (zero third-party APKs). Sentinel automatically scans the local network, authenticates via CCTV ID and Password, and displays the live feed with real-time FPS telemetry and AI entity detection.

---

## How It Works

1. **Operator Clearance**: Log in via `/login.html` with your operator credentials (or register a new profile).
2. **Session Generation**: The authenticated host device generates a unique, temporary session token with a prominent QR code and countdown timer.
3. **QR Code Scanning**: The user scans the QR code using any smartphone or secondary device (no password needed on the phone; the single-use token acts as temporary clearance).
4. **Camera Access Request**: The device opens a secure page (`/camera.html?session=<id>`) displaying the host's request and clear privacy guarantees.
5. **User Consent**: The device owner selects their preferred lens (Front/Rear) and resolution, then explicitly clicks **"Allow & Start Camera"**.
6. **Encrypted WebRTC Stream**: Once permission is granted, a direct P2P connection is negotiated via WebSocket signaling and streams live video to the host monitor.
7. **Session Termination**: Either device can click **"End Session"** at any time to instantly cut camera hardware power and tear down the connection.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The system will start two listeners:
- **HTTP**: `http://localhost:3000` (for local testing)
- **HTTPS**: `https://<YOUR-LAN-IP>:3443` (for mobile devices scanning the QR code over Wi-Fi)

### 3. Log In to the Host Dashboard
Open `http://localhost:3000` (or `https://localhost:3443`). You will be greeted by the **Sentinel Clearance Portal**.

- **Default Username**: `admin`
- **Default Password**: `password123`
- *Or click "Register Operator" to enroll a new profile.*

### 4. Connect a Camera
- **Using a Smartphone**: Point your phone camera at the QR code on screen. Open the link in Safari or Chrome, review the permissions, and tap **"Allow & Start Camera"**.
- **Testing on the Same PC**: Click the **"Test Link"** button in the QR card to open a camera tab side-by-side in a second window!

---

## Phone as Dummy CCTV Feature

Sentinel allows you to turn any spare smartphone into a 24/7 dedicated surveillance CCTV camera.

### 1. Safe Mobile Phone Setup (Official App Stores Only)
> [!IMPORTANT]
> Use **only verified, safe apps** directly from official app stores. Never download untrusted third-party APKs or sideloaded apps.

- **For Android (Google Play Store)**:
  1. Open Google Play Store on your Android phone.
  2. Search and install **IP Webcam** (by Pavel Khlebovich) or **IP Phone Camera** (by Deskshare).
  3. In the app settings, go to **Connection settings** &rarr; **Login/password**.
  4. Set your **CCTV ID (Username)** (e.g. `admin`) and **Password**.
  5. Connect your phone to the same Wi-Fi network as your computer.
  6. Scroll down and tap **"Start server"**. Note the port (default `8080`).

- **For iOS (Apple App Store)**:
  1. Open the Apple App Store on your iPhone or iPad.
  2. Search and install **IP Camera Lite** (by Yin Davidson) or **Live-Reporter**.
  3. In settings, enable **User Authentication** and set your **CCTV ID** and **Password**.
  4. Ensure your iPhone is connected to the same Wi-Fi network and start streaming.

### 2. Website Connection & Live Feed
1. On the Sentinel dashboard, click **"Connect Phone as Dummy CCTV"** (located on the standby screen, toolbar, and session dock).
2. Enter your **CCTV ID** and **Password**.
3. Click **"Scan Network & Locate CCTV"**.
4. Sentinel automatically sweeps the local network, discovers the phone camera via its IP address, verifies credentials, and connects the live feed!
5. The live feed streams directly into the surveillance matrix with live FPS, resolution HUD, snapshot capture, and AI entity detection!

---

## Running Automated Tests

```bash
npm test
```
Runs the automated WebSocket signaling and WebRTC session lifecycle verification test suite.

---

## Security Model

- **No Permission Bypasses**: The application relies exclusively on standard W3C Media Capture and Streams API.
- **Zero Cloud Recording**: Video streams directly between browser peers via WebRTC.
- **Auto-Destruction**: Sessions expire after 10 minutes or immediately upon clicking "End Session".
