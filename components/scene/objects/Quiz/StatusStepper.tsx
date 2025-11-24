import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function StatusStepper({
  currentQuestion,
  totalQuestions,
  answers,
  correctAnswers,
  basePosition,
  animState,
}: {
  currentQuestion: number;
  totalQuestions: number;
  answers: number[];
  correctAnswers: number[];
  basePosition: [number, number, number];
  animState: React.RefObject<{
    wallProgress: number;
    textAlpha: number;
    textZ: number;
  }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.z = basePosition[2] + animState.current.textZ;
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material;

          if (material && !Array.isArray(material)) {
            material.opacity = 0.9 * animState.current.textAlpha;
            material.transparent = true;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[basePosition[0], basePosition[1], 0]}>
      {Array.from({ length: totalQuestions }).map((_, i) => {
        let color = '#444444';
        if (i < answers.length || answers.length === totalQuestions) {
          color = answers[i] === correctAnswers[i] ? '#00ff00' : '#ff0000';
        } else if (i === currentQuestion && answers.length !== totalQuestions) {
          color = '#ffffff';
        }

        return (
          <mesh key={i} position={[i * 0.3, 0, 0]}>
            <boxGeometry args={[0.2, 0.05, 0.02]} />
            <meshBasicMaterial color={color} transparent />
          </mesh>
        );
      })}
    </group>
  );
}
