"use client";

import { useEffect } from "react";

export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== "undefined" && "performance" in window) {
      // LCP (Largest Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            console.log("LCP:", entry.startTime);
            // Send to analytics if needed
          }
        }
      });

      try {
        observer.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        // Browser doesn't support this metric
      }

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "first-input") {
            const fidEntry = entry as any; // Type assertion for first-input entries
            const fid = fidEntry.processingStart - fidEntry.startTime;
            console.log("FID:", fid);
            // Send to analytics if needed
          }
        }
      });

      try {
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        // Browser doesn't support this metric
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "layout-shift") {
            const clsEntry = entry as any; // Type assertion for layout-shift entries
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
            }
          }
        }
      });

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        // Browser doesn't support this metric
      }

      // Report CLS on page unload
      const reportCLS = () => {
        console.log("CLS:", clsValue);
        // Send to analytics if needed
      };

      window.addEventListener("beforeunload", reportCLS);

      return () => {
        observer.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        window.removeEventListener("beforeunload", reportCLS);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
