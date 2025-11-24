"use client";

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeededRandom } from '@/utils/rng';
import { PARTICLES_CONFIG } from '@/config/3d';
import { useResponsive } from '@/hooks';

interface ParticleLayerProps {
  mousePosition: { x: number; y: number };
  isHovered: boolean;
  visible: boolean;
}

export function ParticleLayer({ mousePosition, isHovered, visible }: ParticleLayerProps) {
  const meshRef = useRef<THREE.Points>(null);
  const { deviceType } = useResponsive();
  const [fontLoaded, setFontLoaded] = useState(() => {
    if (typeof window === 'undefined' || !document.fonts) {
      return true;
    }
    return false;
  });

  const particlesData = useRef<{
    positions: Float32Array;
    targetPositions: Float32Array;
    velocities: Float32Array;
    dispersedTimes: Float32Array;
  } | null>(null);

  const rng = useMemo(() => new SeededRandom(PARTICLES_CONFIG.seed), []);

  useEffect(() => {
    if (typeof window === 'undefined' || !document.fonts) {
      return;
    }

    document.fonts
      .load(`400 100px ${PARTICLES_CONFIG.font}`)
      .then(() => setFontLoaded(true))
      .catch(() => setFontLoaded(true));
  }, []);

  const { positions, colors, targetPositions, velocities, dispersedTimes, count } = useMemo(() => {
    if (typeof window === 'undefined' || !fontLoaded) {
      return {
        positions: new Float32Array(0),
        targetPositions: new Float32Array(0),
        velocities: new Float32Array(0),
        dispersedTimes: new Float32Array(0),
        colors: new Float32Array(0),
        count: 0,
      };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const config = PARTICLES_CONFIG.canvas[deviceType];
    canvas.width = config.width;
    canvas.height = config.height;

    ctx.fillStyle = 'white';
    ctx.font = `${config.fontSize}px ${PARTICLES_CONFIG.font}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PARTICLES_CONFIG.text, canvas.width / 2, canvas.height / 2);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const sampledPos: number[] = [];
    const sampledColors: number[] = [];

    for (let y = 0; y < canvas.height; y += config.sampling) {
      for (let x = 0; x < canvas.width; x += config.sampling) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] > PARTICLES_CONFIG.mouse.threshold) {
          const x3 = (x - canvas.width / 2) / config.scale;
          const y3 = -(y - canvas.height / 2) / config.scale;

          sampledPos.push(x3, y3, 0);

          const p = x / canvas.width;
          sampledColors.push(
            p * 1.0 + (1 - p) * 0.0,
            p * 0.15 + (1 - p) * 0.85,
            1.0
          );
        }
      }
    }

    const count = sampledPos.length / 3;
    const targetPositions = new Float32Array(sampledPos);
    const velocities = new Float32Array(count * 3);
    const dispersedTimes = new Float32Array(count);

    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (rng.next() - 0.5) * PARTICLES_CONFIG.initial.distribution;
      positions[i3 + 1] = (rng.next() - 0.5) * PARTICLES_CONFIG.initial.distribution;
      positions[i3 + 2] = (rng.next() - 0.5) * PARTICLES_CONFIG.initial.distribution;
      dispersedTimes[i] = -1;
    }

    return {
      positions,
      targetPositions,
      velocities,
      dispersedTimes,
      colors: new Float32Array(sampledColors),
      count,
    };
  }, [fontLoaded, deviceType, rng]);

  useEffect(() => {
    particlesData.current = {
      positions,
      targetPositions,
      velocities,
      dispersedTimes,
    };
  }, [positions, targetPositions, velocities, dispersedTimes]);

  useFrame((state) => {
    if (!meshRef.current || !particlesData.current || count === 0 || !visible) return;

    const { positions, targetPositions, velocities, dispersedTimes } = particlesData.current;
    const time = state.clock.getElapsedTime();

    const mouse3D = new THREE.Vector3(
      (mousePosition.x - 0.5) * 2,
      -(mousePosition.y - 0.5) * 2,
      0.5
    );

    mouse3D.unproject(state.camera);

    const cameraPos = state.camera.position;
    const direction = mouse3D.sub(cameraPos).normalize();
    const distance = -cameraPos.z / direction.z;
    const mouseWorldPos = cameraPos.clone().add(direction.multiplyScalar(distance));

    const mouseX = mouseWorldPos.x;
    const mouseY = mouseWorldPos.y;
    const mouseZ = 0;

    const dispersionRadius = PARTICLES_CONFIG.mouse.defaultRadius;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      const dx = x - mouseX;
      const dy = y - mouseY;
      const dz = z - mouseZ;
      const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (isHovered && distToMouse < dispersionRadius) {
        if (dispersedTimes[i] < 0) {
          const angle = rng.next() * Math.PI * 2;
          const force = PARTICLES_CONFIG.physics.dispersion.force.min +
                       rng.next() * (PARTICLES_CONFIG.physics.dispersion.force.max - PARTICLES_CONFIG.physics.dispersion.force.min);

          velocities[i3] = Math.cos(angle) * force;
          velocities[i3 + 1] = Math.sin(angle) * force;
          velocities[i3 + 2] = (rng.next() - 0.5) * force * PARTICLES_CONFIG.physics.dispersion.zFactor;

          dispersedTimes[i] = time;
        } else {
          const pushForce = (1 - distToMouse / dispersionRadius) * PARTICLES_CONFIG.physics.repulsion;
          velocities[i3] += (dx / distToMouse) * pushForce;
          velocities[i3 + 1] += (dy / distToMouse) * pushForce;
        }
      } else if (dispersedTimes[i] >= 0) {
        const timeSinceDispersion = time - dispersedTimes[i];

        if (!isHovered || distToMouse >= dispersionRadius) {
          const returnStrength = Math.min(
            timeSinceDispersion * PARTICLES_CONFIG.physics.returnStrength.min,
            PARTICLES_CONFIG.physics.returnStrength.max
          );

          velocities[i3] += (tx - x) * returnStrength;
          velocities[i3 + 1] += (ty - y) * returnStrength;
          velocities[i3 + 2] += (tz - z) * returnStrength;

          const distToTarget = Math.sqrt(
            (tx - x) * (tx - x) + (ty - y) * (ty - y) + (tz - z) * (tz - z)
          );

          if (distToTarget < 0.01) {
            dispersedTimes[i] = -1;
            velocities[i3] = 0;
            velocities[i3 + 1] = 0;
            velocities[i3 + 2] = 0;
          }
        }
      } else {
        velocities[i3] += (tx - x) * PARTICLES_CONFIG.physics.springForce;
        velocities[i3 + 1] += (ty - y) * PARTICLES_CONFIG.physics.springForce;
        velocities[i3 + 2] += (tz - z) * PARTICLES_CONFIG.physics.springForce;
      }

      velocities[i3] *= PARTICLES_CONFIG.physics.friction;
      velocities[i3 + 1] *= PARTICLES_CONFIG.physics.friction;
      velocities[i3 + 2] *= PARTICLES_CONFIG.physics.friction;

      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <points ref={meshRef} visible={visible}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={deviceType === 'mobile' ? PARTICLES_CONFIG.visual.size.mobile : PARTICLES_CONFIG.visual.size.desktop}
        vertexColors
        transparent
        opacity={PARTICLES_CONFIG.visual.opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
