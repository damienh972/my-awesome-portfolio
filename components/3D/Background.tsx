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

function CameraController({ scrollRef, currentSection, cursor }: { scrollRef: RefObject<number>, currentSection: number, cursor: RefObject<CursorPosition> }) {
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

function DynamicAmbient({ currentSection }: { currentSection: number }) {
  const lightRef = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    if (lightRef.current) {
      const target = currentSection === 1 ? 1.5 : 0.3;
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, target, 0.05);
    }
  });
  return <ambientLight ref={lightRef} intensity={0.3} />;
}

function BlockchainLights({ currentSection }: { currentSection: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const targetIntensity = currentSection === 1 ? 8 : 0;
    groupRef.current.children.forEach((light) => {
      if (light instanceof THREE.PointLight) {
        light.intensity = THREE.MathUtils.lerp(light.intensity, targetIntensity, 0.05);
      }
    });
  });
  return (
    <group ref={groupRef}>
      <pointLight position={[-10, 0, -5]} color="#d8b4fe" distance={50} decay={2} intensity={0} />
      <pointLight position={[10, 5, -5]} color="#67e8f9" distance={50} decay={2} intensity={0} />
      <pointLight position={[0, -10, -5]} color="#6366f1" distance={50} decay={2} intensity={0} />
    </group>
  );
}

export function Background({ scrollRef, currentSection }: BackgroundProps) {

  const heroGradient = 'radial-gradient(circle at 50% 50%, rgb(10, 12, 20) 0%, rgb(0, 0, 0) 100%)';
  const blockchainGradient = 'radial-gradient(circle at 50% 50%, #200a49ff 0%, #0f172a 100%)';

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
    <>
      <div
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ background: heroGradient, zIndex: -2 }}
      />
      <div
        className="fixed inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{
          background: blockchainGradient,
          zIndex: -1,
          opacity: currentSection === 1 ? 0.8 : 0
        }}
      />

      <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <Canvas
          camera={{ position: [0, 0, 12], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <Suspense fallback={null}>

            <DynamicAmbient currentSection={currentSection} />
            <directionalLight position={[5, 5, 5]} intensity={0.5} color="#00d9ff" />
            <BlockchainLights currentSection={currentSection} />

            <StaticStars />

            <fog attach="fog" args={[currentSection === 1 ? "#2e1065" : "#000000", 10, 60]} />

            <CameraController scrollRef={scrollRef} currentSection={currentSection} cursor={cursor} />
            <PolyhedronOrb scale={1.2} scrollRef={scrollRef} currentSection={currentSection} />
            <BlockchainBackground scrollRef={scrollRef} currentSection={currentSection} />
            <QuizPanel3D position={[3.5, 0, -2]} scrollRef={scrollRef} currentSection={currentSection} />

            <Preload all />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}