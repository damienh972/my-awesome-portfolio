import { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANIMATION_CONFIG, SCENE_CONFIG } from '@/config';

interface CameraControllerProps {
  scrollRef: RefObject<number>;
  currentSection: number;
  cursor: RefObject<{ x: number; y: number }>;
}

export function CameraController({ scrollRef, currentSection, cursor }: CameraControllerProps) {
  useFrame((state, delta) => {
    const scrollProgress = scrollRef.current || 0;
    const mouseX = cursor.current?.x || 0;
    const mouseY = cursor.current?.y || 0;
    const parallaxX = mouseX * ANIMATION_CONFIG.camera.parallaxStrength;
    const parallaxY = mouseY * ANIMATION_CONFIG.camera.parallaxStrength;

    let targetZ = SCENE_CONFIG.camera.hero.position[2];
    let targetLookAtY = 0;

    if (currentSection === 1) {
      const t = Math.min(1, scrollProgress * 2);
      if (t < 0.5) {
        const p = t / 0.5;
        targetZ = THREE.MathUtils.lerp(
          SCENE_CONFIG.camera.hero.position[2],
          SCENE_CONFIG.camera.blockchain.near.position[2],
          p
        );
      } else {
        const p = (t - 0.5) / 0.5;
        const smoothP = p * p * (3 - 2 * p);
        targetZ = THREE.MathUtils.lerp(
          SCENE_CONFIG.camera.blockchain.near.position[2],
          SCENE_CONFIG.camera.blockchain.far.position[2],
          smoothP
        );
        targetLookAtY = Math.sin(p * Math.PI) * -2;
      }
    }

    state.camera.position.x +=
      (parallaxX - state.camera.position.x) * ANIMATION_CONFIG.camera.pointerInfluence * delta;
    state.camera.position.y +=
      (parallaxY - state.camera.position.y) * ANIMATION_CONFIG.camera.pointerInfluence * delta;
    state.camera.position.z = THREE.MathUtils.lerp(
      state.camera.position.z,
      targetZ,
      ANIMATION_CONFIG.camera.lerpSpeed
    );
    state.camera.lookAt(0, targetLookAtY, 0);
  });

  return null;
}
