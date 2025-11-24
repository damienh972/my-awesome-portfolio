"use client";

import { useRef, useMemo, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { holographicVertexShader, holographicFragmentShader, essenceVertexShader, essenceFragmentShader } from '@/lib/shaders';
import { SeededRandom } from '@/utils/rng';
import { ORB_CONFIG } from '@/config/3d';

interface OrbProps {
  scrollRef?: RefObject<number>;
  currentSection?: number;
}

export function Orb({ scrollRef, currentSection = 0 }: OrbProps) {
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
    const rng = new SeededRandom(ORB_CONFIG.seed);
    const count = ORB_CONFIG.essence.count;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomness = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.pow(rng.next(), ORB_CONFIG.essence.distribution.radiusExponent) *
                     ORB_CONFIG.essence.distribution.maxRadius;
      const theta = rng.next() * Math.PI * 2;
      const phi = Math.acos(2 * rng.next() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      scales[i] = rng.next() * (ORB_CONFIG.essence.scale.max - ORB_CONFIG.essence.scale.min) +
                  ORB_CONFIG.essence.scale.min;

      randomness[i * 3] = (rng.next() - 0.5) * 2;
      randomness[i * 3 + 1] = (rng.next() - 0.5) * 2;
      randomness[i * 3 + 2] = (rng.next() - 0.5) * 2;

      const isGolden = rng.next() > ORB_CONFIG.essence.colors.golden.threshold;

      if (isGolden) {
        colors[i * 3] = ORB_CONFIG.essence.colors.golden.color[0];
        colors[i * 3 + 1] = ORB_CONFIG.essence.colors.golden.color[1];
        colors[i * 3 + 2] = ORB_CONFIG.essence.colors.golden.color[2];
      } else {
        colors[i * 3] = ORB_CONFIG.essence.colors.cyan.color[0];
        colors[i * 3 + 1] = ORB_CONFIG.essence.colors.cyan.color[1];
        colors[i * 3 + 2] = ORB_CONFIG.essence.colors.cyan.color[2];
      }
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
    const [finalX, finalY, finalZ] = ORB_CONFIG.animation.position.end;

    if (t === 0) return ORB_CONFIG.animation.position.start;

    const easeInOutCubic = (x: number): number =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const smoothT = easeInOutCubic(t);

    if (t <= ORB_CONFIG.animation.phases.one) {
      const phase1 = smoothT / easeInOutCubic(ORB_CONFIG.animation.phases.one);
      return [
        -1.8 * phase1,
        ORB_CONFIG.animation.position.start[1] + Math.sin(phase1 * Math.PI * 0.5) * 0.2,
        -2.0 * phase1,
      ];
    }
    if (t <= ORB_CONFIG.animation.phases.two) {
      const phase2 =
        (smoothT - easeInOutCubic(ORB_CONFIG.animation.phases.one)) /
        (easeInOutCubic(ORB_CONFIG.animation.phases.two) - easeInOutCubic(ORB_CONFIG.animation.phases.one));
      return [
        -1.8 - (finalX - -1.8) * 0.4 * phase2,
        ORB_CONFIG.animation.position.start[1] +
          Math.sin(easeInOutCubic(ORB_CONFIG.animation.phases.one) * Math.PI * 0.5) * 0.2 -
          1.5 * phase2,
        -2.0,
      ];
    }
    const phase3 =
      (smoothT - easeInOutCubic(ORB_CONFIG.animation.phases.two)) /
      (1 - easeInOutCubic(ORB_CONFIG.animation.phases.two));
    const currentX = -1.8 - (finalX - -1.8) * 0.4;
    const currentY =
      ORB_CONFIG.animation.position.start[1] +
      Math.sin(easeInOutCubic(ORB_CONFIG.animation.phases.one) * Math.PI * 0.5) * 0.2 - 1.5;
    return [
      currentX + (finalX - currentX) * phase3,
      currentY + (finalY - currentY) * phase3,
      -2.0 + (finalZ - -2.0) * phase3,
    ];
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    let calculatedProgress = 0;

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

      groupRef.current.position.lerp(new THREE.Vector3(x, y, z), ORB_CONFIG.animation.lerpSpeed);

      const easeInOut =
        calculatedProgress < 0.5
          ? 4 * calculatedProgress * calculatedProgress * calculatedProgress
          : 1 - Math.pow(-2 * calculatedProgress + 2, 3) / 2;
      const targetScale = 1 - easeInOut * ORB_CONFIG.animation.scale.reduction;

      groupRef.current.scale.lerp(
        new THREE.Vector3(
          targetScale * ORB_CONFIG.scale,
          targetScale * ORB_CONFIG.scale,
          targetScale * ORB_CONFIG.scale
        ),
        ORB_CONFIG.animation.lerpSpeed
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
      const pulse = Math.sin(time * ORB_CONFIG.lights.primary.pulseSpeed) * 0.15 + 0.85;
      innerCoreRef.current.scale.setScalar(pulse * ORB_CONFIG.innerCore.radius);
    }
    if (lightRef.current) {
      lightRef.current.intensity =
        ORB_CONFIG.lights.primary.baseIntensity +
        Math.sin(time * ORB_CONFIG.lights.primary.pulseSpeed) * ORB_CONFIG.lights.primary.pulseAmplitude;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={orbRef}>
        <sphereGeometry args={[
          ORB_CONFIG.sphere.radius,
          ORB_CONFIG.sphere.widthSegments,
          ORB_CONFIG.sphere.heightSegments
        ]} />
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
        <sphereGeometry args={[ORB_CONFIG.innerCore.radius, ORB_CONFIG.innerCore.segments, ORB_CONFIG.innerCore.segments]} />
        <meshBasicMaterial
          color={ORB_CONFIG.innerCore.color}
          transparent
          opacity={ORB_CONFIG.innerCore.opacity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        color={ORB_CONFIG.lights.primary.color}
        intensity={ORB_CONFIG.lights.primary.baseIntensity}
        distance={ORB_CONFIG.lights.primary.distance}
      />
      <pointLight
        position={[0, 0, 0]}
        color={ORB_CONFIG.lights.secondary.color}
        intensity={ORB_CONFIG.lights.secondary.intensity}
        distance={ORB_CONFIG.lights.secondary.distance}
      />
    </group>
  );
}
