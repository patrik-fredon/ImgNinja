"use client";

import { useCallback, useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { TouchOptimizedButton } from "@/components/ui/TouchOptimizedButton";
import { validateFile, type ValidationResult } from "@/lib/converter/validation";
import { formatFileSize } from "@/lib/utils/file-size";
import { recommendFormat } from "@/lib/converter/recommendations";

interface FileWithPreview {
  file: File;
  preview: string;
  dimensions?: { width: number; height: number };
  error?: string;
  recommendation?: {
    format: string;
    reason: string;
    savings: string;
  };
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
  showRecommendations?: boolean;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 10,
  className = "",
  showRecommendations = true,
}: FileUploadProps) {
  const t = useTranslations();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const processFiles = useCallback(
    async (files: File[]) => {
      setIsProcessing(true);

      // Limit number of files
      const filesToProcess = files.slice(0, maxFiles);
      const filesWithPreviews: FileWithPreview[] = [];

      for (const file of filesToProcess) {
        const validation = validateFile(file);

        if (!validation.valid) {
          filesWithPreviews.push({
            file,
            preview: "",
            error: validation.error?.message,
          });
          continue;
        }

        try {
          const preview = await createPreview(file);
          const dimensions = await getImageDimensions(file);

          // Get format recommendation if enabled
          let recommendation;
          if (showRecommendations) {
            try {
              recommendation = await recommendFormat(file);
            } catch (error) {
              // Ignore recommendation errors
            }
          }

          filesWithPreviews.push({
            file,
            preview,
            dimensions,
            recommendation,
          });
        } catch (error) {
          filesWithPreviews.push({
            file,
            preview: "",
            error: t("converter.errors.loadFailed"),
          });
        }
      }

      setSelectedFiles(filesWithPreviews);

      // Pass valid files to parent
      const validFiles = filesWithPreviews.filter((f) => !f.error).map((f) => f.file);

      onFilesSelected(validFiles);
      setIsProcessing(false);
    },
    [maxFiles, onFilesSelected, t, showRecommendations]
  );

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragOver(false);
      }
      return newCount;
    });
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      setDragCounter(0);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);

      const validFiles = newFiles.filter((f) => !f.error).map((f) => f.file);

      onFilesSelected(validFiles);
    },
    [selectedFiles, onFilesSelected]
  );

  return (
    <div className={className}>
      <Card
        variant="outlined"
        className={`relative transition-all duration-500 ease-out transform ${
          isDragOver
            ? "border-brand-500 bg-gradient-to-br from-brand-50 to-accent-purple/10 shadow-2xl scale-[1.03] rotate-1"
            : "border-gray-300 hover:border-brand-300 hover:shadow-lg hover:scale-[1.01]"
        } ${isProcessing ? "animate-pulse" : ""}`}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-accent-purple/20 rounded-lg animate-pulse" />
        )}

        <CardContent
          className="relative p-8 sm:p-10 text-center cursor-pointer touch-manipulation"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <div className="space-y-4 sm:space-y-6">
            <div
              className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-100 to-accent-purple/20 rounded-2xl flex items-center justify-center transition-all duration-500 ease-out ${
                isDragOver
                  ? "scale-125 rotate-12 shadow-lg"
                  : isProcessing
                    ? "scale-110 animate-bounce"
                    : "hover:scale-105"
              }`}
            >
              <svg
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300 ${
                  isDragOver
                    ? "text-brand-600 scale-110"
                    : isProcessing
                      ? "text-brand-500 animate-spin"
                      : "text-brand-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isProcessing ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                )}
              </svg>
            </div>

            <div>
              <p className="text-lg sm:text-xl font-semibold bg-gradient-brand bg-clip-text text-transparent">
                {isDragOver
                  ? t("converter.upload.dropHere")
                  : isProcessing
                    ? t("converter.upload.processing")
                    : t("converter.upload.dragDrop")}
              </p>
              <p className="text-base text-gray-600 mt-2 font-medium">
                {!isProcessing && t("converter.upload.orClick")}
              </p>
            </div>

            {!isProcessing && (
              <>
                {isMobile && (
                  <div className="flex justify-center gap-3">
                    <TouchOptimizedButton
                      variant="outline"
                      size="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCameraClick();
                      }}
                      className="flex items-center gap-2"
                      hapticFeedback={true}
                    >
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
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {t("converter.upload.camera")}
                    </TouchOptimizedButton>
                    <TouchOptimizedButton
                      variant="outline"
                      size="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrowseClick();
                      }}
                      className="flex items-center gap-2"
                      hapticFeedback={true}
                    >
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
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H9L7 7H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      {t("converter.upload.gallery")}
                    </TouchOptimizedButton>
                  </div>
                )}

                <div className="text-xs text-gray-400 space-y-1">
                  <p>{t("converter.upload.maxFiles", { count: maxFiles })}</p>
                  <p>{t("converter.upload.supportedFormats")}</p>
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <input
            ref={cameraInputRef}
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {isProcessing && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">{t("common.loading")}</p>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-4 sm:mt-6 space-y-3">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            {t("converter.upload.title")} ({selectedFiles.length})
          </h3>

          <div className="grid gap-3">
            {selectedFiles.map((fileWithPreview, index) => (
              <Card key={index} variant="outlined" className="p-3 sm:p-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {fileWithPreview.preview && !fileWithPreview.error && (
                    <div className="shrink-0">
                      <img
                        src={fileWithPreview.preview}
                        alt={fileWithPreview.file.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileWithPreview.file.name}
                    </p>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{formatFileSize(fileWithPreview.file.size)}</p>
                      {fileWithPreview.dimensions && (
                        <p>
                          {fileWithPreview.dimensions.width} × {fileWithPreview.dimensions.height}px
                        </p>
                      )}
                      {fileWithPreview.recommendation && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md">
                            <svg
                              className="w-3 h-3"
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
                            <span className="text-xs font-medium">
                              {t("converter.recommendations.suggest")}{" "}
                              {fileWithPreview.recommendation.format.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">
                            {t("converter.recommendations.savings")}:{" "}
                            {fileWithPreview.recommendation.savings}
                          </span>
                        </div>
                      )}
                      {fileWithPreview.error && (
                        <p className="text-red-600">{fileWithPreview.error}</p>
                      )}
                    </div>
                  </div>

                  <TouchOptimizedButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="shrink-0"
                    hapticFeedback={true}
                  >
                    {t("common.remove")}
                  </TouchOptimizedButton>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
