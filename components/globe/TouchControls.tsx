// custom orbit controls for React Native
// drei's OrbitControls depends on DOM events, so we use R3F's
// built-in event system + useFrame to implement touch rotation

import React, { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

const DAMPING = 0.92;
const SENSITIVITY = 0.005;

export default function TouchControls() {
  const { camera } = useThree();
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical().setFromVector3(camera.position));

  useFrame(() => {
    // apply velocity with damping
    if (!isDragging.current) {
      velocity.current.x *= DAMPING;
      velocity.current.y *= DAMPING;
    }

    const s = spherical.current;
    s.theta += velocity.current.x;
    s.phi += velocity.current.y;

    // clamp phi to avoid flipping
    s.phi = Math.max(0.3, Math.min(Math.PI - 0.3, s.phi));

    camera.position.setFromSpherical(s);
    camera.lookAt(0, 0, 0);
  });

  return (
    <mesh
      visible={false}
      onPointerDown={(e) => {
        isDragging.current = true;
        prevPointer.current = { x: e.point.x, y: e.point.y };
        // @ts-ignore - native event capture
        e.target?.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return;
        const dx = (e.point.x - prevPointer.current.x) * SENSITIVITY;
        const dy = (e.point.y - prevPointer.current.y) * SENSITIVITY;
        velocity.current.x = -dx * 15;
        velocity.current.y = dy * 15;
        prevPointer.current = { x: e.point.x, y: e.point.y };
      }}
      onPointerUp={() => {
        isDragging.current = false;
      }}
      onPointerCancel={() => {
        isDragging.current = false;
      }}
    >
      {/* invisible sphere to capture touch events */}
      <sphereGeometry args={[3.5, 16, 16]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
