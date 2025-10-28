"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormatComparison } from "./FormatComparison";
import { FileSizeCalculator } from "./FileSizeCalculator";
import { recommendFormat } from "@/lib/converter/recommendations";
import { FORMATS } from "@/lib/converter/formats";
import type { OutputFormat } from "@/types/formats";
import { formatFileSize } from "@/lib/utils/file-size";

interface SmartFormatDetectionProps {
  files: File[];
  onRecommendationsReady?: (
    recommendations: Array<{ file: File; format: OutputFormat }>
  ) => void;
  className?: string;
}

interface FileRecommendation {
  file: File;
  recommendation: {
    format: OutputFormat;
    reason: string;
    savings: string;
    priority: "high" | "medium" | "low";
    alternatives?: OutputFormat[];
  };
  selectedFormat: OutputFormat;
}

export function SmartFormatDetection({
  files,
  onRecommendationsReady,
  className = "",
}: SmartFormatDetectionProps) {
  const t = useTranslations();
  const [recommendations, setRecommendations] = useState<FileRecommendation[]>(
    []
  );
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  useEffect(() => {
    const analyzeFiles = async () => {
      setIsAnalyzing(true);

      try {
        const fileRecommendations: FileRecommendation[] = [];

        for (const file of files) {
          const recommendation = await recommendFormat(file);
          fileRecommendations.push({
            file,
            recommendation,
            selectedFormat: recommendation.format,
          });
        }

        setRecommendations(fileRecommendations);

        // Notify parent component
        onRecommendationsReady?.(
          fileRecommendations.map((fr) => ({
            file: fr.file,
            format: fr.selectedFormat,
          }))
        );
      } catch (error) {
        console.error("Failed to analyze files:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    if (files.length > 0) {
      analyzeFiles();
    }
  }, [files, onRecommendationsReady]);

  const handleFormatChange = (fileIndex: number, format: OutputFormat) => {
    const updatedRecommendations = [...recommendations];
    updatedRecommendations[fileIndex].selectedFormat = format;
    setRecommendations(updatedRecommendations);

    // Notify parent component
    onRecommendationsReady?.(
      updatedRecommendations.map((fr) => ({
        file: fr.file,
        format: fr.selectedFormat,
      }))
    );
  };

  const toggleExpanded = (fileName: string) => {
    setExpandedFile(expandedFile === fileName ? null : fileName);
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "medium":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "low":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  if (files.length === 0) {
    return null;
  }

  if (isAnalyzing) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("converter.analysis.analyzing")}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {t("converter.analysis.analyzingFiles", { count: files.length })}
            </p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("converter.analysis.recommendations")}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t("converter.analysis.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            {recommendations.map((fileRec, index) => {
              const isExpanded = expandedFile === fileRec.file.name;
              const formatData = FORMATS[fileRec.selectedFormat];

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-100 to-accent-purple/20 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-brand-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>

                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">
                            {fileRec.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileRec.file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getPriorityColor(
                            fileRec.recommendation.priority
                          )}`}
                        >
                          {getPriorityIcon(fileRec.recommendation.priority)}
                          {t(
                            `converter.analysis.priority.${fileRec.recommendation.priority}`
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(fileRec.file.name)}
                          className="flex items-center gap-2"
                        >
                          <span className="text-sm">
                            {t("converter.analysis.recommend")}{" "}
                            {formatData.name}
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {t(fileRec.recommendation.reason)}
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {t("converter.analysis.savings")}:{" "}
                        {fileRec.recommendation.savings}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormatComparison
                          file={fileRec.file}
                          onFormatSelect={(format) =>
                            handleFormatChange(index, format)
                          }
                        />

                        <FileSizeCalculator
                          file={fileRec.file}
                          targetFormat={fileRec.selectedFormat}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {recommendations.length > 1 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium text-blue-900">
                    {t("converter.analysis.batchSummary")}
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  {t("converter.analysis.batchMessage", {
                    count: recommendations.length,
                    formats: [
                      ...new Set(
                        recommendations.map(
                          (r) => FORMATS[r.selectedFormat].name
                        )
                      ),
                    ].join(", "),
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
