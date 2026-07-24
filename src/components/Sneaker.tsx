'use client';

import React, { useRef, useEffect, useState, Component, ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useStore } from '@/store/useStore';

class ErrorCatcher extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.hasError ? null : this.props.children; }
}

function FallbackShoe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { mousePosition, scrollProgress } = useStore.getState();
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.06;
    groupRef.current.rotation.y = scrollProgress * Math.PI * 2 + t * 0.06 + mousePosition.x * 0.3;
    groupRef.current.rotation.x = mousePosition.y * 0.15;
  });

  return (
    <group ref={groupRef} scale={1.5}>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[2.2, 0.2, 0.9]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[2.0, 0.15, 0.85]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.15, 0]}>
        <boxGeometry args={[1.8, 0.5, 0.8]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
      </mesh>
      <mesh position={[0.3, 0.5, 0]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.6]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
      </mesh>
      <mesh position={[-0.85, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.55, 0.75]} />
        <meshStandardMaterial color="#ff4d00" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.15, 0.42]}>
        <boxGeometry args={[1.2, 0.08, 0.02]} />
        <meshStandardMaterial color="#ff4d00" emissive="#ff4d00" emissiveIntensity={0.3} roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.15, -0.42]}>
        <boxGeometry args={[1.2, 0.08, 0.02]} />
        <meshStandardMaterial color="#ff4d00" emissive="#ff4d00" emissiveIntensity={0.3} roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

function GLBShoe() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/sneaker.glb');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3 / maxDim;

    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const oldMats = Array.isArray(child.material) ? child.material : [child.material];
      child.material = oldMats.map((m) => {
        if (m instanceof THREE.MeshPhysicalMaterial || m instanceof THREE.MeshStandardMaterial) {
          const mat = m.clone();
          mat.transparent = false;
          mat.opacity = 1;
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
          return mat;
        }
        return new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, side: THREE.DoubleSide });
      });
    });

    setReady(true);
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { mousePosition, scrollProgress } = useStore.getState();
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.06 + Math.sin(t * 1.3) * 0.02;
    groupRef.current.rotation.y = scrollProgress * Math.PI * 2 + t * 0.06 + mousePosition.x * 0.3;
    groupRef.current.rotation.x = mousePosition.y * 0.1;
  });

  if (!ready) return null;
  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export default function Sneaker() {
  const [glbFailed, setGlbFailed] = useState(false);
  if (glbFailed) return <FallbackShoe />;
  return (
    <ErrorCatcher onError={() => setGlbFailed(true)}>
      <GLBShoe />
    </ErrorCatcher>
  );
}
