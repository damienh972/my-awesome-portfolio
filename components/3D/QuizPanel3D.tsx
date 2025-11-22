"use client";

import { useRef, useState, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, RoundedBox } from "@react-three/drei";
import { QUIZ_QUESTIONS } from "@/const/quiz";

interface QuizPanel3DProps {
  position: [number, number, number];
  scrollRef: RefObject<number>;
  currentSection: number;
}

export function QuizPanel3D({
  position,
  scrollRef,
  currentSection,
}: QuizPanel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Mesh>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizState, setQuizState] = useState<"active" | "success" | "failure">(
    "active"
  );
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    let targetY = -20;

    if (currentSection === 1) {
      const scrollProgress = scrollRef.current;

      const currentProgress = scrollProgress || 0;
      const normalizedProgress = Math.min(1, currentProgress * 2);

      let enterT = 0;
      if (normalizedProgress > 0.5) {
        enterT = (normalizedProgress - 0.5) / 0.5;
      }
      const ease =
        1 +
        2.70158 * Math.pow(enterT - 1, 3) +
        1.70158 * Math.pow(enterT - 1, 2);

      targetY = THREE.MathUtils.lerp(-20, position[1], enterT >= 1 ? 1 : ease);
    } else {
      targetY = -20;
    }

    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.1
    );

    groupRef.current.position.x = position[0];
    groupRef.current.position.z = position[2];

    if (panelRef.current) {
      const targetRotX = mousePos.y * 0.05;
      const targetRotY = mousePos.x * 0.05;
      panelRef.current.rotation.x = THREE.MathUtils.lerp(
        panelRef.current.rotation.x,
        targetRotX,
        delta * 5
      );
      panelRef.current.rotation.y = THREE.MathUtils.lerp(
        panelRef.current.rotation.y,
        targetRotY,
        delta * 5
      );
    }
  });

  const handlePointerMove = (e: any) => {
    const x = e.point.x / 2.5;
    const y = e.point.y / 2;
    setMousePos({ x, y });
  };
  const handleAnswer = (idx: number) => {
    const isCorrect = idx === QUIZ_QUESTIONS[currentQuestion].correctAnswer;
    setSelectedAnswers([...selectedAnswers, idx]);
    if (currentQuestion < QUIZ_QUESTIONS.length - 1)
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    else
      setTimeout(
        () =>
          setQuizState(
            [...selectedAnswers, idx].filter(
              (a, i) => a === QUIZ_QUESTIONS[i].correctAnswer
            ).length === QUIZ_QUESTIONS.length
              ? "success"
              : "failure"
          ),
        300
      );
  };
  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setQuizState("active");
  };

  return (
    // CORRECTION ICI : On initialise position Y à -20 pour éviter l'effet de chute
    <group
      ref={groupRef}
      scale={0.6}
      position={[position[0], -20, position[2]]}
    >
      <RoundedBox
        ref={panelRef}
        args={[5, 4, 0.15]}
        radius={0.15}
        smoothness={4}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setMousePos({ x: 0, y: 0 })}
      >
        <meshStandardMaterial
          color="#0891b2"
          transparent
          opacity={0.7}
          metalness={0.9}
          roughness={0.1}
          emissive="#22d3ee"
          emissiveIntensity={0.2}
          side={THREE.DoubleSide}
        />
      </RoundedBox>
      <RoundedBox args={[5.1, 4.1, 0.02]} radius={0.15} position={[0, 0, -0.1]}>
        <meshBasicMaterial color="#000000" transparent opacity={0.5} />
      </RoundedBox>

      {quizState === "active" ? (
        <>
          <Text
            position={[0, 1.5, 0.1]}
            fontSize={0.18}
            color="#ffffff"
            anchorX="center"
            maxWidth={4.5}
          >
            {QUIZ_QUESTIONS[currentQuestion].question}
          </Text>
          {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => (
            <group key={idx} position={[0, 0.8 - idx * 0.5, 0.1]}>
              <RoundedBox
                args={[4.2, 0.4, 0.05]}
                radius={0.05}
                onClick={() => handleAnswer(idx)}
                onPointerOver={() => setHoveredButton(idx)}
                onPointerOut={() => setHoveredButton(null)}
              >
                <meshStandardMaterial
                  color={hoveredButton === idx ? "#0ea5e9" : "#1e293b"}
                />
              </RoundedBox>
              <Text
                position={[0, 0, 0.06]}
                fontSize={0.14}
                color="white"
                anchorX="center"
              >
                {option}
              </Text>
            </group>
          ))}
        </>
      ) : (
        <Text
          position={[0, 0, 0.1]}
          fontSize={0.4}
          color="#22d3ee"
          anchorX="center"
        >
          {quizState === "success" ? "BRAVO !" : "RATE !"}
        </Text>
      )}
      {quizState !== "active" && (
        <group position={[0, -1, 0.1]}>
          <RoundedBox args={[2, 0.5, 0.05]} radius={0.1} onClick={handleRetry}>
            <meshStandardMaterial color="#ffffff" />
          </RoundedBox>
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.15}
            color="black"
            anchorX="center"
          >
            RETRY
          </Text>
        </group>
      )}
    </group>
  );
}
