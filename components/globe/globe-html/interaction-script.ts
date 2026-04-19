/**
 * JavaScript injected into the globe WebView that handles all user interaction:
 *  - Pointer (mouse) drag
 *  - Touch drag (single finger)
 *  - Pinch-to-zoom + two-finger rotation
 *  - Tap / marker hit-detection
 *  - Auto-rotation pause / resume
 *
 * This script fragment is concatenated inside an IIFE by `buildGlobeHTML`.
 * It expects the following variables to already be declared in the enclosing
 * scope: canvas, container, postParentMessage.
 *
 * NOTE: Auto-rotation resume delay is set to 1750 ms (1.75 s),
 * followed by a short acceleration ramp for smooth ease-in.
 */
export const INTERACTION_SCRIPT = `
// ── State ──────────────────────────────────────────────────
var currentMarkers = [];
var validatorData = [];   // full validator payload for hit detection
var validatorById = Object.create(null);
var phi = 0.3;
var theta = 0.15;
var scale = 1.0;          // zoom level
var dragStart = null;
var touchDragStart = null;
var multiTouchCenter = null;
var velocity = [0, 0];
var pointerDown = false;
var canvasWidth = 0;
var canvasHeight = 0;
var cssSize = 0;          // canvas CSS pixel size (for hit detection)

// ── Tap detection state ─────────────────────────────────────
var tapStartPos = null;
var tapStartTime = 0;
var TAP_THRESHOLD_PX = 25;   // max movement to still count as tap
var TAP_THRESHOLD_MS = 500;  // max duration to still count as tap

// ── Pinch-to-zoom state ─────────────────────────────────────
var pinchStartDist = 0;
var pinchStartScale = 1.0;
var isPinching = false;

// ── Auto-rotation state ───────────────────────────────────
var AUTO_ROTATION_RESUME_DELAY_MS = 1750;
var AUTO_ROTATION_ACCELERATION_MS = 700;
var autoRotationResumeTimer = null;
var isAutoRotationEnabled = true;
var autoRotationRampStartTs = 0;

function clearAutoRotationResumeTimer() {
  if (autoRotationResumeTimer !== null) {
    clearTimeout(autoRotationResumeTimer);
    autoRotationResumeTimer = null;
  }
}

function pauseAutoRotation() {
  clearAutoRotationResumeTimer();
  isAutoRotationEnabled = false;
  autoRotationRampStartTs = 0;
}

function scheduleAutoRotationResume() {
  clearAutoRotationResumeTimer();
  autoRotationResumeTimer = setTimeout(function() {
    isAutoRotationEnabled = true;
    autoRotationRampStartTs = Date.now();
    autoRotationResumeTimer = null;
  }, AUTO_ROTATION_RESUME_DELAY_MS);
}

// ── Sizing ─────────────────────────────────────────────────
function resize() {
  var w = container.clientWidth;
  var h = container.clientHeight;
  if (w === 0 || h === 0) return;
  cssSize = Math.min(w, h);
  var dpr = Math.min(window.devicePixelRatio || 2, 2);
  canvasWidth = Math.floor(cssSize * dpr);
  canvasHeight = Math.floor(cssSize * dpr);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  container.style.setProperty('--cobe-canvas-css-size', cssSize + 'px');
}
resize();
window.addEventListener('resize', resize);

// ── Pointer (mouse) events ─────────────────────────────────
canvas.addEventListener('pointerdown', function(e) {
  if (e.pointerType === 'touch') return;
  if (isPinching) return;
  pointerDown = true;
  dragStart = [e.clientX, e.clientY];
  tapStartPos = [e.clientX, e.clientY];
  tapStartTime = Date.now();
  velocity = [0, 0];
  pauseAutoRotation();
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', function(e) {
  if (e.pointerType === 'touch') return;
  if (!pointerDown || !dragStart || isPinching) return;
  var dx = e.clientX - dragStart[0];
  var dy = e.clientY - dragStart[1];
  dragStart = [e.clientX, e.clientY];

  // Y-axis CORRECTED: +dy drags finger down → theta increases (globe tilts down)
  phi += dx * 0.005;
  theta = Math.max(-1.4, Math.min(1.4, theta + dy * 0.005));
  velocity = [dx * 0.005, dy * 0.005];
  pauseAutoRotation();
});

canvas.addEventListener('pointerup', function(e) {
  if (e.pointerType === 'touch') return;
  // tap detection
  if (tapStartPos && !isPinching) {
    var moveDist = Math.sqrt(
      Math.pow(e.clientX - tapStartPos[0], 2) +
      Math.pow(e.clientY - tapStartPos[1], 2)
    );
    var elapsed = Date.now() - tapStartTime;

    if (moveDist < TAP_THRESHOLD_PX && elapsed < TAP_THRESHOLD_MS) {
      handleTap(e.clientX, e.clientY);
    }
  }

  pointerDown = false;
  dragStart = null;
  tapStartPos = null;
  velocity = [0, 0];
  scheduleAutoRotationResume();
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener('pointercancel', function(e) {
  if (e.pointerType === 'touch') return;
  pointerDown = false;
  dragStart = null;
  tapStartPos = null;
  velocity = [0, 0];
  scheduleAutoRotationResume();
});

// ── Touch helpers ──────────────────────────────────────────
function getTouchDist(touches) {
  var dx = touches[0].clientX - touches[1].clientX;
  var dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touches) {
  var sumX = 0;
  var sumY = 0;
  for (var i = 0; i < touches.length; i++) {
    sumX += touches[i].clientX;
    sumY += touches[i].clientY;
  }
  return [sumX / touches.length, sumY / touches.length];
}

// ── Touch events ───────────────────────────────────────────
canvas.addEventListener('touchstart', function(e) {
  pauseAutoRotation();

  if (e.touches.length === 1) {
    isPinching = false;
    pointerDown = true;
    touchDragStart = [e.touches[0].clientX, e.touches[0].clientY];
    tapStartPos = [e.touches[0].clientX, e.touches[0].clientY];
    tapStartTime = Date.now();
    velocity = [0, 0];
    return;
  }

  if (e.touches.length === 2) {
    isPinching = true;
    pointerDown = false; // cancel any single-finger drag
    dragStart = null;
    touchDragStart = null;
    tapStartPos = null;
    pinchStartDist = getTouchDist(e.touches);
    pinchStartScale = scale;
    multiTouchCenter = getTouchCenter(e.touches);
    velocity = [0, 0];
    e.preventDefault();
  }
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
  pauseAutoRotation();

  if (e.touches.length === 1 && !isPinching) {
    if (!touchDragStart) {
      touchDragStart = [e.touches[0].clientX, e.touches[0].clientY];
    }

    var dragDx = e.touches[0].clientX - touchDragStart[0];
    var dragDy = e.touches[0].clientY - touchDragStart[1];
    touchDragStart = [e.touches[0].clientX, e.touches[0].clientY];

    phi += dragDx * 0.005;
    theta = Math.max(-1.4, Math.min(1.4, theta + dragDy * 0.005));
    velocity = [dragDx * 0.005, dragDy * 0.005];
    e.preventDefault();
    return;
  }

  if (e.touches.length === 2 && isPinching) {
    var currentDist = getTouchDist(e.touches);
    var ratio = pinchStartDist > 0 ? (currentDist / pinchStartDist) : 1;
    scale = Math.max(0.8, Math.min(2.5, pinchStartScale * ratio));

    var center = getTouchCenter(e.touches);
    if (multiTouchCenter) {
      var centerDx = center[0] - multiTouchCenter[0];
      var centerDy = center[1] - multiTouchCenter[1];
      phi += centerDx * 0.005;
      theta = Math.max(-1.4, Math.min(1.4, theta + centerDy * 0.005));
      velocity = [centerDx * 0.005, centerDy * 0.005];
    }
    multiTouchCenter = center;

    e.preventDefault();
  }
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
  if (e.touches.length >= 2) {
    pinchStartDist = getTouchDist(e.touches);
    pinchStartScale = scale;
    multiTouchCenter = getTouchCenter(e.touches);
    pauseAutoRotation();
    return;
  }

  if (e.touches.length === 1) {
    isPinching = false;
    pointerDown = true;
    touchDragStart = [e.touches[0].clientX, e.touches[0].clientY];
    tapStartPos = [e.touches[0].clientX, e.touches[0].clientY];
    tapStartTime = Date.now();
    multiTouchCenter = null;
    pauseAutoRotation();
    return;
  }

  if (tapStartPos && e.changedTouches && e.changedTouches.length > 0) {
    var finalTouch = e.changedTouches[0];
    var touchMoveDist = Math.sqrt(
      Math.pow(finalTouch.clientX - tapStartPos[0], 2) +
      Math.pow(finalTouch.clientY - tapStartPos[1], 2)
    );
    var touchElapsed = Date.now() - tapStartTime;

    if (touchMoveDist < TAP_THRESHOLD_PX && touchElapsed < TAP_THRESHOLD_MS) {
      handleTap(finalTouch.clientX, finalTouch.clientY);
    }
  }

  pointerDown = false;
  isPinching = false;
  touchDragStart = null;
  multiTouchCenter = null;
  dragStart = null;
  tapStartPos = null;
  velocity = [0, 0];
  scheduleAutoRotationResume();
}, { passive: false });

canvas.addEventListener('touchcancel', function() {
  pointerDown = false;
  isPinching = false;
  touchDragStart = null;
  multiTouchCenter = null;
  dragStart = null;
  tapStartPos = null;
  velocity = [0, 0];
  scheduleAutoRotationResume();
}, { passive: false });

window.addEventListener('beforeunload', function() {
  clearAutoRotationResumeTimer();
});

// ── Marker hit-detection ───────────────────────────────────
//
// The magnetic threshold is a FIXED screen-pixel radius (44px).
// It does NOT scale with zoom so the user's thumb always has
// a forgiving touch target on mobile even with compact visuals.
//
var HIT_MAGNETIC_RADIUS_PX = 44;
var FRONTFACE_VISIBILITY_EPSILON = 0.02;

// Projects [lat, lon] → 2D screen coordinates given current phi/theta/scale
function latLonToScreen(lat, lon) {
  var latR = lat * Math.PI / 180;
  // Keep fallback projection aligned with COBE's internal longitude basis.
  var lonR = lon * Math.PI / 180 - Math.PI;

  // 3D cartesian on unit sphere
  var cosLat = Math.cos(latR);
  var x3d = -cosLat * Math.cos(lonR);
  var y3d = Math.sin(latR);
  var z3d = cosLat * Math.sin(lonR);

  // rotate by phi (Y-axis) then theta (X-axis)
  var cosPhi = Math.cos(phi);
  var sinPhi = Math.sin(phi);
  var cosTheta = Math.cos(theta);
  var sinTheta = Math.sin(theta);

  // Y-axis rotation (phi)
  var rx = x3d * cosPhi + z3d * sinPhi;
  var ry = y3d;
  var rz = -x3d * sinPhi + z3d * cosPhi;

  // X-axis rotation (theta)
  var fx = rx;
  var fy = ry * cosTheta - rz * sinTheta;
  var fz = ry * sinTheta + rz * cosTheta;

  // Deeply behind the globe
  if (fz < -0.18) return null;

  // project to 2D (orthographic, globe radius = 0.8 of half-canvas)
  var r = cssSize * 0.4 * scale;
  var cx = cssSize / 2;
  var cy = cssSize / 2;

  var sx = cx + fx * r;
  var sy = cy - fy * r;
  var radialDist = Math.sqrt(Math.pow(sx - cx, 2) + Math.pow(sy - cy, 2));

  // Protect against numeric edge cases that can project outside the globe disk.
  if (radialDist > r * 1.02) return null;

  return {
    x: sx,
    y: sy,
    visible: fz > FRONTFACE_VISIBILITY_EPSILON,
    frontness: fz
  };
}

// ── Pulse feedback overlay ─────────────────────────────────
// Draws a brief expanding ring at the tapped marker's position
// on a transparent overlay canvas to confirm the selection.
var pulseOverlay = null;
var pulseCtx = null;
var pulseAnim = null;

function ensurePulseOverlay() {
  if (pulseOverlay) return;
  pulseOverlay = document.createElement('canvas');
  pulseOverlay.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:10;';
  container.appendChild(pulseOverlay);
  pulseCtx = pulseOverlay.getContext('2d');
}

function showPulse(sx, sy) {
  ensurePulseOverlay();
  // Match overlay size to container
  pulseOverlay.width  = container.clientWidth  * (window.devicePixelRatio || 2);
  pulseOverlay.height = container.clientHeight * (window.devicePixelRatio || 2);
  pulseOverlay.style.width  = container.clientWidth  + 'px';
  pulseOverlay.style.height = container.clientHeight + 'px';

  var dpr = window.devicePixelRatio || 2;
  var containerRect = container.getBoundingClientRect();
  var canvasRect = canvas.getBoundingClientRect();
  var canvasOffsetX = canvasRect.left - containerRect.left;
  var canvasOffsetY = canvasRect.top - containerRect.top;
  var cx = (canvasOffsetX + sx) * dpr;
  var cy = (canvasOffsetY + sy) * dpr;
  var startRadius = 8 * dpr;
  var endRadius   = 24 * dpr;
  var duration = 320; // ms
  var startTime = Date.now();

  if (pulseAnim) cancelAnimationFrame(pulseAnim);

  function drawFrame() {
    var elapsed = Date.now() - startTime;
    var t = Math.min(elapsed / duration, 1);
    // ease-out quad
    var ease = 1 - (1 - t) * (1 - t);

    pulseCtx.clearRect(0, 0, pulseOverlay.width, pulseOverlay.height);

    var r = startRadius + (endRadius - startRadius) * ease;
    var alpha = 0.28 * (1 - ease);

    var gradient = pulseCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, 'rgba(102, 204, 255, ' + (alpha * 1.3) + ')');
    gradient.addColorStop(0.52, 'rgba(26, 179, 255, ' + alpha + ')');
    gradient.addColorStop(1, 'rgba(26, 179, 255, 0)');

    pulseCtx.beginPath();
    pulseCtx.arc(cx, cy, r, 0, Math.PI * 2);
    pulseCtx.fillStyle = gradient;
    pulseCtx.fill();

    if (t < 1) {
      pulseAnim = requestAnimationFrame(drawFrame);
    } else {
      pulseCtx.clearRect(0, 0, pulseOverlay.width, pulseOverlay.height);
      pulseAnim = null;
    }
  }

  drawFrame();
}

// ── Tap handler ────────────────────────────────────────────
function handleTap(clientX, clientY) {
  if (validatorData.length === 0) return;

  // get tap position relative to canvas
  var rect = canvas.getBoundingClientRect();
  var tapX = clientX - rect.left;
  var tapY = clientY - rect.top;

  // Fixed, forgiving magnetic radius for touch interaction.
  var hits = [];
  var hitRadiusSq = HIT_MAGNETIC_RADIUS_PX * HIT_MAGNETIC_RADIUS_PX;
  var projectedForHit =
    typeof projectedMarkerList !== 'undefined' && Array.isArray(projectedMarkerList)
      ? projectedMarkerList
      : null;

  if (projectedForHit && projectedForHit.length > 0) {
    for (var i = 0; i < projectedForHit.length; i++) {
      var projected = projectedForHit[i];
      var mappedValidator = validatorById[projected.id];
      if (!mappedValidator) continue;

      var projectedDx = tapX - projected.x;
      var projectedDy = tapY - projected.y;
      var projectedDistSq = projectedDx * projectedDx + projectedDy * projectedDy;

      if (projectedDistSq <= hitRadiusSq) {
        hits.push({
          validator: mappedValidator,
          screen: projected,
          distSq: projectedDistSq,
        });
      }
    }
  } else {
    for (var j = 0; j < validatorData.length; j++) {
      var v = validatorData[j];
      var screen = latLonToScreen(v.lat, v.lon);
      if (!screen || !screen.visible) continue;

      var dx = tapX - screen.x;
      var dy = tapY - screen.y;
      var distSq = dx * dx + dy * dy;

      if (distSq <= hitRadiusSq) {
        hits.push({
          validator: v,
          screen: screen,
          distSq: distSq,
        });
      }
    }
  }

  if (hits.length === 0) {
    if (typeof setSelectedMarkerIds === 'function') {
      setSelectedMarkerIds([]);
    }

    postParentMessage(JSON.stringify({
      type: 'VALIDATOR_CLICKED',
      payload: {
        id: null,
        ids: [],
        count: 0,
      }
    }));
    return;
  }

  hits.sort(function(a, b) {
    return a.distSq - b.distSq;
  });

  var seen = {};
  var selectedIds = [];
  for (var j = 0; j < hits.length; j++) {
    var markerId = hits[j].validator.id;
    if (!markerId || seen[markerId]) continue;
    seen[markerId] = true;
    selectedIds.push(markerId);
  }

  var primaryHit = hits[0];

  if (typeof setSelectedMarkerIds === 'function') {
    setSelectedMarkerIds(selectedIds);
  }

  // Visual pulse at the primary marker's projected position
  showPulse(primaryHit.screen.x, primaryHit.screen.y);

  // Fire bridge event immediately (synchronous postMessage)
  postParentMessage(JSON.stringify({
    type: 'VALIDATOR_CLICKED',
    payload: {
      id: selectedIds[0] || null,
      ids: selectedIds,
      count: selectedIds.length,
      name: primaryHit.validator.name,
      lat: primaryHit.validator.lat,
      lon: primaryHit.validator.lon
    }
  }));
}
`;
