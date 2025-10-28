"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ImageAnalysis } from "./ImageAnalysis";
import { MetadataViewer } from "./MetadataViewer";
import { ColorPalette } from "./ColorPalette";
import {
  analyzeImage,
  type ImageAnalysis as ImageAnalysisType,
} from "@/lib/converter/analysis";

interface ImageAnalysisDemoProps {
  className?: string;
}

export function ImageAnalysisDemo({ className = "" }: ImageAnalysisDemoProps) {
  const t = useTranslations();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "analysis" | "metadata" | "colors"
  >("analysis");

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      setIsAnalyzing(true);
      setAnalysis(null);

      try {
        const result = await analyzeImage(file);
        setAnalysis(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return (
    <GlassCard className={className}>
      <GlassCardHeader>
        <GlassCardTitle>Image Analysis Tools Demo</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select an image to analyze
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Analyzing image...</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && selectedFile && (
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "analysis"
                    ? "bg-white text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Quality Analysis
              </button>
              <button
                onClick={() => setActiveTab("metadata")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "metadata"
                    ? "bg-white text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Metadata
              </button>
              <button
                onClick={() => setActiveTab("colors")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "colors"
                    ? "bg-white text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Color Palette
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === "analysis" && (
                <ImageAnalysis file={selectedFile} className="h-full" />
              )}

              {activeTab === "metadata" && (
                <MetadataViewer
                  metadata={analysis.metadata}
                  editable={true}
                  className="h-full"
                />
              )}

              {activeTab === "colors" && (
                <ColorPalette
                  colors={analysis.colors.palette}
                  showPercentages={true}
                  maxColors={15}
                  className="h-full"
                />
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedFile && (
          <div className="text-center py-8 text-gray-500">
            <p>Upload an image to see the analysis tools in action</p>
            <p className="text-sm mt-1">
              Supports JPEG, PNG, WebP, and other common formats
            </p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
