"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { formatFileSize } from "@/lib/utils/file-size";
import { OutputFormat } from "@/types/formats";

export interface ConversionItem {
  id: string;
  file: File;
  outputFormat: OutputFormat;
  quality: number;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  outputBlob?: Blob;
  outputSize?: number;
  error?: string;
}

interface ConversionQueueProps {
  items: ConversionItem[];
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
  className?: string;
}

export function ConversionQueue({
  items,
  onRemove,
  onDownload,
  onDownloadAll,
  className = "",
}: ConversionQueueProps) {
  const t = useTranslations();

  if (items.length === 0) {
    return null;
  }

  const completedItems = items.filter((item) => item.status === "complete");
  const hasCompletedItems = completedItems.length > 0;
  const hasMultipleCompleted = completedItems.length > 1;

  const getStatusIcon = (status: ConversionItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "processing":
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case "complete":
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-success flex items-center justify-center animate-scale-in">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
    }
  };

  const getProgressVariant = (status: ConversionItem["status"]) => {
    switch (status) {
      case "complete":
        return "success";
      case "error":
        return "error";
      case "processing":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className={className}>
      <Card variant="outlined">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <CardTitle className="text-sm sm:text-base">
              {t("converter.queue.title")} ({items.length})
            </CardTitle>
            {hasMultipleCompleted && (
              <Button
                variant="primary"
                size="sm"
                onClick={onDownloadAll}
                className="touch-manipulation min-h-[44px] w-full sm:w-auto"
              >
                {t("converter.queue.downloadAll")}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} variant="outlined" className="p-3 sm:p-4">
              <div className="space-y-3">
                {/* File info header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {getStatusIcon(item.status)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="font-medium">{formatFileSize(item.file.size)}</span>
                        <span>→</span>
                        <span
                          className={`uppercase font-bold px-2 py-0.5 rounded-md ${
                            item.outputFormat === "webp"
                              ? "bg-format-webp/20 text-format-webp"
                              : item.outputFormat === "avif"
                                ? "bg-format-avif/20 text-format-avif"
                                : item.outputFormat === "png"
                                  ? "bg-format-png/20 text-format-png"
                                  : item.outputFormat === "jpeg"
                                    ? "bg-format-jpeg/20 text-format-jpeg"
                                    : item.outputFormat === "gif"
                                      ? "bg-format-gif/20 text-format-gif"
                                      : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {item.outputFormat}
                        </span>
                        {item.outputSize && (
                          <span className="font-medium">({formatFileSize(item.outputSize)})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {item.status === "complete" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onDownload(item.id)}
                        className="touch-manipulation min-h-[44px] flex-1 sm:flex-none"
                      >
                        {t("common.download")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      className="touch-manipulation min-h-[44px] min-w-[44px]"
                    >
                      {t("common.remove")}
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                {(item.status === "processing" || item.status === "complete") && (
                  <Progress
                    value={item.progress}
                    variant={getProgressVariant(item.status)}
                    size="sm"
                    showLabel={item.status === "processing"}
                  />
                )}

                {/* Error message */}
                {item.status === "error" && item.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{item.error}</div>
                )}

                {/* Status text */}
                <div className="text-xs text-gray-500">
                  {item.status === "pending" && t("converter.queue.status.pending")}
                  {item.status === "processing" && t("converter.queue.status.processing")}
                  {item.status === "complete" && t("converter.queue.status.complete")}
                  {item.status === "error" && t("converter.queue.status.error")}
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
