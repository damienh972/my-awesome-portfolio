"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  sc2ButtonsVertexShader,
  sc2ButtonsFragmentShader,
} from "../shaders/sc2Buttons";
import { QUIZ_QUESTIONS } from "@/const/quiz";
import { StatusStepper } from "./StatusStepper";
import { AnimatedText } from "./AnimatedText";
import { AnimatedButton } from "./AnimatedButton";
import { SeededRandom } from "@/utils/rng";

interface QuizPanel3DProps {
  position: [number, number, number];
  scrollRef: React.RefObject<number>;
  currentSection: number;
}

// --- CONFIGURATION ---
const DEBRIS_COUNT = 30;
const GRID_COLS = 6;
const GRID_ROWS = 5;

const PANEL_WIDTH = 6.0;
const PANEL_HEIGHT = 5.0;

const BLOCK_W = PANEL_WIDTH / GRID_COLS;
const BLOCK_H = PANEL_HEIGHT / GRID_ROWS;
const BLOCK_D = 0.2;

const BUTTON_COLORS = {
  normal: new THREE.Color("#4617d5"),
  hover: new THREE.Color("#735bac"),
};
const SC_TEXT_COLOR = "#e0f7fa";
const SC_TEXT_ACTIVE = "#ffffff";
const FONT_NAME = "Michroma";

