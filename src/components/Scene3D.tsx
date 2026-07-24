'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Sneaker from './Sneaker';
import Environment3D from './Environment3D';
import CameraRig from './CameraRig';
import { useStore } from '@/store/useStore';

function ScrollTracker() {
  const setScrollProgress = useStore((s) => s.setScrollProgress);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollProgress]);
  return null;
}

function MouseTracker() {
  const setMousePosition = useStore((s) => s.setMousePosition);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [setMousePosition]);
  return null;
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-0">
      <div className="text-center text-red-500/80 p-8">
        <p className="text-sm font-mono">{error}</p>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-0">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#ff4d00] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/30 text-xs">Loading 3D model...</p>
      </div>
    </div>
  );
}

export default function Scene3D() {
  const [error, setError] = useState<string | null>(null);

  if (error) return <ErrorDisplay error={error} />;

  return (
    <>
      <ScrollTracker />
      <MouseTracker />
      <Canvas
        camera={{ fov: 40, near: 0.1, far: 100, position: [0, 0.5, 6] }}
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <Environment3D />
          <Sneaker />
        </Suspense>
      </Canvas>
    </>
  );
}
