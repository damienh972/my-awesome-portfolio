"use client";

import { Canvas } from "@react-three/fiber";
import { TextParticles } from "./TextParticles";
import { Suspense } from "react";

interface ParticleSceneProps {
  mousePosition: { x: number; y: number };
  isHovered: boolean;
}

export function ParticleScene({ mousePosition, isHovered }: ParticleSceneProps) {

  const getCameraSettings = () => {
    if (typeof window === 'undefined') return { position: [0, 0, 8] as [number, number, number], fov: 75 };

    const width = window.innerWidth;
    
    if (width < 640) {
      // Mobile
      return { position: [0, 0, 12] as [number, number, number], fov: 75 };
    } else if (width < 1024) {
      // Tablet
      return { position: [0, 0, 10] as [number, number, number], fov: 75 };
    }
    // Desktop
    return { position: [0, 0, 8] as [number, number, number], fov: 75 };
  };

  const cameraSettings = getCameraSettings();

  return (
    <Canvas
      camera={cameraSettings}
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#00d9ff" />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#b026ff" />
        <pointLight
          position={[
            (mousePosition.x - 0.5) * 10,
            -(mousePosition.y - 0.5) * 10,
            5,
          ]}
          intensity={isHovered ? 2 : 0.5}
          color="#00d9ff"
          distance={10}
        />
        <TextParticles
          text="Damien Heloise"
          font="Michroma"
          mousePosition={mousePosition}
          isHovered={isHovered}
          mouseRadius={0.4}
        />
      </Suspense>
    </Canvas>
  );
}