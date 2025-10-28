"use client";

import {
  useReducer,
  useCallback,
  useEffect,
  useState,
  lazy,
  Suspense,
} from "react";
import { useTranslations } from "next-intl";
import { FileUpload } from "@/components/converter/FileUpload";
import { LazyFormatSelector } from "@/components/converter/LazyFormatSelector";
import { LazyQualityControl } from "@/components/converter/LazyQualityControl";
import { LazyConversionQueue } from "@/components/converter/LazyConversionQueue";
import type { ConversionItem } from "@/components/converter/ConversionQueue";
import type { DownloadableFile } from "@/components/converter/DownloadButton";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorList } from "@/components/ui/ErrorList";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { OutputFormat } from "@/types/formats";
import { useErrorHandler, useErrors } from "@/lib/errors/context";
import { validateFiles } from "@/lib/converter/validation";
import { ImageConverterError } from "@/lib/errors/types";

// Dynamic import for ImageConverter will be handled in useEffect

interface ConversionState {
  selectedFiles: File[];
  outputFormat: OutputFormat;
  quality: number;
  conversionItems: ConversionItem[];
  isConverting: boolean;
  estimatedSize?: number;
}

type ConversionAction =
  | { type: "SET_FILES"; files: File[] }
  | { type: "SET_FORMAT"; format: OutputFormat }
  | { type: "SET_QUALITY"; quality: number }
  | { type: "START_CONVERSION" }
  | { type: "ADD_CONVERSION_ITEM"; item: ConversionItem }
  | {
      type: "UPDATE_CONVERSION_ITEM";
      id: string;
      updates: Partial<ConversionItem>;
    }
  | { type: "REMOVE_CONVERSION_ITEM"; id: string }
  | { type: "CLEAR_COMPLETED" }
  | { type: "SET_ESTIMATED_SIZE"; size: number };

const initialState: ConversionState = {
  selectedFiles: [],
  outputFormat: "webp",
  quality: 85,
  conversionItems: [],
  isConverting: false,
};

function conversionReducer(
  state: ConversionState,
  action: ConversionAction
): ConversionState {
  switch (action.type) {
    case "SET_FILES":
      return {
        ...state,
        selectedFiles: action.files,
        conversionItems: state.conversionItems.filter((item) =>
          action.files.some((file) => file.name === item.file.name)
        ),
      };

    case "SET_FORMAT":
      return {
        ...state,
        outputFormat: action.format,
        estimatedSize: undefined,
      };

    case "SET_QUALITY":
      return {
        ...state,
        quality: action.quality,
        estimatedSize: undefined,
      };

    case "START_CONVERSION":
      return {
        ...state,
        isConverting: true,
      };

    case "ADD_CONVERSION_ITEM":
      return {
        ...state,
        conversionItems: [...state.conversionItems, action.item],
      };

    case "UPDATE_CONVERSION_ITEM":
      return {
        ...state,
        conversionItems: state.conversionItems.map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
        isConverting: state.conversionItems.some((item) =>
          item.id === action.id
            ? action.updates.status === "processing"
            : item.status === "processing"
        ),
      };

    case "REMOVE_CONVERSION_ITEM":
      return {
        ...state,
        conversionItems: state.conversionItems.filter(
          (item) => item.id !== action.id
        ),
      };

    case "CLEAR_COMPLETED":
      return {
        ...state,
        conversionItems: state.conversionItems.filter(
          (item) => item.status !== "complete"
        ),
      };

    case "SET_ESTIMATED_SIZE":
      return {
        ...state,
        estimatedSize: action.size,
      };

    default:
      return state;
  }
}

