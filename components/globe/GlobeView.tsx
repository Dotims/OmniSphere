// COBE-powered globe rendered inside a WebView
// The entire COBE+phenomenon bundle is inlined into the HTML.
// No CDN fetch = no WKWebView sandbox failures in Expo Go.
// Validator data is bridged via postMessage from RN → WebView.

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ValidatorSummary } from '@/services/validators';
import { hashToLatLon } from '@/utils/spherical-hash';
import { COBE_BUNDLE_JS } from './cobe-source';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GlobeViewProps {
  validators: ValidatorSummary[];
  onSelectValidator?: (id: string | null) => void;
}

// ─── HTML Template ───────────────────────────────────────────────────────────

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

    .badge {
      position: absolute;
      bottom: 16px; left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 14, 23, 0.80);
      border: 1px solid rgba(0, 224, 202, 0.20);
      border-radius: 100px;
      padding: 6px 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(148, 163, 184, 0.9);
      z-index: 10;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      white-space: nowrap;
    }
    .badge .dot {
      display: inline-block;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #00E0CA;
      margin-right: 6px;
      box-shadow: 0 0 6px rgba(0, 224, 202, 0.6);
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div id="globe-container">
    <div class="glow"></div>
    <canvas id="cobe-canvas"></canvas>
    <div class="badge"><span class="dot"></span><span id="count">0</span> validators</div>
  </div>

  <script>
    // Inline COBE + phenomenon bundle (IIFE, no network required)
    ${cobeSource}
    var createGlobe = (typeof __cobe !== 'undefined') ? (__cobe.default || __cobe) : null;
  </script>

  <script>
    (function() {
      var canvas = document.getElementById('cobe-canvas');
      var countEl = document.getElementById('count');
      var container = document.getElementById('globe-container');

      if (!canvas || !container || typeof createGlobe !== 'function') {
        document.body.innerHTML = '<p style="color:#EF4444;text-align:center;padding-top:40vh;font-family:system-ui">COBE init failed</p>';
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', msg: 'createGlobe not a function' })); } catch(e) {}
        return;
      }

      // ── State ──────────────────────────────────────────────────
      var currentMarkers = [];
      var phi = 0.3;
      var theta = 0.15;
      var dragStart = null;
      var velocity = [0, 0];
      var pointerDown = false;
      var canvasWidth = 0;
      var canvasHeight = 0;

      // ── Sizing ─────────────────────────────────────────────────
      function resize() {
        var w = container.clientWidth;
        var h = container.clientHeight;
        if (w === 0 || h === 0) return;
        var size = Math.min(w, h);
        var dpr = Math.min(window.devicePixelRatio || 2, 2);
        canvasWidth = Math.floor(size * dpr);
        canvasHeight = Math.floor(size * dpr);
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
      }
      resize();
      window.addEventListener('resize', resize);

      // ── Touch / pointer rotation ───────────────────────────────
      canvas.addEventListener('pointerdown', function(e) {
        pointerDown = true;
        dragStart = [e.clientX, e.clientY];
        velocity = [0, 0];
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', function(e) {
        if (!pointerDown || !dragStart) return;
        var dx = e.clientX - dragStart[0];
        var dy = e.clientY - dragStart[1];
        dragStart = [e.clientX, e.clientY];
        phi += dx * 0.005;
        theta = Math.max(-1.4, Math.min(1.4, theta - dy * 0.005));
        velocity = [dx * 0.005, -dy * 0.005];
      });
      canvas.addEventListener('pointerup', function(e) {
        pointerDown = false;
        dragStart = null;
        canvas.releasePointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointercancel', function() {
        pointerDown = false;
        dragStart = null;
      });

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
          mapSamples: 16000,
          mapBrightness: 2.5,
          baseColor: [0.15, 0.18, 0.25],
          markerColor: [0, 0.878, 0.792],
          glowColor: [0.04, 0.06, 0.10],
          markers: currentMarkers,
          onRender: function(state) {
            if (!pointerDown) {
              phi += 0.003;
              phi += velocity[0];
              theta += velocity[1];
              velocity[0] *= 0.92;
              velocity[1] *= 0.92;
              theta = Math.max(-1.4, Math.min(1.4, theta));
            }
            state.phi = phi;
            state.theta = theta;
            state.markers = currentMarkers;
            state.width = canvasWidth;
            state.height = canvasHeight;
          }
        });
      } catch(err) {
        document.body.innerHTML = '<p style="color:#EF4444;text-align:center;padding-top:40vh;font-family:system-ui">GL error: ' + err.message + '</p>';
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', msg: err.message })); } catch(e) {}
        return;
      }

      // Signal to RN that the globe is ready
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      } catch(e) {}

      // ── Data bridge ────────────────────────────────────────────
      function handleMessage(event) {
        try {
          var raw = event.data;
          if (typeof raw !== 'string') return;
          var data = JSON.parse(raw);

          if (data.type === 'validators') {
            var validators = data.payload;
            countEl.textContent = validators.length;

            currentMarkers = validators.map(function(v) {
              return {
                location: [v.lat, v.lon],
                size: Math.max(0.02, Math.min(0.06, (v.stakeNorm || 0.5) * 0.06))
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function GlobeView({ validators, onSelectValidator }: GlobeViewProps) {
  const webviewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const pendingDataRef = useRef(false);

  const htmlSource = useMemo(
    () => ({ html: buildGlobeHTML(COBE_BUNDLE_JS) }),
    [],
  );

  // bridge validator data to the WebView
  const bridgeData = useCallback(() => {
    if (!webviewRef.current || !isReadyRef.current || validators.length === 0) return;

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
    webviewRef.current.postMessage(message);
    pendingDataRef.current = false;
  }, [validators]);

  useEffect(() => {
    if (isReadyRef.current) {
      bridgeData();
    } else {
      pendingDataRef.current = true;
    }
  }, [bridgeData]);

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
      if (data.type === 'select' && onSelectValidator) {
        onSelectValidator(data.id || null);
      }
    } catch {
      // ignore
    }
  }, [onSelectValidator, bridgeData, validators.length]);

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
