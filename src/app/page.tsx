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
      <div className="main-content">
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
      <ScrollScene index={0} id="home">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">AIR JORDAN COLLECTION 2026</span>
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[8rem] font-black leading-[0.82] tracking-[-0.04em] mb-6 sm:mb-8 p-1 sm:p-2">
            <span className="block">THE</span>
            <span className="block bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent">FUTURE</span>
            <span className="block">IS NOW</span>
          </h1>
          <p className="text-white/35 text-[13px] sm:text-[15px] md:text-base max-w-[280px] sm:max-w-[340px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Engineered for those who dare to push beyond. Experience performance redefined.
          </p>
          <div className="btn-row max-w-2xl px-4 sm:px-6 mx-auto">
            <button className="btn-primary flex-1 group">
              <span className="relative z-10">Shop Now</span>
            </button>
            <button className="btn-secondary flex-1">Explore</button>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={1} id="shop">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Shop All</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            BROWSE<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">COLLECTION</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[320px] sm:max-w-[400px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Explore our complete catalog of premium sneakers. From classic retros to cutting-edge performance models.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 p-2 sm:p-4">
            {[
              { name: 'Jordan 1 High', price: '$180', color: 'Yellow Toe / Black' },
              { name: 'Jordan 4 Retro', price: '$210', color: 'Military Black' },
              { name: 'Jordan 11 Retro', price: '$225', color: 'Cap and Gown' },
              { name: 'Jordan 3 Retro', price: '$200', color: 'White/Cement' },
              { name: 'Jordan 6 Retro', price: '$190', color: 'Infrared 23' },
              { name: 'Jordan 12 Retro', price: '$195', color: 'Vachetta Tan' },
            ].map((item) => (
              <div key={item.name} className="p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.12)] hover:scale-[1.02] cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[14px] sm:text-[15px] font-bold mb-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{item.name}</div>
                <div className="text-[11px] sm:text-[12px] text-white/25 mb-3">{item.color}</div>
                <div className="text-xl sm:text-2xl font-black text-[#FFD700]">{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={2}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-3 sm:mb-4 p-1 sm:p-2">ICONIC</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-3 sm:mb-4 p-1 sm:p-2">
            AIR JORDAN 1<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">RETRO HIGH OG</span>
          </h2>
          <p className="text-white/30 text-[12px] sm:text-[14px] mb-1 p-1 sm:p-2">Yellow Toe / Black</p>
          <p className="text-white/20 text-[11px] sm:text-[12px] mb-4 sm:mb-6 p-1 sm:p-2">US 7–14</p>
          <div className="text-2xl sm:text-3xl font-black text-[#FFD700] mb-6 sm:mb-8 p-1 sm:p-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>$180</div>
          <div className="btn-container max-w-md mx-auto">
            <button className="btn-primary w-full">Add to Cart</button>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={3}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-3 sm:mb-4 p-1 sm:p-2">CLASSIC</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-3 sm:mb-4 p-1 sm:p-2">
            AIR JORDAN 4<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">RETRO</span>
          </h2>
          <p className="text-white/30 text-[12px] sm:text-[14px] mb-1 p-1 sm:p-2">Military Black</p>
          <p className="text-white/20 text-[11px] sm:text-[12px] mb-4 sm:mb-6 p-1 sm:p-2">US 6–13</p>
          <div className="text-2xl sm:text-3xl font-black text-[#FFD700] mb-6 sm:mb-8 p-1 sm:p-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>$210</div>
          <div className="btn-container max-w-md mx-auto">
            <button className="btn-primary w-full">Add to Cart</button>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={4}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-3 sm:mb-4 p-1 sm:p-2">PREMIUM</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-3 sm:mb-4 p-1 sm:p-2">
            AIR JORDAN 11<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">RETRO</span>
          </h2>
          <p className="text-white/30 text-[12px] sm:text-[14px] mb-1 p-1 sm:p-2">Cap and Gown</p>
          <p className="text-white/20 text-[11px] sm:text-[12px] mb-4 sm:mb-6 p-1 sm:p-2">US 7–14</p>
          <div className="text-2xl sm:text-3xl font-black text-[#FFD700] mb-6 sm:mb-8 p-1 sm:p-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>$225</div>
          <div className="btn-container max-w-md mx-auto">
            <button className="btn-primary w-full">Add to Cart</button>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={5}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">01 — DESIGN</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            BORN FROM<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">INNOVATION</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Every stitch, every contour — meticulously crafted for peak performance and iconic style.
          </p>
          <div className="space-y-3 sm:space-y-4 p-1 sm:p-2 max-w-md mx-auto">
            {['Lightweight Flyknit', 'Air Cushioning System', 'Engineered Grip', 'Responsive ZoomX Foam'].map((f) => (
              <div key={f} className="flex items-center gap-3 sm:gap-4">
                <div className="w-[4px] sm:w-[5px] h-[4px] sm:h-[5px] rounded-full bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                <span className="text-[12px] sm:text-[13px] font-medium tracking-[0.05em] text-white/60">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={6}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">02 — MATERIAL</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            MATERIAL<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">EXCELLENCE</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Premium fabrics meet cutting-edge technology. Built to last, designed to turn heads.
          </p>
          <div className="flex gap-8 sm:gap-12 p-1 sm:p-2 justify-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">43%</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Energy Return</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">37%</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Lighter</div>
            </div>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={7}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">03 — TECH</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            SOLE<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">TECHNOLOGY</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Engineered for explosive performance. From court to street, never miss a step.
          </p>
          <div className="flex gap-8 sm:gap-12 p-1 sm:p-2 justify-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">85%</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Absorption</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">2.5x</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Grip</div>
            </div>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={8}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-6 sm:mb-8 p-1 sm:p-2">LIMITED EDITION</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[6.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            REDEFINE<br />
            <span className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent">YOUR LIMITS</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[300px] sm:max-w-[380px] leading-[1.7] mb-10 sm:mb-12 p-1 sm:p-2 mx-auto">
            Step into the future. Limited quantity. Maximum impact.
          </p>
          <div className="btn-container max-w-lg px-4 sm:px-6 mx-auto">
            <button className="btn-primary btn-primary-lg w-full">Buy Now — $180</button>
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={9}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Technology</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            ENGINEERED<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">FOR SPEED</span>
          </h2>
          <p className="text-white/30 text-[12px] sm:text-[14px] max-w-[300px] sm:max-w-[340px] leading-[1.7] mb-6 sm:mb-8 p-1 sm:p-2 mx-auto">Four breakthrough technologies working in harmony.</p>
          <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-3 sm:gap-y-4 md:gap-y-5 p-1 sm:p-2 max-w-lg mx-auto">
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
        </div>
      </ScrollScene>

      <ScrollScene index={10}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-6 sm:mb-8 p-2 sm:p-3">Voices</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-8 sm:mb-10 p-2 sm:p-3">
            WHAT THEY<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">SAY</span>
          </h2>
          <div className="space-y-5 sm:space-y-6 p-3 sm:p-4 max-w-2xl mx-auto">
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
        </div>
      </ScrollScene>

      <ScrollScene index={11}>
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Stay Connected</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-black leading-[0.88] tracking-[-0.03em] mb-4 sm:mb-6 p-1 sm:p-2">
            JOIN THE<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">MOVEMENT</span>
          </h2>
          <p className="text-white/30 text-[12px] sm:text-[14px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-6 sm:mb-8 p-1 sm:p-2 mx-auto">First access to exclusive drops, new colorways, and member-only offers.</p>
          <div className="pointer-events-auto btn-row max-w-xl px-4 sm:px-6 mx-auto">
            <input type="email" placeholder="Enter your email" className="input-gold flex-1" />
            <button className="btn-primary whitespace-nowrap">Subscribe</button>
          </div>
          <p className="text-[9px] sm:text-[10px] text-white/10 mt-3 sm:mt-4 tracking-wider p-1 sm:p-2">No spam. Unsubscribe anytime.</p>
        </div>
      </ScrollScene>

      <ScrollScene index={12} noFade id="contact">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-6 sm:mb-8 p-2 sm:p-3">Get in Touch</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] font-black leading-[0.88] tracking-[-0.03em] mb-8 sm:mb-10 p-2 sm:p-3">
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
        </div>
      </ScrollScene>

      <ScrollScene index={13} id="men">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Men's Collection</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            FOR<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">HIM</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Performance meets style. Explore our premium men's sneaker collection designed for the modern athlete.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 p-2 sm:p-4">
            {[
              { name: 'Jordan 1 High', price: '$180', color: 'Black/Gold' },
              { name: 'Jordan 4 Retro', price: '$210', color: 'Military Black' },
              { name: 'Jordan 11 Retro', price: '$225', color: 'Cap and Gown' },
              { name: 'Jordan 3 Retro', price: '$200', color: 'White/Cement' },
            ].map((item) => (
              <div key={item.name} className="p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.12)] hover:scale-[1.02] cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[14px] sm:text-[15px] font-bold mb-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{item.name}</div>
                <div className="text-[11px] sm:text-[12px] text-white/25 mb-3">{item.color}</div>
                <div className="text-xl sm:text-2xl font-black text-[#FFD700]">{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={14} id="women">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Women's Collection</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            FOR<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">HER</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Elegance and power combined. Discover women's sneakers that blend fashion with function.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 p-2 sm:p-4">
            {[
              { name: 'Jordan 1 Low', price: '$160', color: 'Pink/White' },
              { name: 'Jordan 4 Retro', price: '$210', color: 'Violet Ore' },
              { name: 'Jordan 11 Retro', price: '$225', color: 'Silver Bullet' },
              { name: 'Jordan 12 Retro', price: '$190', color: 'Vachetta Tan' },
            ].map((item) => (
              <div key={item.name} className="p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.12)] hover:scale-[1.02] cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[14px] sm:text-[15px] font-bold mb-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{item.name}</div>
                <div className="text-[11px] sm:text-[12px] text-white/25 mb-3">{item.color}</div>
                <div className="text-xl sm:text-2xl font-black text-[#FFD700]">{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={15} id="kids">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Kids' Collection</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            FOR<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">KIDS</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Start them young. Premium sneakers designed for the next generation of athletes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 p-2 sm:p-4">
            {[
              { name: 'Jordan 1 Low', price: '$85', color: 'Black/Red' },
              { name: 'Jordan 4 Retro', price: '$95', color: 'Bred Reimagined' },
              { name: 'Jordan 11 Retro', price: '$110', color: 'Concord' },
              { name: 'Jordan 6 Retro', price: '$90', color: 'Infrared 23' },
            ].map((item) => (
              <div key={item.name} className="p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.12)] hover:scale-[1.02] cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[14px] sm:text-[15px] font-bold mb-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{item.name}</div>
                <div className="text-[11px] sm:text-[12px] text-white/25 mb-3">{item.color}</div>
                <div className="text-xl sm:text-2xl font-black text-[#FFD700]">{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={16} id="new-arrivals">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Just Dropped</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            NEW<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">ARRIVALS</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[280px] sm:max-w-[320px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Fresh from the factory. Be the first to own the latest releases.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 p-2 sm:p-4">
            {[
              { name: 'Jordan 1 Lost & Found', price: '$180', badge: 'LIMITED' },
              { name: 'Jordan 4 Thunder', price: '$210', badge: 'HOT' },
              { name: 'Jordan 11 Gratitude', price: '$225', badge: 'SOLD OUT' },
            ].map((item) => (
              <div key={item.name} className="p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.12)] hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] sm:text-[15px] font-bold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{item.name}</div>
                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] tracking-wider">{item.badge}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl sm:text-2xl font-black text-[#FFD700]">{item.price}</div>
                  <button className="btn-primary text-[10px] sm:text-[11px] px-4 py-2">Shop</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollScene>

      <ScrollScene index={17} id="about">
        <div className="text-center">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-[#FFD700]/50 mb-4 sm:mb-6 p-1 sm:p-2">Our Story</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[5rem] font-black leading-[0.88] tracking-[-0.03em] mb-6 sm:mb-8 p-1 sm:p-2">
            ABOUT<br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">US</span>
          </h2>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[400px] sm:max-w-[500px] leading-[1.7] mb-6 sm:mb-8 p-1 sm:p-2 mx-auto">
            Founded in 2020, Moondancer was born from a passion for pushing the boundaries of performance footwear. We believe every step should be extraordinary.
          </p>
          <p className="text-white/35 text-[13px] sm:text-[15px] max-w-[400px] sm:max-w-[500px] leading-[1.7] mb-8 sm:mb-10 p-1 sm:p-2 mx-auto">
            Our team of designers, engineers, and athletes work together to create sneakers that don't just perform — they inspire. From the court to the street, we're here to help you redefine your limits.
          </p>
          <div className="flex gap-8 sm:gap-12 p-1 sm:p-2 justify-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">2020</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Founded</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">50K+</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Athletes</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#FFD700] leading-none">100+</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/25 mt-2">Countries</div>
            </div>
          </div>
        </div>
      </ScrollScene>

      {/* ─── POST-SCROLL ─── */}
      <div className="relative z-[6] bg-black">
        <FooterSection />
      </div>
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

function ScrollScene({ children, index, noFade, id }: { children: React.ReactNode; index: number; noFade?: boolean; id?: string }) {
  const scrollProgress = useStore((s) => s.scrollProgress);
  const total = 18;
  const start = index / total;
  const end = (index + 1) / total;
  const center = (start + end) / 2;

  const distance = Math.abs(scrollProgress - center) / (end - start);
  const opacity = noFade ? 1 : (distance < 1.5 ? 1 : Math.max(0, (1.5 - distance) * 2));

  // Always center content for professional look
  const containerClass = 'items-center justify-center';

  const maxWidthClass = 'max-w-7xl max-w-full';

  // First scroll scene needs extra top margin to clear fixed navigation
  const firstSceneClass = index === 0 ? 'pt-8' : '';

  return (
      <div id={id} className={`relative h-[100dvh] min-h-[100svh] w-full flex pointer-events-none ${containerClass}`} style={{ opacity }}>
      <div className={`${maxWidthClass} w-full pointer-events-auto mx-auto ${firstSceneClass} p-6 sm:p-10 md:p-14 lg:p-20`} style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
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
  const setScrollProgress = useStore((s) => s.setScrollProgress);
  const isScrolled = scrollProgress > 0.92;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const SCENE_HEIGHT_VH = 13;
      const sceneH = window.innerHeight * SCENE_HEIGHT_VH;

      // Calculate which index this section corresponds to
      const sectionIndex = {
        'home': 0,
        'shop': 1,
        'men': 13,
        'women': 14,
        'kids': 15,
        'new-arrivals': 16,
        'about': 17,
        'contact': 12,
      }[id] || 0;

      // Calculate target scroll position
      const targetScroll = (sectionIndex / 18) * sceneH;

      // Smooth scroll to position
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });

      // Update store to reflect new position
      setScrollProgress(sectionIndex / 18);
    }
  };

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Shop', id: 'shop' },
    { label: 'Men', id: 'men' },
    { label: 'Women', id: 'women' },
    { label: 'Kids', id: 'kids' },
    { label: 'New Arrivals', id: 'new-arrivals' },
    { label: 'About Us', id: 'about' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-transparent'}`}>
      <div className="flex items-center justify-between px-5 sm:px-8 md:px-14 py-4 md:py-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full border border-white/15 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.08)]">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFD700] shadow-[0_0_14px_rgba(255,215,0,0.55)]" />
          </div>
          <span className="text-[11px] sm:text-[13px] font-bold tracking-[0.18em] uppercase text-white/70 truncate">MOONDANCER</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.id)}
              className="nav-link text-[11px] font-semibold tracking-[0.12em] uppercase text-white/35 hover:text-[#FFD700]/80 transition-colors duration-300 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
        <button className="btn-nav" onClick={() => scrollToSection('shop')}>Shop</button>
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
    <footer className="relative bg-black overflow-hidden">
      <div className="relative w-full px-6 sm:px-10 md:px-16 lg:px-24 pt-40 sm:pt-48 md:pt-56 lg:pt-64 pb-16 sm:pb-20">

        {/* Main footer content */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-20 sm:gap-x-16 sm:gap-y-24 md:grid-cols-3 lg:grid-cols-6 mb-32 sm:mb-40">
          {/* Brand section */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 sm:gap-3.5 mb-6 sm:mb-7">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/[0.03] flex items-center justify-center shadow-[0_0_24px_rgba(255,215,0,0.08)]">
                <div className="w-3 h-3 rounded-full bg-[#FFD700] shadow-[0_0_16px_rgba(255,215,0,0.55)]" />
              </div>
              <span className="text-[15px] sm:text-[17px] font-bold tracking-[0.22em] uppercase text-white/60" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>MOONDANCER</span>
            </div>
            <p className="text-[13px] sm:text-[14px] text-white/30 leading-relaxed max-w-[260px] mb-7">Pushing the boundaries of performance footwear since 2020. Designed for movement, built to last.</p>
            {/* Social icons */}
            <div className="flex gap-3">
              {['IG', 'TW', 'YT', 'TK'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-white/35 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:bg-[#FFD700]/[0.06] hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] hover:-translate-y-0.5 transition-all duration-300">
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[11px] sm:text-[12px] font-bold tracking-[0.28em] uppercase text-white/40 mb-7 sm:mb-9" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{c.title}</h4>
              <ul className="space-y-4 sm:space-y-5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13px] sm:text-[14px] text-white/25 hover:text-[#FFD700] transition-colors duration-300 inline-block hover:translate-x-1.5 transform transition-transform">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] pt-12 sm:pt-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full border border-white/15 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
            </div>
            <span className="text-[11px] sm:text-[12px] text-white/30 tracking-wider">&copy; 2026 Moondancer. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-8 sm:gap-10">
            {['Privacy', 'Terms', 'Cookies', 'Accessibility'].map((l) => (
              <a key={l} href="#" className="text-[11px] sm:text-[12px] text-white/25 hover:text-[#FFD700]/70 transition-colors tracking-wider">
                {l}
              </a>
            ))}
          </div>
          <span className="text-[11px] text-white/15 tracking-wider">Crafted with passion in Portland</span>
        </div>
      </div>
    </footer>
  );
}
