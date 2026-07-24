'use client';

import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useStore } from '@/store/useStore';

function getSceneAdjustments(width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  const isMobile = width < 768;
  const isPortrait = aspect < 1;

  if (!isMobile) {
    return { cameraXScale: 1, cameraZOffset: 0, cameraFovBoost: 0, shoeScale: 1, lookAtY: 0.1 };
  }

  if (isPortrait) {
    return {
      cameraXScale: 0.28,
      cameraZOffset: 2.2,
      cameraFovBoost: 10,
      shoeScale: 0.72,
      lookAtY: -0.05,
    };
  }

  return {
    cameraXScale: 0.5,
    cameraZOffset: 1.4,
    cameraFovBoost: 6,
    shoeScale: 0.82,
    lookAtY: 0.05,
  };
}

function setPointerPosition(
  clientX: number,
  clientY: number,
  setMousePosition: (pos: { x: number; y: number }) => void,
) {
  setMousePosition({
    x: (clientX / window.innerWidth) * 2 - 1,
    y: -(clientY / window.innerHeight) * 2 + 1,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════════
   3D SCENE COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function Shoe() {
  const ref = useRef<THREE.Group>(null);
  const scaleRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const { size } = useThree();
  const adjustments = useMemo(
    () => getSceneAdjustments(size.width, size.height),
    [size.width, size.height],
  );
  const targetScale = useRef(adjustments.shoeScale);

  useEffect(() => {
    targetScale.current = adjustments.shoeScale;
  }, [adjustments.shoeScale]);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load('/models/sneaker.glb', (gltf) => {
      const group = gltf.scene;
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const s = 3.2 / maxDim;
      group.scale.setScalar(s);
      group.position.set(-center.x * s, -center.y * s, -center.z * s);

      const GOLD = new THREE.Color('#FFD700');
      const DARK_GOLD = new THREE.Color('#CC8800');
      const MID_GREY = new THREE.Color('#2a2a2a');
      const CHARCOAL = new THREE.Color('#111111');
      const SOLE_WHITE = new THREE.Color('#e8e8e8');
      const SOLE_BLACK = new THREE.Color('#0a0a0a');

      let meshIdx = 0;
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mat = child.material as THREE.MeshStandardMaterial;
          if (!mat) { meshIdx++; return; }
          switch (meshIdx) {
            case 0: mat.color.copy(GOLD); mat.roughness = 0.28; mat.metalness = 0.12; mat.envMapIntensity = 1.5; break;
            case 1: mat.color.copy(CHARCOAL); mat.roughness = 0.45; mat.metalness = 0.08; break;
            case 2: mat.color.copy(SOLE_WHITE); mat.roughness = 0.55; mat.metalness = 0.0; break;
            case 3: mat.color.copy(DARK_GOLD); mat.roughness = 0.32; mat.metalness = 0.10; break;
            case 4: mat.color.copy(MID_GREY); mat.roughness = 0.6; mat.metalness = 0.05; break;
            case 5: mat.color.copy(SOLE_BLACK); mat.roughness = 0.8; mat.metalness = 0.0; break;
            default: mat.color.copy(CHARCOAL); mat.roughness = 0.5; mat.metalness = 0.05; break;
          }
          mat.needsUpdate = true;
          meshIdx++;
        }
      });
      setModel(group);
    });
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const { mousePosition, scrollProgress } = useStore.getState();
    const t = state.clock.getElapsedTime();

    if (scaleRef.current) {
      const s = THREE.MathUtils.lerp(scaleRef.current.scale.x, targetScale.current, 0.08);
      scaleRef.current.scale.setScalar(s);
    }

    ref.current.position.y = Math.sin(t * 0.7) * 0.05 + Math.sin(t * 1.3) * 0.02;

    const bottomBlend = scrollProgress > 0.92 ? (scrollProgress - 0.92) / 0.08 : 0;
    const ease = bottomBlend * bottomBlend * (3 - 2 * bottomBlend);
    const mobileDamp = size.width < 768 ? 0.35 : 1;

    ref.current.rotation.y = scrollProgress * Math.PI * 2.2 * (1 - ease) + mousePosition.x * 0.6 * (1 - ease) * mobileDamp + t * 0.04;
    ref.current.rotation.x = mousePosition.y * 0.12 * (1 - ease) * mobileDamp;
  });

  if (!model) return null;
  return (
    <group ref={scaleRef} scale={adjustments.shoeScale}>
      <group ref={ref}>
        <primitive object={model} />
      </group>
    </group>
  );
}

