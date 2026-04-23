export const DOM_RENDERER_SCRIPT = `
function buildMarkerBlueprints(validators) {
  var DENSITY_RADIUS_DEG = 1.35;
  var blueprints = [];

  for (var i = 0; i < validators.length; i++) {
    var v = validators[i];
    var neighbors = 0;

    for (var j = 0; j < validators.length; j++) {
      if (i === j) continue;
      var o = validators[j];

      if (Math.abs(v.lat - o.lat) > 2.4 || Math.abs(v.lon - o.lon) > 2.4) continue;
      if (angularDistanceDeg(v.lat, v.lon, o.lat, o.lon) <= DENSITY_RADIUS_DEG) {
        neighbors += 1;
      }
    }

    var densityWeight = clamp(1 / (1 + neighbors * 0.18), 0.55, 1);
    var latR = v.lat * Math.PI / 180;
    var lonR = v.lon * Math.PI / 180 - Math.PI;
    var cosLat = Math.cos(latR);

    // Preserve stakeNorm from payload (0–1, already normalized by RN bridge)
    var sn = typeof v.stakeNorm === 'number' ? clamp(v.stakeNorm, 0, 1) : 0;

    blueprints.push({
      id: v.id,
      location: [v.lat, v.lon],
      densityWeight: densityWeight,
      stakeNorm: sn,
      cart: [ -cosLat * Math.cos(lonR), Math.sin(latR), cosLat * Math.sin(lonR) ],
    });
  }
  return blueprints;
}

// ── Stake → visual mapping ─────────────────────────────────
// Uses a logarithmic curve so the wide range of stake values
// produces a visually meaningful distribution rather than
// everything clustering at the dim end.
//
//   t = log(1 + stakeNorm * 99) / log(100)
//
// stakeNorm 0.0  → t ≈ 0.0   (dimmest)
// stakeNorm 0.01 → t ≈ 0.15
// stakeNorm 0.10 → t ≈ 0.50
// stakeNorm 0.50 → t ≈ 0.85
// stakeNorm 1.0  → t = 1.0   (brightest)

var LOG100 = Math.log(100);

function stakeToVisual(stakeNorm) {
  var t = Math.log(1 + stakeNorm * 99) / LOG100;
  // hue:     210 (subtle blue) → 225 (vibrant blue) for high stake
  var hue     = Math.round(210 + t * 15);
  // lightness: 42% (dim) → 78% (bright)
  var light   = Math.round(42 + t * 36);
  // opacity:  0.45 (faint) → 1.0 (fully opaque)
  var opacity = (0.45 + t * 0.55).toFixed(2);
  return { hue: hue, light: light, opacity: opacity };
}

function applyStakeStyle(el, stakeNorm) {
  var vis = stakeToVisual(stakeNorm);
  el.style.setProperty('--cobe-stake-hue', vis.hue);
  el.style.setProperty('--cobe-stake-light', vis.light + '%');
  el.style.setProperty('--cobe-stake-opacity', vis.opacity);
}

function materializeMarkers(force) {
  if (!force && !markersDirty) return;
  markersDirty = false;
  currentMarkers = markerBlueprints.map(function(marker) {
    return { location: marker.location, size: INTERNAL_MARKER_SIZE };
  });
}

function pruneSelectionToKnownMarkers() {
  if (selectedMarkerIds.length === 0) return;
  var known = Object.create(null);
  for (var i = 0; i < markerBlueprints.length; i++) known[markerBlueprints[i].id] = true;
  selectedMarkerIds = selectedMarkerIds.filter(function(id) { return !!known[id]; });
}

function setSelectedMarkerIds(ids) {
  var rawIds = Array.isArray(ids) ? ids : [];
  var deduped = [];
  var seen = Object.create(null);
  for (var i = 0; i < rawIds.length; i++) {
    var rawId = rawIds[i];
    if (typeof rawId !== 'string' || rawId.length === 0 || seen[rawId]) continue;
    seen[rawId] = true;
    deduped.push(rawId);
  }

  var known = Object.create(null);
  for (var j = 0; j < markerBlueprints.length; j++) known[markerBlueprints[j].id] = true;
  var nextSelected = deduped.filter(function(id) { return !!known[id]; });

  if (nextSelected.length === selectedMarkerIds.length) {
    var unchanged = true;
    for (var k = 0; k < nextSelected.length; k++) {
      if (nextSelected[k] !== selectedMarkerIds[k]) { unchanged = false; break; }
    }
    if (unchanged) return;
  }

  selectedMarkerIds = nextSelected;
  syncMarkerSelectionClasses();
}

function syncMarkerSelectionClasses() {
  var selectedLookup = Object.create(null);
  for (var i = 0; i < selectedMarkerIds.length; i++) selectedLookup[selectedMarkerIds[i]] = true;

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
  if (!markerLayer) markerLayer = document.getElementById('marker-layer');
  if (!markerLayer) return;

  var nextById = Object.create(null);
  // Build a quick lookup from id → blueprint for stake data
  var blueprintById = Object.create(null);
  for (var b = 0; b < markerBlueprints.length; b++) {
    blueprintById[markerBlueprints[b].id] = markerBlueprints[b];
  }

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

    // Apply stake-driven visual styling
    applyStakeStyle(el, marker.stakeNorm);

    nextById[marker.id] = el;
  }

  var existingIds = Object.keys(markerElementsById);
  for (var j = 0; j < existingIds.length; j++) {
    var staleId = existingIds[j];
    if (nextById[staleId]) continue;

    var staleEl = markerElementsById[staleId];
    if (staleEl && staleEl.parentNode) staleEl.parentNode.removeChild(staleEl);
    delete markerRenderStateById[staleId];
  }

  markerElementsById = nextById;
}

function updateMarkerAnchors(force, renderPhi, renderTheta, renderScale) {
  if (!markerLayer || markerBlueprints.length === 0) {
    projectedMarkerList = [];
    return;
  }

  // Hydration barrier: don't reveal any markers until the globe's
  // onRender loop has completed at least one frame, ensuring phi,
  // theta, scale, and cssSize all hold real, rendered values.
  if (!globeRenderedFirstFrame) {
    projectedMarkerList = [];
    return;
  }

  var cosPhi = Math.cos(phi);
  var sinPhi = Math.sin(phi);
  var cosTheta = Math.cos(theta);
  var sinTheta = Math.sin(theta);
  var radius = cssSize * 0.4 * scale;
  var centerX = viewportW / 2;
  var centerY = viewportH / 2;

  var selectedLookup = Object.create(null);
  for (var s = 0; s < selectedMarkerIds.length; s++) {
    selectedLookup[selectedMarkerIds[s]] = true;
  }

  var projectedIndex = 0;

  for (var i = 0; i < markerBlueprints.length; i++) {
    var marker = markerBlueprints[i];
    var markerEl = markerElementsById[marker.id];
    if (!markerEl) continue;

    var projection = projectMarkerCartesian(
      marker.cart, cosPhi, sinPhi, cosTheta, sinTheta, radius, centerX, centerY
    );
    var isValidAnchor = !!projection && projection.visible;
    var previous = markerRenderStateById[marker.id];
    
    if (!previous) {
      previous = { x: 0, y: 0, visible: false, selected: false };
      markerRenderStateById[marker.id] = previous;
    }

    var shouldSelect = !!selectedLookup[marker.id] && isValidAnchor;

    if (!isValidAnchor) {
      if (previous.visible) {
        markerEl.style.setProperty('--cobe-visible', '0');
        markerEl.classList.add('is-hidden');
      }
      if (previous.selected) {
        markerEl.classList.remove('is-selected');
      }

      previous.x = 0;
      previous.y = 0;
      previous.visible = false;
      previous.selected = false;
      continue;
    }

    var projObj = projectedMarkerList[projectedIndex];
    if (projObj) {
      projObj.id = marker.id;
      projObj.x = projection.x;
      projObj.y = projection.y;
    } else {
      projectedMarkerList.push({ id: marker.id, x: projection.x, y: projection.y });
    }
    projectedIndex++;

    markerEl.style.setProperty('--cobe-marker-x', projection.x.toFixed(2) + 'px');
    markerEl.style.setProperty('--cobe-marker-y', projection.y.toFixed(2) + 'px');

    if (!previous.visible) {
      markerEl.style.setProperty('--cobe-visible', '1');
      markerEl.classList.remove('is-hidden');
    }

    if (previous.selected !== shouldSelect) {
      markerEl.classList.toggle('is-selected', shouldSelect);
    }

    previous.x = projection.x;
    previous.y = projection.y;
    previous.visible = true;
    previous.selected = shouldSelect;
  }

  projectedMarkerList.length = projectedIndex;
}
`;
