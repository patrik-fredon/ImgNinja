"use client";

import { useCallback } from "react";
import { conversionTracker } from "@/lib/analytics/conversion-tracker";
import { revenueTracker } from "@/lib/analytics/revenue-tracker";

export function useAnalytics() {
  const trackFileUpload = useCallback((fileCount: number, totalSize: number, formats: string[]) => {
    conversionTracker.trackFileUpload(fileCount, totalSize, formats);
  }, []);

  const trackConversionStart = useCallback(
    (inputFormat: string, outputFormat: string, fileSize: number) => {
      conversionTracker.trackConversionStart(inputFormat, outputFormat, fileSize);
    },
    []
  );

  const trackConversionComplete = useCallback(
    (
      inputFormat: string,
      outputFormat: string,
      originalSize: number,
      convertedSize: number,
      processingTime: number
    ) => {
      conversionTracker.trackConversionComplete(
        inputFormat,
        outputFormat,
        originalSize,
        convertedSize,
        processingTime
      );
    },
    []
  );

  const trackDownload = useCallback((format: string, fileSize: number) => {
    conversionTracker.trackDownload(format, fileSize);
  }, []);

  const trackAdClick = useCallback((adPosition: string, adId?: string) => {
    conversionTracker.trackAdClick(adPosition, adId);
    revenueTracker.trackAdClick(adPosition, adId);
  }, []);

  const trackAdImpression = useCallback((adPosition: string, adId?: string) => {
    revenueTracker.trackAdImpression(adPosition, adId);
  }, []);

  const trackAffiliateClick = useCallback((affiliateId: string) => {
    revenueTracker.trackAffiliateClick(affiliateId);
  }, []);

  const getBehaviorMetrics = useCallback(() => {
    return conversionTracker.getUserBehaviorMetrics();
  }, []);

  const getRevenueMetrics = useCallback(() => {
    return revenueTracker.getRevenueMetrics();
  }, []);

  const getCurrentFunnel = useCallback(() => {
    return conversionTracker.getCurrentFunnel();
  }, []);

  return {
    trackFileUpload,
    trackConversionStart,
    trackConversionComplete,
    trackDownload,
    trackAdClick,
    trackAdImpression,
    trackAffiliateClick,
    getBehaviorMetrics,
    getRevenueMetrics,
    getCurrentFunnel,
  };
}
