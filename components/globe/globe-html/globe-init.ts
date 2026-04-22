export const GLOBE_INIT_SCRIPT = `
var globe = null;
var lastFrameTs = Date.now();

// State currently rendered on the WebGL canvas (1 frame behind JS state)
var renderedPhi = phi;
var renderedTheta = theta;
var renderedScale = scale;

function initGlobe() {
  if (globe) {
    try { globe.destroy(); } catch(e) {}
    globe = null;
  }
  
  try {
    materializeMarkers(true);

    globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 2, 2),
      width: canvasWidth,
      height: canvasHeight,
      phi: phi,
      theta: theta,
      dark: 1,
      diffuse: 1.2, // Smoother light falloff for consistent brightness across the sphere
      scale: scale,
      mapSamples: 16000,
      mapBrightness: 8.0, // Overdriven multiplier makes dots highly luminous and opaque
      // baseColor determines both the ocean and the continent hue.
      // [0.2, 0.24, 0.4] * 0.1 (ocean lighting) = [0.02, 0.024, 0.04], which is EXACTLY #05060A.
      // The continents multiply this by mapBrightness, creating vibrant light cyan/white dots.
      baseColor: [0.2, 0.24, 0.4],
      markerColor: [0.1, 0.8, 1.0],
      glowColor: [0.04, 0.08, 0.16],
      markers: currentMarkers,
      onRender: function(state) {
        var now = Date.now();
        var deltaMs = now - lastFrameTs;
        lastFrameTs = now;
        
        // Cap delta to prevent huge jumps after tab suspension (16.66ms = ~60fps)
        if (deltaMs > 100) deltaMs = 16.66;

        if (isAutoRotationEnabled && !pointerDown && !isPinching) {
          var rampProgress = 1;
          if (autoRotationRampStartTs > 0) {
            var elapsed = now - autoRotationRampStartTs;
            rampProgress = clamp(elapsed / AUTO_ROTATION_ACCELERATION_MS, 0, 1);
            if (rampProgress >= 1) autoRotationRampStartTs = 0;
          }

          var easedRamp = rampProgress * rampProgress * (3 - 2 * rampProgress);

          // 0.003 rad per 16.66ms frame = ~0.00018 rad/ms
          var baseRotation = 0.00018 * deltaMs;
          phi += baseRotation * easedRamp;
          phi += velocity[0];
          theta += velocity[1];
          velocity[0] *= 0.92;
          velocity[1] *= 0.92;
          theta = Math.max(-1.4, Math.min(1.4, theta));
        }

        materializeMarkers(false);
        
        // Sync DOM markers with the EXACT state the WebGL canvas just painted
        // (WebGL render happens before this onRender callback)
        updateMarkerAnchors(false, renderedPhi, renderedTheta, renderedScale);

        // Save the NEW state so we can use it for markers NEXT frame
        renderedPhi = phi;
        renderedTheta = theta;
        renderedScale = scale;

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
  }
}

initGlobe();

canvas.addEventListener('webglcontextlost', function(e) {
  e.preventDefault();
  if (globe && typeof globe.toggle === 'function') globe.toggle(false);
}, false);

canvas.addEventListener('webglcontextrestored', function(e) {
  initGlobe();
}, false);

postParentMessage(JSON.stringify({ type: 'ready' }));
`;
