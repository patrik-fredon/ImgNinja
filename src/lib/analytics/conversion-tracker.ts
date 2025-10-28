"use client";

export interface ConversionEvent {
  id: string;
  type:
    | "file_upload"
    | "conversion_start"
    | "conversion_complete"
    | "download"
    | "ad_click"
    | "page_view";
  timestamp: Date;
  sessionId: string;
  userId: string;
  metadata: Record<string, any>;
  value?: number; // Revenue value if applicable
}

export interface ConversionFunnel {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  steps: ConversionEvent[];
  totalValue: number;
  isComplete: boolean;
  dropOffPoint?: string;
}

export interface UserBehaviorMetrics {
  sessionDuration: number;
  pageViews: number;
  conversions: number;
  adInteractions: number;
  bounceRate: number;
  engagementScore: number;
}

class ConversionTracker {
  private events: Map<string, ConversionEvent[]> = new Map();
  private funnels: Map<string, ConversionFunnel> = new Map();
  private currentSession: string;
  private currentUser: string;
  private sessionStartTime: Date;

  constructor() {
    this.currentSession = this.generateSessionId();
    this.currentUser = this.getUserId();
    this.sessionStartTime = new Date();
    this.loadFromStorage();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getUserId(): string {
    if (typeof window === "undefined") return "anonymous";

    let userId = localStorage.getItem("user-id");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("user-id", userId);
    }
    return userId;
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const eventsData = localStorage.getItem("conversion-events");
      const funnelsData = localStorage.getItem("conversion-funnels");

      if (eventsData) {
        const events = JSON.parse(eventsData);
        Object.entries(events).forEach(([key, value]) => {
          this.events.set(key, value as ConversionEvent[]);
        });
      }

      if (funnelsData) {
        const funnels = JSON.parse(funnelsData);
        Object.entries(funnels).forEach(([key, value]) => {
          this.funnels.set(key, value as ConversionFunnel);
        });
      }
    } catch (error) {
      console.error("Failed to load conversion tracking data:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("conversion-events", JSON.stringify(Object.fromEntries(this.events)));
      localStorage.setItem("conversion-funnels", JSON.stringify(Object.fromEntries(this.funnels)));
    } catch (error) {
      console.error("Failed to save conversion tracking data:", error);
    }
  }