export function QuizPanel3D({
  position,
  scrollRef,
  currentSection,
}: QuizPanel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizState, setQuizState] = useState<"active" | "success" | "failure">(
    "active"
  );
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  const animState = useRef({
    wallProgress: 0,
    textAlpha: 0,
    textZ: -0.5,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && document.fonts) {
      document.fonts
        .load(`400 100px ${FONT_NAME}`)
        .then(() => setFontLoaded(true))
        .catch(() => setFontLoaded(true));
    } else {
      const t = setTimeout(() => setFontLoaded(true), 0);
      return () => clearTimeout(t);
    }
  }, []);

  // Shader configuration
  const baseShaderConfig = useMemo(
    () => ({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.0 },
        baseColor: { value: new THREE.Color(BUTTON_COLORS.normal) },
        hoverState: { value: 0.0 },
      },
      vertexShader: sc2ButtonsVertexShader,
      fragmentShader: sc2ButtonsFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    []
  );

  // Grid
  const particlesData = useMemo(() => {
    const rng = new SeededRandom(42);
    const targets = [];
    const randomOffsets = [];
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const tx = col * BLOCK_W - PANEL_WIDTH / 2 + BLOCK_W / 2;
      const ty =
        (GRID_ROWS - 1 - row) * BLOCK_H - PANEL_HEIGHT / 2 + BLOCK_H / 2;
      targets.push({ x: tx, y: ty, z: 0 });
      randomOffsets.push({
        x: (rng.next() - 0.5) * 12,
        y: (rng.next() - 0.5) * 12,
        z: (rng.next() - 0.5) * 8,
      });
    }
    return { targets, randomOffsets };
  }, []);

  const mapRange = (value: number, start: number, end: number) => {
    return Math.max(0, Math.min(1, (value - start) / (end - start)));
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollRef.current || 0;

    if (Math.abs(state.pointer.y) > 0.9 && hoveredButton !== null) {
      setHoveredButton(null);
    }

    let targetY = -100;
    let wallP = 0;
    let textP = 0;

    if (currentSection === 1) {
      if (scroll > 0.05) targetY = position[1] + (scroll - 0.5) * 2;

      const wIn = mapRange(scroll, 0.15, 0.45);
      const wOut = 1 - mapRange(scroll, 0.85, 0.95);
      wallP = Math.min(wIn, wOut);

      const tIn = mapRange(scroll, 0.45, 0.62);
      const tOut = 1 - mapRange(scroll, 0.8, 0.9);
      textP = Math.min(tIn, tOut);
    }

    const smoothWall =
      wallP < 0.5
        ? 4 * wallP * wallP * wallP
        : 1 - Math.pow(-2 * wallP + 2, 3) / 2;
    const smoothText = Math.sin((textP * Math.PI) / 2);

    let targetZ = 0.25;
    if (scroll <= 0.7) targetZ = THREE.MathUtils.lerp(-0.3, 0.25, smoothText);
    else targetZ = 0.25;

    animState.current.wallProgress = smoothWall;
    animState.current.textAlpha = smoothText;
    animState.current.textZ = targetZ;

    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.2
      );
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];

      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        state.pointer.y * 0.03,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        state.pointer.x * 0.03,
        0.1
      );
    }

    if (debrisRef.current) {
      for (let i = 0; i < DEBRIS_COUNT; i++) {
        const target = particlesData.targets[i];
        const offset = particlesData.randomOffsets[i];

        const x = THREE.MathUtils.lerp(
          target.x + offset.x,
          target.x,
          smoothWall
        );
        const y = THREE.MathUtils.lerp(
          target.y + offset.y,
          target.y,
          smoothWall
        );
        const z = THREE.MathUtils.lerp(
          target.z + offset.z,
          target.z,
          smoothWall
        );

        dummy.position.set(x, y, z);

        dummy.rotation.set(
          (1 - smoothWall) * (offset.y + time),
          (1 - smoothWall) * (offset.x + time),
          (1 - smoothWall) * offset.z
        );

        const scale = THREE.MathUtils.lerp(0, 1, smoothWall);
        dummy.scale.set(scale, scale, scale);

        dummy.updateMatrix();
        debrisRef.current.setMatrixAt(i, dummy.matrix);
      }
      debrisRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const handleAnswer = (idx: number) => {
    setSelectedAnswers([...selectedAnswers, idx]);
    if (animState.current.textAlpha < 0.5) return;

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => {
        const score = [...selectedAnswers, idx].filter(
          (a, i) => a === QUIZ_QUESTIONS[i].correctAnswer
        ).length;
        setQuizState(score === QUIZ_QUESTIONS.length ? "success" : "failure");
      }, 500);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setQuizState("active");
  };

  const CONTENT_SCALE = 0.85;

  return (
    <group
      ref={groupRef}
      position={[position[0], -100, position[2]]}
      scale={0.8}
    >
      <instancedMesh
        ref={debrisRef}
        args={[undefined, undefined, DEBRIS_COUNT]}
        frustumCulled={false}
        raycast={() => null}
      >
        <boxGeometry args={[BLOCK_W, BLOCK_H, BLOCK_D]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.2}
          metalness={0.8}
          emissive={"#1b2b52"}
          emissiveIntensity={0.2}
        />
      </instancedMesh>

      {fontLoaded && (
        <group scale={CONTENT_SCALE}>
          <StatusStepper
            currentQuestion={currentQuestion}
            totalQuestions={QUIZ_QUESTIONS.length}
            answers={selectedAnswers}
            correctAnswers={QUIZ_QUESTIONS.map((q) => q.correctAnswer)}
            basePosition={[2.2, 2.2, 0]}
            animState={animState}
          />

          {quizState === "active" ? (
            <>
              <AnimatedText
                text={QUIZ_QUESTIONS[currentQuestion].question.toUpperCase()}
                basePosition={[0, 1.6, 0]}
                fontSize={0.22}
                color={SC_TEXT_COLOR}
                animState={animState}
                isHovered={false}
              />

              {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => (
                <group key={idx}>
                  <AnimatedButton
                    basePosition={[0, 0.4 - idx * 0.8, 0]}
                    args={[4.0, 0.55, 0.05]}
                    baseColor={BUTTON_COLORS}
                    baseShaderConfig={baseShaderConfig}
                    animState={animState}
                    onClick={() => handleAnswer(idx)}
                    onOver={() => setHoveredButton(idx)}
                    onOut={() => setHoveredButton(null)}
                    isHovered={hoveredButton === idx}
                  />

                  <AnimatedText
                    text={option}
                    basePosition={[0, 0.4 - idx * 0.8, 0.06]}
                    fontSize={0.16}
                    color={
                      hoveredButton === idx ? SC_TEXT_ACTIVE : SC_TEXT_COLOR
                    }
                    animState={animState}
                    isHovered={hoveredButton === idx}
                  />
                </group>
              ))}
            </>
          ) : (
            <group>
              <AnimatedText
                text={
                  quizState === "success" ? "ACCESS GRANTED" : "ACCESS DENIED"
                }
                basePosition={[0, 0.5, 0]}
                fontSize={0.4}
                color={quizState === "success" ? "#69f0ae" : "#ff5252"}
                animState={animState}
                isHovered={false}
              />
              <AnimatedButton
                basePosition={[0, -1, 0]}
                args={[2.5, 0.6, 0.1]}
                baseColor={BUTTON_COLORS}
                baseShaderConfig={null}
                animState={animState}
                onClick={handleRetry}
                emissive={true}
                isHovered={false}
              />
              <AnimatedText
                text="REINITIALIZE"
                basePosition={[0, -1, 0.11]}
                fontSize={0.2}
                color="#000000"
                animState={animState}
                isHovered={false}
              />
            </group>
          )}
        </group>
      )}
    </group>
  );
}
