"use client";

import { revenueTracker, type RevenueMetrics, type AdPerformanceData } from "./revenue-tracker";
import { abTestingFramework } from "./ab-testing";

export interface RevenueOptimization {
  id: string;
  type: 'ad_placement' | 'pricing' | 'conversion_flow' | 'user_segmentation';
  title: string;
  description: string;
  currentValue: number;
  projectedValue: number;
  potentialUplift: number;
  confidence: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: number;
  recommendations: string[];
  dataPoints: number;
  createdAt: Date;
}

export interface RevenueForecasting {
  period: 'daily' | 'weekly' | 'monthly';
  historical: { date: string; revenue: number }[];
  forecast: { date: string; revenue: number; confidence: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  growthRate: number;
  accuracy: number;
}

export interface CompetitorAnalysis {
  competitor: string;
  estimatedRevenue: number;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  lastUpdated: Date;
}

export interface MarketPositioning {
  category: string;
  position: number;
  totalCompetitors: number;
  marketSize: number;
  growthRate: number;
  keyDifferentiators: string[];
  competitiveAdvantages: string[];
  recommendations: string[];
}

class RevenueOptimizer {
  private optimizations: RevenueOptimization[] = [];
  private forecasts: Map<string, RevenueForecasting> = new Map();
  private competitors: CompetitorAnalysis[] = [];
  private positioning: MarketPositioning | null = null;

  constructor() {
    this.loadFromStorage();
    this.generateOptimizations();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const optimizationsData = localStorage.getItem("revenue-optimizations");
      const forecastsData = localStorage.getItem("revenue-forecasts");
      const competitorsData = localStorage.getItem("competitor-analysis");
      const positioningData = localStorage.getItem("market-positioning");

      if (optimizationsData) {
        this.optimizations = JSON.parse(optimizationsData).map((opt: any) => ({
          ...opt,
          createdAt: new Date(opt.createdAt),
        }));
      }

      if (forecastsData) {
        const forecasts = JSON.parse(forecastsData);
        Object.entries(forecasts).forEach(([key, value]) => {
          this.forecasts.set(key, value as RevenueForecasting);
        });
      }

      if (competitorsData) {
        this.competitors = JSON.parse(competitorsData).map((comp: any) => ({
          ...comp,
          lastUpdated: new Date(comp.lastUpdated),
        }));
      }

      if (positioningData) {
        this.positioning = JSON.parse(positioningData);
      }
    } catch (error) {
      console.error("Failed to load revenue optimization data:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("revenue-optimizations", JSON.stringify(this.optimizations));
      localStorage.setItem("revenue-forecasts", JSON.stringify(Object.fromEntries(this.forecasts)));
      localStorage.setItem("competitor-analysis", JSON.stringify(this.competitors));
      localStorage.setItem("market-positioning", JSON.stringify(this.positioning));
    } catch (error) {
      console.error("Failed to save revenue optimization data:", error);
    }
  }

  // Revenue Optimization Analysis
  generateOptimizations(): void {
    this.optimizations = [];

    // Analyze ad performance for optimization opportunities
    this.analyzeAdPerformance();

    // Analyze conversion flow
    this.analyzeConversionFlow();

    // Analyze user segmentation opportunities
    this.analyzeUserSegmentation();

    // Analyze pricing opportunities
    this.analyzePricingOpportunities();

    // Sort by priority
    this.optimizations.sort((a, b) => b.priority - a.priority);

    this.saveToStorage();
  }

