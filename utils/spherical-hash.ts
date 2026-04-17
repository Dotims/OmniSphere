// deterministic spherical mapping
// hashes a string (validator address/name) into fixed [x, y, z] coordinates
// on the surface of a sphere. same input always produces exact same position.

// simple deterministic hash (djb2)
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // ensure unsigned 32-bit
}

// generate two independent [0, 1] seeds from a single hash
// uses bitwise mixing that stays within 32-bit integer range
function twoSeeds(hash: number): [number, number] {
  // seed 1: upper 16 bits
  const s1 = ((hash >>> 16) & 0xffff) / 0xffff;
  // seed 2: lower 16 bits XORed with a shifted version for decorrelation
  const mixed = ((hash & 0xffff) ^ ((hash >>> 8) & 0xffff)) & 0xffff;
  const s2 = mixed / 0xffff;
  return [s1, s2];
}

/**
 * Maps a string identifier to a deterministic point on a sphere surface.
 * Uses the hash to generate latitude/longitude, then converts to cartesian.
 *
 * @param id - validator address or name
 * @param radius - sphere radius (default 1.02, slightly above globe surface)
 * @returns [x, y, z] position on the sphere
 */
export function hashToSphereArray(id: string, radius: number = 1.02): [number, number, number] {
  const hash = hashString(id);
  const [u, v] = twoSeeds(hash);

  // uniform distribution on sphere surface
  const theta = 2 * Math.PI * u;           // azimuthal angle [0, 2π]
  const phi = Math.acos(2 * v - 1);        // polar angle [0, π]

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return [x, y, z];
}
