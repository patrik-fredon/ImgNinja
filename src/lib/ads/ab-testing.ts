"use client";

export interface AdVariant {
  id: string;
  name: string;
  weight: number; // 0-100, percentage of traffic
  config: {
    position: "top" | "bottom" | "left" | "right" | "center";
    size: "small" | "medium" | "large" | "responsive";
    timing: "immediate" | "delayed" | "on-interaction";
    style: "standard" | "native" | "minimal";
  };
}

export interface AdPlacementTest {
  id: string;
  name: string;
  slot: string;
  variants: AdVariant[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface AdTestMetrics {
  variantId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  conversionRate: number;
}

class AdABTestingService {
  private tests: Map<string, AdPlacementTest> = new Map();
  private userVariants: Map<string, string> = new Map();
  private metrics: Map<string, AdTestMetrics> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const testsData = localStorage.getItem("ad-ab-tests");
      const variantsData = localStorage.getItem("ad-user-variants");
      const metricsData = localStorage.getItem("ad-test-metrics");

      if (testsData) {
        const tests = JSON.parse(testsData);
        Object.entries(tests).forEach(([key, value]) => {
          this.tests.set(key, value as AdPlacementTest);
        });
      }

      if (variantsData) {
        const variants = JSON.parse(variantsData);
        Object.entries(variants).forEach(([key, value]) => {
          this.userVariants.set(key, value as string);
        });
      }

      if (metricsData) {
        const metrics = JSON.parse(metricsData);
        Object.entries(metrics).forEach(([key, value]) => {
          this.metrics.set(key, value as AdTestMetrics);
        });
      }
    } catch (error) {
      console.error("Failed to load A/B testing data:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("ad-ab-tests", JSON.stringify(Object.fromEntries(this.tests)));
      localStorage.setItem(
        "ad-user-variants",
        JSON.stringify(Object.fromEntries(this.userVariants))
      );
      localStorage.setItem("ad-test-metrics", JSON.stringify(Object.fromEntries(this.metrics)));
    } catch (error) {
      console.error("Failed to save A/B testing data:", error);
    }
  }

  createTest(test: AdPlacementTest): void {
    this.tests.set(test.id, test);
    this.saveToStorage();
  }

  getActiveTest(slot: string): AdPlacementTest | null {
    for (const test of this.tests.values()) {
      if (test.slot === slot && test.isActive) {
        const now = new Date();
        if (now >= test.startDate && (!test.endDate || now <= test.endDate)) {
          return test;
        }
      }
    }
    return null;
  }

  getVariantForUser(testId: string, userId: string): AdVariant | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const userKey = `${testId}-${userId}`;
    let variantId = this.userVariants.get(userKey);

    if (!variantId) {
      // Assign variant based on weights
      variantId = this.selectVariantByWeight(test.variants, userId);
      this.userVariants.set(userKey, variantId);
      this.saveToStorage();
    }

    return test.variants.find((v) => v.id === variantId) || null;
  }

  private selectVariantByWeight(variants: AdVariant[], userId: string): string {
    // Use userId hash for consistent assignment
    const hash = this.hashString(userId);
    const random = (hash % 100) + 1;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    return variants[0]?.id || "";
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  trackImpression(variantId: string): void {
    const metrics = this.metrics.get(variantId) || {
      variantId,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      revenue: 0,
      conversionRate: 0,
    };

    metrics.impressions++;
    metrics.ctr = metrics.clicks / metrics.impressions;
    this.metrics.set(variantId, metrics);
    this.saveToStorage();
  }

  trackClick(variantId: string): void {
    const metrics = this.metrics.get(variantId) || {
      variantId,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      revenue: 0,
      conversionRate: 0,
    };

    metrics.clicks++;
    metrics.ctr = metrics.clicks / metrics.impressions;
    this.metrics.set(variantId, metrics);
    this.saveToStorage();
  }

  trackRevenue(variantId: string, amount: number): void {
    const metrics = this.metrics.get(variantId) || {
      variantId,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      revenue: 0,
      conversionRate: 0,
    };

    metrics.revenue += amount;
    this.metrics.set(variantId, metrics);
    this.saveToStorage();
  }

  getMetrics(variantId: string): AdTestMetrics | null {
    return this.metrics.get(variantId) || null;
  }

  getAllMetrics(): AdTestMetrics[] {
    return Array.from(this.metrics.values());
  }

  endTest(testId: string): void {
    const test = this.tests.get(testId);
    if (test) {
      test.isActive = false;
      test.endDate = new Date();
      this.tests.set(testId, test);
      this.saveToStorage();
    }
  }
}

export const adABTestingService = new AdABTestingService();
