"use client";

import * as THREE from "three";
import { useMemo, useRef, useLayoutEffect, RefObject } from "react";
import { SeededRandom } from "@/utils/rng";
import { useFrame, useThree } from "@react-three/fiber";
import { onPacketBeforeCompile } from "../shaders/packet";

const NODE_COUNT = 18;
const CONNECTION_DISTANCE = 14;
const PACKET_COUNT = 40;

interface Props {
  scrollRef: RefObject<number>;
  currentSection: number;
}

export function BlockchainBackground({ scrollRef, currentSection }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const cablesRef = useRef<THREE.InstancedMesh>(null);
  const packetsRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { pointer } = useThree();

  const rng = useMemo(() => new SeededRandom(42), []);

  const { nodes, connections } = useMemo(() => {
    const _nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      _nodes.push(
        new THREE.Vector3(
          (rng.next() - 0.5) * 40,
          (rng.next() - 0.5) * 30,
          (rng.next() - 0.5) * 20
        )
      );
    }
    const _connections = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (_nodes[i].distanceTo(_nodes[j]) < CONNECTION_DISTANCE) {
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
    return Array.from({ length: PACKET_COUNT }).map((_, i) => ({
      active: i < 15,
      progress: rng.next(),
      routeIndex: Math.floor(rng.next() * connections.length),
      speed: 0.5 + rng.next() * 0.5,
    }));
  }, [rng, connections.length]);

  const packetsData = useRef(initialPackets);

  useFrame((_, delta) => {
    if (!groupRef.current || !packetsRef.current) return;

    groupRef.current.rotation.y += 0.0015;

    const targetRotX = pointer.y * 0.2 || 0;
    groupRef.current.rotation.x +=
      (targetRotX - groupRef.current.rotation.x) * 0.05;

    const scrollProgress = scrollRef.current || 0;
    const targetPos = new THREE.Vector3();

    if (currentSection === 0) {
      targetPos.set(0, -50, -60);
    } else {
      const t = Math.min(1, scrollProgress * 2);
      const ease = t * (2 - t);
      targetPos.set(
        0,
        THREE.MathUtils.lerp(-50, 0, ease),
        THREE.MathUtils.lerp(-60, -12, ease)
      );
    }

    if (
      currentSection === 0 &&
      scrollProgress === 0 &&
      groupRef.current.position.y === 0
    ) {
      groupRef.current.position.set(0, -50, -60);
    } else {
      groupRef.current.position.lerp(targetPos, 0.05);
    }

    const safeDelta = Math.min(delta, 0.05);
    let dirty = false;

    packetsData.current.forEach((packet, i) => {
      if (!packet.active) {
        if (Math.random() < 0.2) {
          packet.active = true;
          packet.progress = 0;
          packet.routeIndex = Math.floor(rng.next() * connections.length);
          packet.speed = 0.5 + rng.next() * 0.5;
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
          dummy.scale.set(0.09, 0.09, 0.6);
          dummy.updateMatrix();
          packetsRef.current!.setMatrixAt(i, dummy.matrix);
          dirty = true;
        }
      }
    });

    if (dirty) packetsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={[0, -50, -60]}>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.5}
          metalness={0.8}
          emissive="#1e1b4b"
          emissiveIntensity={0.1}
        />
      </instancedMesh>

      <instancedMesh
        ref={cablesRef}
        args={[undefined, undefined, connections.length]}
      >
        <cylinderGeometry args={[0.03, 0.03, 1, 4]} />
        <meshBasicMaterial
          color="#475569"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      <instancedMesh
        ref={packetsRef}
        args={[undefined, undefined, PACKET_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color="#00eaff"
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
