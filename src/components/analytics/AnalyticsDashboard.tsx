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

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = "" }: AnalyticsDashboardProps) {
  const [behaviorMetrics, setBehaviorMetrics] = useState<UserBehaviorMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [adPerformance, setAdPerformance] = useState<AdPerformanceData[]>([]);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [dropOffAnalysis, setDropOffAnalysis] = useState<{ step: string; dropOffRate: number }[]>(
    []
  );
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number }[]>([]);

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
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {behaviorMetrics && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Session Duration</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatDuration(behaviorMetrics.sessionDuration)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Conversions</div>
              <div className="text-2xl font-bold text-green-900">{behaviorMetrics.conversions}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Engagement Score</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatPercentage(behaviorMetrics.engagementScore)}
              </div>
            </div>
          </>
        )}
        {revenueMetrics && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Daily Revenue</div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatCurrency(revenueMetrics.dailyRevenue)}
            </div>
          </div>
        )}
      </div>

      {/* Revenue Metrics */}
      {revenueMetrics && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(revenueMetrics.totalRevenue)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">Average RPM</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(revenueMetrics.averageRPM)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">Average CTR</div>
              <div className="text-xl font-bold text-gray-900">
                {formatPercentage(revenueMetrics.averageCTR)}
              </div>
            </div>
          </div>

          {/* Top Revenue Sources */}
          {revenueMetrics.topRevenueSources.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Top Revenue Sources</h4>
              <div className="space-y-2">
                {revenueMetrics.topRevenueSources.map((source, index) => (
                  <div key={source.source} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{source.source}</span>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ad Performance</h3>
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
                  <tr key={`${ad.position}_${index}`} className="hover:bg-gray-50">
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Revenue (Last 7 Days)</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-end justify-between h-32 space-x-2">
              {dailyRevenue.map((day, index) => {
                const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={day.date} className="flex flex-col items-center flex-1">
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
          <p className="text-gray-500">Start using the application to collect analytics data.</p>
        </div>
      )}
    </div>
  );
}
