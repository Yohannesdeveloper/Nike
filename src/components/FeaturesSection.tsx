'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

const features = [
  {
    title: 'AIR MAX UNIT',
    description: 'Pressurized air technology provides maximum impact absorption and responsive energy return with every stride.',
    stat: '43%',
    statLabel: 'More Energy Return',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <circle cx="24" cy="24" r="20" stroke="#ff4d00" strokeWidth="1.5" opacity="0.3" />
        <path d="M16 24C16 19.6 19.6 16 24 16C28.4 16 32 19.6 32 24" stroke="#ff4d00" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="4" fill="#ff4d00" opacity="0.6" />
      </svg>
    ),
  },
  {
    title: 'FLYKNIT UPPER',
    description: 'Precision-engineered breathable mesh wraps your foot in lightweight comfort while maintaining structural integrity.',
    stat: '37%',
    statLabel: 'Lighter Than Traditional',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <path d="M12 36L24 12L36 36" stroke="#ff4d00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
        <path d="M18 36L24 20L30 36" stroke="#ff4d00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'ZOOMX FOAM',
    description: 'Next-generation cushioning compound delivers explosive speed with a smooth, responsive ride.',
    stat: '85%',
    statLabel: 'Energy Absorption',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <path d="M8 24H40" stroke="#ff4d00" strokeWidth="1.5" opacity="0.3" />
        <path d="M12 24C12 24 18 12 24 12C30 12 36 24 36 24C36 24 30 36 24 36C18 36 12 24 12 24Z" stroke="#ff4d00" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Waffle Outsole',
    description: 'Multi-directional traction pattern grips every surface, from track to street, for unwavering confidence.',
    stat: '2.5x',
    statLabel: 'Grip Performance',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <rect x="12" y="12" width="24" height="24" rx="4" stroke="#ff4d00" strokeWidth="1.5" opacity="0.3" />
        <line x1="18" y1="12" x2="18" y2="36" stroke="#ff4d00" strokeWidth="1" opacity="0.3" />
        <line x1="24" y1="12" x2="24" y2="36" stroke="#ff4d00" strokeWidth="1" opacity="0.3" />
        <line x1="30" y1="12" x2="30" y2="36" stroke="#ff4d00" strokeWidth="1" opacity="0.3" />
        <line x1="12" y1="18" x2="36" y2="18" stroke="#ff4d00" strokeWidth="1" opacity="0.3" />
        <line x1="12" y1="24" x2="36" y2="24" stroke="#ff4d00" strokeWidth="1" opacity="0.3" />
        <line x1="12" y1="30" x2="36" y2="30" stroke="#ff4d00" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  const scrollProgress = useStore((s) => s.scrollProgress);
  const isVisible = scrollProgress > 0.85;

  return (
    <section
      className="relative min-h-screen bg-black py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-12 lg:px-16 xl:px-24 overflow-hidden"
      style={{ marginTop: '-1px' }}
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 77, 0, 0.03) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 80%, rgba(255, 77, 0, 0.02) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span
            className="inline-block text-xs font-medium tracking-[0.3em] uppercase text-[#ff4d00]/70 mb-4"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Technology
          </span>
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] mb-6"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            ENGINEERED<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #ff4d00 50%, #ff8c00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              FOR SPEED
            </span>
          </h2>
          <p className="text-white/40 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Four breakthrough technologies working in harmony to deliver
            an unparalleled performance experience.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,77,0,0.08)] hover:scale-[1.02]"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255, 77, 0, 0.05) 0%, transparent 60%)',
                  }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>{feature.icon}</div>
                  <div className="text-right">
                    <div
                      className="text-3xl md:text-4xl font-black text-[#ff4d00]"
                      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                    >
                      {feature.stat}
                    </div>
                    <div className="text-[10px] tracking-[0.15em] uppercase text-white/30 mt-1">
                      {feature.statLabel}
                    </div>
                  </div>
                </div>

                <h3
                  className="text-lg md:text-xl font-bold tracking-wide mb-3"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                >
                  {feature.title}
                </h3>

                <p className="text-sm text-white/40 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className="mt-8 sm:mt-10 h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-[#ff4d00]/40 to-transparent transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
