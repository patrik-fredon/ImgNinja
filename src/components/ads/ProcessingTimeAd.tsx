"use client";

import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ProcessingTimeAdProps {
  isProcessing: boolean;
  processingProgress: number;
  estimatedTimeRemaining: number;
  className?: string;
}

interface ProcessingAdContent {
  title: string;
  description: string;
  ctaText: string;
  targetUrl: string;
  sponsor: string;
  relevantToProcessing: boolean;
}

const PROCESSING_ADS: ProcessingAdContent[] = [
  {
    title: "Speed Up Your Workflow",
    description: "Professional batch processing tools for photographers and designers.",
    ctaText: "Learn More",
    targetUrl: "#",
    sponsor: "WorkflowPro",
    relevantToProcessing: true,
  },
  {
    title: "Optimize Your Images",
    description: "Advanced compression algorithms that maintain quality while reducing file size.",
    ctaText: "Try Now",
    targetUrl: "#",
    sponsor: "ImageOptim",
    relevantToProcessing: true,
  },
  {
    title: "Cloud Processing Power",
    description: "Convert images faster with our cloud-based processing infrastructure.",
    ctaText: "Get Started",
    targetUrl: "#",
    sponsor: "CloudConvert",
    relevantToProcessing: true,
  },
];

export function ProcessingTimeAd({
  isProcessing,
  processingProgress,
  estimatedTimeRemaining,
  className = "",
}: ProcessingTimeAdProps) {
  const [adContent, setAdContent] = useState<ProcessingAdContent | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const { trackAdImpression, trackAdClick } = useAnalytics();

  useEffect(() => {
    if (isProcessing && estimatedTimeRemaining > 2000) {
      // Show ad if processing takes more than 2 seconds
      const timer = setTimeout(() => {
        const relevantAds = PROCESSING_ADS.filter((ad) => ad.relevantToProcessing);
        const randomAd = relevantAds[Math.floor(Math.random() * relevantAds.length)];
        setAdContent(randomAd);
        setShowAd(true);
      }, 1000); // Show ad after 1 second of processing

      return () => clearTimeout(timer);
    } else {
      setShowAd(false);
      setHasTrackedImpression(false);
    }
  }, [isProcessing, estimatedTimeRemaining]);

  useEffect(() => {
    if (showAd && adContent && !hasTrackedImpression) {
      trackAdImpression("processing", `contextual-${adContent.sponsor.toLowerCase()}`);
      setHasTrackedImpression(true);
    }
  }, [showAd, adContent, hasTrackedImpression, trackAdImpression]);

  const handleAdClick = () => {
    if (adContent) {
      trackAdClick("processing", `contextual-${adContent.sponsor.toLowerCase()}`);
      console.log("Processing ad clicked:", adContent.targetUrl);
    }
  };

  if (!showAd || !adContent || !isProcessing) {
    return null;
  }

  return (
    <div
      className={`bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      {/* Processing indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Processing your image...</span>
          <span className="text-sm text-gray-500">{Math.round(processingProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Estimated time remaining: {Math.ceil(estimatedTimeRemaining / 1000)}s
        </div>
      </div>

      {/* Sponsored content label */}
      <div className="mb-2">
        <span className="text-xs text-gray-500 font-medium">While you wait - Sponsored</span>
      </div>

      {/* Ad content */}
      <div
        className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleAdClick}
      >
        <div className="flex items-start space-x-3">
          {/* Icon placeholder */}
          <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{adContent.title}</h4>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{adContent.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">by {adContent.sponsor}</span>
              <button className="text-xs bg-linear-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all">
                {adContent.ctaText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Processing tip */}
      <div className="mt-3 p-2 bg-blue-100 rounded-md">
        <div className="flex items-start space-x-2">
          <svg
            className="w-4 h-4 text-blue-600 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> For faster processing, try reducing image size or using a
            different format.
          </p>
        </div>
      </div>
    </div>
  );
}
