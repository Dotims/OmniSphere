import type { ValidatorSummary } from '@/services/validators';
import { hashToLatLon } from '@/utils/spherical-hash';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { COBE_BUNDLE_JS } from './cobe-source';


interface GlobeViewProps {
  validators: ValidatorSummary[];
  onSelectValidator?: (id: string | null) => void;
}

// html template
function buildGlobeHTML(cobeSource: string): string {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
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
      canvas {
        display: block;
        cursor: grab;
        position: relative;
        z-index: 1;
        -webkit-mask-image: radial-gradient(closest-side at center, black 80%, transparent 100%);
        mask-image: radial-gradient(closest-side at center, black 80%, transparent 100%);
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
          rgba(0, 224, 202, 0.12) 0%,
          rgba(0, 224, 202, 0.04) 40%,
          transparent 70%
        );
        pointer-events: none;
        z-index: 0;
      }
    </style>
  </head>
  <body>
    <div id="globe-container">
      <div class="glow"></div>
      <canvas id="cobe-canvas"></canvas>
    </div>

    <script>
      // Inline COBE + phenomenon bundle (IIFE, no network required)
      ${cobeSource}
      var createGlobe = (typeof __cobe !== 'undefined') ? (__cobe.default || __cobe) : null;
    </script>

    <script>
      (function() {
        var canvas = document.getElementById('cobe-canvas');
        var container = document.getElementById('globe-container');

        var postParentMessage = function(data) {
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(data);
            } else if (window.parent) {
              window.parent.postMessage(data, '*');
            }
          } catch(e) {}
        };

        if (!canvas || !container || typeof createGlobe !== 'function') {
          document.body.innerHTML = '<p style="color:#EF4444;text-align:center;padding-top:40vh;font-family:system-ui">COBE init failed</p>';
          postParentMessage(JSON.stringify({ type: 'error', msg: 'createGlobe not a function' }));
          return;
        }

        // ── State ──────────────────────────────────────────────────
        var currentMarkers = [];
        var validatorData = [];   // full validator payload for hit detection
        var phi = 0.3;
        var theta = 0.15;
        var scale = 1.0;          // zoom level
        var dragStart = null;
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

        //  Single-finger drag (pointer events)
        canvas.addEventListener('pointerdown', function(e) {
          if (isPinching) return;
          pointerDown = true;
          dragStart = [e.clientX, e.clientY];
          tapStartPos = [e.clientX, e.clientY];
          tapStartTime = Date.now();
          velocity = [0, 0];
          canvas.setPointerCapture(e.pointerId);
        });

        canvas.addEventListener('pointermove', function(e) {
          if (!pointerDown || !dragStart || isPinching) return;
          var dx = e.clientX - dragStart[0];
          var dy = e.clientY - dragStart[1];
          dragStart = [e.clientX, e.clientY];

          // Y-axis CORRECTED: +dy drags finger down → theta increases (globe tilts down)
          phi += dx * 0.005;
          theta = Math.max(-1.4, Math.min(1.4, theta + dy * 0.005));
          velocity = [dx * 0.005, dy * 0.005];
        });

        canvas.addEventListener('pointerup', function(e) {
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
          canvas.releasePointerCapture(e.pointerId);
        });

        canvas.addEventListener('pointercancel', function() {
          pointerDown = false;
          dragStart = null;
          tapStartPos = null;
        });

        // pinch-to-zoom (touch events)
        function getTouchDist(touches) {
          var dx = touches[0].clientX - touches[1].clientX;
          var dy = touches[0].clientY - touches[1].clientY;
          return Math.sqrt(dx * dx + dy * dy);
        }

        canvas.addEventListener('touchstart', function(e) {
          if (e.touches.length === 2) {
            isPinching = true;
            pointerDown = false; // cancel any single-finger drag
            dragStart = null;
            pinchStartDist = getTouchDist(e.touches);
            pinchStartScale = scale;
            e.preventDefault();
          }
        }, { passive: false });

        canvas.addEventListener('touchmove', function(e) {
          if (e.touches.length === 2 && isPinching) {
            var currentDist = getTouchDist(e.touches);
            var ratio = currentDist / pinchStartDist;
            scale = Math.max(0.8, Math.min(2.5, pinchStartScale * ratio));
            e.preventDefault();
          }
        }, { passive: false });

        canvas.addEventListener('touchend', function(e) {
          if (e.touches.length < 2) {
            isPinching = false;
          }
        });

        // marker hit detection
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
            mapBrightness: 2.5,
            baseColor: [0.15, 0.18, 0.25],
            markerColor: [0, 0.878, 0.792],
            glowColor: [0.04, 0.06, 0.10],
            markers: currentMarkers,
            onRender: function(state) {
              if (!pointerDown && !isPinching) {
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
      })();
    </script>
  </body>
  </html>`;
}


export default function GlobeView({ validators, onSelectValidator }: GlobeViewProps) {
  const webviewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const pendingDataRef = useRef(false);

  const htmlSource = useMemo(
    () => ({ html: buildGlobeHTML(COBE_BUNDLE_JS) }),
    [],
  );

  // bridge validator data to the WebView
  const bridgeData = useCallback(() => {
    if ((Platform.OS !== 'web' && !webviewRef.current) || (Platform.OS === 'web' && !iframeRef.current) || !isReadyRef.current || validators.length === 0) return;

    const stakes = validators.map((v) => {
      try { return Number(BigInt(v.stakingPoolIotaBalance || '0')); }
      catch { return 0; }
    });
    const maxStake = Math.max(...stakes, 1);

    const payload = validators.map((v, i) => {
      const [lat, lon] = hashToLatLon(v.iotaAddress);
      return {
        id: v.iotaAddress,
        name: v.name || v.iotaAddress.slice(0, 12),
        lat,
        lon,
        stakeNorm: stakes[i] / maxStake,
      };
    });

    const message = JSON.stringify({ type: 'validators', payload });
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(message, '*');
    } else {
      webviewRef.current?.postMessage(message);
    }
    pendingDataRef.current = false;
  }, [validators]);

  useEffect(() => {
    if (isReadyRef.current) {
      bridgeData();
    } else {
      pendingDataRef.current = true;
    }
  }, [bridgeData]);

  // Hook up web messages
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWebMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== 'string') return;
        const data = JSON.parse(event.data);

        if (data.type === 'ready') {
          isReadyRef.current = true;
          if (pendingDataRef.current || validators.length > 0) {
            setTimeout(bridgeData, 100);
          }
        }

        if (data.type === 'error') {
          console.warn('[GlobeView] WebView error:', data.msg);
        }

        if (data.type === 'VALIDATOR_CLICKED' && onSelectValidator) {
          onSelectValidator(data.payload?.id || null);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handleWebMessage as EventListener);
    return () => window.removeEventListener('message', handleWebMessage as EventListener);
  }, [onSelectValidator, bridgeData, validators.length]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'ready') {
        isReadyRef.current = true;
        if (pendingDataRef.current || validators.length > 0) {
          setTimeout(bridgeData, 100);
        }
      }

      if (data.type === 'error') {
        console.warn('[GlobeView] WebView error:', data.msg);
      }

      // Handle marker tap from WebView
      if (data.type === 'VALIDATOR_CLICKED' && onSelectValidator) {
        onSelectValidator(data.payload?.id || null);
      }
    } catch {
      // ignore
    }
  }, [onSelectValidator, bridgeData, validators.length]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={htmlSource.html}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={htmlSource}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={false}
        {...(Platform.OS === 'android'
          ? {
              androidLayerType: 'hardware',
              mixedContentMode: 'always' as const,
            }
          : {
              allowsBackForwardNavigationGestures: false,
            }
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
