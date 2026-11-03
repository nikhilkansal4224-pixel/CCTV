// SENTINEL // Ultralytics YOLOv8 Client-Side Neural Vision Engine
// Runs official YOLOv8n ONNX model directly inside the browser using ONNX Runtime Web (WASM/WebGPU).

const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
  'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
  'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

class YoloV8Detector {
  constructor(modelPath = '/models/yolov8n.onnx') {
    this.modelPath = modelPath;
    this.session = null;
    this.loading = false;
    this.isInferring = false;
    this.inputSize = 640;
    this.channelSize = this.inputSize * this.inputSize;
    this.floatData = new Float32Array(3 * this.channelSize); // Reusable pre-allocated buffer
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.inputSize;
    this.offscreenCanvas.height = this.inputSize;
    this.ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true, alpha: false });
  }

  async load() {
    if (this.session) return this.session;
    if (this.loading) {
      let waitLoops = 0;
      while (this.loading && waitLoops < 60) {
        await new Promise(r => setTimeout(r, 50));
        waitLoops++;
      }
      return this.session;
    }

    if (typeof ort === 'undefined') {
      console.warn('[YOLOv8] ONNX Runtime Web library (ort) not loaded.');
      return null;
    }

    this.loading = true;
    try {
      // Configure rock-solid WASM SIMD execution.
      // numThreads = 1 is guaranteed to never deadlock or freeze in browsers without SharedArrayBuffer / COOP isolation.
      if (ort.env && ort.env.wasm) {
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;
      }

      console.log('[YOLOv8] Initializing Ultralytics YOLOv8 session (WASM SIMD)...');
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      console.log('[YOLOv8] Session ready. Neural network loaded.');
      this.loading = false;
      return this.session;
    } catch (err) {
      console.error('[YOLOv8] Failed to load ONNX model:', err);
      this.loading = false;
      return null;
    }
  }

  /**
   * Preprocess video or image element into Float32Array [1, 3, 640, 640] with ZERO memory churn
   */
  preprocess(media) {
    this.ctx.drawImage(media, 0, 0, this.inputSize, this.inputSize);
    const imgData = this.ctx.getImageData(0, 0, this.inputSize, this.inputSize);
    const data = imgData.data;

    const floatData = this.floatData;
    const channelSize = this.channelSize;
    const ch2 = channelSize * 2;
    const inv255 = 0.00392156862745098; // 1 / 255.0

    // High-speed planar RGB conversion without allocating memory in hot loop
    for (let i = 0; i < channelSize; i++) {
      const idx = i * 4;
      floatData[i] = data[idx] * inv255;
      floatData[channelSize + i] = data[idx + 1] * inv255;
      floatData[ch2 + i] = data[idx + 2] * inv255;
    }

    return floatData;
  }

  /**
   * Run object detection inference on a video or image frame (Non-blocking & thread-safe)
   */
  async detect(media, confThreshold = 0.38, iouThreshold = 0.45) {
    if (this.isInferring) {
      return []; // Frame dropped cleanly to preserve smooth 60fps UI
    }

    if (!this.session) {
      await this.load();
      if (!this.session) return [];
    }

    this.isInferring = true;
    try {
      const naturalW = media.videoWidth || media.naturalWidth || media.width || 640;
      const naturalH = media.videoHeight || media.naturalHeight || media.height || 480;

      const floatData = this.preprocess(media);
      const inputTensor = new ort.Tensor('float32', floatData, [1, 3, this.inputSize, this.inputSize]);

      const inputName = this.session.inputNames[0] || 'images';
      const feeds = {};
      feeds[inputName] = inputTensor;

      const results = await this.session.run(feeds);
      const outputName = this.session.outputNames[0] || 'output0';
      const outputTensor = results[outputName];

      // Output shape is [1, 84, 8400]
      const [batch, channels, numBoxes] = outputTensor.dims;
      const rawData = outputTensor.data;

      const numClasses = channels - 4;
      const classOffsets = new Int32Array(numClasses);
      for (let c = 0; c < numClasses; c++) {
        classOffsets[c] = (c + 4) * numBoxes;
      }

      const boxes = [];
      const scaleX = naturalW / this.inputSize;
      const scaleY = naturalH / this.inputSize;

      // High-speed parsing of candidate predictions
      for (let i = 0; i < numBoxes; i++) {
        let maxScore = 0;
        let maxClassId = -1;

        for (let c = 0; c < numClasses; c++) {
          const score = rawData[classOffsets[c] + i];
          if (score > maxScore) {
            maxScore = score;
            maxClassId = c;
          }
        }

        if (maxScore >= confThreshold) {
          const xc = rawData[i];
          const yc = rawData[numBoxes + i];
          const w = rawData[2 * numBoxes + i];
          const h = rawData[3 * numBoxes + i];

          const x = Math.max(0, xc - w * 0.5);
          const y = Math.max(0, yc - h * 0.5);

          boxes.push({
            class: COCO_CLASSES[maxClassId] || `class_${maxClassId}`,
            classId: maxClassId,
            score: maxScore,
            bbox: [x * scaleX, y * scaleY, w * scaleX, h * scaleY],
          });

          // Prevent quadratic NMS explosion
          if (boxes.length >= 60) break;
        }
      }

      // Apply Non-Maximum Suppression (NMS)
      return this.applyNms(boxes, iouThreshold);
    } catch (err) {
      console.warn('[YOLOv8] Inference warning:', err);
      return [];
    } finally {
      this.isInferring = false;
    }
  }

  /**
   * Non-Maximum Suppression (NMS) to eliminate duplicate overlapping boxes
   */
  applyNms(boxes, iouThreshold = 0.45) {
    if (boxes.length <= 1) return boxes;
    boxes.sort((a, b) => b.score - a.score);
    const selected = [];
    const limit = Math.min(boxes.length, 25);

    for (let i = 0; i < limit; i++) {
      let keep = true;
      const b1 = boxes[i].bbox;

      for (let j = 0; j < selected.length; j++) {
        const b2 = selected[j].bbox;
        const iou = this.calculateIoU(b1, b2);
        if (iou > iouThreshold) {
          keep = false;
          break;
        }
      }

      if (keep) {
        selected.push(boxes[i]);
      }
    }

    return selected;
  }

  calculateIoU(b1, b2) {
    const x1 = Math.max(b1[0], b2[0]);
    const y1 = Math.max(b1[1], b2[1]);
    const x2 = Math.min(b1[0] + b1[2], b2[0] + b2[2]);
    const y2 = Math.min(b1[1] + b1[3], b2[1] + b2[3]);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = b1[2] * b1[3];
    const area2 = b2[2] * b2[3];
    const union = area1 + area2 - intersection;

    return union > 0 ? intersection / union : 0;
  }
}

// Global instance export
window.YoloV8Detector = YoloV8Detector;
window.sentinelYolo = new YoloV8Detector();