  private initializeTracking(): void {
    if (typeof window === "undefined") return;

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.trackEvent("page_view", { action: "hidden" });
      } else {
        this.trackEvent("page_view", { action: "visible" });
      }
    });

    // Track page unload
    window.addEventListener("beforeunload", () => {
      this.endSession();
    });

    // Track initial page view
    this.trackEvent("page_view", {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });

    // Start conversion funnel
    this.startFunnel();
  }

  trackEvent(
    type: ConversionEvent["type"],
    metadata: Record<string, any> = {},
    value?: number
  ): void {
    const event: ConversionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      timestamp: new Date(),
      sessionId: this.currentSession,
      userId: this.currentUser,
      metadata,
      value,
    };

    // Add to events collection
    const sessionEvents = this.events.get(this.currentSession) || [];
    sessionEvents.push(event);
    this.events.set(this.currentSession, sessionEvents);

    // Update funnel
    this.updateFunnel(event);

    // Save to storage
    this.saveToStorage();

    // Send to external analytics if configured
    this.sendToExternalAnalytics(event);
  }

  private startFunnel(): void {
    const funnel: ConversionFunnel = {
      sessionId: this.currentSession,
      userId: this.currentUser,
      startTime: this.sessionStartTime,
      steps: [],
      totalValue: 0,
      isComplete: false,
    };

    this.funnels.set(this.currentSession, funnel);
  }

  private updateFunnel(event: ConversionEvent): void {
    const funnel = this.funnels.get(this.currentSession);
    if (!funnel) return;

    funnel.steps.push(event);

    if (event.value) {
      funnel.totalValue += event.value;
    }

    // Check if conversion is complete
    if (event.type === "download") {
      funnel.isComplete = true;
      funnel.endTime = new Date();
    }

    this.funnels.set(this.currentSession, funnel);
  }

  trackFileUpload(fileCount: number, totalSize: number, formats: string[]): void {
    this.trackEvent("file_upload", {
      fileCount,
      totalSize,
      formats,
      timestamp: Date.now(),
    });
  }

  trackConversionStart(inputFormat: string, outputFormat: string, fileSize: number): void {
    this.trackEvent("conversion_start", {
      inputFormat,
      outputFormat,
      fileSize,
      timestamp: Date.now(),
    });
  }

  trackConversionComplete(
    inputFormat: string,
    outputFormat: string,
    originalSize: number,
    convertedSize: number,
    processingTime: number
  ): void {
    const compressionRatio = (originalSize - convertedSize) / originalSize;

    this.trackEvent("conversion_complete", {
      inputFormat,
      outputFormat,
      originalSize,
      convertedSize,
      compressionRatio,
      processingTime,
      timestamp: Date.now(),
    });
  }

  trackDownload(format: string, fileSize: number): void {
    this.trackEvent("download", {
      format,
      fileSize,
      timestamp: Date.now(),
    });
  }

  trackAdClick(adPosition: string, adId?: string, isMobile?: boolean): void {
    this.trackEvent(
      "ad_click",
      {
        adPosition,
        adId,
        isMobile,
        deviceType: this.getDeviceType(),
        screenSize: this.getScreenSize(),
        timestamp: Date.now(),
      },
      0.01
    ); // Estimated value per click
  }

  trackMobileAdImpression(adType: string, position: string, viewabilityRatio?: number): void {
    this.trackEvent("ad_impression", {
      adType,
      position,
      viewabilityRatio,
      deviceType: this.getDeviceType(),
      screenSize: this.getScreenSize(),
      orientation: this.getOrientation(),
      timestamp: Date.now(),
    });
  }

  trackMobileInteraction(interactionType: string, context?: string): void {
    this.trackEvent("mobile_interaction", {
      interactionType,
      context,
      deviceType: this.getDeviceType(),
      screenSize: this.getScreenSize(),
      orientation: this.getOrientation(),
      timestamp: Date.now(),
    });
  }

  private getDeviceType(): string {
    if (typeof window === "undefined") return "unknown";

    const width = window.innerWidth;
    const userAgent = navigator.userAgent;

    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return width < 768 ? "mobile" : "tablet";
    }

    return width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
  }

  private getScreenSize(): string {
    if (typeof window === "undefined") return "unknown";

    const width = window.innerWidth;
    if (width < 640) return "sm";
    if (width < 768) return "md";
    if (width < 1024) return "lg";
    return "xl";
  }

  private getOrientation(): string {
    if (typeof window === "undefined") return "unknown";

    return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
  }

  private sendToExternalAnalytics(event: ConversionEvent): void {
    // Google Analytics 4
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event.type, {
        event_category: "conversion",
        event_label: event.sessionId,
        value: event.value || 0,
        custom_parameters: event.metadata,
      });
    }

    // Google Ads conversion tracking
    if (event.type === "conversion_complete" && (window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
        value: event.value || 1,
        currency: "USD",
      });
    }
  }

  getFunnel(sessionId: string): ConversionFunnel | null {
    return this.funnels.get(sessionId) || null;
  }

  getCurrentFunnel(): ConversionFunnel | null {
    return this.funnels.get(this.currentSession) || null;
  }

  getAllFunnels(): ConversionFunnel[] {
    return Array.from(this.funnels.values());
  }

  getCompletedFunnels(): ConversionFunnel[] {
    return Array.from(this.funnels.values()).filter((f) => f.isComplete);
  }

  getDropOffAnalysis(): { step: string; dropOffRate: number }[] {
    const allFunnels = Array.from(this.funnels.values());
    const stepCounts = new Map<string, { started: number; completed: number }>();

    allFunnels.forEach((funnel) => {
      const steps = [
        "page_view",
        "file_upload",
        "conversion_start",
        "conversion_complete",
        "download",
      ];

      steps.forEach((step, index) => {
        const hasStep = funnel.steps.some((s) => s.type === step);
        const current = stepCounts.get(step) || { started: 0, completed: 0 };

        if (hasStep) {
          current.started++;
          if (index < steps.length - 1) {
            const nextStep = steps[index + 1];
            const hasNextStep = funnel.steps.some((s) => s.type === nextStep);
            if (hasNextStep) {
              current.completed++;
            }
          }
        }

        stepCounts.set(step, current);
      });
    });

    return Array.from(stepCounts.entries()).map(([step, counts]) => ({
      step,
      dropOffRate: counts.started > 0 ? (counts.started - counts.completed) / counts.started : 0,
    }));
  }

  getUserBehaviorMetrics(): UserBehaviorMetrics {
    const sessionEvents = this.events.get(this.currentSession) || [];
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();

    const pageViews = sessionEvents.filter((e) => e.type === "page_view").length;
    const conversions = sessionEvents.filter((e) => e.type === "conversion_complete").length;
    const adInteractions = sessionEvents.filter((e) => e.type === "ad_click").length;

    const bounceRate = pageViews <= 1 && sessionDuration < 30000 ? 1 : 0;
    const engagementScore = Math.min(
      (conversions * 50 + adInteractions * 10 + Math.min(sessionDuration / 60000, 10) * 5) / 100,
      1
    );

    return {
      sessionDuration,
      pageViews,
      conversions,
      adInteractions,
      bounceRate,
      engagementScore,
    };
  }

  getRevenueMetrics(): {
    totalRevenue: number;
    averageRevenuePerUser: number;
    averageRevenuePerSession: number;
    conversionRate: number;
  } {
    const allFunnels = Array.from(this.funnels.values());
    const totalRevenue = allFunnels.reduce((sum, funnel) => sum + funnel.totalValue, 0);
    const uniqueUsers = new Set(allFunnels.map((f) => f.userId)).size;
    const completedConversions = allFunnels.filter((f) => f.isComplete).length;

    return {
      totalRevenue,
      averageRevenuePerUser: uniqueUsers > 0 ? totalRevenue / uniqueUsers : 0,
      averageRevenuePerSession: allFunnels.length > 0 ? totalRevenue / allFunnels.length : 0,
      conversionRate: allFunnels.length > 0 ? completedConversions / allFunnels.length : 0,
    };
  }

  endSession(): void {
    const funnel = this.funnels.get(this.currentSession);
    if (funnel && !funnel.endTime) {
      funnel.endTime = new Date();
      this.funnels.set(this.currentSession, funnel);
      this.saveToStorage();
    }
  }

  clearData(): void {
    this.events.clear();
    this.funnels.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("conversion-events");
      localStorage.removeItem("conversion-funnels");
    }
  }
}

export const conversionTracker = new ConversionTracker();
