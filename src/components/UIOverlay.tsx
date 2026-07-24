'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

interface Scene {
  id: number;
  title: string;
  subtitle: string;
  features: string[];
  position: 'center' | 'left' | 'right' | 'bottom';
}

const scenes: Scene[] = [
  {
    id: 0,
    title: 'BORN FROM\nINNOVATION',
    subtitle: 'The future of performance footwear',
    features: [],
    position: 'center',
  },
  {
    id: 1,
    title: 'PRECISION\nENGINEERED',
    subtitle: 'Every detail, meticulously crafted',
    features: ['Lightweight Mesh', 'Air Cushioning', 'Engineered Grip', 'Responsive Foam'],
    position: 'left',
  },
  {
    id: 2,
    title: 'MATERIAL\nEXCELLENCE',
    subtitle: 'Premium fabrics meet cutting-edge technology',
    features: [],
    position: 'right',
  },
  {
    id: 3,
    title: 'SOLE\nTECHNOLOGY',
    subtitle: 'Engineered for explosive performance',
    features: [],
    position: 'bottom',
  },
  {
    id: 4,
    title: 'REDEFINE\nYOUR LIMITS',
    subtitle: 'Step into the future',
    features: [],
    position: 'center',
  },
];

function FeatureLabel({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 p-1 sm:p-2"
    >
      <div className="w-2 h-2 rounded-full bg-[#ff4d00]" />
      <span
        className="text-xs sm:text-sm md:text-base font-medium tracking-wide text-white/80"
        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
      >
        {text}
      </span>
    </motion.div>
  );
}

export default function UIOverlay() {
  const scrollProgress = useStore((s) => s.scrollProgress);

  const activeSceneIndex = useMemo(() => {
    if (scrollProgress < 0.12) return 0;
    if (scrollProgress < 0.35) return 1;
    if (scrollProgress < 0.55) return 2;
    if (scrollProgress < 0.75) return 3;
    return 4;
  }, [scrollProgress]);

  const activeScene = scenes[activeSceneIndex];

  return (
    <div className="fixed inset-0 pointer-events-none z-10 p-2 sm:p-3 md:p-4 lg:p-6">
      {/* Top navigation */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 md:py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <div className="flex items-center gap-2 p-1 sm:p-2">
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#ff4d00]" />
          </div>
          <span
            className="text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-white/70 p-1 sm:p-2"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            MOONDANCER
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 sm:gap-10">
          {['Explore', 'Technology', 'Story', 'Shop'].map((item) => (
            <button
              key={item}
              className="pointer-events-auto text-sm font-medium tracking-[0.15em] uppercase text-white/40 hover:text-white/80 transition-colors duration-300 p-2 sm:p-3"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              {item}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Scene content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`absolute ${
            activeScene.position === 'center'
              ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center'
              : activeScene.position === 'left'
              ? 'left-6 md:left-16 top-1/2 -translate-y-1/2'
              : activeScene.position === 'right'
              ? 'right-6 md:right-16 top-1/2 -translate-y-1/2 text-right'
              : 'left-1/2 bottom-32 md:bottom-40 -translate-x-1/2 text-center'
          }`}
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black leading-[0.9] tracking-[-0.03em] mb-3 sm:mb-4 whitespace-pre-line p-1 sm:p-2 md:p-3 lg:p-4"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              textShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            {activeScene.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xs sm:text-sm md:text-base text-white/50 font-light tracking-wide max-w-[200px] sm:max-w-xs p-1 sm:p-2 md:p-3"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            {activeScene.subtitle}
          </motion.p>

          {activeScene.features.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8"
            >
              {activeScene.features.map((feature, i) => (
                <FeatureLabel key={feature} text={feature} delay={0.5 + i * 0.1} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Scroll indicator */}
      {scrollProgress < 0.05 && (
        <motion.div
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 2 }}
        >
          <span
            className="text-[10px] tracking-[0.3em] uppercase text-white/30 p-1 sm:p-2"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Scroll to explore
          </span>
          <motion.div
            className="w-[1px] h-6 sm:h-8 bg-gradient-to-b from-[#ff4d00]/60 to-transparent"
            animate={{ scaleY: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}

      {/* Progress dots */}
      <div className="absolute right-4 sm:right-6 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 flex flex-col gap-3 sm:gap-4 p-2 sm:p-3">
        {scenes.map((scene, i) => (
          <motion.div
            key={scene.id}
            className="relative"
            whileHover={{ scale: 1.3 }}
          >
            <div
              className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                i === activeSceneIndex
                  ? 'bg-[#ff4d00] shadow-[0_0_10px_rgba(255,77,0,0.5)]'
                  : 'bg-white/20'
              }`}
            />
            {i === activeSceneIndex && (
              <motion.div
                layoutId="activeDot"
                className="absolute inset-0 rounded-full border border-[#ff4d00]/50"
                style={{ margin: '-3px' }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      {activeSceneIndex === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2"
        >
          <button
            className="pointer-events-auto relative group w-full max-w-md px-12 py-7 text-base font-bold tracking-[0.2em] uppercase text-white rounded-full overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,77,0,0.3)] hover:scale-105"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              background: 'linear-gradient(135deg, #ff4d00 0%, #ff8c00 100%)',
            }}
          >
            <span className="relative z-10">Shop Now</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        </motion.div>
      )}

      {/* Scroll progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
        <motion.div
          className="h-full"
          style={{
            background: 'linear-gradient(90deg, #ff4d00, #ff8c00)',
            width: `${scrollProgress * 100}%`,
            boxShadow: '0 0 10px rgba(255, 77, 0, 0.5)',
          }}
        />
      </div>
    </div>
  );
}
