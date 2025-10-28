"use client";

export interface HeatmapEvent {
  id: string;
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'resize';
  x: number;
  y: number;
  timestamp: Date;
  sessionId: string;
  userId: string;
  element: string;
  elementId?: string;
  elementClass?: string;
  pageUrl: string;
  viewportWidth: number;
  viewportHeight: number;
  scrollDepth?: number;
  hoverDuration?: number;
}

export interface HeatmapData {
  clicks: HeatmapEvent[];
  scrolls: HeatmapEvent[];
  hovers: HeatmapEvent[];
  pageUrl: string;
  totalEvents: number;
  uniqueUsers: number;
  averageScrollDepth: number;
  clickHotspots: { x: number; y: number; intensity: number }[];
  scrollHeatmap: { depth: number; percentage: number }[];
}

export interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  description: string;
  elements: string[];
  avgDuration: number;
  conversionImpact: number;
}

class HeatmapTracker {
  private events: HeatmapEvent[] = [];
  private currentSession: string;
  private currentUser: string;
  private isTracking: boolean = false;
  private scrollDepth: number = 0;
  private maxScrollDepth: number = 0;
  private hoverStartTime: Map<string, number> = new Map();

  constructor() {
    this.currentSession = this.generateSessionId();
    this.currentUser = this.getUserId();
    this.loadFromStorage();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `heatmap_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getUserId(): string {
    if (typeof window === "undefined") return "anonymous";

    let userId = localStorage.getItem("heatmap-user-id");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("heatmap-user-id", userId);
    }
    return userId;
  }

  private initializeTracking(): void {
    if (typeof window === "undefined") return;

    this.isTracking = true;
    this.setupEventListeners();
    this.startScrollTracking();
    this.cleanupOldEvents();
  }

  private setupEventListeners(): void {
    if (typeof window === "undefined") return;

    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Hover tracking
    document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
    document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);

    // Focus tracking
    document.addEventListener('focus', this.handleFocus.bind(this), true);

    // Resize tracking
    window.addEventListener('resize', this.handleResize.bind(this));

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseTracking();
      } else {
        this.resumeTracking();
      }
    });

    // Page unload
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  private handleClick(event: MouseEvent): void {
    if (!this.isTracking) return;

    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.trackEvent({
      type: 'click',
      x: event.clientX,
      y: event.clientY,
      element: target.tagName.toLowerCase(),
      elementId: target.id || undefined,
      elementClass: target.className || undefined,
    });
  }

  private handleMouseOver(event: MouseEvent): void {
    if (!this.isTracking) return;

    const target = event.target as HTMLElement;
    const elementKey = this.getElementKey(target);
    this.hoverStartTime.set(elementKey, Date.now());
  }

  private handleMouseOut(event: MouseEvent): void {
    if (!this.isTracking) return;

    const target = event.target as HTMLElement;
    const elementKey = this.getElementKey(target);
    const startTime = this.hoverStartTime.get(elementKey);

    if (startTime) {
      const hoverDuration = Date.now() - startTime;
      this.hoverStartTime.delete(elementKey);

      // Only track hovers longer than 500ms
      if (hoverDuration > 500) {
        this.trackEvent({
          type: 'hover',
          x: event.clientX,
          y: event.clientY,
          element: target.tagName.toLowerCase(),
          elementId: target.id || undefined,
          elementClass: target.className || undefined,
          hoverDuration,
        });
      }
    }
  }

  private handleFocus(event: FocusEvent): void {
    if (!this.isTracking) return;

    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.trackEvent({
      type: 'focus',
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      element: target.tagName.toLowerCase(),
      elementId: target.id || undefined,
      elementClass: target.className || undefined,
    });
  }

  private handleResize(): void {
    if (!this.isTracking) return;

    this.trackEvent({
      type: 'resize',
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      element: 'window',
    });
  }

  private startScrollTracking(): void {
    if (typeof window === "undefined") return;

    let ticking = false;

    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      this.scrollDepth = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
      this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking && this.isTracking) {
        requestAnimationFrame(updateScrollDepth);
        ticking = true;

        // Track scroll events every 5% of scroll depth change
        const currentDepth = Math.floor(this.scrollDepth / 5) * 5;
        const lastTrackedDepth = this.getLastScrollDepth();

        if (currentDepth !== lastTrackedDepth && currentDepth % 10 === 0) {
          this.trackEvent({
            type: 'scroll',
            x: window.innerWidth / 2,
            y: window.pageYOffset + window.innerHeight / 2,
            element: 'body',
            scrollDepth: currentDepth,
          });
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  private trackEvent(eventData: Partial<HeatmapEvent>): void {
    const event: HeatmapEvent = {
      id: `heatmap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.currentSession,
      userId: this.currentUser,
      pageUrl: window.location.href,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollDepth: this.scrollDepth,
      ...eventData,
    } as HeatmapEvent;

