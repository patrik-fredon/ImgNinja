"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { MobileOptimizedConverter } from "@/lib/converter/mobile-optimizer";
import {
  ProgressiveImageLoader,
  type ProgressiveLoadingResult,
} from "@/lib/converter/progressive-loader";
import {
  MobilePresetsManager,
  type DeviceProfile,
  type MobileQualityPreset,
} from "@/lib/converter/mobile-presets";
import type { OutputFormat } from "@/types/formats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { formatFileSize } from "@/lib/utils/file-size";

interface MobileConversionWorkflowProps {
  files: File[];
  targetFormat: OutputFormat;
  onConversionComplete: (results: ConversionResult[]) => void;
  onError: (error: Error) => void;
}

interface ConversionResult {
  file: File;
  result: ProgressiveLoadingResult[];
  preset: MobileQualityPreset;
  deviceOptimized: boolean;
}

interface ConversionProgress {
  fileId: string;
  fileName: string;
  stage: "thumbnail" | "preview" | "full";
  progress: number;
  currentSize: number;
  estimatedFinalSize: number;
}

export function MobileConversionWorkflow({
  files,
  targetFormat,
  onConversionComplete,
  onError,
}: MobileConversionWorkflowProps) {
  const t = useTranslations();
  const { isMobile, isTablet } = useMobileDetection();

  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [recommendedPreset, setRecommendedPreset] = useState<MobileQualityPreset | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress[]>([]);
  const [completedResults, setCompletedResults] = useState<ConversionResult[]>([]);
  const [progressiveLoader] = useState(() => new ProgressiveImageLoader());

  // Initialize device profile and recommendations
  useEffect(() => {
    const profile = MobilePresetsManager.detectDeviceProfile();
    const preset = MobilePresetsManager.getRecommendedPreset(profile);

    setDeviceProfile(profile);
    setRecommendedPreset(preset);
  }, []);

  // Initialize conversion progress tracking
  useEffect(() => {
    const progress = files.map((file) => ({
      fileId: `${file.name}-${file.size}`,
      fileName: file.name,
      stage: "thumbnail" as const,
      progress: 0,
      currentSize: file.size,
      estimatedFinalSize: Math.floor(file.size * 0.3), // Rough estimate
    }));

    setConversionProgress(progress);
  }, [files]);

  const handleProgressUpdate = useCallback((fileId: string, result: ProgressiveLoadingResult) => {
    setConversionProgress((prev) =>
      prev.map((item) =>
        item.fileId === fileId
          ? {
              ...item,
              stage: result.stage.name,
              progress:
                result.stage.name === "thumbnail" ? 33 : result.stage.name === "preview" ? 66 : 100,
              currentSize: result.size,
            }
          : item
      )
    );
  }, []);

  const startConversion = async () => {
    if (!deviceProfile || !recommendedPreset) return;

    setIsConverting(true);
    const results: ConversionResult[] = [];

    try {
      const deviceCapabilities = MobileOptimizedConverter.detectDeviceCapabilities();

      for (const file of files) {
        const fileId = `${file.name}-${file.size}`;

        try {
          const progressiveResults = await progressiveLoader.loadProgressively(
            file,
            targetFormat,
            (result) => handleProgressUpdate(fileId, result),
            deviceCapabilities
          );

          const conversionResult: ConversionResult = {
            file,
            result: progressiveResults,
            preset: recommendedPreset,
            deviceOptimized: isMobile || isTablet,
          };

          results.push(conversionResult);
          setCompletedResults((prev) => [...prev, conversionResult]);
        } catch (error) {
          console.error(`Failed to convert ${file.name}:`, error);
          onError(error instanceof Error ? error : new Error(`Conversion failed for ${file.name}`));
        }
      }

      onConversionComplete(results);
    } catch (error) {
      onError(error instanceof Error ? error : new Error("Batch conversion failed"));
    } finally {
      setIsConverting(false);
    }
  };

  const getDeviceOptimizationInfo = () => {
    if (!deviceProfile) return null;

    const optimizations = [];

    if (deviceProfile.type === "low-end") {
      optimizations.push("Reduced memory usage");
      optimizations.push("Lower quality preset");
    }

    if (deviceProfile.connectionSpeed === "slow") {
      optimizations.push("Smaller file sizes");
      optimizations.push("Progressive loading");
    }

    if (deviceProfile.memoryConstraints) {
      optimizations.push("Memory-efficient processing");
    }

    return optimizations;
  };

  const getTotalProgress = () => {
    if (conversionProgress.length === 0) return 0;

    const totalProgress = conversionProgress.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / conversionProgress.length);
  };

  const getTotalSavings = () => {
    const originalSize = files.reduce((sum, file) => sum + file.size, 0);
    const convertedSize = completedResults.reduce((sum, result) => {
      const fullResult = result.result.find((r) => r.stage.name === "full");
      return sum + (fullResult?.size || 0);
    }, 0);

    if (convertedSize === 0) return 0;
    return Math.round((1 - convertedSize / originalSize) * 100);
  };

  if (!deviceProfile || !recommendedPreset) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Analyzing device capabilities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Optimization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isMobile ? "📱" : isTablet ? "📱" : "💻"} Mobile Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Device Profile</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Type: {deviceProfile.type}</li>
                <li>Connection: {deviceProfile.connectionSpeed}</li>
                <li>Screen: {deviceProfile.screenDensity} density</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Optimizations Applied</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {getDeviceOptimizationInfo()?.map((optimization, index) => (
                  <li key={index}>• {optimization}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Preset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">{recommendedPreset.name}</h4>
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {recommendedPreset.compressionLevel}
              </span>
            </div>
            <p className="text-sm text-blue-700 mb-3">{recommendedPreset.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Quality:</span> {recommendedPreset.quality}%
              </div>
              <div>
                <span className="text-blue-600">Max Size:</span> {recommendedPreset.maxWidth}×
                {recommendedPreset.maxHeight}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Progress */}
      {isConverting && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{getTotalProgress()}%</span>
              </div>
              <Progress value={getTotalProgress()} className="w-full" />

              <div className="space-y-3">
                {conversionProgress.map((item) => (
                  <div key={item.fileId} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">{item.fileName}</span>
                      <span className="text-xs text-gray-500">
                        {item.stage === "thumbnail" ? "📸" : item.stage === "preview" ? "🖼️" : "✨"}{" "}
                        {item.stage}
                      </span>
                    </div>
                    <Progress value={item.progress} className="w-full h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(item.currentSize)}</span>
                      <span>{item.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {completedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedResults.length}</div>
                <div className="text-sm text-gray-600">Files Converted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getTotalSavings()}%</div>
                <div className="text-sm text-gray-600">Size Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">3</div>
                <div className="text-sm text-gray-600">Quality Levels</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={startConversion}
          disabled={isConverting || files.length === 0}
          className="px-8 py-3 text-lg"
        >
          {isConverting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Converting...
            </>
          ) : (
            `Convert ${files.length} ${files.length === 1 ? "File" : "Files"}`
          )}
        </Button>
      </div>
    </div>
  );
}
