import { FaceTracker } from "./FaceTracker.js";
import { LiveViewManager } from "./LiveViewManager.js";
import "./style.css";
import { WebcamManager } from "./WebcamManager.js";

const video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

if (!navigator.mediaDevices?.getUserMedia) {
  console.warn("getUserMedia() is not supported by your browser");
  startButton.disabled = true;
}

const webcamManager = new WebcamManager(video);
const faceTracker = new FaceTracker(video);
const liveViewManager = new LiveViewManager(liveView, video);

// Inter-module communication via events
webcamManager.addEventListener("started", () => {
  startButton.classList.add("hidden");
  liveViewManager.show();
  faceTracker.start();
});

webcamManager.addEventListener("stopped", () => {
  startButton.classList.remove("hidden");
  faceTracker.stop();
  liveViewManager.hide();
});

faceTracker.addEventListener("updated", (event) => {
  const { x, y } = event.detail;
  liveViewManager.updateKeypoint(x, y);
});

startButton.addEventListener("click", () => {
  webcamManager.start().catch((err) => {
    console.error(err);
    alert("Failed to start webcam. Please ensure access is granted.");
  });
});

stopButton.addEventListener("click", () => {
  webcamManager.stop();
});
