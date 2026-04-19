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
 * NOTE: Auto-rotation resume delay is set to 1750 ms (1.75 s).
 */
export const INTERACTION_SCRIPT = `
// ── State ──────────────────────────────────────────────────
var currentMarkers = [];
var validatorData = [];   // full validator payload for hit detection
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
var autoRotationResumeTimer = null;
var isAutoRotationEnabled = true;

function clearAutoRotationResumeTimer() {
  if (autoRotationResumeTimer !== null) {
    clearTimeout(autoRotationResumeTimer);
    autoRotationResumeTimer = null;
  }
}

function pauseAutoRotation() {
  clearAutoRotationResumeTimer();
  isAutoRotationEnabled = false;
}

function scheduleAutoRotationResume() {
  clearAutoRotationResumeTimer();
  autoRotationResumeTimer = setTimeout(function() {
    isAutoRotationEnabled = true;
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
// Projects [lat, lon] → 2D screen coordinates given current phi/theta/scale
function latLonToScreen(lat, lon) {
  var latR = lat * Math.PI / 180;
  var lonR = lon * Math.PI / 180;

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

  // behind the globe? (z < 0 means facing away)
  if (fz < -0.05) return null;

  // project to 2D (orthographic, globe radius = 0.8 of half-canvas)
  var r = cssSize * 0.4 * scale;
  var cx = cssSize / 2;
  var cy = cssSize / 2;

  return {
    x: cx + fx * r,
    y: cy - fy * r,
    visible: fz > 0.05
  };
}

function handleTap(clientX, clientY) {
  if (validatorData.length === 0) return;

  // get tap position relative to canvas
  var rect = canvas.getBoundingClientRect();
  var tapX = clientX - rect.left;
  var tapY = clientY - rect.top;

  var hitRadius = 80 * scale; // px threshold, scales with zoom
  var bestDist = Infinity;
  var bestValidator = null;

  for (var i = 0; i < validatorData.length; i++) {
    var v = validatorData[i];
    var screen = latLonToScreen(v.lat, v.lon);
    if (!screen || !screen.visible) continue;

    var dist = Math.sqrt(
      Math.pow(tapX - screen.x, 2) +
      Math.pow(tapY - screen.y, 2)
    );

    if (dist < hitRadius && dist < bestDist) {
      bestDist = dist;
      bestValidator = v;
    }
  }

  if (bestValidator) {
    postParentMessage(JSON.stringify({
      type: 'VALIDATOR_CLICKED',
      payload: {
        id: bestValidator.id,
        name: bestValidator.name,
        lat: bestValidator.lat,
        lon: bestValidator.lon
      }
    }));
  }
}
`;
