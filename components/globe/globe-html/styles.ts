/**
 * CSS styles injected into the globe WebView.
 *
 * Separated from the HTML template so styling changes don't require
 * touching the interaction / rendering logic.
 */
export const GLOBE_CSS = `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #05060A;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
#globe-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.space-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: #04060c;
  background-image:
    radial-gradient(circle at 30px 40px, rgba(156, 185, 221, 0.16) 0.8px, transparent 1.4px),
    radial-gradient(circle at 90px 120px, rgba(132, 165, 206, 0.12) 0.7px, transparent 1.3px),
    radial-gradient(circle at 150px 70px, rgba(112, 144, 184, 0.10) 0.6px, transparent 1.2px);
  background-size: 180px 180px, 240px 240px, 300px 300px;
  opacity: 0.22;
}
canvas {
  display: block;
  cursor: grab;
  position: relative;
  z-index: 2;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
}
canvas:active { cursor: grabbing; }
.glow {
  position: absolute;
  top: 50%; left: 50%;
  width: 60%; height: 60%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(20, 44, 78, 0.20) 0%,
    rgba(12, 28, 52, 0.10) 45%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}
#marker-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--cobe-canvas-css-size, 0px);
  height: var(--cobe-canvas-css-size, 0px);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
  contain: strict;
}
.validator-marker {
  position: absolute;
  left: var(--marker-x, -9999px);
  top: var(--marker-y, -9999px);
  width: 10px;
  height: 10px;
  border-radius: 2px;
  transform: translate(-50%, -50%);
  opacity: var(--marker-opacity, 0);
  background: linear-gradient(165deg, #66ccff 0%, #1ab3ff 62%, #008ccc 100%);
  border: 1px solid rgba(232, 248, 255, 0.95);
  box-shadow:
    0 0 0 1px rgba(4, 10, 18, 0.72),
    0 0 14px rgba(26, 179, 255, 0.28);
  will-change: left, top, opacity, transform;
  transition: opacity 120ms linear, transform 120ms ease, box-shadow 120ms ease;
}
.validator-marker::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(102, 204, 255, 0.85);
  box-shadow: 0 0 0 2px rgba(26, 179, 255, 0.25);
  opacity: 0;
  transition: opacity 100ms ease;
}
.validator-marker.is-selected {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow:
    0 0 0 1px rgba(180, 228, 255, 0.9),
    0 0 16px rgba(26, 179, 255, 0.42);
}
.validator-marker.is-selected::after {
  opacity: 1;
}
.validator-marker.is-hidden,
.validator-marker.is-hidden::after {
  opacity: 0;
}
`;
