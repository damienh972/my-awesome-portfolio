"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useEffect, RefObject } from 'react';
import { Preload, Environment } from '@react-three/drei';
import { SCENE_CONFIG } from '@/config/scene';
import { CameraController } from './CameraController';
import { DynamicLighting } from './DynamicLighting';
import { Orb } from '../objects/Orb';
import { ParticleLayer } from '../layers/ParticleLayer';
import { Text3D } from '../layers/Text3D';
import { BlockchainNetwork } from '../objects/BlockchainNetwork';
import { Quiz } from '../objects/Quiz';
import { useResponsive } from '@/hooks';

interface Scene3DProps {
  scrollRef: RefObject<number>;
  currentSection: number;
  mousePosition: { x: number; y: number };
  isParticleHovered: boolean;
}

export function Scene3D({ scrollRef, currentSection, mousePosition, isParticleHovered }: Scene3DProps) {
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { isMobile } = useResponsive();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      cursorRef.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Canvas
      camera={{
        position: SCENE_CONFIG.camera.hero.position,
        fov: SCENE_CONFIG.camera.hero.fov
      }}
      dpr={SCENE_CONFIG.performance.dpr}
      gl={{
        antialias: SCENE_CONFIG.performance.antialias,
        alpha: true,
        powerPreference: SCENE_CONFIG.performance.powerPreference,
        stencil: false,
        depth: true,
      }}
      style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
    >
      <Suspense fallback={null}>
        <Environment preset="night" />
        <DynamicLighting currentSection={currentSection} />

        <fog
          attach="fog"
          args={[
            currentSection === 1
              ? SCENE_CONFIG.fog.blockchain.color
              : SCENE_CONFIG.fog.hero.color,
            SCENE_CONFIG.fog.hero.near,
            SCENE_CONFIG.fog.hero.far,
          ]}
        />

        <CameraController
          scrollRef={scrollRef}
          currentSection={currentSection}
          cursor={cursorRef}
        />

        <Orb scrollRef={scrollRef} currentSection={currentSection} />

        <BlockchainNetwork scrollRef={scrollRef} currentSection={currentSection} />

        {isMobile ? (
          <Text3D
            mousePosition={mousePosition}
            visible={currentSection === 0}
          />
        ) : (
          <ParticleLayer
            mousePosition={mousePosition}
            isHovered={isParticleHovered}
            visible={currentSection === 0}
          />
        )}

        <Suspense fallback={null}>
          <Quiz scrollRef={scrollRef} currentSection={currentSection} />
        </Suspense>

        <Preload all />
      </Suspense>
    </Canvas>
  );
}
