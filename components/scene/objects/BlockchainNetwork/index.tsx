"use client";

import * as THREE from 'three';
import { useMemo, useRef, useLayoutEffect, RefObject } from 'react';
import { SeededRandom } from '@/utils/rng';
import { useFrame, useThree } from '@react-three/fiber';
import { onPacketBeforeCompile } from '@/lib/shaders/packet';
import { BLOCKCHAIN_CONFIG } from '@/config/3d';

interface BlockchainNetworkProps {
  scrollRef: RefObject<number>;
  currentSection: number;
}

export function BlockchainNetwork({ scrollRef, currentSection }: BlockchainNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const cablesRef = useRef<THREE.InstancedMesh>(null);
  const packetsRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { pointer } = useThree();

  const rng = useMemo(() => new SeededRandom(BLOCKCHAIN_CONFIG.seed), []);

  const { nodes, connections } = useMemo(() => {
    const _nodes = [];
    for (let i = 0; i < BLOCKCHAIN_CONFIG.nodes.count; i++) {
      _nodes.push(
        new THREE.Vector3(
          (rng.next() - 0.5) * BLOCKCHAIN_CONFIG.nodes.distribution.x,
          (rng.next() - 0.5) * BLOCKCHAIN_CONFIG.nodes.distribution.y,
          (rng.next() - 0.5) * BLOCKCHAIN_CONFIG.nodes.distribution.z
        )
      );
    }
    const _connections = [];
    for (let i = 0; i < BLOCKCHAIN_CONFIG.nodes.count; i++) {
      for (let j = i + 1; j < BLOCKCHAIN_CONFIG.nodes.count; j++) {
        if (_nodes[i].distanceTo(_nodes[j]) < BLOCKCHAIN_CONFIG.nodes.connectionDistance) {
          _connections.push({ start: _nodes[i], end: _nodes[j] });
        }
      }
    }
    return { nodes: _nodes, connections: _connections };
  }, [rng]);

  useLayoutEffect(() => {
    if (nodesRef.current) {
      nodes.forEach((pos, i) => {
        dummy.position.copy(pos);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        nodesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      nodesRef.current.instanceMatrix.needsUpdate = true;
    }
    if (cablesRef.current) {
      connections.forEach((conn, i) => {
        const dist = conn.start.distanceTo(conn.end);
        dummy.position.copy(conn.start).add(conn.end).multiplyScalar(0.5);
        dummy.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(conn.end, conn.start).normalize()
        );
        dummy.scale.set(1, dist, 1);
        dummy.updateMatrix();
        cablesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      cablesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [nodes, connections, dummy]);

  const initialPackets = useMemo(() => {
    return Array.from({ length: BLOCKCHAIN_CONFIG.packets.count }).map((_, i) => ({
      active: i < BLOCKCHAIN_CONFIG.packets.initialActive,
      progress: rng.next(),
      routeIndex: Math.floor(rng.next() * connections.length),
      speed: BLOCKCHAIN_CONFIG.packets.speed.min +
             rng.next() * (BLOCKCHAIN_CONFIG.packets.speed.max - BLOCKCHAIN_CONFIG.packets.speed.min),
    }));
  }, [rng, connections.length]);

  const packetsData = useRef(initialPackets);

  useFrame((_, delta) => {
    if (!groupRef.current || !packetsRef.current) return;

    groupRef.current.rotation.y += BLOCKCHAIN_CONFIG.animation.rotation;

    const targetRotX = pointer.y * BLOCKCHAIN_CONFIG.animation.pointerInfluence || 0;
    groupRef.current.rotation.x +=
      (targetRotX - groupRef.current.rotation.x) * BLOCKCHAIN_CONFIG.animation.lerpSpeed;

    const scrollProgress = scrollRef.current || 0;
    const targetPos = new THREE.Vector3();

    if (currentSection === 0) {
      targetPos.set(...BLOCKCHAIN_CONFIG.animation.position.hero);
    } else {
      const t = Math.min(1, scrollProgress * 2);
      const ease = t * (2 - t);
      targetPos.set(
        0,
        THREE.MathUtils.lerp(
          BLOCKCHAIN_CONFIG.animation.position.hero[1],
          BLOCKCHAIN_CONFIG.animation.position.blockchain[1],
          ease
        ),
        THREE.MathUtils.lerp(
          BLOCKCHAIN_CONFIG.animation.position.hero[2],
          BLOCKCHAIN_CONFIG.animation.position.blockchain[2],
          ease
        )
      );
    }

    if (
      currentSection === 0 &&
      scrollProgress === 0 &&
      groupRef.current.position.y === 0
    ) {
      groupRef.current.position.set(...BLOCKCHAIN_CONFIG.animation.position.hero);
    } else {
      groupRef.current.position.lerp(targetPos, BLOCKCHAIN_CONFIG.animation.lerpSpeed);
    }

    const safeDelta = Math.min(delta, 0.05);
    let dirty = false;

    packetsData.current.forEach((packet, i) => {
      if (!packet.active) {
        if (Math.random() < BLOCKCHAIN_CONFIG.packets.activationProbability) {
          packet.active = true;
          packet.progress = 0;
          packet.routeIndex = Math.floor(rng.next() * connections.length);
          packet.speed = BLOCKCHAIN_CONFIG.packets.speed.min +
                        rng.next() * (BLOCKCHAIN_CONFIG.packets.speed.max - BLOCKCHAIN_CONFIG.packets.speed.min);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          packetsRef.current!.setMatrixAt(i, dummy.matrix);
          dirty = true;
          return;
        }
      }

      packet.progress += packet.speed * safeDelta;

      if (packet.progress >= 1) {
        packet.active = false;
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        packetsRef.current!.setMatrixAt(i, dummy.matrix);
        dirty = true;
      } else {
        const route = connections[packet.routeIndex];
        if (route) {
          dummy.position.lerpVectors(route.start, route.end, packet.progress);
          dummy.lookAt(route.end);
          dummy.scale.set(...BLOCKCHAIN_CONFIG.packets.scale);
          dummy.updateMatrix();
          packetsRef.current!.setMatrixAt(i, dummy.matrix);
          dirty = true;
        }
      }
    });

    if (dirty) packetsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={BLOCKCHAIN_CONFIG.animation.position.hero}>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, BLOCKCHAIN_CONFIG.nodes.count]}>
        <sphereGeometry args={[
          BLOCKCHAIN_CONFIG.nodes.sphere.radius,
          BLOCKCHAIN_CONFIG.nodes.sphere.widthSegments,
          BLOCKCHAIN_CONFIG.nodes.sphere.heightSegments
        ]} />
        <meshStandardMaterial
          color={BLOCKCHAIN_CONFIG.nodes.material.color}
          roughness={BLOCKCHAIN_CONFIG.nodes.material.roughness}
          metalness={BLOCKCHAIN_CONFIG.nodes.material.metalness}
          emissive={BLOCKCHAIN_CONFIG.nodes.material.emissive}
          emissiveIntensity={BLOCKCHAIN_CONFIG.nodes.material.emissiveIntensity}
        />
      </instancedMesh>

      <instancedMesh
        ref={cablesRef}
        args={[undefined, undefined, connections.length]}
      >
        <cylinderGeometry args={[
          BLOCKCHAIN_CONFIG.cables.cylinder.radiusTop,
          BLOCKCHAIN_CONFIG.cables.cylinder.radiusBottom,
          1,
          BLOCKCHAIN_CONFIG.cables.cylinder.radialSegments
        ]} />
        <meshBasicMaterial
          color={BLOCKCHAIN_CONFIG.cables.material.color}
          transparent
          opacity={BLOCKCHAIN_CONFIG.cables.material.opacity}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      <instancedMesh
        ref={packetsRef}
        args={[undefined, undefined, BLOCKCHAIN_CONFIG.packets.count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[
          BLOCKCHAIN_CONFIG.packets.sphere.radius,
          BLOCKCHAIN_CONFIG.packets.sphere.widthSegments,
          BLOCKCHAIN_CONFIG.packets.sphere.heightSegments
        ]} />
        <meshBasicMaterial
          color={BLOCKCHAIN_CONFIG.packets.material.color}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          onBeforeCompile={onPacketBeforeCompile}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
