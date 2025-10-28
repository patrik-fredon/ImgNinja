"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useTranslations } from "next-intl";

interface ImagePreviewProps {
  originalFile: File;
  originalPreview: string;
  convertedBlob?: Blob;
  convertedPreview?: string;
  className?: string;
}

export function ImagePreview({
  originalFile,
  originalPreview,
  convertedBlob,
  convertedPreview,
  className = "",
}: ImagePreviewProps) {
  const t = useTranslations();
  const [showOriginal, setShowOriginal] = useState(true);

  return (
    <Card variant="outlined" className={`${className} animate-fade-in`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Preview Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowOriginal(true)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              showOriginal
                ? "bg-gradient-brand text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setShowOriginal(false)}
            disabled={!convertedPreview}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              !showOriginal && convertedPreview
                ? "bg-gradient-success text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            Converted
          </button>
        </div>

        {/* Image Display */}
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {showOriginal ? (
            <img
              src={originalPreview}
              alt={originalFile.name}
              className="w-full h-full object-contain"
            />
          ) : convertedPreview ? (
            <img
              src={convertedPreview}
              alt={`${originalFile.name} converted`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Convert to see preview
            </div>
          )}
        </div>

        {/* Image Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">
              Original
            </p>
            <p className="font-bold text-gray-900">
              {(originalFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {convertedBlob && (
            <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
              <p className="text-emerald-700 mb-1">
                Converted
              </p>
              <p className="font-bold text-emerald-900">
                {(convertedBlob.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
