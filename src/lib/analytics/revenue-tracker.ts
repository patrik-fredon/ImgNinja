"use client";

export interface RevenueEvent {
  id: string;
  type: "ad_impression" | "ad_click" | "conversion" | "affiliate_click";
  timestamp: Date;
  sessionId: string;
  userId: string;
  amount: number;
  currency: string;
  source: string;
  metadata: Record<string, any>;
}

export interface RevenueMetrics {
  totalRevenue: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  averageRPM: number; // Revenue per mille (thousand impressions)
  averageCTR: number;
  conversionValue: number;
  topRevenueSources: { source: string; revenue: number }[];
}

export interface AdPerformanceData {
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
  rpm: number;
  position: string;
  adUnitId?: string;
}

class RevenueTracker {
  private events: RevenueEvent[] = [];
  private adPerformance: Map<string, AdPerformanceData> = new Map();

  constructor() {
    this.loadFromStorage();
    this.initializeTracking();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const eventsData = localStorage.getItem("revenue-events");
      const adPerformanceData = localStorage.getItem("ad-performance");

      if (eventsData) {
        this.events = JSON.parse(eventsData).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
      }

      if (adPerformanceData) {
        const performance = JSON.parse(adPerformanceData);
        Object.entries(performance).forEach(([key, value]) => {
          this.adPerformance.set(key, value as AdPerformanceData);
        });
      }
    } catch (error) {
      console.error("Failed to load revenue tracking data:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("revenue-events", JSON.stringify(this.events));
      localStorage.setItem(
        "ad-performance",
        JSON.stringify(Object.fromEntries(this.adPerformance))
      );
    } catch (error) {
      console.error("Failed to save revenue tracking data:", error);
    }
  }

  private initializeTracking(): void {
    if (typeof window === "undefined") return;

    // Clean up old events (keep only last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.events = this.events.filter((event) => event.timestamp > thirtyDaysAgo);
    this.saveToStorage();
  }

  trackAdImpression(position: string, adUnitId?: string, estimatedValue: number = 0.001): void {
    const event: RevenueEvent = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: "ad_impression",
      timestamp: new Date(),
      sessionId: this.getCurrentSessionId(),
      userId: this.getCurrentUserId(),
      amount: estimatedValue,
      currency: "USD",
      source: "google_ads",
      metadata: { position, adUnitId },
    };

