"use client";

import { useRef, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLES_CONFIG } from '@/config/3d';

interface Text3DProps {
  mousePosition: { x: number; y: number };
  visible: boolean;
}

export function Text3D({ mousePosition, visible }: Text3DProps) {
  const textRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  const gradientMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 colorLeft = vec3(0.0, 0.85, 1.0);
          vec3 colorRight = vec3(0.3, 0.2, 0.7);

          vec3 baseColor = mix(colorLeft, colorRight, vUv.x);

          float rimPower = 2.5;
          float rimIntensity = pow(1.0 - abs(vNormal.z), rimPower);
          vec3 rimColor = vec3(0.4, 0.6, 1.0);

          float pulse = sin(time * 2.0) * 0.5 + 0.5;
          float glow = pulse * 0.3 + 0.7;

          vec3 finalColor = baseColor * glow + rimColor * rimIntensity * 0.5;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: false,
    });
  }, []);

  useFrame((state) => {
    if (!textRef.current || !visible) return;

    const offsetX = (mousePosition.x - 0.5) * 0.1;
    const offsetY = (mousePosition.y - 0.5) * 0.1;

    targetRotation.current.x = -offsetY;
    targetRotation.current.y = offsetX;

    textRef.current.rotation.x += (targetRotation.current.x - textRef.current.rotation.x) * 0.1;
    textRef.current.rotation.y += (targetRotation.current.y - textRef.current.rotation.y) * 0.1;

    if (gradientMaterial.uniforms.time) {
      gradientMaterial.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  if (!visible) return null;

  return (
    <Text
      ref={textRef}
      position={[0, 0, 0]}
      fontSize={0.45}
      font={`/fonts/michroma/Michroma-Regular.ttf`}
      anchorX="center"
      anchorY="middle"
      material={gradientMaterial}
    >
      {PARTICLES_CONFIG.text}
    </Text>
  );
}
