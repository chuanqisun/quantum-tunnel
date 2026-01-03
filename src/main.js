import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import "./style.css";

const demosSection = document.getElementById("demos");

let faceDetector;
let runningMode = "IMAGE";

// Initialize the object detector
const initializefaceDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU",
    },
    runningMode: runningMode,
  });
  demosSection.classList.remove("invisible");
};
initializefaceDetector();

/********************************************************************
 // Continuously grab image from webcam stream and detect it.
 ********************************************************************/

let video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
let enableWebcamButton;

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", toggleCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

let webcamRunning = false;

// Enable the live webcam view and start detection.
async function toggleCam(event) {
  if (!faceDetector) {
    alert("Face Detector is still loading. Please try again..");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "START";

    // Stop the webcam stream
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => {
      track.stop();
    });
    video.srcObject = null;

    // Clear detections
    for (let child of children) {
      liveView.removeChild(child);
    }
    children.splice(0);
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "STOP";

    // getUsermedia parameters
    const constraints = {
      video: true,
    };

    // Activate the webcam stream.
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(async function (stream) {
        // Set to VIDEO mode since we only use webcam now
        if (runningMode === "IMAGE") {
          runningMode = "VIDEO";
          await faceDetector.setOptions({ runningMode: "VIDEO" });
        }
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
      })
      .catch((err) => {
        console.error(err);
        webcamRunning = false;
        enableWebcamButton.innerText = "START";
      });
  }
}

let lastVideoTime = -1;
async function predictWebcam() {
  if (!webcamRunning) {
    return;
  }
  let startTimeMs = performance.now();

  // Detect faces using detectForVideo
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const detections = faceDetector.detectForVideo(video, startTimeMs).detections;
    displayVideoDetections(detections);
  }

  // Call this function again to keep predicting when the browser is ready
  window.requestAnimationFrame(predictWebcam);
}

function displayVideoDetections(detections) {
  // Remove any highlighting from previous frame.

  for (let child of children) {
    liveView.removeChild(child);
  }
  children.splice(0);

  // Iterate through predictions and draw them to the live view
  for (let detection of detections) {
    // Calculate midpoint between eyes (keypoints 0 and 1)
    if (detection.keypoints.length >= 2) {
      const eye1 = detection.keypoints[0];
      const eye2 = detection.keypoints[1];
      const midX = (eye1.x + eye2.x) / 2;
      const midY = (eye1.y + eye2.y) / 2;

      const keypointEl = document.createElement("span");
      keypointEl.className = "key-point";
      keypointEl.style.top = `${midY * video.offsetHeight - 3}px`;
      keypointEl.style.left = `${video.offsetWidth - midX * video.offsetWidth - 3}px`;
      liveView.appendChild(keypointEl);
      children.push(keypointEl);
    }
  }
}