  private analyzeAdPerformance(): void {
    const adPerformance = revenueTracker.getAdPerformanceData();
    const revenueMetrics = revenueTracker.getRevenueMetrics();

    if (adPerformance.length === 0) return;

    // Find underperforming ad positions
    const avgCTR = adPerformance.reduce((sum, ad) => sum + ad.ctr, 0) / adPerformance.length;
    const avgRPM = adPerformance.reduce((sum, ad) => sum + ad.rpm, 0) / adPerformance.length;

    adPerformance.forEach((ad) => {
      if (ad.ctr < avgCTR * 0.8 || ad.rpm < avgRPM * 0.8) {
        const potentialUplift = (avgCTR - ad.ctr) * ad.impressions * 0.05; // Estimated revenue uplift

        this.optimizations.push({
          id: `ad_opt_${ad.position}_${Date.now()}`,
          type: 'ad_placement',
          title: `Optimize ${ad.position} Ad Placement`,
          description: `This ad position is underperforming with ${(ad.ctr * 100).toFixed(2)}% CTR vs ${(avgCTR * 100).toFixed(2)}% average`,
          currentValue: ad.revenue,
          projectedValue: ad.revenue + potentialUplift,
          potentialUplift: potentialUplift / ad.revenue,
          confidence: 0.75,
          effort: 'medium',
          impact: potentialUplift > avgRPM * 10 ? 'high' : 'medium',
          priority: this.calculatePriority(potentialUplift / ad.revenue, 0.75, 'medium'),
          recommendations: [
            'Test different ad sizes and formats',
            'Experiment with ad placement timing',
            'A/B test ad creative variations',
            'Consider native ad integration',
          ],
          dataPoints: ad.impressions,
          createdAt: new Date(),
        });
      }
    });

    // Identify high-performing positions for expansion
    const topPerformers = adPerformance
      .filter(ad => ad.ctr > avgCTR * 1.2 && ad.rpm > avgRPM * 1.2)
      .sort((a, b) => b.rpm - a.rpm);

    if (topPerformers.length > 0) {
      const topAd = topPerformers[0];
      const expansionUplift = topAd.rpm * 1000; // Estimated additional revenue

      this.optimizations.push({
        id: `ad_expansion_${topAd.position}_${Date.now()}`,
        type: 'ad_placement',
        title: `Expand High-Performing Ad Strategy`,
        description: `${topAd.position} position shows exceptional performance. Consider expanding similar placements.`,
        currentValue: revenueMetrics.totalRevenue,
        projectedValue: revenueMetrics.totalRevenue + expansionUplift,
        potentialUplift: expansionUplift / revenueMetrics.totalRevenue,
        confidence: 0.85,
        effort: 'low',
        impact: 'high',
        priority: this.calculatePriority(expansionUplift / revenueMetrics.totalRevenue, 0.85, 'low'),
        recommendations: [
          'Replicate successful ad format in similar positions',
          'Increase traffic allocation to high-performing placements',
          'Test similar placements on other pages',
          'Negotiate better rates with high-performing ad networks',
        ],
        dataPoints: topAd.impressions,
        createdAt: new Date(),
      });
    }
  }

  private analyzeConversionFlow(): void {
    // This would analyze conversion funnel data
    // For now, we'll create a sample optimization based on typical conversion issues

    this.optimizations.push({
      id: `conversion_flow_${Date.now()}`,
      type: 'conversion_flow',
      title: 'Optimize File Upload Flow',
      description: 'Streamline the file upload process to reduce drop-off rates',
      currentValue: 0.65, // Assumed current conversion rate
      projectedValue: 0.78, // Projected improvement
      potentialUplift: 0.2, // 20% improvement
      confidence: 0.8,
      effort: 'medium',
      impact: 'high',
      priority: this.calculatePriority(0.2, 0.8, 'medium'),
      recommendations: [
        'Add progress indicators during upload',
        'Implement drag-and-drop functionality',
        'Reduce number of steps in conversion flow',
        'Add social proof elements',
        'Optimize for mobile experience',
      ],
      dataPoints: 1000,
      createdAt: new Date(),
    });
  }

  private analyzeUserSegmentation(): void {
    this.optimizations.push({
      id: `user_segmentation_${Date.now()}`,
      type: 'user_segmentation',
      title: 'Implement User Segmentation Strategy',
      description: 'Personalize experience based on user behavior and device type',
      currentValue: 1.0, // Baseline
      projectedValue: 1.25, // 25% improvement
      potentialUplift: 0.25,
      confidence: 0.7,
      effort: 'high',
      impact: 'high',
      priority: this.calculatePriority(0.25, 0.7, 'high'),
      recommendations: [
        'Segment users by device type (mobile vs desktop)',
        'Create personalized ad experiences',
        'Implement behavioral targeting',
        'A/B test different user journeys',
        'Use machine learning for dynamic segmentation',
      ],
      dataPoints: 500,
      createdAt: new Date(),
    });
  }

