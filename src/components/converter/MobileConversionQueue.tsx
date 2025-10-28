"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TouchOptimizedButton } from "@/components/ui/TouchOptimizedButton";
import { useSwipeGestures } from "@/hooks/useSwipeGestures";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import type { ConversionItem } from "@/components/converter/ConversionQueue";

interface MobileConversionQueueProps {
  items: ConversionItem[];
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
  className?: string;
}

export function MobileConversionQueue({
  items,
  onRemove,
  onDownload,
  onDownloadAll,
  className = "",
}: MobileConversionQueueProps) {
  const t = useTranslations();
  const { isMobile } = useMobileDetection();
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const completedItems = items.filter((item) => item.status === "complete");
  const processingItems = items.filter((item) => item.status === "processing");
  const pendingItems = items.filter((item) => item.status === "pending");
  const errorItems = items.filter((item) => item.status === "error");

  const handleSwipeLeft = (itemId: string) => {
    setSwipedItemId(itemId);
    // Auto-hide swipe actions after 3 seconds
    setTimeout(() => {
      if (swipedItemId === itemId) {
        setSwipedItemId(null);
      }
    }, 3000);
  };

  const handleSwipeRight = () => {
    setSwipedItemId(null);
  };

  const { attachSwipeListeners } = useSwipeGestures({
    onSwipeLeft: () => {}, // Will be handled per item
    onSwipeRight: handleSwipeRight,
    threshold: 80,
    preventScroll: false,
  });

  const renderQueueItem = (item: ConversionItem) => {
    const isSwipedOut = swipedItemId === item.id;

    return (
      <div
        key={item.id}
        ref={(el) => {
          if (el) {
            itemRefs.current.set(item.id, el);
          }
        }}
        className="relative overflow-hidden"
      >
        {/* Swipe Actions Background */}
        {isSwipedOut && (
          <div className="absolute inset-0 bg-linear-to-r from-red-500 to-red-600 flex items-center justify-end px-4 z-10">
            <div className="flex gap-2">
              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDownload(item.id);
                  setSwipedItemId(null);
                }}
                className="bg-white/20 text-white border-white/30"
                disabled={item.status !== "complete"}
                hapticFeedback={true}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </TouchOptimizedButton>
              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  onRemove(item.id);
                  setSwipedItemId(null);
                }}
                className="bg-white/20 text-white border-white/30"
                hapticFeedback={true}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </TouchOptimizedButton>
            </div>
          </div>
        )}

        {/* Main Item Content */}
        <Card
          variant="outlined"
          className={`transition-transform duration-300 ${
            isSwipedOut ? "-translate-x-32" : "translate-x-0"
          } ${item.status === "complete" ? "border-emerald-200 bg-emerald-50/50" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="shrink-0">
                {item.status === "processing" && (
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-brand-600 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                )}
                {item.status === "complete" && (
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-emerald-600"
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
                {item.status === "error" && (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-600"
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
                  </div>
                )}
                {item.status === "pending" && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{(item.file.size / 1024).toFixed(1)} KB</span>
                  <span>→</span>
                  <span className="uppercase font-medium">{item.outputFormat}</span>
                  {item.outputSize && (
                    <>
                      <span>→</span>
                      <span className="text-emerald-600 font-medium">
                        {(item.outputSize / 1024).toFixed(1)} KB
                      </span>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {item.status === "processing" && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-brand h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.progress}%</p>
                  </div>
                )}

                {/* Error Message */}
                {item.status === "error" && item.error && (
                  <p className="text-xs text-red-600 mt-1">{item.error}</p>
                )}
              </div>

              {/* Swipe Indicator */}
              {isMobile && !isSwipedOut && (
                <div className="shrink-0 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </CardContent>
        </Card>
      </div>
    );
  };

  // Attach swipe listeners to each item
  useEffect(() => {
    if (!isMobile) return;

    const cleanupFunctions: (() => void)[] = [];

    items.forEach((item) => {
      const element = itemRefs.current.get(item.id);
      if (element) {
        const { attachSwipeListeners: attachItemSwipe } = useSwipeGestures({
          onSwipeLeft: () => handleSwipeLeft(item.id),
          onSwipeRight: handleSwipeRight,
          threshold: 80,
          preventScroll: false,
        });

        const cleanup = attachItemSwipe(element);
        if (cleanup) {
          cleanupFunctions.push(cleanup);
        }
      }
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [items, isMobile]);

  if (items.length === 0) return null;

  return (
    <Card variant="outlined" className={`${className} animate-scale-in`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Conversion Queue ({items.length})</span>
          {completedItems.length > 1 && (
            <TouchOptimizedButton
              variant="outline"
              size="sm"
              onClick={onDownloadAll}
              className="text-xs"
              hapticFeedback={true}
            >
              Download All
            </TouchOptimizedButton>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Processing Items */}
        {processingItems.map(renderQueueItem)}

        {/* Pending Items */}
        {pendingItems.map(renderQueueItem)}

        {/* Completed Items */}
        {completedItems.map(renderQueueItem)}

        {/* Error Items */}
        {errorItems.map(renderQueueItem)}

        {/* Mobile Instructions */}
        {isMobile && items.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              <span>Swipe left on items for actions</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
