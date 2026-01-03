import p5 from "https://cdnjs.cloudflare.com/ajax/libs/p5.js/2.0.0/p5.esm.min.js";

export default class GearVisualization {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.layerCount = options.layerCount || 16;
    this.entry = { x: 0, y: 0 };
    this.layers = [];

    this.COLORS = ["#00f2ff", "#0066ff", "#ffffff", "#33bbff", "#7000ff", "#00ff88", "#ff006a", "#ffaa00"];
    this.LABELS = ["SYNC", "LOCK", "TRK", "NAV", "SYS", "PWR", "DATA", "LINK", "SCAN", "PROC", "MEM", "CPU", "NET", "SEC", "AUTH", "INIT"];
    this.UNITS = ["Hz", "MHz", "GHz", "ms", "μs", "dB", "Δ", "%", "°", "rad"];

    this.instance = new p5((p) => {
      this.p = p;
      p.setup = () => this.setup();
      p.draw = () => this.draw();
      p.windowResized = () => this.windowResized();
    }, containerId);
  }

  setup() {
    const p = this.p;
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.angleMode(p.DEGREES);
    p.textFont("Courier New");
    this.generateHUD();

    const regenBtn = document.getElementById("regen");
    if (regenBtn) {
      regenBtn.addEventListener("click", () => this.generateHUD());
    }
  }

  update(entry) {
    if (entry && typeof entry.x === "number" && typeof entry.y === "number") {
      this.entry = entry;
    }
  }

  generateHUD() {
    const p = this.p;
    this.layers = [];
    for (let i = 0; i < this.layerCount; i++) {
      this.layers.push({
        elements: this.generateRingElements(i),
        depth: i - this.layerCount / 2 + 0.5,
        rotationSpeed: p.random([-0.8, -0.5, -0.2, -0.1, 0.1, 0.2, 0.5, 0.8]) * p.random(0.5, 2),
        currentRot: p.random(360),
        labels: this.generateLabels(i),
      });
    }
  }

  generateLabels(layerIndex) {
    const p = this.p;
    let labels = [];
    let numLabels = p.floor(p.random(0, 4));

    for (let i = 0; i < numLabels; i++) {
      labels.push({
        text: p.random(this.LABELS) + "_" + p.floor(p.random(100, 999)),
        angle: p.random(360),
        radius: p.random(100, 220),
        size: p.random([7, 8, 9, 10]),
        color: p.color(p.random(this.COLORS)),
      });
    }
    return labels;
  }

  generateRingElements(layerIndex) {
    const p = this.p;
    let elements = [];
    let numRings = p.floor(p.random(4, 10));
    let baseRadius = 40 + layerIndex * 15;

    for (let i = 0; i < numRings; i++) {
      let col = p.color(p.random(this.COLORS));
      col.setAlpha(p.random(100, 255));

      let radius = baseRadius + i * p.random(12, 25);

      elements.push({
        radius: radius,
        type: p.random(["ticks", "ticks", "dashed", "arc", "arc", "arc", "dots", "solid", "segments", "graduations", "numbers", "pointers", "brackets"]),
        weight: p.random([0.5, 0.75, 1, 1.5, 2]),
        color: col,
        arcStart: p.random(360),
        arcLen: p.random([15, 30, 45, 60, 90, 120, 180, 270]),
        dashPattern: [p.random(2, 15), p.random(3, 15)],
        tickCount: p.random([6, 12, 24, 36, 48, 60, 72, 90]),
        rotationOffset: p.random(360),
        individualSpeed: p.random(-0.3, 0.3),
        currentIndividualRot: 0,
        label: p.random(this.LABELS),
        value: p.floor(p.random(0, 1000)),
        unit: p.random(this.UNITS),
        numCount: p.random([4, 6, 8, 12]),
        pointerCount: p.random([1, 2, 3, 4]),
        bracketCount: p.random([2, 3, 4, 6]),
      });
    }
    return elements;
  }

  draw() {
    const p = this.p;
    p.background(2, 5, 8);

    let mx = this.entry.x;
    let my = this.entry.y;
    let dist = p.constrain(p.sqrt(mx * mx + my * my), 0, 1);

    let maxDepth = this.layerCount / 2 - 0.5;
    let spreadX = (mx * (p.width / 2)) / maxDepth;
    let spreadY = (my * (p.height / 2)) / maxDepth;

    let sortedLayers = [...this.layers].sort((a, b) => a.depth - b.depth);

    sortedLayers.forEach((layer) => {
      p.push();
      p.translate(p.width / 2, p.height / 2);

      let xOffset = layer.depth * spreadX;
      let yOffset = layer.depth * spreadY;
      p.translate(xOffset, yOffset);

      let depthNormalized = layer.depth / (this.layerCount / 2);
      let scaleRange = dist * 0.35;
      let layerScale = 1.0 + depthNormalized * scaleRange;

      p.scale(layerScale);

      let alphaMultiplier = p.map(depthNormalized * dist, -1, 1, 0.5, 1.2);
      alphaMultiplier = p.constrain(alphaMultiplier, 0.4, 1.0);

      layer.currentRot += layer.rotationSpeed;

      // Draw elements
      layer.elements.forEach((el) => {
        el.currentIndividualRot += el.individualSpeed;

        p.push();
        p.rotate(layer.currentRot + el.rotationOffset + el.currentIndividualRot);

        let adjustedColor = p.color(el.color.toString());
        let baseAlpha = p.alpha(el.color);
        adjustedColor.setAlpha(baseAlpha * alphaMultiplier);

        p.noFill();
        p.stroke(adjustedColor);
        p.strokeWeight(el.weight);
        p.drawingContext.setLineDash([]);

        const d = el.radius * 2;
        const r = el.radius;

        switch (el.type) {
          case "ticks":
            for (let a = 0; a < 360; a += 360 / el.tickCount) {
              let isMajor = a % (360 / (el.tickCount / 6)) < 1;
              let len = isMajor ? 10 : 4;
              let w = isMajor ? el.weight * 1.5 : el.weight;
              p.strokeWeight(w);
              p.line(p.cos(a) * r, p.sin(a) * r, p.cos(a) * (r + len), p.sin(a) * (r + len));
            }
            break;

          case "dashed":
            p.drawingContext.setLineDash(el.dashPattern);
            p.ellipse(0, 0, d, d);
            p.drawingContext.setLineDash([]);
            break;

          case "arc":
            p.strokeCap(p.SQUARE);
            p.arc(0, 0, d, d, el.arcStart, el.arcStart + el.arcLen);
            break;

          case "dots":
            p.fill(adjustedColor);
            p.noStroke();
            for (let a = 0; a < 360; a += 360 / el.tickCount) {
              let isMajor = a % 30 < 1;
              let size = isMajor ? 4 : 2;
              p.circle(p.cos(a) * r, p.sin(a) * r, size);
            }
            break;

          case "segments":
            p.strokeCap(p.SQUARE);
            let segAngle = 360 / 8;
            for (let a = 0; a < 360; a += segAngle) {
              p.arc(0, 0, d, d, a + 3, a + segAngle - 6);
            }
            break;

          case "graduations":
            for (let a = 0; a < 360; a += 6) {
              let len = a % 30 === 0 ? 12 : a % 15 === 0 ? 7 : 3;
              p.strokeWeight(a % 30 === 0 ? 1.5 : 0.5);
              p.line(p.cos(a) * r, p.sin(a) * r, p.cos(a) * (r + len), p.sin(a) * (r + len));
            }
            break;

          case "numbers":
            p.fill(adjustedColor);
            p.noStroke();
            p.textSize(7);
            p.textAlign(p.CENTER, p.CENTER);
            for (let i = 0; i < el.numCount; i++) {
              let a = (360 / el.numCount) * i;
              let val = p.floor((el.value / el.numCount) * i);
              p.push();
              p.translate(p.cos(a) * (r + 8), p.sin(a) * (r + 8));
              p.rotate(a + 90);
              p.text(val.toString().padStart(3, "0"), 0, 0);
              p.pop();
            }
            break;

          case "pointers":
            p.strokeWeight(2);
            for (let i = 0; i < el.pointerCount; i++) {
              let a = (360 / el.pointerCount) * i + el.arcStart;
              p.line(p.cos(a) * (r - 15), p.sin(a) * (r - 15), p.cos(a) * (r + 5), p.sin(a) * (r + 5));
              p.fill(adjustedColor);
              p.noStroke();
              p.push();
              p.translate(p.cos(a) * (r + 8), p.sin(a) * (r + 8));
              p.rotate(a + 90);
              p.triangle(0, -4, -3, 4, 3, 4);
              p.pop();
              p.stroke(adjustedColor);
              p.noFill();
            }
            break;

          case "brackets":
            p.strokeWeight(1.5);
            p.strokeCap(p.SQUARE);
            for (let i = 0; i < el.bracketCount; i++) {
              let a = (360 / el.bracketCount) * i;
              p.arc(0, 0, d + 10, d + 10, a - 8, a + 8);
              p.line(p.cos(a - 8) * (r + 5), p.sin(a - 8) * (r + 5), p.cos(a - 8) * (r + 12), p.sin(a - 8) * (r + 12));
              p.line(p.cos(a + 8) * (r + 5), p.sin(a + 8) * (r + 5), p.cos(a + 8) * (r + 12), p.sin(a + 8) * (r + 12));
            }
            break;

          case "solid":
          default:
            p.ellipse(0, 0, d, d);
            break;
        }

        p.pop();
      });

      // Draw layer labels
      layer.labels.forEach((lbl) => {
        p.push();
        p.rotate(layer.currentRot);

        let lblColor = p.color(lbl.color.toString());
        lblColor.setAlpha(200 * alphaMultiplier);

        p.fill(lblColor);
        p.noStroke();
        p.textSize(lbl.size);
        p.textAlign(p.LEFT, p.CENTER);

        let x = p.cos(lbl.angle) * lbl.radius;
        let y = p.sin(lbl.angle) * lbl.radius;

        p.push();
        p.translate(x, y);

        let textAngle = lbl.angle;
        if (textAngle > 90 && textAngle < 270) {
          p.rotate(textAngle + 180);
          p.textAlign(p.RIGHT, p.CENTER);
        } else {
          p.rotate(textAngle);
        }

        p.text("◄ " + lbl.text, 5, 0);
        p.pop();

        p.pop();
      });

      // Add floating data readouts
      if (Math.abs(layer.depth) > 3) {
        p.push();

        let dataColor = p.color("#00f2ff");
        dataColor.setAlpha(180 * alphaMultiplier);
        p.fill(dataColor);
        p.noStroke();
        p.textSize(8);

        let angle = layer.currentRot * 0.5;
        let dataRadius = 250;

        p.push();
        p.rotate(angle);
        p.translate(dataRadius, 0);
        p.rotate(-angle);

        let val1 = (p.sin(p.frameCount * 0.5 + layer.depth * 50) * 50 + 50).toFixed(1);
        let val2 = (p.cos(p.frameCount * 0.3 + layer.depth * 30) * 100 + 100).toFixed(0);

        p.textAlign(p.LEFT, p.CENTER);
        p.text(`LAYER_${(layer.depth + 6).toFixed(0)}`, 0, -12);
        p.text(`FLUX: ${val1}%`, 0, 0);
        p.text(`RATE: ${val2} Hz`, 0, 12);

        p.stroke(dataColor);
        p.strokeWeight(0.5);
        p.line(-30, -12, -5, -12);
        p.line(-30, -12, -30, 12);

        p.pop();
        p.pop();
      }

      p.pop();
    });

    // Center core display
    p.push();
    // Use the entry point for the core display position
    p.translate(p.width / 2 + mx * (p.width / 2), p.height / 2 + my * (p.height / 2));

    p.noFill();
    p.stroke(0, 255, 200, 60);
    p.strokeWeight(1);
    p.circle(0, 0, 30);
    p.circle(0, 0, 50);

    p.push();
    p.rotate(p.frameCount * 0.5);
    p.stroke(0, 255, 255, 150);
    p.strokeWeight(2);
    for (let i = 0; i < 4; i++) {
      p.rotate(90);
      p.line(8, 0, 20, 0);
    }
    p.pop();

    p.fill(0, 255, 200);
    p.noStroke();
    p.circle(0, 0, 6);

    p.fill(255, 200);
    p.textSize(6);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("ENTRY", 0, 35);

    p.pop();

    // HUD info panel
    p.push();
    p.fill(0, 20, 30, 200);
    p.noStroke();
    p.rect(10, p.height - 100, 180, 90, 3);

    p.fill(0, 255, 200, 200);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text("─── SYSTEM STATUS ───", 20, p.height - 90);
    p.textSize(9);
    p.fill(0, 255, 200, 150);
    p.text(`PARALLAX X: ${(mx * 100).toFixed(1)}%`, 20, p.height - 70);
    p.text(`PARALLAX Y: ${(my * 100).toFixed(1)}%`, 20, p.height - 55);
    p.text(`DISPERSION: ${(dist * 100).toFixed(1)}%`, 20, p.height - 40);
    p.text(`LAYERS: ${this.layerCount} ACTIVE`, 20, p.height - 25);
    p.pop();

    p.push();
    p.fill(0, 255, 200, 150);
    p.textSize(9);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`FRAME: ${p.frameCount}`, p.width - 20, 80);
    p.text(`TIME: ${new Date().toLocaleTimeString()}`, p.width - 20, 95);
    p.pop();
  }

  windowResized() {
    this.p.resizeCanvas(this.p.windowWidth, this.p.windowHeight);
  }
}
