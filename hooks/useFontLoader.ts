import { useState, useEffect } from 'react';

export const useFontLoader = (fontName: string, weight: number = 400, size: number = 100) => {
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === 'undefined' || !document.fonts) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !document.fonts) {
      return;
    }

    const fontString = `${weight} ${size}px ${fontName}`;

    document.fonts
      .load(fontString)
      .then(() => setLoaded(true))
      .catch(() => setLoaded(true));
  }, [fontName, weight, size]);

  return loaded;
};