function CameraRig() {
  const { camera, size } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 0.1, 0));
  const adjustments = useMemo(
    () => getSceneAdjustments(size.width, size.height),
    [size.width, size.height],
  );
  const kf = useMemo(() => [
    { p: [0, 0.3, 5.5] as const, f: 38 },
    { p: [2.5, 0.5, 4.2] as const, f: 36 },
    { p: [-2.0, 0.4, 4.0] as const, f: 37 },
    { p: [3.0, 0.7, 3.5] as const, f: 35 },
    { p: [-2.5, 0.6, 3.8] as const, f: 36 },
    { p: [2.0, 1.0, 2.8] as const, f: 34 },
    { p: [-1.5, 0.2, 3.2] as const, f: 36 },
    { p: [-3.0, 0.5, 4.0] as const, f: 38 },
    { p: [1.8, 0.8, 3.5] as const, f: 35 },
    { p: [-2.2, 0.3, 3.8] as const, f: 36 },
    { p: [2.8, 0.6, 4.0] as const, f: 37 },
    { p: [-1.8, 0.4, 3.6] as const, f: 35 },
  ], []);

  useFrame(() => {
    const { scrollProgress } = useStore.getState();
    const n = kf.length - 1;
    const raw = scrollProgress * n;
    const i = Math.min(Math.floor(raw), n - 1);
    const t = raw - i;
    const e = t * t * (3 - 2 * t);
    const a = kf[i], b = kf[Math.min(i + 1, n)];
    const x = (a.p[0] + (b.p[0] - a.p[0]) * e) * adjustments.cameraXScale;
    const y = a.p[1] + (b.p[1] - a.p[1]) * e;
    const z = a.p[2] + (b.p[2] - a.p[2]) * e + adjustments.cameraZOffset;
    const tp = new THREE.Vector3(x, y, z);
    const tl = new THREE.Vector3(0, adjustments.lookAtY, 0);
    const tf = a.f + (b.f - a.f) * e + adjustments.cameraFovBoost;
    camera.position.lerp(tp, 0.045);
    lookAt.current.lerp(tl, 0.045);
    camera.lookAt(lookAt.current);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += (tf - cam.fov) * 0.045;
    cam.updateProjectionMatrix();
  });
  return null;
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const pos = useMemo(() => {
    const a = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i++) {
      a[i * 3] = (Math.random() - 0.5) * 28;
      a[i * 3 + 1] = (Math.random() - 0.5) * 18;
      a[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    return a;
  }, []);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.012; });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.028} color="#FFD700" transparent opacity={0.4} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function Floor() {
  return (
    <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#060606" roughness={0.08} metalness={0.75} />
    </mesh>
  );
}

function Lights() {
  const s1 = useRef<THREE.SpotLight>(null);
  const s2 = useRef<THREE.SpotLight>(null);
  useFrame((st) => {
    const t = st.clock.getElapsedTime();
    if (s1.current) { s1.current.position.x = Math.sin(t * 0.3) * 3; s1.current.position.z = Math.cos(t * 0.3) * 3; }
    if (s2.current) { s2.current.position.x = Math.cos(t * 0.2) * 4; s2.current.position.z = Math.sin(t * 0.2) * 4; }
  });
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} color="#fffaf0" />
      <spotLight ref={s1} position={[3, 5, 3]} angle={0.4} penumbra={0.8} intensity={6} castShadow color="#FFD700" />
      <spotLight ref={s2} position={[-4, 4, -2]} angle={0.5} penumbra={1} intensity={3.5} color="#FFA500" />
      <spotLight position={[0, 6, 0]} angle={0.6} penumbra={0.9} intensity={3} color="#ffffff" />
      <pointLight position={[2, 1, 3]} intensity={0.7} color="#FFD700" />
      <pointLight position={[-3, 2, -1]} intensity={0.3} color="#1a1a2e" />
    </>
  );
}

