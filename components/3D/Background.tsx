"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PolyhedronOrb } from "./PolyhedronOrb";

interface Scene3DBackgroundProps {
  scrollProgress: number;
  currentSection: number;
}

export function Background({
  scrollProgress,
  currentSection,
}: Scene3DBackgroundProps) {
  const getBackgroundGradient = () => {
    if (currentSection === 0) {
      const t = Math.min(1, scrollProgress);
      const topR = 1 + (11 - 1) * t;
      const topG = 1 + (9 - 1) * t;
      const topB = 23 + (48 - 23) * t;
      const bottomR = 11 + (31 - 11) * t;
      const bottomG = 9 + (24 - 9) * t;
      const bottomB = 48 + (70 - 48) * t;

      return `linear-gradient(to bottom, rgb(${topR}, ${topG}, ${topB}), rgb(${bottomR}, ${bottomG}, ${bottomB}))`;
    } else if (currentSection === 1) {
      return 'linear-gradient(to bottom, rgb(11, 9, 48), rgb(31, 24, 70))';
    }
    return 'linear-gradient(to bottom, rgb(1, 1, 23), rgb(11, 9, 48))';
  };

  return (
    <div className="fixed inset-0 -z-10 w-full h-full" style={{ background: getBackgroundGradient() }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene3DContent
            scrollProgress={scrollProgress}
            currentSection={currentSection}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

interface Scene3DContentProps {
  scrollProgress: number;
  currentSection: number;
}

function Scene3DContent({ scrollProgress, currentSection }: Scene3DContentProps) {
  const cameraRef = useRef<THREE.Camera>(null!);

  useFrame((state) => {
    cameraRef.current = state.camera;

    const targetPosition = getCameraPosition(scrollProgress, currentSection);
    const targetLookAt = getCameraLookAt(scrollProgress, currentSection);

    state.camera.position.lerp(
      new THREE.Vector3(...targetPosition),
      0.05
    );

    const lookAtTarget = new THREE.Vector3(...targetLookAt);
    const currentLookAt = new THREE.Vector3();
    state.camera.getWorldDirection(currentLookAt);
    currentLookAt.add(state.camera.position);
    currentLookAt.lerp(lookAtTarget, 0.05);
    state.camera.lookAt(currentLookAt);
  });

  const heroToBlockchainProgress = Math.max(0, Math.min(1, scrollProgress));

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#00d9ff" />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} color="#b026ff" />

      <fog attach="fog" args={["#000000", 10, 50]} />

      {(currentSection === 0 || currentSection === 1) && (
        <PolyhedronOrb
          scale={1.2}
          transitionProgress={currentSection === 0 ? heroToBlockchainProgress : 1}
        />
      )}

      {/* <GridBackground opacity={0.1} /> */}
    </>
  );
}

function getCameraPosition(
  progress: number,
  section: number
): [number, number, number] {
  switch (section) {
    case 0:
      return [0, 0, 8];
    case 1:
      return [
        progress * 3,
        progress * -1,
        8 - progress * 3,
      ];
    default:
      return [0, 0, 8];
  }
}

function getCameraLookAt(
  progress: number,
  section: number
): [number, number, number] {
  switch (section) {
    case 0:
      return [0, 0, 0];
    case 1:
      return [0, -progress * 2, 0];
    default:
      return [0, 0, 0];
  }
}
