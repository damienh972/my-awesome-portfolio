"use client";

import { useEffect, useState } from "react";
import { Background } from "./Background";

export function BackgroundWrapper() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const progress = scrollY / windowHeight;

      setScrollProgress(progress);
      setCurrentSection(Math.floor(progress));
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", throttledScroll, { passive: true });

    return () => window.removeEventListener("scroll", throttledScroll);
  }, []);

  return (
    <Background
      scrollProgress={scrollProgress}
      currentSection={currentSection}
    />
  );
}