  private analyzePricingOpportunities(): void {
    // For a free tool, this might focus on premium features or affiliate opportunities
    this.optimizations.push({
      id: `pricing_strategy_${Date.now()}`,
      type: 'pricing',
      title: 'Introduce Premium Features',
      description: 'Add premium tier with advanced features for power users',
      currentValue: 0, // Currently free
      projectedValue: 500, // Monthly recurring revenue
      potentialUplift: Infinity, // New revenue stream
      confidence: 0.6,
      effort: 'high',
      impact: 'medium',
      priority: this.calculatePriority(1.0, 0.6, 'high'),
      recommendations: [
        'Offer batch processing for premium users',
        'Add priority processing queue',
        'Provide API access for developers',
        'Include advanced format options',
        'Offer white-label solutions',
      ],
      dataPoints: 100,
      createdAt: new Date(),
    });
  }

  private calculatePriority(uplift: number, confidence: number, effort: 'low' | 'medium' | 'high'): number {
    const effortMultiplier = { low: 1.0, medium: 0.7, high: 0.4 };
    return uplift * confidence * effortMultiplier[effort] * 100;
  }

  // Revenue Forecasting
  generateForecast(period: 'daily' | 'weekly' | 'monthly', days: number = 30): RevenueForecasting {
    const historical = this.getHistoricalData(period, days);
    const forecast = this.calculateForecast(historical, days);

    const forecasting: RevenueForecasting = {
      period,
      historical,
      forecast,
      trend: this.analyzeTrend(historical),
      seasonality: this.detectSeasonality(historical),
      growthRate: this.calculateGrowthRate(historical),
      accuracy: this.calculateForecastAccuracy(historical),
    };

    this.forecasts.set(period, forecasting);
    this.saveToStorage();

    return forecasting;
  }

  private getHistoricalData(period: 'daily' | 'weekly' | 'monthly', days: number): { date: string; revenue: number }[] {
    const data = revenueTracker.getDailyRevenueChart(days);

    if (period === 'weekly') {
      // Aggregate daily data into weekly
      const weeklyData: { date: string; revenue: number }[] = [];
      for (let i = 0; i < data.length; i += 7) {
        const weekData = data.slice(i, i + 7);
        const weekRevenue = weekData.reduce((sum, day) => sum + day.revenue, 0);
        weeklyData.push({
          date: weekData[0].date,
          revenue: weekRevenue,
        });
      }
      return weeklyData;
    }

    if (period === 'monthly') {
      // Aggregate daily data into monthly
      const monthlyData: { date: string; revenue: number }[] = [];
      const monthGroups = new Map<string, number>();

      data.forEach(day => {
        const monthKey = day.date.substring(0, 7); // YYYY-MM
        monthGroups.set(monthKey, (monthGroups.get(monthKey) || 0) + day.revenue);
      });

      monthGroups.forEach((revenue, date) => {
        monthlyData.push({ date, revenue });
      });

      return monthlyData.sort((a, b) => a.date.localeCompare(b.date));
    }

    return data;
  }

  private calculateForecast(historical: { date: string; revenue: number }[], futureDays: number): { date: string; revenue: number; confidence: number }[] {
    if (historical.length < 3) {
      return []; // Need at least 3 data points
    }

    // Simple linear regression for trend
    const n = historical.length;
    const revenues = historical.map(d => d.revenue);
    const avgRevenue = revenues.reduce((sum, r) => sum + r, 0) / n;

    // Calculate trend
    let trend = 0;
    if (n > 1) {
      const firstHalf = revenues.slice(0, Math.floor(n / 2));
      const secondHalf = revenues.slice(Math.floor(n / 2));
      const firstAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;
      trend = (secondAvg - firstAvg) / (n / 2);
    }

    // Generate forecast
    const forecast: { date: string; revenue: number; confidence: number }[] = [];
    const lastDate = new Date(historical[historical.length - 1].date);

    for (let i = 1; i <= futureDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      const baseRevenue = avgRevenue + (trend * i);
      const seasonalityFactor = this.getSeasonalityFactor(forecastDate, historical);
      const forecastRevenue = Math.max(0, baseRevenue * seasonalityFactor);

      // Confidence decreases over time
      const confidence = Math.max(0.3, 0.9 - (i / futureDays) * 0.6);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        revenue: forecastRevenue,
        confidence,
      });
    }

