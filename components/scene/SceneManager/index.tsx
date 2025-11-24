"use client";

import { useEffect, useState, useRef } from 'react';
import { Scene3D } from '../Scene3D';
import { SCENE_CONFIG } from '@/config/scene';
import { ANIMATION_CONFIG } from '@/config/animation';

interface SceneManagerProps {
  heroMousePosition: { x: number; y: number };
  heroIsHovered: boolean;
}

export function SceneManager({ heroMousePosition, heroIsHovered }: SceneManagerProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const HERO_HEIGHT = windowHeight * ANIMATION_CONFIG.scroll.hero.height;
      const BLOCKCHAIN_HEIGHT = windowHeight * ANIMATION_CONFIG.scroll.blockchain.height;
      const SCROLLABLE_HEIGHT = BLOCKCHAIN_HEIGHT - windowHeight;

      let section = 0;
      let progress = 0;

      if (scrollY < HERO_HEIGHT) {
        section = 0;
        progress = scrollY / HERO_HEIGHT;
      } else {
        section = 1;
        const relativeScroll = scrollY - HERO_HEIGHT;
        progress = relativeScroll / SCROLLABLE_HEIGHT;
        progress = Math.max(0, Math.min(1, progress));
      }

      scrollProgressRef.current = progress;

      setCurrentSection((prev) => {
        if (prev !== section && section <= 1) return section;
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (typeof window !== 'undefined') window.history.scrollRestoration = 'auto';
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ background: SCENE_CONFIG.background.hero, zIndex: -2 }}
      />
      <div
        className="fixed inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{
          background: SCENE_CONFIG.background.blockchain,
          zIndex: -1,
          opacity: currentSection === 1 ? SCENE_CONFIG.background.opacity : 0,
        }}
      />

      <div
        className="fixed inset-0 w-full h-full"
        style={{
          zIndex: currentSection === 1 ? 50 : 0,
        }}
      >
        <Scene3D
          scrollRef={scrollProgressRef}
          currentSection={currentSection}
          mousePosition={heroMousePosition}
          isParticleHovered={heroIsHovered}
        />
      </div>
    </>
  );
}
