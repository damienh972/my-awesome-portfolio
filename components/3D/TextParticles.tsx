"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TextParticlesProps {
  text: string;
  font?: string;
  mousePosition: { x: number; y: number };
  isHovered: boolean;
  mouseRadius?: number;
}

export function TextParticles({ text, font="Arial", mousePosition, isHovered, mouseRadius = 0.4 }: TextParticlesProps) {
  const mesh = useRef<THREE.Points>(null!);
  const particlesData = useRef<{
    positions: Float32Array;
    targetPositions: Float32Array;
    velocities: Float32Array;
    dispersedTimes: Float32Array; // -1 = never dispersed, else time of dispersion
  } | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Load Michroma font
  useEffect(() => {
    if (typeof window !== "undefined" && document.fonts) {
      document.fonts.load(`400 100px ${font}`).then(() => {
        setFontLoaded(true);
      }).catch(() => {
        setFontLoaded(true);
      });
    } else {
      setFontLoaded(true);
    }
  }, []);

  /**
   * Generate particles ONCE per text
   */
  const { positions, colors, targetPositions, velocities, dispersedTimes, count } = useMemo(() => {
    if (typeof window === "undefined" || !fontLoaded) {
      return {
        positions: new Float32Array(0),
        targetPositions: new Float32Array(0),
        velocities: new Float32Array(0),
        dispersedTimes: new Float32Array(0),
        colors: new Float32Array(0),
        count: 0,
      };
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 640;
    const isTablet = screenWidth >= 640 && screenWidth < 1024;

    canvas.width = isMobile ? 800 : isTablet ? 1000 : 1200;
    canvas.height = isMobile ? 200 : isTablet ? 250 : 300;

    const fontSize = isMobile ? 60 : isTablet ? 80 : 100;
    ctx.fillStyle = "white";

    ctx.font = `${fontSize}px ${font}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const sampledPos: number[] = [];
    const sampledColors: number[] = [];

    const sampling = isMobile ? 4 : 3; // Moins de particules sur mobile pour la performance
    const scale = isMobile ? 100 : isTablet ? 90 : 80; // Échelle adaptative

    for (let y = 0; y < canvas.height; y += sampling) {
      for (let x = 0; x < canvas.width; x += sampling) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] > 128) {
          const x3 = (x - canvas.width / 2) / scale;
          const y3 = -(y - canvas.height / 2) / scale;

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
    const dispersedTimes = new Float32Array(count); // Track dispersion time

    // Random starting positions
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 40;
      positions[i3 + 1] = (Math.random() - 0.5) * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;

      dispersedTimes[i] = -1; // -1 = never dispersed
    }

    return {
      positions,
      targetPositions,
      velocities,
      dispersedTimes,
      colors: new Float32Array(sampledColors),
      count,
    };
  }, [text, fontLoaded]);

  /**
   * Store particles data in ref for access in useFrame
   */
  useEffect(() => {
    particlesData.current = {
      positions,
      targetPositions,
      velocities,
      dispersedTimes,
    };
  }, [positions, targetPositions, velocities, dispersedTimes]);

  /**
   * Animation loop
   */
  useFrame((state) => {
    if (!mesh.current || !particlesData.current || count === 0) return;

    const { positions, targetPositions, velocities, dispersedTimes } = particlesData.current;
    const time = state.clock.getElapsedTime();

    // 3D compute mouse position
    const mouse3D = new THREE.Vector3(
      (mousePosition.x - 0.5) * 2, 
      -(mousePosition.y - 0.5) * 2,
      0.5 // Z fixed
    );

    // Convert to NDC space
    mouse3D.unproject(state.camera);

    // Calculate direction from camera to mouse in 3D space
    const cameraPos = state.camera.position;
    const direction = mouse3D.sub(cameraPos).normalize();
    const distance = -cameraPos.z / direction.z;
    const mouseWorldPos = cameraPos.clone().add(direction.multiplyScalar(distance));

    const mouseX = mouseWorldPos.x;
    const mouseY = mouseWorldPos.y;
    const mouseZ = 0;

    // Radius of influence
    const dispersionRadius = mouseRadius;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      // Distance to mouse
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dz = z - mouseZ;
      const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Instantaneous dispersion when hovered
      if (isHovered && distToMouse < dispersionRadius) {
        if (dispersedTimes[i] < 0) {
          // First time dispersion
          const angle = Math.random() * Math.PI * 2;
          const force = 0.3 + Math.random() * 0.2;

          velocities[i3] = Math.cos(angle) * force;
          velocities[i3 + 1] = Math.sin(angle) * force;
          velocities[i3 + 2] = (Math.random() - 0.5) * force * 0.5;

          dispersedTimes[i] = time;
        } else {
          // Already dispersed, apply repulsion force
          const pushForce = (1 - distToMouse / dispersionRadius) * 0.1;
          velocities[i3] += (dx / distToMouse) * pushForce;
          velocities[i3 + 1] += (dy / distToMouse) * pushForce;
        }
      }
      // Return to target position
      else if (dispersedTimes[i] >= 0) {
        const timeSinceDispersion = time - dispersedTimes[i];

        if (!isHovered || distToMouse >= dispersionRadius) {

          const returnStrength = Math.min(timeSinceDispersion * 0.01, 0.02);

          velocities[i3] += (tx - x) * returnStrength;
          velocities[i3 + 1] += (ty - y) * returnStrength;
          velocities[i3 + 2] += (tz - z) * returnStrength;

          // Check if close enough to target to reset
          const distToTarget = Math.sqrt(
            (tx - x) * (tx - x) + (ty - y) * (ty - y) + (tz - z) * (tz - z)
          );

          if (distToTarget < 0.01) {
            dispersedTimes[i] = -1; // Reset dispersion state
            velocities[i3] = 0;
            velocities[i3 + 1] = 0;
            velocities[i3 + 2] = 0;
          }
        }
      } else {
        // Attract to target position
        const springForce = 0.004;
        velocities[i3] += (tx - x) * springForce;
        velocities[i3 + 1] += (ty - y) * springForce;
        velocities[i3 + 2] += (tz - z) * springForce;
      }

      // Friction
      velocities[i3] *= 0.92;
      velocities[i3 + 1] *= 0.92;
      velocities[i3 + 2] *= 0.92;

      // Apply velocities
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={typeof window !== 'undefined' && window.innerWidth < 640 ? 0.06 : 0.08}
        vertexColors
        transparent
        opacity={1.0}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
