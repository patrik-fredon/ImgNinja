"use client";

export interface AdPerformanceMetrics {
  loadTime: number;
  renderTime: number;
  viewabilityScore: number;
  impactOnCLS: number;
  impactOnLCP: number;
  memoryUsage: number;
}

export interface AdOptimizationConfig {
  lazyLoadThreshold: number; // pixels from viewport
  maxLoadTime: number; // milliseconds
  enableIntersectionObserver: boolean;
  enablePerformanceMonitoring: boolean;
  enableMemoryOptimization: boolean;
}

class AdPerformanceOptimizer {
  private config: AdOptimizationConfig;
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;
  private metrics: Map<string, AdPerformanceMetrics> = new Map();

  constructor(config: AdOptimizationConfig) {
    this.config = config;
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === "undefined") return;

    // Performance observer for monitoring ad loading performance
    if (this.config.enablePerformanceMonitoring && "PerformanceObserver" in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes("googlesyndication") || entry.name.includes("adsbygoogle")) {
            this.recordLoadTime(entry.name, entry.duration);
          }
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ["resource", "measure"] });
      } catch (error) {
        console.warn("Performance observer not supported:", error);
      }
    }
  }

  createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void
  ): IntersectionObserver | null {
    if (typeof window === "undefined" || !this.config.enableIntersectionObserver) return null;

    const rootMargin = `${this.config.lazyLoadThreshold}px`;

    return new IntersectionObserver(callback, {
      rootMargin,
      threshold: [0, 0.25, 0.5, 0.75, 1.0],
    });
  }

  measureAdRenderTime(adId: string, startTime: number): void {
    const renderTime = performance.now() - startTime;
    const metrics = this.getOrCreateMetrics(adId);
    metrics.renderTime = renderTime;
    this.metrics.set(adId, metrics);
  }

  measureViewability(adId: string, visibilityRatio: number): void {
    const metrics = this.getOrCreateMetrics(adId);
    metrics.viewabilityScore = Math.max(metrics.viewabilityScore, visibilityRatio);
    this.metrics.set(adId, metrics);
  }

  recordLoadTime(adId: string, loadTime: number): void {
    const metrics = this.getOrCreateMetrics(adId);
    metrics.loadTime = loadTime;
    this.metrics.set(adId, metrics);
  }

  measureLayoutShift(adId: string, clsValue: number): void {
    const metrics = this.getOrCreateMetrics(adId);
    metrics.impactOnCLS = clsValue;
    this.metrics.set(adId, metrics);
  }

  measureLCPImpact(adId: string, lcpValue: number): void {
    const metrics = this.getOrCreateMetrics(adId);
    metrics.impactOnLCP = lcpValue;
    this.metrics.set(adId, metrics);
  }

  private getOrCreateMetrics(adId: string): AdPerformanceMetrics {
    return (
      this.metrics.get(adId) || {
        loadTime: 0,
        renderTime: 0,
        viewabilityScore: 0,
        impactOnCLS: 0,
        impactOnLCP: 0,
        memoryUsage: 0,
      }
    );
  }

  getMetrics(adId: string): AdPerformanceMetrics | null {
    return this.metrics.get(adId) || null;
  }

  getAllMetrics(): Map<string, AdPerformanceMetrics> {
    return new Map(this.metrics);
  }

  optimizeAdLoading(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      if (!this.config.enableIntersectionObserver) {
        resolve();
        return;
      }

      const observer = this.createIntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer?.unobserve(entry.target);
            resolve();
          }
        });
      });

      if (observer) {
        observer.observe(element);
      } else {
        resolve();
      }
    });
  }

  preloadAdResources(): void {
    if (typeof window === "undefined") return;

    // Preload critical ad resources
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = "//pagead2.googlesyndication.com";
    document.head.appendChild(link);

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://googleads.g.doubleclick.net";
    document.head.appendChild(preconnect);
  }

  enableMemoryOptimization(): void {
    if (!this.config.enableMemoryOptimization || typeof window === "undefined") return;

    // Clean up unused ad resources periodically
    setInterval(() => {
      this.cleanupUnusedResources();
    }, 60000); // Every minute
  }

  private cleanupUnusedResources(): void {
    // Remove hidden or out-of-viewport ad elements to free memory
    const adElements = document.querySelectorAll(".adsbygoogle");

    adElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isVisible && element.getAttribute("data-ad-status") === "filled") {
        // Mark for potential cleanup if not visible for extended period
        const lastSeen = element.getAttribute("data-last-seen");
        const now = Date.now();

        if (lastSeen && now - parseInt(lastSeen) > 300000) {
          // 5 minutes
          // Remove non-critical ad resources
          element.setAttribute("data-cleanup-candidate", "true");
        } else if (!lastSeen) {
          element.setAttribute("data-last-seen", now.toString());
        }
      } else if (isVisible) {
        element.removeAttribute("data-last-seen");
        element.removeAttribute("data-cleanup-candidate");
      }
    });
  }

  generatePerformanceReport(): {
    averageLoadTime: number;
    averageRenderTime: number;
    averageViewability: number;
    totalCLSImpact: number;
    recommendations: string[];
  } {
    const allMetrics = Array.from(this.metrics.values());

    if (allMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        averageRenderTime: 0,
        averageViewability: 0,
        totalCLSImpact: 0,
        recommendations: ["No ad performance data available"],
      };
    }

    const averageLoadTime = allMetrics.reduce((sum, m) => sum + m.loadTime, 0) / allMetrics.length;
    const averageRenderTime =
      allMetrics.reduce((sum, m) => sum + m.renderTime, 0) / allMetrics.length;
    const averageViewability =
      allMetrics.reduce((sum, m) => sum + m.viewabilityScore, 0) / allMetrics.length;
    const totalCLSImpact = allMetrics.reduce((sum, m) => sum + m.impactOnCLS, 0);

    const recommendations: string[] = [];

    if (averageLoadTime > this.config.maxLoadTime) {
      recommendations.push("Consider implementing more aggressive lazy loading");
    }

    if (averageViewability < 0.5) {
      recommendations.push("Optimize ad placement for better viewability");
    }

    if (totalCLSImpact > 0.1) {
      recommendations.push("Reserve space for ads to reduce layout shift");
    }

    if (averageRenderTime > 1000) {
      recommendations.push("Optimize ad rendering performance");
    }

    return {
      averageLoadTime,
      averageRenderTime,
      averageViewability,
      totalCLSImpact,
      recommendations,
    };
  }

  destroy(): void {
    this.performanceObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.metrics.clear();
  }
}

export const defaultAdOptimizationConfig: AdOptimizationConfig = {
  lazyLoadThreshold: 200,
  maxLoadTime: 3000,
  enableIntersectionObserver: true,
  enablePerformanceMonitoring: true,
  enableMemoryOptimization: true,
};

export const adPerformanceOptimizer = new AdPerformanceOptimizer(defaultAdOptimizationConfig);
