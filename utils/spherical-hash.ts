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

/**
 * Maps a string identifier to deterministic [latitude, longitude] coordinates.
 * Latitude: [-90, 90], Longitude: [-180, 180]
 * Used by COBE globe markers.
 *
 * @param id - validator address or name
 * @returns [lat, lon] tuple
 */
export function hashToLatLon(id: string): [number, number] {
  const hash = hashString(id);
  const [u, v] = twoSeeds(hash);

  // uniform distribution across globe surface
  const lat = Math.asin(2 * u - 1) * (180 / Math.PI); // [-90, 90]
  const lon = (v * 360) - 180;                          // [-180, 180]

  return [lat, lon];
}

/**
 * Returns spherical coords as a plain array [x, y, z] for use in 3D JSX props.
 * Kept for backward compatibility.
 */
export function hashToSphereArray(id: string, radius: number = 1.02): [number, number, number] {
  const hash = hashString(id);
  const [u, v] = twoSeeds(hash);

  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return [x, y, z];
}
