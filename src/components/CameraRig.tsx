'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '@/store/useStore';

interface CameraKeyframe {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
}

export default function CameraRig() {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentFov = useRef(40);

  const keyframes = useMemo<CameraKeyframe[]>(() => [
    { position: new THREE.Vector3(0, 0.5, 6), lookAt: new THREE.Vector3(0, 0, 0), fov: 40 },
    { position: new THREE.Vector3(4, 0.8, 4), lookAt: new THREE.Vector3(0, 0, 0), fov: 42 },
    { position: new THREE.Vector3(2, 1.5, 2.5), lookAt: new THREE.Vector3(0, 0.2, 0), fov: 35 },
    { position: new THREE.Vector3(0, -0.5, 3.5), lookAt: new THREE.Vector3(0, 0, 0), fov: 38 },
    { position: new THREE.Vector3(-3, 0.3, 3), lookAt: new THREE.Vector3(0, 0.1, 0), fov: 40 },
    { position: new THREE.Vector3(0, 0.8, 5), lookAt: new THREE.Vector3(0, 0, 0), fov: 36 },
  ], []);

  const hotspotPositions = useMemo(() => ({
    'mesh': { position: new THREE.Vector3(1.5, 0.8, 2), lookAt: new THREE.Vector3(0.5, 0.3, 0), fov: 30 },
    'cushion': { position: new THREE.Vector3(0, -0.3, 2.5), lookAt: new THREE.Vector3(0, 0, 0), fov: 32 },
    'sole': { position: new THREE.Vector3(0, -1.5, 2), lookAt: new THREE.Vector3(0, -0.2, 0), fov: 35 },
    'heel': { position: new THREE.Vector3(-2.5, 0.5, 1.5), lookAt: new THREE.Vector3(-1, 0.2, 0), fov: 33 },
    'laces': { position: new THREE.Vector3(0.5, 1.2, 1.5), lookAt: new THREE.Vector3(0, 0.4, 0), fov: 28 },
  }), []);

  useFrame(() => {
    const { scrollProgress, activeHotspot } = useStore.getState();

    let targetPosition: THREE.Vector3;
    let targetLookAt: THREE.Vector3;
    let targetFov: number;

    if (activeHotspot && hotspotPositions[activeHotspot as keyof typeof hotspotPositions]) {
      const hotspot = hotspotPositions[activeHotspot as keyof typeof hotspotPositions];
      targetPosition = hotspot.position;
      targetLookAt = hotspot.lookAt;
      targetFov = hotspot.fov;
    } else {
      const totalSegments = keyframes.length - 1;
      const segmentProgress = scrollProgress * totalSegments;
      const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
      const localT = segmentProgress - segmentIndex;
      const from = keyframes[segmentIndex];
      const to = keyframes[Math.min(segmentIndex + 1, totalSegments)];
      const easedT = localT * localT * (3 - 2 * localT);

      targetPosition = new THREE.Vector3().lerpVectors(from.position, to.position, easedT);
      targetLookAt = new THREE.Vector3().lerpVectors(from.lookAt, to.lookAt, easedT);
      targetFov = from.fov + (to.fov - from.fov) * easedT;
    }

    camera.position.lerp(targetPosition, 0.04);
    targetRef.current.lerp(targetLookAt, 0.04);
    camera.lookAt(targetRef.current);

    currentFov.current += (targetFov - currentFov.current) * 0.04;
    (camera as THREE.PerspectiveCamera).fov = currentFov.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  });

  return null;
}
