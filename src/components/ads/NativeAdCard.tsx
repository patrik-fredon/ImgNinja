"use client";

import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface NativeAdCardProps {
  position: string;
  className?: string;
  showFallback?: boolean;
  fallbackContent?: React.ReactNode;
}

interface NativeAdContent {
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  targetUrl: string;
  sponsor: string;
}

const SAMPLE_NATIVE_ADS: NativeAdContent[] = [
  {
    title: "Professional Image Editing Made Easy",
    description:
      "Transform your photos with advanced editing tools. Perfect for photographers and designers.",
    imageUrl: "/api/placeholder/300/200",
    ctaText: "Try Free",
    targetUrl: "#",
    sponsor: "PhotoPro",
  },
  {
    title: "Cloud Storage for Your Images",
    description:
      "Secure, fast, and reliable cloud storage. Never lose your precious memories again.",
    imageUrl: "/api/placeholder/300/200",
    ctaText: "Get Started",
    targetUrl: "#",
    sponsor: "CloudVault",
  },
  {
    title: "Stock Photos & Graphics",
    description: "Millions of high-quality stock photos, vectors, and graphics for your projects.",
    imageUrl: "/api/placeholder/300/200",
    ctaText: "Browse Now",
    targetUrl: "#",
    sponsor: "StockHub",
  },
];

export function NativeAdCard({
  position,
  className = "",
  showFallback = true,
  fallbackContent,
}: NativeAdCardProps) {
  const [adContent, setAdContent] = useState<NativeAdContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { trackAdImpression, trackAdClick } = useAnalytics();

  useEffect(() => {
    loadNativeAd();
  }, [position]);

  useEffect(() => {
    if (adContent && isVisible) {
      trackAdImpression(position, `native-${adContent.sponsor.toLowerCase()}`);
    }
  }, [adContent, isVisible, position, trackAdImpression]);

  const loadNativeAd = async () => {
    try {
      setIsLoading(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For demo purposes, randomly select a native ad
      const randomAd = SAMPLE_NATIVE_ADS[Math.floor(Math.random() * SAMPLE_NATIVE_ADS.length)];
      setAdContent(randomAd);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load native ad:", error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleAdClick = () => {
    if (adContent) {
      trackAdClick(position, `native-${adContent.sponsor.toLowerCase()}`);
      // In a real implementation, this would open the target URL
      console.log("Native ad clicked:", adContent.targetUrl);
    }
  };

  const handleVisibilityChange = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(handleVisibilityChange, {
      threshold: 0.5,
    });

    const element = document.getElementById(`native-ad-${position}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [position]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse ${className}`}
      >
        <div className="flex space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError || !adContent) {
    if (showFallback) {
      return (
        fallbackContent || (
          <div
            className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}
          >
            <span className="text-sm text-gray-500">Sponsored Content</span>
          </div>
        )
      );
    }
    return null;
  }

  // Native ad content
  return (
    <div
      id={`native-ad-${position}`}
      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleAdClick}
    >
      {/* Sponsored label */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs text-gray-500 font-medium">Sponsored</span>
      </div>

      <div className="px-4 pb-4">
        <div className="flex space-x-4">
          {/* Ad image */}
          {adContent.imageUrl && (
            <div className="shrink-0">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={adContent.imageUrl}
                  alt={adContent.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Ad content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
              {adContent.title}
            </h3>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{adContent.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">by {adContent.sponsor}</span>
              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors">
                {adContent.ctaText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