function Trackers() {
  const setScrollProgress = useStore((s) => s.setScrollProgress);
  const setMousePosition = useStore((s) => s.setMousePosition);
  useEffect(() => {
    const SCENE_HEIGHT_VH = 13;
    const onScroll = () => {
      const top = window.scrollY;
      const sceneH = window.innerHeight * SCENE_HEIGHT_VH;
      setScrollProgress(Math.min(top / sceneH, 1));
    };
    const onMouse = (e: MouseEvent) => {
      setPointerPosition(e.clientX, e.clientY, setMousePosition);
    };
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      setPointerPosition(touch.clientX, touch.clientY, setMousePosition);
    };
    const onOrientation = () => {
      onScroll();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('orientationchange', onOrientation);
    window.visualViewport?.addEventListener('resize', onOrientation);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('orientationchange', onOrientation);
      window.visualViewport?.removeEventListener('resize', onOrientation);
    };
  }, [setScrollProgress, setMousePosition]);
  return null;
}

function LoadingSpinner() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) { ref.current.rotation.x = s.clock.getElapsedTime(); ref.current.rotation.z = s.clock.getElapsedTime() * 0.5; } });
  return <mesh ref={ref}><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#FFD700" wireframe /></mesh>;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function Page() {
  const [canvasDpr, setCanvasDpr] = useState<[number, number]>([1, 1.5]);

  useEffect(() => {
    const updateDpr = () => {
      setCanvasDpr(window.innerWidth < 768 ? [1, 1.25] : [1, 1.5]);
    };
    updateDpr();
    window.addEventListener('resize', updateDpr);
    return () => window.removeEventListener('resize', updateDpr);
  }, []);

  return (
    <main className="relative bg-black">
      <Trackers />

      {/* Fixed 3D canvas */}
      <div className="fixed inset-0 z-0 h-[100dvh] w-full">
        <Canvas
          camera={{ position: [0, 0.3, 5.5], fov: 38 }}
          shadows
          dpr={canvasDpr}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor('#000000')}
          style={{ width: '100%', height: '100%' }}
        >
          <fog attach="fog" args={['#000000', 7, 22]} />
          <Lights />
          <Suspense fallback={<LoadingSpinner />}><Shoe /></Suspense>
          <Particles />
          <Floor />
          <CameraRig />
        </Canvas>
      </div>

      <NavBar />

      {/* Canvas fade overlay — covers the 3D when entering post-scroll */}
      {/* ─── SCROLL SCENES ─── */}
      <ScrollScene index={0} align="left">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">AIR JORDAN COLLECTION 2026</span>
        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[8rem] font-black leading-[0.82] tracking-[-0.04em] mb-6 sm:mb-8 p-1 sm:p-2">
          <span className="block">THE</span>
          <span className="block bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent">FUTURE</span>
          <span className="block">IS NOW</span>
        </h1>
        <p className="text-white/35 text-[13px] sm:text-[15px] md:text-base max-w-[280px] sm:max-w-[340px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2">
          Engineered for those who dare to push beyond. Experience performance redefined.
        </p>
        <div className="btn-row max-w-2xl px-4 sm:px-6">
          <button className="btn-primary flex-1 group">
            <span className="relative z-10">Shop Now</span>
          </button>
          <button className="btn-secondary flex-1">Explore</button>
        </div>
      </ScrollScene>

      <ScrollScene index={1} align="right">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-3 sm:mb-4 p-1 sm:p-2">ICONIC</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-3 sm:mb-4 p-1 sm:p-2">
          AIR JORDAN 1<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">RETRO HIGH OG</span>
        </h2>
        <p className="text-white/30 text-[12px] sm:text-[14px] mb-1 p-1 sm:p-2">Yellow Toe / Black</p>
        <p className="text-white/20 text-[11px] sm:text-[12px] mb-4 sm:mb-6 p-1 sm:p-2">US 7–14</p>
        <div className="text-2xl sm:text-3xl font-black text-[#FFD700] mb-6 sm:mb-8 p-1 sm:p-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>$180</div>
        <div className="btn-container max-w-md">
          <button className="btn-primary w-full">Add to Cart</button>
        </div>
      </ScrollScene>

      <ScrollScene index={2} align="left">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-3 sm:mb-4 p-1 sm:p-2">CLASSIC</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-3 sm:mb-4 p-1 sm:p-2">
          AIR JORDAN 4<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">RETRO</span>
        </h2>
        <p className="text-white/30 text-[12px] sm:text-[14px] mb-1 p-1 sm:p-2">Military Black</p>
        <p className="text-white/20 text-[11px] sm:text-[12px] mb-4 sm:mb-6 p-1 sm:p-2">US 6–13</p>
        <div className="text-2xl sm:text-3xl font-black text-[#FFD700] mb-6 sm:mb-8 p-1 sm:p-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>$210</div>
        <div className="btn-container max-w-md">
          <button className="btn-primary w-full">Add to Cart</button>
        </div>
      </ScrollScene>

      <ScrollScene index={3} align="right">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-3 sm:mb-4 p-1 sm:p-2">PREMIUM</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-3 sm:mb-4 p-1 sm:p-2">
          AIR JORDAN 11<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">RETRO</span>
        </h2>
        <p className="text-white/30 text-[12px] sm:text-[14px] mb-1 p-1 sm:p-2">Cap and Gown</p>
        <p className="text-white/20 text-[11px] sm:text-[12px] mb-4 sm:mb-6 p-1 sm:p-2">US 7–14</p>
        <div className="text-2xl sm:text-3xl font-black text-[#FFD700] mb-6 sm:mb-8 p-1 sm:p-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>$225</div>
        <div className="btn-container max-w-md">
          <button className="btn-primary w-full">Add to Cart</button>
        </div>
      </ScrollScene>

      <ScrollScene index={4} align="left">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">01 — DESIGN</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
          BORN FROM<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">INNOVATION</span>
        </h2>
        <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2">
          Every stitch, every contour — meticulously crafted for peak performance and iconic style.
        </p>
        <div className="space-y-3 sm:space-y-4 p-1 sm:p-2">
          {['Lightweight Flyknit', 'Air Cushioning System', 'Engineered Grip', 'Responsive ZoomX Foam'].map((f) => (
            <div key={f} className="flex items-center gap-3 sm:gap-4">
              <div className="w-[4px] sm:w-[5px] h-[4px] sm:h-[5px] rounded-full bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
              <span className="text-[12px] sm:text-[13px] font-medium tracking-[0.05em] text-white/60">{f}</span>
            </div>
          ))}
        </div>
      </ScrollScene>

      <ScrollScene index={5} align="right">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">02 — MATERIAL</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
          MATERIAL<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">EXCELLENCE</span>
        </h2>
        <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2">
          Premium fabrics meet cutting-edge technology. Built to last, designed to turn heads.
        </p>
        <div className="flex gap-8 sm:gap-12 p-1 sm:p-2">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">43%</div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Energy Return</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">37%</div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Lighter</div>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={6} align="left">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">03 — TECH</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
          SOLE<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">TECHNOLOGY</span>
        </h2>
        <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2">
          Engineered for explosive performance. From court to street, never miss a step.
        </p>
        <div className="flex gap-8 sm:gap-12 p-1 sm:p-2">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">85%</div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Absorption</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">2.5x</div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Grip</div>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={7} align="right">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-6 sm:mb-8 p-1 sm:p-2">LIMITED EDITION</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[6.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
          REDEFINE<br />
          <span className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent">YOUR LIMITS</span>
        </h2>
        <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[300px] sm:max-w-[380px] leading-[1.7] mb-10 sm:mb-12 p-1 sm:p-2">
          Step into the future. Limited quantity. Maximum impact.
        </p>
        <div className="btn-container max-w-lg px-4 sm:px-6">
          <button className="btn-primary btn-primary-lg w-full">Buy Now — $180</button>
        </div>
      </ScrollScene>

      <ScrollScene index={8} align="left">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Technology</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
          ENGINEERED<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">FOR SPEED</span>
        </h2>
        <p className="text-white/30 text-[12px] sm:text-[14px] max-w-[300px] sm:max-w-[340px] leading-[1.7] mb-6 sm:mb-8 p-1 sm:p-2">Four breakthrough technologies working in harmony.</p>
        <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-3 sm:gap-y-4 md:gap-y-5 p-1 sm:p-2">
          {[
            { num: '01', stat: '43%', label: 'Energy Return', name: 'AIR MAX UNIT' },
            { num: '02', stat: '37%', label: 'Lighter', name: 'FLYKNIT UPPER' },
            { num: '03', stat: '85%', label: 'Absorption', name: 'ZOOMX FOAM' },
            { num: '04', stat: '2.5x', label: 'Grip', name: 'WAFFLE OUTSOLE' },
          ].map((t) => (
            <div key={t.num}>
              <div className="flex items-baseline gap-1 sm:gap-2 mb-1">
                <span className="text-[9px] sm:text-[10px] text-white/15 tracking-wider">{t.num}</span>
                <span className="text-xl sm:text-2xl font-black text-[#FFD700]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{t.stat}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mb-1">{t.label}</div>
              <div className="text-[10px] sm:text-[11px] font-bold text-white/50" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{t.name}</div>
            </div>
          ))}
        </div>
      </ScrollScene>

      <ScrollScene index={9} align="right">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-6 sm:mb-8 p-2 sm:p-3">Voices</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-8 sm:mb-10 p-2 sm:p-3">
          WHAT THEY<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">SAY</span>
        </h2>
        <div className="space-y-5 sm:space-y-6 p-3 sm:p-4">
          {[
            { name: 'Marcus Rivera', role: 'Professional Athlete', text: 'The energy return is unlike anything I\'ve worn. My sprint times dropped noticeably in the first week.', rating: 5 },
            { name: 'Aisha Chen', role: 'Sneaker Collector', text: 'The yellow and black colorway is absolutely fire. Premium quality from box to court.', rating: 5 },
            { name: 'Jordan Williams', role: 'Streetwear Designer', text: 'These bridge performance and style perfectly. My go-to for every shoot and every game.', rating: 5 },
          ].map((r) => (
            <div key={r.name} className="p-5 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1 mb-4">
                {[...Array(r.rating)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4" fill="#FFD700" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[12px] sm:text-[13px] text-white/35 leading-[1.65] mb-5 italic">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FFD700]/[0.15] flex items-center justify-center border border-[#FFD700]/20">
                  <span className="text-[11px] sm:text-[12px] font-bold text-[#FFD700]">{r.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-[12px] sm:text-[13px] font-bold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{r.name}</div>
                  <div className="text-[9px] sm:text-[10px] text-white/25 tracking-[0.12em] uppercase">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollScene>

      <ScrollScene index={10} align="left">
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Stay Connected</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-4 sm:mb-6 p-1 sm:p-2">
          JOIN THE<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">MOVEMENT</span>
        </h2>
        <p className="text-white/30 text-[12px] sm:text-[14px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-6 sm:mb-8 p-1 sm:p-2">First access to exclusive drops, new colorways, and member-only offers.</p>
        <div className="pointer-events-auto btn-row max-w-xl px-4 sm:px-6">
          <input type="email" placeholder="Enter your email" className="input-gold flex-1" />
          <button className="btn-primary whitespace-nowrap">Subscribe</button>
        </div>
        <p className="text-[9px] sm:text-[10px] text-white/10 mt-3 sm:mt-4 tracking-wider p-1 sm:p-2">No spam. Unsubscribe anytime.</p>
      </ScrollScene>

      <ScrollScene index={11} align="center" noFade>
        <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-6 sm:mb-8 p-2 sm:p-3">Get in Touch</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] font-black leading-[0.88] tracking-[-0.03em] mb-8 sm:mb-10 p-2 sm:p-3 text-center">
          LET&apos;S<br />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">CONNECT</span>
        </h2>
        <div className="space-y-4 sm:space-y-5 mb-8 sm:mb-10 p-3 sm:p-4 max-w-2xl mx-auto">
          {[
            { label: 'Visit Us', val: '123 Innovation Drive\nPortland, OR 97201', icon: '📍' },
            { label: 'Email', val: 'hello@moondancer.com', icon: '✉️' },
            { label: 'Call', val: '+1 (503) 555-0199', icon: '📞' },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-4 p-4 sm:p-5 rounded-xl transition-all duration-300 hover:bg-white/[0.02] hover:shadow-[0_0_20px_rgba(255,215,0,0.05)]">
              <div className="text-2xl sm:text-3xl">{c.icon}</div>
              <div>
                <div className="text-[11px] sm:text-[12px] font-bold text-white/40 mb-1" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{c.label}</div>
                <div className="text-[12px] sm:text-[13px] text-white/25 leading-relaxed whitespace-pre-line">{c.val}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-auto btn-container max-w-2xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-5">
          <input placeholder="Your Name" className="input-gold input-gold-square" />
          <input placeholder="Email Address" className="input-gold input-gold-square" />
          <select className="input-gold input-gold-square text-white/30 appearance-none">
            <option value="">Inquiry Type</option>
            <option value="order">Order Support</option>
            <option value="returns">Returns</option>
            <option value="wholesale">Wholesale</option>
            <option value="press">Press</option>
          </select>
          <textarea rows={3} placeholder="Your Message" className="input-gold input-gold-square resize-none !min-h-[5.5rem] !rounded-xl py-4" />
          <button className="btn-primary btn-primary-square w-full">Send Message</button>
        </div>
      </ScrollScene>

      {/* ─── POST-SCROLL ─── */}
      <div className="relative z-[6] bg-black">
        <FooterSection />
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CANVAS FADE — hides 3D as post-scroll content approaches
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════════
   SCROLL SCENE
   ═══════════════════════════════════════════════════════════════════════════════ */

function ScrollScene({ children, index, align, noFade }: { children: React.ReactNode; index: number; align: 'left' | 'right' | 'center'; noFade?: boolean }) {
  const scrollProgress = useStore((s) => s.scrollProgress);
  const total = 12;
  const start = index / total;
  const end = (index + 1) / total;
  const center = (start + end) / 2;

  const distance = Math.abs(scrollProgress - center) / (end - start);
  const opacity = noFade ? 1 : (distance < 0.95 ? 1 : Math.max(0, (1 - distance) * 10));

  const containerClass = align === 'left'
    ? 'items-center max-sm:items-start max-sm:pt-24 justify-start pl-[16%] sm:pl-[20%] md:pl-[24%] lg:pl-[28%] pr-[8%] sm:pr-0'
    : align === 'right'
    ? 'items-center max-sm:items-start max-sm:pt-24 justify-end pr-[16%] sm:pr-[20%] md:pr-[24%] lg:pr-[28%] pl-[8%] sm:pl-0'
    : 'items-center justify-center px-[10%] sm:px-[14%] md:px-[18%] lg:px-[20%]';

  const maxWidthClass = align === 'center' ? 'max-w-3xl' : 'max-w-[460px] max-sm:max-w-full';

  return (
      <div className={`relative h-[100dvh] min-h-[100svh] w-full flex pointer-events-none ${containerClass}`} style={{ opacity }}>
      <div className={`${maxWidthClass} w-full pointer-events-auto`} style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════════════════════════════════════════ */

function NavBar() {
  const scrollProgress = useStore((s) => s.scrollProgress);
  const isScrolled = scrollProgress > 0.92;
  return (
    <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-700 ${isScrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-transparent'}`}>
      <div className="flex items-center justify-between px-5 sm:px-8 md:px-14 py-4 md:py-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full border border-white/15 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.08)]">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFD700] shadow-[0_0_14px_rgba(255,215,0,0.55)]" />
          </div>
          <span className="text-[11px] sm:text-[13px] font-bold tracking-[0.18em] uppercase text-white/70 truncate">MOONDANCER</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {['Collection', 'Technology', 'About', 'Contact'].map((item) => (
            <span key={item} className="nav-link text-[11px] font-semibold tracking-[0.12em] uppercase text-white/35 hover:text-[#FFD700]/80 transition-colors duration-300 cursor-pointer">{item}</span>
          ))}
        </div>
        <button className="btn-nav">Shop</button>
      </div>
      <div className="h-[1px] bg-white/[0.03]">
        <div className="h-full transition-all duration-100" style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)', width: `${scrollProgress * 100}%` }} />
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   POST-SCROLL SECTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */

function FooterSection() {
  const cols = [
    { title: 'Shop', links: ['New Arrivals', 'Men', 'Women', 'Kids', 'Sale', 'Gift Cards'] },
    { title: 'Support', links: ['Help Center', 'Order Status', 'Returns', 'Size Guide', 'Shipping'] },
    { title: 'Company', links: ['About', 'Careers', 'Press', 'Sustainability', 'Partners'] },
    { title: 'Connect', links: ['Instagram', 'Twitter / X', 'YouTube', 'TikTok', 'Discord'] },
  ];

  return (
    <footer className="border-t border-white/[0.04] pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 bg-gradient-to-b from-black to-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 md:gap-12 mb-12 sm:mb-16">
          {/* Brand section */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
              <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
              </div>
              <span className="text-[12px] sm:text-[13px] font-bold tracking-[0.18em] uppercase text-white/50" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>MOONDANCER</span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-white/20 leading-relaxed max-w-[200px] mb-4 sm:mb-5">Pushing the boundaries of performance footwear since 2020.</p>
            {/* Social icons */}
            <div className="flex gap-3">
              {['IG', 'TW', 'YT', 'TK'].map((social) => (
                <a key={social} href="#" className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[10px] text-white/30 hover:text-[#FFD700] hover:border-[#FFD700]/30 hover:bg-[#FFD700]/5 transition-all duration-300">
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-white/35 mb-4 sm:mb-6" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{c.title}</h4>
              <ul className="space-y-2.5 sm:space-y-3.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[11px] sm:text-[12px] text-white/18 hover:text-[#FFD700]/45 transition-colors duration-300 inline-block hover:translate-x-1 transform transition-transform">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="border-t border-white/[0.04] pt-8 sm:pt-10 mb-8 sm:mb-10">
          <div className="max-w-xl mx-auto text-center">
            <h5 className="text-[12px] sm:text-[13px] font-bold tracking-[0.2em] uppercase text-white/40 mb-3" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Stay Updated</h5>
            <p className="text-[11px] sm:text-[12px] text-white/20 mb-4 sm:mb-5">Get exclusive access to new releases and special offers.</p>
            <div className="btn-row max-w-lg mx-auto !py-0">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-gold flex-1"
              />
              <button className="btn-primary whitespace-nowrap">Join</button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] sm:text-[11px] text-white/10 tracking-wider">&copy; 2026 Moondancer. All rights reserved.</span>
          <div className="flex gap-4 sm:gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((l) => (
              <a key={l} href="#" className="text-[10px] sm:text-[11px] text-white/10 hover:text-white/20 transition-colors tracking-wider">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
