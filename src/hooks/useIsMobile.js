
import { useState, useEffect } from 'react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // 1. Check screen width (Standard Tablet/Mobile breakpoint)
      const isSmallScreen = window.innerWidth <= 1024;

      // 2. Check for Touch Capability (Coarse pointer & No Hover) -> iPad Pro, Galaxy Tab
      // This catches large tablets that have mouse-like resolution but are touch-first
      const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

      // "Mobile Mode" is enabled if screen is small OR it's a touch device
      setIsMobile(isSmallScreen || isTouchDevice);
    };

    // Initial check
    checkIsMobile();

    // Event Listeners
    window.addEventListener('resize', checkIsMobile);
    
    // Some devices might change capabilities (e.g. detaching keyboard)
    window.matchMedia("(hover: none) and (pointer: coarse)").addEventListener('change', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.matchMedia("(hover: none) and (pointer: coarse)").removeEventListener('change', checkIsMobile);
    };
  }, []);

  return isMobile;
};

export default useIsMobile;
