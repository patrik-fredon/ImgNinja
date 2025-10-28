"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { MicroInteraction } from "@/components/ui/MicroInteraction";
import { Typography } from "@/components/ui/Typography";

interface FeatureIntroductionProps {
  onStartTour: () => void;
  onDismiss: () => void;
}

export function FeatureIntroduction({
  onStartTour,
  onDismiss,
}: FeatureIntroductionProps) {
  const t = useTranslations();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      title: t("features.privacy.title"),
      description: t("features.privacy.description"),
      color: "text-blue-600",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
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
      ),
      title: t("features.speed.title"),
      description: t("features.speed.description"),
      color: "text-yellow-600",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      title: t("features.quality.title"),
      description: t("features.quality.description"),
      color: "text-green-600",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      title: t("features.batch.title"),
      description: t("features.batch.description"),
      color: "text-purple-600",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <MicroInteraction variant="scale">
        <GlassCard
          variant="default"
          className={`max-w-md w-full p-8 animate-slide-in-up transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <Typography variant="title" className="mb-2">
              {t("introduction.welcome")}
            </Typography>
            <Typography variant="body" className="text-gray-600">
              {t("introduction.subtitle")}
            </Typography>
          </div>

          {/* Feature Showcase */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div
                className={`p-4 rounded-full bg-linear-to-br from-white to-gray-50 ${features[currentFeature].color} animate-pulse-glow`}
              >
                {features[currentFeature].icon}
              </div>
            </div>

            <div className="text-center min-h-[120px] flex flex-col justify-center">
              <Typography
                variant="body"
                className="font-semibold mb-2 animate-fade-in"
              >
                {features[currentFeature].title}
              </Typography>
              <Typography
                variant="body"
                className="text-gray-600 text-sm animate-fade-in"
              >
                {features[currentFeature].description}
              </Typography>
            </div>

            {/* Feature Indicators */}
            <div className="flex justify-center space-x-2 mt-4">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentFeature
                      ? "bg-gradient-brand w-6"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <GlassButton
              variant="primary"
              size="lg"
              onClick={onStartTour}
              className="w-full animate-pulse-glow"
            >
              {t("introduction.startTour")}
            </GlassButton>

            <button
              onClick={handleDismiss}
              className="w-full py-3 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t("introduction.skipTour")}
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
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
        </GlassCard>
      </MicroInteraction>
    </div>
  );
}
