"use client";

import { useState, useEffect } from "react";
import {
  abTestingFramework,
  type ABTest,
  type ABTestVariant,
  type ABTestSummary,
  type ABTestStatistics,
} from "@/lib/analytics/ab-testing";

interface ABTestingDashboardProps {
  className?: string;
}

export function ABTestingDashboard({
  className = "",
}: ABTestingDashboardProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testSummary, setTestSummary] = useState<ABTestSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "create" | "results">(
    "overview"
  );
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    targetMetric: "conversion_rate",
    trafficAllocation: 1.0,
    minimumSampleSize: 1000,
    confidenceLevel: 0.95,
    variants: [
      {
        id: "control",
        name: "Control",
        description: "Original version",
        weight: 0.5,
        config: {},
        isControl: true,
      },
      {
        id: "variant_a",
        name: "Variant A",
        description: "Test version",
        weight: 0.5,
        config: {},
        isControl: false,
      },
    ] as ABTestVariant[],
  });

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      loadTestSummary(selectedTest);
    }
  }, [selectedTest]);

  const loadTests = () => {
    try {
      const allTests = abTestingFramework.getAllTests();
      setTests(allTests);
    } catch (error) {
      console.error("Failed to load A/B tests:", error);
    }
  };

  const loadTestSummary = (testId: string) => {
    try {
      const summary = abTestingFramework.getTestSummary(testId);
      setTestSummary(summary);
    } catch (error) {
      console.error("Failed to load test summary:", error);
      setTestSummary(null);
    }
  };

  const handleCreateTest = () => {
    try {
      const testId = abTestingFramework.createTest({
        name: newTest.name,
        description: newTest.description,
        status: "draft",
        startDate: new Date(),
        targetMetric: newTest.targetMetric,
        variants: newTest.variants,
        trafficAllocation: newTest.trafficAllocation,
        minimumSampleSize: newTest.minimumSampleSize,
        confidenceLevel: newTest.confidenceLevel,
      });

      loadTests();
      setSelectedTest(testId);
      setActiveTab("overview");

      // Reset form
      setNewTest({
        name: "",
        description: "",
        targetMetric: "conversion_rate",
        trafficAllocation: 1.0,
        minimumSampleSize: 1000,
        confidenceLevel: 0.95,
        variants: [
          {
            id: "control",
            name: "Control",
            description: "Original version",
            weight: 0.5,
            config: {},
            isControl: true,
          },
          {
            id: "variant_a",
            name: "Variant A",
            description: "Test version",
            weight: 0.5,
            config: {},
            isControl: false,
          },
        ],
      });
    } catch (error) {
      console.error("Failed to create test:", error);
      alert("Failed to create test: " + (error as Error).message);
    }
  };

  const handleStartTest = (testId: string) => {
    try {
      abTestingFramework.startTest(testId);
      loadTests();
      if (selectedTest === testId) {
        loadTestSummary(testId);
      }
    } catch (error) {
      console.error("Failed to start test:", error);
      alert("Failed to start test: " + (error as Error).message);
    }
  };

  const handlePauseTest = (testId: string) => {
    try {
      abTestingFramework.pauseTest(testId);
      loadTests();
      if (selectedTest === testId) {
        loadTestSummary(testId);
      }
    } catch (error) {
      console.error("Failed to pause test:", error);
    }
  };

  const handleStopTest = (testId: string) => {
    try {
      abTestingFramework.stopTest(testId);
      loadTests();
      if (selectedTest === testId) {
        loadTestSummary(testId);
      }
    } catch (error) {
      console.error("Failed to stop test:", error);
    }
  };

  const addVariant = () => {
    const newVariantId = `variant_${String.fromCharCode(
      65 + newTest.variants.length - 1
    )}`;
    const currentWeight = 1 / (newTest.variants.length + 1);

    const updatedVariants = [
      ...newTest.variants.map((v) => ({ ...v, weight: currentWeight })),
      {
        id: newVariantId,
        name: `Variant ${String.fromCharCode(
          65 + newTest.variants.length - 1
        )}`,
        description: "New test variant",
        weight: currentWeight,
        config: {},
        isControl: false,
      },
    ];

    setNewTest({ ...newTest, variants: updatedVariants });
  };

  const removeVariant = (variantId: string) => {
    if (newTest.variants.length <= 2) return; // Keep at least control + 1 variant

    const updatedVariants = newTest.variants.filter((v) => v.id !== variantId);
    const newWeight = 1 / updatedVariants.length;

    setNewTest({
      ...newTest,
      variants: updatedVariants.map((v) => ({ ...v, weight: newWeight })),
    });
  };

  const updateVariant = (
    variantId: string,
    updates: Partial<ABTestVariant>
  ) => {
    const updatedVariants = newTest.variants.map((v) =>
      v.id === variantId ? { ...v, ...updates } : v
    );
    setNewTest({ ...newTest, variants: updatedVariants });
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const getStatusColor = (status: ABTest["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "running":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          A/B Testing Dashboard
        </h2>
        <button
          onClick={loadTests}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "overview", label: "Tests Overview" },
          { key: "create", label: "Create Test" },
          { key: "results", label: "Results" },
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

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Test List */}
          <div className="grid grid-cols-1 gap-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTest === test.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedTest(test.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        test.status
                      )}`}
                    >
                      {test.status}
                    </span>
                    {test.status === "draft" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTest(test.id);
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Start
                      </button>
                    )}
                    {test.status === "running" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePauseTest(test.id);
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                        >
                          Pause
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStopTest(test.id);
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Target: {test.targetMetric}</span>
                  <span>Variants: {test.variants.length}</span>
                  <span>
                    Traffic: {formatPercentage(test.trafficAllocation)}
                  </span>
                  <span>Started: {test.startDate.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {tests.length === 0 && (
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
                No A/B tests found
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first A/B test to start optimizing your conversion
                rates.
              </p>
              <button
                onClick={() => setActiveTab("create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Test
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Test Tab */}
      {activeTab === "create" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Test Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name
                </label>
                <input
                  type="text"
                  value={newTest.name}
                  onChange={(e) =>
                    setNewTest({ ...newTest, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Homepage CTA Button Test"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTest.description}
                  onChange={(e) =>
                    setNewTest({ ...newTest, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what you're testing and why"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Metric
                </label>
                <select
                  value={newTest.targetMetric}
                  onChange={(e) =>
                    setNewTest({ ...newTest, targetMetric: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="click_through_rate">Click Through Rate</option>
                  <option value="revenue_per_user">Revenue Per User</option>
                  <option value="engagement_time">Engagement Time</option>
                </select>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Advanced Settings
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Traffic Allocation (
                  {formatPercentage(newTest.trafficAllocation)})
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={newTest.trafficAllocation}
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      trafficAllocation: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  Percentage of users to include in the test
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Sample Size
                </label>
                <input
                  type="number"
                  value={newTest.minimumSampleSize}
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      minimumSampleSize: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confidence Level
                </label>
                <select
                  value={newTest.confidenceLevel}
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      confidenceLevel: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0.9}>90%</option>
                  <option value={0.95}>95%</option>
                  <option value={0.99}>99%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Variants Configuration */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Test Variants
              </h3>
              <button
                onClick={addVariant}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {newTest.variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          variant.isControl
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {variant.isControl ? "Control" : "Variant"}
                      </span>
                      <span className="text-sm text-gray-600">
                        Weight: {formatPercentage(variant.weight)}
                      </span>
                    </div>
                    {!variant.isControl && newTest.variants.length > 2 && (
                      <button
                        onClick={() => removeVariant(variant.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(variant.id, { name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={variant.description}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateTest}
              disabled={!newTest.name || !newTest.description}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Test
            </button>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === "results" && (
        <div className="space-y-6">
          {selectedTest && testSummary ? (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {testSummary.test.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    Status:{" "}
                    <span className="font-medium">
                      {testSummary.test.status}
                    </span>
                  </span>
                  <span>
                    Days Running:{" "}
                    <span className="font-medium">
                      {testSummary.daysRunning}
                    </span>
                  </span>
                  <span>
                    Participants:{" "}
                    <span className="font-medium">
                      {formatNumber(testSummary.totalParticipants)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div
                className={`p-4 rounded-lg mb-6 ${
                  testSummary.winner
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <h4 className="font-medium text-gray-800 mb-2">
                  Recommendation
                </h4>
                <p className="text-sm text-gray-700">
                  {testSummary.recommendation}
                </p>
                {testSummary.winner && (
                  <p className="text-sm text-green-700 mt-2">
                    Winner:{" "}
                    {
                      testSummary.test.variants.find(
                        (v) => v.id === testSummary.winner
                      )?.name
                    }
                  </p>
                )}
              </div>

              {/* Variant Results */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Variant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sample Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Conversion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Uplift
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Significant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {testSummary.statistics.map((stat) => {
                      const variant = testSummary.test.variants.find(
                        (v) => v.id === stat.variantId
                      );
                      return (
                        <tr
                          key={stat.variantId}
                          className={
                            testSummary.winner === stat.variantId
                              ? "bg-green-50"
                              : ""
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">
                                {variant?.name}
                              </span>
                              {variant?.isControl && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  Control
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(stat.sampleSize)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPercentage(stat.conversionRate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={
                                stat.uplift > 0
                                  ? "text-green-600"
                                  : stat.uplift < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }
                            >
                              {stat.uplift > 0 ? "+" : ""}
                              {formatPercentage(stat.uplift)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPercentage(1 - stat.pValue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                stat.isSignificant
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {stat.isSignificant ? "Yes" : "No"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a test to view results
              </h3>
              <p className="text-gray-500">
                Choose a test from the overview tab to see detailed statistics
                and recommendations.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
