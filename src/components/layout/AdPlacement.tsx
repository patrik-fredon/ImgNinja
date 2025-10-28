"use client";

import { useEffect, useRef, useState } from "react";

export type AdSlotType = "header" | "sidebar" | "footer";

interface AdPlacementProps {
  slot: AdSlotType;
  adUnitId?: string;
  className?: string;
}

interface AdDimensions {
  width: number;
  height: number;
}

// Ad slot configurations with fixed dimensions to prevent layout shift
const AD_SLOT_CONFIG: Record<AdSlotType, AdDimensions> = {
  header: { width: 728, height: 90 }, // Leaderboard
  sidebar: { width: 300, height: 250 }, // Medium Rectangle
  footer: { width: 728, height: 90 }, // Leaderboard
};

// Google Ads script loading state
let isGoogleAdsLoaded = false;
let isGoogleAdsLoading = false;
const loadingPromise: Promise<void> | null = null;

declare global {
  interface Window {
    adsbygoogle: any[];
    googletag: any;
  }
}

export function AdPlacement({
  slot,
  adUnitId,
  className = "",
}: AdPlacementProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(true);

  const dimensions = AD_SLOT_CONFIG[slot];

  // Check privacy preferences on mount
  useEffect(() => {
    const checkPrivacyPreferences = () => {
      // Check if user has disabled ads via privacy preferences
      // This could be localStorage, cookies, or other preference storage
      const adsDisabled = localStorage.getItem("ads-disabled") === "true";
      setAdsEnabled(!adsDisabled);
    };

    checkPrivacyPreferences();
  }, []);

  // Lazy load Google Ads script
  const loadGoogleAds = async (): Promise<void> => {
    if (isGoogleAdsLoaded) return;

    if (isGoogleAdsLoading) {
      // Wait for existing loading promise
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (isGoogleAdsLoaded) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    isGoogleAdsLoading = true;

    try {
      // Load Google AdSense script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.async = true;
        script.src =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        script.crossOrigin = "anonymous";

        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Google Ads script"));

        document.head.appendChild(script);
      });

      // Initialize adsbygoogle array if not exists
      window.adsbygoogle = window.adsbygoogle || [];

      isGoogleAdsLoaded = true;
      isGoogleAdsLoading = false;
    } catch (error) {
      console.error("Failed to load Google Ads:", error);
      isGoogleAdsLoading = false;
      throw error;
    }
  };

  // Initialize ad when component mounts and ads are enabled
  useEffect(() => {
    if (!adsEnabled || !adUnitId) {
      setIsLoading(false);
      return;
    }

    const initializeAd = async () => {
      try {
        await loadGoogleAds();

        // Push ad configuration to adsbygoogle
        if (window.adsbygoogle && adRef.current) {
          window.adsbygoogle.push({});
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize ad:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // Use setTimeout to ensure non-blocking initialization
    const timeoutId = setTimeout(initializeAd, 100);

    return () => clearTimeout(timeoutId);
  }, [adsEnabled, adUnitId]);

  // Don't render anything if ads are disabled by privacy preferences
  if (!adsEnabled) {
    return null;
  }

  // Error state
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <span className="text-xs text-gray-400">Ad failed to load</span>
      </div>
    );
  }

  // Loading state with placeholder
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md animate-pulse ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
          <span className="text-xs text-gray-400">Loading ad...</span>
        </div>
      </div>
    );
  }

  // Render actual ad
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {adUnitId ? (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: "inline-block",
            width: dimensions.width,
            height: dimensions.height,
          }}
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID}
          data-ad-slot={adUnitId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        // Fallback placeholder when no ad unit ID is provided
        <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md w-full h-full">
          <span className="text-sm text-gray-500">Advertisement</span>
        </div>
      )}
    </div>
  );
}
