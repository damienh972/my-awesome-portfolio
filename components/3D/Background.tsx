"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, RefObject, useEffect } from "react";
import * as THREE from "three";
import { Preload, Points, PointMaterial } from "@react-three/drei";
import { PolyhedronOrb } from "./PolyhedronOrb";
import { BlockchainBackground } from "./BlockchainBackground";
import { QuizPanel3D } from "./QuizPanel3D";

interface BackgroundProps {
  scrollRef: RefObject<number>;
  currentSection: number;
}

interface CursorPosition {
  x: number;
  y: number;
}

function StaticStars() {
  const ref = useRef<THREE.Points>(null);
  const sphere = useMemo(() => {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return positions;
  }, []);
  return <group rotation={[0, 0, Math.PI / 4]}><Points ref={ref} positions={sphere} stride={3} frustumCulled={false}><PointMaterial transparent color="#446688" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.3} /></Points></group>;
}

function CameraController({
  scrollRef,
  currentSection,
  cursor
}: {
  scrollRef: RefObject<number>,
  currentSection: number,
  cursor: RefObject<CursorPosition>
}) {

  useFrame((state, delta) => {
    const scrollProgress = scrollRef.current || 0;

    const mouseX = cursor.current?.x || 0;
    const mouseY = cursor.current?.y || 0;

    const parallaxX = mouseX * 0.5;
    const parallaxY = mouseY * 0.5;

    let targetZ = 12;
    let targetLookAtY = 0;

    if (currentSection === 1) {
      const t = Math.min(1, scrollProgress * 2);
      if (t < 0.5) {
        const p = t / 0.5;
        targetZ = THREE.MathUtils.lerp(12, 8, p);
      } else {
        const p = (t - 0.5) / 0.5;
        const smoothP = p * p * (3 - 2 * p);
        targetZ = THREE.MathUtils.lerp(8, 6, smoothP);
        targetLookAtY = Math.sin(p * Math.PI) * -2;
      }
    }

    state.camera.position.x += (parallaxX - state.camera.position.x) * 5 * delta;
    state.camera.position.y += (parallaxY - state.camera.position.y) * 5 * delta;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.1);

    state.camera.lookAt(0, targetLookAtY, 0);
  });

  return null;
}

export function Background({ scrollRef, currentSection }: BackgroundProps) {
  const bgGradient = 'radial-gradient(circle at 50% 50%, rgb(15, 18, 30) 0%, rgb(0, 0, 5) 100%)';

  const cursor = useRef<CursorPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      cursor.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ background: bgGradient, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} color="#00d9ff" />
          <StaticStars />
          <fog attach="fog" args={["#02020a", 10, 60]} />

          <CameraController
            scrollRef={scrollRef}
            currentSection={currentSection}
            cursor={cursor}
          />

          <PolyhedronOrb
            scale={1.2}
            scrollRef={scrollRef}
            currentSection={currentSection}
          />

          <BlockchainBackground scrollRef={scrollRef} currentSection={currentSection} />
          <QuizPanel3D position={[3.5, 0, -2]} scrollRef={scrollRef} currentSection={currentSection} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}