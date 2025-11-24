import { useState, useEffect } from 'react';
import { getDeviceType, type DeviceType } from '@/config/responsive';

export const useResponsive = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      setDeviceType(getDeviceType(width));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    windowSize,
  };
};
