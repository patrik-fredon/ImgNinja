"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { adABTestingService, type AdVariant } from "@/lib/ads/ab-testing";
import { adPerformanceOptimizer } from "@/lib/ads/performance-optimizer";

export type AdSize =
  | "banner"
  | "leaderboard"
  | "rectangle"
  | "skyscraper"
  | "mobile-banner"
  | "responsive";
export type AdPosition = "header" | "sidebar" | "footer" | "inline" | "sticky" | "interstitial";

interface OptimizedAdPlacementProps {
  position: AdPosition;
  size?: AdSize;
  adUnitId?: string;
  className?: string;
  enableABTesting?: boolean;
  testId?: string;
  fallbackContent?: React.ReactNode;
  onImpression?: () => void;
  onClick?: () => void;
  onError?: (error: Error) => void;
}

interface AdDimensions {
  width: number;
  height: number;
  responsive?: boolean;
}

const AD_SIZE_CONFIG: Record<AdSize, AdDimensions> = {
  banner: { width: 728, height: 90 },
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  skyscraper: { width: 160, height: 600 },
  "mobile-banner": { width: 320, height: 50, responsive: true },
  responsive: { width: 320, height: 50, responsive: true },
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function OptimizedAdPlacement({
  position,
  size = "responsive",
  adUnitId,
  className = "",
  enableABTesting = false,
  testId,
  fallbackContent,
  onImpression,
  onClick,
  onError,
}: OptimizedAdPlacementProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [variant, setVariant] = useState<AdVariant | null>(null);
  const [userId] = useState(() => {
    // Generate or retrieve user ID for A/B testing
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("user-id");
      if (!id) {
        id = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("user-id", id);
      }
      return id;
    }
    return "anonymous";
  });

  const dimensions = AD_SIZE_CONFIG[size];
  const adId = `ad-${position}-${Date.now()}`;

  // A/B Testing Setup
  useEffect(() => {
    if (!enableABTesting || !testId) return;

    const test = adABTestingService.getActiveTest(position);
    if (test) {
      const userVariant = adABTestingService.getVariantForUser(test.id, userId);
      setVariant(userVariant);
    }
  }, [enableABTesting, testId, position, userId]);

  // Intersection Observer for lazy loading and viewability tracking
  useEffect(() => {
    if (!adRef.current) return;

    const observer = adPerformanceOptimizer.createIntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const visibilityRatio = entry.intersectionRatio;

        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          loadAd();
        }

        // Track viewability for performance metrics
        adPerformanceOptimizer.measureViewability(adId, visibilityRatio);

        // Track impression when ad becomes 50% visible
        if (visibilityRatio >= 0.5 && !hasError) {
          handleImpression();
        }
      });
    });

    if (observer && adRef.current) {
      observer.observe(adRef.current);
    }

    return () => {
      if (observer && adRef.current) {
        observer.unobserve(adRef.current);
      }
    };
  }, [adId, isVisible, hasError]);

  const loadAd = useCallback(async () => {
    if (!adUnitId || hasError) {
      setIsLoading(false);
      return;
    }

    const startTime = performance.now();

    try {
      // Wait for optimal loading conditions
      if (adRef.current) {
        await adPerformanceOptimizer.optimizeAdLoading(adRef.current);
      }

      // Load Google Ads script if not already loaded
      if (!window.adsbygoogle) {
        await loadGoogleAdsScript();
      }

      // Initialize ad
      if (window.adsbygoogle && adRef.current) {
        const adElement = adRef.current.querySelector(".adsbygoogle") as HTMLElement;
        if (adElement) {
          window.adsbygoogle.push({});

          // Measure render time
          adPerformanceOptimizer.measureAdRenderTime(adId, startTime);

          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to load ad:", error);
      setHasError(true);
      setIsLoading(false);
      onError?.(error as Error);
    }
  }, [adUnitId, hasError, adId, onError]);

  const loadGoogleAdsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.adsbygoogle) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      script.crossOrigin = "anonymous";

      script.onload = () => {
        window.adsbygoogle = window.adsbygoogle || [];
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load Google Ads script"));

      document.head.appendChild(script);
    });
  };

  const handleImpression = useCallback(() => {
    if (variant) {
      adABTestingService.trackImpression(variant.id);
    }
    onImpression?.();
  }, [variant, onImpression]);

  const handleClick = useCallback(() => {
    if (variant) {
      adABTestingService.trackClick(variant.id);
    }
    onClick?.();
  }, [variant, onClick]);

  // Apply variant styling if A/B testing is enabled
  const getVariantStyles = (): React.CSSProperties => {
    if (!variant) return {};

    const baseStyles: React.CSSProperties = {
      minWidth: dimensions.width,
      minHeight: dimensions.height,
    };

    switch (variant.config.position) {
      case "top":
        return { ...baseStyles, alignSelf: "flex-start" };
      case "bottom":
        return { ...baseStyles, alignSelf: "flex-end" };
      case "center":
        return { ...baseStyles, alignSelf: "center" };
      default:
        return baseStyles;
    }
  };

  const getVariantClasses = (): string => {
    if (!variant) return "";

    let classes = "";

    switch (variant.config.style) {
      case "native":
        classes += " bg-transparent border-none shadow-none";
        break;
      case "minimal":
        classes += " bg-gray-50 border border-gray-200 rounded-sm";
        break;
      default:
        classes += " bg-white border border-gray-300 rounded-md shadow-sm";
    }

    switch (variant.config.size) {
      case "small":
        classes += " scale-90";
        break;
      case "large":
        classes += " scale-110";
        break;
    }

    return classes;
  };

  // Don't render if variant timing is not met
  if (variant && variant.config.timing === "delayed" && !isVisible) {
    return null;
  }

  if (variant && variant.config.timing === "on-interaction") {
    // This would need additional interaction tracking
    // For now, treat as immediate
  }

  // Error state
  if (hasError) {
    return (
      fallbackContent || (
        <div
          className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md ${className}`}
          style={getVariantStyles()}
        >
          <span className="text-xs text-gray-400">Advertisement</span>
        </div>
      )
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md animate-pulse ${className} ${getVariantClasses()}`}
        style={getVariantStyles()}
        ref={adRef}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
          <span className="text-xs text-gray-400">Loading ad...</span>
        </div>
      </div>
    );
  }

  // Render actual ad
  return (
    <div
      ref={adRef}
      className={`flex items-center justify-center ${className} ${getVariantClasses()}`}
      style={getVariantStyles()}
      onClick={handleClick}
    >
      {adUnitId ? (
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            width: dimensions.responsive ? "100%" : dimensions.width,
            height: dimensions.height,
          }}
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID}
          data-ad-slot={adUnitId}
          data-ad-format={dimensions.responsive ? "auto" : "fixed"}
          data-full-width-responsive={dimensions.responsive ? "true" : "false"}
        />
      ) : (
        fallbackContent || (
          <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md w-full h-full">
            <span className="text-xs text-gray-500">Advertisement</span>
          </div>
        )
      )}
    </div>
  );
}
