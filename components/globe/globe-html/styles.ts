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
`;
