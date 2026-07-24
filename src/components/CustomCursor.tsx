'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function CustomCursor() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { damping: 25, stiffness: 200, mass: 0.5 });
  const springY = useSpring(cursorY, { damping: 25, stiffness: 200, mass: 0.5 });
  const isHovering = useStore((s) => s.isHovering);
  const [isVisible, setIsVisible] = useState(false);
  const trailRef = useRef<HTMLDivElement>(null);
  const [trailPositions, setTrailPositions] = useState<Array<{ x: number; y: number; opacity: number }>>([]);

  useEffect(() => {
    let animationId: number;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);

      setTrailPositions((prev) => {
        const newTrail = [
          { x: e.clientX, y: e.clientY, opacity: 0.4 },
          ...prev.slice(0, 5).map((p) => ({ ...p, opacity: p.opacity * 0.7 })),
        ];
        return newTrail.slice(0, 6);
      });

      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Trail particles */}
      {trailPositions.map((pos, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none z-[9998]"
          animate={{
            x: pos.x - 3,
            y: pos.y - 3,
            opacity: pos.opacity * (isVisible ? 1 : 0),
            scale: 1 - i * 0.15,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: `rgba(255, 77, 0, ${0.5 - i * 0.08})`,
            filter: `blur(${i * 0.5}px)`,
          }}
        />
      ))}

      {/* Main cursor */}
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 60 : 20,
          height: isHovering ? 60 : 20,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '1.5px solid rgba(255, 77, 0, 0.6)',
            boxShadow: isHovering
              ? '0 0 20px rgba(255, 77, 0, 0.4), inset 0 0 20px rgba(255, 77, 0, 0.1)'
              : '0 0 10px rgba(255, 77, 0, 0.2)',
          }}
          animate={{
            scale: isHovering ? 1 : 1,
            borderColor: isHovering ? 'rgba(255, 77, 0, 0.9)' : 'rgba(255, 77, 0, 0.6)',
          }}
        />

        {/* Inner dot */}
        <motion.div
          className="absolute rounded-full bg-white"
          style={{
            width: 4,
            height: 4,
            left: '50%',
            top: '50%',
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{
            opacity: isHovering ? 0 : 1,
            scale: isHovering ? 0 : 1,
          }}
        />
      </motion.div>

      {/* Glow effect */}
      <motion.div
        className="fixed pointer-events-none z-[9997]"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 120 : 40,
          height: isHovering ? 120 : 40,
          opacity: isVisible ? (isHovering ? 0.15 : 0.08) : 0,
        }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 77, 0, 0.4) 0%, transparent 70%)',
            filter: 'blur(15px)',
          }}
        />
      </motion.div>
    </>
  );
}
