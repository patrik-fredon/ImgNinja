"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FORMATS } from "@/lib/converter/formats";
import type { OutputFormat } from "@/types/formats";

interface FormatEducationCenterProps {
  className?: string;
}

interface FormatComparison {
  format1: OutputFormat;
  format2: OutputFormat;
}

export function FormatEducationCenter({ className = "" }: FormatEducationCenterProps) {
  const t = useTranslations();
  const [selectedComparison, setSelectedComparison] = useState<FormatComparison>({
    format1: "webp",
    format2: "jpeg",
  });
  const [activeTab, setActiveTab] = useState<"comparison" | "guide" | "recommendations">(
    "comparison"
  );

  const formatOptions = Object.keys(FORMATS) as OutputFormat[];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Format Education Center</CardTitle>
        <div className="flex gap-2 mt-4">
          {(["comparison", "guide", "recommendations"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeTab === "comparison" && (
          <InteractiveComparison
            comparison={selectedComparison}
            onComparisonChange={setSelectedComparison}
            formatOptions={formatOptions}
          />
        )}

        {activeTab === "guide" && <FormatGuide />}

        {activeTab === "recommendations" && <FormatRecommendations />}
      </CardContent>
    </Card>
  );
}

interface InteractiveComparisonProps {
  comparison: FormatComparison;
  onComparisonChange: (comparison: FormatComparison) => void;
  formatOptions: OutputFormat[];
}

function InteractiveComparison({
  comparison,
  onComparisonChange,
  formatOptions,
}: InteractiveComparisonProps) {
  const format1Data = FORMATS[comparison.format1];
  const format2Data = FORMATS[comparison.format2];

  return (
    <div className="space-y-6">
      {/* Format Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Format 1</label>
          <select
            value={comparison.format1}
            onChange={(e) =>
              onComparisonChange({
                ...comparison,
                format1: e.target.value as OutputFormat,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {formatOptions.map((format) => (
              <option key={format} value={format}>
                {FORMATS[format].name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Format 2</label>
          <select
            value={comparison.format2}
            onChange={(e) =>
              onComparisonChange({
                ...comparison,
                format2: e.target.value as OutputFormat,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {formatOptions.map((format) => (
              <option key={format} value={format}>
                {FORMATS[format].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
              <th className="text-center py-3 px-4 font-medium text-brand-600">
                {format1Data.name}
              </th>
              <th className="text-center py-3 px-4 font-medium text-brand-600">
                {format2Data.name}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <ComparisonRow
              feature="Quality Support"
              value1={format1Data.supportsQuality ? "Yes" : "No"}
              value2={format2Data.supportsQuality ? "Yes" : "No"}
              better={
                format1Data.supportsQuality === format2Data.supportsQuality
                  ? "tie"
                  : format1Data.supportsQuality
                    ? "format1"
                    : "format2"
              }
            />
            <ComparisonRow
              feature="Transparency"
              value1={format1Data.supportsTransparency ? "Yes" : "No"}
              value2={format2Data.supportsTransparency ? "Yes" : "No"}
              better={
                format1Data.supportsTransparency === format2Data.supportsTransparency
                  ? "tie"
                  : format1Data.supportsTransparency
                    ? "format1"
                    : "format2"
              }
            />
            <ComparisonRow
              feature="Browser Support"
              value1={getBrowserSupportScore(format1Data.browserSupport)}
              value2={getBrowserSupportScore(format2Data.browserSupport)}
              better={
                getBrowserSupportScore(format1Data.browserSupport) ===
                getBrowserSupportScore(format2Data.browserSupport)
                  ? "tie"
                  : getBrowserSupportScore(format1Data.browserSupport) >
                      getBrowserSupportScore(format2Data.browserSupport)
                    ? "format1"
                    : "format2"
              }
            />
            <ComparisonRow
              feature="Compression"
              value1={getCompressionRating(comparison.format1)}
              value2={getCompressionRating(comparison.format2)}
              better={
                getCompressionScore(comparison.format1) === getCompressionScore(comparison.format2)
                  ? "tie"
                  : getCompressionScore(comparison.format1) >
                      getCompressionScore(comparison.format2)
                    ? "format1"
                    : "format2"
              }
            />
            <ComparisonRow
              feature="Use Case"
              value1={format1Data.useCase}
              value2={format2Data.useCase}
              better="tie"
            />
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Recommendation</h4>
        <p className="text-blue-800 text-sm">
          {getComparisonRecommendation(comparison.format1, comparison.format2)}
        </p>
      </div>
    </div>
  );
}

interface ComparisonRowProps {
  feature: string;
  value1: string;
  value2: string;
  better: "format1" | "format2" | "tie";
}

function ComparisonRow({ feature, value1, value2, better }: ComparisonRowProps) {
  return (
    <tr>
      <td className="py-3 px-4 font-medium text-gray-900">{feature}</td>
      <td
        className={`py-3 px-4 text-center ${
          better === "format1" ? "bg-green-50 text-green-800 font-medium" : ""
        }`}
      >
        {value1}
        {better === "format1" && <span className="ml-1">✓</span>}
      </td>
      <td
        className={`py-3 px-4 text-center ${
          better === "format2" ? "bg-green-50 text-green-800 font-medium" : ""
        }`}
      >
        {value2}
        {better === "format2" && <span className="ml-1">✓</span>}
      </td>
    </tr>
  );
}

function FormatGuide() {
  const formatEntries = Object.entries(FORMATS) as [OutputFormat, (typeof FORMATS)[OutputFormat]][];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Format Guide</h3>
        <p className="text-gray-600 mb-6">
          Learn about each image format, their strengths, weaknesses, and best use cases.
        </p>
      </div>

      <div className="grid gap-6">
        {formatEntries.map(([format, data]) => (
          <FormatCard key={format} format={format} data={data} />
        ))}
      </div>
    </div>
  );
}

function FormatCard({
  format,
  data,
}: {
  format: OutputFormat;
  data: (typeof FORMATS)[OutputFormat];
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-xl font-semibold text-gray-900">{data.name}</h4>
          <span className="text-sm text-gray-500 uppercase font-mono">{format}</span>
          {data.recommended && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Recommended
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-4">{data.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Features</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Quality control: {data.supportsQuality ? "Yes" : "No"}</li>
            <li>• Transparency: {data.supportsTransparency ? "Yes" : "No"}</li>
            <li>• File extension: {data.extension}</li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Browser Support</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Chrome: {data.browserSupport.chrome}</div>
            <div>Firefox: {data.browserSupport.firefox}</div>
            <div>Safari: {data.browserSupport.safari}</div>
            <div>Edge: {data.browserSupport.edge}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-1">Best Use Case</h5>
        <p className="text-sm text-gray-700">{data.useCase}</p>
      </div>
    </div>
  );
}

function FormatRecommendations() {
  const scenarios = [
    {
      title: "Web Images with Transparency",
      description: "Images that need transparent backgrounds for web use",
      recommended: "webp",
      alternatives: ["png", "avif"],
      reason:
        "WebP provides excellent compression while maintaining transparency support and good browser compatibility.",
    },
    {
      title: "Photography for Web",
      description: "High-quality photographs for websites and blogs",
      recommended: "avif",
      alternatives: ["webp", "jpeg"],
      reason:
        "AVIF offers superior compression for photographs, significantly reducing file sizes while maintaining quality.",
    },
    {
      title: "Legacy Browser Support",
      description: "Images that must work on older browsers",
      recommended: "jpeg",
      alternatives: ["png"],
      reason:
        "JPEG has universal browser support and is reliable across all platforms and devices.",
    },
    {
      title: "Graphics and Logos",
      description: "Simple graphics, logos, and illustrations",
      recommended: "png",
      alternatives: ["webp", "avif"],
      reason:
        "PNG provides lossless compression perfect for graphics with sharp edges and limited colors.",
    },
    {
      title: "Animated Images",
      description: "Simple animations and moving graphics",
      recommended: "gif",
      alternatives: ["webp"],
      reason:
        "GIF remains the most compatible format for simple animations, though WebP offers better compression.",
    },
    {
      title: "Maximum Compression",
      description: "When file size is the top priority",
      recommended: "avif",
      alternatives: ["webp"],
      reason:
        "AVIF provides the best compression ratios, often 50% smaller than JPEG with similar quality.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Format Recommendations</h3>
        <p className="text-gray-600 mb-6">
          Choose the right format based on your specific use case and requirements.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-brand-100 text-brand-800 text-sm px-3 py-1 rounded-full font-medium">
                  {FORMATS[scenario.recommended as OutputFormat].name}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{scenario.reason}</p>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Alternatives:</span>
              {scenario.alternatives.map((alt, altIndex) => (
                <span
                  key={altIndex}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  {FORMATS[alt as OutputFormat].name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility functions
function getBrowserSupportScore(
  browserSupport: (typeof FORMATS)[OutputFormat]["browserSupport"]
): string {
  const scores = Object.values(browserSupport);
  const allSupported = scores.every((version) => version === "All");
  const modernSupported = scores.every((version) => version !== "All" && parseInt(version) < 100);

  if (allSupported) return "Universal";
  if (modernSupported) return "Modern";
  return "Limited";
}

function getCompressionRating(format: OutputFormat): string {
  const ratings: Record<OutputFormat, string> = {
    avif: "Excellent",
    webp: "Very Good",
    jpeg: "Good",
    png: "Lossless",
    gif: "Basic",
  };
  return ratings[format];
}

function getCompressionScore(format: OutputFormat): number {
  const scores: Record<OutputFormat, number> = {
    avif: 5,
    webp: 4,
    jpeg: 3,
    png: 2,
    gif: 1,
  };
  return scores[format];
}

function getComparisonRecommendation(format1: OutputFormat, format2: OutputFormat): string {
  const recommendations: Record<string, string> = {
    "webp-jpeg":
      "WebP is recommended for modern web use due to better compression and transparency support.",
    "avif-webp": "AVIF offers superior compression but WebP has better browser compatibility.",
    "png-jpeg":
      "Use PNG for graphics with transparency, JPEG for photographs without transparency.",
    "avif-jpeg": "AVIF provides significantly better compression than JPEG with similar quality.",
    "webp-png": "WebP offers better compression than PNG while maintaining transparency support.",
    "gif-webp":
      "WebP is recommended over GIF for better compression and quality, except for animations.",
  };

  const key1 = `${format1}-${format2}`;
  const key2 = `${format2}-${format1}`;

  return (
    recommendations[key1] ||
    recommendations[key2] ||
    "Both formats have their strengths. Consider your specific use case and browser support requirements."
  );
}
