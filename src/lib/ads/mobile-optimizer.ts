"use client";

interface MobileAdConfig {
  stickyAd: {
    enabled: boolean;
    position: "top" | "bottom";
    dismissible: boolean;
    autoHideDelay?: number;
    showAfterScroll?: number;
  };
  interstitialAd: {
    enabled: boolean;
    trigger: "time" | "interaction" | "conversion";
    triggerDelay: number;
    interactionThreshold: number;
    frequency: number; // minutes between shows
  };
  bannerAd: {
    enabled: boolean;
    positions: string[];
    adaptiveSize: boolean;
    lazyLoad: boolean;
  };
}

interface MobileAdMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  viewability: number;
  userEngagement: number;
}

interface MobileAdPerformance {
  stickyAd: MobileAdMetrics;
  interstitialAd: MobileAdMetrics;
  bannerAd: MobileAdMetrics;
  overall: MobileAdMetrics;
}

class MobileAdOptimizer {
  private config: MobileAdConfig;
  private performance: MobileAdPerformance;
  private isInitialized = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.performance = this.getDefaultPerformance();
    this.loadConfig();
  }

  private getDefaultConfig(): MobileAdConfig {
    return {
      stickyAd: {
        enabled: true,
        position: "bottom",
        dismissible: true,
        autoHideDelay: 30000, // 30 seconds
        showAfterScroll: 100, // pixels
      },
      interstitialAd: {
        enabled: true,
        trigger: "interaction",
        triggerDelay: 30000, // 30 seconds
        interactionThreshold: 3,
        frequency: 5, // 5 minutes
      },
      bannerAd: {
        enabled: true,
        positions: ["header", "inline", "footer"],
        adaptiveSize: true,
        lazyLoad: true,
      },
    };
  }

  private getDefaultPerformance(): MobileAdPerformance {
    const defaultMetrics: MobileAdMetrics = {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      revenue: 0,
      viewability: 0,
      userEngagement: 0,
    };

    return {
      stickyAd: { ...defaultMetrics },
      interstitialAd: { ...defaultMetrics },
      bannerAd: { ...defaultMetrics },
      overall: { ...defaultMetrics },
    };
  }

  private loadConfig(): void {
    if (typeof window === "undefined") return;

    try {
      const savedConfig = localStorage.getItem("mobile-ad-config");
      const savedPerformance = localStorage.getItem("mobile-ad-performance");

      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }

      if (savedPerformance) {
        this.performance = { ...this.performance, ...JSON.parse(savedPerformance) };
      }
    } catch (error) {
      console.error("Failed to load mobile ad config:", error);
    }
  }

  private saveConfig(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("mobile-ad-config", JSON.stringify(this.config));
      localStorage.setItem("mobile-ad-performance", JSON.stringify(this.performance));
    } catch (error) {
      console.error("Failed to save mobile ad config:", error);
    }
  }

  initialize(): void {
    if (this.isInitialized) return;

    this.optimizeForDevice();
    this.setupPerformanceTracking();
    this.isInitialized = true;
  }

  private optimizeForDevice(): void {
    if (typeof window === "undefined") return;

    const deviceInfo = this.getDeviceInfo();

    // Optimize based on device characteristics
    if (deviceInfo.isLowEnd) {
      // Reduce ad frequency for low-end devices
      this.config.interstitialAd.frequency = Math.max(
        this.config.interstitialAd.frequency * 1.5,
        10
      );
      this.config.stickyAd.autoHideDelay = Math.min(
        this.config.stickyAd.autoHideDelay || 30000,
        20000
      );
    }

    if (deviceInfo.isSlowConnection) {
      // Disable heavy ad formats on slow connections
      this.config.interstitialAd.enabled = false;
      this.config.bannerAd.lazyLoad = true;
    }

    if (deviceInfo.screenSize === "small") {
      // Optimize for small screens
      this.config.stickyAd.position = "bottom";
      this.config.bannerAd.positions = this.config.bannerAd.positions.filter(
        (pos) => pos !== "sidebar"
      );
    }

    this.saveConfig();
  }

  private getDeviceInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent;
    const connection = (navigator as any).connection;

    return {
      screenSize: width < 375 ? "small" : width < 768 ? "medium" : "large",
      isLowEnd: this.isLowEndDevice(),
      isSlowConnection: connection
        ? connection.effectiveType === "slow-2g" || connection.effectiveType === "2g"
        : false,
      orientation: height > width ? "portrait" : "landscape",
      hasNotch: this.hasNotch(),
      supportsTouchGestures: "ontouchstart" in window,
    };
  }

  private isLowEndDevice(): boolean {
    // Estimate device performance based on available APIs
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;

    if (memory && memory < 2) return true;
    if (cores && cores < 2) return true;

    // Check for older devices based on user agent
    const userAgent = navigator.userAgent;
    const oldAndroidPattern = /Android [1-4]\./;
    const oldIOSPattern = /OS [1-9]_/;

    return oldAndroidPattern.test(userAgent) || oldIOSPattern.test(userAgent);
  }

  private hasNotch(): boolean {
    // Check for devices with notches/safe areas
    const safeAreaTop = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || "0"
    );
    return safeAreaTop > 0;
  }

  private setupPerformanceTracking(): void {
    // Track ad performance metrics
    this.trackViewabilityChanges();
    this.trackUserEngagement();
    this.trackRevenueMetrics();
  }

  private trackViewabilityChanges(): void {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const adElement = entry.target as HTMLElement;
          const adType = adElement.dataset.adType;
          const viewabilityRatio = entry.intersectionRatio;

          if (adType && this.performance[adType as keyof MobileAdPerformance]) {
            (this.performance[adType as keyof MobileAdPerformance] as MobileAdMetrics).viewability =
              viewabilityRatio;
            this.updateOverallMetrics();
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    // Observe ad elements when they're added to the DOM
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const adElements = element.querySelectorAll("[data-ad-type]");
            adElements.forEach((adElement) => observer.observe(adElement));
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  private trackUserEngagement(): void {
    let interactionCount = 0;
    let sessionStartTime = Date.now();

    const trackInteraction = () => {
      interactionCount++;
      const sessionDuration = Date.now() - sessionStartTime;
      const engagementScore = Math.min(interactionCount / (sessionDuration / 60000), 10); // interactions per minute

      Object.keys(this.performance).forEach((key) => {
        if (key !== "overall") {
          (this.performance[key as keyof MobileAdPerformance] as MobileAdMetrics).userEngagement =
            engagementScore;
        }
      });

      this.updateOverallMetrics();
    };

    ["touchstart", "click", "scroll"].forEach((event) => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });
  }

  private trackRevenueMetrics(): void {
    // This would integrate with actual ad network APIs
    // For now, we'll simulate revenue tracking
    const updateRevenue = () => {
      const baseRevenue = 0.001; // Base revenue per impression

      Object.keys(this.performance).forEach((key) => {
        if (key !== "overall") {
          const metrics = this.performance[key as keyof MobileAdPerformance] as MobileAdMetrics;
          metrics.revenue = metrics.impressions * baseRevenue * (metrics.ctr / 100);
        }
      });

      this.updateOverallMetrics();
      this.saveConfig();
    };

    // Update revenue metrics every minute
    setInterval(updateRevenue, 60000);
  }

  private updateOverallMetrics(): void {
    const adTypes = ["stickyAd", "interstitialAd", "bannerAd"] as const;
    const overall = this.performance.overall;

    overall.impressions = adTypes.reduce(
      (sum, type) => sum + this.performance[type].impressions,
      0
    );
    overall.clicks = adTypes.reduce((sum, type) => sum + this.performance[type].clicks, 0);
    overall.revenue = adTypes.reduce((sum, type) => sum + this.performance[type].revenue, 0);
    overall.ctr = overall.impressions > 0 ? (overall.clicks / overall.impressions) * 100 : 0;
    overall.viewability =
      adTypes.reduce((sum, type) => sum + this.performance[type].viewability, 0) / adTypes.length;
    overall.userEngagement =
      adTypes.reduce((sum, type) => sum + this.performance[type].userEngagement, 0) /
      adTypes.length;
  }

  // Public methods for tracking ad events
  trackImpression(adType: "stickyAd" | "interstitialAd" | "bannerAd"): void {
    this.performance[adType].impressions++;
    this.updateOverallMetrics();
    this.saveConfig();
  }

  trackClick(adType: "stickyAd" | "interstitialAd" | "bannerAd"): void {
    this.performance[adType].clicks++;
    this.updateOverallMetrics();
    this.saveConfig();
  }

  // Configuration methods
  updateConfig(newConfig: Partial<MobileAdConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  getConfig(): MobileAdConfig {
    return { ...this.config };
  }

  getPerformance(): MobileAdPerformance {
    return { ...this.performance };
  }

  // Optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const overall = this.performance.overall;

    if (overall.ctr < 1.0) {
      recommendations.push("Consider improving ad placement or creative quality to increase CTR");
    }

    if (overall.viewability < 0.5) {
      recommendations.push("Optimize ad positioning for better viewability");
    }

    if (this.performance.stickyAd.userEngagement < 2.0) {
      recommendations.push("Consider reducing sticky ad frequency or improving dismissibility");
    }

    if (this.performance.interstitialAd.ctr < 0.5) {
      recommendations.push("Optimize interstitial ad timing and frequency");
    }

    return recommendations;
  }

  // A/B testing support
  shouldShowAd(adType: "stickyAd" | "interstitialAd" | "bannerAd"): boolean {
    const config = this.config[adType];
    if (!config.enabled) return false;

    // Check frequency limits for interstitials
    if (adType === "interstitialAd") {
      const lastShown = parseInt(localStorage.getItem("last-interstitial-shown") || "0");
      const now = Date.now();
      const minInterval = this.config.interstitialAd.frequency * 60 * 1000;

      if (now - lastShown < minInterval) return false;
    }

    // Check performance thresholds
    const performance = this.performance[adType];
    if (performance.ctr < 0.1 && performance.impressions > 100) {
      return false; // Disable poorly performing ads
    }

    return true;
  }

  reset(): void {
    this.config = this.getDefaultConfig();
    this.performance = this.getDefaultPerformance();
    this.saveConfig();
  }
}

export const mobileAdOptimizer = new MobileAdOptimizer();
