"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { OptimizedAdPlacement } from "./OptimizedAdPlacement";
// Simple X icon component
const XIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
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

interface MobileStickyAdProps {
  adUnitId?: string;
  className?: string;
  enableDismiss?: boolean;
  autoHideDelay?: number;
  onImpression?: () => void;
  onClick?: () => void;
  onDismiss?: () => void;
  onError?: (error: Error) => void;
}

export function MobileStickyAd({
  adUnitId,
  className = "",
  enableDismiss = true,
  autoHideDelay,
  onImpression,
  onClick,
  onDismiss,
  onError,
}: MobileStickyAdProps) {
  const { isMobile, isTouchDevice } = useMobileDetection();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const autoHideTimeoutRef = useRef<NodeJS.Timeout>();

  // Only show on mobile devices
  useEffect(() => {
    if (isMobile && !isDismissed) {
      // Delay initial appearance to avoid interfering with page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isMobile, isDismissed]);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHideDelay && isVisible) {
      autoHideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => {
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
        }
      };
    }
  }, [autoHideDelay, isVisible]);

  // Hide during scrolling for better UX
  useEffect(() => {
    if (!isTouchDevice) return;

    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isTouchDevice]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    setIsVisible(false);
    onDismiss?.();

    // Store dismissal in localStorage to persist across sessions
    localStorage.setItem("mobile-sticky-ad-dismissed", "true");
  }, [onDismiss]);

  const handleAdClick = useCallback(() => {
    onClick?.();
    // Track mobile-specific click analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_click", {
        event_category: "mobile_ads",
        event_label: "sticky_ad",
        ad_format: "mobile_sticky",
      });
    }
  }, [onClick]);

  const handleAdImpression = useCallback(() => {
    onImpression?.();
    // Track mobile-specific impression analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_impression", {
        event_category: "mobile_ads",
        event_label: "sticky_ad",
        ad_format: "mobile_sticky",
      });
    }
  }, [onImpression]);

  // Check if user has previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("mobile-sticky-ad-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Don't render if not mobile or dismissed
  if (!isMobile || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isScrolling ? "translate-y-full" : "translate-y-0"
      } ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="relative flex items-center justify-center p-2">
        {enableDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-1 right-1 p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors z-10"
            aria-label="Close ad"
          >
            <XIcon size={14} className="text-gray-600" />
          </button>
        )}

        <div className="w-full max-w-sm">
          <OptimizedAdPlacement
            position="sticky"
            size="mobile-banner"
            adUnitId={adUnitId}
            className="w-full"
            onImpression={handleAdImpression}
            onClick={handleAdClick}
            onError={onError}
            fallbackContent={
              <div className="flex items-center justify-center h-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-md border border-gray-200">
                <span className="text-xs text-gray-500">Advertisement</span>
              </div>
            }
          />
        </div>
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}
