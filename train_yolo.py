#!/usr/bin/env python3
"""
SENTINEL // YOLOv8 Training & Fine-Tuning Pipeline
Trains or fine-tunes YOLOv8 on custom CCTV/surveillance datasets with
Apple Silicon GPU (MPS) acceleration and automatic ONNX web export.
"""

import os
os.environ.setdefault('YOLO_CONFIG_DIR', '/tmp/Ultralytics')
import sys
import shutil
import argparse
import torch
from ultralytics import YOLO


def check_acceleration():
    """Detect hardware acceleration (Apple Silicon MPS, CUDA GPU, or CPU)."""
    if torch.backends.mps.is_available():
        print("[+] Hardware Acceleration: Apple Silicon Metal (MPS) detected.")
        return "mps"
    elif torch.cuda.is_available():
        device_name = torch.cuda.get_device_name(0)
        print(f"[+] Hardware Acceleration: NVIDIA CUDA GPU ({device_name}) detected.")
        return "0"
    else:
        print("[!] Hardware Acceleration: CPU only (training will be slower).")
        return "cpu"


def parse_args():
    parser = argparse.ArgumentParser(description="Sentinel YOLOv8 Training & Fine-Tuning Pipeline")
    parser.add_argument("--data", type=str, default="coco8.yaml",
                        help="Dataset YAML path (default: coco8.yaml for demo fine-tuning)")
    parser.add_argument("--model", type=str, default="yolov8s.pt",
                        help="Base pre-trained model weights (default: yolov8s.pt for higher accuracy)")
    parser.add_argument("--epochs", type=int, default=25,
                        help="Number of training epochs (default: 25)")
    parser.add_argument("--imgsz", type=int, default=640,
                        help="Image resolution for training (default: 640)")
    parser.add_argument("--batch", type=int, default=16,
                        help="Batch size (default: 16)")
    parser.add_argument("--device", type=str, default=None,
                        help="Compute device ('mps', 'cuda', 'cpu'; auto-detected if not specified)")
    parser.add_argument("--lr0", type=float, default=0.01,
                        help="Initial learning rate (default: 0.01)")
    parser.add_argument("--export-onnx", action="store_true", default=True,
                        help="Automatically export best model to ONNX for web deployment (default: True)")
    parser.add_argument("--deploy-web", action="store_true", default=True,
                        help="Copy exported ONNX model to public/models/ for Vercel/Web deployment (default: True)")
    return parser.parse_args()


def main():
    args = parse_args()
    device = args.device or check_acceleration()

    print("======================================================")
    print("  SENTINEL // YOLOv8 TRAINING & TUNING ENGINE")
    print("======================================================")
    print(f"  Base Model:       {args.model}")
    print(f"  Dataset:          {args.data}")
    print(f"  Epochs:           {args.epochs}")
    print(f"  Image Size:       {args.imgsz}x{args.imgsz}")
    print(f"  Batch Size:       {args.batch}")
    print(f"  Compute Device:   {device.upper()}")
    print("======================================================\n")

    # 1. Initialize Model
    print(f"[*] Loading base model '{args.model}'...")
    model = YOLO(args.model)

    # 2. Start Training with Optimized Hyperparameters for Surveillance
    print("[*] Starting training with data augmentations (mosaic, fliplr, mixup)...")
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        lr0=args.lr0,
        lrf=0.01,            # Cosine annealing factor
        mosaic=1.0,          # Mosaic augmentation for multi-scale small objects
        mixup=0.1,           # Image blending to prevent overfitting
        fliplr=0.5,          # Horizontal flip augmentation
        degrees=10.0,        # Slight rotation augmentation
        hsv_h=0.015,         # Color jittering for varying daylight/night conditions
        hsv_s=0.7,
        hsv_v=0.4,
        save=True,
        plots=True,
        verbose=True,
    )

    print("\n[+] Training completed successfully!")

    # 3. Validation & Metrics
    print("[*] Evaluating validation metrics on best weights...")
    metrics = model.val()
    print(f"  mAP50:     {metrics.box.map50:.4f}")
    print(f"  mAP50-95:  {metrics.box.map:.4f}")

    # 4. Export to ONNX for Browser / Vercel Web Deployment
    if args.export_onnx:
        print("[*] Exporting best model to ONNX with graph slimming...")
        onnx_path = model.export(format="onnx", imgsz=args.imgsz, opset=18)
        print(f"[+] ONNX model exported: {onnx_path}")

        if args.deploy_web and onnx_path and os.path.exists(onnx_path):
            target_dir = os.path.join(os.getcwd(), "public", "models")
            os.makedirs(target_dir, exist_ok=True)
            target_file = os.path.join(target_dir, "yolov8n.onnx")
            shutil.copyfile(onnx_path, target_file)
            print(f"[+] Deployed updated model to web directory: {target_file}")
            print("    (Ready for local dashboard and Vercel production deployment!)")

    print("\n======================================================")
    print("  ALL TRAINING & EXPORT TASKS FINISHED SUCCESSFULLY")
    print("======================================================")


if __name__ == "__main__":
    main()
