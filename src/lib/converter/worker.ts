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
}

interface SuccessMessage {
  type: "SUCCESS";
  id: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
  duration: number;
}

interface ErrorMessage {
  type: "ERROR";
  id: string;
  error: string;
}

type WorkerResponse = ProgressMessage | SuccessMessage | ErrorMessage;

function calculateDimensions(
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

self.onmessage = async (e: MessageEvent<ConversionMessage>) => {
  const { id, file, options } = e.data;
  const startTime = performance.now();

  try {
    self.postMessage({
      type: "PROGRESS",
      id,
      progress: 10,
    } as ProgressMessage);

    const bitmap = await createImageBitmap(file);

    self.postMessage({
      type: "PROGRESS",
      id,
      progress: 30,
    } as ProgressMessage);

    const { width, height } = calculateDimensions(
      bitmap.width,
      bitmap.height,
      options.maxWidth,
      options.maxHeight
    );

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    self.postMessage({
      type: "PROGRESS",
      id,
      progress: 50,
    } as ProgressMessage);

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    self.postMessage({
      type: "PROGRESS",
      id,
      progress: 70,
    } as ProgressMessage);

    const quality = options.supportsQuality ? options.quality / 100 : undefined;

    const blob = await canvas.convertToBlob({
      type: options.mimeType,
      quality,
    });

    const duration = performance.now() - startTime;

    self.postMessage({
      type: "SUCCESS",
      id,
      blob,
      size: blob.size,
      width,
      height,
      duration,
    } as SuccessMessage);
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      id,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    } as ErrorMessage);
  }
};
