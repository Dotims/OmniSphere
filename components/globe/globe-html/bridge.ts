export const BRIDGE_SCRIPT = `
function handleMessage(event) {
  try {
    var raw = event.data;
    if (typeof raw !== 'string') return;
    var data = JSON.parse(raw);

    if (data.type === 'validators') {
      var validators = Array.isArray(data.payload) ? data.payload : [];
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

    if (data.type === 'selection') {
      var ids = data.payload && Array.isArray(data.payload.ids) ? data.payload.ids : [];
      setSelectedMarkerIds(ids);
    }
    
    if (data.type === 'app_state') {
      var isActive = data.payload && data.payload.active;
      if (globe && typeof globe.toggle === 'function') globe.toggle(isActive);
    }
  } catch(e) {}
}

document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);
`;
