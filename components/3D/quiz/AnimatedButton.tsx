import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

export function AnimatedButton({
  basePosition,
  args,
  baseColor,
  baseShaderConfig,
  animState,
  onClick,
  onOver,
  onOut,
  emissive,
  isHovered,
}: {
  basePosition: [number, number, number];
  args: [number, number, number];
  baseColor: { normal: THREE.Color; hover: THREE.Color };
  baseShaderConfig: {
    uniforms: { [uniform: string]: THREE.IUniform<any> };
    vertexShader: string;
    fragmentShader: string;
  } | null;
  animState: React.RefObject<{
    textAlpha: number;
    textZ: number;
  }>;
  onClick?: () => void;
  onOver?: () => void;
  onOut?: () => void;
  emissive?: boolean;
  isHovered: boolean;
}) {
  const meshRef = useRef<any>(null);
  const matRef = useRef<any>(null);

  // Uniforms
  const uniforms = useMemo(() => {
    if (!baseShaderConfig) return null;
    const u = THREE.UniformsUtils.clone(baseShaderConfig.uniforms);
    u.baseColor.value = new THREE.Color(baseColor.normal);
    return u;
  }, [baseShaderConfig]);

  const targetColor = isHovered ? baseColor.hover : baseColor.normal;
  const targetHoverState = isHovered ? 1.0 : 0.0;
  const targetScale = isHovered ? 1.05 : 1.0;

  useFrame((state, delta) => {
    const opacity = animState.current.textAlpha;

    if (meshRef.current) {
      meshRef.current.visible = opacity > 0.01;
      meshRef.current.position.z = basePosition[2] + animState.current.textZ;

      const currentScale = meshRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(
        currentScale,
        targetScale,
        delta * 10
      );
      meshRef.current.scale.set(nextScale, nextScale, 1);
    }

    if (matRef.current) {
      if (uniforms) {
        matRef.current.uniforms.time.value = state.clock.getElapsedTime();

        const hoverBoost = isHovered ? 1.5 : 1.0;
        matRef.current.uniforms.opacity.value = 0.9 * opacity * hoverBoost;

        matRef.current.uniforms.baseColor.value.lerp(targetColor, delta * 10);

        matRef.current.uniforms.hoverState.value = THREE.MathUtils.lerp(
          matRef.current.uniforms.hoverState.value,
          targetHoverState,
          delta * 5
        );
      } else {
        matRef.current.opacity = opacity;
      }
    }
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={args}
      radius={0.02}
      smoothness={8}
      position={[basePosition[0], basePosition[1], 0]}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      {baseShaderConfig ? (
        <shaderMaterial
          ref={matRef}
          vertexShader={baseShaderConfig.vertexShader}
          fragmentShader={baseShaderConfig.fragmentShader}
          uniforms={uniforms!}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ) : (
        <meshStandardMaterial
          ref={matRef}
          color={baseColor.normal}
          transparent
          opacity={0}
          emissive={emissive ? baseColor.normal : undefined}
          emissiveIntensity={0.5}
        />
      )}
    </RoundedBox>
  );
}
