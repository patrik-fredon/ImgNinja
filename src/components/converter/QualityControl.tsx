"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { OutputFormat } from "@/types/formats";
import { FORMATS } from "@/lib/converter/formats";
import { formatFileSize } from "@/lib/utils/file-size";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface QualityControlProps {
  quality: number;
  onQualityChange: (quality: number) => void;
  format: OutputFormat;
  estimatedSize?: number;
}

export function QualityControl({
  quality,
  onQualityChange,
  format,
  estimatedSize,
}: QualityControlProps) {
  const t = useTranslations();
  const [localQuality, setLocalQuality] = useState(quality);
  const formatData = FORMATS[format];

  // Debounced quality change handler (100ms as per design spec)
  const debouncedQualityChange = useCallback(
    (newQuality: number) => {
      const timeoutId = setTimeout(() => {
        onQualityChange(newQuality);
      }, 100);

      return () => clearTimeout(timeoutId);
    },
    [onQualityChange]
  );

  useEffect(() => {
    if (localQuality !== quality) {
      const cleanup = debouncedQualityChange(localQuality);
      return cleanup;
    }
  }, [localQuality, quality, debouncedQualityChange]);

  useEffect(() => {
    setLocalQuality(quality);
  }, [quality]);

  const handleQualityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuality = parseInt(event.target.value, 10);
    setLocalQuality(newQuality);
  };

  // Hide component for lossless formats
  if (!formatData.supportsQuality) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t("converter.quality.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="quality-slider"
              className="text-sm font-medium text-gray-700"
            >
              {t("converter.quality.label", { value: localQuality })}
            </label>
            <span className="text-sm text-gray-500">{localQuality}%</span>
          </div>

          <input
            id="quality-slider"
            type="range"
            min="1"
            max="100"
            value={localQuality}
            onChange={handleQualityChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localQuality}%, #e5e7eb ${localQuality}%, #e5e7eb 100%)`,
            }}
          />

          <div className="flex justify-between text-xs text-gray-400">
            <span>1%</span>
            <span>100%</span>
          </div>
        </div>

        {estimatedSize !== undefined && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {t("converter.quality.estimated", {
                size: formatFileSize(estimatedSize),
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
