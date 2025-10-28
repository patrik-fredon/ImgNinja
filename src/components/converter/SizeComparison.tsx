"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useTranslations } from "next-intl";
import { formatFileSize } from "@/lib/utils/file-size";

interface SizeComparisonProps {
  originalSize: number;
  convertedSize: number;
  className?: string;
}

export function SizeComparison({
  originalSize,
  convertedSize,
  className = "",
}: SizeComparisonProps) {
  const t = useTranslations();
  const savingsPercent = Math.round(((originalSize - convertedSize) / originalSize) * 100);
  const savingsBytes = originalSize - convertedSize;

  const originalPercent = 100;
  const convertedPercent = Math.round((convertedSize / originalSize) * 100);

  return (
    <Card variant="outlined" className={`${className} animate-slide-up`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Size Comparison</span>
          <span className="text-2xl font-bold bg-gradient-success bg-clip-text text-transparent">
            -{savingsPercent}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Bars */}
        <div className="space-y-4">
          {/* Original Size Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Original</span>
              <span className="font-bold text-gray-900">{formatFileSize(originalSize)}</span>
            </div>
            <div className="h-8 bg-gray-200 rounded-lg overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-semibold"
                style={{ width: "100%" }}
              >
                100%
              </div>
            </div>
          </div>

          {/* Converted Size Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-emerald-700 font-medium">Converted</span>
              <span className="font-bold text-emerald-900">{formatFileSize(convertedSize)}</span>
            </div>
            <div className="h-8 bg-gray-200 rounded-lg overflow-hidden relative">
              <div
                className="h-full bg-gradient-success flex items-center justify-center text-white text-sm font-semibold transition-all duration-500"
                style={{ width: `${convertedPercent}%` }}
              >
                {convertedPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Savings Summary */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-700 font-medium mb-1">You Saved</p>
          <p className="text-3xl font-bold text-emerald-900">{formatFileSize(savingsBytes)}</p>
          <p className="text-xs text-emerald-600 mt-2">{savingsPercent}% smaller file size</p>
        </div>
      </CardContent>
    </Card>
  );
}
