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
var markerRenderStateById = Object.create(null);
var projectedMarkerList = [];
var selectedMarkerIds = [];
var markerLayer = document.getElementById('marker-layer');
var markersDirty = true;
var INTERNAL_MARKER_SIZE = 0.003;
var MARKER_POSITION_EPSILON_PX = 0.16;
var FRONTFACE_VISIBILITY_EPSILON = 0.02;
var lastProjectionFrame = {
  phi: Number.POSITIVE_INFINITY,
  theta: Number.POSITIVE_INFINITY,
  scale: Number.POSITIVE_INFINITY,
  cssSize: Number.POSITIVE_INFINITY,
};

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
    var latR = v.lat * Math.PI / 180;
    // COBE maps marker longitudes with a -PI shift; mirror that orientation
    // so DOM markers stay locked to the same landmass positions.
    var lonR = v.lon * Math.PI / 180 - Math.PI;
    var cosLat = Math.cos(latR);

    blueprints.push({
      id: v.id,
      location: [v.lat, v.lon],
      densityWeight: densityWeight,
      cart: [
        -cosLat * Math.cos(lonR),
        Math.sin(latR),
        cosLat * Math.sin(lonR),
      ],
    });
  }

  return blueprints;
}

function projectMarkerCartesian(cart, cosPhi, sinPhi, cosTheta, sinTheta, radius, centerX, centerY) {
  var x3d = cart[0];
  var y3d = cart[1];
  var z3d = cart[2];

  var rx = x3d * cosPhi + z3d * sinPhi;
  var ry = y3d;
  var rz = -x3d * sinPhi + z3d * cosPhi;

  var fx = rx;
  var fy = ry * cosTheta - rz * sinTheta;
  var fz = ry * sinTheta + rz * cosTheta;

  if (fz < -0.18) return null;

  var sx = centerX + fx * radius;
  var sy = centerY - fy * radius;
  var dx = sx - centerX;
  var dy = sy - centerY;
  var radialDistSq = dx * dx + dy * dy;
  var maxDistSq = radius * radius * 1.0404;

  if (radialDistSq > maxDistSq) return null;

  return {
    x: sx,
    y: sy,
    visible: fz > FRONTFACE_VISIBILITY_EPSILON,
  };
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
  var rawIds = Array.isArray(ids) ? ids : [];
  var deduped = [];
  var seen = Object.create(null);
  for (var i = 0; i < rawIds.length; i++) {
    var rawId = rawIds[i];
    if (typeof rawId !== 'string' || rawId.length === 0 || seen[rawId]) {
      continue;
    }
    seen[rawId] = true;
    deduped.push(rawId);
  }

  var known = Object.create(null);
  for (var j = 0; j < markerBlueprints.length; j++) {
    known[markerBlueprints[j].id] = true;
  }

  var nextSelected = deduped.filter(function(id) {
    return !!known[id];
  });

  if (nextSelected.length === selectedMarkerIds.length) {
    var unchanged = true;
    for (var k = 0; k < nextSelected.length; k++) {
      if (nextSelected[k] !== selectedMarkerIds[k]) {
        unchanged = false;
        break;
      }
    }
    if (unchanged) return;
  }

  selectedMarkerIds = nextSelected;
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
      el.style.setProperty('--cobe-marker-x', '-9999px');
      el.style.setProperty('--cobe-marker-y', '-9999px');
      el.style.setProperty('--cobe-visible', '0');
      markerLayer.appendChild(el);
    }

    nextById[marker.id] = el;
  }

  var existingIds = Object.keys(markerElementsById);
  for (var j = 0; j < existingIds.length; j++) {
    var staleId = existingIds[j];
    if (nextById[staleId]) continue;

    var staleEl = markerElementsById[staleId];
    if (staleEl) {
      if (staleEl.parentNode) {
        staleEl.parentNode.removeChild(staleEl);
      }
    }
    delete markerRenderStateById[staleId];
  }

  markerElementsById = nextById;
  // NOTE: syncMarkerSelectionClasses() removed here — updateMarkerAnchors(true)
  // always follows and handles selection state inline, avoiding double work.
}

