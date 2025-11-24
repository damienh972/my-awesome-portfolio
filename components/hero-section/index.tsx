"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useTransform, useScroll } from 'framer-motion';
import { ANIMATION_CONFIG } from '@/config/animation';

interface HeroSectionProps {
  onMousePositionChange: (position: { x: number; y: number }) => void;
  onHoverChange: (isHovered: boolean) => void;
}

export function HeroSection({ onMousePositionChange, onHoverChange }: HeroSectionProps) {
  const [shouldDisablePointer, setShouldDisablePointer] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const contentOpacity = useTransform(
    scrollYProgress,
    ANIMATION_CONFIG.framerMotion.contentOpacity.scrollRange,
    ANIMATION_CONFIG.framerMotion.contentOpacity.opacityRange
  );

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (value) => {
      setShouldDisablePointer(value > ANIMATION_CONFIG.transitions.pointerDisableThreshold);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  useEffect(() => {
    const checkInitialHover = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          onHoverChange(true);
          onMousePositionChange({
            x: (x - rect.left) / rect.width,
            y: (y - rect.top) / rect.height,
          });
        }
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousemove', checkInitialHover, { once: true });
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', checkInitialHover);
    };
  }, [onHoverChange, onMousePositionChange]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onMousePositionChange({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    },
    [onMousePositionChange]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        onMousePositionChange({
          x: (touch.clientX - rect.left) / rect.width,
          y: (touch.clientY - rect.top) / rect.height,
        });
      }
    },
    [onMousePositionChange]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      onHoverChange(true);
      handleTouchMove(e);
    },
    [onHoverChange, handleTouchMove]
  );

  const handleTouchEnd = useCallback(() => {
    onHoverChange(false);
  }, [onHoverChange]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col w-full"
      style={{ height: '200vh', zIndex: 1 }}
    >
      <motion.div
        className="fixed inset-0 w-full h-screen"
        style={{
          opacity: contentOpacity,
          zIndex: shouldDisablePointer ? -1 : 1,
          pointerEvents: shouldDisablePointer ? 'none' : 'auto',
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className="absolute inset-x-0 left-1/2 flex items-start justify-center pointer-events-none z-10"
          style={{ top: '50%', marginTop: '2em' }}
        >
          <div className="w-full max-w-7xl px-4 md:px-6 lg:px-8 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: ANIMATION_CONFIG.framerMotion.hero.subtitle.delay,
                duration: ANIMATION_CONFIG.framerMotion.hero.subtitle.duration,
              }}
              className="text-gray-400"
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '0.875em',
                fontWeight: 200,
              }}
            >
              Innovative Software Architect — Liferay, AI & Blockchain Expert
            </motion.p>
          </div>
        </div>
        <div
          className="absolute inset-x-0 flex items-end justify-center pb-8 md:pb-12 lg:pb-16 pointer-events-none z-10"
          style={{ bottom: '4em', left: 0, right: 0 }}
        >
          <div className="w-full max-w-7xl px-4 md:px-6 lg:px-8 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: ANIMATION_CONFIG.framerMotion.hero.description.delay,
                duration: ANIMATION_CONFIG.framerMotion.hero.description.duration,
              }}
              className="text-gray-300 leading-relaxed"
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '2em',
                fontWeight: 200,
                marginBottom: '0.75em',
              }}
            >
              Building{' '}
              <span className="text-gradient-animated font-semibold">blockchain</span> &{' '}
              <span className="text-gradient-animated font-semibold">AI systems</span> that
              shape the future
            </motion.p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
