import type { OutputFormat } from "@/types/formats";
import type { ConversionOptions, ConversionResult } from "./engine";
import { FORMATS } from "./formats";
import { createConversionError, createBrowserError } from "@/lib/errors/types";
import { logError } from "@/lib/errors/handlers";

export interface MobileOptimizationOptions {
  maxMemoryUsage: number; // MB
  maxProcessingTime: number; // ms
  enableProgressiveLoading: boolean;
  qualityPreset: "data-saver" | "mobile" | "standard";
}

export interface MobileConversionOptions extends ConversionOptions {
  mobileOptimization?: MobileOptimizationOptions;
}

export interface ProgressiveLoadingResult {
  thumbnail: Blob;
  preview: Blob;
  full: ConversionResult;
}

export class MobileOptimizedConverter {
  private static readonly DEFAULT_MOBILE_OPTIONS: MobileOptimizationOptions = {
    maxMemoryUsage: 50, // 50MB limit for mobile
    maxProcessingTime: 5000, // 5 second limit
    enableProgressiveLoading: true,
    qualityPreset: "mobile",
  };

  private static readonly QUALITY_PRESETS = {
    "data-saver": {
      quality: 60,
      maxWidth: 1200,
      maxHeight: 1200,
      description: "Optimized for slow connections",
    },
    mobile: {
      quality: 75,
      maxWidth: 1920,
      maxHeight: 1920,
      description: "Balanced quality and size for mobile",
    },
    standard: {
      quality: 85,
      maxWidth: 2560,
      maxHeight: 2560,
      description: "Standard quality for mobile devices",
    },
  };

  static getQualityPresets() {
    return this.QUALITY_PRESETS;
  }

  static getMobileOptimizedOptions(
    baseOptions: ConversionOptions,
    deviceInfo: {
      isMobile: boolean;
      isLowEndDevice?: boolean;
      connectionSpeed?: "slow" | "fast" | "unknown";
    }
  ): MobileConversionOptions {
    if (!deviceInfo.isMobile) {
      return baseOptions;
    }

    const mobileOptions = { ...this.DEFAULT_MOBILE_OPTIONS };

    // Adjust based on device capabilities
    if (deviceInfo.isLowEndDevice) {
      mobileOptions.maxMemoryUsage = 30;
      mobileOptions.maxProcessingTime = 3000;
      mobileOptions.qualityPreset = "data-saver";
    }

    // Adjust based on connection speed
    if (deviceInfo.connectionSpeed === "slow") {
      mobileOptions.qualityPreset = "data-saver";
    }

    const preset = this.QUALITY_PRESETS[mobileOptions.qualityPreset];

    return {
      ...baseOptions,
      quality: Math.min(baseOptions.quality, preset.quality),
      maxWidth: Math.min(baseOptions.maxWidth || preset.maxWidth, preset.maxWidth),
      maxHeight: Math.min(baseOptions.maxHeight || preset.maxHeight, preset.maxHeight),
      mobileOptimization: mobileOptions,
    };
  }

