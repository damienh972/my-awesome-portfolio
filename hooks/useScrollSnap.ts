import { useEffect, useRef } from 'react';
import { ANIMATION_CONFIG } from '@/config/animation';

interface ScrollSnapOptions {
  snapRatio: number;
  offsetY: number;
  enabled: boolean;
}

export const useScrollSnap = ({ snapRatio, offsetY, enabled }: ScrollSnapOptions) => {
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSnappingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleSnap = (scrollY: number, targetY: number) => {
      const distance = Math.abs(scrollY - targetY);

      if (distance < ANIMATION_CONFIG.scroll.hero.snapThreshold &&
          distance > ANIMATION_CONFIG.scroll.hero.snapDistance &&
          !isSnappingRef.current) {

        if (snapTimeoutRef.current) {
          clearTimeout(snapTimeoutRef.current);
        }

        snapTimeoutRef.current = setTimeout(() => {
          isSnappingRef.current = true;
          window.scrollTo({
            top: targetY,
            behavior: 'smooth',
          });

          setTimeout(() => {
            isSnappingRef.current = false;
          }, ANIMATION_CONFIG.scroll.hero.snapDuration);
        }, ANIMATION_CONFIG.scroll.hero.snapDelay);
      }
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const targetY = offsetY + snapRatio * window.innerHeight;
      handleSnap(scrollY, targetY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
    };
  }, [snapRatio, offsetY, enabled]);
};
