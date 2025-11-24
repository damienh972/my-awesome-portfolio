import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE_CONFIG } from '@/config/scene';

interface DynamicLightingProps {
  currentSection: number;
}

export function DynamicLighting({ currentSection }: DynamicLightingProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ambientRef.current) {
      const target =
        currentSection === 1
          ? SCENE_CONFIG.lights.ambient.blockchain
          : SCENE_CONFIG.lights.ambient.hero;
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        target,
        0.05
      );
    }

    if (groupRef.current) {
      const targetIntensity = currentSection === 1 ? SCENE_CONFIG.lights.blockchain.intensity : 0;
      groupRef.current.children.forEach((light) => {
        if (light instanceof THREE.PointLight) {
          light.intensity = THREE.MathUtils.lerp(light.intensity, targetIntensity, 0.05);
        }
      });
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={SCENE_CONFIG.lights.ambient.hero} />
      <directionalLight
        position={SCENE_CONFIG.lights.directional.position}
        intensity={SCENE_CONFIG.lights.directional.intensity}
        color={SCENE_CONFIG.lights.directional.color}
      />
      <group ref={groupRef}>
        {SCENE_CONFIG.lights.blockchain.positions.map((position, i) => (
          <pointLight
            key={i}
            position={position}
            color={SCENE_CONFIG.lights.blockchain.colors[i]}
            distance={SCENE_CONFIG.lights.blockchain.distance}
            decay={SCENE_CONFIG.lights.blockchain.decay}
            intensity={0}
          />
        ))}
      </group>
    </>
  );
}
