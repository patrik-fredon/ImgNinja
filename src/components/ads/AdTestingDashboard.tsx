"use client";

import { useState, useEffect } from "react";
import { adABTestingService, type AdPlacementTest, type AdTestMetrics } from "@/lib/ads/ab-testing";
import { adPerformanceOptimizer } from "@/lib/ads/performance-optimizer";

interface AdTestingDashboardProps {
  className?: string;
}

export function AdTestingDashboard({ className = "" }: AdTestingDashboardProps) {
  const [tests, setTests] = useState<AdPlacementTest[]>([]);
  const [metrics, setMetrics] = useState<AdTestMetrics[]>([]);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load test metrics
    const allMetrics = adABTestingService.getAllMetrics();
    setMetrics(allMetrics);

    // Load performance report
    const report = adPerformanceOptimizer.generatePerformanceReport();
    setPerformanceReport(report);
  };

  const createSampleTest = () => {
    const sampleTest: AdPlacementTest = {
      id: `test-${Date.now()}`,
      name: "Header Ad Placement Test",
      slot: "header",
      variants: [
        {
          id: "variant-a",
          name: "Standard Placement",
          weight: 50,
          config: {
            position: "top",
            size: "medium",
            timing: "immediate",
            style: "standard",
          },
        },
        {
          id: "variant-b",
          name: "Native Style",
          weight: 50,
          config: {
            position: "center",
            size: "medium",
            timing: "delayed",
            style: "native",
          },
        },
      ],
      isActive: true,
      startDate: new Date(),
    };

    adABTestingService.createTest(sampleTest);
    loadDashboardData();
  };

  const endTest = (testId: string) => {
    adABTestingService.endTest(testId);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ad Testing Dashboard</h2>
        <button
          onClick={createSampleTest}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Sample Test
        </button>
      </div>

      {/* Performance Overview */}
      {performanceReport && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Avg Load Time</div>
              <div className="text-2xl font-bold text-blue-900">
                {performanceReport.averageLoadTime.toFixed(0)}ms
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Avg Viewability</div>
              <div className="text-2xl font-bold text-green-900">
                {formatPercentage(performanceReport.averageViewability)}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">CLS Impact</div>
              <div className="text-2xl font-bold text-yellow-900">
                {performanceReport.totalCLSImpact.toFixed(3)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Render Time</div>
              <div className="text-2xl font-bold text-purple-900">
                {performanceReport.averageRenderTime.toFixed(0)}ms
              </div>
            </div>
          </div>

          {performanceReport.recommendations.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                {performanceReport.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Test Metrics */}
      {metrics.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variant ID
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
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.variantId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.variantId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercentage(metric.ctr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(metric.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercentage(metric.conversionRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {metrics.length === 0 && (
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No test data available</h3>
          <p className="text-gray-500 mb-4">
            Create a test to start collecting ad performance metrics.
          </p>
          <button
            onClick={createSampleTest}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Test
          </button>
        </div>
      )}
    </div>
  );
}
