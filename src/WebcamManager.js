export class WebcamManager extends EventTarget {
  constructor(videoElement) {
    super();
    this.video = videoElement;
    this.stream = null;
    this.running = false;
  }

  async start() {
    if (this.running) return;

    const constraints = { video: true };
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      return new Promise((resolve) => {
        const onLoadedData = () => {
          this.video.removeEventListener("loadeddata", onLoadedData);
          this.running = true;
          this.dispatchEvent(new CustomEvent("started", { detail: { stream: this.stream } }));
          resolve(this.stream);
        };
        this.video.addEventListener("loadeddata", onLoadedData);
      });
    } catch (err) {
      console.error("Error accessing webcam:", err);
      throw err;
    }
  }

  stop() {
    if (!this.running) return;

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.running = false;
    this.dispatchEvent(new CustomEvent("stopped"));
  }
}
