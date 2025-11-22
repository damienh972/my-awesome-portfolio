"use client";

import { useRef, useMemo, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  holographicVertexShader,
  holographicFragmentShader,
} from "./shaders/holographic";
import { essenceVertexShader, essenceFragmentShader } from "./shaders/essence";

interface PolyhedronOrbProps {
  scale?: number;
  scrollRef?: RefObject<number>;
  currentSection?: number;
  transitionProgress?: number;
  onPositionUpdate?: (position: [number, number, number]) => void;
}

export function PolyhedronOrb({
  scale = 1,
  transitionProgress: manualProgress = 0,
  scrollRef,
  currentSection = 0,
  onPositionUpdate,
}: PolyhedronOrbProps) {
  const orbRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const hologramRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const essencePointsRef = useRef<THREE.Points>(null);

  const holographicShader = useMemo(
    () => ({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 1.0 },
        colorMix: { value: 0.0 },
      },
      vertexShader: holographicVertexShader,
      fragmentShader: holographicFragmentShader,
    }),
    []
  );

  const essenceParticles = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomness = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.pow(Math.random(), 1.5) * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      scales[i] = Math.random() * 0.5 + 0.2;

      randomness[i * 3] = (Math.random() - 0.5) * 2;
      randomness[i * 3 + 1] = (Math.random() - 0.5) * 2;
      randomness[i * 3 + 2] = (Math.random() - 0.5) * 2;

      const isGolden = Math.random() > 0.7;

      colors[i * 3] = isGolden ? 1.0 : 0.98;
      colors[i * 3 + 1] = isGolden ? 0.85 : 0.98;
      colors[i * 3 + 2] = isGolden ? 0.5 : 1.0;
    }
    return { positions, scales, randomness, colors, count };
  }, []);

  const essenceMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 1.0 } },
      vertexShader: essenceVertexShader,
      fragmentShader: essenceFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const getSinuousPosition = (progress: number): [number, number, number] => {
    const t = Math.min(1, Math.max(0, progress));
    const finalX = -3.0;
    const finalY = 1.3;
    const finalZ = 3;

    if (t === 0) return [0, 2.0, 0];

    const easeInOutCubic = (x: number): number =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const smoothT = easeInOutCubic(t);

    if (t <= 0.35) {
      const phase1 = smoothT / easeInOutCubic(0.35);
      return [
        -1.8 * phase1,
        2.0 + Math.sin(phase1 * Math.PI * 0.5) * 0.2,
        -2.0 * phase1,
      ];
    }
    if (t <= 0.55) {
      const phase2 =
        (smoothT - easeInOutCubic(0.35)) /
        (easeInOutCubic(0.55) - easeInOutCubic(0.35));
      return [
        -1.8 - (finalX - -1.8) * 0.4 * phase2,
        2.0 +
          Math.sin(easeInOutCubic(0.35) * Math.PI * 0.5) * 0.2 -
          1.5 * phase2,
        -2.0,
      ];
    }
    const phase3 =
      (smoothT - easeInOutCubic(0.55)) / (1 - easeInOutCubic(0.55));
    const currentX = -1.8 - (finalX - -1.8) * 0.4;
    const currentY =
      2.0 + Math.sin(easeInOutCubic(0.35) * Math.PI * 0.5) * 0.2 - 1.5;
    return [
      currentX + (finalX - currentX) * phase3,
      currentY + (finalY - currentY) * phase3,
      -2.0 + (finalZ - -2.0) * phase3,
    ];
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    let calculatedProgress = manualProgress;

    if (scrollRef) {
      const scrollVal = scrollRef.current || 0;

      if (currentSection === 0) {
        calculatedProgress = 0;
      } else if (currentSection === 1) {
        calculatedProgress = Math.min(1, scrollVal * 2);
      } else {
        calculatedProgress = 1;
      }
    }

    if (groupRef.current) {
      const [x, y, z] = getSinuousPosition(calculatedProgress);

      groupRef.current.position.lerp(new THREE.Vector3(x, y, z), 0.1);

      if (onPositionUpdate) onPositionUpdate([x, y, z]);

      const easeInOut =
        calculatedProgress < 0.5
          ? 4 * calculatedProgress * calculatedProgress * calculatedProgress
          : 1 - Math.pow(-2 * calculatedProgress + 2, 3) / 2;
      const targetScale = 1 - easeInOut * 0.3;

      groupRef.current.scale.lerp(
        new THREE.Vector3(
          targetScale * scale,
          targetScale * scale,
          targetScale * scale
        ),
        0.1
      );
    }

    if (hologramRef.current) {
      hologramRef.current.uniforms.time.value = time;
      hologramRef.current.uniforms.opacity.value = 1;
      hologramRef.current.uniforms.colorMix.value = Math.max(
        0,
        Math.min(1, (calculatedProgress - 0.5) / 0.5)
      );
    }
    if (
      essencePointsRef.current &&
      essencePointsRef.current.material instanceof THREE.ShaderMaterial
    ) {
      essencePointsRef.current.material.uniforms.time.value = time;
    }
    if (innerCoreRef.current) {
      const pulse = Math.sin(time * 1.5) * 0.15 + 0.85;
      innerCoreRef.current.scale.setScalar(pulse * 0.3);
    }
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(time * 1.2) * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={orbRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <shaderMaterial
          ref={hologramRef}
          {...holographicShader}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <points ref={essencePointsRef} material={essenceMaterial}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[essenceParticles.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-scale"
            args={[essenceParticles.scales, 1]}
          />
          <bufferAttribute
            attach="attributes-randomness"
            args={[essenceParticles.randomness, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[essenceParticles.colors, 3]}
          />
        </bufferGeometry>
      </points>
      <mesh ref={innerCoreRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        color="#8fb3c4"
        intensity={3}
        distance={20}
      />
      <pointLight
        position={[0, 0, 0]}
        color="#ffd700"
        intensity={1.5}
        distance={8}
      />
    </group>
  );
}
