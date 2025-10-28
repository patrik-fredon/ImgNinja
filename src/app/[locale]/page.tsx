"use client";

import { useReducer, useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import { HeroSection } from "@/components/layout/HeroSection";
import { FeatureIntroduction } from "@/components/layout/FeatureIntroduction";
import { GuidedTour } from "@/components/layout/GuidedTour";
import { FileUpload } from "@/components/converter/FileUpload";
import { LazyFormatSelector } from "@/components/converter/LazyFormatSelector";
import { MobileFormatSelector } from "@/components/converter/MobileFormatSelector";
import { LazyQualityControl } from "@/components/converter/LazyQualityControl";
import { LazyConversionQueue } from "@/components/converter/LazyConversionQueue";
import { MobileConversionQueue } from "@/components/converter/MobileConversionQueue";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { SwipeableImagePreview } from "@/components/converter/SwipeableImagePreview";
import { SizeComparison } from "@/components/converter/SizeComparison";
import type { ConversionItem } from "@/components/converter/ConversionQueue";
import type { DownloadableFile } from "@/components/converter/DownloadButton";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TouchOptimizedButton } from "@/components/ui/TouchOptimizedButton";
import { ErrorList } from "@/components/ui/ErrorList";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { OutputFormat } from "@/types/formats";
import { useErrorHandler, useErrors } from "@/lib/errors/context";
import { validateFiles } from "@/lib/converter/validation";
import { ImageConverterError } from "@/lib/errors/types";
import { recommendFormat } from "@/lib/converter/recommendations";

// Dynamic import for ImageConverter will be handled in useEffect

interface ConversionState {
  selectedFiles: File[];
  outputFormat: OutputFormat;
  quality: number;
  conversionItems: ConversionItem[];
  isConverting: boolean;
  estimatedSize?: number;
  recommendation?: { format: OutputFormat; reason: string; savings: string };
  originalPreview?: string;
  convertedPreview?: string;
}

type ConversionAction =
  | {
      type: "SET_FILES";
      files: File[];
      recommendation?: {
        format: OutputFormat;
        reason: string;
        savings: string;
      };
      preview?: string;
    }
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
  | { type: "SET_ESTIMATED_SIZE"; size: number }
  | { type: "SET_CONVERTED_PREVIEW"; preview: string };

const initialState: ConversionState = {
  selectedFiles: [],
  outputFormat: "webp",
  quality: 85,
  conversionItems: [],
  isConverting: false,
};

