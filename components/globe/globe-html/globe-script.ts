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
// ── Marker data + DOM layer ───────────────────────────────
var markerBlueprints = [];
var markerElementsById = Object.create(null);
var selectedMarkerIds = [];
var markerLayer = document.getElementById('marker-layer');
var markersDirty = true;
var INTERNAL_MARKER_SIZE = 0.003;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cssTokenFromId(id) {
  return String(id || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
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

    var densityWeight = clamp(1 / (1 + neighbors * 0.18), 0.55, 1);

    blueprints.push({
      id: v.id,
      token: cssTokenFromId(v.id),
      location: [v.lat, v.lon],
      densityWeight: densityWeight,
    });
  }

  return blueprints;
}

function markerVarName(axis, token) {
  return '--cobe-marker-' + axis + '-' + token;
}

function clearMarkerAnchor(token) {
  container.style.removeProperty(markerVarName('x', token));
  container.style.removeProperty(markerVarName('y', token));
}

function materializeMarkers(force) {
  if (!force && !markersDirty) {
    return;
  }

  markersDirty = false;

  currentMarkers = markerBlueprints.map(function(marker) {
    return {
      location: marker.location,
      // Keep COBE markers effectively invisible; DOM markers handle visuals.
      size: INTERNAL_MARKER_SIZE,
    };
  });
}

function pruneSelectionToKnownMarkers() {
  if (selectedMarkerIds.length === 0) return;

  var known = Object.create(null);
  for (var i = 0; i < markerBlueprints.length; i++) {
    known[markerBlueprints[i].id] = true;
  }

  selectedMarkerIds = selectedMarkerIds.filter(function(id) {
    return !!known[id];
  });
}

function setSelectedMarkerIds(ids) {
  if (!Array.isArray(ids)) {
    selectedMarkerIds = [];
    syncMarkerSelectionClasses();
    return;
  }

  var deduped = [];
  var seen = Object.create(null);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (typeof id !== 'string' || id.length === 0 || seen[id]) {
      continue;
    }
    seen[id] = true;
    deduped.push(id);
  }

  selectedMarkerIds = deduped;
  pruneSelectionToKnownMarkers();
  syncMarkerSelectionClasses();
}

function syncMarkerSelectionClasses() {
  var selectedLookup = Object.create(null);
  for (var i = 0; i < selectedMarkerIds.length; i++) {
    selectedLookup[selectedMarkerIds[i]] = true;
  }

  var markerIds = Object.keys(markerElementsById);
  for (var j = 0; j < markerIds.length; j++) {
    var id = markerIds[j];
    var el = markerElementsById[id];
    if (!el) continue;
    var isSelected = !!selectedLookup[id] && !el.classList.contains('is-hidden');
    el.classList.toggle('is-selected', isSelected);
  }
}

function upsertMarkerDom() {
  if (!markerLayer) {
    markerLayer = document.getElementById('marker-layer');
  }
  if (!markerLayer) return;

  var nextById = Object.create(null);

  for (var i = 0; i < markerBlueprints.length; i++) {
    var marker = markerBlueprints[i];
    var el = markerElementsById[marker.id];

    if (!el) {
      el = document.createElement('div');
      el.className = 'validator-marker is-hidden';
      el.setAttribute('data-marker-id', marker.id);
      markerLayer.appendChild(el);
    }

    el.setAttribute('data-marker-token', marker.token);
    el.style.setProperty('--marker-x', 'var(' + markerVarName('x', marker.token) + ', -9999px)');
    el.style.setProperty('--marker-y', 'var(' + markerVarName('y', marker.token) + ', -9999px)');
    el.style.setProperty('--marker-opacity', '0');

    nextById[marker.id] = el;
  }

  var existingIds = Object.keys(markerElementsById);
  for (var j = 0; j < existingIds.length; j++) {
    var staleId = existingIds[j];
    if (nextById[staleId]) continue;

    var staleEl = markerElementsById[staleId];
    if (staleEl) {
      var staleToken = staleEl.getAttribute('data-marker-token');
      if (staleToken) {
        clearMarkerAnchor(staleToken);
      }
      if (staleEl.parentNode) {
        staleEl.parentNode.removeChild(staleEl);
      }
    }
  }

  markerElementsById = nextById;
  syncMarkerSelectionClasses();
}

function updateMarkerAnchors() {
  if (!markerLayer || markerBlueprints.length === 0) {
    return;
  }

  for (var i = 0; i < markerBlueprints.length; i++) {
    var marker = markerBlueprints[i];
    var markerEl = markerElementsById[marker.id];
    if (!markerEl) continue;

    var projection = latLonToScreen(marker.location[0], marker.location[1]);
    var isValidAnchor = !!projection && projection.visible;

    if (!isValidAnchor) {
      clearMarkerAnchor(marker.token);
      markerEl.style.setProperty('--marker-opacity', '0');
      markerEl.classList.add('is-hidden');
      markerEl.classList.remove('is-selected');
      continue;
    }

    container.style.setProperty(markerVarName('x', marker.token), projection.x + 'px');
    container.style.setProperty(markerVarName('y', marker.token), projection.y + 'px');
    markerEl.style.setProperty('--marker-opacity', '1');
    markerEl.classList.remove('is-hidden');
  }

  syncMarkerSelectionClasses();
}

// ── Create Globe ───────────────────────────────────────────
try {
  materializeMarkers(true);

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
    markerColor: [0.0, 0.0, 0.0],
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
      updateMarkerAnchors();

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
      var validators = Array.isArray(data.payload) ? data.payload : [];
      validatorData = validators; // store for hit detection

      markerBlueprints = buildMarkerBlueprints(validators);
      markersDirty = true;
      materializeMarkers(true);
      pruneSelectionToKnownMarkers();
      upsertMarkerDom();
      updateMarkerAnchors();
    }

    if (data.type === 'selection') {
      var ids =
        data.payload && Array.isArray(data.payload.ids)
          ? data.payload.ids
          : [];
      setSelectedMarkerIds(ids);
    }
  } catch(e) {}
}

document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);
`;