    this.events.push(event);
    this.updateAdPerformance(position, "impression", estimatedValue, adUnitId);
    this.saveToStorage();
  }

  trackAdClick(position: string, adUnitId?: string, estimatedValue: number = 0.05): void {
    const event: RevenueEvent = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: "ad_click",
      timestamp: new Date(),
      sessionId: this.getCurrentSessionId(),
      userId: this.getCurrentUserId(),
      amount: estimatedValue,
      currency: "USD",
      source: "google_ads",
      metadata: { position, adUnitId },
    };

    this.events.push(event);
    this.updateAdPerformance(position, "click", estimatedValue, adUnitId);
    this.saveToStorage();
  }

  trackConversionRevenue(amount: number, source: string = "conversion"): void {
    const event: RevenueEvent = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: "conversion",
      timestamp: new Date(),
      sessionId: this.getCurrentSessionId(),
      userId: this.getCurrentUserId(),
      amount,
      currency: "USD",
      source,
      metadata: {},
    };

    this.events.push(event);
    this.saveToStorage();
  }

  trackAffiliateClick(affiliateId: string, estimatedValue: number = 0.1): void {
    const event: RevenueEvent = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: "affiliate_click",
      timestamp: new Date(),
      sessionId: this.getCurrentSessionId(),
      userId: this.getCurrentUserId(),
      amount: estimatedValue,
      currency: "USD",
      source: affiliateId,
      metadata: { affiliateId },
    };

    this.events.push(event);
    this.saveToStorage();
  }

  private updateAdPerformance(
    position: string,
    action: "impression" | "click",
    revenue: number,
    adUnitId?: string
  ): void {
    const key = `${position}_${adUnitId || "default"}`;
    const current = this.adPerformance.get(key) || {
      impressions: 0,
      clicks: 0,
      revenue: 0,
      ctr: 0,
      rpm: 0,
      position,
      adUnitId,
    };

    if (action === "impression") {
      current.impressions++;
    } else if (action === "click") {
      current.clicks++;
    }

    current.revenue += revenue;
    current.ctr = current.impressions > 0 ? current.clicks / current.impressions : 0;
    current.rpm = current.impressions > 0 ? (current.revenue / current.impressions) * 1000 : 0;

    this.adPerformance.set(key, current);
  }

  private getCurrentSessionId(): string {
    if (typeof window === "undefined") return "anonymous";
    return sessionStorage.getItem("session-id") || "anonymous";
  }

  private getCurrentUserId(): string {
    if (typeof window === "undefined") return "anonymous";
    return localStorage.getItem("user-id") || "anonymous";
  }

  getRevenueMetrics(): RevenueMetrics {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRevenue = this.events.reduce((sum, event) => sum + event.amount, 0);
    const dailyRevenue = this.events
      .filter((event) => event.timestamp >= today)
      .reduce((sum, event) => sum + event.amount, 0);
    const monthlyRevenue = this.events
      .filter((event) => event.timestamp >= thisMonth)
      .reduce((sum, event) => sum + event.amount, 0);

    const impressions = this.events.filter((e) => e.type === "ad_impression").length;
    const clicks = this.events.filter((e) => e.type === "ad_click").length;
    const adRevenue = this.events
      .filter((e) => e.type === "ad_impression" || e.type === "ad_click")
      .reduce((sum, event) => sum + event.amount, 0);

    const averageRPM = impressions > 0 ? (adRevenue / impressions) * 1000 : 0;
    const averageCTR = impressions > 0 ? clicks / impressions : 0;
    const conversionValue = this.events
      .filter((e) => e.type === "conversion")
      .reduce((sum, event) => sum + event.amount, 0);

    // Calculate top revenue sources
    const sourceRevenue = new Map<string, number>();
    this.events.forEach((event) => {
      const current = sourceRevenue.get(event.source) || 0;
      sourceRevenue.set(event.source, current + event.amount);
    });

    const topRevenueSources = Array.from(sourceRevenue.entries())
      .map(([source, revenue]) => ({ source, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      dailyRevenue,
      monthlyRevenue,
      averageRPM,
      averageCTR,
      conversionValue,
      topRevenueSources,
    };
  }

  getAdPerformanceData(): AdPerformanceData[] {
    return Array.from(this.adPerformance.values());
  }

  getAdPerformanceByPosition(position: string): AdPerformanceData[] {
    return Array.from(this.adPerformance.values()).filter((data) => data.position === position);
  }

  getBestPerformingAds(): AdPerformanceData[] {
    return Array.from(this.adPerformance.values())
      .sort((a, b) => b.rpm - a.rpm)
      .slice(0, 10);
  }

  getRevenueByTimeRange(startDate: Date, endDate: Date): RevenueEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  getDailyRevenueChart(days: number = 30): { date: string; revenue: number }[] {
    const result: { date: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayRevenue = this.events
        .filter((event) => event.timestamp >= dayStart && event.timestamp < dayEnd)
        .reduce((sum, event) => sum + event.amount, 0);

      result.push({ date: dateStr, revenue: dayRevenue });
    }

    return result;
  }

  exportData(): {
    events: RevenueEvent[];
    adPerformance: AdPerformanceData[];
    metrics: RevenueMetrics;
  } {
    return {
      events: this.events,
      adPerformance: this.getAdPerformanceData(),
      metrics: this.getRevenueMetrics(),
    };
  }

  clearData(): void {
    this.events = [];
    this.adPerformance.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("revenue-events");
      localStorage.removeItem("ad-performance");
    }
  }
}

export const revenueTracker = new RevenueTracker();
