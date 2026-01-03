export class LiveViewManager {
  constructor(container, videoElement) {
    this.container = container;
    this.video = videoElement;
    this.children = [];
    this.fpsEl = this.container.querySelector(".fps-counter");
    this.showKeypoint = true;
  }

  setKeypointVisible(visible) {
    this.showKeypoint = visible;
    if (!visible) {
      this.clear();
    }
  }

  show() {
    this.container.classList.remove("invisible");
  }

  hide() {
    this.container.classList.add("invisible");
    this.clear();
    this.fpsEl.textContent = "";
  }

  clear() {
    for (let child of this.children) {
      this.container.removeChild(child);
    }
    this.children = [];
  }

  updateKeypoint(x, y) {
    this.clear();

    if (!this.showKeypoint) return;

    const keypointEl = document.createElement("span");
    keypointEl.className = "key-point";

    // Convert [-1, 1] to percentage [0, 100] for CSS positioning
    const leftPercent = ((x + 1) / 2) * 100;
    const topPercent = ((y + 1) / 2) * 100;

    keypointEl.style.left = `calc(${leftPercent}% - 3px)`;
    keypointEl.style.top = `calc(${topPercent}% - 3px)`;

    this.container.appendChild(keypointEl);
    this.children.push(keypointEl);
  }

  updateFPS(fps) {
    this.fpsEl.textContent = `FPS: ${Math.round(fps)}`;
  }
}
