// individual validator pin — glowing sphere with pulse animation
// uses useFrame for smooth per-frame animation

import React, { useRef, useCallback } from 'react';
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

// slightly larger for mobile touch targets
const PIN_RADIUS = 0.022;
const GLOW_RADIUS = 0.045;
const HIT_RADIUS = 0.06; // invisible hit target for easier tapping

export default function ValidatorPin({
  position,
  validatorId,
  name,
  stake,
  index,
  onSelect,
  isSelected,
}: ValidatorPinProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // stagger animation start based on index for wave effect
  const phaseOffset = index * 0.37;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phaseOffset;

    // pulse scale animation
    const pulse = 1 + Math.sin(t * 2.2) * 0.2;
    if (coreRef.current) {
      coreRef.current.scale.setScalar(isSelected ? 1.8 : pulse);
    }

    // glow opacity breathing
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isSelected
        ? 0.45 + Math.sin(t * 3) * 0.1
        : 0.18 + Math.sin(t * 1.5) * 0.08;
    }
  });

  const handlePress = useCallback(() => {
    onSelect(isSelected ? null : validatorId);
  }, [isSelected, validatorId, onSelect]);

  return (
    <group position={position}>
      {/* outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[GLOW_RADIUS, 10, 10]} />
        <meshBasicMaterial
          color={isSelected ? '#33FFE8' : '#00E0CA'}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* core pin */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[PIN_RADIUS, 10, 10]} />
        <meshBasicMaterial
          color={isSelected ? '#33FFE8' : '#00E0CA'}
          toneMapped={false}
        />
      </mesh>

      {/* invisible hit target — larger for easier mobile tapping */}
      <mesh onPointerDown={handlePress} visible={false}>
        <sphereGeometry args={[HIT_RADIUS, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.05, 24]} />
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
