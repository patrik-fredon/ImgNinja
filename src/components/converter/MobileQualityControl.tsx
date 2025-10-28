"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import {
  MobilePresetsManager,
  type MobileQualityPreset,
  type DeviceProfile,
} from "@/lib/converter/mobile-presets";
import type { OutputFormat } from "@/types/formats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/lib/utils/file-size";

interface MobileQualityControlProps {
  format: OutputFormat;
  onPresetChange: (preset: MobileQualityPreset) => void;
  estimatedOriginalSize?: number;
  className?: string;
}

export function MobileQualityControl({
  format,
  onPresetChange,
  estimatedOriginalSize,
  className = "",
}: MobileQualityControlProps) {
  const t = useTranslations();
  const { isMobile, isTablet } = useMobileDetection();

  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<MobileQualityPreset | null>(null);
  const [availablePresets, setAvailablePresets] = useState<MobileQualityPreset[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize device profile and presets
  useEffect(() => {
    const profile = MobilePresetsManager.detectDeviceProfile();
    const recommendedPreset = MobilePresetsManager.getRecommendedPreset(profile);
    const presets = Object.values(MobilePresetsManager.getPresets());

    setDeviceProfile(profile);
    setSelectedPreset(recommendedPreset);
    setAvailablePresets(presets);
    onPresetChange(recommendedPreset);
  }, [onPresetChange]);

  const handlePresetSelect = (preset: MobileQualityPreset) => {
    setSelectedPreset(preset);
    onPresetChange(preset);
  };

  const getEstimatedSize = (preset: MobileQualityPreset) => {
    if (!estimatedOriginalSize) return null;

    // Rough estimation based on quality and dimensions
    const qualityFactor = preset.quality / 100;
    const dimensionFactor = Math.min(preset.maxWidth / 2048, preset.maxHeight / 2048);

    return Math.round(estimatedOriginalSize * qualityFactor * dimensionFactor);
  };

  const getPresetIcon = (preset: MobileQualityPreset) => {
    switch (preset.id) {
      case "data-saver":
        return "📶";
      case "mobile-web":
        return "🌐";
      case "mobile-app":
        return "📱";
      case "mobile-hd":
        return "✨";
      case "mobile-print":
        return "🖨️";
      default:
        return "⚙️";
    }
  };

  const getCompressionColor = (level: string) => {
    switch (level) {
      case "aggressive":
        return "text-red-600 bg-red-50 border-red-200";
      case "balanced":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "conservative":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (!deviceProfile || !selectedPreset) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading mobile presets...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {isMobile || isTablet ? "📱" : "💻"} Mobile Quality Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-2">Detected Device Profile</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              Type: <span className="font-medium">{deviceProfile.type}</span>
            </div>
            <div>
              Connection: <span className="font-medium">{deviceProfile.connectionSpeed}</span>
            </div>
            <div>
              Screen: <span className="font-medium">{deviceProfile.screenDensity}</span>
            </div>
            <div>
              Memory:{" "}
              <span className="font-medium">
                {deviceProfile.memoryConstraints ? "Limited" : "Normal"}
              </span>
            </div>
          </div>
        </div>

        {/* Preset Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Quality Presets</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs"
            >
              {showAdvanced ? "Simple" : "Advanced"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {availablePresets
              .filter(
                (preset) =>
                  showAdvanced || ["data-saver", "mobile-web", "mobile-app"].includes(preset.id)
              )
              .map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    selectedPreset.id === preset.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPresetIcon(preset)}</span>
                      <span className="font-medium text-gray-900">{preset.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getCompressionColor(
                        preset.compressionLevel
                      )}`}
                    >
                      {preset.compressionLevel}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{preset.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>Quality: {preset.quality}%</div>
                    <div>
                      Max: {preset.maxWidth}×{preset.maxHeight}
                    </div>
                    <div>Target: {formatFileSize(preset.targetFileSize * 1024)}</div>
                    {estimatedOriginalSize && (
                      <div>Est: {formatFileSize(getEstimatedSize(preset) || 0)}</div>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Selected Preset Details */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            {getPresetIcon(selectedPreset)} {selectedPreset.name}
          </h4>
          <p className="text-sm text-blue-700 mb-3">{selectedPreset.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-600">Quality:</span> {selectedPreset.quality}%
            </div>
            <div>
              <span className="text-blue-600">Max Size:</span> {selectedPreset.maxWidth}×
              {selectedPreset.maxHeight}
            </div>
            <div>
              <span className="text-blue-600">Target Size:</span>{" "}
              {formatFileSize(selectedPreset.targetFileSize * 1024)}
            </div>
            <div>
              <span className="text-blue-600">Use Case:</span> {selectedPreset.useCase}
            </div>
          </div>

          {selectedPreset.recommendedFor.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-xs text-blue-600 mb-1">Recommended for:</div>
              <div className="flex flex-wrap gap-1">
                {selectedPreset.recommendedFor.map((item, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance Tips */}
        {(deviceProfile.type === "low-end" || deviceProfile.connectionSpeed === "slow") && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">⚡</span>
              <span className="text-sm font-medium text-yellow-800">Performance Tips</span>
            </div>
            <ul className="text-xs text-yellow-700 space-y-1">
              {deviceProfile.type === "low-end" && (
                <li>• Using reduced quality settings for better performance</li>
              )}
              {deviceProfile.connectionSpeed === "slow" && (
                <li>• Progressive loading enabled for faster preview</li>
              )}
              {deviceProfile.memoryConstraints && (
                <li>• Memory-optimized processing to prevent crashes</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
