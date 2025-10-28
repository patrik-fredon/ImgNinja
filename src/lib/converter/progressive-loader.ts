import type { OutputFormat } from "@/types/formats";
import { MobileOptimizedConverter, type MobileConversionOptions } from "./mobile-optimizer";
import { createConversionError } from "@/lib/errors/types";
import { logError } from "@/lib/errors/handlers";

export interface ProgressiveLoadingStage {
  name: "thumbnail" | "preview" | "full";
  quality: number;
  maxWidth: number;
  maxHeight: number;
  description: string;
}

export interface ProgressiveLoadingConfig {
  stages: ProgressiveLoadingStage[];
  enableLazyLoading: boolean;
  preloadNextStage: boolean;
}

export interface ProgressiveLoadingResult {
  stage: ProgressiveLoadingStage;
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  loadTime: number;
}

export type ProgressiveLoadingCallback = (result: ProgressiveLoadingResult) => void;

export class ProgressiveImageLoader {
  private static readonly DEFAULT_CONFIG: ProgressiveLoadingConfig = {
    stages: [
      {
        name: "thumbnail",
        quality: 50,
        maxWidth: 150,
        maxHeight: 150,
        description: "Ultra-fast thumbnail for immediate feedback",
      },
      {
        name: "preview",
        quality: 70,
        maxWidth: 600,
        maxHeight: 600,
        description: "Medium quality preview for quick viewing",
      },
      {
        name: "full",
        quality: 85,
        maxWidth: 2048,
        maxHeight: 2048,
        description: "Full quality image for final use",
      },
    ],
    enableLazyLoading: true,
    preloadNextStage: true,
  };

  private loadingPromises = new Map<string, Promise<ProgressiveLoadingResult>>();
  private loadedStages = new Map<string, ProgressiveLoadingResult[]>();

  constructor(private config: ProgressiveLoadingConfig = ProgressiveImageLoader.DEFAULT_CONFIG) {}

