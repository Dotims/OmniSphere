// individual validator pin — glowing sphere with pulse animation
// uses useFrame for smooth per-frame animation

import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

interface ValidatorPinProps {
  position: [number, number, number];
  validatorId: string;
  name: string;
  stake: string;
  index: number;
  onSelect: (id: string | null) => void;
  isSelected: boolean;
}

const PIN_RADIUS = 0.018;
const GLOW_RADIUS = 0.035;

export default function ValidatorPin({
  position,
  validatorId,
  name,
  stake,
  index,
  onSelect,
  isSelected,
}: ValidatorPinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // stagger animation start based on index for wave effect
  const phaseOffset = index * 0.3;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phaseOffset;

    // pulse scale animation
    const pulse = 1 + Math.sin(t * 2) * 0.15;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(isSelected || hovered ? 1.6 : pulse);
    }

    // glow opacity breathing
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 1.5) * 0.1;
    }
  });

  const handlePress = useCallback(() => {
    onSelect(isSelected ? null : validatorId);
  }, [isSelected, validatorId, onSelect]);

  return (
    <group position={position}>
      {/* outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[GLOW_RADIUS, 8, 8]} />
        <meshBasicMaterial
          color="#00E0CA"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      {/* core pin */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePress}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[PIN_RADIUS, 8, 8]} />
        <meshBasicMaterial
          color={isSelected ? '#33FFE8' : '#00E0CA'}
          toneMapped={false}
        />
      </mesh>

      {/* selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.03, 0.038, 24]} />
          <meshBasicMaterial
            color="#33FFE8"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