    return forecast;
  }

  private analyzeTrend(data: { date: string; revenue: number }[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private detectSeasonality(data: { date: string; revenue: number }[]): boolean {
    // Simple seasonality detection based on day of week patterns
    if (data.length < 14) return false;

    const dayOfWeekRevenue = new Array(7).fill(0);
    const dayOfWeekCount = new Array(7).fill(0);

    data.forEach(d => {
      const date = new Date(d.date);
      const dayOfWeek = date.getDay();
      dayOfWeekRevenue[dayOfWeek] += d.revenue;
      dayOfWeekCount[dayOfWeek]++;
    });

    const avgRevenues = dayOfWeekRevenue.map((total, i) =>
      dayOfWeekCount[i] > 0 ? total / dayOfWeekCount[i] : 0
    );

    const overallAvg = avgRevenues.reduce((sum, avg) => sum + avg, 0) / 7;
    const variance = avgRevenues.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0) / 7;
    const coefficient = Math.sqrt(variance) / overallAvg;

    return coefficient > 0.2; // Significant variation indicates seasonality
  }

  private calculateGrowthRate(data: { date: string; revenue: number }[]): number {
    if (data.length < 2) return 0;

    const firstValue = data[0].revenue;
    const lastValue = data[data.length - 1].revenue;
    const periods = data.length - 1;

    if (firstValue === 0) return 0;

    return Math.pow(lastValue / firstValue, 1 / periods) - 1;
  }

  private calculateForecastAccuracy(historical: { date: string; revenue: number }[]): number {
    // This would compare previous forecasts with actual results
    // For now, return a reasonable accuracy estimate
    return 0.75;
  }

  private getSeasonalityFactor(date: Date, historical: { date: string; revenue: number }[]): number {
    // Simple day-of-week seasonality
    const dayOfWeek = date.getDay();
    const dayRevenues = historical
      .filter(d => new Date(d.date).getDay() === dayOfWeek)
      .map(d => d.revenue);

    if (dayRevenues.length === 0) return 1;

    const dayAvg = dayRevenues.reduce((sum, r) => sum + r, 0) / dayRevenues.length;
    const overallAvg = historical.reduce((sum, d) => sum + d.revenue, 0) / historical.length;

    return overallAvg > 0 ? dayAvg / overallAvg : 1;
  }

  // Competitor Analysis
  addCompetitorAnalysis(analysis: Omit<CompetitorAnalysis, 'lastUpdated'>): void {
    const competitorAnalysis: CompetitorAnalysis = {
      ...analysis,
      lastUpdated: new Date(),
    };

    const existingIndex = this.competitors.findIndex(c => c.competitor === analysis.competitor);
    if (existingIndex >= 0) {
      this.competitors[existingIndex] = competitorAnalysis;
    } else {
      this.competitors.push(competitorAnalysis);
    }

    this.saveToStorage();
  }

  updateMarketPositioning(positioning: MarketPositioning): void {
    this.positioning = positioning;
    this.saveToStorage();
  }

  // Public API
  getOptimizations(): RevenueOptimization[] {
    return this.optimizations;
  }

  getTopOptimizations(limit: number = 5): RevenueOptimization[] {
    return this.optimizations.slice(0, limit);
  }

  getOptimizationsByType(type: RevenueOptimization['type']): RevenueOptimization[] {
    return this.optimizations.filter(opt => opt.type === type);
  }

  getForecast(period: 'daily' | 'weekly' | 'monthly'): RevenueForecasting | null {
    return this.forecasts.get(period) || null;
  }

  getCompetitorAnalysis(): CompetitorAnalysis[] {
    return this.competitors;
  }

  getMarketPositioning(): MarketPositioning | null {
    return this.positioning;
  }

  calculateROI(optimization: RevenueOptimization, implementationCost: number): number {
    const annualUplift = optimization.potentialUplift * optimization.currentValue * 12;
    return implementationCost > 0 ? (annualUplift - implementationCost) / implementationCost : 0;
  }

  exportData(): {
    optimizations: RevenueOptimization[];
    forecasts: RevenueForecasting[];
    competitors: CompetitorAnalysis[];
    positioning: MarketPositioning | null;
  } {
    return {
      optimizations: this.optimizations,
      forecasts: Array.from(this.forecasts.values()),
      competitors: this.competitors,
      positioning: this.positioning,
    };
  }

  clearData(): void {
    this.optimizations = [];
    this.forecasts.clear();
    this.competitors = [];
    this.positioning = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("revenue-optimizations");
      localStorage.removeItem("revenue-forecasts");
      localStorage.removeItem("competitor-analysis");
      localStorage.removeItem("market-positioning");
    }
  }
}

export const revenueOptimizer = new RevenueOptimizer();