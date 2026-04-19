export const MATH_UTILS_SCRIPT = `
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function angularDistanceDeg(lat1, lon1, lat2, lon2) {
  var toRad = Math.PI / 180;
  var p1 = lat1 * toRad;
  var p2 = lat2 * toRad;
  var dPhi = (lat2 - lat1) * toRad;
  var dLambda = (lon2 - lon1) * toRad;

  var a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c * (180 / Math.PI);
}

function projectMarkerCartesian(cart, cosPhi, sinPhi, cosTheta, sinTheta, radius, centerX, centerY) {
  var x3d = cart[0], y3d = cart[1], z3d = cart[2];

  var rx = x3d * cosPhi + z3d * sinPhi;
  var ry = y3d;
  var rz = -x3d * sinPhi + z3d * cosPhi;

  var fx = rx;
  var fy = ry * cosTheta - rz * sinTheta;
  var fz = ry * sinTheta + rz * cosTheta;

  if (fz < -0.18) return null;

  var sx = centerX + fx * radius;
  var sy = centerY - fy * radius;
  var dx = sx - centerX, dy = sy - centerY;
  var radialDistSq = dx * dx + dy * dy;
  var maxDistSq = radius * radius * 1.0404;

  if (radialDistSq > maxDistSq) return null;

  return { x: sx, y: sy, visible: fz > FRONTFACE_VISIBILITY_EPSILON, frontness: fz };
}
`;
