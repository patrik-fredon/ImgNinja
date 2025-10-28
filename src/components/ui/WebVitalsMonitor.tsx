"use client";

import { useEffect } from "react";

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

export function WebVitalsMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamic import of web-vitals library
    import("web-vitals")
      .then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        const sendToAnalytics = (metric: WebVitalsMetric) => {
          // Send to Google Analytics if available
          if (typeof window.gtag !== "undefined") {
            window.gtag("event", metric.name, {
              event_category: "Web Vitals",
              event_label: metric.id,
              value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
              non_interaction: true,
            });
          }

          // Log to console in development
          if (process.env.NODE_ENV === "development") {
            console.log(`[Web Vitals] ${metric.name}:`, {
              value: metric.value,
              rating: metric.rating,
              delta: metric.delta,
            });
          }

          // Send to custom analytics endpoint if needed
          if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
            fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "web-vitals",
                metric: metric.name,
                value: metric.value,
                rating: metric.rating,
                url: window.location.href,
                timestamp: Date.now(),
              }),
            }).catch(() => {
              // Silently fail - analytics shouldn't break the app
            });
          }
        };

        // Monitor all Core Web Vitals
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
      })
      .catch(() => {
        // Silently fail if web-vitals can't be loaded
      });
  }, []);

  // This component doesn't render anything
  return null;
}

// Performance observer for additional metrics
export function usePerformanceObserver() {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    // Observe long tasks (blocking main thread)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`);

            // Send to analytics
            if (typeof window.gtag !== "undefined") {
              window.gtag("event", "long_task", {
                event_category: "Performance",
                value: Math.round(entry.duration),
                non_interaction: true,
              });
            }
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ["longtask"] });

      // Observe layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.hadRecentInput) return; // Ignore user-initiated shifts

          if (entry.value > 0.1) {
            console.warn(`Layout shift detected: ${entry.value}`);
          }
        });
      });

      layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });

      return () => {
        longTaskObserver.disconnect();
        layoutShiftObserver.disconnect();
      };
    } catch (error) {
      // Silently fail if PerformanceObserver is not supported
    }
  }, []);
}
