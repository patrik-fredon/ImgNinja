"use client";

import { useEffect, useCallback, useRef } from "react";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface MobileAdMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  viewability: number;
  sessionDuration: number;
  interactionCount: number;
  scrollDepth: number;
  orientationChanges: number;
  adBlockerDetected: boolean;
}

interface MobileAdAnalyticsProps {
  trackingId?: string;
  enableDetailedTracking?: boolean;
  onMetricsUpdate?: (metrics: MobileAdMetrics) => void;
}

export function MobileAdAnalytics({
  trackingId = "mobile-ads",
  enableDetailedTracking = true,
  onMetricsUpdate,
}: MobileAdAnalyticsProps) {
  const { isMobile, isTablet, screenSize, orientation } = useMobileDetection();
  const metricsRef = useRef<MobileAdMetrics>({
    impressions: 0,
    clicks: 0,
    ctr: 0,
    viewability: 0,
    sessionDuration: 0,
    interactionCount: 0,
    scrollDepth: 0,
    orientationChanges: 0,
    adBlockerDetected: false,
  });

  const sessionStartRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const orientationRef = useRef<string>(orientation);
  const interactionTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize mobile ad tracking
  useEffect(() => {
    if (!isMobile && !isTablet) return;

    // Track session start
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "mobile_session_start", {
        event_category: "mobile_ads",
        device_type: isMobile ? "mobile" : "tablet",
        screen_size: screenSize,
        orientation: orientation,
      });
    }

    // Detect ad blocker
    detectAdBlocker();

    return () => {
      // Track session end
      const sessionDuration = Date.now() - sessionStartRef.current;
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "mobile_session_end", {
          event_category: "mobile_ads",
          session_duration: Math.round(sessionDuration / 1000),
          max_scroll_depth: maxScrollRef.current,
          interaction_count: metricsRef.current.interactionCount,
        });
      }
    };
  }, [isMobile, isTablet, screenSize, orientation]);

  // Track orientation changes
  useEffect(() => {
    if (orientationRef.current !== orientation) {
      metricsRef.current.orientationChanges++;
      orientationRef.current = orientation;

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "orientation_change", {
          event_category: "mobile_ads",
          new_orientation: orientation,
          change_count: metricsRef.current.orientationChanges,
        });
      }

      updateMetrics();
    }
  }, [orientation]);

  // Track scroll depth
  useEffect(() => {
    if (!enableDetailedTracking) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = scrollPercent;
        metricsRef.current.scrollDepth = scrollPercent;

        // Track milestone scroll depths
        if (scrollPercent >= 25 && scrollPercent < 50) {
          trackScrollMilestone(25);
        } else if (scrollPercent >= 50 && scrollPercent < 75) {
          trackScrollMilestone(50);
        } else if (scrollPercent >= 75 && scrollPercent < 90) {
          trackScrollMilestone(75);
        } else if (scrollPercent >= 90) {
          trackScrollMilestone(90);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enableDetailedTracking]);

  // Track user interactions
  useEffect(() => {
    if (!enableDetailedTracking) return;

    const handleInteraction = (event: Event) => {
      metricsRef.current.interactionCount++;

      // Debounce metrics updates
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }

      interactionTimeoutRef.current = setTimeout(() => {
        updateMetrics();
      }, 1000);

      // Track specific interaction types
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "mobile_interaction", {
          event_category: "mobile_ads",
          interaction_type: event.type,
          total_interactions: metricsRef.current.interactionCount,
        });
      }
    };

    const events = ["touchstart", "click", "scroll", "resize"];
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [enableDetailedTracking]);

  // Detect ad blocker
  const detectAdBlocker = useCallback(async () => {
    try {
      // Create a test ad element
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      testAd.className = "adsbox";
      testAd.style.position = "absolute";
      testAd.style.left = "-10000px";
      testAd.style.width = "1px";
      testAd.style.height = "1px";

      document.body.appendChild(testAd);

      // Check if ad blocker removed or modified the element
      setTimeout(() => {
        const isBlocked =
          testAd.offsetHeight === 0 ||
          testAd.style.display === "none" ||
          testAd.style.visibility === "hidden";

        metricsRef.current.adBlockerDetected = isBlocked;

        if (isBlocked && typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "ad_blocker_detected", {
            event_category: "mobile_ads",
            device_type: isMobile ? "mobile" : "tablet",
          });
        }

        document.body.removeChild(testAd);
        updateMetrics();
      }, 100);
    } catch (error) {
      console.warn("Ad blocker detection failed:", error);
    }
  }, [isMobile]);

  // Track scroll milestones
  const trackScrollMilestone = useCallback(
    (milestone: number) => {
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "scroll_milestone", {
          event_category: "mobile_ads",
          milestone: milestone,
          device_type: isMobile ? "mobile" : "tablet",
        });
      }
    },
    [isMobile]
  );

  // Update metrics and notify parent
  const updateMetrics = useCallback(() => {
    const currentTime = Date.now();
    metricsRef.current.sessionDuration = currentTime - sessionStartRef.current;

    // Calculate CTR
    if (metricsRef.current.impressions > 0) {
      metricsRef.current.ctr = (metricsRef.current.clicks / metricsRef.current.impressions) * 100;
    }

    onMetricsUpdate?.(metricsRef.current);
  }, [onMetricsUpdate]);

  // Public methods for tracking ad events
  const trackImpression = useCallback(
    (adType: string, position: string) => {
      metricsRef.current.impressions++;

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "mobile_ad_impression", {
          event_category: "mobile_ads",
          ad_type: adType,
          ad_position: position,
          device_type: isMobile ? "mobile" : "tablet",
          screen_size: screenSize,
          orientation: orientation,
        });
      }

      updateMetrics();
    },
    [isMobile, screenSize, orientation]
  );

  const trackClick = useCallback(
    (adType: string, position: string) => {
      metricsRef.current.clicks++;

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "mobile_ad_click", {
          event_category: "mobile_ads",
          ad_type: adType,
          ad_position: position,
          device_type: isMobile ? "mobile" : "tablet",
          screen_size: screenSize,
          orientation: orientation,
        });
      }

      updateMetrics();
    },
    [isMobile, screenSize, orientation]
  );

  const trackViewability = useCallback(
    (adType: string, viewabilityRatio: number) => {
      metricsRef.current.viewability = viewabilityRatio;

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "mobile_ad_viewability", {
          event_category: "mobile_ads",
          ad_type: adType,
          viewability_ratio: Math.round(viewabilityRatio * 100),
          device_type: isMobile ? "mobile" : "tablet",
        });
      }

      updateMetrics();
    },
    [isMobile]
  );

  // Expose tracking methods globally for use by ad components
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).mobileAdAnalytics = {
        trackImpression,
        trackClick,
        trackViewability,
        getMetrics: () => metricsRef.current,
      };
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).mobileAdAnalytics;
      }
    };
  }, [trackImpression, trackClick, trackViewability]);

  // This component doesn't render anything
  return null;
}
