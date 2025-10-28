import type { OutputFormat } from "@/types/formats";
import { FORMATS, getSupportedFormats as getFormats } from "./formats";
import {
  ImageConverterError,
  createConversionError,
  createBrowserError,
  createFileError,
  type AppError,
} from "@/lib/errors/types";
import { logError } from "@/lib/errors/handlers";
import { WorkerPool, type BatchConversionOptions, type BatchProgressCallback } from "./worker-pool";
import { MobileOptimizedConverter, type MobileConversionOptions } from "./mobile-optimizer";
import { ProgressiveImageLoader, type ProgressiveLoadingResult } from "./progressive-loader";

export interface ConversionOptions {
  format: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ConversionResult {
  blob: Blob;
  size: number;
  width: number;
  height: number;
  duration: number;
}

export type ProgressCallback = (progress: number) => void;

export class ImageConverter {
  private worker: Worker | null = null;
  private workerPool: WorkerPool | null = null;
  private workerSupported: boolean = false;
  private progressiveLoader: ProgressiveImageLoader | null = null;
  private deviceCapabilities: ReturnType<
    typeof MobileOptimizedConverter.detectDeviceCapabilities
  > | null = null;

  constructor() {
    this.workerSupported = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";
    if (this.workerSupported) {
      this.workerPool = new WorkerPool();
    }

    // Initialize mobile optimizations
    if (typeof window !== "undefined") {
      this.progressiveLoader = new ProgressiveImageLoader();
      this.deviceCapabilities = MobileOptimizedConverter.detectDeviceCapabilities();
    }
  }
  private async loadImage(file: File): Promise<ImageBitmap> {
    try {
      return await createImageBitmap(file);
    } catch (error) {
      const convertedError = createFileError(
        "FILE_READ_ERROR",
        "Failed to load image file",
        error instanceof Error ? error.message : "Unknown error",
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  private calculateDimensions(
    sourceWidth: number,
    sourceHeight: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    if (!maxWidth && !maxHeight) {
      return { width: sourceWidth, height: sourceHeight };
    }

    let width = sourceWidth;
    let height = sourceHeight;

    if (maxWidth && width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (maxHeight && height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  async convert(file: File, options: ConversionOptions): Promise<ConversionResult> {
    const startTime = performance.now();

    try {
      const bitmap = await this.loadImage(file);
      const { width, height } = this.calculateDimensions(
        bitmap.width,
        bitmap.height,
        options.maxWidth,
        options.maxHeight
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const error = createConversionError(
          "CANVAS_ERROR",
          "Failed to get canvas context",
          "Canvas 2D context is not available",
          { fileName: file.name, format: options.format }
        );
        logError(error.toAppError());
        throw error;
      }

      try {
        ctx.drawImage(bitmap, 0, 0, width, height);
      } catch (error) {
        const convertedError = createConversionError(
          "CANVAS_ERROR",
          "Failed to draw image on canvas",
          error instanceof Error ? error.message : "Unknown canvas drawing error",
          { fileName: file.name, width, height, format: options.format },
          error instanceof Error ? error : undefined
        );
        logError(convertedError.toAppError());
        throw convertedError;
      } finally {
        bitmap.close();
      }

      const formatMetadata = FORMATS[options.format];

      // Check if format is supported
      if (!formatMetadata) {
        const error = createBrowserError(
          "UNSUPPORTED_FORMAT",
          `Format ${options.format} is not supported`,
          "The requested output format is not available",
          { format: options.format }
        );
        logError(error.toAppError());
        throw error;
      }

      const quality = formatMetadata.supportsQuality ? options.quality / 100 : undefined;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(
                createConversionError(
                  "CONVERSION_FAILED",
                  "Failed to convert image to blob",
                  "Canvas toBlob() returned null",
                  {
                    fileName: file.name,
                    format: options.format,
                    quality: options.quality,
                    mimeType: formatMetadata.mimeType,
                  }
                )
              );
            }
          },
          formatMetadata.mimeType,
          quality
        );
      });

      const duration = performance.now() - startTime;

      return {
        blob,
        size: blob.size,
        width,
        height,
        duration,
      };
    } catch (error) {
      if (error instanceof ImageConverterError) {
        throw error;
      }

      const convertedError = createConversionError(
        "CONVERSION_FAILED",
        "Image conversion failed",
        error instanceof Error ? error.message : "Unknown error",
        {
          fileName: file.name,
          format: options.format,
          quality: options.quality,
        },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  async estimateSize(file: File, options: ConversionOptions): Promise<number> {
    try {
      const bitmap = await this.loadImage(file);
      const { width, height } = this.calculateDimensions(
        bitmap.width,
        bitmap.height,
        options.maxWidth,
        options.maxHeight
      );
      bitmap.close();

      const pixels = width * height;
      const formatMetadata = FORMATS[options.format];

      if (!formatMetadata) {
        const error = createBrowserError(
          "UNSUPPORTED_FORMAT",
          `Format ${options.format} is not supported`,
          "Cannot estimate size for unsupported format",
          { format: options.format }
        );
        logError(error.toAppError());
        throw error;
      }

      if (!formatMetadata.supportsQuality) {
        if (options.format === "png") {
          return Math.round(pixels * 4 * 0.5);
        }
        if (options.format === "gif") {
          return Math.round(pixels * 0.3);
        }
      }

      const qualityFactor = options.quality / 100;
      const compressionFactors: Record<string, number> = {
        jpeg: 0.15,
        webp: 0.12,
        avif: 0.08,
      };

      const compressionFactor = compressionFactors[options.format] || 0.15;
      return Math.round(pixels * 3 * qualityFactor * compressionFactor);
    } catch (error) {
      if (error instanceof ImageConverterError) {
        throw error;
      }

      const convertedError = createConversionError(
        "CONVERSION_FAILED",
        "Size estimation failed",
        error instanceof Error ? error.message : "Unknown error",
        {
          fileName: file.name,
          format: options.format,
          operation: "size estimation",
        },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  getSupportedFormats(): OutputFormat[] {
    return getFormats();
  }

  canConvert(sourceFormat: string, targetFormat: OutputFormat): boolean {
    const validSourceFormats = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "image/webp",
      "image/avif",
    ];

    if (!validSourceFormats.includes(sourceFormat.toLowerCase())) {
      return false;
    }

    return this.getSupportedFormats().includes(targetFormat);
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
    }
    return this.worker;
  }

  async convertWithWorker(
    file: File,
    options: ConversionOptions,
    onProgress?: ProgressCallback
  ): Promise<ConversionResult> {
    if (!this.workerSupported) {
      const error = createBrowserError(
        "WEBWORKER_NOT_SUPPORTED",
        "Web Workers not supported, falling back to main thread",
        "OffscreenCanvas or Web Workers are not available in this browser",
        { fileName: file.name, format: options.format }
      );
      logError(error.toAppError());
      return this.convert(file, options);
    }

    try {
      const worker = this.getWorker();
      const formatMetadata = FORMATS[options.format];

      if (!formatMetadata) {
        const error = createBrowserError(
          "UNSUPPORTED_FORMAT",
          `Format ${options.format} is not supported`,
          "The requested output format is not available",
          { format: options.format }
        );
        logError(error.toAppError());
        throw error;
      }

      const id = `${Date.now()}-${Math.random()}`;

      return new Promise<ConversionResult>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          worker.removeEventListener("message", handleMessage);
          const error = createConversionError(
            "TIMEOUT_ERROR",
            "Conversion timeout",
            "Worker conversion took longer than expected",
            { fileName: file.name, format: options.format, timeout: 30000 }
          );
          logError(error.toAppError());
          reject(error);
        }, 30000); // 30 second timeout

        const handleMessage = (e: MessageEvent) => {
          const message = e.data;

          if (message.id !== id) return;

          switch (message.type) {
            case "PROGRESS":
              onProgress?.(message.progress);
              break;

            case "SUCCESS":
              clearTimeout(timeoutId);
              worker.removeEventListener("message", handleMessage);
              resolve({
                blob: message.blob,
                size: message.size,
                width: message.width,
                height: message.height,
                duration: message.duration,
              });
              break;

            case "ERROR":
              clearTimeout(timeoutId);
              worker.removeEventListener("message", handleMessage);
              const error = createConversionError(
                "WORKER_ERROR",
                "Web Worker conversion failed",
                message.error,
                { fileName: file.name, format: options.format }
              );
              logError(error.toAppError());
              reject(error);
              break;
          }
        };

        worker.addEventListener("message", handleMessage);
        worker.addEventListener("error", (error) => {
          clearTimeout(timeoutId);
          worker.removeEventListener("message", handleMessage);
          const convertedError = createConversionError(
            "WORKER_ERROR",
            "Web Worker error",
            error.message,
            { fileName: file.name, format: options.format },
            error.error
          );
          logError(convertedError.toAppError());
          reject(convertedError);
        });

        worker.postMessage({
          type: "CONVERT",
          id,
          file,
          options: {
            format: options.format,
            mimeType: formatMetadata.mimeType,
            quality: options.quality,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            supportsQuality: formatMetadata.supportsQuality,
          },
        });
      });
    } catch (error) {
      if (error instanceof ImageConverterError) {
        throw error;
      }

      const convertedError = createConversionError(
        "WORKER_ERROR",
        "Worker conversion failed",
        error instanceof Error ? error.message : "Unknown error",
        {
          fileName: file.name,
          format: options.format,
          operation: "worker conversion",
        },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  async convertBatch(
    files: File[],
    options: ConversionOptions,
    onProgress?: (fileId: string, progress: number, stage: string) => void
  ): Promise<ConversionResult[]> {
    if (!this.workerPool) {
      throw createBrowserError(
        "WEBWORKER_NOT_SUPPORTED",
        "Batch conversion requires Web Worker support",
        "Web Workers are not available in this browser",
        { fileCount: files.length }
      );
    }

    const batchOptions: BatchConversionOptions = {
      format: options.format,
      quality: options.quality,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    };

    const progressCallback: BatchProgressCallback = (update) => {
      onProgress?.(update.fileId, update.progress, update.stage);
    };

    try {
      const results = await this.workerPool.convertBatch(files, batchOptions, progressCallback);
      return results.map((result) => ({
        blob: result.blob,
        size: result.size,
        width: result.width,
        height: result.height,
        duration: result.duration,
      }));
    } catch (error) {
      const convertedError = createConversionError(
        "BATCH_CONVERSION_FAILED",
        "Batch conversion failed",
        error instanceof Error ? error.message : "Unknown error",
        { fileCount: files.length, format: options.format },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  async convertWithEnhancedWorker(
    file: File,
    options: ConversionOptions,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ConversionResult> {
    if (!this.workerPool) {
      return this.convertWithWorker(file, options, (progress) =>
        onProgress?.(progress, "processing")
      );
    }

    const batchOptions: BatchConversionOptions = {
      format: options.format,
      quality: options.quality,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    };

    const progressCallback: BatchProgressCallback = (update) => {
      onProgress?.(update.progress, update.stage);
    };

    try {
      const result = await this.workerPool.convert(file, batchOptions, progressCallback);
      return {
        blob: result.blob,
        size: result.size,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch (error) {
      const convertedError = createConversionError(
        "ENHANCED_WORKER_ERROR",
        "Enhanced worker conversion failed",
        error instanceof Error ? error.message : "Unknown error",
        { fileName: file.name, format: options.format },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  async convertWithMobileOptimization(
    file: File,
    options: ConversionOptions,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ConversionResult> {
    if (!this.deviceCapabilities) {
      return this.convert(file, options);
    }

    try {
      const mobileOptions: MobileConversionOptions =
        MobileOptimizedConverter.getMobileOptimizedOptions(options, this.deviceCapabilities);

      const result = await MobileOptimizedConverter.optimizeForMobile(file, mobileOptions);

      onProgress?.(100, "completed");

      return result;
    } catch (error) {
      // Fallback to regular conversion
      console.warn("Mobile optimization failed, falling back to regular conversion:", error);
      return this.convert(file, options);
    }
  }

  async convertWithProgressiveLoading(
    file: File,
    options: ConversionOptions,
    onStageComplete?: (result: ProgressiveLoadingResult) => void
  ): Promise<ProgressiveLoadingResult[]> {
    if (!this.progressiveLoader || !this.deviceCapabilities) {
      const result = await this.convert(file, options);
      return [
        {
          stage: {
            name: "full",
            quality: options.quality,
            maxWidth: options.maxWidth || 2048,
            maxHeight: options.maxHeight || 2048,
            description: "Full quality",
          },
          blob: result.blob,
          url: URL.createObjectURL(result.blob),
          size: result.size,
          width: result.width,
          height: result.height,
          loadTime: result.duration,
        },
      ];
    }

    try {
      return await this.progressiveLoader.loadProgressively(
        file,
        options.format,
        onStageComplete,
        this.deviceCapabilities
      );
    } catch (error) {
      // Fallback to regular conversion
      console.warn("Progressive loading failed, falling back to regular conversion:", error);
      const result = await this.convert(file, options);
      return [
        {
          stage: {
            name: "full",
            quality: options.quality,
            maxWidth: options.maxWidth || 2048,
            maxHeight: options.maxHeight || 2048,
            description: "Full quality",
          },
          blob: result.blob,
          url: URL.createObjectURL(result.blob),
          size: result.size,
          width: result.width,
          height: result.height,
          loadTime: result.duration,
        },
      ];
    }
  }

  getDeviceCapabilities() {
    return this.deviceCapabilities;
  }

  getWorkerPoolStats() {
    return this.workerPool?.getStats() || null;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerPool) {
      this.workerPool.terminate();
      this.workerPool = null;
    }
    if (this.progressiveLoader) {
      this.progressiveLoader.clearCache();
      this.progressiveLoader = null;
    }
  }
}
