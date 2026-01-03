import GearVisualization from "./GearVisualization.js";

const gearVis = new GearVisualization("canvas-container", { layerCount: 16 });

window.addEventListener("mousemove", (e) => {
  const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  gearVis.update({ x, y });
});
