"use client";

import { useState, useEffect, type ReactElement } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ContextualAdBannerProps {
  context: "upload" | "conversion" | "download" | "error";
  className?: string;
  onClose?: () => void;
}

interface ContextualAdContent {
  title: string;
  description: string;
  ctaText: string;
  targetUrl: string;
  sponsor: string;
  icon: string;
  gradient: string;
}

const CONTEXTUAL_ADS: Record<string, ContextualAdContent[]> = {
  upload: [
    {
      title: "Organize Your Photos",
      description:
        "Keep your image library organized with smart tagging and folders.",
      ctaText: "Try Free",
      targetUrl: "#",
      sponsor: "PhotoManager",
      icon: "folder",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Backup Your Images",
      description: "Never lose your photos again with automatic cloud backup.",
      ctaText: "Get Started",
      targetUrl: "#",
      sponsor: "CloudBackup",
      icon: "cloud",
      gradient: "from-green-500 to-teal-500",
    },
  ],
  conversion: [
    {
      title: "Batch Processing Tools",
      description:
        "Convert hundreds of images at once with professional batch tools.",
      ctaText: "Learn More",
      targetUrl: "#",
      sponsor: "BatchPro",
      icon: "layers",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Advanced Compression",
      description: "Reduce file sizes by up to 90% without losing quality.",
      ctaText: "Try Now",
      targetUrl: "#",
      sponsor: "CompressMax",
      icon: "compress",
      gradient: "from-orange-500 to-red-500",
    },
  ],
  download: [
    {
      title: "Share Your Images",
      description:
        "Create shareable links and galleries for your converted images.",
      ctaText: "Share Now",
      targetUrl: "#",
      sponsor: "ShareHub",
      icon: "share",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      title: "Print Your Photos",
      description: "High-quality printing service for your converted images.",
      ctaText: "Order Prints",
      targetUrl: "#",
      sponsor: "PrintPro",
      icon: "printer",
      gradient: "from-pink-500 to-rose-500",
    },
  ],
  error: [
    {
      title: "Image Recovery Tools",
      description: "Recover and repair corrupted or damaged image files.",
      ctaText: "Fix Images",
      targetUrl: "#",
      sponsor: "RecoverPro",
      icon: "repair",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      title: "Format Converter Pro",
      description:
        "Handle any image format with our professional conversion tools.",
      ctaText: "Upgrade",
      targetUrl: "#",
      sponsor: "ConvertPro",
      icon: "refresh",
      gradient: "from-teal-500 to-green-500",
    },
  ],
};

const getIcon = (iconName: string) => {
  const icons: Record<string, ReactElement> = {
    folder: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    ),
    cloud: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
      />
    ),
    layers: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    ),
    compress: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
      />
    ),
    share: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
      />
    ),
    printer: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
      />
    ),
    repair: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
    ),
    refresh: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    ),
  };

  return icons[iconName] || icons.folder;
};

export function ContextualAdBanner({
  context,
  className = "",
  onClose,
}: ContextualAdBannerProps) {
  const [adContent, setAdContent] = useState<ContextualAdContent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const { trackAdImpression, trackAdClick } = useAnalytics();

  useEffect(() => {
    const contextAds = CONTEXTUAL_ADS[context];
    if (contextAds && contextAds.length > 0) {
      const randomAd =
        contextAds[Math.floor(Math.random() * contextAds.length)];
      setAdContent(randomAd);
      setIsVisible(true);
    }
  }, [context]);

  useEffect(() => {
    if (isVisible && adContent && !hasTrackedImpression) {
      trackAdImpression(
        `contextual-${context}`,
        `banner-${adContent.sponsor.toLowerCase()}`
      );
      setHasTrackedImpression(true);
    }
  }, [isVisible, adContent, hasTrackedImpression, context, trackAdImpression]);

  const handleAdClick = () => {
    if (adContent) {
      trackAdClick(
        `contextual-${context}`,
        `banner-${adContent.sponsor.toLowerCase()}`
      );
      console.log("Contextual ad clicked:", adContent.targetUrl);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !adContent) {
    return null;
  }

  return (
    <div
      className={`relative bg-linear-to-r ${adContent.gradient} rounded-lg p-4 text-white shadow-lg ${className}`}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Sponsored label */}
      <div className="mb-2">
        <span className="text-xs text-white/70 font-medium">Sponsored</span>
      </div>

      <div
        className="flex items-center space-x-4 cursor-pointer"
        onClick={handleAdClick}
      >
        {/* Icon */}
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {getIcon(adContent.icon)}
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">
            {adContent.title}
          </h3>
          <p className="text-xs text-white/90 mb-2 line-clamp-2">
            {adContent.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">
              by {adContent.sponsor}
            </span>
            <button className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md transition-colors backdrop-blur-sm">
              {adContent.ctaText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
