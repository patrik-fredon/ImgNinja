"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TouchOptimizedButton } from "@/components/ui/TouchOptimizedButton";
import { useSwipeGestures } from "@/hooks/useSwipeGestures";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import type { OutputFormat } from "@/types/formats";

interface MobileFormatSelectorProps {
  selectedFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  className?: string;
}

const FORMATS: Array<{
  value: OutputFormat;
  label: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
}> = [
  {
    value: "webp",
    label: "WebP",
    description: "Modern web format",
    icon: "🚀",
    color: "from-blue-500 to-blue-600",
    benefits: ["Smaller size", "Great quality", "Web optimized"],
  },
  {
    value: "avif",
    label: "AVIF",
    description: "Next-gen format",
    icon: "⚡",
    color: "from-purple-500 to-purple-600",
    benefits: ["Best compression", "Future-proof", "High quality"],
  },
  {
    value: "jpeg",
    label: "JPEG",
    description: "Universal format",
    icon: "📷",
    color: "from-green-500 to-green-600",
    benefits: ["Universal support", "Good for photos", "Reliable"],
  },
  {
    value: "png",
    label: "PNG",
    description: "Lossless format",
    icon: "🎨",
    color: "from-orange-500 to-orange-600",
    benefits: ["Transparency", "Lossless", "Graphics"],
  },
];

export function MobileFormatSelector({
  selectedFormat,
  onFormatChange,
  className = "",
}: MobileFormatSelectorProps) {
  const t = useTranslations();
  const { isMobile } = useMobileDetection();
  const [currentIndex, setCurrentIndex] = useState(
    FORMATS.findIndex((f) => f.value === selectedFormat)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipeLeft = () => {
    const nextIndex = (currentIndex + 1) % FORMATS.length;
    setCurrentIndex(nextIndex);
    onFormatChange(FORMATS[nextIndex].value);
  };

  const handleSwipeRight = () => {
    const prevIndex = currentIndex === 0 ? FORMATS.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    onFormatChange(FORMATS[prevIndex].value);
  };

  const { attachSwipeListeners } = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
    preventScroll: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (container && isMobile) {
      return attachSwipeListeners(container);
    }
  }, [attachSwipeListeners, isMobile]);

  const handleFormatSelect = (format: OutputFormat) => {
    const index = FORMATS.findIndex((f) => f.value === format);
    setCurrentIndex(index);
    onFormatChange(format);
  };

  const currentFormat = FORMATS[currentIndex];

  if (!isMobile) {
    // Desktop version - show all formats in a grid
    return (
      <Card variant="outlined" className={className}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("converter.format.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {FORMATS.map((format) => (
              <TouchOptimizedButton
                key={format.value}
                variant={selectedFormat === format.value ? "primary" : "outline"}
                size="md"
                onClick={() => handleFormatSelect(format.value)}
                className="flex flex-col items-center gap-2 p-4 h-auto"
                hapticFeedback={true}
              >
                <div className="text-2xl">{format.icon}</div>
                <div className="text-center">
                  <div className="font-semibold">{format.label}</div>
                  <div className="text-xs opacity-75">{format.description}</div>
                </div>
              </TouchOptimizedButton>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile version - swipeable carousel
  return (
    <Card variant="outlined" className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>{t("converter.format.title")}</span>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            <span>Swipe to change</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Format Display */}
        <div
          ref={containerRef}
          className="relative overflow-hidden cursor-pointer select-none touch-manipulation"
        >
          <div className="transition-all duration-300 ease-out">
            <div
              className={`p-6 rounded-xl bg-linear-to-br ${currentFormat.color} text-white text-center`}
            >
              <div className="text-4xl mb-3">{currentFormat.icon}</div>
              <h3 className="text-xl font-bold mb-1">{currentFormat.label}</h3>
              <p className="text-sm opacity-90 mb-4">{currentFormat.description}</p>

              {/* Benefits */}
              <div className="flex flex-wrap justify-center gap-2">
                {currentFormat.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Swipe Indicators */}
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
            {currentIndex > 0 && (
              <div className="bg-black/30 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>{FORMATS[currentIndex - 1].label}</span>
              </div>
            )}
            {currentIndex < FORMATS.length - 1 && (
              <div className="bg-black/30 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 ml-auto">
                <span>{FORMATS[currentIndex + 1].label}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Format Navigation Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {FORMATS.map((format, index) => (
            <button
              key={format.value}
              onClick={() => handleFormatSelect(format.value)}
              className={`w-3 h-3 rounded-full transition-all duration-200 touch-manipulation ${
                index === currentIndex ? "bg-brand-500 scale-125" : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Select ${format.label} format`}
            />
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <TouchOptimizedButton
            variant="outline"
            size="sm"
            onClick={handleSwipeRight}
            disabled={currentIndex === 0}
            className="flex items-center justify-center gap-2"
            hapticFeedback={true}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Previous</span>
          </TouchOptimizedButton>
          <TouchOptimizedButton
            variant="outline"
            size="sm"
            onClick={handleSwipeLeft}
            disabled={currentIndex === FORMATS.length - 1}
            className="flex items-center justify-center gap-2"
            hapticFeedback={true}
          >
            <span>Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </TouchOptimizedButton>
        </div>

        {/* Format Details */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Why choose {currentFormat.label}?</p>
            <ul className="text-xs space-y-1">
              {currentFormat.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-brand-500 rounded-full" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
