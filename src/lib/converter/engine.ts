import type { OutputFormat } from '@/types/formats';
import { FORMATS, getSupportedFormats as getFormats } from './formats';

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
  private workerSupported: boolean = false;

  constructor() {
    this.workerSupported = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
  }
  private async loadImage(file: File): Promise<ImageBitmap> {
    return await createImageBitmap(file);
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

  async convert(
    file: File,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    const startTime = performance.now();

    const bitmap = await this.loadImage(file);
    const { width, height } = this.calculateDimensions(
      bitmap.width,
      bitmap.height,
      options.maxWidth,
      options.maxHeight
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const formatMetadata = FORMATS[options.format];
    const quality = formatMetadata.supportsQuality ? options.quality / 100 : undefined;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to convert image'));
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
  }

  async estimateSize(
    file: File,
    options: ConversionOptions
  ): Promise<number> {
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

    if (!formatMetadata.supportsQuality) {
      if (options.format === 'png') {
        return Math.round(pixels * 4 * 0.5);
      }
      if (options.format === 'gif') {
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
  }

  getSupportedFormats(): OutputFormat[] {
    return getFormats();
  }

  canConvert(sourceFormat: string, targetFormat: OutputFormat): boolean {
    const validSourceFormats = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'image/avif',
    ];

    if (!validSourceFormats.includes(sourceFormat.toLowerCase())) {
      return false;
    }

    return this.getSupportedFormats().includes(targetFormat);
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
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
      return this.convert(file, options);
    }

    const worker = this.getWorker();
    const formatMetadata = FORMATS[options.format];
    const id = `${Date.now()}-${Math.random()}`;

    return new Promise<ConversionResult>((resolve, reject) => {
      const handleMessage = (e: MessageEvent) => {
        const message = e.data;

        if (message.id !== id) return;

        switch (message.type) {
          case 'PROGRESS':
            onProgress?.(message.progress);
            break;

          case 'SUCCESS':
            worker.removeEventListener('message', handleMessage);
            resolve({
              blob: message.blob,
              size: message.size,
              width: message.width,
              height: message.height,
              duration: message.duration,
            });
            break;

          case 'ERROR':
            worker.removeEventListener('message', handleMessage);
            reject(new Error(message.error));
            break;
        }
      };

      worker.addEventListener('message', handleMessage);

      worker.postMessage({
        type: 'CONVERT',
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
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
