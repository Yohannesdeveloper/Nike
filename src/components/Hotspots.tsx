'use client';

import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useStore } from '@/store/useStore';

interface HotspotData {
  id: string;
  position: [number, number, number];
  label: string;
  description: string;
  icon: string;
}

const hotspots: HotspotData[] = [
  { id: 'mesh', position: [0.8, 0.5, 0.8], label: 'Lightweight Mesh', description: 'Engineered breathable mesh upper for maximum airflow and featherweight comfort.', icon: '🔬' },
  { id: 'cushion', position: [0, 0.05, 0.8], label: 'Air Cushioning', description: 'Pressurized air units absorb impact and deliver responsive energy return.', icon: '💨' },
  { id: 'sole', position: [0, -0.3, 0.8], label: 'Engineered Grip', description: 'Multi-directional traction pattern for superior grip on any surface.', icon: '🎯' },
  { id: 'heel', position: [-1.2, 0.4, 0.3], label: 'Responsive Foam', description: 'Dual-density foam heel counter provides lockdown fit and impact protection.', icon: '⚡' },
  { id: 'laces', position: [0.2, 0.7, 0.6], label: 'Adaptive Fit', description: 'Dynamic lacing system adapts to your foot shape for personalized comfort.', icon: '🔗' },
];

function Hotspot({ data }: { data: HotspotData }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { activeHotspot } = useStore.getState();
    const time = state.clock.getElapsedTime();
    const isActive = activeHotspot === data.id;
    const scale = isActive ? 1.3 : hovered ? 1.2 : 1 + Math.sin(time * 2 + data.position[0] * 3) * 0.1;
    groupRef.current.scale.setScalar(scale);
  });

  const handleClick = () => {
    const { activeHotspot, setActiveHotspot } = useStore.getState();
    setActiveHotspot(activeHotspot === data.id ? null : data.id);
  };

  return (
    <group ref={groupRef} position={data.position}>
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ff4d00" transparent opacity={0.15} />
      </mesh>
      <mesh
        onClick={handleClick}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'none'; }}
      >
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <HotspotPanel data={data} />
    </group>
  );
}

function HotspotPanel({ data }: { data: HotspotData }) {
  const [isActive, setIsActive] = useState(false);

  useFrame(() => {
    const { activeHotspot } = useStore.getState();
    setIsActive(activeHotspot === data.id);
  });

  if (!isActive) return null;

  return (
    <Html center distanceFactor={5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div style={{
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 77, 0, 0.3)',
        borderRadius: '16px',
        padding: '20px 24px',
        width: '260px',
        fontFamily: '"Inter", sans-serif',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 77, 0, 0.15)',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{data.icon}</div>
        <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#ff4d00', marginBottom: '6px' }}>{data.label}</div>
        <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.7)' }}>{data.description}</div>
      </div>
    </Html>
  );
}

export default function Hotspots() {
  const [visible, setVisible] = useState(false);

  useFrame(() => {
    const { scrollProgress } = useStore.getState();
    setVisible(scrollProgress > 0.15 && scrollProgress < 0.85);
  });

  if (!visible) return null;

  return (
    <group>
      {hotspots.map((hotspot) => (
        <Hotspot key={hotspot.id} data={hotspot} />
      ))}
    </group>
  );
}
