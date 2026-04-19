/**
 * JavaScript injected into the globe WebView that handles:
 *  - COBE globe instantiation
 *  - The render loop (auto-rotation + velocity damping)
 *  - The data bridge (receiving validator markers from React Native)
 *
 * This script fragment is concatenated after the interaction script
 * inside the same IIFE.  It relies on variables declared there
 * (phi, theta, scale, currentMarkers, validatorData, etc.).
 */
export const GLOBE_SCRIPT = `
// ── Create Globe ───────────────────────────────────────────
try {
  var globe = createGlobe(canvas, {
    devicePixelRatio: Math.min(window.devicePixelRatio || 2, 2),
    width: canvasWidth,
    height: canvasHeight,
    phi: phi,
    theta: theta,
    dark: 1,
    diffuse: 1.4,
    scale: scale,
    mapSamples: 16000,
    mapBrightness: 3.2,
    baseColor: [0.1, 0.1, 0.15],
    markerColor: [0.1, 0.7, 1],
    glowColor: [0.05, 0.1, 0.2],
    markers: currentMarkers,
    onRender: function(state) {
      if (isAutoRotationEnabled && !pointerDown && !isPinching) {
        phi += 0.003;
        phi += velocity[0];
        theta += velocity[1];
        velocity[0] *= 0.92;
        velocity[1] *= 0.92;
        theta = Math.max(-1.4, Math.min(1.4, theta));
      }
      state.phi = phi;
      state.theta = theta;
      state.scale = scale;
      state.markers = currentMarkers;
      state.width = canvasWidth;
      state.height = canvasHeight;
    }
  });
} catch(err) {
  document.body.innerHTML = '<p style="color:#EF4444;text-align:center;padding-top:40vh;font-family:system-ui">GL error: ' + err.message + '</p>';
  postParentMessage(JSON.stringify({ type: 'error', msg: err.message }));
  return;
}

// Signal to RN that the globe is ready
postParentMessage(JSON.stringify({ type: 'ready' }));

// ── Data bridge ────────────────────────────────────────────
function handleMessage(event) {
  try {
    var raw = event.data;
    if (typeof raw !== 'string') return;
    var data = JSON.parse(raw);

    if (data.type === 'validators') {
      var validators = data.payload;
      validatorData = validators; // store for hit detection

      currentMarkers = validators.map(function(v) {
        return {
          location: [v.lat, v.lon],
          size: Math.max(0.05, Math.min(0.12, (v.stakeNorm || 0.5) * 0.12))
        };
      });
    }
  } catch(e) {}
}

document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);
`;