  static async optimizeForMobile(
    file: File,
    options: MobileConversionOptions
  ): Promise<ConversionResult> {
    const startTime = performance.now();
    const mobileOpts = options.mobileOptimization || this.DEFAULT_MOBILE_OPTIONS;

    try {
      // Check file size and memory constraints
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > mobileOpts.maxMemoryUsage) {
        // Reduce dimensions for large files
        const reductionFactor = Math.sqrt(mobileOpts.maxMemoryUsage / fileSizeMB);
        options.maxWidth = Math.floor((options.maxWidth || 2048) * reductionFactor);
        options.maxHeight = Math.floor((options.maxHeight || 2048) * reductionFactor);
      }

      // Load image with memory optimization
      const bitmap = await this.createOptimizedImageBitmap(file, {
        resizeWidth: options.maxWidth,
        resizeHeight: options.maxHeight,
        resizeQuality: "medium",
      });

      const { width, height } = this.calculateOptimizedDimensions(
        bitmap.width,
        bitmap.height,
        options.maxWidth,
        options.maxHeight,
        mobileOpts.maxMemoryUsage
      );

      // Use smaller canvas for mobile to reduce memory usage
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d", {
        alpha: FORMATS[options.format].supportsTransparency,
        desynchronized: true, // Better performance on mobile
      });

      if (!ctx) {
        const error = createConversionError(
          "CANVAS_ERROR",
          "Failed to get optimized canvas context",
          "OffscreenCanvas context not available",
          { fileName: file.name, format: options.format }
        );
        logError(error.toAppError());
        throw error;
      }

      // Optimize drawing for mobile
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium"; // Balance between quality and performance
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      // Check processing time constraint
      const processingTime = performance.now() - startTime;
      if (processingTime > mobileOpts.maxProcessingTime) {
        console.warn(`Mobile conversion exceeded time limit: ${processingTime}ms`);
      }

      const formatMetadata = FORMATS[options.format];
      const quality = formatMetadata.supportsQuality ? options.quality / 100 : undefined;

      const blob = await canvas.convertToBlob({
        type: formatMetadata.mimeType,
        quality,
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
      const convertedError = createConversionError(
        "CONVERSION_FAILED",
        "Mobile-optimized conversion failed",
        error instanceof Error ? error.message : "Unknown error",
        {
          fileName: file.name,
          format: options.format,
          mobileOptimization: mobileOpts,
        },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  static async createProgressiveLoading(
    file: File,
    options: MobileConversionOptions
  ): Promise<ProgressiveLoadingResult> {
    const baseOptions = { ...options };

    // Create thumbnail (small, fast loading)
    const thumbnailOptions: MobileConversionOptions = {
      ...baseOptions,
      quality: 60,
      maxWidth: 150,
      maxHeight: 150,
    };

    // Create preview (medium quality, reasonable size)
    const previewOptions: MobileConversionOptions = {
      ...baseOptions,
      quality: 70,
      maxWidth: 600,
      maxHeight: 600,
    };

    try {
      const [thumbnail, preview, full] = await Promise.all([
        this.optimizeForMobile(file, thumbnailOptions),
        this.optimizeForMobile(file, previewOptions),
        this.optimizeForMobile(file, options),
      ]);

      return {
        thumbnail: thumbnail.blob,
        preview: preview.blob,
        full,
      };
    } catch (error) {
      const convertedError = createConversionError(
        "CONVERSION_FAILED",
        "Progressive loading conversion failed",
        error instanceof Error ? error.message : "Unknown error",
        { fileName: file.name, format: options.format },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  private static async createOptimizedImageBitmap(
    file: File,
    options?: ImageBitmapOptions
  ): Promise<ImageBitmap> {
    try {
      return await createImageBitmap(file, options);
    } catch (error) {
      // Fallback without options for older browsers
      return await createImageBitmap(file);
    }
  }

  private static calculateOptimizedDimensions(
    sourceWidth: number,
    sourceHeight: number,
    maxWidth?: number,
    maxHeight?: number,
    maxMemoryMB?: number
  ): { width: number; height: number } {
    let width = sourceWidth;
    let height = sourceHeight;

    // Apply dimension constraints
    if (maxWidth && width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (maxHeight && height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    // Apply memory constraints (rough estimation: 4 bytes per pixel)
    if (maxMemoryMB) {
      const maxPixels = (maxMemoryMB * 1024 * 1024) / 4;
      const currentPixels = width * height;

      if (currentPixels > maxPixels) {
        const scaleFactor = Math.sqrt(maxPixels / currentPixels);
        width = Math.floor(width * scaleFactor);
        height = Math.floor(height * scaleFactor);
      }
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  static detectDeviceCapabilities(): {
    isMobile: boolean;
    isLowEndDevice: boolean;
    connectionSpeed: "slow" | "fast" | "unknown";
    memoryInfo?: {
      totalJSHeapSize: number;
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  } {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // Detect low-end devices
    const isLowEndDevice = this.detectLowEndDevice();

    // Detect connection speed
    const connectionSpeed = this.detectConnectionSpeed();

    // Get memory info if available
    const memoryInfo = (performance as any).memory
      ? {
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      }
      : undefined;

    return {
      isMobile,
      isLowEndDevice,
      connectionSpeed,
      memoryInfo,
    };
  }

  private static detectLowEndDevice(): boolean {
    // Check if navigator is available (client-side only)
    if (typeof navigator === "undefined") return false;

    // Check for device memory API
    if ("deviceMemory" in navigator) {
      return (navigator as any).deviceMemory <= 2; // 2GB or less
    }

    // Check for hardware concurrency (CPU cores)
    if ("hardwareConcurrency" in navigator) {
      return navigator.hardwareConcurrency <= 2; // 2 cores or less
    }

    // Fallback: check user agent for known low-end devices
    const userAgent = (navigator as Navigator).userAgent.toLowerCase();
    const lowEndPatterns = [
      "android 4",
      "android 5",
      "android 6",
      "iphone os 9",
      "iphone os 10",
      "iphone os 11",
      "windows phone",
      "blackberry",
      "opera mini",
    ];

    return lowEndPatterns.some((pattern) => userAgent.includes(pattern));
  }

  private static detectConnectionSpeed(): "slow" | "fast" | "unknown" {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      if (connection.effectiveType) {
        return ["slow-2g", "2g", "3g"].includes(connection.effectiveType) ? "slow" : "fast";
      }

      if (connection.downlink) {
        return connection.downlink < 1.5 ? "slow" : "fast"; // Less than 1.5 Mbps
      }
    }

    return "unknown";
  }
}
