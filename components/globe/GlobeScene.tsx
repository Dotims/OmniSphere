// main 3D scene — wraps R3F Canvas with globe, pins, lighting, and controls

import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import GlobeCore from './GlobeCore';
import ValidatorPins from './ValidatorPins';
import TouchControls from './TouchControls';
import type { ValidatorSummary } from '@/services/validators';

interface GlobeSceneProps {
  validators: ValidatorSummary[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function GlobeScene({ validators, selectedId, onSelect }: GlobeSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      gl={{ antialias: false }} // perf: disable AA on mobile
      style={{ flex: 1 }}
    >
      {/* ambient base light */}
      <ambientLight intensity={0.3} />

      {/* key light — top-right, warm white */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={0.8}
        color="#E8E8FF"
      />

      {/* fill light — bottom-left, cyan tint */}
      <pointLight
        position={[-3, -2, 2]}
        intensity={0.4}
        color="#00E0CA"
        distance={10}
      />

      {/* rim light — behind, subtle */}
      <pointLight
        position={[0, 0, -5]}
        intensity={0.2}
        color="#8B5CF6"
        distance={8}
      />

      {/* globe */}
      <GlobeCore />

      {/* validator pins */}
      {validators.length > 0 && (
        <ValidatorPins
          validators={validators}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}

      {/* touch rotation controls */}
      <TouchControls />
    </Canvas>
  );
}
