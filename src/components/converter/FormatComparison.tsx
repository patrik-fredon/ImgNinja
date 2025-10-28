"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FORMATS } from "@/lib/converter/formats";
import type { OutputFormat } from "@/types/formats";
import { formatFileSize } from "@/lib/utils/file-size";
import { recommendFormat } from "@/lib/converter/recommendations";

interface FormatComparisonProps {
  file: File;
  onFormatSelect?: (format: OutputFormat) => void;
  className?: string;
}

interface FormatEstimate {
  format: OutputFormat;
  estimatedSize: number;
  savings: number;
  recommended: boolean;
  reason?: string;
}

export function FormatComparison({
  file,
  onFormatSelect,
  className = "",
}: FormatComparisonProps) {
  const t = useTranslations();
  const [estimates, setEstimates] = useState<FormatEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat | null>(
    null
  );

  useEffect(() => {
    const calculateEstimates = async () => {
      setIsLoading(true);

      try {
        const recommendation = await recommendFormat(file);
        const originalSize = file.size;
        const estimates: FormatEstimate[] = [];

        // Calculate estimates for each format
        for (const format of Object.keys(FORMATS) as OutputFormat[]) {
          const formatData = FORMATS[format];
          let estimatedSize = originalSize;
          let savings = 0;

          // Rough estimation based on format characteristics
          if (format === "webp") {
            estimatedSize = Math.round(originalSize * 0.7); // ~30% savings
            savings = Math.round(
              ((originalSize - estimatedSize) / originalSize) * 100
            );
          } else if (format === "avif") {
            estimatedSize = Math.round(originalSize * 0.5); // ~50% savings
            savings = Math.round(
              ((originalSize - estimatedSize) / originalSize) * 100
            );
          } else if (format === "jpeg") {
            estimatedSize = Math.round(originalSize * 0.8); // ~20% savings
            savings = Math.round(
              ((originalSize - estimatedSize) / originalSize) * 100
            );
          } else if (format === "png") {
            estimatedSize = originalSize; // No compression
            savings = 0;
          } else if (format === "gif") {
            estimatedSize = Math.round(originalSize * 1.2); // Might be larger
            savings = -20;
          }

          estimates.push({
            format,
            estimatedSize,
            savings,
            recommended: format === recommendation.format,
            reason:
              format === recommendation.format
                ? recommendation.reason
                : undefined,
          });
        }

        // Sort by savings (best first)
        estimates.sort((a, b) => b.savings - a.savings);
        setEstimates(estimates);

        // Auto-select recommended format
        const recommendedFormat = estimates.find((e) => e.recommended);
        if (recommendedFormat) {
          setSelectedFormat(recommendedFormat.format);
        }
      } catch (error) {
        console.error("Failed to calculate format estimates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateEstimates();
  }, [file]);

  const handleFormatSelect = (format: OutputFormat) => {
    setSelectedFormat(format);
    onFormatSelect?.(format);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("converter.comparison.title")}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t("converter.comparison.subtitle")}
            </p>
          </div>

          <div className="space-y-2">
            {estimates.map((estimate) => {
              const formatData = FORMATS[estimate.format];
              const isSelected = selectedFormat === estimate.format;

              return (
                <div
                  key={estimate.format}
                  className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleFormatSelect(estimate.format)}
                >
                  {estimate.recommended && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {t("converter.comparison.recommended")}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full border-2 ${
                          isSelected
                            ? "border-brand-500 bg-brand-500"
                            : "border-gray-300"
                        }`}
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {formatData.name}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">
                            {estimate.format}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {formatData.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatFileSize(estimate.estimatedSize)}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          estimate.savings > 0
                            ? "text-green-600"
                            : estimate.savings < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {estimate.savings > 0 && "-"}
                        {estimate.savings}%
                      </div>
                    </div>
                  </div>

                  {estimate.recommended && estimate.reason && (
                    <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                      {t(estimate.reason)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {t("converter.comparison.original")}:
              </span>
              <span className="font-medium text-gray-900">
                {formatFileSize(file.size)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
