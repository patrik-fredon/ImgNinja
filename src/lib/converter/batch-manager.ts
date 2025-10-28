import { ImageConverter, type ConversionOptions, type ConversionResult } from "./engine";
import type { OutputFormat } from "@/types/formats";

export interface BatchItem {
  id: string;
  file: File;
  options: ConversionOptions;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  stage: string;
  result?: ConversionResult;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface BatchStats {
  total: number;
  pending: number;
  processing: number;
  complete: number;
  error: number;
  totalSize: number;
  processedSize: number;
  averageSpeed: number;
  estimatedTimeRemaining: number;
}

export type BatchProgressCallback = (item: BatchItem, stats: BatchStats) => void;

export class BatchConversionManager {
  private converter: ImageConverter;
  private items: Map<string, BatchItem> = new Map();
  private onProgress?: BatchProgressCallback;
  private isProcessing = false;

  constructor() {
    this.converter = new ImageConverter();
  }

  addFiles(files: File[], options: ConversionOptions): string[] {
    const ids: string[] = [];

    files.forEach((file) => {
      const id = `batch-${Date.now()}-${Math.random()}`;
      const item: BatchItem = {
        id,
        file,
        options,
        status: "pending",
        progress: 0,
        stage: "queued",
      };

      this.items.set(id, item);
      ids.push(id);
    });

    return ids;
  }

  removeItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item || item.status === "processing") {
      return false;
    }

    return this.items.delete(id);
  }

  getItem(id: string): BatchItem | undefined {
    return this.items.get(id);
  }

  getAllItems(): BatchItem[] {
    return Array.from(this.items.values());
  }

  getStats(): BatchStats {
    const items = Array.from(this.items.values());
    const total = items.length;
    const pending = items.filter((i) => i.status === "pending").length;
    const processing = items.filter((i) => i.status === "processing").length;
    const complete = items.filter((i) => i.status === "complete").length;
    const error = items.filter((i) => i.status === "error").length;

    const totalSize = items.reduce((sum, item) => sum + item.file.size, 0);
    const processedSize = items
      .filter((i) => i.status === "complete")
      .reduce((sum, item) => sum + item.file.size, 0);

    // Calculate average processing speed
    const completedItems = items.filter((i) => i.status === "complete" && i.startTime && i.endTime);
    const averageSpeed =
      completedItems.length > 0
        ? completedItems.reduce((sum, item) => {
            const duration = (item.endTime! - item.startTime!) / 1000;
            return sum + item.file.size / duration;
          }, 0) / completedItems.length
        : 0;

    // Estimate remaining time
    const remainingSize = totalSize - processedSize;
    const estimatedTimeRemaining = averageSpeed > 0 ? remainingSize / averageSpeed : 0;

    return {
      total,
      pending,
      processing,
      complete,
      error,
      totalSize,
      processedSize,
      averageSpeed,
      estimatedTimeRemaining,
    };
  }

  async startBatch(onProgress?: BatchProgressCallback): Promise<void> {
    if (this.isProcessing) {
      throw new Error("Batch processing already in progress");
    }

    this.onProgress = onProgress;
    this.isProcessing = true;

    try {
      const pendingItems = Array.from(this.items.values()).filter(
        (item) => item.status === "pending"
      );

      // Process items in parallel using the enhanced worker pool
      const promises = pendingItems.map((item) => this.processItem(item));
      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processItem(item: BatchItem): Promise<void> {
    try {
      item.status = "processing";
      item.progress = 0;
      item.stage = "starting";
      item.startTime = Date.now();

      this.notifyProgress(item);

      const result = await this.converter.convertWithEnhancedWorker(
        item.file,
        item.options,
        (progress, stage) => {
          item.progress = progress;
          item.stage = stage;
          this.notifyProgress(item);
        }
      );

      item.status = "complete";
      item.progress = 100;
      item.stage = "completed";
      item.result = result;
      item.endTime = Date.now();

      this.notifyProgress(item);
    } catch (error) {
      item.status = "error";
      item.error = error instanceof Error ? error.message : "Unknown error";
      item.stage = "failed";
      item.endTime = Date.now();

      this.notifyProgress(item);
    }
  }

  private notifyProgress(item: BatchItem): void {
    if (this.onProgress) {
      const stats = this.getStats();
      this.onProgress(item, stats);
    }
  }

  async downloadAll(): Promise<Blob> {
    const completedItems = Array.from(this.items.values()).filter(
      (item) => item.status === "complete" && item.result
    );

    if (completedItems.length === 0) {
      throw new Error("No completed conversions to download");
    }

    // Create ZIP file with all converted images
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    completedItems.forEach((item) => {
      if (item.result) {
        const extension = item.options.format;
        const baseName = item.file.name.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}.${extension}`;
        zip.file(fileName, item.result.blob);
      }
    });

    return zip.generateAsync({ type: "blob" });
  }

  clear(): void {
    if (this.isProcessing) {
      throw new Error("Cannot clear items while processing");
    }

    this.items.clear();
  }

  terminate(): void {
    this.converter.terminate();
    this.items.clear();
    this.isProcessing = false;
  }
}
