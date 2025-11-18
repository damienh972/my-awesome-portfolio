"use client";

import { useEffect, useState, useRef } from "react";
import { Background } from "./Background";

export function BackgroundWrapper() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const isSnapping = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const sectionHeight = windowHeight * 2;
      const section = Math.floor(scrollY / sectionHeight);
      const progressInSection = (scrollY % sectionHeight) / sectionHeight;

      setScrollProgress(progressInSection);
      setCurrentSection(section);

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Snap after user stops scrolling
      scrollTimeout.current = setTimeout(() => {
        if (isSnapping.current) return;

        const currentScrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const sectionHeight = windowHeight * 2;
        const blockchainCenterScroll = sectionHeight + windowHeight / 2;

        // Snap to top if close to top
        if (currentScrollY < windowHeight * 0.1) {
          isSnapping.current = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => { isSnapping.current = false; }, 800);
          return;
        }

        // Snap to blockchain section center if close
        if (Math.abs(currentScrollY - blockchainCenterScroll) < windowHeight * 0.4) {
          isSnapping.current = true;
          window.scrollTo({ top: blockchainCenterScroll, behavior: 'smooth' });
          setTimeout(() => { isSnapping.current = false; }, 800);
          return;
        }

        // Snap to next/previous section based on progress
        const currentSection = Math.floor(currentScrollY / sectionHeight);
        const progressInCurrentSection = (currentScrollY % sectionHeight) / sectionHeight;

        if (progressInCurrentSection > 0.7) {
          isSnapping.current = true;
          window.scrollTo({
            top: (currentSection + 1) * sectionHeight,
            behavior: 'smooth'
          });
          setTimeout(() => { isSnapping.current = false; }, 800);
        } else if (progressInCurrentSection < 0.3 && progressInCurrentSection > 0) {
          isSnapping.current = true;
          window.scrollTo({
            top: currentSection * sectionHeight,
            behavior: 'smooth'
          });
          setTimeout(() => { isSnapping.current = false; }, 800);
        }
      }, 100);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return <Background scrollProgress={scrollProgress} currentSection={currentSection} />;
}
