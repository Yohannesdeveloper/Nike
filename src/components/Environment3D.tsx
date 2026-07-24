'use client';

import React, { useRef, useMemo, Component, ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 150;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#ff4d00"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Lighting() {
  const spot1 = useRef<THREE.SpotLight>(null);
  const spot2 = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (spot1.current) {
      spot1.current.position.x = Math.sin(t * 0.3) * 3;
      spot1.current.position.z = Math.cos(t * 0.3) * 3;
    }
    if (spot2.current) {
      spot2.current.position.x = Math.cos(t * 0.2) * 4;
      spot2.current.position.z = Math.sin(t * 0.2) * 4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight ref={spot1} position={[3, 5, 3]} angle={0.4} penumbra={0.8} intensity={4} castShadow />
      <spotLight ref={spot2} position={[-4, 4, -2]} angle={0.5} penumbra={1} intensity={2.5} color="#ff4d00" />
      <spotLight position={[0, 6, 0]} angle={0.6} penumbra={0.9} intensity={2} />
      <pointLight position={[2, 1, 3]} intensity={0.5} color="#ff6b00" />
      <pointLight position={[-3, 2, -1]} intensity={0.3} color="#4d9fff" />
    </>
  );
}

function Floor() {
  return (
    <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial
        color="#080808"
        roughness={0.15}
        metalness={0.6}
      />
    </mesh>
  );
}

export default function Environment3D() {
  return (
    <ErrorBoundary>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 8, 25]} />
      <Lighting />
      <FloatingParticles />
      <Floor />
    </ErrorBoundary>
  );
}
