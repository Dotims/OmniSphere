/**
 * Assembles the full HTML document that runs inside the globe WebView.
 *
 * Composes the CSS, interaction script, and globe script into a single
 * self-contained HTML page with the inlined COBE bundle.
 */

import { GLOBE_SCRIPT } from "./globe-script";
import { INTERACTION_SCRIPT } from "./interaction-script";
import { GLOBE_CSS } from "./styles";

export function buildGlobeHTML(cobeSource: string): string {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>${GLOBE_CSS}</style>
  </head>
  <body>
    <div id="globe-container">
      <div class="space-bg"></div>
      <div class="glow"></div>
      <canvas id="cobe-canvas"></canvas>
      <div id="marker-layer" aria-hidden="true"></div>
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

        ${INTERACTION_SCRIPT}
        ${GLOBE_SCRIPT}
      })();
    </script>
  </body>
  </html>`;
}
