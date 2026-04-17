// deterministic spherical mapping
// hashes a string (validator address/name) into fixed [x, y, z] coordinates
// on the surface of a sphere. same input always produces exact same position.

import * as THREE from 'three';

// simple deterministic hash (djb2 variant)
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // ensure unsigned
}

// split a single hash into two independent-ish seeds
function splitHash(hash: number): [number, number] {
  const a = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  const b = ((a >>> 16) ^ a) * 0x45d9f3b;
  return [
    (a >>> 0) / 0xffffffff, // normalized [0, 1]
    (b >>> 0) / 0xffffffff,
  ];
}

/**
 * Maps a string identifier to a deterministic point on a sphere surface.
 * Uses the hash to generate latitude/longitude, then converts to cartesian.
 *
 * @param id - validator address or name
 * @param radius - sphere radius (default 1.02, slightly above globe surface)
 * @returns THREE.Vector3 position on the sphere
 */
export function hashToSpherePosition(id: string, radius: number = 1.02): THREE.Vector3 {
  const hash = hashString(id);
  const [u, v] = splitHash(hash);

  // uniform distribution on sphere surface
  const theta = 2 * Math.PI * u;           // azimuthal angle [0, 2π]
  const phi = Math.acos(2 * v - 1);        // polar angle [0, π]

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Returns spherical coords as a plain array [x, y, z] for use in JSX props.
 */
export function hashToSphereArray(id: string, radius: number = 1.02): [number, number, number] {
  const v = hashToSpherePosition(id, radius);
  return [v.x, v.y, v.z];
}
