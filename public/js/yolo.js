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
      while (this.loading) {
        await new Promise(r => setTimeout(r, 60));
      }
      return this.session;
    }

    if (typeof ort === 'undefined') {
      console.warn('[YOLOv8] ONNX Runtime Web library (ort) not loaded.');
      return null;
    }

    this.loading = true;
    try {
      // Configure ONNX Runtime Web options with WebGPU + WASM SIMD
      ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 4);
      ort.env.wasm.simd = true;

      const executionProviders = [];
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        executionProviders.push('webgpu');
      }
      executionProviders.push('wasm');

      console.log(`[YOLOv8] Initializing Ultralytics YOLOv8 session (${executionProviders.join(', ')})...`);
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders,
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
   * Run object detection inference on a video or image frame
   */
  async detect(media, confThreshold = 0.38, iouThreshold = 0.45) {
    if (!this.session) {
      await this.load();
      if (!this.session) return [];
    }

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

    const boxes = [];

    // Parse candidate predictions
    for (let i = 0; i < numBoxes; i++) {
      let maxScore = 0;
      let maxClassId = -1;

      // 80 classes start at channel index 4
      for (let c = 4; c < channels; c++) {
        const score = rawData[c * numBoxes + i];
        if (score > maxScore) {
          maxScore = score;
          maxClassId = c - 4;
        }
      }

      if (maxScore >= confThreshold) {
        const xc = rawData[0 * numBoxes + i];
        const yc = rawData[1 * numBoxes + i];
        const w = rawData[2 * numBoxes + i];
        const h = rawData[3 * numBoxes + i];

        // Convert center coordinates to corner coordinates [x, y, w, h] normalized to inputSize
        const x = Math.max(0, xc - w / 2);
        const y = Math.max(0, yc - h / 2);

        // Scale to source media dimensions
        const scaleX = naturalW / this.inputSize;
        const scaleY = naturalH / this.inputSize;

        boxes.push({
          class: COCO_CLASSES[maxClassId] || `class_${maxClassId}`,
          classId: maxClassId,
          score: maxScore,
          bbox: [x * scaleX, y * scaleY, w * scaleX, h * scaleY],
        });
      }
    }

    // Apply Non-Maximum Suppression (NMS)
    return this.applyNms(boxes, iouThreshold);
  }

  /**
   * Non-Maximum Suppression (NMS) to eliminate duplicate overlapping boxes
   */
  applyNms(boxes, iouThreshold = 0.45) {
    boxes.sort((a, b) => b.score - a.score);
    const selected = [];

    for (let i = 0; i < boxes.length; i++) {
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

