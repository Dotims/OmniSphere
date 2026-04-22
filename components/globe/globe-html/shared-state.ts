export const SHARED_STATE_SCRIPT = `
var markerBlueprints = [];
var markerElementsById = Object.create(null);
var markerRenderStateById = Object.create(null);
var projectedMarkerList = [];
var selectedMarkerIds = [];
var markerLayer = document.getElementById('marker-layer');
var markersDirty = true;
var INTERNAL_MARKER_SIZE = 0.003;
var globeRenderedFirstFrame = false;
var globeFrameCount = 0;
var FRONTFACE_VISIBILITY_EPSILON = 0.02;
var TWO_PI = Math.PI * 2;
var lastProjectionFrame = {
  phi: Number.POSITIVE_INFINITY,
  theta: Number.POSITIVE_INFINITY,
  scale: Number.POSITIVE_INFINITY,
  cssSize: Number.POSITIVE_INFINITY,
};
`;
