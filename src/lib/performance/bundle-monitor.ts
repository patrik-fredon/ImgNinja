"use client";

interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunkCount: number;
  loadTime: number;
  timestamp: Date;
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class BundleMonitor {
  private metrics: BundleMetrics[] = [];
  private performanceMetrics: PerformanceMetrics | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor bundle loading performance
    this.trackBundleMetrics();

    // Monitor Core Web Vitals
    this.trackWebVitals();

    // Monitor resource loading
    this.trackResourceLoading();
  }

  private trackBundleMetrics() {
    if (!window.performance) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.name.includes("_next/static/chunks/")) {
          const resourceEntry = entry as PerformanceResourceTiming;
          const metrics: BundleMetrics = {
            totalSize: resourceEntry.transferSize || 0,
            gzippedSize: resourceEntry.encodedBodySize || 0,
            chunkCount: 1,
            loadTime: entry.duration,
            timestamp: new Date(),
          };

          this.metrics.push(metrics);
          this.reportMetrics(metrics);
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });
  }

  private trackWebVitals() {
    // Track First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries[entries.length - 1];
      if (fcp) {
        this.updatePerformanceMetric("fcp", fcp.startTime);
      }
    }).observe({ entryTypes: ["paint"] });

    // Track Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];
      if (lcp) {
        this.updatePerformanceMetric("lcp", lcp.startTime);
      }
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // Track First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime;
          this.updatePerformanceMetric("fid", fid);
        }
      });
    }).observe({ entryTypes: ["first-input"] });

    // Track Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let cls = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      this.updatePerformanceMetric("cls", cls);
    }).observe({ entryTypes: ["layout-shift"] });

    // Track Time to First Byte
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.updatePerformanceMetric("ttfb", ttfb);
    }
  }

  private trackResourceLoading() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;

        // Track large resources that might impact performance
        if (resourceEntry.transferSize && resourceEntry.transferSize > 100000) {
          // > 100KB
          console.warn(
            `Large resource detected: ${entry.name} (${Math.round(resourceEntry.transferSize / 1024)}KB)`
          );
        }

        // Track slow loading resources
        if (entry.duration > 1000) {
          // > 1 second
          console.warn(`Slow resource detected: ${entry.name} (${Math.round(entry.duration)}ms)`);
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });
  }

  private updatePerformanceMetric(metric: keyof PerformanceMetrics, value: number) {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
      };
    }

    this.performanceMetrics[metric] = value;

    // Report to analytics if all metrics are collected
    if (this.areAllMetricsCollected()) {
      this.reportPerformanceMetrics();
    }
  }

  private areAllMetricsCollected(): boolean {
    return (
      this.performanceMetrics !== null &&
      this.performanceMetrics.fcp > 0 &&
      this.performanceMetrics.lcp > 0
    );
  }

  private reportMetrics(metrics: BundleMetrics) {
    // In production, send to analytics service
    if (process.env.NODE_ENV === "development") {
      console.log("Bundle Metrics:", {
        size: `${Math.round(metrics.totalSize / 1024)}KB`,
        gzipped: `${Math.round(metrics.gzippedSize / 1024)}KB`,
        loadTime: `${Math.round(metrics.loadTime)}ms`,
      });
    }
  }

  private reportPerformanceMetrics() {
    if (!this.performanceMetrics) return;

    // In production, send to analytics service
    if (process.env.NODE_ENV === "development") {
      console.log("Performance Metrics:", {
        fcp: `${Math.round(this.performanceMetrics.fcp)}ms`,
        lcp: `${Math.round(this.performanceMetrics.lcp)}ms`,
        fid: `${Math.round(this.performanceMetrics.fid)}ms`,
        cls: this.performanceMetrics.cls.toFixed(3),
        ttfb: `${Math.round(this.performanceMetrics.ttfb)}ms`,
      });
    }

    // Send to external analytics service in production
    this.sendToAnalytics(this.performanceMetrics);
  }

  private sendToAnalytics(metrics: PerformanceMetrics) {
    // Placeholder for analytics integration
    // In production, integrate with Google Analytics, DataDog, etc.
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "web_vitals", {
        custom_map: {
          metric_fcp: "first_contentful_paint",
          metric_lcp: "largest_contentful_paint",
          metric_fid: "first_input_delay",
          metric_cls: "cumulative_layout_shift",
          metric_ttfb: "time_to_first_byte",
        },
        metric_fcp: Math.round(metrics.fcp),
        metric_lcp: Math.round(metrics.lcp),
        metric_fid: Math.round(metrics.fid),
        metric_cls: Math.round(metrics.cls * 1000),
        metric_ttfb: Math.round(metrics.ttfb),
      });
    }
  }

  public getBundleMetrics(): BundleMetrics[] {
    return this.metrics;
  }

  public getPerformanceMetrics(): PerformanceMetrics | null {
    return this.performanceMetrics;
  }

  public getTotalBundleSize(): number {
    return this.metrics.reduce((total, metric) => total + metric.totalSize, 0);
  }

  public getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const totalTime = this.metrics.reduce((total, metric) => total + metric.loadTime, 0);
    return totalTime / this.metrics.length;
  }
}

// Global instance
let bundleMonitor: BundleMonitor | null = null;

export function getBundleMonitor(): BundleMonitor {
  if (!bundleMonitor) {
    bundleMonitor = new BundleMonitor();
  }
  return bundleMonitor;
}

export type { BundleMetrics, PerformanceMetrics };
