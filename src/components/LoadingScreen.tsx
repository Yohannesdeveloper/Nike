'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(onComplete, 800);
          }, 300);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 77, 0, 0.05) 0%, transparent 70%)',
              }}
            />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10 mb-8 sm:mb-10 md:mb-12 p-2 sm:p-3 md:p-4"
          >
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.02em] p-1 sm:p-2"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                background: 'linear-gradient(135deg, #ffffff 0%, #ff4d00 50%, #ff8c00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              MOONDANCER
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-[1px] mt-3 sm:mt-4 origin-left"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 77, 0, 0.6), transparent)',
              }}
            />
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="relative z-10 w-48"
          >
            <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #ff4d00, #ff8c00)',
                  width: `${Math.min(progress, 100)}%`,
                  boxShadow: '0 0 10px rgba(255, 77, 0, 0.5)',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="flex justify-between mt-2 sm:mt-3">
              <span
                className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/40 p-1 sm:p-2"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                Loading Experience
              </span>
              <span
                className="text-[9px] sm:text-[10px] tracking-[0.2em] text-white/40 p-1 sm:p-2"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {Math.min(Math.round(progress), 100)}%
              </span>
            </div>
          </motion.div>

          {/* Decorative elements */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 200 + i * 100,
                height: 200 + i * 100,
                border: '1px solid rgba(255, 77, 0, 0.08)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 0.3, 0],
                scale: [0.5, 1, 1.5],
                rotate: [0, 180],
              }}
              transition={{
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
