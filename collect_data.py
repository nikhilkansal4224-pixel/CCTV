#!/usr/bin/env python3
"""
SENTINEL // Webcam Training Data Collector
Captures frames from the local webcam and organizes them into
YOLO dataset training and validation splits.
"""

import os
import time
import argparse
import cv2


def parse_args():
    parser = argparse.ArgumentParser(description="Sentinel Webcam Training Data Collector")
    parser.add_argument("--source", type=int, default=0, help="Camera device index (default: 0)")
    parser.add_argument("--label", type=str, default="object", help="Label or category name (e.g. person, pet, package)")
    parser.add_argument("--output", type=str, default="datasets/custom", help="Output dataset root directory")
    parser.add_argument("--auto", action="store_true", help="Auto-capture a frame every 1.5 seconds")
    return parser.parse_args()


def main():
    args = parse_args()

    train_dir = os.path.join(args.output, "images", "train")
    val_dir = os.path.join(args.output, "images", "val")
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)

    print("======================================================")
    print("  SENTINEL // WEBCAM TRAINING DATASET COLLECTOR")
    print("======================================================")
    print(f"  Target Label:  {args.label}")
    print(f"  Output Dir:    {args.output}")
    print("  Controls:")
    print("    [SPACE] - Capture single training frame")
    print("    [A]     - Toggle automatic periodic capture")
    print("    [Q/ESC] - Save and exit")
    print("======================================================\n")

    cap = cv2.VideoCapture(args.source)
    if not cap.isOpened():
        print(f"[!] Error: Could not open camera {args.source}")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    count = 0
    auto_mode = args.auto
    last_auto_time = time.time()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            display_frame = frame.copy()
            hud_text = f"COLLECTING: '{args.label}' | Captured: {count} | Auto: {'ON' if auto_mode else 'OFF'}"
            cv2.putText(display_frame, hud_text, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (16, 185, 129), 2)
            cv2.putText(display_frame, "Press SPACE to capture, 'A' for auto, 'Q' to quit", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            cv2.imshow("Sentinel Data Collector", display_frame)
            key = cv2.waitKey(1) & 0xFF

            now = time.time()
            capture_now = False

            if key == 32:  # Space
                capture_now = True
            elif key == ord('a') or key == ord('A'):
                auto_mode = not auto_mode
            elif key == ord('q') or key == 27:
                break

            if auto_mode and (now - last_auto_time >= 1.5):
                capture_now = True
                last_auto_time = now

            if capture_now:
                count += 1
                # 80% train, 20% val
                target_folder = val_dir if (count % 5 == 0) else train_dir
                filename = f"{args.label}_{int(time.time() * 1000)}.jpg"
                filepath = os.path.join(target_folder, filename)
                cv2.imwrite(filepath, frame)
                print(f"[+] Saved frame #{count} -> {filepath}")

    finally:
        cap.release()
        cv2.destroyAllWindows()

        # Generate data.yaml template
        yaml_path = os.path.join(args.output, "data.yaml")
        with open(yaml_path, "w") as f:
            f.write(f"""# Sentinel Custom Dataset Configuration
path: {os.path.abspath(args.output)}
train: images/train
val: images/val

names:
  0: {args.label}
""")
        print(f"\n[+] Dataset preparation complete. Captured {count} images.")
        print(f"[+] Configuration generated: {yaml_path}")
        print(f"[*] To train: python train_yolo.py --data {yaml_path}")


if __name__ == "__main__":
    main()

