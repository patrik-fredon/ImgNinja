"use client";

import { useEffect, useState } from "react";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { MobileStickyAd } from "./MobileStickyAd";
import { MobileInterstitialAd } from "./MobileInterstitialAd";
import { MobileAdAnalytics } from "./MobileAdAnalytics";
import { mobileAdOptimizer } from "@/lib/ads/mobile-optimizer";

interface MobileAdProviderProps {
  children: React.ReactNode;
  enableStickyAd?: boolean;
  enableInterstitialAd?: boolean;
  enableAnalytics?: boolean;
  stickyAdUnitId?: string;
  interstitialAdUnitId?: string;
  onAdClick?: (adType: string, position: string) => void;
  onAdImpression?: (adType: string, position: string) => void;
}

export function MobileAdProvider({
  children,
  enableStickyAd = true,
  enableInterstitialAd = true,
  enableAnalytics = true,
  stickyAdUnitId,
  interstitialAdUnitId,
  onAdClick,
  onAdImpression,
}: MobileAdProviderProps) {
  const { isMobile, isTablet } = useMobileDetection();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showStickyAd, setShowStickyAd] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);

  // Initialize mobile ad optimization
  useEffect(() => {
    if ((isMobile || isTablet) && !isInitialized) {
      mobileAdOptimizer.initialize();
      setIsInitialized(true);

      // Determine which ads to show based on optimization settings
      if (enableStickyAd && mobileAdOptimizer.shouldShowAd("stickyAd")) {
        setShowStickyAd(true);
      }

      if (enableInterstitialAd && mobileAdOptimizer.shouldShowAd("interstitialAd")) {
        setShowInterstitialAd(true);
      }
    }
  }, [isMobile, isTablet, isInitialized, enableStickyAd, enableInterstitialAd]);

  // Handle sticky ad events
  const handleStickyAdImpression = () => {
    mobileAdOptimizer.trackImpression("stickyAd");
    onAdImpression?.("sticky", "bottom");
  };

  const handleStickyAdClick = () => {
    mobileAdOptimizer.trackClick("stickyAd");
    onAdClick?.("sticky", "bottom");
  };

  const handleStickyAdDismiss = () => {
    setShowStickyAd(false);

    // Track dismissal analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_dismiss", {
        event_category: "mobile_ads",
        event_label: "sticky_ad",
        ad_format: "mobile_sticky",
      });
    }
  };

  // Handle interstitial ad events
  const handleInterstitialAdShow = () => {
    // Store timestamp for frequency control
    localStorage.setItem("last-interstitial-shown", Date.now().toString());
  };

  const handleInterstitialAdImpression = () => {
    mobileAdOptimizer.trackImpression("interstitialAd");
    onAdImpression?.("interstitial", "fullscreen");
  };

  const handleInterstitialAdClick = () => {
    mobileAdOptimizer.trackClick("interstitialAd");
    onAdClick?.("interstitial", "fullscreen");
  };

  const handleInterstitialAdDismiss = () => {
    setShowInterstitialAd(false);

    // Track dismissal analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_dismiss", {
        event_category: "mobile_ads",
        event_label: "interstitial_ad",
        ad_format: "mobile_interstitial",
      });
    }
  };

  // Handle analytics metrics updates
  const handleMetricsUpdate = (metrics: any) => {
    // Send metrics to external analytics services
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "mobile_ad_metrics", {
        event_category: "mobile_ads",
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        ctr: metrics.ctr,
        viewability: metrics.viewability,
        session_duration: metrics.sessionDuration,
        interaction_count: metrics.interactionCount,
      });
    }
  };

  // Don't render mobile ads on desktop
  if (!isMobile && !isTablet) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Mobile Ad Analytics */}
      {enableAnalytics && (
        <MobileAdAnalytics
          trackingId="mobile-ads-provider"
          enableDetailedTracking={true}
          onMetricsUpdate={handleMetricsUpdate}
        />
      )}

      {/* Sticky Ad */}
      {showStickyAd && (
        <MobileStickyAd
          adUnitId={stickyAdUnitId}
          enableDismiss={true}
          autoHideDelay={mobileAdOptimizer.getConfig().stickyAd.autoHideDelay}
          onImpression={handleStickyAdImpression}
          onClick={handleStickyAdClick}
          onDismiss={handleStickyAdDismiss}
          onError={(error) => {
            console.error("Sticky ad error:", error);
            setShowStickyAd(false);
          }}
        />
      )}

      {/* Interstitial Ad */}
      {showInterstitialAd && (
        <MobileInterstitialAd
          adUnitId={interstitialAdUnitId}
          trigger={mobileAdOptimizer.getConfig().interstitialAd.trigger}
          triggerDelay={mobileAdOptimizer.getConfig().interstitialAd.triggerDelay}
          interactionThreshold={mobileAdOptimizer.getConfig().interstitialAd.interactionThreshold}
          onShow={handleInterstitialAdShow}
          onImpression={handleInterstitialAdImpression}
          onClick={handleInterstitialAdClick}
          onDismiss={handleInterstitialAdDismiss}
          onError={(error) => {
            console.error("Interstitial ad error:", error);
            setShowInterstitialAd(false);
          }}
        />
      )}
    </>
  );
}
