// simple deterministic hash (djb2)
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // ensure unsigned 32-bit
}

// generate two independent [0, 1] seeds from a single hash
function twoSeeds(hash: number): [number, number] {
  const s1 = ((hash >>> 16) & 0xffff) / 0xffff;
  const mixed = ((hash & 0xffff) ^ ((hash >>> 8) & 0xffff)) & 0xffff;
  const s2 = mixed / 0xffff;
  return [s1, s2];
}

// Safe terrestrial bounding boxes: [minLat, maxLat, minLon, maxLon]
// Carefully selected to be entirely inland and avoid oceans/large lakes.
const TERRESTRIAL_BOUNDS = [
  // North America
  [35, 45, -100, -90],
  [45, 55, -110, -100],
  [35, 40, -115, -105],
  [50, 60, -120, -100],
  [20, 25, -103, -98],
  // South America
  [-15, -5, -65, -55],
  [-25, -15, -60, -50],
  [-35, -25, -65, -60],
  [0, 5, -70, -60],
  // Africa
  [15, 25, -5, 15],
  [5, 15, 10, 20],
  [-10, 0, 15, 25],
  [-25, -15, 20, 30],
  [0, 10, 35, 45],
  // Europe
  [45, 50, 2, 10],
  [50, 55, 15, 25],
  [40, 45, -5, 0],
  [60, 65, 10, 20],
  // Asia
  [50, 60, 60, 80],
  [40, 50, 65, 80], // Avoid Aral Sea
  [30, 40, 80, 100],
  [25, 35, 105, 115],
  [20, 25, 75, 80],
  [15, 20, 75, 80],
  [15, 20, 100, 105],
  // Australia
  [-30, -20, 120, 135],
  [-25, -15, 130, 140],
];

/**
 * Maps a string identifier to deterministic [latitude, longitude] coordinates.
 * Coordinates are confined strictly to valid terrestrial areas (landmasses).
 *
 * @param id - validator address or name
 * @returns [lat, lon] tuple
 */
export function hashToLatLon(id: string): [number, number] {
  const hash = hashString(id);
  const [u, v] = twoSeeds(hash);

  // Pick a deterministic terrestrial region
  const regionIndex = hash % TERRESTRIAL_BOUNDS.length;
  const [minLat, maxLat, minLon, maxLon] = TERRESTRIAL_BOUNDS[regionIndex];

  // Map the seeds u, v to coordinates within the constrained bounding box
  const lat = minLat + (maxLat - minLat) * u;
  const lon = minLon + (maxLon - minLon) * v;

  return [lat, lon];
}

/**
 * Returns spherical coords as a plain array [x, y, z] for use in 3D JSX props.
 * Kept for backward compatibility.
 */
export function hashToSphereArray(
  id: string,
  radius: number = 1.02,
): [number, number, number] {
  const [lat, lon] = hashToLatLon(id);

  // Convert lat/lon back to Math.asin / Math.acos compatible spherical coordinates internally
  // phi is polar angle (from pole to pole) [0, Pi], theta is azimuthal [0, 2Pi]
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return [x, y, z];
}
