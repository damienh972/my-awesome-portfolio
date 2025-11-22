"use client";

import * as THREE from "three";
import { useMemo, useRef, useLayoutEffect, RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// Network Parameters
const NODE_COUNT = 24;
const CONNECTION_DISTANCE = 12;
const PACKET_COUNT = 24;

interface Props {
  scrollRef: RefObject<number>;
  currentSection: number;
}

// Seeded random number generator for consistent node placement
function createSeededRandom(seed: number) {
  let value = seed;
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function BlockchainBackground({ scrollRef, currentSection }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const cablesRef = useRef<THREE.InstancedMesh>(null);
  const packetsRef = useRef<THREE.InstancedMesh>(null);

  // Prevent re-creating dummy object on each frame
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { pointer } = useThree();

  const { nodes, connections } = useMemo(() => {
    // Generate nodes and connections
    const rng = createSeededRandom(24);
    const _nodes = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      _nodes.push(new THREE.Vector3(
        (rng() - 0.5) * 40,
        (rng() - 0.5) * 30,
        (rng() - 0.5) * 20
      ));
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
  }, []);

  useLayoutEffect(() => {
    // Nodes
    if (nodesRef.current) {
      nodes.forEach((pos, i) => {
        dummy.position.copy(pos);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        nodesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      nodesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Links
    if (cablesRef.current) {
      connections.forEach((conn, i) => {
        const dist = conn.start.distanceTo(conn.end);
        dummy.position.copy(conn.start).add(conn.end).multiplyScalar(0.5);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(conn.end, conn.start).normalize());
        dummy.scale.set(1, dist, 1);
        dummy.updateMatrix();
        cablesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      cablesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [nodes, connections, dummy]);

  const packetsData = useRef(Array.from({ length: PACKET_COUNT }).map(() => ({ active: false, progress: 0, routeIndex: 0, speed: 0 })));

  useFrame((state, delta) => {
    if (!groupRef.current || !packetsRef.current) return;

    groupRef.current.rotation.y += 0.1 * delta;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointer.y * 0.2, 0.1);

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

    if (currentSection === 0 && scrollProgress === 0 && groupRef.current.position.y === 0) {
      groupRef.current.position.set(0, -50, -60);
    } else {
      const damp = 1 - Math.pow(0.001, delta);
      groupRef.current.position.lerp(targetPos, damp * 2);
    }

    let dirty = false;

    packetsData.current.forEach((packet, i) => {

      if (!packet.active) {
        // Normalised chance to activate per frame
        if (Math.random() < 0.5 * delta) {
          packet.active = true;
          packet.progress = 0;
          packet.routeIndex = Math.floor(Math.random() * connections.length);
          // 1 or 2 units per second
          packet.speed = 0.5 + Math.random() * 0.5;
        } else {
          return;
        }
      }

      packet.progress += packet.speed * delta;

      if (packet.progress >= 1) {
        packet.active = false;
        dummy.position.set(0, -99999, 0);
        dummy.updateMatrix();
        packetsRef.current!.setMatrixAt(i, dummy.matrix);
        dirty = true;
      } else {
        const route = connections[packet.routeIndex];
        if (route) {
          dummy.position.lerpVectors(route.start, route.end, packet.progress);
          dummy.scale.set(1, 1, 1);
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
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </instancedMesh>

      <instancedMesh ref={cablesRef} args={[undefined, undefined, connections.length]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 4]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.3} />
      </instancedMesh>

      <instancedMesh ref={packetsRef} args={[undefined, undefined, PACKET_COUNT]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#00eaff" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}