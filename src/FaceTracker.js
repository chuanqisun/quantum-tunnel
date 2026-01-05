import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { Smoother } from "./Smoother.js";

export class FaceTracker extends EventTarget {
  static #detectorPromise = null;

  static preloadOnIdle() {
    // on supporting browsers, requestIdleCallback. Otherwise, preload after short delay
    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        () => {
          FaceTracker.preloadLibrary();
        },
        {
          timeout: 1000,
        }
      );
    } else {
      setTimeout(() => {
        FaceTracker.preloadLibrary();
      }, 1000);
    }
  }

  static async preloadLibrary() {
    if (this.#detectorPromise) return this.#detectorPromise;

    this.#detectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      return FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
      });
    })();

    return this.#detectorPromise;
  }

  constructor(videoElement, smoothFactor = 0.3) {
    super();
    this.video = videoElement;
    this.faceDetector = null;
    this.running = false;
    this.lastVideoTime = -1;
    this.requestRef = null;
    this.restingPoint = { x: 0, y: 0 };
    this.isCalibrating = false;
    this.calibrationData = [];
    this.fps = 0;
    this.lastFrameTime = 0;

    this.smootherX = new Smoother(smoothFactor);
    this.smootherY = new Smoother(smoothFactor);
  }

  async #initialize() {
    if (this.faceDetector) return;
    this.faceDetector = await FaceTracker.preloadLibrary();
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
    this.lastFrameTime = 0;
    this.fps = 0;
    this.smootherX.reset();
    this.smootherY.reset();
    if (this.requestRef) {
      cancelAnimationFrame(this.requestRef);
      this.requestRef = null;
    }

    this.dispatchEvent(new CustomEvent("stopped"));
  }

  calibrate() {
    if (!this.running) return;
    this.isCalibrating = true;
    this.calibrationData = [];

    setTimeout(() => {
      this.isCalibrating = false;
      if (this.calibrationData.length > 0) {
        const sumX = this.calibrationData.reduce((acc, p) => acc + p.x, 0);
        const sumY = this.calibrationData.reduce((acc, p) => acc + p.y, 0);
        this.restingPoint = {
          x: sumX / this.calibrationData.length,
          y: sumY / this.calibrationData.length,
        };
      }
      this.dispatchEvent(new CustomEvent("calibrated", { detail: this.restingPoint }));
    }, 1000);
  }

  #predict() {
    if (!this.running) return;

    const startTimeMs = performance.now();

    if (this.lastFrameTime > 0) {
      const delta = startTimeMs - this.lastFrameTime;
      const currentFps = 1000 / delta;
      this.fps = this.fps * 0.9 + currentFps * 0.1;
    }
    this.lastFrameTime = startTimeMs;
    this.dispatchEvent(new CustomEvent("fps", { detail: { fps: this.fps } }));

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
          const rawX = (1 - midX) * 2 - 1;
          const rawY = midY * 2 - 1;

          if (this.isCalibrating) {
            this.calibrationData.push({ x: rawX, y: rawY });
          }

          const x = this.smootherX.next(rawX - this.restingPoint.x);
          const y = this.smootherY.next(rawY - this.restingPoint.y);

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
