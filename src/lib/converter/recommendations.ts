import { OutputFormat } from "@/types/formats";

interface FormatRecommendation {
  format: OutputFormat;
  reason: string;
  savings: string;
}

export async function recommendFormat(
  file: File
): Promise<FormatRecommendation> {
  const hasTransparency = await checkTransparency(file);
  const fileSize = file.size;
  const mimeType = file.type;

  if (hasTransparency) {
    return {
      format: "webp",
      reason: "converter.recommendations.transparency",
      savings: "60-80%",
    };
  }

  if (mimeType === "image/png" && fileSize > 500000) {
    return {
      format: "avif",
      reason: "converter.recommendations.largePng",
      savings: "70-90%",
    };
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return {
      format: "webp",
      reason: "converter.recommendations.jpeg",
      savings: "25-35%",
    };
  }

  if (mimeType === "image/gif") {
    return {
      format: "webp",
      reason: "converter.recommendations.gif",
      savings: "50-70%",
    };
  }

  return {
    format: "webp",
    reason: "converter.recommendations.default",
    savings: "30-50%",
  };
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