function didProjectionFrameChange() {
  if (!isFinite(lastProjectionFrame.phi)) {
    lastProjectionFrame.phi = phi;
    lastProjectionFrame.theta = theta;
    lastProjectionFrame.scale = scale;
    lastProjectionFrame.cssSize = cssSize;
    return true;
  }

  var changed =
    Math.abs(lastProjectionFrame.phi - phi) > 0.0002 ||
    Math.abs(lastProjectionFrame.theta - theta) > 0.0002 ||
    Math.abs(lastProjectionFrame.scale - scale) > 0.0002 ||
    lastProjectionFrame.cssSize !== cssSize;

  if (!changed) return false;

  lastProjectionFrame.phi = phi;
  lastProjectionFrame.theta = theta;
  lastProjectionFrame.scale = scale;
  lastProjectionFrame.cssSize = cssSize;
  return true;
}

function updateMarkerAnchors(force) {
  if (!markerLayer || markerBlueprints.length === 0) {
    projectedMarkerList = [];
    return;
  }

  if (!force && !didProjectionFrameChange()) {
    return;
  }

  var cosPhi = Math.cos(phi);
  var sinPhi = Math.sin(phi);
  var cosTheta = Math.cos(theta);
  var sinTheta = Math.sin(theta);
  var radius = cssSize * 0.4 * scale;
  var centerX = cssSize / 2;
  var centerY = cssSize / 2;

  var selectedLookup = Object.create(null);
  for (var s = 0; s < selectedMarkerIds.length; s++) {
    selectedLookup[selectedMarkerIds[s]] = true;
  }

  var nextProjectedList = [];

  for (var i = 0; i < markerBlueprints.length; i++) {
    var marker = markerBlueprints[i];
    var markerEl = markerElementsById[marker.id];
    if (!markerEl) continue;

    var projection = projectMarkerCartesian(
      marker.cart,
      cosPhi,
      sinPhi,
      cosTheta,
      sinTheta,
      radius,
      centerX,
      centerY
    );
    var isValidAnchor = !!projection && projection.visible;
    var previous = markerRenderStateById[marker.id];
    var shouldSelect = !!selectedLookup[marker.id] && isValidAnchor;

    if (!isValidAnchor) {
      if (!previous || previous.visible) {
        markerEl.style.setProperty('--cobe-visible', '0');
        markerEl.classList.add('is-hidden');
      }
      if (!previous || previous.selected) {
        markerEl.classList.remove('is-selected');
      }

      markerRenderStateById[marker.id] = {
        x: 0,
        y: 0,
        visible: false,
        selected: false,
      };
      continue;
    }

    nextProjectedList.push({
      id: marker.id,
      x: projection.x,
      y: projection.y,
    });

    var moved =
      !previous ||
      !previous.visible ||
      Math.abs(previous.x - projection.x) > MARKER_POSITION_EPSILON_PX ||
      Math.abs(previous.y - projection.y) > MARKER_POSITION_EPSILON_PX;

    if (moved) {
      markerEl.style.setProperty('--cobe-marker-x', projection.x.toFixed(2) + 'px');
      markerEl.style.setProperty('--cobe-marker-y', projection.y.toFixed(2) + 'px');
    }

    if (!previous || !previous.visible) {
      markerEl.style.setProperty('--cobe-visible', '1');
      markerEl.classList.remove('is-hidden');
    }

    if (!previous || previous.selected !== shouldSelect) {
      markerEl.classList.toggle('is-selected', shouldSelect);
    }

    markerRenderStateById[marker.id] = {
      x: projection.x,
      y: projection.y,
      visible: true,
      selected: shouldSelect,
    };
  }

  projectedMarkerList = nextProjectedList;
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
      updateMarkerAnchors(false);

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
      validatorById = Object.create(null);
      for (var i = 0; i < validators.length; i++) {
        var validator = validators[i];
        if (validator && validator.id) {
          validatorById[validator.id] = validator;
        }
      }

      markerBlueprints = buildMarkerBlueprints(validators);
      markersDirty = true;
      materializeMarkers(true);
      pruneSelectionToKnownMarkers();
      upsertMarkerDom();
      updateMarkerAnchors(true);
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
