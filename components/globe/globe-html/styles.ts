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
  background-color: #05060A;
  background-image:
    radial-gradient(circle at 30px 40px, rgba(156, 185, 221, 0.16) 0.8px, transparent 1.4px),
    radial-gradient(circle at 90px 120px, rgba(132, 165, 206, 0.12) 0.7px, transparent 1.3px),
    radial-gradient(circle at 150px 70px, rgba(112, 144, 184, 0.10) 0.6px, transparent 1.2px);
  background-size: 180px 180px, 240px 240px, 300px 300px;
  opacity: 0.22;
}
#globe-viewport {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--cobe-canvas-css-size, 0px);
  height: var(--cobe-canvas-css-size, 0px);
  transform: translate(-50%, -50%);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  z-index: 2;
}
canvas {
  display: block;
  cursor: grab;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
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
    rgba(59, 130, 246, 0.06) 0%,
    rgba(59, 130, 246, 0.02) 45%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}
#marker-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
  contain: layout style;
}
@keyframes markerSelectionPulse {
  0% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(0.85);
  }
  70% {
    opacity: 0.12;
    transform: translate(-50%, -50%) scale(1.35);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
  }
}
/* ── Flat, stake-driven markers ──────────────────────────────
 * --cobe-stake-hue   : hue (210–225) driven by stakeNorm (blue spectrum)
 * --cobe-stake-light  : lightness (42%–78%) driven by stakeNorm
 * --cobe-stake-opacity: base opacity (0.45–1.0) driven by stakeNorm
 *
 * Low  stake → dim, muted blue    (hue 210, light 42%, opacity 0.45)
 * High stake → bright, vivid blue (hue 225, light 78%, opacity 1.0)
 */
.validator-marker {
  position: absolute;
  left: 0;
  top: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  transform: translate(-50%, -50%) translate(var(--cobe-marker-x, -9999px), var(--cobe-marker-y, -9999px));
  opacity: calc(var(--cobe-visible, 0) * var(--cobe-stake-opacity, 0.65));
  background: hsl(var(--cobe-stake-hue, 210), 72%, var(--cobe-stake-light, 58%));
  border: 1px solid hsla(var(--cobe-stake-hue, 210), 60%, 88%, 0.6);
  box-shadow: none;
  will-change: transform, opacity;
}
/* Remove the heavy pseudo-element glow entirely in base state */
.validator-marker::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    hsla(var(--cobe-stake-hue, 210), 80%, 70%, 0.18) 0%,
    transparent 70%
  );
  opacity: 0;
  pointer-events: none;
}
.validator-marker.is-selected {
  transform: translate(-50%, -50%) translate(var(--cobe-marker-x, -9999px), var(--cobe-marker-y, -9999px)) scale(1.1);
  border-color: hsla(var(--cobe-stake-hue, 210), 80%, 90%, 0.9);
  box-shadow: 0 0 8px hsla(var(--cobe-stake-hue, 210), 80%, 65%, 0.35);
  transition: box-shadow 120ms ease, border-color 120ms ease;
}
.validator-marker.is-selected::after {
  opacity: 0.3;
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
