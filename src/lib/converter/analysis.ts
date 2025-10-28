import type { OutputFormat } from "@/types/formats";

export interface ImageAnalysis {
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  quality: {
    score: number;
    issues: QualityIssue[];
    recommendations: string[];
  };
  colors: {
    dominant: string[];
    palette: ColorInfo[];
    colorSpace: string;
  };
  metadata: ImageMetadata;
  optimization: OptimizationSuggestion[];
}

export interface QualityIssue {
  type: "blur" | "noise" | "compression" | "exposure" | "contrast";
  severity: "low" | "medium" | "high";
  description: string;
  suggestion: string;
}

export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  percentage: number;
  name?: string;
}

export interface ImageMetadata {
  fileSize: number;
  format: string;
  colorDepth: number;
  hasTransparency: boolean;
  created?: Date;
  modified?: Date;
  camera?: {
    make?: string;
    model?: string;
    iso?: number;
    aperture?: number;
    shutterSpeed?: string;
  };
}

export interface OptimizationSuggestion {
  type: "format" | "quality" | "resize" | "compression";
  title: string;
  description: string;
  expectedSavings: number;
  recommendedFormat?: OutputFormat;
  recommendedQuality?: number;
  recommendedDimensions?: { width: number; height: number };
}

export async function analyzeImage(file: File): Promise<ImageAnalysis> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const analysis: ImageAnalysis = {
    dimensions: analyzeDimensions(bitmap),
    quality: analyzeQuality(imageData),
    colors: await analyzeColors(imageData),
    metadata: await analyzeMetadata(file, bitmap),
    optimization: generateOptimizationSuggestions(file, bitmap, imageData),
  };

  bitmap.close();
  return analysis;
}

function analyzeDimensions(bitmap: ImageBitmap) {
  return {
    width: bitmap.width,
    height: bitmap.height,
    aspectRatio: bitmap.width / bitmap.height,
  };
}

function analyzeQuality(imageData: ImageData): ImageAnalysis["quality"] {
  const issues: QualityIssue[] = [];
  const recommendations: string[] = [];

  // Analyze image sharpness
  const sharpness = calculateSharpness(imageData);
  if (sharpness < 0.3) {
    issues.push({
      type: "blur",
      severity: sharpness < 0.1 ? "high" : "medium",
      description: "Image appears blurry or out of focus",
      suggestion: "Consider using a sharper source image or applying sharpening filters",
    });
  }

  // Analyze noise levels
  const noise = calculateNoise(imageData);
  if (noise > 0.7) {
    issues.push({
      type: "noise",
      severity: noise > 0.9 ? "high" : "medium",
      description: "High noise levels detected",
      suggestion: "Apply noise reduction or use a lower ISO setting",
    });
  }

  // Analyze contrast
  const contrast = calculateContrast(imageData);
  if (contrast < 0.3) {
    issues.push({
      type: "contrast",
      severity: "medium",
      description: "Low contrast detected",
      suggestion: "Increase contrast to improve visual impact",
    });
  }

  // Generate recommendations
  if (issues.length === 0) {
    recommendations.push("Image quality is good for web use");
  } else {
    recommendations.push("Consider image enhancement before conversion");
  }

  const score = Math.max(
    0,
    100 - issues.length * 20 - issues.filter((i) => i.severity === "high").length * 10
  );

  return { score, issues, recommendations };
}

async function analyzeColors(imageData: ImageData): Promise<ImageAnalysis["colors"]> {
  const colorMap = new Map<string, number>();
  const data = imageData.data;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a > 128) {
      // Only count non-transparent pixels
      const hex = rgbToHex(r, g, b);
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
  }

  // Get dominant colors
  const sortedColors = Array.from(colorMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0);

  const palette: ColorInfo[] = sortedColors.map(([hex, count]) => ({
    hex,
    rgb: hexToRgb(hex),
    percentage: (count / totalPixels) * 100,
  }));

  return {
    dominant: palette.slice(0, 5).map((c) => c.hex),
    palette,
    colorSpace: "sRGB",
  };
}

async function analyzeMetadata(file: File, bitmap: ImageBitmap): Promise<ImageMetadata> {
  return {
    fileSize: file.size,
    format: file.type,
    colorDepth: 24, // Assume 24-bit for now
    hasTransparency: file.type.includes("png") || file.type.includes("webp"),
    created: new Date(file.lastModified),
    modified: new Date(file.lastModified),
  };
}

function generateOptimizationSuggestions(
  file: File,
  bitmap: ImageBitmap,
  imageData: ImageData
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Format optimization
  if (file.type === "image/png" && !hasTransparency(imageData)) {
    suggestions.push({
      type: "format",
      title: "Convert to JPEG",
      description: "PNG without transparency can be converted to JPEG for smaller file size",
      expectedSavings: 60,
      recommendedFormat: "jpeg",
      recommendedQuality: 85,
    });
  }

  if (file.type === "image/jpeg") {
    suggestions.push({
      type: "format",
      title: "Convert to WebP",
      description: "WebP provides better compression than JPEG with similar quality",
      expectedSavings: 30,
      recommendedFormat: "webp",
      recommendedQuality: 80,
    });
  }

  // Size optimization
  if (bitmap.width > 1920 || bitmap.height > 1080) {
    suggestions.push({
      type: "resize",
      title: "Reduce image dimensions",
      description: "Large images can be resized for web use",
      expectedSavings: 50,
      recommendedDimensions: {
        width: Math.min(bitmap.width, 1920),
        height: Math.min(bitmap.height, 1080),
      },
    });
  }

  // Quality optimization
  if (file.size > 1024 * 1024) {
    // > 1MB
    suggestions.push({
      type: "quality",
      title: "Reduce quality setting",
      description: "High quality settings may not be necessary for web use",
      expectedSavings: 40,
      recommendedQuality: 75,
    });
  }

  return suggestions;
}

// Utility functions
function calculateSharpness(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  let sharpness = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;

      const rightGray = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
      const bottomGray =
        (data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2]) / 3;

      sharpness += Math.abs(gray - rightGray) + Math.abs(gray - bottomGray);
      count += 2;
    }
  }

  return count > 0 ? sharpness / count / 255 : 0;
}

function calculateNoise(imageData: ImageData): number {
  const data = imageData.data;
  let noise = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (i + 16 < data.length) {
      const nextR = data[i + 16];
      const nextG = data[i + 17];
      const nextB = data[i + 18];

      noise += Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
      count += 3;
    }
  }

  return count > 0 ? noise / count / 255 : 0;
}

function calculateContrast(imageData: ImageData): number {
  const data = imageData.data;
  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    min = Math.min(min, gray);
    max = Math.max(max, gray);
  }

  return (max - min) / 255;
}

function hasTransparency(imageData: ImageData): boolean {
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}
