"use client";

import { useEffect } from "react";
import { getBundleMonitor } from "@/lib/performance/bundle-monitor";

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize bundle monitoring
    const monitor = getBundleMonitor();

    // Log performance summary after page load
    const logPerformanceSummary = () => {
      setTimeout(() => {
        const bundleMetrics = monitor.getBundleMetrics();
        const performanceMetrics = monitor.getPerformanceMetrics();

        if (process.env.NODE_ENV === "development") {
          console.group("🚀 Performance Summary");
          console.log("Bundle Size:", `${Math.round(monitor.getTotalBundleSize() / 1024)}KB`);
          console.log("Average Load Time:", `${Math.round(monitor.getAverageLoadTime())}ms`);

          if (performanceMetrics) {
            console.log("Core Web Vitals:", {
              FCP: `${Math.round(performanceMetrics.fcp)}ms`,
              LCP: `${Math.round(performanceMetrics.lcp)}ms`,
              FID: `${Math.round(performanceMetrics.fid)}ms`,
              CLS: performanceMetrics.cls.toFixed(3),
              TTFB: `${Math.round(performanceMetrics.ttfb)}ms`,
            });
          }
          console.groupEnd();
        }
      }, 3000); // Wait 3 seconds for metrics to be collected
    };

    // Monitor memory usage
    const monitorMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) {
          // > 50MB
          console.warn(
            `High memory usage detected: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`
          );
        }
      }
    };

    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          // Tasks longer than 50ms
          console.warn(`Long task detected: ${Math.round(entry.duration)}ms`);
        }
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // Browser doesn't support longtask
    }

    // Set up monitoring intervals
    const memoryInterval = setInterval(monitorMemory, 10000); // Check every 10 seconds

    // Log summary on load
    if (document.readyState === "complete") {
      logPerformanceSummary();
    } else {
      window.addEventListener("load", logPerformanceSummary);
    }

    return () => {
      longTaskObserver.disconnect();
      clearInterval(memoryInterval);
      window.removeEventListener("load", logPerformanceSummary);
    };
  }, []);

  return null; // This component doesn't render anything
}
