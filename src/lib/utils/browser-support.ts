import type { OutputFormat } from "@/types/formats";

/**
 * Detects browser support for image formats using Canvas API
 * @returns Record mapping each format to its support status
 */
export function detectFormatSupport(): Record<OutputFormat, boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      webp: false,
      avif: false,
      png: false,
      jpeg: false,
      gif: false,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  return {
    webp: canvas.toDataURL("image/webp").startsWith("data:image/webp"),
    avif: canvas.toDataURL("image/avif").startsWith("data:image/avif"),
    png: true,
    jpeg: true,
    gif: true,
  };
}

/**
 * Checks if Web Workers are supported in the current browser
 * @returns true if Web Workers are supported
 */
export function supportsWebWorker(): boolean {
  return typeof Worker !== "undefined";
}

/**
 * Checks if OffscreenCanvas is supported in the current browser
 * @returns true if OffscreenCanvas is supported
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== "undefined";
}
