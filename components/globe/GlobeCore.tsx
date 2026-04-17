// 3D sphere with dark semi-transparent material and fresnel glow edge effect
// low-poly for mobile performance

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

const GLOBE_RADIUS = 1;
const SEGMENTS = 48; // low-poly for mobile perf
const ROTATION_SPEED = 0.05;

// fresnel shader for edge glow effect
const fresnelVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fresnelFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;
  uniform float power;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), power);
    gl_FragColor = vec4(glowColor, fresnel * intensity);
  }
`;

// outer glow shell
function FresnelGlow() {
  const uniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color(0x00e0ca) },
      intensity: { value: 0.65 },
      power: { value: 3.0 },
    }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS * 1.04, SEGMENTS, SEGMENTS]} />
      <shaderMaterial
        vertexShader={fresnelVertexShader}
        fragmentShader={fresnelFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// wireframe grid lines on globe surface
function GlobeGrid() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS * 1.001, 24, 24]} />
      <meshBasicMaterial
        color="#00E0CA"
        wireframe
        transparent
        opacity={0.06}
      />
    </mesh>
  );
}

export default function GlobeCore() {
  const groupRef = useRef<THREE.Group>(null);

  // slow auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * ROTATION_SPEED;
    }
  });

  return (
    <group ref={groupRef}>
      {/* main globe sphere */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, SEGMENTS, SEGMENTS]} />
        <meshPhysicalMaterial
          color="#0A0E17"
          roughness={0.7}
          metalness={0.3}
          transparent
          opacity={0.85}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* wireframe grid overlay */}
      <GlobeGrid />

      {/* fresnel edge glow */}
      <FresnelGlow />
    </group>
  );
}
