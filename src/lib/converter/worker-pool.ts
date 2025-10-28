import type { OutputFormat } from "@/types/formats";
import { FORMATS } from "./formats";

export interface BatchConversionOptions {
  format: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface BatchConversionResult {
  blob: Blob;
  size: number;
  width: number;
  height: number;
  duration: number;
  compressionRatio: number;
  memoryPeak: number;
}

export interface BatchProgressUpdate {
  fileId: string;
  progress: number;
  stage: string;
  memoryUsage?: number;
  processingSpeed?: number;
}

export type BatchProgressCallback = (update: BatchProgressUpdate) => void;

interface WorkerTask {
  id: string;
  file: File;
  options: BatchConversionOptions;
  resolve: (result: BatchConversionResult) => void;
  reject: (error: Error) => void;
  onProgress?: BatchProgressCallback;
}

interface WorkerInstance {
  worker: Worker;
  busy: boolean;
  currentTaskId?: string;
}

export class WorkerPool {
  private workers: WorkerInstance[] = [];
  private taskQueue: WorkerTask[] = [];
  private maxWorkers: number;
  private workerSupported: boolean;

  constructor(maxWorkers?: number) {
    this.workerSupported = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";

    // Determine optimal worker count based on CPU cores
    const cores = navigator.hardwareConcurrency || 4;
    this.maxWorkers = maxWorkers || Math.min(cores, 8); // Cap at 8 workers
  }

  private createWorker(): WorkerInstance {
    const worker = new Worker(new URL("./enhanced-worker.ts", import.meta.url), {
      type: "module",
    });

    const instance: WorkerInstance = {
      worker,
      busy: false,
    };

    worker.addEventListener("message", (e) => {
      this.handleWorkerMessage(instance, e);
    });

    worker.addEventListener("error", (error) => {
      this.handleWorkerError(instance, error);
    });

    return instance;
  }

  private handleWorkerMessage(instance: WorkerInstance, e: MessageEvent) {
    const message = e.data;
    const task = this.findTaskById(message.id);

    if (!task) return;

    switch (message.type) {
      case "PROGRESS":
        task.onProgress?.({
          fileId: message.id,
          progress: message.progress,
          stage: message.stage,
          memoryUsage: message.memoryUsage,
          processingSpeed: message.processingSpeed,
        });
        break;

      case "SUCCESS":
        this.completeTask(instance, task, {
          blob: message.blob,
          size: message.size,
          width: message.width,
          height: message.height,
          duration: message.duration,
          compressionRatio: message.compressionRatio,
          memoryPeak: message.memoryPeak,
        });
        break;

      case "ERROR":
        this.failTask(instance, task, new Error(message.error));
        break;
    }
  }

  private handleWorkerError(instance: WorkerInstance, error: ErrorEvent) {
    const task = this.findTaskById(instance.currentTaskId);
    if (task) {
      this.failTask(instance, task, new Error(error.message));
    }
  }

  private findTaskById(id?: string): WorkerTask | undefined {
    if (!id) return undefined;
    return this.taskQueue.find((task) => task.id === id);
  }

  private completeTask(instance: WorkerInstance, task: WorkerTask, result: BatchConversionResult) {
    instance.busy = false;
    instance.currentTaskId = undefined;

    // Remove task from queue
    const taskIndex = this.taskQueue.indexOf(task);
    if (taskIndex > -1) {
      this.taskQueue.splice(taskIndex, 1);
    }

    task.resolve(result);
    this.processNextTask();
  }

  private failTask(instance: WorkerInstance, task: WorkerTask, error: Error) {
    instance.busy = false;
    instance.currentTaskId = undefined;

    // Remove task from queue
    const taskIndex = this.taskQueue.indexOf(task);
    if (taskIndex > -1) {
      this.taskQueue.splice(taskIndex, 1);
    }

    task.reject(error);
    this.processNextTask();
  }

  private getAvailableWorker(): WorkerInstance | null {
    return this.workers.find((w) => !w.busy) || null;
  }

  private processNextTask() {
    const availableWorker = this.getAvailableWorker();
    const pendingTask = this.taskQueue.find(
      (task) => !this.workers.some((w) => w.currentTaskId === task.id)
    );

    if (availableWorker && pendingTask) {
      this.assignTaskToWorker(availableWorker, pendingTask);
    }
  }

  private assignTaskToWorker(worker: WorkerInstance, task: WorkerTask) {
    worker.busy = true;
    worker.currentTaskId = task.id;

    const formatMetadata = FORMATS[task.options.format];
    if (!formatMetadata) {
      task.reject(new Error(`Unsupported format: ${task.options.format}`));
      return;
    }

    worker.worker.postMessage({
      type: "CONVERT",
      id: task.id,
      file: task.file,
      options: {
        format: task.options.format,
        mimeType: formatMetadata.mimeType,
        quality: task.options.quality,
        maxWidth: task.options.maxWidth,
        maxHeight: task.options.maxHeight,
        supportsQuality: formatMetadata.supportsQuality,
      },
    });
  }

  async convert(
    file: File,
    options: BatchConversionOptions,
    onProgress?: BatchProgressCallback
  ): Promise<BatchConversionResult> {
    if (!this.workerSupported) {
      throw new Error("Web Workers not supported");
    }

    // Ensure we have workers available
    if (this.workers.length < this.maxWorkers) {
      const newWorker = this.createWorker();
      this.workers.push(newWorker);
    }

    const taskId = `${Date.now()}-${Math.random()}`;

    return new Promise<BatchConversionResult>((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        file,
        options,
        resolve,
        reject,
        onProgress,
      };

      this.taskQueue.push(task);
      this.processNextTask();

      // Set timeout for individual conversions
      setTimeout(() => {
        const taskIndex = this.taskQueue.indexOf(task);
        if (taskIndex > -1) {
          this.taskQueue.splice(taskIndex, 1);
          reject(new Error("Conversion timeout"));
        }
      }, 60000); // 60 second timeout per file
    });
  }

  async convertBatch(
    files: File[],
    options: BatchConversionOptions,
    onProgress?: BatchProgressCallback
  ): Promise<BatchConversionResult[]> {
    const promises = files.map((file) => this.convert(file, options, onProgress));

    return Promise.all(promises);
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter((w) => w.busy).length,
      queuedTasks: this.taskQueue.length,
      maxWorkers: this.maxWorkers,
      supported: this.workerSupported,
    };
  }

  terminate() {
    this.workers.forEach((instance) => {
      instance.worker.terminate();
    });
    this.workers = [];
    this.taskQueue = [];
  }
}
