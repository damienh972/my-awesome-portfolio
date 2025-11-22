"use client";

import { useEffect, useState, useRef } from "react";
import { Background } from "./Background";

export function BackgroundWrapper() {

  const [currentSection, setCurrentSection] = useState(0);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const sectionHeight = windowHeight * 2;

      const section = Math.floor(scrollY / sectionHeight);
      let progressInSection = (scrollY % sectionHeight) / sectionHeight;

      // Temporarily clamp progress for sections > 1
      if (section > 1) {
        progressInSection = 1;
      }

      scrollProgressRef.current = progressInSection;

      setCurrentSection((prev) => {
        if (prev !== section && section <= 1) return section;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <Background scrollRef={scrollProgressRef} currentSection={currentSection} />;
}