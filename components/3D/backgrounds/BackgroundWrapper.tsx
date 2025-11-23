"use client";

import { useEffect, useState, useRef } from "react";
import { Background } from "./Background";

export function BackgroundWrapper() {
  const [currentSection, setCurrentSection] = useState(0);
  const scrollProgressRef = useRef(0);
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSnappingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const HERO_HEIGHT = windowHeight;
      const BLOCKCHAIN_HEIGHT = windowHeight * 4;
      const SCROLLABLE_HEIGHT = BLOCKCHAIN_HEIGHT - windowHeight;

      let section = 0;
      let progress = 0;

      if (scrollY < HERO_HEIGHT) {
        section = 0;
        progress = scrollY / HERO_HEIGHT;
      } else {
        section = 1;
        const relativeScroll = scrollY - HERO_HEIGHT;
        progress = relativeScroll / SCROLLABLE_HEIGHT;
        progress = Math.max(0, Math.min(1, progress));
      }

      scrollProgressRef.current = progress;

      setCurrentSection((prev) => {
        if (prev !== section && section <= 1) return section;
        return prev;
      });

      // Snapping logic for the quiz section
      const QUIZ_PERFECT_RATIO = 0.58;

      if (section === 1 && !isSnappingRef.current) {
        const quizTargetY =
          HERO_HEIGHT + SCROLLABLE_HEIGHT * QUIZ_PERFECT_RATIO;
        const distance = Math.abs(scrollY - quizTargetY);

        // attraction range
        if (distance < 150 && distance > 5) {
          if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);

          // Snap after a short delay
          snapTimeoutRef.current = setTimeout(() => {
            isSnappingRef.current = true;
            window.scrollTo({
              top: quizTargetY,
              behavior: "smooth",
            });
            // Allow snapping again after animation
            setTimeout(() => {
              isSnappingRef.current = false;
            }, 600);
          }, 50);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      if (typeof window !== "undefined")
        window.history.scrollRestoration = "auto";
    };
  }, []);

  return (
    <Background scrollRef={scrollProgressRef} currentSection={currentSection} />
  );
}
