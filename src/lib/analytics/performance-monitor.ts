"use client";

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Runtime Performance
  memoryUsage: number;
  jsHeapSize: number;
  domNodes: number;

  // Network Performance
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;

  // Bundle Performance
  bundleSize: number;
  loadTime: number;
  renderTime: number;

  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private thresholds = {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    fcp: 1800, // 1.8s
    ttfb: 800, // 800ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    jsHeapSize: 100 * 1024 * 1024, // 100MB
    domNodes: 1500,
  };

  constructor() {
    this.initializeMonitoring();
    this.loadFromStorage();
  }

  private initializeMonitoring(): void {
    if (typeof window === "undefined") return;

    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor runtime performance
    this.monitorRuntimePerformance();

    // Monitor network performance
    this.monitorNetworkPerformance();

    // Monitor bundle performance
    this.monitorBundlePerformance();

    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  private observeWebVitals(): void {
    if (typeof window === "undefined" || !('PerformanceObserver' in window)) return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      this.updateMetric('lcp', lastEntry.startTime);
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.updateMetric('fid', entry.processingStart - entry.startTime);
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.updateMetric('cls', clsValue);
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // First Contentful Paint
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('fcp', entry.startTime);
        }
      });
    });

    try {
      navigationObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('navigation', navigationObserver);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  private monitorRuntimePerformance(): void {
    if (typeof window === "undefined") return;

    const checkRuntimePerformance = () => {
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.updateMetric('memoryUsage', memory.usedJSHeapSize);
        this.updateMetric('jsHeapSize', memory.totalJSHeapSize);
      }

      // DOM nodes count
      const domNodes = document.querySelectorAll('*').length;
      this.updateMetric('domNodes', domNodes);

      // TTFB from navigation timing
      if (performance.timing) {
        const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
        this.updateMetric('ttfb', ttfb);
      }
    };

    checkRuntimePerformance();
    setInterval(checkRuntimePerformance, 5000); // Check every 5 seconds
  }

  private monitorNetworkPerformance(): void {
    if (typeof window === "undefined" || !('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    if (connection) {
      const updateNetworkInfo = () => {
        this.updateNetworkMetrics({
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);
    }
  }

  private monitorBundlePerformance(): void {
    if (typeof window === "undefined") return;

    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      const renderTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;

      // Estimate bundle size from resource timing
      let bundleSize = 0;
      const resources = performance.getEntriesByType('resource');
      resources.forEach((resource: any) => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          bundleSize += resource.transferSize || 0;
        }
      });

      this.updateBundleMetrics({ bundleSize, loadTime, renderTime });
    });
  }

  private startPeriodicMonitoring(): void {
    // Collect comprehensive metrics every 30 seconds
    setInterval(() => {
      this.collectCurrentMetrics();
    }, 30000);

    // Clean up old metrics (keep last 24 hours)
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Every 5 minutes
  }

  private updateMetric(metric: keyof PerformanceMetrics, value: number): void {
    const threshold = this.thresholds[metric as keyof typeof this.thresholds];

    if (threshold && value > threshold) {
      this.createAlert('warning', metric, value, threshold);
    }

    // Update current metrics
    this.collectCurrentMetrics();
  }

  private updateNetworkMetrics(networkInfo: {
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  }): void {
    // Network metrics are updated as part of current metrics collection
  }

  private updateBundleMetrics(bundleInfo: {
    bundleSize: number;
    loadTime: number;
    renderTime: number;
  }): void {
    // Bundle metrics are updated as part of current metrics collection
  }

  private collectCurrentMetrics(): void {
    if (typeof window === "undefined") return;

    const metrics: PerformanceMetrics = {
      lcp: this.getLatestMetric('lcp'),
      fid: this.getLatestMetric('fid'),
      cls: this.getLatestMetric('cls'),
      fcp: this.getLatestMetric('fcp'),
      ttfb: this.getLatestMetric('ttfb'),
      memoryUsage: this.getMemoryUsage(),
      jsHeapSize: this.getJSHeapSize(),
      domNodes: document.querySelectorAll('*').length,
      connectionType: this.getConnectionType(),
      effectiveType: this.getEffectiveType(),
      downlink: this.getDownlink(),
      rtt: this.getRTT(),
      bundleSize: this.getBundleSize(),
      loadTime: this.getLoadTime(),
      renderTime: this.getRenderTime(),
      timestamp: new Date(),
    };

    this.metrics.push(metrics);
    this.saveToStorage();
  }

  private getLatestMetric(metric: string): number | null {
    // Implementation would track latest values from observers
    return null; // Placeholder
  }

  private getMemoryUsage(): number {
    if (typeof window !== "undefined" && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getJSHeapSize(): number {
    if (typeof window !== "undefined" && 'memory' in performance) {
      return (performance as any).memory.totalJSHeapSize;
    }
    return 0;
  }

  private getConnectionType(): string {
    if (typeof window !== "undefined" && 'connection' in navigator) {
      return (navigator as any).connection?.type || 'unknown';
    }
    return 'unknown';
  }

  private getEffectiveType(): string {
    if (typeof window !== "undefined" && 'connection' in navigator) {
      return (navigator as any).connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getDownlink(): number {
    if (typeof window !== "undefined" && 'connection' in navigator) {
      return (navigator as any).connection?.downlink || 0;
    }
    return 0;
  }

  private getRTT(): number {
    if (typeof window !== "undefined" && 'connection' in navigator) {
      return (navigator as any).connection?.rtt || 0;
    }
    return 0;
  }

  private getBundleSize(): number {
    // This would be calculated from resource timing
    return 0; // Placeholder
  }

  private getLoadTime(): number {
    if (typeof window !== "undefined" && performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return 0;
  }

  private getRenderTime(): number {
    if (typeof window !== "undefined" && performance.timing) {
      return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    }
    return 0;
  }

  private createAlert(
    type: PerformanceAlert['type'],
    metric: string,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      metric,
      value,
      threshold,
      message: `${metric.toUpperCase()} exceeded threshold: ${value} > ${threshold}`,
      timestamp: new Date(),
    };

    this.alerts.push(alert);
    this.saveToStorage();

    // Emit alert event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('performance-alert', { detail: alert }));
    }
  }

  private cleanupOldMetrics(): void {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    this.metrics = this.metrics.filter(metric => metric.timestamp > twentyFourHoursAgo);
    this.alerts = this.alerts.filter(alert => alert.timestamp > twentyFourHoursAgo);

    this.saveToStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const metricsData = localStorage.getItem('performance-metrics');
      const alertsData = localStorage.getItem('performance-alerts');

      if (metricsData) {
        this.metrics = JSON.parse(metricsData).map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp),
        }));
      }

      if (alertsData) {
        this.alerts = JSON.parse(alertsData).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load performance monitoring data:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem('performance-metrics', JSON.stringify(this.metrics));
      localStorage.setItem('performance-alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save performance monitoring data:', error);
    }
  }

  // Public API
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(hours: number = 1): PerformanceMetrics[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  getActiveAlerts(): PerformanceAlert[] {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return this.alerts.filter(alert => alert.timestamp > oneHourAgo);
  }

  getPerformanceScore(): number {
    const current = this.getCurrentMetrics();
    if (!current) return 0;

    let score = 100;

    // Deduct points for poor Core Web Vitals
    if (current.lcp && current.lcp > 2500) score -= 20;
    if (current.fid && current.fid > 100) score -= 15;
    if (current.cls && current.cls > 0.1) score -= 15;
    if (current.fcp && current.fcp > 1800) score -= 10;
    if (current.ttfb && current.ttfb > 800) score -= 10;

    // Deduct points for high resource usage
    if (current.memoryUsage > this.thresholds.memoryUsage) score -= 15;
    if (current.domNodes > this.thresholds.domNodes) score -= 10;

    // Deduct points for slow network
    if (current.effectiveType === 'slow-2g' || current.effectiveType === '2g') score -= 5;

    return Math.max(0, score);
  }

  exportData(): {
    metrics: PerformanceMetrics[];
    alerts: PerformanceAlert[];
    score: number;
  } {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      score: this.getPerformanceScore(),
    };
  }

  clearData(): void {
    this.metrics = [];
    this.alerts = [];
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    if (typeof window !== "undefined") {
      localStorage.removeItem('performance-metrics');
      localStorage.removeItem('performance-alerts');
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();