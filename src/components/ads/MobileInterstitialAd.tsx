"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { OptimizedAdPlacement } from "./OptimizedAdPlacement";
// Simple X icon component
const XIcon = ({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

interface MobileInterstitialAdProps {
  adUnitId?: string;
  className?: string;
  trigger?: "time" | "interaction" | "conversion" | "manual";
  triggerDelay?: number;
  interactionThreshold?: number;
  onShow?: () => void;
  onDismiss?: () => void;
  onImpression?: () => void;
  onClick?: () => void;
  onError?: (error: Error) => void;
}

interface InterstitialState {
  isVisible: boolean;
  canShow: boolean;
  interactionCount: number;
  lastShown: number;
}

export function MobileInterstitialAd({
  adUnitId,
  className = "",
  trigger = "interaction",
  triggerDelay = 30000, // 30 seconds
  interactionThreshold = 3,
  onShow,
  onDismiss,
  onImpression,
  onClick,
  onError,
}: MobileInterstitialAdProps) {
  const { isMobile, isTouchDevice } = useMobileDetection();
  const [state, setState] = useState<InterstitialState>({
    isVisible: false,
    canShow: true,
    interactionCount: 0,
    lastShown: 0,
  });

  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum time between interstitials (5 minutes)
  const MIN_INTERVAL = 5 * 60 * 1000;

  // Check if enough time has passed since last interstitial
  const canShowInterstitial = useCallback(() => {
    const now = Date.now();
    const lastShown = parseInt(
      localStorage.getItem("last-interstitial") || "0"
    );
    return now - lastShown > MIN_INTERVAL;
  }, []);

  // Time-based trigger
  useEffect(() => {
    if (!isMobile || trigger !== "time" || !state.canShow) return;

    if (canShowInterstitial()) {
      triggerTimeoutRef.current = setTimeout(() => {
        showInterstitial();
      }, triggerDelay);
    }

    return () => {
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
      }
    };
  }, [isMobile, trigger, triggerDelay, state.canShow]);

  // Interaction-based trigger
  useEffect(() => {
    if (!isMobile || trigger !== "interaction" || !state.canShow) return;

    const handleInteraction = () => {
      setState((prev) => {
        const newCount = prev.interactionCount + 1;

        if (newCount >= interactionThreshold && canShowInterstitial()) {
          // Delay showing to avoid interrupting user action
          if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
          }

          interactionTimeoutRef.current = setTimeout(() => {
            showInterstitial();
          }, 1000);

          return { ...prev, interactionCount: 0 };
        }

        return { ...prev, interactionCount: newCount };
      });
    };

    const events = ["click", "touchstart", "scroll"];
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
  }, [isMobile, trigger, interactionThreshold, state.canShow]);

  const showInterstitial = useCallback(() => {
    if (!state.canShow || !canShowInterstitial()) return;

    setState((prev) => ({
      ...prev,
      isVisible: true,
      lastShown: Date.now(),
    }));

    // Store timestamp
    localStorage.setItem("last-interstitial", Date.now().toString());

    // Track analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "interstitial_show", {
        event_category: "mobile_ads",
        event_label: "interstitial_ad",
        ad_format: "mobile_interstitial",
        trigger_type: trigger,
      });
    }

    onShow?.();
  }, [state.canShow, trigger, onShow]);

  const hideInterstitial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isVisible: false,
    }));

    // Track analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "interstitial_dismiss", {
        event_category: "mobile_ads",
        event_label: "interstitial_ad",
        ad_format: "mobile_interstitial",
      });
    }

    onDismiss?.();
  }, [onDismiss]);

  const handleAdClick = useCallback(() => {
    onClick?.();

    // Track mobile-specific click analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_click", {
        event_category: "mobile_ads",
        event_label: "interstitial_ad",
        ad_format: "mobile_interstitial",
      });
    }
  }, [onClick]);

  const handleAdImpression = useCallback(() => {
    onImpression?.();

    // Track mobile-specific impression analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_impression", {
        event_category: "mobile_ads",
        event_label: "interstitial_ad",
        ad_format: "mobile_interstitial",
      });
    }
  }, [onImpression]);

  // Manual trigger method (can be called from parent)
  const show = useCallback(() => {
    if (isMobile && canShowInterstitial()) {
      showInterstitial();
    }
  }, [isMobile, showInterstitial]);

  // Expose show method via ref
  useEffect(() => {
    if (trigger === "manual") {
      (window as any).showMobileInterstitial = show;
    }

    return () => {
      if (trigger === "manual") {
        delete (window as any).showMobileInterstitial;
      }
    };
  }, [trigger, show]);

  // Don't render if not mobile or not visible
  if (!isMobile || !state.isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${className}`}
      style={{
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        onClick={hideInterstitial}
        aria-label="Close interstitial"
      />

      {/* Ad Container */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={hideInterstitial}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close ad"
        >
          <XIcon size={16} className="text-gray-600" />
        </button>

        {/* Ad Content */}
        <div className="p-4 pt-12">
          <OptimizedAdPlacement
            position="interstitial"
            size="rectangle"
            adUnitId={adUnitId}
            className="w-full"
            onImpression={handleAdImpression}
            onClick={handleAdClick}
            onError={onError}
            fallbackContent={
              <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-gray-200">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Ad</span>
                  </div>
                  <p className="text-sm text-gray-600">Advertisement</p>
                  <p className="text-xs text-gray-400">
                    Support our free service
                  </p>
                </div>
              </div>
            }
          />
        </div>

        {/* Skip Button */}
        <div className="px-4 pb-4">
          <button
            onClick={hideInterstitial}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Continue to ImgNinja
          </button>
        </div>
      </div>
    </div>
  );
}
