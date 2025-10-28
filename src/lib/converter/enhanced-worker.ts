interface ConversionMessage {
  type: "CONVERT";
  id: string;
  file: File;
  options: {
    format: string;
    mimeType: string;
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
    supportsQuality: boolean;
  };
}

interface ProgressMessage {
  type: "PROGRESS";
  id: string;
  progress: number;
  stage: string;
  memoryUsage?: number;
  processingSpeed?: number;
}

interface SuccessMessage {
  type: "SUCCESS";
  id: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
  duration: number;
  compressionRatio: number;
  memoryPeak: number;
}

interface ErrorMessage {
  type: "ERROR";
  id: string;
  error: string;
  stage: string;
}

type EnhancedWorkerResponse = ProgressMessage | SuccessMessage | ErrorMessage;

class MemoryMonitor {
  private startMemory: number = 0;
  private peakMemory: number = 0;

  start(): void {
    this.startMemory = this.getCurrentMemory();
    this.peakMemory = this.startMemory;
  }

  update(): number {
    const current = this.getCurrentMemory();
    this.peakMemory = Math.max(this.peakMemory, current);
    return current;
  }

  getPeak(): number {
    return this.peakMemory - this.startMemory;
  }

  private getCurrentMemory(): number {
    if ("memory" in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}

function calculateOptimalDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number; scaleFactor: number } {
  if (!maxWidth && !maxHeight) {
    return { width: sourceWidth, height: sourceHeight, scaleFactor: 1 };
  }

  let width = sourceWidth;
  let height = sourceHeight;
  let scaleFactor = 1;

  if (maxWidth && width > maxWidth) {
    scaleFactor = maxWidth / width;
    height = height * scaleFactor;
    width = maxWidth;
  }

  if (maxHeight && height > maxHeight) {
    const heightScaleFactor = maxHeight / height;
    if (heightScaleFactor < scaleFactor) {
      scaleFactor = heightScaleFactor;
      width = width * scaleFactor;
      height = maxHeight;
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    scaleFactor,
  };
}

function optimizeCanvasDrawing(
  ctx: OffscreenCanvasRenderingContext2D,
  bitmap: ImageBitmap,
  targetWidth: number,
  targetHeight: number,
  scaleFactor: number
): void {
  // Use high-quality scaling for significant size reductions
  if (scaleFactor < 0.5) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
  }

  // Clear canvas with transparent background for optimal compression
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // Draw image with optimized scaling
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
}

async function processImageWithOptimization(
  bitmap: ImageBitmap,
  options: ConversionMessage["options"],
  monitor: MemoryMonitor,
  progressCallback: (progress: number, stage: string, memoryUsage?: number) => void
): Promise<{ blob: Blob; width: number; height: number; compressionRatio: number }> {
  const { width, height, scaleFactor } = calculateOptimalDimensions(
    bitmap.width,
    bitmap.height,
    options.maxWidth,
    options.maxHeight
  );

  progressCallback(30, "Creating optimized canvas", monitor.update());

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  progressCallback(40, "Applying optimized drawing", monitor.update());

  optimizeCanvasDrawing(ctx, bitmap, width, height, scaleFactor);

  progressCallback(60, "Converting to optimized blob", monitor.update());

  const quality = options.supportsQuality ? options.quality / 100 : undefined;

  // Use optimized blob conversion with format-specific settings
  const blob = await canvas.convertToBlob({
    type: options.mimeType,
    quality,
  });

  const originalSize = bitmap.width * bitmap.height * 4; // Assume 4 bytes per pixel
  const compressionRatio = originalSize / blob.size;

  progressCallback(90, "Finalizing conversion", monitor.update());

  return { blob, width, height, compressionRatio };
}

self.onmessage = async (e: MessageEvent<ConversionMessage>) => {
  const { id, file, options } = e.data;
  const startTime = performance.now();
  const monitor = new MemoryMonitor();

  monitor.start();

  const sendProgress = (progress: number, stage: string, memoryUsage?: number) => {
    const processingSpeed = progress / ((performance.now() - startTime) / 1000);
    self.postMessage({
      type: "PROGRESS",
      id,
      progress,
      stage,
      memoryUsage,
      processingSpeed,
    } as ProgressMessage);
  };

  try {
    sendProgress(5, "Initializing conversion", monitor.update());

    const bitmap = await createImageBitmap(file);
    sendProgress(15, "Image loaded successfully", monitor.update());

    const result = await processImageWithOptimization(bitmap, options, monitor, sendProgress);

    // Clean up bitmap immediately to free memory
    bitmap.close();

    const duration = performance.now() - startTime;
    const memoryPeak = monitor.getPeak();

    sendProgress(100, "Conversion completed", monitor.update());

    self.postMessage({
      type: "SUCCESS",
      id,
      blob: result.blob,
      size: result.blob.size,
      width: result.width,
      height: result.height,
      duration,
      compressionRatio: result.compressionRatio,
      memoryPeak,
    } as SuccessMessage);
  } catch (error) {
    const stage = "conversion";
    self.postMessage({
      type: "ERROR",
      id,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      stage,
    } as ErrorMessage);
  }
};