  async loadProgressively(
    file: File,
    targetFormat: OutputFormat,
    onStageComplete?: ProgressiveLoadingCallback,
    deviceCapabilities?: ReturnType<typeof MobileOptimizedConverter.detectDeviceCapabilities>
  ): Promise<ProgressiveLoadingResult[]> {
    const fileId = this.generateFileId(file);
    const results: ProgressiveLoadingResult[] = [];

    try {
      // Detect device capabilities if not provided
      const capabilities =
        deviceCapabilities || MobileOptimizedConverter.detectDeviceCapabilities();

      // Adjust stages based on device capabilities
      const optimizedStages = this.optimizeStagesForDevice(this.config.stages, capabilities);

      for (let i = 0; i < optimizedStages.length; i++) {
        const stage = optimizedStages[i];
        const stageKey = `${fileId}-${stage.name}`;

        // Check if stage is already loading
        if (this.loadingPromises.has(stageKey)) {
          const result = await this.loadingPromises.get(stageKey)!;
          results.push(result);
          onStageComplete?.(result);
          continue;
        }

        // Start loading this stage
        const loadingPromise = this.loadStage(file, targetFormat, stage, capabilities);
        this.loadingPromises.set(stageKey, loadingPromise);

        try {
          const result = await loadingPromise;
          results.push(result);
          onStageComplete?.(result);

          // Preload next stage if enabled
          if (this.config.preloadNextStage && i < optimizedStages.length - 1) {
            const nextStage = optimizedStages[i + 1];
            const nextStageKey = `${fileId}-${nextStage.name}`;

            if (!this.loadingPromises.has(nextStageKey)) {
              const nextLoadingPromise = this.loadStage(
                file,
                targetFormat,
                nextStage,
                capabilities
              );
              this.loadingPromises.set(nextStageKey, nextLoadingPromise);
            }
          }
        } catch (error) {
          this.loadingPromises.delete(stageKey);
          throw error;
        }
      }

      // Cache results
      this.loadedStages.set(fileId, results);
      return results;
    } catch (error) {
      const convertedError = createConversionError(
        "CONVERSION_FAILED",
        "Progressive loading failed",
        error instanceof Error ? error.message : "Unknown error",
        { fileName: file.name, targetFormat },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  async loadStage(
    file: File,
    targetFormat: OutputFormat,
    stage: ProgressiveLoadingStage,
    capabilities: ReturnType<typeof MobileOptimizedConverter.detectDeviceCapabilities>
  ): Promise<ProgressiveLoadingResult> {
    const startTime = performance.now();

    try {
      const options: MobileConversionOptions = {
        format: targetFormat,
        quality: stage.quality,
        maxWidth: stage.maxWidth,
        maxHeight: stage.maxHeight,
      };

      // Apply mobile optimizations
      const optimizedOptions = MobileOptimizedConverter.getMobileOptimizedOptions(
        options,
        capabilities
      );

      const result = await MobileOptimizedConverter.optimizeForMobile(file, optimizedOptions);
      const url = URL.createObjectURL(result.blob);
      const loadTime = performance.now() - startTime;

      return {
        stage,
        blob: result.blob,
        url,
        size: result.size,
        width: result.width,
        height: result.height,
        loadTime,
      };
    } catch (error) {
      const convertedError = createConversionError(
        "CONVERSION_FAILED",
        `Failed to load ${stage.name} stage`,
        error instanceof Error ? error.message : "Unknown error",
        { fileName: file.name, targetFormat, stage: stage.name },
        error instanceof Error ? error : undefined
      );
      logError(convertedError.toAppError());
      throw convertedError;
    }
  }

  private optimizeStagesForDevice(
    stages: ProgressiveLoadingStage[],
    capabilities: ReturnType<typeof MobileOptimizedConverter.detectDeviceCapabilities>
  ): ProgressiveLoadingStage[] {
    if (!capabilities.isMobile) {
      return stages;
    }

    return stages.map((stage) => {
      const optimizedStage = { ...stage };

      // Reduce quality and dimensions for low-end devices
      if (capabilities.isLowEndDevice) {
        optimizedStage.quality = Math.max(30, stage.quality - 20);
        optimizedStage.maxWidth = Math.floor(stage.maxWidth * 0.7);
        optimizedStage.maxHeight = Math.floor(stage.maxHeight * 0.7);
      }

      // Adjust for slow connections
      if (capabilities.connectionSpeed === "slow") {
        optimizedStage.quality = Math.max(40, stage.quality - 15);
        optimizedStage.maxWidth = Math.floor(stage.maxWidth * 0.8);
        optimizedStage.maxHeight = Math.floor(stage.maxHeight * 0.8);
      }

      return optimizedStage;
    });
  }

  private generateFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  getCachedResults(file: File): ProgressiveLoadingResult[] | undefined {
    const fileId = this.generateFileId(file);
    return this.loadedStages.get(fileId);
  }

  clearCache(file?: File): void {
    if (file) {
      const fileId = this.generateFileId(file);

      // Revoke object URLs to prevent memory leaks
      const results = this.loadedStages.get(fileId);
      if (results) {
        results.forEach((result) => URL.revokeObjectURL(result.url));
      }

      this.loadedStages.delete(fileId);

      // Clear related loading promises
      for (const [key] of this.loadingPromises) {
        if (key.startsWith(fileId)) {
          this.loadingPromises.delete(key);
        }
      }
    } else {
      // Clear all cache
      for (const results of this.loadedStages.values()) {
        results.forEach((result) => URL.revokeObjectURL(result.url));
      }
      this.loadedStages.clear();
      this.loadingPromises.clear();
    }
  }

  getLoadingStats(): {
    cachedFiles: number;
    activeLoads: number;
    totalCacheSize: number;
  } {
    let totalCacheSize = 0;
    for (const results of this.loadedStages.values()) {
      totalCacheSize += results.reduce((sum, result) => sum + result.size, 0);
    }

    return {
      cachedFiles: this.loadedStages.size,
      activeLoads: this.loadingPromises.size,
      totalCacheSize,
    };
  }

  static createMobileOptimizedConfig(
    capabilities: ReturnType<typeof MobileOptimizedConverter.detectDeviceCapabilities>
  ): ProgressiveLoadingConfig {
    const baseConfig = { ...this.DEFAULT_CONFIG };

    if (capabilities.isLowEndDevice) {
      // Reduce stages for low-end devices
      baseConfig.stages = [
        {
          name: "thumbnail",
          quality: 40,
          maxWidth: 100,
          maxHeight: 100,
          description: "Minimal thumbnail for low-end devices",
        },
        {
          name: "full",
          quality: 65,
          maxWidth: 1200,
          maxHeight: 1200,
          description: "Optimized quality for low-end devices",
        },
      ];
    }

    if (capabilities.connectionSpeed === "slow") {
      // Prioritize smaller sizes for slow connections
      baseConfig.stages = baseConfig.stages.map((stage) => ({
        ...stage,
        quality: Math.max(30, stage.quality - 20),
        maxWidth: Math.floor(stage.maxWidth * 0.6),
        maxHeight: Math.floor(stage.maxHeight * 0.6),
      }));
    }

    return baseConfig;
  }
}
