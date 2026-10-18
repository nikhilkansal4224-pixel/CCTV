# SENTINEL // QR-Based WebRTC Camera Access System

A professional, high-performance web application that enables secure, temporary peer-to-peer camera connections between devices via a dynamic QR code.

Built with a **dark-and-white cyber-precision aesthetic**, zero-trust privacy architecture, and pure WebRTC peer-to-peer streaming with explicit browser permissions.

---

## Key Features

- **Large Prominent QR Code**: Crisp SVG QR code generated with ephemeral session tokens.
- **Explicit Consent**: Zero camera activation without physical interaction and explicit tap on `"Allow & Start Camera"`. Standard browser permissions (`navigator.mediaDevices.getUserMedia`) are strictly respected.
- **Peer-to-Peer Encryption**: Direct end-to-end video streaming between devices using WebRTC DTLS/SRTP 256-bit encryption. Zero video frames are stored or analyzed on any cloud server.
- **Short-Lived Ephemeral Sessions**: 10-minute validity countdown timer with automatic session termination and token invalidation.
- **Real-Time Connection & Telemetry Indicators**: Live HUD monitoring resolution, frame rate (FPS), bitrate (kbps), round-trip latency (RTT ms), and ICE connection states.
- **Instant Hardware Shutdown ("End Session")**: Physical sensor tracks (`track.stop()`) are immediately stopped upon ending the session, safely releasing the camera lens.
- **Dual HTTP & HTTPS Support**: Automatically generates self-signed TLS certificates on startup (`https://<LAN-IP>:3443`), enabling mobile browsers (iOS Safari, Android Chrome) to grant camera permissions over local Wi-Fi without restriction.
- **Snapshot Capture & Viewfinder Tools**: Built-in snapshot frame grabber with timestamp watermark, aspect ratio toggle (fit/fill), crosshair framing reticle, front/rear camera switcher, and flashlight/torch support.

---

## How It Works

1. **Session Generation**: The host device generates a unique, temporary session token with a prominent QR code and countdown timer.
2. **QR Code Scanning**: The user scans the QR code using any smartphone or secondary device.
3. **Camera Access Request**: The device opens a secure page (`/camera.html?session=<id>`) displaying the host's request and clear privacy guarantees.
4. **User Consent**: The device owner selects their preferred lens (Front/Rear) and resolution, then explicitly clicks **"Allow & Start Camera"**.
5. **Encrypted WebRTC Stream**: Once permission is granted, a direct P2P connection is negotiated via WebSocket signaling and streams live video to the host monitor.
6. **Session Termination**: Either device can click **"End Session"** at any time to instantly cut camera hardware power and tear down the connection.

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

### 3. Open the Host Dashboard
Open `http://localhost:3000` (or `https://localhost:3443`) in your desktop browser.

### 4. Connect a Camera
- **Using a Smartphone**: Point your phone camera at the QR code on screen. Open the link in Safari or Chrome, review the permissions, and tap **"Allow & Start Camera"**.
- **Testing on the Same PC**: Click the **"Test Link"** button in the QR card to open a camera tab side-by-side in a second window!

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