export default function Home() {
  const t = useTranslations();
  const [state, dispatch] = useReducer(conversionReducer, initialState);
  const [converter, setConverter] = useState<any>(null);
  const [isConverterLoading, setIsConverterLoading] = useState(true);

  // Initialize converter lazily
  useEffect(() => {
    const initConverter = async () => {
      try {
        const { ImageConverter } = await import("@/lib/converter/engine");
        setConverter(new ImageConverter());
      } catch (error) {
        console.error("Failed to load ImageConverter:", error);
      } finally {
        setIsConverterLoading(false);
      }
    };

    initConverter();
  }, []);

  // Estimate size when format or quality changes
  useEffect(() => {
    if (state.selectedFiles.length > 0 && converter) {
      const estimateSize = async () => {
        try {
          const file = state.selectedFiles[0]; // Use first file for estimation
          const size = await converter.estimateSize(file, {
            format: state.outputFormat,
            quality: state.quality,
          });
          dispatch({ type: "SET_ESTIMATED_SIZE", size });
        } catch (error) {
          // Size estimation errors are not critical, just log them
          if (error instanceof ImageConverterError) {
            console.warn("Size estimation failed:", error.message);
          } else {
            console.warn("Size estimation failed:", error);
          }
        }
      };

      estimateSize();
    }
  }, [state.selectedFiles, state.outputFormat, state.quality, converter]);

  const { handleValidationError } = useErrorHandler();
  const { clearErrors } = useErrors();

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      // Clear previous errors when new files are selected
      clearErrors();

      // Validate files before setting them
      const validationResults = validateFiles(files);
      const hasErrors = validationResults.some((result) => !result.valid);

      if (hasErrors) {
        // Find the first error and display it
        const firstError = validationResults.find(
          (result) => !result.valid
        )?.error;
        if (firstError) {
          handleValidationError(firstError, {
            onSelectDifferentFile: () => {
              // Clear files and errors
              dispatch({ type: "SET_FILES", files: [] });
              clearErrors();
            },
            onClearFiles: () => {
              dispatch({ type: "SET_FILES", files: [] });
              clearErrors();
            },
            onReduceQuality: () => {
              dispatch({
                type: "SET_QUALITY",
                quality: Math.max(10, state.quality - 20),
              });
            },
          });
        }
        return;
      }

      dispatch({ type: "SET_FILES", files });
    },
    [handleValidationError, clearErrors, state.quality]
  );

  const handleFormatChange = useCallback((format: OutputFormat) => {
    dispatch({ type: "SET_FORMAT", format });
  }, []);

  const handleQualityChange = useCallback((quality: number) => {
    dispatch({ type: "SET_QUALITY", quality });
  }, []);

  const handleStartConversion = useCallback(async () => {
    if (state.selectedFiles.length === 0 || !converter) return;

    dispatch({ type: "START_CONVERSION" });

    for (const file of state.selectedFiles) {
      const itemId = `${file.name}-${Date.now()}-${Math.random()}`;

      const conversionItem: ConversionItem = {
        id: itemId,
        file,
        outputFormat: state.outputFormat,
        quality: state.quality,
        status: "pending",
        progress: 0,
      };

      dispatch({ type: "ADD_CONVERSION_ITEM", item: conversionItem });

      try {
        dispatch({
          type: "UPDATE_CONVERSION_ITEM",
          id: itemId,
          updates: { status: "processing" },
        });

        const result = await converter.convertWithWorker(
          file,
          {
            format: state.outputFormat,
            quality: state.quality,
          },
          (progress: number) => {
            dispatch({
              type: "UPDATE_CONVERSION_ITEM",
              id: itemId,
              updates: { progress },
            });
          }
        );

        dispatch({
          type: "UPDATE_CONVERSION_ITEM",
          id: itemId,
          updates: {
            status: "complete",
            progress: 100,
            outputBlob: result.blob,
            outputSize: result.size,
          },
        });
      } catch (error) {
        let errorMessage = t("converter.errors.conversionFailed");

        if (error instanceof ImageConverterError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        dispatch({
          type: "UPDATE_CONVERSION_ITEM",
          id: itemId,
          updates: {
            status: "error",
            error: errorMessage,
          },
        });
      }
    }
  }, [state.selectedFiles, state.outputFormat, state.quality, converter, t]);

  const handleRemoveItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_CONVERSION_ITEM", id });
  }, []);

  const handleDownloadItem = useCallback(
    async (id: string) => {
      const item = state.conversionItems.find((item) => item.id === id);
      if (item && item.outputBlob) {
        try {
          const { FORMATS } = await import("@/lib/converter/formats");

          const formatData = FORMATS[item.outputFormat];
          const nameWithoutExt = item.file.name.replace(/\.[^/.]+$/, "");
          const fileName = `${nameWithoutExt}${formatData.extension}`;
          const url = URL.createObjectURL(item.outputBlob);

          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
          console.error("Failed to download file:", error);
        }
      }
    },
    [state.conversionItems]
  );

  const handleDownloadAll = useCallback(async () => {
    const completedItems = state.conversionItems.filter(
      (item) => item.status === "complete" && item.outputBlob
    );

    if (completedItems.length === 0) return;

    const downloadableFiles: DownloadableFile[] = completedItems.map(
      (item) => ({
        id: item.id,
        originalName: item.file.name,
        outputFormat: item.outputFormat,
        blob: item.outputBlob!,
      })
    );

    try {
      // Dynamically import JSZip and formats
      const [{ default: JSZip }, { FORMATS }] = await Promise.all([
        import("jszip"),
        import("@/lib/converter/formats"),
      ]);

      const zip = new JSZip();

      downloadableFiles.forEach((file) => {
        const nameWithoutExt = file.originalName.replace(/\.[^/.]+$/, "");
        const fileName = `${nameWithoutExt}${
          FORMATS[file.outputFormat].extension
        }`;
        zip.file(fileName, file.blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "converted-images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Failed to create ZIP file:", error);
    }
  }, [state.conversionItems]);

  const completedItems = state.conversionItems.filter(
    (item) => item.status === "complete"
  );
  const hasFiles = state.selectedFiles.length > 0;
  const canStartConversion =
    hasFiles && !state.isConverting && converter && !isConverterLoading;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("converter.title")}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t("converter.subtitle")}
          </p>

          {/* Privacy Notice */}
          <Card variant="outlined" className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-2 text-blue-800">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-sm font-medium">{t("privacy.notice")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          <ErrorList />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload and Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <FileUpload onFilesSelected={handleFilesSelected} maxFiles={10} />

            {/* Format Selection */}
            {hasFiles && (
              <LazyFormatSelector
                selectedFormat={state.outputFormat}
                onFormatChange={handleFormatChange}
              />
            )}

            {/* Quality Control */}
            {hasFiles && (
              <LazyQualityControl
                quality={state.quality}
                onQualityChange={handleQualityChange}
                format={state.outputFormat}
                estimatedSize={state.estimatedSize}
              />
            )}

            {/* Convert Button */}
            {hasFiles && (
              <div className="flex justify-center">
                {isConverterLoading ? (
                  <LoadingSkeleton variant="button" className="w-32 h-12" />
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartConversion}
                    disabled={!canStartConversion}
                    className="px-8 py-3"
                  >
                    {state.isConverting
                      ? t("common.processing")
                      : t("converter.title")}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Conversion Queue */}
          <div className="space-y-6">
            {state.conversionItems.length > 0 && (
              <LazyConversionQueue
                items={state.conversionItems}
                onRemove={handleRemoveItem}
                onDownload={handleDownloadItem}
                onDownloadAll={handleDownloadAll}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
