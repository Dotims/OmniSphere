export const BRIDGE_SCRIPT = `
var _validatorUpdateGeneration = 0;

function _applyValidatorPayload(validators) {
  validatorData = validators; 
  validatorById = Object.create(null);
  for (var i = 0; i < validators.length; i++) {
    var validator = validators[i];
    if (validator && validator.id) validatorById[validator.id] = validator;
  }

  markerBlueprints = buildMarkerBlueprints(validators);
  markersDirty = true;
  materializeMarkers(true);
  pruneSelectionToKnownMarkers();
  upsertMarkerDom();
  updateMarkerAnchors(true);
}

function _removeCrossfading() {
  var ids = Object.keys(markerElementsById);
  for (var i = 0; i < ids.length; i++) {
    var el = markerElementsById[ids[i]];
    if (el) el.classList.remove('is-crossfading');
  }
}

function handleMessage(event) {
  try {
    var raw = event.data;
    if (typeof raw !== 'string') return;
    var data = JSON.parse(raw);

    if (data.type === 'validators') {
      var validators = Array.isArray(data.payload) ? data.payload : [];
      var hasExistingMarkers = markerBlueprints.length > 0;

      if (hasExistingMarkers) {
        // Crossfade: fade out current markers, reposition at new
        // coordinates, then let CSS transition fade them back in.
        // Prevents visible "snap" from fallback → real positions.
        _validatorUpdateGeneration++;
        var gen = _validatorUpdateGeneration;

        // 1. Add crossfading class → smooth 150ms fade to opacity 0
        var ids = Object.keys(markerElementsById);
        for (var h = 0; h < ids.length; h++) {
          var mel = markerElementsById[ids[h]];
          if (mel) mel.classList.add('is-crossfading');
        }

        // 2. After fade-out completes, apply new data
        setTimeout(function() {
          if (gen !== _validatorUpdateGeneration) return;
          _applyValidatorPayload(validators);
          // 3. Remove crossfading class on next frame so markers
          //    fade in at their new positions via the base transition.
          requestAnimationFrame(function() {
            if (gen !== _validatorUpdateGeneration) return;
            _removeCrossfading();
          });
        }, 160);
      } else {
        // First load — apply immediately (hydration gate handles visibility)
        _applyValidatorPayload(validators);
      }
    }

    if (data.type === 'selection') {
      var selIds = data.payload && Array.isArray(data.payload.ids) ? data.payload.ids : [];
      setSelectedMarkerIds(selIds);
    }
    
    if (data.type === 'app_state') {
      var isActive = data.payload && data.payload.active;
      if (globe && typeof globe.toggle === 'function') globe.toggle(isActive);
    }

    if (data.type === 'settings') {
      var settingsPayload = data.payload || {};
      if (typeof settingsPayload.autoRotation === 'boolean') {
        isAutoRotationEnabled = settingsPayload.autoRotation;
      }
      
      var themeChanged = false;
      if (settingsPayload.theme) {
        var isDark = settingsPayload.theme !== "light";
        var newDarkMode = isDark ? 1 : 0;
        if (globeDarkMode !== newDarkMode) {
           globeDarkMode = newDarkMode;
           themeChanged = true;
           
           if (!isDark) {
             // Light mode: vibrant colors
             // baseColor determines both the ocean and the continent hue.
             globeBaseColor = [0.85, 0.88, 0.95]; // light ocean
             globeMarkerColor = hexToRgbNorm(settingsPayload.activeColors.tint || "#3B82F6"); 
             globeGlowColor = [1, 1, 1];
           } else {
             // Dark mode
             globeBaseColor = [0.2, 0.24, 0.4];
             globeMarkerColor = hexToRgbNorm(settingsPayload.activeColors.tint || "#3B82F6");
             globeGlowColor = [0.04, 0.08, 0.16];
           }
        }
      }
      
      if (themeChanged) {
        // Update the HTML background to match the native container
        var bgColor = isDark ? '#0A0A0C' : (settingsPayload.activeColors.background || '#F5F5F7');
        document.body.style.backgroundColor = bgColor;
        document.documentElement.style.backgroundColor = bgColor;
        var spaceBg = document.querySelector('.space-bg');
        if (spaceBg) {
          spaceBg.style.backgroundColor = bgColor;
          spaceBg.style.opacity = isDark ? '0.22' : '0';
        }
        var glowEl = document.querySelector('.glow');
        if (glowEl) {
          glowEl.style.opacity = isDark ? '1' : '0';
        }
        initGlobe();
      }
    }
  } catch(e) {}
}

document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);
`;
