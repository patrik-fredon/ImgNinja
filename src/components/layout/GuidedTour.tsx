"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { MicroInteraction } from "@/components/ui/MicroInteraction";

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

interface GuidedTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({ isActive, onComplete, onSkip }: GuidedTourProps) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  const tourSteps: TourStep[] = [
    {
      id: "upload",
      target: "[data-tour='file-upload']",
      title: t("tour.steps.upload.title"),
      content: t("tour.steps.upload.content"),
      position: "bottom",
    },
    {
      id: "format",
      target: "[data-tour='format-selector']",
      title: t("tour.steps.format.title"),
      content: t("tour.steps.format.content"),
      position: "top",
    },
    {
      id: "quality",
      target: "[data-tour='quality-control']",
      title: t("tour.steps.quality.title"),
      content: t("tour.steps.quality.content"),
      position: "top",
    },
    {
      id: "convert",
      target: "[data-tour='convert-button']",
      title: t("tour.steps.convert.title"),
      content: t("tour.steps.convert.content"),
      position: "top",
    },
  ];

  useEffect(() => {
    if (!isActive) return;

    const updateHighlight = () => {
      const currentStepData = tourSteps[currentStep];
      if (!currentStepData) return;

      const targetElement = document.querySelector(
        currentStepData.target
      ) as HTMLElement;
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const scrollX = window.pageXOffset;
        const scrollY = window.pageYOffset;

        setHighlightPosition({
          x: rect.left + scrollX - 8,
          y: rect.top + scrollY - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });

        // Scroll element into view
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    };

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight);

    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight);
    };
  }, [currentStep, isActive, tourSteps]);

  const handleNext = () => {
    const currentStepData = tourSteps[currentStep];
    if (currentStepData.action) {
      currentStepData.action();
    }

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    const currentStepData = tourSteps[currentStep];
    if (!currentStepData) return { x: 0, y: 0 };

    const { position } = currentStepData;
    const { x, y, width, height } = highlightPosition;

    switch (position) {
      case "top":
        return { x: x + width / 2, y: y - 20 };
      case "bottom":
        return { x: x + width / 2, y: y + height + 20 };
      case "left":
        return { x: x - 20, y: y + height / 2 };
      case "right":
        return { x: x + width + 20, y: y + height / 2 };
      default:
        return { x: x + width / 2, y: y - 20 };
    }
  };

  const getTooltipTransform = () => {
    const currentStepData = tourSteps[currentStep];
    if (!currentStepData) return "";

    const { position } = currentStepData;

    switch (position) {
      case "top":
        return "transform -translate-x-1/2 -translate-y-full";
      case "bottom":
        return "transform -translate-x-1/2";
      case "left":
        return "transform -translate-x-full -translate-y-1/2";
      case "right":
        return "transform -translate-y-1/2";
      default:
        return "transform -translate-x-1/2 -translate-y-full";
    }
  };

  if (!isActive || !tourSteps[currentStep]) return null;

  const currentStepData = tourSteps[currentStep];
  const tooltipPosition = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ pointerEvents: "auto" }}
        onClick={onSkip}
      />

      {/* Highlight */}
      <div
        className="absolute bg-white rounded-lg shadow-2xl transition-all duration-500 ease-out pointer-events-none"
        style={{
          left: highlightPosition.x,
          top: highlightPosition.y,
          width: highlightPosition.width,
          height: highlightPosition.height,
          boxShadow:
            "0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Tooltip */}
      <div
        className={`absolute z-60 pointer-events-auto ${getTooltipTransform()}`}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
      >
        <MicroInteraction variant="scale">
          <GlassCard
            variant="default"
            className="p-6 max-w-sm animate-slide-in-up"
          >
            {/* Step Counter */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                {t("tour.step")} {currentStep + 1} {t("tour.of")}{" "}
                {tourSteps.length}
              </div>
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 mb-6">{currentStepData.content}</p>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("tour.previous")}
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={onSkip}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t("tour.skip")}
                </button>
                <GlassButton variant="primary" size="sm" onClick={handleNext}>
                  {currentStep === tourSteps.length - 1
                    ? t("tour.finish")
                    : t("tour.next")}
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </MicroInteraction>
      </div>
    </div>
  );
}
