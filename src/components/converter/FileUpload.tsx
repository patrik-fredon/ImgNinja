"use client";

import { useCallback, useState, useRef, DragEvent, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  validateFile,
  type ValidationResult,
} from "@/lib/converter/validation";
import { formatFileSize } from "@/lib/utils/file-size";

interface FileWithPreview {
  file: File;
  preview: string;
  dimensions?: { width: number; height: number };
  error?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 10,
  className = "",
}: FileUploadProps) {
  const t = useTranslations();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

          filesWithPreviews.push({
            file,
            preview,
            dimensions,
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
      const validFiles = filesWithPreviews
        .filter((f) => !f.error)
        .map((f) => f.file);

      onFilesSelected(validFiles);
      setIsProcessing(false);
    },
    [maxFiles, onFilesSelected, t]
  );

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

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
        className={`transition-all duration-300 ${
          isDragOver
            ? "border-brand-500 bg-gradient-to-br from-brand-50 to-accent-purple/10 shadow-lg scale-[1.02]"
            : "border-gray-300 hover:border-brand-300 hover:shadow-md"
        }`}
      >
        <CardContent
          className="p-8 sm:p-10 text-center cursor-pointer touch-manipulation"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <div className="space-y-4 sm:space-y-6">
            <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-100 to-accent-purple/20 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragOver ? "scale-110 rotate-6" : ""}`}>
              <svg
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300 ${isDragOver ? "text-brand-600" : "text-brand-500"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <p className="text-lg sm:text-xl font-semibold bg-gradient-brand bg-clip-text text-transparent">
                {t("converter.upload.dragDrop")}
              </p>
              <p className="text-base text-gray-600 mt-2 font-medium">
                {t("converter.upload.orClick")}
              </p>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>{t("converter.upload.maxFiles", { count: maxFiles })}</p>
              <p>{t("converter.upload.supportedFormats")}</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
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
                          {fileWithPreview.dimensions.width} ×{" "}
                          {fileWithPreview.dimensions.height}px
                        </p>
                      )}
                      {fileWithPreview.error && (
                        <p className="text-red-600">{fileWithPreview.error}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="shrink-0 touch-manipulation min-w-[44px] min-h-[44px]"
                  >
                    {t("common.remove")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
