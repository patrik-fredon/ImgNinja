"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { formatFileSize } from "@/lib/utils/file-size";
import { FORMATS } from "@/lib/converter/formats";
import type { OutputFormat } from "@/types/formats";

interface FileSizeCalculatorProps {
  file: File;
  targetFormat: OutputFormat;
  quality?: number;
  className?: string;
}

interface SizeEstimate {
  originalSize: number;
  estimatedSize: number;
  savings: number;
  savingsPercent: number;
}

export function FileSizeCalculator({
  file,
  targetFormat,
  quality = 0.8,
  className = "",
}: FileSizeCalculatorProps) {
  const t = useTranslations();
  const [estimate, setEstimate] = useState<SizeEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    const calculateSize = async () => {
      setIsCalculating(true);

      try {
        const originalSize = file.size;
        let estimatedSize = originalSize;

        // More accurate estimation based on format and quality
        const formatData = FORMATS[targetFormat];

        if (targetFormat === "webp") {
          if (formatData.supportsQuality) {
            estimatedSize = Math.round(originalSize * (0.4 + quality * 0.4));
          } else {
            estimatedSize = Math.round(originalSize * 0.7);
          }
        } else if (targetFormat === "avif") {
          if (formatData.supportsQuality) {
            estimatedSize = Math.round(originalSize * (0.2 + quality * 0.4));
          } else {
            estimatedSize = Math.round(originalSize * 0.5);
          }
        } else if (targetFormat === "jpeg") {
          estimatedSize = Math.round(originalSize * (0.5 + quality * 0.4));
        } else if (targetFormat === "png") {
          // PNG is lossless, size depends on content
          estimatedSize = Math.round(originalSize * 0.9);
        } else if (targetFormat === "gif") {
          // GIF has limited colors, might be larger or smaller
          estimatedSize = Math.round(originalSize * 1.1);
        }

        const savings = originalSize - estimatedSize;
        const savingsPercent = Math.round((savings / originalSize) * 100);

        setEstimate({
          originalSize,
          estimatedSize,
          savings,
          savingsPercent,
        });
      } catch (error) {
        console.error("Failed to calculate file size:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateSize();
  }, [file, targetFormat, quality]);

  if (isCalculating) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("converter.calculator.title")}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t("converter.calculator.original")}:
              </span>
              <span className="font-medium text-gray-900">
                {formatFileSize(estimate.originalSize)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t("converter.calculator.estimated")} (
                {FORMATS[targetFormat].name}):
              </span>
              <span className="font-medium text-gray-900">
                {formatFileSize(estimate.estimatedSize)}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {t("converter.calculator.savings")}:
                </span>
                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      estimate.savingsPercent > 0
                        ? "text-green-600"
                        : estimate.savingsPercent < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {estimate.savingsPercent > 0 && "+"}
                    {formatFileSize(Math.abs(estimate.savings))}
                  </div>
                  <div
                    className={`text-sm ${
                      estimate.savingsPercent > 0
                        ? "text-green-600"
                        : estimate.savingsPercent < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    (
                    {estimate.savingsPercent > 0
                      ? "-"
                      : estimate.savingsPercent < 0
                      ? "+"
                      : ""}
                    {Math.abs(estimate.savingsPercent)}%)
                  </div>
                </div>
              </div>
            </div>

            {estimate.savingsPercent > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
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
                  <span className="text-sm font-medium text-green-800">
                    {t("converter.calculator.goodChoice")}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  {t("converter.calculator.savingsMessage", {
                    percent: Math.abs(estimate.savingsPercent),
                    size: formatFileSize(Math.abs(estimate.savings)),
                  })}
                </p>
              </div>
            )}

            {estimate.savingsPercent < 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-amber-600"
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
                  <span className="text-sm font-medium text-amber-800">
                    {t("converter.calculator.largerFile")}
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  {t("converter.calculator.largerMessage", {
                    percent: Math.abs(estimate.savingsPercent),
                    size: formatFileSize(Math.abs(estimate.savings)),
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
