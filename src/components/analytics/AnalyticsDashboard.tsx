"use client";

import { useState, useEffect } from "react";
import {
  conversionTracker,
  type ConversionFunnel,
  type UserBehaviorMetrics,
} from "@/lib/analytics/conversion-tracker";
import {
  revenueTracker,
  type RevenueMetrics,
  type AdPerformanceData,
} from "@/lib/analytics/revenue-tracker";
import {
  performanceMonitor,
  type PerformanceMetrics,
  type PerformanceAlert,
} from "@/lib/analytics/performance-monitor";
import {
  heatmapTracker,
  type HeatmapData,
  type UserBehaviorPattern,
} from "@/lib/analytics/heatmap-tracker";

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({
  className = "",
}: AnalyticsDashboardProps) {
  const [behaviorMetrics, setBehaviorMetrics] =
    useState<UserBehaviorMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(
    null
  );
  const [adPerformance, setAdPerformance] = useState<AdPerformanceData[]>([]);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [dropOffAnalysis, setDropOffAnalysis] = useState<
    { step: string; dropOffRate: number }[]
  >([]);
  const [dailyRevenue, setDailyRevenue] = useState<
    { date: string; revenue: number }[]
  >([]);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [performanceAlerts, setPerformanceAlerts] = useState<
    PerformanceAlert[]
  >([]);
  const [performanceScore, setPerformanceScore] = useState<number>(0);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [behaviorPatterns, setBehaviorPatterns] = useState<
    UserBehaviorPattern[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "heatmap" | "revenue"
  >("overview");

  useEffect(() => {
    loadAnalyticsData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = () => {
    try {
      // Load behavior metrics
      const behavior = conversionTracker.getUserBehaviorMetrics();
      setBehaviorMetrics(behavior);

      // Load revenue metrics
      const revenue = revenueTracker.getRevenueMetrics();
      setRevenueMetrics(revenue);

      // Load ad performance
      const adData = revenueTracker.getAdPerformanceData();
      setAdPerformance(adData);

      // Load conversion funnels
      const allFunnels = conversionTracker.getAllFunnels();
      setFunnels(allFunnels);

      // Load drop-off analysis
      const dropOff = conversionTracker.getDropOffAnalysis();
      setDropOffAnalysis(dropOff);

      // Load daily revenue chart
      const dailyData = revenueTracker.getDailyRevenueChart(7);
      setDailyRevenue(dailyData);

      // Load performance metrics
      const performance = performanceMonitor.getCurrentMetrics();
      setPerformanceMetrics(performance);

      // Load performance alerts
      const alerts = performanceMonitor.getActiveAlerts();
      setPerformanceAlerts(alerts);

      // Load performance score
      const score = performanceMonitor.getPerformanceScore();
      setPerformanceScore(score);

      // Load heatmap data
      const heatmap = heatmapTracker.getHeatmapData();
      setHeatmapData(heatmap);

      // Load behavior patterns
      const patterns = heatmapTracker.getUserBehaviorPatterns();
      setBehaviorPatterns(patterns);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h2>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "overview", label: "Overview" },
          { key: "performance", label: "Performance" },
          { key: "heatmap", label: "User Behavior" },
          { key: "revenue", label: "Revenue" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {behaviorMetrics && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">
                Session Duration
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatDuration(behaviorMetrics.sessionDuration)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Conversions
              </div>
              <div className="text-2xl font-bold text-green-900">
                {behaviorMetrics.conversions}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">
                Engagement Score
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatPercentage(behaviorMetrics.engagementScore)}
              </div>
            </div>
          </>
        )}
        {revenueMetrics && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">
              Daily Revenue
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatCurrency(revenueMetrics.dailyRevenue)}
            </div>
          </div>
        )}
      </div>

      {/* Revenue Metrics */}
      {revenueMetrics && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">
                Total Revenue
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(revenueMetrics.totalRevenue)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">
                Average RPM
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(revenueMetrics.averageRPM)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">
                Average CTR
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatPercentage(revenueMetrics.averageCTR)}
              </div>
            </div>
          </div>

          {/* Top Revenue Sources */}
          {revenueMetrics.topRevenueSources.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">
                Top Revenue Sources
              </h4>
              <div className="space-y-2">
                {revenueMetrics.topRevenueSources.map((source, index) => (
                  <div
                    key={source.source}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">
                      {source.source}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(source.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ad Performance */}
      {adPerformance.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Ad Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RPM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adPerformance.map((ad, index) => (
                  <tr
                    key={`${ad.position}_${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ad.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercentage(ad.ctr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ad.rpm)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ad.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversion Funnel Analysis */}
      {dropOffAnalysis.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Conversion Funnel
          </h3>
          <div className="space-y-3">
            {dropOffAnalysis.map((step, index) => (
              <div
                key={step.step}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 capitalize">
                    {step.step.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Drop-off: {formatPercentage(step.dropOffRate)}
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${step.dropOffRate * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Revenue Chart */}
      {dailyRevenue.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Daily Revenue (Last 7 Days)
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-end justify-between h-32 space-x-2">
              {dailyRevenue.map((day, index) => {
                const maxRevenue = Math.max(
                  ...dailyRevenue.map((d) => d.revenue)
                );
                const height =
                  maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className="bg-blue-600 rounded-t w-full min-h-[4px] flex items-end justify-center"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    >
                      <span className="text-xs text-white font-medium mb-1">
                        {day.revenue > 0 ? formatCurrency(day.revenue) : ""}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!behaviorMetrics && !revenueMetrics && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No analytics data available
          </h3>
          <p className="text-gray-500">
            Start using the application to collect analytics data.
          </p>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {/* Performance Score */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Performance Score
                </h3>
                <p className="text-sm text-gray-600">
                  Overall application performance rating
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-4xl font-bold ${
                    performanceScore >= 90
                      ? "text-green-600"
                      : performanceScore >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {performanceScore}
                </div>
                <div className="text-sm text-gray-500">/ 100</div>
              </div>
            </div>
          </div>

          {/* Performance Alerts */}
          {performanceAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-3">
                Active Performance Alerts
              </h4>
              <div className="space-y-2">
                {performanceAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-red-700">{alert.message}</span>
                    <span className="text-red-600 font-medium">
                      {alert.value.toFixed(2)} &gt; {alert.threshold}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Web Vitals */}
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 font-medium">
                  Largest Contentful Paint
                </div>
                <div
                  className={`text-2xl font-bold ${
                    (performanceMetrics.lcp || 0) <= 2500
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {performanceMetrics.lcp
                    ? `${(performanceMetrics.lcp / 1000).toFixed(2)}s`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 font-medium">
                  First Input Delay
                </div>
                <div
                  className={`text-2xl font-bold ${
                    (performanceMetrics.fid || 0) <= 100
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {performanceMetrics.fid
                    ? `${performanceMetrics.fid.toFixed(0)}ms`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm text-gray-600 font-medium">
                  Cumulative Layout Shift
                </div>
                <div
                  className={`text-2xl font-bold ${
                    (performanceMetrics.cls || 0) <= 0.1
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {performanceMetrics.cls
                    ? performanceMetrics.cls.toFixed(3)
                    : "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Resource Usage */}
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Memory Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>JS Heap Size</span>
                    <span>
                      {(performanceMetrics.jsHeapSize / 1024 / 1024).toFixed(1)}{" "}
                      MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Memory Used</span>
                    <span>
                      {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(
                        1
                      )}{" "}
                      MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>DOM Nodes</span>
                    <span>{performanceMetrics.domNodes.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Network Info</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Connection Type</span>
                    <span className="capitalize">
                      {performanceMetrics.connectionType}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Effective Type</span>
                    <span className="uppercase">
                      {performanceMetrics.effectiveType}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Downlink</span>
                    <span>{performanceMetrics.downlink} Mbps</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>RTT</span>
                    <span>{performanceMetrics.rtt}ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Heatmap Tab */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          {/* User Behavior Patterns */}
          {behaviorPatterns.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                User Behavior Patterns
              </h3>
              <div className="space-y-4">
                {behaviorPatterns.slice(0, 5).map((pattern, index) => (
                  <div
                    key={pattern.pattern}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {pattern.description}
                      </div>
                      <div className="text-sm text-gray-600">
                        Frequency: {pattern.frequency} events
                        {pattern.avgDuration > 0 &&
                          ` • Avg Duration: ${pattern.avgDuration}ms`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          pattern.conversionImpact > 0.7
                            ? "bg-green-100 text-green-800"
                            : pattern.conversionImpact > 0.5
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {(pattern.conversionImpact * 100).toFixed(0)}% Impact
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heatmap Summary */}
          {heatmapData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">
                  Total Interactions
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {heatmapData.totalEvents.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">
                  Unique Users
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {heatmapData.uniqueUsers.toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">
                  Avg Scroll Depth
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {heatmapData.averageScrollDepth.toFixed(0)}%
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">
                  Click Events
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {heatmapData.clicks.length.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Click Hotspots */}
          {heatmapData && heatmapData.clickHotspots.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Click Hotspots
              </h3>
              <div className="text-sm text-gray-600 mb-4">
                Areas with highest click concentration (top 10)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {heatmapData.clickHotspots
                  .sort((a, b) => b.intensity - a.intensity)
                  .slice(0, 10)
                  .map((hotspot, index) => (
                    <div
                      key={`${hotspot.x}_${hotspot.y}`}
                      className="text-center p-2 bg-gray-50 rounded"
                    >
                      <div className="text-xs text-gray-600">#{index + 1}</div>
                      <div className="text-sm font-medium">
                        ({hotspot.x}, {hotspot.y})
                      </div>
                      <div className="text-xs text-gray-500">
                        {(hotspot.intensity * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Scroll Heatmap */}
          {heatmapData && heatmapData.scrollHeatmap.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Scroll Depth Analysis
              </h3>
              <div className="space-y-2">
                {heatmapData.scrollHeatmap
                  .sort((a, b) => a.depth - b.depth)
                  .map((scroll) => (
                    <div
                      key={scroll.depth}
                      className="flex items-center space-x-4"
                    >
                      <div className="w-16 text-sm text-gray-600">
                        {scroll.depth}%
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{
                            width: `${Math.min(scroll.percentage, 100)}%`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                          {scroll.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overview Tab (existing content) */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {behaviorMetrics && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">
                    Session Duration
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatDuration(behaviorMetrics.sessionDuration)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">
                    Conversions
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {behaviorMetrics.conversions}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">
                    Engagement Score
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatPercentage(behaviorMetrics.engagementScore)}
                  </div>
                </div>
              </>
            )}
            {revenueMetrics && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600 font-medium">
                  Daily Revenue
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {formatCurrency(revenueMetrics.dailyRevenue)}
                </div>
              </div>
            )}
          </div>

          {/* Conversion Funnel Analysis */}
          {dropOffAnalysis.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Conversion Funnel
              </h3>
              <div className="space-y-3">
                {dropOffAnalysis.map((step, index) => (
                  <div
                    key={step.step}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900 capitalize">
                        {step.step.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        Drop-off: {formatPercentage(step.dropOffRate)}
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${step.dropOffRate * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Tab (existing revenue content) */}
      {activeTab === "revenue" && (
        <div className="space-y-8">
          {/* Revenue Metrics */}
          {revenueMetrics && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Revenue Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">
                    Total Revenue
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(revenueMetrics.totalRevenue)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">
                    Average RPM
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(revenueMetrics.averageRPM)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">
                    Average CTR
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPercentage(revenueMetrics.averageCTR)}
                  </div>
                </div>
              </div>

              {/* Top Revenue Sources */}
              {revenueMetrics.topRevenueSources.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">
                    Top Revenue Sources
                  </h4>
                  <div className="space-y-2">
                    {revenueMetrics.topRevenueSources.map((source, index) => (
                      <div
                        key={source.source}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600">
                          {source.source}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(source.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ad Performance */}
          {adPerformance.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Ad Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Impressions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CTR
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RPM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adPerformance.map((ad, index) => (
                      <tr
                        key={`${ad.position}_${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ad.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ad.impressions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ad.clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPercentage(ad.ctr)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(ad.rpm)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(ad.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Revenue Chart */}
          {dailyRevenue.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Daily Revenue (Last 7 Days)
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-end justify-between h-32 space-x-2">
                  {dailyRevenue.map((day, index) => {
                    const maxRevenue = Math.max(
                      ...dailyRevenue.map((d) => d.revenue)
                    );
                    const height =
                      maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                    return (
                      <div
                        key={day.date}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className="bg-blue-600 rounded-t w-full min-h-[4px] flex items-end justify-center"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        >
                          <span className="text-xs text-white font-medium mb-1">
                            {day.revenue > 0 ? formatCurrency(day.revenue) : ""}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 mt-2">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!behaviorMetrics &&
        !revenueMetrics &&
        !performanceMetrics &&
        !heatmapData && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No analytics data available
            </h3>
            <p className="text-gray-500">
              Start using the application to collect analytics data.
            </p>
          </div>
        )}
    </div>
  );
}
