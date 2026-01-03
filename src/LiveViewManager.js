export class LiveViewManager {
  constructor(container, videoElement) {
    this.container = container;
    this.video = videoElement;
    this.children = [];
  }

  show() {
    this.container.classList.remove("invisible");
  }

  hide() {
    this.container.classList.add("invisible");
    this.clear();
  }

  clear() {
    for (let child of this.children) {
      this.container.removeChild(child);
    }
    this.children = [];
  }

  updateKeypoint(x, y) {
    this.clear();

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
}
