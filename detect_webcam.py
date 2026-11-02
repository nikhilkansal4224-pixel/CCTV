#!/usr/bin/env python3
"""
SENTINEL // Local Webcam Object Detection with YOLOv8n
Continuously fetches frames from local webcam (source 0),
executes YOLOv8n neural inference, and displays annotated detections.
"""

import os
os.environ.setdefault('YOLO_CONFIG_DIR', '/tmp/Ultralytics')
import sys
import time
import argparse
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

import cv2
from ultralytics import YOLO

# Global frame buffer for optional web streaming
LATEST_FRAME_JPEG = None
FRAME_LOCK = threading.Lock()


class MJPEGHandler(BaseHTTPRequestHandler):
    """Lightweight HTTP MJPEG streaming handler for Sentinel web dashboard integration."""

    def log_message(self, format, *args):
        # Silence per-frame HTTP access logs
        return

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ('/', '/video', '/videofeed'):
            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=--frameboundary')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            while True:
                with FRAME_LOCK:
                    frame_bytes = LATEST_FRAME_JPEG

                if frame_bytes:
                    try:
                        self.wfile.write(b'--frameboundary\r\n')
                        self.wfile.write(b'Content-Type: image/jpeg\r\n')
                        self.wfile.write(f'Content-Length: {len(frame_bytes)}\r\n\r\n'.encode('utf-8'))
                        self.wfile.write(frame_bytes)
                        self.wfile.write(b'\r\n')
                    except (BrokenPipeError, ConnectionResetError):
                        break
                time.sleep(0.033)  # ~30 FPS
        elif parsed.path == '/status.json':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok","app":"Sentinel YOLOv8n Stream"}')
        else:
            self.send_response(404)
            self.end_headers()


def start_web_server(port=8088):
    """Start background HTTP MJPEG stream server."""
    server = HTTPServer(('0.0.0.0', port), MJPEGHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def parse_args():
    parser = argparse.ArgumentParser(description="Sentinel YOLOv8 Local Webcam Object Detection")
    parser.add_argument("--source", type=int, default=0, help="Webcam device index (default: 0)")
    parser.add_argument("--model", type=str, default="yolov8s.pt", help="YOLOv8 weights path (default: yolov8s.pt for higher accuracy, or yolov8n.pt)")
    parser.add_argument("--conf", type=float, default=0.38, help="Confidence threshold (default: 0.38)")
    parser.add_argument("--iou", type=float, default=0.45, help="IoU threshold for NMS (default: 0.45)")
    parser.add_argument("--imgsz", type=int, default=640, help="Inference resolution (default: 640; use 1280 for small distant objects)")
    parser.add_argument("--augment", action="store_true", help="Enable Test-Time Augmentation (TTA) for higher detection recall")
    parser.add_argument("--no-gui", action="store_true", help="Run in headless mode without cv2.imshow window")
    parser.add_argument("--web", action="store_true", default=True, help="Serve live MJPEG stream over HTTP (default: True)")
    parser.add_argument("--port", type=int, default=8088, help="HTTP MJPEG stream port (default: 8088)")
    return parser.parse_args()


def main():
    global LATEST_FRAME_JPEG
    args = parse_args()

    print("======================================================")
    print("  SENTINEL // LOCAL WEBCAM YOLOv8 OBJECT DETECTION")
    print("======================================================")

    # 1. Load YOLOv8 Model
    print(f"[*] Loading YOLOv8 model from '{args.model}'...")
    model = YOLO(args.model)
    print(f"[+] Model loaded successfully ({model.model.names if hasattr(model, 'model') else 'YOLOv8'}).")

    # 2. Open Local Webcam Stream (source 0)
    print(f"[*] Initializing camera capture on device index {args.source}...")
    cap = cv2.VideoCapture(args.source)

    if not cap.isOpened():
        print(f"[!] Warning: Unable to open camera source {args.source}.")
        print("[*] Searching for alternative camera indices (1, 2)...")
        found = False
        for alt_idx in [1, 2]:
            cap = cv2.VideoCapture(alt_idx)
            if cap.isOpened():
                print(f"[+] Connected to camera index {alt_idx}.")
                found = True
                break
        if not found:
            print("[x] Error: No available webcam found. Please check camera connection and permissions.")
            sys.exit(1)

    # Set camera resolution to 720p HD if supported
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[+] Webcam resolution: {actual_w}x{actual_h}")

    # 3. Optional Web Streaming Server
    if args.web:
        start_web_server(args.port)
        print(f"[+] Live MJPEG Stream available at: http://localhost:{args.port}/video")
        print(f"    (Can be added as Dummy CCTV / IP Camera in Sentinel website at port {args.port})")

    if not args.no_gui:
        print("[*] Press 'q' or 'ESC' in the display window to exit.")
    print("------------------------------------------------------")
    print("  LIVE INFERENCE ACTIVE")
    print("------------------------------------------------------")

    prev_time = time.time()
    fps = 0.0
    frame_count = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[!] Failed to grab frame from camera stream.")
                time.sleep(0.1)
                continue

            frame_count += 1

            # Execute YOLOv8 detection with enhanced inference parameters
            results = model(
                frame,
                conf=args.conf,
                iou=args.iou,
                imgsz=args.imgsz,
                augment=args.augment,
                verbose=False
            )
            result = results[0]

            # Render detection bounding boxes and labels
            annotated_frame = result.plot()

            # Calculate FPS
            curr_time = time.time()
            fps = 1.0 / max(curr_time - prev_time, 1e-5)
            prev_time = curr_time

            # Format detection telemetry summary
            boxes = result.boxes
            detected_classes = {}
            if boxes is not None:
                for cls_id in boxes.cls:
                    name = model.names[int(cls_id)]
                    detected_classes[name] = detected_classes.get(name, 0) + 1

            summary_text = ", ".join([f"{count} {name.upper()}" for name, count in detected_classes.items()])
            if not summary_text:
                summary_text = "NO TARGETS"

            # Draw Sentinel Cybernetic HUD Overlay on frame
            hud_y = 30
            cv2.rectangle(annotated_frame, (10, 10), (actual_w - 10, 50), (14, 14, 18), -1)
            cv2.rectangle(annotated_frame, (10, 10), (actual_w - 10, 50), (255, 255, 255), 1)
            hud_label = f"SENTINEL AI // YOLOv8n // FPS: {fps:.1f} // TARGETS: {summary_text}"
            cv2.putText(annotated_frame, hud_label, (20, hud_y + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (16, 185, 129), 2)

            # Update global MJPEG JPEG buffer for web stream
            if args.web:
                _, jpeg_buf = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                with FRAME_LOCK:
                    LATEST_FRAME_JPEG = jpeg_buf.tobytes()

            # Console log every 30 frames
            if frame_count % 30 == 0:
                print(f"[AI HUD] FPS: {fps:.1f} | Detections: {summary_text}")

            # Display GUI window
            if not args.no_gui:
                cv2.imshow("SENTINEL // YOLOv8n Webcam Detection", annotated_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == 27:  # 'q' or ESC
                    print("[*] Exit signal received.")
                    break

    except KeyboardInterrupt:
        print("\n[*] Terminating on user interrupt...")
    finally:
        cap.release()
        if not args.no_gui:
            cv2.destroyAllWindows()
        print("[+] Camera hardware released cleanly. Session ended.")


if __name__ == '__main__':
    main()

