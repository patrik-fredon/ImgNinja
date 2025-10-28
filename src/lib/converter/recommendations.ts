import { OutputFormat } from "@/types/formats";

interface FormatRecommendation {
  format: OutputFormat;
  reason: string;
  savings: string;
  priority: "high" | "medium" | "low";
  alternatives?: OutputFormat[];
}

interface FileAnalysis {
  hasTransparency: boolean;
  isPhotographic: boolean;
  hasAnimation: boolean;
  colorCount: number;
  dimensions: { width: number; height: number };
}

export async function recommendFormat(file: File): Promise<FormatRecommendation> {
  const analysis = await analyzeFile(file);
  const fileSize = file.size;
  const mimeType = file.type;

  // High priority recommendations
  if (analysis.hasTransparency && analysis.isPhotographic) {
    return {
      format: "webp",
      reason: "converter.recommendations.transparentPhoto",
      savings: "60-80%",
      priority: "high",
      alternatives: ["avif", "png"],
    };
  }

  if (analysis.hasAnimation) {
    return {
      format: "webp",
      reason: "converter.recommendations.animation",
      savings: "50-70%",
      priority: "high",
      alternatives: ["gif"],
    };
  }

  if (mimeType === "image/png" && fileSize > 1000000 && analysis.isPhotographic) {
    return {
      format: "avif",
      reason: "converter.recommendations.largePngPhoto",
      savings: "70-90%",
      priority: "high",
      alternatives: ["webp", "jpeg"],
    };
  }

  // Medium priority recommendations
  if (analysis.isPhotographic && fileSize > 500000) {
    return {
      format: "avif",
      reason: "converter.recommendations.largePhoto",
      savings: "60-80%",
      priority: "medium",
      alternatives: ["webp", "jpeg"],
    };
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return {
      format: "webp",
      reason: "converter.recommendations.jpeg",
      savings: "25-35%",
      priority: "medium",
      alternatives: ["avif"],
    };
  }

  if (mimeType === "image/png" && !analysis.hasTransparency && analysis.colorCount < 256) {
    return {
      format: "webp",
      reason: "converter.recommendations.simpleGraphic",
      savings: "40-60%",
      priority: "medium",
      alternatives: ["avif"],
    };
  }

  // Low priority / default recommendations
  if (mimeType === "image/gif" && !analysis.hasAnimation) {
    return {
      format: "webp",
      reason: "converter.recommendations.staticGif",
      savings: "50-70%",
      priority: "low",
      alternatives: ["png"],
    };
  }

  return {
    format: "webp",
    reason: "converter.recommendations.default",
    savings: "30-50%",
    priority: "low",
    alternatives: ["avif"],
  };
}

async function analyzeFile(file: File): Promise<FileAnalysis> {
  const hasTransparency = await checkTransparency(file);
  const dimensions = await getImageDimensions(file);
  const isPhotographic = await checkIfPhotographic(file);
  const hasAnimation = file.type === "image/gif" && (await checkIfAnimated(file));
  const colorCount = await estimateColorCount(file);

  return {
    hasTransparency,
    isPhotographic,
    hasAnimation,
    colorCount,
    dimensions,
  };
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function checkIfPhotographic(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      const sampleSize = 50;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      if (!ctx) {
        resolve(false);
        return;
      }

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      let gradientCount = 0;
      const threshold = 10;

      // Check for gradual color transitions (indicator of photographic content)
      for (let i = 0; i < data.length - 4; i += 4) {
        const r1 = data[i],
          g1 = data[i + 1],
          b1 = data[i + 2];
        const r2 = data[i + 4],
          g2 = data[i + 5],
          b2 = data[i + 6];

        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        if (diff > 0 && diff < threshold) {
          gradientCount++;
        }
      }

      // If more than 30% of pixels have gradual transitions, likely photographic
      resolve(gradientCount > (data.length / 4) * 0.3);
    };

    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}

async function checkIfAnimated(file: File): Promise<boolean> {
  if (file.type !== "image/gif") return false;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer);
      // Simple check for GIF animation by looking for multiple image descriptors
      let imageCount = 0;
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === 0x21 && arr[i + 1] === 0xf9) {
          // Graphic Control Extension
          imageCount++;
          if (imageCount > 1) {
            resolve(true);
            return;
          }
        }
      }
      resolve(false);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file);
  });
}

async function estimateColorCount(file: File): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      const sampleSize = 100;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      if (!ctx) {
        resolve(256);
        return;
      }

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      const colors = new Set<string>();
      for (let i = 0; i < data.length; i += 4) {
        const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colors.add(color);
      }

      // Extrapolate from sample
      const estimatedColors = Math.min(colors.size * 100, 16777216); // Max 24-bit colors
      resolve(estimatedColors);
    };

    img.onerror = () => resolve(256);
    img.src = URL.createObjectURL(file);
  });
}

async function checkTransparency(file: File): Promise<boolean> {
  if (!file.type.includes("png")) {
    return false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = Math.min(img.width, 100);
      canvas.height = Math.min(img.height, 100);

      if (!ctx) {
        resolve(false);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          resolve(true);
          return;
        }
      }

      resolve(false);
    };

    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}
