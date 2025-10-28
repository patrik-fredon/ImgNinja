"use client";

import { useState, useEffect } from "react";
import {
  revenueOptimizer,
  type RevenueOptimization,
  type RevenueForecasting,
  type CompetitorAnalysis,
  type MarketPositioning,
} from "@/lib/analytics/revenue-optimizer";

interface RevenueOptimizationDashboardProps {
  className?: string;
}

export function RevenueOptimizationDashboard({
  className = "",
}: RevenueOptimizationDashboardProps) {
  const [optimizations, setOptimizations] = useState<RevenueOptimization[]>([]);
  const [forecast, setForecast] = useState<RevenueForecasting | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [positioning, setPositioning] = useState<MarketPositioning | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "optimizations" | "forecasting" | "competitive"
  >("optimizations");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "forecasting") {
      generateForecast();
    }
  }, [activeTab, selectedPeriod]);

  const loadData = () => {
    try {
      const opts = revenueOptimizer.getOptimizations();
      setOptimizations(opts);

      const comps = revenueOptimizer.getCompetitorAnalysis();
      setCompetitors(comps);

      const pos = revenueOptimizer.getMarketPositioning();
      setPositioning(pos);
    } catch (error) {
      console.error("Failed to load revenue optimization data:", error);
    }
  };

  const generateForecast = () => {
    try {
      const forecastData = revenueOptimizer.generateForecast(
        selectedPeriod,
        30
      );
      setForecast(forecastData);
    } catch (error) {
      console.error("Failed to generate forecast:", error);
    }
  };

  const refreshOptimizations = () => {
    try {
      revenueOptimizer.generateOptimizations();
      loadData();
    } catch (error) {
      console.error("Failed to refresh optimizations:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "text-green-600";
      case "decreasing":
        return "text-red-600";
      case "stable":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case "decreasing":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          </svg>
        );
      case "stable":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Revenue Optimization
        </h2>
        <button
          onClick={refreshOptimizations}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Analysis
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "optimizations", label: "Optimizations" },
          { key: "forecasting", label: "Forecasting" },
          { key: "competitive", label: "Competitive Analysis" },
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

      {/* Optimizations Tab */}
      {activeTab === "optimizations" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">
                Total Opportunities
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {optimizations.length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Potential Uplift
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatPercentage(
                  optimizations.reduce(
                    (sum, opt) => sum + opt.potentialUplift,
                    0
                  ) / Math.max(optimizations.length, 1)
                )}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">
                High Impact
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {optimizations.filter((opt) => opt.impact === "high").length}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">
                Quick Wins
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {
                  optimizations.filter(
                    (opt) => opt.effort === "low" && opt.impact !== "low"
                  ).length
                }
              </div>
            </div>
          </div>

          {/* Optimization List */}
          <div className="space-y-4">
            {optimizations.map((optimization) => (
              <div
                key={optimization.id}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {optimization.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {optimization.description}
                    </p>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getEffortColor(
                          optimization.effort
                        )}`}
                      >
                        {optimization.effort} effort
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(
                          optimization.impact
                        )}`}
                      >
                        {optimization.impact} impact
                      </span>
                      <span className="text-sm text-gray-500">
                        Priority: {optimization.priority.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-sm text-gray-600">
                      Potential Uplift
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(optimization.potentialUplift)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Confidence: {formatPercentage(optimization.confidence)}
                    </div>
                  </div>
                </div>

                {/* Current vs Projected */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Current Value</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {optimization.type === "pricing" ||
                      optimization.currentValue > 100
                        ? formatCurrency(optimization.currentValue)
                        : formatPercentage(optimization.currentValue)}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm text-green-600">
                      Projected Value
                    </div>
                    <div className="text-lg font-semibold text-green-900">
                      {optimization.type === "pricing" ||
                      optimization.projectedValue > 100
                        ? formatCurrency(optimization.projectedValue)
                        : formatPercentage(optimization.projectedValue)}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Recommendations:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {optimization.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {optimizations.length === 0 && (
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No optimizations found
              </h3>
              <p className="text-gray-500 mb-4">
                Generate revenue optimization recommendations based on your
                data.
              </p>
              <button
                onClick={refreshOptimizations}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate Optimizations
              </button>
            </div>
          )}
        </div>
      )}

      {/* Forecasting Tab */}
      {activeTab === "forecasting" && (
        <div className="space-y-6">
          {/* Period Selection */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Revenue Forecasting
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {forecast && (
            <>
              {/* Forecast Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Trend</div>
                  <div
                    className={`text-2xl font-bold flex items-center space-x-2 ${getTrendColor(
                      forecast.trend
                    )}`}
                  >
                    {getTrendIcon(forecast.trend)}
                    <span className="capitalize">{forecast.trend}</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">
                    Growth Rate
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatPercentage(forecast.growthRate)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">
                    Seasonality
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {forecast.seasonality ? "Detected" : "None"}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">
                    Accuracy
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatPercentage(forecast.accuracy)}
                  </div>
                </div>
              </div>

              {/* Forecast Chart */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-4">
                  Revenue Forecast
                </h4>
                <div className="space-y-2">
                  {/* Historical Data */}
                  <div className="text-sm text-gray-600 mb-2">
                    Historical Data:
                  </div>
                  <div className="flex space-x-1 mb-4">
                    {forecast.historical.slice(-14).map((point, index) => {
                      const maxRevenue = Math.max(
                        ...forecast.historical.map((p) => p.revenue),
                        ...forecast.forecast.map((p) => p.revenue)
                      );
                      const height =
                        maxRevenue > 0 ? (point.revenue / maxRevenue) * 60 : 0;

                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className="bg-blue-600 rounded-t w-full min-h-[2px]"
                            style={{ height: `${Math.max(height, 2)}px` }}
                            title={`${point.date}: ${formatCurrency(
                              point.revenue
                            )}`}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(point.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Forecast Data */}
                  <div className="text-sm text-gray-600 mb-2">Forecast:</div>
                  <div className="flex space-x-1">
                    {forecast.forecast.slice(0, 14).map((point, index) => {
                      const maxRevenue = Math.max(
                        ...forecast.historical.map((p) => p.revenue),
                        ...forecast.forecast.map((p) => p.revenue)
                      );
                      const height =
                        maxRevenue > 0 ? (point.revenue / maxRevenue) * 60 : 0;
                      const opacity = point.confidence;

                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className="bg-green-600 rounded-t w-full min-h-[2px]"
                            style={{
                              height: `${Math.max(height, 2)}px`,
                              opacity: opacity,
                            }}
                            title={`${point.date}: ${formatCurrency(
                              point.revenue
                            )} (${formatPercentage(
                              point.confidence
                            )} confidence)`}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(point.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {!forecast && (
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
                Generating forecast...
              </h3>
              <p className="text-gray-500">
                Please wait while we analyze your revenue data.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Competitive Analysis Tab */}
      {activeTab === "competitive" && (
        <div className="space-y-6">
          {/* Market Positioning */}
          {positioning && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Market Positioning
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Market Position</div>
                  <div className="text-2xl font-bold text-gray-900">
                    #{positioning.position} of {positioning.totalCompetitors}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Market Size</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(positioning.marketSize)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Growth Rate</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPercentage(positioning.growthRate)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Key Differentiators
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {positioning.keyDifferentiators.map((diff, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {diff}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Competitive Advantages
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {positioning.competitiveAdvantages.map((adv, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Competitor Analysis */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Competitor Analysis
            </h3>
            {competitors.length > 0 ? (
              <div className="space-y-4">
                {competitors.map((competitor, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {competitor.competitor}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>
                            Est. Revenue:{" "}
                            {formatCurrency(competitor.estimatedRevenue)}
                          </span>
                          <span>
                            Market Share:{" "}
                            {formatPercentage(competitor.marketShare)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Updated: {competitor.lastUpdated.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <h5 className="font-medium text-green-800 mb-2">
                          Strengths
                        </h5>
                        <ul className="list-disc list-inside space-y-1">
                          {competitor.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-gray-600">
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-red-800 mb-2">
                          Weaknesses
                        </h5>
                        <ul className="list-disc list-inside space-y-1">
                          {competitor.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm text-gray-600">
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-800 mb-2">
                          Opportunities
                        </h5>
                        <ul className="list-disc list-inside space-y-1">
                          {competitor.opportunities.map((opp, i) => (
                            <li key={i} className="text-sm text-gray-600">
                              {opp}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-orange-800 mb-2">
                          Threats
                        </h5>
                        <ul className="list-disc list-inside space-y-1">
                          {competitor.threats.map((threat, i) => (
                            <li key={i} className="text-sm text-gray-600">
                              {threat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No competitor analysis available
                </h3>
                <p className="text-gray-500">
                  Add competitor analysis data to see competitive insights and
                  market positioning.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
