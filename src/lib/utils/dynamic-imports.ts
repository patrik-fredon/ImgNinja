/**
 * Dynamic import utilities for advanced bundle optimization
 * Implements code splitting for non-critical components
 */

import { lazy } from "react";

// Analytics components - loaded only when needed
export const AnalyticsDashboard = lazy(() =>
  import("@/components/analytics/AnalyticsDashboard").then((module) => ({
    default: module.AnalyticsDashboard,
  }))
);

// Ad components - loaded progressively
export const AdTestingDashboard = lazy(() =>
  import("@/components/ads/AdTestingDashboard").then((module) => ({
    default: module.AdTestingDashboard,
  }))
);

export const ContextualAdBanner = lazy(() =>
  import("@/components/ads/ContextualAdBanner").then((module) => ({
    default: module.ContextualAdBanner,
  }))
);

export const NativeAdCard = lazy(() =>
  import("@/components/ads/NativeAdCard").then((module) => ({
    default: module.NativeAdCard,
  }))
);

// Converter components - loaded on demand
export const PerformanceStats = lazy(() =>
  import("@/components/converter/PerformanceStats").then((module) => ({
    default: module.PerformanceStats,
  }))
);

export const FormatComparison = lazy(() =>
  import("@/components/converter/FormatComparison").then((module) => ({
    default: module.FormatComparison,
  }))
);

export const SmartFormatDetection = lazy(() =>
  import("@/components/converter/SmartFormatDetection").then((module) => ({
    default: module.SmartFormatDetection,
  }))
);

// Heavy libraries - loaded only when needed
export const loadJSZip = () => import("jszip");
export const loadImageConverter = () => import("@/lib/converter/engine");
export const loadWorkerPool = () => import("@/lib/converter/worker-pool");

// Utility functions for progressive loading
export const preloadComponent = (importFn: () => Promise<any>) => {
  if (typeof window !== "undefined") {
    // Preload on idle or after initial load
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => importFn());
    } else {
      setTimeout(() => importFn(), 100);
    }
  }
};

export const preloadCriticalComponents = () => {
  // Preload components likely to be used soon
  preloadComponent(loadImageConverter);
  preloadComponent(() => import("@/components/converter/FormatSelector"));
  preloadComponent(() => import("@/components/converter/QualityControl"));
};

// Route-based code splitting helpers
export const getRouteComponent = (route: string) => {
  switch (route) {
    case "formats":
      return lazy(() => import("@/app/[locale]/formats/[format]/page"));
    case "privacy":
      return lazy(() => import("@/app/[locale]/privacy/page"));
    default:
      return null;
  }
};
