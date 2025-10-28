"use client";

import { useState, useEffect } from "react";

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: "sm" | "md" | "lg" | "xl";
  orientation: "portrait" | "landscape";
}

export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: "lg",
    orientation: "landscape",
  });

  useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;

      // Screen size detection
      let screenSize: "sm" | "md" | "lg" | "xl" = "lg";
      if (width < 640) screenSize = "sm";
      else if (width < 768) screenSize = "md";
      else if (width < 1024) screenSize = "lg";
      else screenSize = "xl";

      // Device type detection
      const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTabletUA = /iPad|Android(?=.*Mobile)/i.test(userAgent);
      const isMobileWidth = width < 768;
      const isTabletWidth = width >= 768 && width < 1024;

      const isMobile = isMobileUA || isMobileWidth;
      const isTablet = isTabletUA || isTabletWidth;
      const isDesktop = !isMobile && !isTablet;

      // Touch device detection
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Orientation detection
      const orientation = height > width ? "portrait" : "landscape";

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        orientation,
      });
    };

    updateDetection();

    window.addEventListener("resize", updateDetection);
    window.addEventListener("orientationchange", updateDetection);

    return () => {
      window.removeEventListener("resize", updateDetection);
      window.removeEventListener("orientationchange", updateDetection);
    };
  }, []);

  return detection;
}