    this.events.push(event);

    // Save to storage periodically
    if (this.events.length % 10 === 0) {
      this.saveToStorage();
    }
  }

  private getElementKey(element: HTMLElement): string {
    return `${element.tagName}_${element.id || ''}_${element.className || ''}`;
  }

  private getLastScrollDepth(): number {
    const scrollEvents = this.events.filter(e => e.type === 'scroll');
    return scrollEvents.length > 0 ? scrollEvents[scrollEvents.length - 1].scrollDepth || 0 : 0;
  }

  private cleanupOldEvents(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.events = this.events.filter(event => event.timestamp > sevenDaysAgo);
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const eventsData = localStorage.getItem('heatmap-events');
      if (eventsData) {
        this.events = JSON.parse(eventsData).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem('heatmap-events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save heatmap data:', error);
    }
  }

  pauseTracking(): void {
    this.isTracking = false;
  }

  resumeTracking(): void {
    this.isTracking = true;
  }

  // Public API
  getHeatmapData(pageUrl?: string): HeatmapData {
    const filteredEvents = pageUrl
      ? this.events.filter(e => e.pageUrl === pageUrl)
      : this.events;

    const clicks = filteredEvents.filter(e => e.type === 'click');
    const scrolls = filteredEvents.filter(e => e.type === 'scroll');
    const hovers = filteredEvents.filter(e => e.type === 'hover');

    const uniqueUsers = new Set(filteredEvents.map(e => e.userId)).size;

    const scrollDepths = scrolls.map(s => s.scrollDepth || 0).filter(d => d > 0);
    const averageScrollDepth = scrollDepths.length > 0
      ? scrollDepths.reduce((sum, depth) => sum + depth, 0) / scrollDepths.length
      : 0;

    const clickHotspots = this.generateClickHotspots(clicks);
    const scrollHeatmap = this.generateScrollHeatmap(scrolls);

    return {
      clicks,
      scrolls,
      hovers,
      pageUrl: pageUrl || window.location.href,
      totalEvents: filteredEvents.length,
      uniqueUsers,
      averageScrollDepth,
      clickHotspots,
      scrollHeatmap,
    };
  }

  private generateClickHotspots(clicks: HeatmapEvent[]): { x: number; y: number; intensity: number }[] {
    const hotspots: Map<string, { x: number; y: number; count: number }> = new Map();
    const gridSize = 50; // 50px grid

    clicks.forEach(click => {
      const gridX = Math.floor(click.x / gridSize) * gridSize;
      const gridY = Math.floor(click.y / gridSize) * gridSize;
      const key = `${gridX}_${gridY}`;

      const existing = hotspots.get(key) || { x: gridX, y: gridY, count: 0 };
      existing.count++;
      hotspots.set(key, existing);
    });

    const maxCount = Math.max(...Array.from(hotspots.values()).map(h => h.count));

    return Array.from(hotspots.values()).map(hotspot => ({
      x: hotspot.x,
      y: hotspot.y,
      intensity: hotspot.count / maxCount,
    }));
  }

  private generateScrollHeatmap(scrolls: HeatmapEvent[]): { depth: number; percentage: number }[] {
    const depthCounts: Map<number, number> = new Map();

    scrolls.forEach(scroll => {
      const depth = Math.floor((scroll.scrollDepth || 0) / 10) * 10;
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
    });

    const totalScrolls = scrolls.length;

    return Array.from(depthCounts.entries()).map(([depth, count]) => ({
      depth,
      percentage: (count / totalScrolls) * 100,
    }));
  }

  getUserBehaviorPatterns(): UserBehaviorPattern[] {
    const patterns: UserBehaviorPattern[] = [];

    // Analyze click patterns
    const clickElements = this.events
      .filter(e => e.type === 'click')
      .reduce((acc, event) => {
        const key = event.element;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    Object.entries(clickElements).forEach(([element, frequency]) => {
      if (frequency > 5) { // Only patterns with significant frequency
        patterns.push({
          pattern: `frequent_${element}_clicks`,
          frequency,
          description: `Users frequently click on ${element} elements`,
          elements: [element],
          avgDuration: 0,
          conversionImpact: this.calculateConversionImpact(element, 'click'),
        });
      }
    });

    // Analyze scroll patterns
    const scrollDepths = this.events
      .filter(e => e.type === 'scroll' && e.scrollDepth)
      .map(e => e.scrollDepth!);

    if (scrollDepths.length > 0) {
      const avgScrollDepth = scrollDepths.reduce((sum, depth) => sum + depth, 0) / scrollDepths.length;
      patterns.push({
        pattern: 'scroll_behavior',
        frequency: scrollDepths.length,
        description: `Average scroll depth: ${Math.round(avgScrollDepth)}%`,
        elements: ['body'],
        avgDuration: 0,
        conversionImpact: avgScrollDepth > 50 ? 0.8 : 0.4,
      });
    }

    // Analyze hover patterns
    const hoverDurations = this.events
      .filter(e => e.type === 'hover' && e.hoverDuration)
      .map(e => e.hoverDuration!);

    if (hoverDurations.length > 0) {
      const avgHoverDuration = hoverDurations.reduce((sum, duration) => sum + duration, 0) / hoverDurations.length;
      patterns.push({
        pattern: 'hover_engagement',
        frequency: hoverDurations.length,
        description: `Average hover duration: ${Math.round(avgHoverDuration)}ms`,
        elements: ['interactive'],
        avgDuration: avgHoverDuration,
        conversionImpact: avgHoverDuration > 2000 ? 0.9 : 0.5,
      });
    }

    return patterns.sort((a, b) => b.conversionImpact - a.conversionImpact);
  }

  private calculateConversionImpact(element: string, eventType: string): number {
    // Simple heuristic for conversion impact
    const highImpactElements = ['button', 'a', 'input', 'form'];
    const mediumImpactElements = ['div', 'span', 'img'];

    if (highImpactElements.includes(element)) return 0.8;
    if (mediumImpactElements.includes(element)) return 0.5;
    return 0.3;
  }

  getClickHeatmapForElement(elementSelector: string): HeatmapEvent[] {
    return this.events.filter(e =>
      e.type === 'click' &&
      (e.element === elementSelector ||
        e.elementId === elementSelector ||
        e.elementClass?.includes(elementSelector))
    );
  }

  getScrollAnalytics(): {
    averageScrollDepth: number;
    maxScrollDepth: number;
    scrollCompletionRate: number;
    scrollBounceRate: number;
  } {
    const scrollEvents = this.events.filter(e => e.type === 'scroll' && e.scrollDepth);

    if (scrollEvents.length === 0) {
      return {
        averageScrollDepth: 0,
        maxScrollDepth: 0,
        scrollCompletionRate: 0,
        scrollBounceRate: 0,
      };
    }

    const scrollDepths = scrollEvents.map(e => e.scrollDepth!);
    const averageScrollDepth = scrollDepths.reduce((sum, depth) => sum + depth, 0) / scrollDepths.length;
    const maxScrollDepth = Math.max(...scrollDepths);
    const scrollCompletionRate = scrollDepths.filter(depth => depth >= 90).length / scrollDepths.length;
    const scrollBounceRate = scrollDepths.filter(depth => depth < 25).length / scrollDepths.length;

    return {
      averageScrollDepth,
      maxScrollDepth,
      scrollCompletionRate,
      scrollBounceRate,
    };
  }

  exportData(): {
    events: HeatmapEvent[];
    heatmapData: HeatmapData;
    behaviorPatterns: UserBehaviorPattern[];
    scrollAnalytics: {
      averageScrollDepth: number;
      maxScrollDepth: number;
      scrollCompletionRate: number;
      scrollBounceRate: number;
    };
  } {
    return {
      events: this.events,
      heatmapData: this.getHeatmapData(),
      behaviorPatterns: this.getUserBehaviorPatterns(),
      scrollAnalytics: this.getScrollAnalytics(),
    };
  }

  clearData(): void {
    this.events = [];
    this.hoverStartTime.clear();
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;

    if (typeof window !== "undefined") {
      localStorage.removeItem('heatmap-events');
    }
  }
}

export const heatmapTracker = new HeatmapTracker();