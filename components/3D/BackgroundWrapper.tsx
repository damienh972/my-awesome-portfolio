"use client";

import { useEffect, useState, useRef } from "react";
import { Background } from "./Background";

export function BackgroundWrapper() {
  const [currentSection, setCurrentSection] = useState(0);
  const scrollProgressRef = useRef(0);
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }

      snapTimeoutRef.current = setTimeout(() => {
        const transitionPoint = HERO_HEIGHT;
        const distance = Math.abs(scrollY - transitionPoint);

        if (distance < 50 && distance > 5) {
          window.scrollTo({
            top: transitionPoint,
            behavior: "smooth",
          });
        } else if (scrollY < 50 && scrollY > 5) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      if (typeof window !== "undefined") {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  return (
    <Background scrollRef={scrollProgressRef} currentSection={currentSection} />
  );
}
