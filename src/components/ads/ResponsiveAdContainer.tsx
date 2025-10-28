"use client";

import { useState, useEffect } from "react";
import { OptimizedAdPlacement, type AdPosition, type AdSize } from "./OptimizedAdPlacement";

interface ResponsiveAdContainerProps {
  position: AdPosition;
  adUnitId?: string;
  className?: string;
  enableABTesting?: boolean;
  testId?: string;
  fallbackContent?: React.ReactNode;
  onImpression?: () => void;
  onClick?: () => void;
  onError?: (error: Error) => void;
}

interface BreakpointConfig {
  minWidth: number;
  size: AdSize;
  priority: number;
}

const RESPONSIVE_BREAKPOINTS: Record<AdPosition, BreakpointConfig[]> = {
  header: [
    { minWidth: 0, size: "mobile-banner", priority: 1 },
    { minWidth: 768, size: "banner", priority: 2 },
    { minWidth: 1024, size: "leaderboard", priority: 3 },
  ],
  sidebar: [
    { minWidth: 0, size: "mobile-banner", priority: 1 },
    { minWidth: 768, size: "rectangle", priority: 2 },
    { minWidth: 1200, size: "skyscraper", priority: 3 },
  ],
  footer: [
    { minWidth: 0, size: "mobile-banner", priority: 1 },
    { minWidth: 768, size: "banner", priority: 2 },
    { minWidth: 1024, size: "leaderboard", priority: 3 },
  ],
  inline: [
    { minWidth: 0, size: "mobile-banner", priority: 1 },
    { minWidth: 768, size: "rectangle", priority: 2 },
  ],
  sticky: [
    { minWidth: 0, size: "mobile-banner", priority: 1 },
    { minWidth: 768, size: "banner", priority: 2 },
  ],
  interstitial: [
    { minWidth: 0, size: "rectangle", priority: 1 },
    { minWidth: 768, size: "leaderboard", priority: 2 },
  ],
};

export function ResponsiveAdContainer({
  position,
  adUnitId,
  className = "",
  enableABTesting = false,
  testId,
  fallbackContent,
  onImpression,
  onClick,
  onError,
}: ResponsiveAdContainerProps) {
  const [currentSize, setCurrentSize] = useState<AdSize>("mobile-banner");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const updateAdSize = () => {
      const width = window.innerWidth;
      const breakpoints = RESPONSIVE_BREAKPOINTS[position];

      // Find the best matching breakpoint
      let bestMatch = breakpoints[0];
      for (const breakpoint of breakpoints) {
        if (width >= breakpoint.minWidth && breakpoint.priority > bestMatch.priority) {
          bestMatch = breakpoint;
        }
      }

      setCurrentSize(bestMatch.size);
    };

    updateAdSize();
    window.addEventListener("resize", updateAdSize);

    return () => {
      window.removeEventListener("resize", updateAdSize);
    };
  }, [position, isClient]);

  // Server-side rendering fallback
  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md animate-pulse ${className}`}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
          <span className="text-xs text-gray-400">Loading ad...</span>
        </div>
      </div>
    );
  }

  return (
    <OptimizedAdPlacement
      position={position}
      size={currentSize}
      adUnitId={adUnitId}
      className={className}
      enableABTesting={enableABTesting}
      testId={testId}
      fallbackContent={fallbackContent}
      onImpression={onImpression}
      onClick={onClick}
      onError={onError}
    />
  );
}
