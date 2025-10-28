"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
  analyzeImage,
  type ImageAnalysis,
  type QualityIssue,
  type OptimizationSuggestion,
} from "@/lib/converter/analysis";
import type { OutputFormat } from "@/types/formats";

interface ImageAnalysisProps {
  file: File;
  onOptimizationSelect?: (suggestion: OptimizationSuggestion) => void;
  className?: string;
}

export function ImageAnalysis({ file, onOptimizationSelect, className = "" }: ImageAnalysisProps) {
  const t = useTranslations();
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await analyzeImage(file);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setIsLoading(false);
      }
    };

    performAnalysis();
  }, [file]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analyzing Image...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            <p>Analysis failed: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Image Analysis</span>
          <QualityBadge score={analysis.quality.score} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Analysis */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Quality Assessment</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20">Overall:</span>
              <Progress value={analysis.quality.score} className="flex-1" />
              <span className="text-sm font-medium">{analysis.quality.score}/100</span>
            </div>

            {analysis.quality.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Issues Found:</p>
                {analysis.quality.issues.map((issue, index) => (
                  <QualityIssueCard key={index} issue={issue} />
                ))}
              </div>
            )}

            {analysis.quality.recommendations.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Recommendations:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  {analysis.quality.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Optimization Suggestions */}
        {analysis.optimization.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Optimization Suggestions</h4>
            <div className="space-y-2">
              {analysis.optimization.map((suggestion, index) => (
                <OptimizationCard
                  key={index}
                  suggestion={suggestion}
                  onSelect={() => onOptimizationSelect?.(suggestion)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Image Properties */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Image Properties</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Dimensions:</span>
              <p className="font-medium">
                {analysis.dimensions.width} × {analysis.dimensions.height}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Aspect Ratio:</span>
              <p className="font-medium">{analysis.dimensions.aspectRatio.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-600">File Size:</span>
              <p className="font-medium">{(analysis.metadata.fileSize / 1024).toFixed(1)} KB</p>
            </div>
            <div>
              <span className="text-gray-600">Format:</span>
              <p className="font-medium">{analysis.metadata.format}</p>
            </div>
            <div>
              <span className="text-gray-600">Transparency:</span>
              <p className="font-medium">{analysis.metadata.hasTransparency ? "Yes" : "No"}</p>
            </div>
            <div>
              <span className="text-gray-600">Color Depth:</span>
              <p className="font-medium">{analysis.metadata.colorDepth}-bit</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QualityBadge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColor(score)}`}>
      {getLabel(score)}
    </span>
  );
}

function QualityIssueCard({ issue }: { issue: QualityIssue }) {
  const getSeverityColor = (severity: QualityIssue["severity"]) => {
    switch (severity) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      case "low":
        return "border-blue-200 bg-blue-50";
    }
  };

  const getSeverityIcon = (severity: QualityIssue["severity"]) => {
    switch (severity) {
      case "high":
        return "⚠️";
      case "medium":
        return "⚡";
      case "low":
        return "ℹ️";
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm">{getSeverityIcon(issue.severity)}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{issue.description}</p>
          <p className="text-xs text-gray-600 mt-1">{issue.suggestion}</p>
        </div>
      </div>
    </div>
  );
}

function OptimizationCard({
  suggestion,
  onSelect,
}: {
  suggestion: OptimizationSuggestion;
  onSelect: () => void;
}) {
  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:border-brand-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              -{suggestion.expectedSavings}%
            </span>
          </div>
          <p className="text-sm text-gray-600">{suggestion.description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onSelect} className="ml-3">
          Apply
        </Button>
      </div>
    </div>
  );
}
