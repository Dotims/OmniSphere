export const GLOBE_INIT_SCRIPT = `
var globe = null;
var lastFrameTs = Date.now();

<<<<<<< Updated upstream
// State currently rendered on the WebGL canvas (1 frame behind JS state)
var renderedPhi = phi;
var renderedTheta = theta;
var renderedScale = scale;

=======
// Theme variables (updated via bridge)
var globeDarkMode = 1;
var globeBaseColor = [0.2, 0.24, 0.4];
var globeMarkerColor = [0.23, 0.51, 0.96]; // #3B82F6
var globeGlowColor = [0.04, 0.08, 0.16];

// Helper to convert hex (#RRGGBB) to [R, G, B] array in 0-1 range
function hexToRgbNorm(hex) {
  var cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(function(c) { return c + c; }).join('');
  }
  var int = parseInt(cleanHex, 16);
  var r = ((int >> 16) & 255) / 255;
  var g = ((int >> 8) & 255) / 255;
  var b = (int & 255) / 255;
  return [r, g, b];
}
>>>>>>> Stashed changes

function initGlobe() {
  // Reset hydration gate so markers stay hidden until the new
  // globe instance has rendered enough frames with valid layout.
  globeRenderedFirstFrame = false;
  globeFrameCount = 0;

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
      dark: globeDarkMode,
      diffuse: 1.2, // Smoother light falloff for consistent brightness across the sphere
      scale: scale,
      mapSamples: 16000,
      mapBrightness: 8.0, // Overdriven multiplier makes dots highly luminous and opaque
      baseColor: globeBaseColor,
      markerColor: globeMarkerColor,
      glowColor: globeGlowColor,
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

        // Unlock marker hydration only after the globe's render loop has
        // produced multiple frames AND the viewport has valid dimensions.
        if (!globeRenderedFirstFrame) {
          if (cssSize === 0 || viewportW === 0 || viewportH === 0) {
            resize();
          }
          globeFrameCount++;
          if (globeFrameCount >= 3 && cssSize > 0 && viewportW > 0 && viewportH > 0) {
            globeRenderedFirstFrame = true;
          }
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
