"use client";

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sc2ButtonsVertexShader, sc2ButtonsFragmentShader } from '@/lib/shaders/sc2Buttons';
import { QUIZ_QUESTIONS } from '@/const/quiz';
import { StatusStepper } from './StatusStepper';
import { AnimatedText } from './AnimatedText';
import { AnimatedButton } from './AnimatedButton';
import { SeededRandom } from '@/utils/rng';
import { QUIZ_CONFIG } from '@/config/3d';
import { useResponsive } from '@/hooks';

interface QuizProps {
  scrollRef: React.RefObject<number>;
  currentSection: number;
}

export function Quiz({ scrollRef, currentSection }: QuizProps) {
  const groupRef = useRef<THREE.Group>(null);
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { isMobile } = useResponsive();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizState, setQuizState] = useState<'active' | 'success' | 'failure'>('active');
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  const animState = useRef({
    wallProgress: 0,
    textAlpha: 0,
    textZ: -0.5,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && document.fonts) {
      document.fonts
        .load(`400 100px ${QUIZ_CONFIG.text.font}`)
        .then(() => setFontLoaded(true))
        .catch(() => setFontLoaded(true));
    } else {
      const t = setTimeout(() => setFontLoaded(true), 0);
      return () => clearTimeout(t);
    }
  }, []);

  const baseShaderConfig = useMemo(
    () => ({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.0 },
        baseColor: { value: new THREE.Color(QUIZ_CONFIG.buttons.colors.normal) },
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

  const particlesData = useMemo(() => {
    const rng = new SeededRandom(QUIZ_CONFIG.seed);
    const targets = [];
    const randomOffsets = [];
    const blockW = QUIZ_CONFIG.panel.width / QUIZ_CONFIG.grid.cols;
    const blockH = QUIZ_CONFIG.panel.height / QUIZ_CONFIG.grid.rows;

    for (let i = 0; i < QUIZ_CONFIG.debris.count; i++) {
      const col = i % QUIZ_CONFIG.grid.cols;
      const row = Math.floor(i / QUIZ_CONFIG.grid.cols);
      const tx = col * blockW - QUIZ_CONFIG.panel.width / 2 + blockW / 2;
      const ty = (QUIZ_CONFIG.grid.rows - 1 - row) * blockH - QUIZ_CONFIG.panel.height / 2 + blockH / 2;
      targets.push({ x: tx, y: ty, z: 0 });
      randomOffsets.push({
        x: (rng.next() - 0.5) * 12,
        y: (rng.next() - 0.5) * 12,
        z: (rng.next() - 0.5) * 8,
      });
    }
    return { targets, randomOffsets, blockW, blockH };
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
      if (scroll > 0.05) targetY = QUIZ_CONFIG.panel.position[1] + (scroll - 0.5) * 2;

      const wIn = mapRange(scroll, 0.15, 0.45);
      const wOut = 1 - mapRange(scroll, 0.85, 0.95);
      wallP = Math.min(wIn, wOut);

      const tIn = mapRange(scroll, 0.45, 0.62);
      const tOut = 1 - mapRange(scroll, 0.8, 0.9);
      textP = Math.min(tIn, tOut);
    }

    const smoothWall =
      wallP < 0.5 ? 4 * wallP * wallP * wallP : 1 - Math.pow(-2 * wallP + 2, 3) / 2;
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
      groupRef.current.position.x = QUIZ_CONFIG.panel.position[0];
      groupRef.current.position.z = isMobile
        ? QUIZ_CONFIG.panel.mobilePosition[2]
        : QUIZ_CONFIG.panel.position[2];

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
      for (let i = 0; i < QUIZ_CONFIG.debris.count; i++) {
        const target = particlesData.targets[i];
        const offset = particlesData.randomOffsets[i];

        const x = THREE.MathUtils.lerp(target.x + offset.x, target.x, smoothWall);
        const y = THREE.MathUtils.lerp(target.y + offset.y, target.y, smoothWall);
        const z = THREE.MathUtils.lerp(target.z + offset.z, target.z, smoothWall);

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
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), QUIZ_CONFIG.animation.questionDelay);
    } else {
      setTimeout(() => {
        const score = [...selectedAnswers, idx].filter(
          (a, i) => a === QUIZ_QUESTIONS[i].correctAnswer
        ).length;
        setQuizState(score === QUIZ_QUESTIONS.length ? 'success' : 'failure');
      }, QUIZ_CONFIG.animation.resultDelay);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setQuizState('active');
  };

  const buttonColors = {
    normal: new THREE.Color(QUIZ_CONFIG.buttons.colors.normal),
    hover: new THREE.Color(QUIZ_CONFIG.buttons.colors.hover),
  };

  const initialPosition: [number, number, number] = [
    QUIZ_CONFIG.panel.position[0],
    -100,
    isMobile ? QUIZ_CONFIG.panel.mobilePosition[2] : QUIZ_CONFIG.panel.position[2]
  ];

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      scale={QUIZ_CONFIG.panel.scale}
    >
      <instancedMesh
        ref={debrisRef}
        args={[undefined, undefined, QUIZ_CONFIG.debris.count]}
        frustumCulled={false}
        raycast={() => null}
      >
        <boxGeometry args={[particlesData.blockW, particlesData.blockH, QUIZ_CONFIG.debris.depth]} />
        <meshStandardMaterial
          color={QUIZ_CONFIG.material.color}
          roughness={QUIZ_CONFIG.material.roughness}
          metalness={QUIZ_CONFIG.material.metalness}
          emissive={QUIZ_CONFIG.material.emissive}
          emissiveIntensity={QUIZ_CONFIG.material.emissiveIntensity}
        />
      </instancedMesh>

      {fontLoaded && (
        <group scale={QUIZ_CONFIG.panel.contentScale}>
          <StatusStepper
            currentQuestion={currentQuestion}
            totalQuestions={QUIZ_QUESTIONS.length}
            answers={selectedAnswers}
            correctAnswers={QUIZ_QUESTIONS.map((q) => q.correctAnswer)}
            basePosition={QUIZ_CONFIG.animation.basePosition}
            animState={animState}
          />

          {quizState === 'active' ? (
            <>
              <AnimatedText
                text={QUIZ_QUESTIONS[currentQuestion].question.toUpperCase()}
                basePosition={[0, 1.6, 0]}
                fontSize={QUIZ_CONFIG.text.sizes.question}
                color={QUIZ_CONFIG.text.colors.normal}
                animState={animState}
                isHovered={false}
              />

              {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => (
                <group key={idx}>
                  <AnimatedButton
                    basePosition={[0, 0.4 - idx * 0.8, 0]}
                    args={[
                      QUIZ_CONFIG.buttons.dimensions.width,
                      QUIZ_CONFIG.buttons.dimensions.height,
                      QUIZ_CONFIG.buttons.dimensions.depth,
                    ]}
                    baseColor={buttonColors}
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
                    fontSize={QUIZ_CONFIG.text.sizes.option}
                    color={
                      hoveredButton === idx
                        ? QUIZ_CONFIG.text.colors.active
                        : QUIZ_CONFIG.text.colors.normal
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
                text={quizState === 'success' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                basePosition={[0, 0.5, 0]}
                fontSize={QUIZ_CONFIG.text.sizes.result}
                color={
                  quizState === 'success'
                    ? QUIZ_CONFIG.text.colors.success
                    : QUIZ_CONFIG.text.colors.failure
                }
                animState={animState}
                isHovered={false}
              />
              <AnimatedButton
                basePosition={[0, -1, 0]}
                args={[
                  QUIZ_CONFIG.buttons.retry.width,
                  QUIZ_CONFIG.buttons.retry.height,
                  QUIZ_CONFIG.buttons.retry.depth,
                ]}
                baseColor={buttonColors}
                baseShaderConfig={null}
                animState={animState}
                onClick={handleRetry}
                emissive={true}
                isHovered={false}
              />
              <AnimatedText
                text="REINITIALIZE"
                basePosition={[0, -1, 0.11]}
                fontSize={QUIZ_CONFIG.text.sizes.retry}
                color={QUIZ_CONFIG.text.colors.retry}
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
