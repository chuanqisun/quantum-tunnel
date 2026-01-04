import { FaceTracker } from "./FaceTracker.js";
import GearVisualization from "./GearVisualization.js";
import "./hud.css";
import { LiveViewManager } from "./LiveViewManager.js";
import { WebcamManager } from "./WebcamManager.js";

const gearVis = new GearVisualization("canvas-container", { layerCount: 16 });

const mouseModeBtn = document.getElementById("mouseMode");
const eyeModeBtn = document.getElementById("eyeMode");
const statusText = document.getElementById("status-text");
const calibrateButton = document.getElementById("calibrateButton");
const video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");

let currentMode = "mouse";
let webcamManager = null;
let faceTracker = null;
let liveViewManager = null;

function updateParallax(x, y) {
  gearVis.update({ x, y });
}

const handlePointerMove = (e) => {
  if (currentMode !== "mouse") return;
  const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  updateParallax(x, y);
};

window.addEventListener("pointerdown", handlePointerMove);
window.addEventListener("pointermove", handlePointerMove);

async function initEyeTracking() {
  if (!webcamManager) {
    webcamManager = new WebcamManager(video);
    faceTracker = new FaceTracker(video);
    liveViewManager = new LiveViewManager(liveView, video);
    liveViewManager.setKeypointVisible(false);

    faceTracker.addEventListener("updated", (event) => {
      if (currentMode === "eye") {
        const { x, y } = event.detail;
        updateParallax(-x, -y);
        liveViewManager.updateKeypoint(x, y);
      }
    });

    faceTracker.addEventListener("fps", (event) => {
      if (currentMode === "eye") {
        liveViewManager.updateFPS(event.detail.fps);
      }
    });

    faceTracker.addEventListener("calibrated", () => {
      calibrateButton.disabled = false;
      calibrateButton.textContent = "CALIBRATE";
    });
  }

  try {
    await webcamManager.start();
    liveViewManager.show();
    faceTracker.start();
  } catch (err) {
    console.error("Failed to start eye tracking:", err);
    alert("Failed to access webcam.");
    switchMode("mouse");
  }
}

function stopEyeTracking() {
  if (webcamManager) {
    webcamManager.stop();
    faceTracker.stop();
    liveViewManager.hide();
  }
}

function switchMode(mode) {
  currentMode = mode;
  if (mode === "mouse") {
    mouseModeBtn.classList.add("active");
    eyeModeBtn.classList.remove("active");
    statusText.textContent = "MOVE TO EXPLORE";
    stopEyeTracking();
  } else {
    mouseModeBtn.classList.remove("active");
    eyeModeBtn.classList.add("active");
    statusText.textContent = "MOVE HEAD TO EXPLORE";
    initEyeTracking();
  }
}

mouseModeBtn.addEventListener("click", () => switchMode("mouse"));
eyeModeBtn.addEventListener("click", () => switchMode("eye"));

calibrateButton.addEventListener("click", () => {
  calibrateButton.disabled = true;
  calibrateButton.textContent = "CALIBRATING...";
  faceTracker.calibrate();
});

FaceTracker.preloadOnIdle();
