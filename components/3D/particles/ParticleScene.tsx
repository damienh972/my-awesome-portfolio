"use client";

import { Canvas } from "@react-three/fiber";
import { TextParticles } from "./TextParticles";
import { Suspense } from "react";

interface ParticleSceneProps {
  mousePosition: { x: number; y: number };
  isHovered: boolean;
}

export function ParticleScene({
  mousePosition,
  isHovered,
}: ParticleSceneProps) {
  const getCameraSettings = () => {
    if (typeof window === "undefined")
      return { position: [0, 0, 8] as [number, number, number], fov: 75 };

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
      style={{ width: "100%", height: "100%", display: "block" }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      <Suspense fallback={null}>
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
