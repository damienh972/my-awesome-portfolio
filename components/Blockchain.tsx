"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useScroll } from "framer-motion";

export function Blockchain() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollValue, setScrollValue] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const [quizScrollProgress, setQuizScrollProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      setScrollValue(value);
      const progress = Math.max(0, Math.min(1, (value - 0.2) / 0.3));
      setQuizScrollProgress(progress);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  const isInView = scrollValue >= 0.3 && scrollValue <= 0.8;

  return (
    <section
      ref={sectionRef}
      className="flex items-center justify-center text-white"
      style={{ height: "200vh", zIndex: 2, position: "relative" }}
    >
      {isInView && (
        <div
          className="pointer-events-auto"
          style={{
            position: "absolute",
            top: "50%",
            left: "80%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "500px",
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[5, 5, 5]}
              intensity={0.8}
              color="#00d9ff"
            />
            <pointLight
              position={[-5, -5, 5]}
              intensity={0.5}
              color="#a855f7"
            />
          </Canvas>
        </div>
      )}
    </section>
  );
}
