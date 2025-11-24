import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { QUIZ_CONFIG } from '@/config/3d';

type TroikaText = THREE.Mesh & {
  fillOpacity: number;
  text: string;
  fontSize: number;
};

export function AnimatedText({
  text,
  basePosition,
  fontSize,
  color,
  animState,
  isHovered,
}: {
  text: string;
  basePosition: [number, number, number];
  fontSize: number;
  color: string;
  animState: React.RefObject<{
    wallProgress: number;
    textAlpha: number;
    textZ: number;
  }>;
  isHovered: boolean;
}) {
  const textRef = useRef<TroikaText>(null);
  const targetScale = isHovered ? 1.05 : 1.0;

  useFrame((_, delta) => {
    if (textRef.current) {
      const opacity = animState.current.textAlpha;
      textRef.current.visible = opacity > 0.01;
      textRef.current.fillOpacity = opacity;
      textRef.current.position.z = basePosition[2] + animState.current.textZ;

      const currentScale = textRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 10);
      textRef.current.scale.setScalar(nextScale);
    }
  });
  return (
    <Text
      ref={textRef}
      position={[basePosition[0], basePosition[1], 0]}
      fontSize={fontSize}
      font={QUIZ_CONFIG.text.fontUrl}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={QUIZ_CONFIG.text.maxWidth}
      textAlign="center"
      fillOpacity={0}
    >
      {text}
    </Text>
  );
}
