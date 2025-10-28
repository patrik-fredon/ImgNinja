"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { SocialShare } from "@/components/ui/SocialShare";

interface ShareableComparisonProps {
  originalFile: File;
  originalPreview: string;
  convertedBlob?: Blob;
  convertedPreview?: string;
  originalSize: number;
  convertedSize?: number;
  outputFormat: string;
  quality: number;
  className?: string;
}

export function ShareableComparison({
  originalFile,
  originalPreview,
  convertedBlob,
  convertedPreview,
  originalSize,
  convertedSize,
  outputFormat,
  quality,
  className = "",
}: ShareableComparisonProps) {
  const t = useTranslations("converter");
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingShareImage, setIsGeneratingShareImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const calculateSavings = (): { percentage: number; bytes: number } => {
    if (!convertedSize) return { percentage: 0, bytes: 0 };
    const savings = originalSize - convertedSize;
    const percentage = Math.round((savings / originalSize) * 100);
    return { percentage, bytes: savings };
  };

  const generateShareImage = useCallback(async (): Promise<string> => {
    if (!canvasRef.current || !convertedPreview) return "";

    setIsGeneratingShareImage(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      // Set canvas size for social media (1200x630 for optimal sharing)
      canvas.width = 1200;
      canvas.height = 630;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(1, "#764ba2");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load images
      const originalImg = new Image();
      const convertedImg = new Image();

      await Promise.all([
        new Promise((resolve) => {
          originalImg.onload = resolve;
          originalImg.src = originalPreview;
        }),
        new Promise((resolve) => {
          convertedImg.onload = resolve;
          convertedImg.src = convertedPreview;
        }),
      ]);

      // Calculate image dimensions (maintain aspect ratio)
      const maxImageWidth = 300;
      const maxImageHeight = 200;
      const originalAspect = originalImg.width / originalImg.height;
      const convertedAspect = convertedImg.width / convertedImg.height;

      let originalDisplayWidth = maxImageWidth;
      let originalDisplayHeight = maxImageWidth / originalAspect;
      if (originalDisplayHeight > maxImageHeight) {
        originalDisplayHeight = maxImageHeight;
        originalDisplayWidth = maxImageHeight * originalAspect;
      }

      let convertedDisplayWidth = maxImageWidth;
      let convertedDisplayHeight = maxImageWidth / convertedAspect;
      if (convertedDisplayHeight > maxImageHeight) {
        convertedDisplayHeight = maxImageHeight;
        convertedDisplayWidth = maxImageHeight * convertedAspect;
      }

      // Draw images side by side
      const imageY = 150;
      const originalX = 150;
      const convertedX = 750;

      // Original image
      ctx.fillStyle = "white";
      ctx.fillRect(
        originalX - 10,
        imageY - 10,
        originalDisplayWidth + 20,
        originalDisplayHeight + 20
      );
      ctx.drawImage(originalImg, originalX, imageY, originalDisplayWidth, originalDisplayHeight);

      // Converted image
      ctx.fillRect(
        convertedX - 10,
        imageY - 10,
        convertedDisplayWidth + 20,
        convertedDisplayHeight + 20
      );
      ctx.drawImage(
        convertedImg,
        convertedX,
        imageY,
        convertedDisplayWidth,
        convertedDisplayHeight
      );

      // Add text
      ctx.fillStyle = "white";
      ctx.font = "bold 48px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ImgNinja Conversion Result", canvas.width / 2, 80);

      // Original file info
      ctx.font = "24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Original", originalX + originalDisplayWidth / 2, imageY - 20);
      ctx.fillText(
        `${originalFile.name.split(".").pop()?.toUpperCase()} • ${formatFileSize(originalSize)}`,
        originalX + originalDisplayWidth / 2,
        imageY + originalDisplayHeight + 40
      );

      // Converted file info
      ctx.fillText("Converted", convertedX + convertedDisplayWidth / 2, imageY - 20);
      ctx.fillText(
        `${outputFormat.toUpperCase()} • ${formatFileSize(convertedSize || 0)}`,
        convertedX + convertedDisplayWidth / 2,
        imageY + convertedDisplayHeight + 40
      );

      // Savings info
      const savings = calculateSavings();
      if (savings.percentage > 0) {
        ctx.font = "bold 32px Inter, sans-serif";
        ctx.fillStyle = "#10b981";
        ctx.textAlign = "center";
        ctx.fillText(
          `${savings.percentage}% smaller • ${formatFileSize(savings.bytes)} saved`,
          canvas.width / 2,
          imageY + maxImageHeight + 100
        );
      }

      // Arrow between images
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(originalX + originalDisplayWidth + 50, imageY + originalDisplayHeight / 2);
      ctx.lineTo(convertedX - 50, imageY + convertedDisplayHeight / 2);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(convertedX - 50, imageY + convertedDisplayHeight / 2);
      ctx.lineTo(convertedX - 70, imageY + convertedDisplayHeight / 2 - 15);
      ctx.moveTo(convertedX - 50, imageY + convertedDisplayHeight / 2);
      ctx.lineTo(convertedX - 70, imageY + convertedDisplayHeight / 2 + 15);
      ctx.stroke();

      // Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "20px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Free Online Image Converter • imgninja.com",
        canvas.width / 2,
        canvas.height - 30
      );

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Failed to generate share image:", error);
      return "";
    } finally {
      setIsGeneratingShareImage(false);
    }
  }, [originalFile, originalPreview, convertedPreview, originalSize, convertedSize, outputFormat]);

  const handleShare = useCallback(async () => {
    const shareImageUrl = await generateShareImage();
    const savings = calculateSavings();

    const shareText = `I just converted my image with ImgNinja! ${
      savings.percentage > 0
        ? `Saved ${savings.percentage}% file size (${formatFileSize(savings.bytes)}) `
        : ""
    }converting to ${outputFormat.toUpperCase()}. Try it free at`;

    setShowShareModal(true);
  }, [generateShareImage, outputFormat]);

  const savings = calculateSavings();

  if (!convertedBlob || !convertedPreview) {
    return null;
  }

  return (
    <>
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("conversionComplete")}</h3>
          <p className="text-gray-600">{t("shareYourResults")}</p>
        </div>

        {/* Comparison Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <div className="bg-gray-50 rounded-lg p-4 mb-2">
              <p className="text-sm text-gray-600 mb-1">{t("original")}</p>
              <p className="font-semibold text-lg">
                {originalFile.name.split(".").pop()?.toUpperCase()}
              </p>
              <p className="text-gray-500">{formatFileSize(originalSize)}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-brand-50 rounded-lg p-4 mb-2">
              <p className="text-sm text-brand-600 mb-1">{t("converted")}</p>
              <p className="font-semibold text-lg text-brand-700">{outputFormat.toUpperCase()}</p>
              <p className="text-brand-600">{formatFileSize(convertedSize || 0)}</p>
            </div>
          </div>
        </div>

        {/* Savings Display */}
        {savings.percentage > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <div className="text-center">
                <p className="text-green-800 font-semibold text-lg">
                  {savings.percentage}% smaller
                </p>
                <p className="text-green-600 text-sm">Saved {formatFileSize(savings.bytes)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Share Button */}
        <div className="text-center">
          <button
            onClick={handleShare}
            disabled={isGeneratingShareImage}
            className="bg-gradient-brand text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isGeneratingShareImage ? t("generatingShareImage") : t("shareResults")}
          </button>
        </div>
      </div>

      {/* Hidden canvas for generating share images */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{t("shareYourResults")}</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">{t("shareDescription")}</p>

              <SocialShare
                title={`I saved ${savings.percentage}% file size with ImgNinja!`}
                description={`Just converted my image to ${outputFormat.toUpperCase()} and saved ${formatFileSize(
                  savings.bytes
                )}. Try this free online image converter!`}
                hashtags={["imageconverter", "webp", "optimization", "imgninja"]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
