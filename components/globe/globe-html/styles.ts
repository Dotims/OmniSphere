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
  overflow: visible;
  contain: layout style;
}
@keyframes markerSelectionPulse {
  0% {
    opacity: 0.32;
    transform: translate(-50%, -50%) scale(0.9);
  }
  70% {
    opacity: 0.16;
    transform: translate(-50%, -50%) scale(1.28);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.42);
  }
}
.validator-marker {
  position: absolute;
  left: 0;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  transform: translate(-50%, -50%) translate(var(--cobe-marker-x, -9999px), var(--cobe-marker-y, -9999px));
  opacity: var(--cobe-visible, 0);
  background: linear-gradient(165deg, #66ccff 0%, #1ab3ff 62%, #008ccc 100%);
  border: 1px solid rgba(232, 248, 255, 0.95);
  box-shadow:
    0 0 0 1px rgba(4, 10, 18, 0.72),
    0 0 14px rgba(26, 179, 255, 0.28);
  will-change: transform, opacity;
}
.validator-marker::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(102, 204, 255, 0.42) 0%,
    rgba(26, 179, 255, 0.20) 42%,
    rgba(26, 179, 255, 0.06) 66%,
    rgba(26, 179, 255, 0) 100%
  );
  opacity: 0;
  pointer-events: none;
}
.validator-marker.is-selected {
  transform: translate(-50%, -50%) translate(var(--cobe-marker-x, -9999px), var(--cobe-marker-y, -9999px)) scale(1.06);
  box-shadow:
    0 0 0 1px rgba(180, 228, 255, 0.84),
    0 0 12px rgba(26, 179, 255, 0.34);
  transition: box-shadow 120ms ease;
}
.validator-marker.is-selected::after {
  opacity: 0.26;
  animation: markerSelectionPulse 1.5s ease-out infinite;
}
.validator-marker.is-hidden,
.validator-marker.is-hidden::after {
  opacity: 0;
}
.validator-marker.is-hidden::after {
  animation: none;
}
`;
