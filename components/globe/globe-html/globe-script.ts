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
// ── Marker sizing (density + zoom aware) ──────────────────
var markerBlueprints = [];
var lastScaleBucket = -1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function angularDistanceDeg(lat1, lon1, lat2, lon2) {
  var toRad = Math.PI / 180;
  var p1 = lat1 * toRad;
  var p2 = lat2 * toRad;
  var dPhi = (lat2 - lat1) * toRad;
  var dLambda = (lon2 - lon1) * toRad;

  var a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c * (180 / Math.PI);
}

function buildMarkerBlueprints(validators) {
  var DENSITY_RADIUS_DEG = 1.35;
  var BLUEPRINT_MAX_SIZE = 0.12;
  var blueprints = [];

  for (var i = 0; i < validators.length; i++) {
    var v = validators[i];
    var neighbors = 0;

    for (var j = 0; j < validators.length; j++) {
      if (i === j) continue;
      var o = validators[j];

      // Fast reject before doing angular distance math.
      if (Math.abs(v.lat - o.lat) > 2.4 || Math.abs(v.lon - o.lon) > 2.4) {
        continue;
      }

      if (angularDistanceDeg(v.lat, v.lon, o.lat, o.lon) <= DENSITY_RADIUS_DEG) {
        neighbors += 1;
      }
    }

    var baseSize = clamp((v.stakeNorm || 0.5) * 0.12, 0.05, BLUEPRINT_MAX_SIZE);
    var densityScale = clamp(1 / (1 + neighbors * 0.18), 0.55, 1);

    blueprints.push({
      location: [v.lat, v.lon],
      baseSize: baseSize,
      densityScale: densityScale,
    });
  }

  return blueprints;
}

function getZoomMarkerScale(currentScale) {
  var zoomDelta = Math.max(0, currentScale - 1);
  return 1 / (1 + zoomDelta * 1.7);
}

function materializeMarkers(force) {
  var scaleBucket = Math.round(scale * 100);
  if (!force && scaleBucket === lastScaleBucket) {
    return;
  }

  lastScaleBucket = scaleBucket;
  var zoomScale = getZoomMarkerScale(scale);

  currentMarkers = markerBlueprints.map(function(marker) {
    var sized = marker.baseSize * marker.densityScale * zoomScale;
    return {
      location: marker.location,
      size: clamp(sized, 0.018, 0.11),
    };
  });
}

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
        var rampProgress = 1;
        if (autoRotationRampStartTs > 0) {
          var elapsed = Date.now() - autoRotationRampStartTs;
          rampProgress = clamp(elapsed / AUTO_ROTATION_ACCELERATION_MS, 0, 1);

          if (rampProgress >= 1) {
            autoRotationRampStartTs = 0;
          }
        }

        // Smoothstep ease-in so restart feels like gaining momentum.
        var easedRamp = rampProgress * rampProgress * (3 - 2 * rampProgress);

        phi += 0.003 * easedRamp;
        phi += velocity[0];
        theta += velocity[1];
        velocity[0] *= 0.92;
        velocity[1] *= 0.92;
        theta = Math.max(-1.4, Math.min(1.4, theta));
      }

      materializeMarkers(false);

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

      markerBlueprints = buildMarkerBlueprints(validators);
      materializeMarkers(true);
    }
  } catch(e) {}
}

document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);
`;