function conversionReducer(state: ConversionState, action: ConversionAction): ConversionState {
  switch (action.type) {
    case "SET_FILES":
      return {
        ...state,
        selectedFiles: action.files,
        recommendation: action.recommendation,
        originalPreview: action.preview,
        convertedPreview: undefined,
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
        conversionItems: state.conversionItems.filter((item) => item.id !== action.id),
      };

    case "CLEAR_COMPLETED":
      return {
        ...state,
        conversionItems: state.conversionItems.filter((item) => item.status !== "complete"),
      };

    case "SET_ESTIMATED_SIZE":
      return {
        ...state,
        estimatedSize: action.size,
      };

    case "SET_CONVERTED_PREVIEW":
      return {
        ...state,
        convertedPreview: action.preview,
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
  const [showConverter, setShowConverter] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { isMobile } = useMobileDetection();

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
    async (files: File[]) => {
      clearErrors();

      const validationResults = validateFiles(files);
      const hasErrors = validationResults.some((result) => !result.valid);

      if (hasErrors) {
        const firstError = validationResults.find((result) => !result.valid)?.error;
        if (firstError) {
          handleValidationError(firstError, {
            onSelectDifferentFile: () => {
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

      if (files.length > 0) {
        const firstFile = files[0];
        const recommendation = await recommendFormat(firstFile);
        const preview = URL.createObjectURL(firstFile);

        dispatch({
          type: "SET_FILES",
          files,
          recommendation,
          preview,
        });
      } else {
        dispatch({ type: "SET_FILES", files });
      }
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

        const convertedPreview = URL.createObjectURL(result.blob);

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

        if (file === state.selectedFiles[0]) {
          dispatch({
            type: "SET_CONVERTED_PREVIEW",
            preview: convertedPreview,
          });
        }
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

    const downloadableFiles: DownloadableFile[] = completedItems.map((item) => ({
      id: item.id,
      originalName: item.file.name,
      outputFormat: item.outputFormat,
      blob: item.outputBlob!,
    }));

    try {
      // Dynamically import JSZip and formats
      const [{ default: JSZip }, { FORMATS }] = await Promise.all([
        import("jszip"),
        import("@/lib/converter/formats"),
      ]);

      const zip = new JSZip();

      downloadableFiles.forEach((file) => {
        const nameWithoutExt = file.originalName.replace(/\.[^/.]+$/, "");
        const fileName = `${nameWithoutExt}${FORMATS[file.outputFormat].extension}`;
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

  const completedItems = state.conversionItems.filter((item) => item.status === "complete");
  const hasFiles = state.selectedFiles.length > 0;
  const canStartConversion = hasFiles && !state.isConverting && converter && !isConverterLoading;

  const handleGetStarted = () => {
    setShowConverter(true);

    // Check if user is new (no localStorage flag)
    const hasSeenIntroduction = localStorage.getItem("imgninja-seen-introduction");
    if (!hasSeenIntroduction) {
      setShowIntroduction(true);
    }

    // Scroll to converter section
    setTimeout(() => {
      const converterSection = document.getElementById("converter-section");
      if (converterSection) {
        converterSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleStartTour = () => {
    setShowIntroduction(false);
    setShowTour(true);
    localStorage.setItem("imgninja-seen-introduction", "true");
  };

  const handleSkipIntroduction = () => {
    setShowIntroduction(false);
    localStorage.setItem("imgninja-seen-introduction", "true");
  };

  const handleCompleteTour = () => {
    setShowTour(false);
    localStorage.setItem("imgninja-completed-tour", "true");
  };

  const handleSkipTour = () => {
    setShowTour(false);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-brand-50 via-white to-accent-purple/5">
      {/* Hero Section */}
      {!showConverter && <HeroSection onGetStarted={handleGetStarted} ctaVariant="gradient" />}

      {/* Converter Section */}
      {showConverter && (
        <div id="converter-section" className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          {/* Page Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-4 px-2">
              {t("converter.title")}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 px-2">{t("converter.subtitle")}</p>

            {/* Privacy Notice */}
            <Card
              variant="outlined"
              className="bg-linear-to-r from-blue-50 to-brand-50 border-brand-200 mb-8 mx-auto max-w-2xl backdrop-blur-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-3 text-brand-700">
                  <svg
                    className="w-5 h-5 shrink-0"
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

          {/* Main Content Grid with Ad Placements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Ad Placement (Desktop) */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="sticky top-24 space-y-6">
                <div className="bg-gray-100 rounded-lg h-[600px] flex items-center justify-center text-gray-400 text-sm">
                  Ad Space
                </div>
              </div>
            </div>

            {/* Center Content */}
            <div className="lg:col-span-7 space-y-6 animate-slide-up">
              {/* File Upload */}
              <div data-tour="file-upload">
                <FileUpload onFilesSelected={handleFilesSelected} maxFiles={10} />
              </div>

              {/* Format Recommendation */}
              {hasFiles && state.recommendation && (
                <Card
                  variant="outlined"
                  className="bg-linear-to-r from-brand-50 to-accent-purple/10 border-brand-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-brand-900 mb-1">Recommended Format</p>
                        <p className="text-sm text-gray-700 mb-2">
                          Best choice:{" "}
                          <span className="font-bold text-brand-700 uppercase">
                            {state.recommendation.format}
                          </span>
                        </p>
                        <p className="text-xs text-brand-600">
                          Expected savings: {state.recommendation.savings}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Format Selection */}
              {hasFiles && (
                <div data-tour="format-selector">
                  {isMobile ? (
                    <MobileFormatSelector
                      selectedFormat={state.outputFormat}
                      onFormatChange={handleFormatChange}
                    />
                  ) : (
                    <LazyFormatSelector
                      selectedFormat={state.outputFormat}
                      onFormatChange={handleFormatChange}
                    />
                  )}
                </div>
              )}

              {/* Quality Control */}
              {hasFiles && (
                <div data-tour="quality-control">
                  <LazyQualityControl
                    quality={state.quality}
                    onQualityChange={handleQualityChange}
                    format={state.outputFormat}
                    estimatedSize={state.estimatedSize}
                  />
                </div>
              )}

              {/* Image Preview */}
              {hasFiles && state.originalPreview && state.selectedFiles[0] && (
                <SwipeableImagePreview
                  originalFile={state.selectedFiles[0]}
                  originalPreview={state.originalPreview}
                  convertedPreview={state.convertedPreview}
                  convertedBlob={completedItems[0]?.outputBlob}
                />
              )}

              {/* Size Comparison */}
              {completedItems.length > 0 && completedItems[0].outputSize && (
                <SizeComparison
                  originalSize={completedItems[0].file.size}
                  convertedSize={completedItems[0].outputSize}
                />
              )}

              {/* Convert Button */}
              {hasFiles && (
                <div className="flex justify-center">
                  {isConverterLoading ? (
                    <LoadingSkeleton variant="button" className="w-full max-w-xs h-14" />
                  ) : (
                    <div data-tour="convert-button">
                      <TouchOptimizedButton
                        variant="primary"
                        size="lg"
                        onClick={handleStartConversion}
                        disabled={!canStartConversion}
                        className="w-full max-w-xs text-lg font-semibold bg-gradient-brand shadow-lg"
                        hapticFeedback={true}
                      >
                        {state.isConverting ? t("common.processing") : t("converter.title")}
                      </TouchOptimizedButton>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Queue & Ads */}
            <div className="lg:col-span-3 space-y-6">
              {state.conversionItems.length > 0 && (
                <div className="animate-scale-in">
                  {isMobile ? (
                    <MobileConversionQueue
                      items={state.conversionItems}
                      onRemove={handleRemoveItem}
                      onDownload={handleDownloadItem}
                      onDownloadAll={handleDownloadAll}
                    />
                  ) : (
                    <LazyConversionQueue
                      items={state.conversionItems}
                      onRemove={handleRemoveItem}
                      onDownload={handleDownloadItem}
                      onDownloadAll={handleDownloadAll}
                    />
                  )}
                </div>
              )}

              {/* Right Sidebar Ad */}
              <div className="hidden lg:block sticky top-24">
                <div className="bg-gray-100 rounded-lg h-[250px] flex items-center justify-center text-gray-400 text-sm">
                  Ad Space
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Introduction Modal */}
      {showIntroduction && (
        <FeatureIntroduction onStartTour={handleStartTour} onDismiss={handleSkipIntroduction} />
      )}

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour isActive={showTour} onComplete={handleCompleteTour} onSkip={handleSkipTour} />
      )}
    </main>
  );
}
