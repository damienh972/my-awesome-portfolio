"use client";

import { useState } from 'react';
import { HeroSection } from '@/components/hero-section';
import { SceneManager } from '@/components/scene/SceneManager';

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <main className="min-h-screen">
      <SceneManager heroMousePosition={mousePosition} heroIsHovered={isHovered} />
      <HeroSection
        onMousePositionChange={setMousePosition}
        onHoverChange={setIsHovered}
      />
      <section
        className="relative"
        style={{ height: '400vh', zIndex: 2 }}
      >
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden pointer-events-none">
        </div>
      </section>
    </main>
  );
}
