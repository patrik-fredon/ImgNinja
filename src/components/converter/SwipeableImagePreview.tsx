"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TouchOptimizedButton } from "@/components/ui/TouchOptimizedButton";
import { useSwipeGestures } from "@/hooks/useSwipeGestures";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useTranslations } from "next-intl";

interface SwipeableImagePreviewProps {
  originalFile: File;
  originalPreview: string;
  convertedBlob?: Blob;
  convertedPreview?: string;
  className?: string;
}

export function SwipeableImagePreview({
  originalFile,
  originalPreview,
  convertedBlob,
  convertedPreview,
  className = "",
}: SwipeableImagePreviewProps) {
  const t = useTranslations();
  const { isMobile, isTouchDevice } = useMobileDetection();
  const [showOriginal, setShowOriginal] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipeLeft = () => {
    if (convertedPreview && showOriginal) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowOriginal(false);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleSwipeRight = () => {
    if (!showOriginal) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowOriginal(true);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const { attachSwipeListeners } = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
    preventScroll: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (container && isTouchDevice) {
      return attachSwipeListeners(container);
    }
  }, [attachSwipeListeners, isTouchDevice]);

  const toggleView = (showOrig: boolean) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setShowOriginal(showOrig);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <Card variant="outlined" className={`${className} animate-fade-in`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Preview Comparison</span>
          {isTouchDevice && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              <span>Swipe to compare</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Touch-optimized Toggle Buttons */}
        <div className="flex gap-2">
          <TouchOptimizedButton
            variant={showOriginal ? "primary" : "outline"}
            size={isMobile ? "md" : "sm"}
            onClick={() => toggleView(true)}
            className="flex-1"
            hapticFeedback={true}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-current rounded-full opacity-60" />
              <span>Original</span>
            </div>
          </TouchOptimizedButton>
          <TouchOptimizedButton
            variant={!showOriginal && convertedPreview ? "primary" : "outline"}
            size={isMobile ? "md" : "sm"}
            onClick={() => toggleView(false)}
            disabled={!convertedPreview}
            className="flex-1"
            hapticFeedback={true}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-current rounded-full opacity-60" />
              <span>Converted</span>
            </div>
          </TouchOptimizedButton>
        </div>

        {/* Swipeable Image Container */}
        <div
          ref={containerRef}
          className={`relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer select-none ${
            isTouchDevice ? "touch-manipulation" : ""
          } ${isTransitioning ? "transition-transform duration-150" : ""}`}
        >
          {/* Swipe Indicators */}
          {isTouchDevice && (
            <>
              {showOriginal && convertedPreview && (
                <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <span>Swipe left</span>
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
              {!showOriginal && (
                <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>Swipe right</span>
                </div>
              )}
            </>
          )}

          {/* Image Display with Smooth Transitions */}
          <div
            className={`w-full h-full transition-all duration-300 ${
              isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"
            }`}
          >
            {showOriginal ? (
              <img
                src={originalPreview}
                alt={originalFile.name}
                className="w-full h-full object-contain"
                draggable={false}
              />
            ) : convertedPreview ? (
              <img
                src={convertedPreview}
                alt={`${originalFile.name} converted`}
                className="w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 opacity-50"
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
                  <p>Convert to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced File Info with Touch-Friendly Layout */}
        <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"} text-sm`}>
          <div
            className={`text-center p-4 bg-gray-50 rounded-lg ${
              isMobile ? "flex justify-between items-center" : ""
            }`}
          >
            <div className={isMobile ? "text-left" : ""}>
              <p className="text-gray-500 mb-1">Original</p>
              <p className="font-bold text-gray-900">{(originalFile.size / 1024).toFixed(1)} KB</p>
            </div>
            {isMobile && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-gray-600"
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
              </div>
            )}
          </div>

          {convertedBlob && (
            <div
              className={`text-center p-4 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-lg ${
                isMobile ? "flex justify-between items-center" : ""
              }`}
            >
              <div className={isMobile ? "text-left" : ""}>
                <p className="text-emerald-700 mb-1">Converted</p>
                <p className="font-bold text-emerald-900">
                  {(convertedBlob.size / 1024).toFixed(1)} KB
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {((1 - convertedBlob.size / originalFile.size) * 100).toFixed(1)}% smaller
                </p>
              </div>
              {isMobile && (
                <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-emerald-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile-specific comparison slider */}
        {isMobile && convertedPreview && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-600">Quick Compare</span>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleView(true)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    showOriginal ? "bg-brand-500" : "bg-gray-300"
                  }`}
                />
                <button
                  onClick={() => toggleView(false)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    !showOriginal ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
