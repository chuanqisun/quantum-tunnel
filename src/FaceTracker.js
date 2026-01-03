import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

export class FaceTracker extends EventTarget {
  constructor(videoElement) {
    super();
    this.video = videoElement;
    this.faceDetector = null;
    this.running = false;
    this.lastVideoTime = -1;
    this.requestRef = null;
  }

  async #initialize() {
    if (this.faceDetector) return;
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    this.faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
    });
  }

  async start() {
    if (this.running) return;

    await this.#initialize();

    this.running = true;
    this.#predict();
    this.dispatchEvent(new CustomEvent("started"));
  }

  stop() {
    if (!this.running) return;

    this.running = false;
    if (this.requestRef) {
      cancelAnimationFrame(this.requestRef);
      this.requestRef = null;
    }

    this.dispatchEvent(new CustomEvent("stopped"));
  }

  #predict() {
    if (!this.running) return;

    const startTimeMs = performance.now();
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.faceDetector.detectForVideo(this.video, startTimeMs);

      if (result.detections && result.detections.length > 0) {
        const detection = result.detections[0];
        if (detection.keypoints && detection.keypoints.length >= 2) {
          const eye1 = detection.keypoints[0];
          const eye2 = detection.keypoints[1];
          const midX = (eye1.x + eye2.x) / 2;
          const midY = (eye1.y + eye2.y) / 2;

          // Convert to [-1, 1]
          // Mirrored X: (1 - midX) * 2 - 1
          const x = (1 - midX) * 2 - 1;
          const y = midY * 2 - 1;

          this.dispatchEvent(
            new CustomEvent("updated", {
              detail: { x, y },
            })
          );
        }
      }
    }

    this.requestRef = requestAnimationFrame(() => this.#predict());
  }
}
