import type { OutputFormat } from "@/types/formats";
import type { ConversionOptions } from "./engine";

export interface MobileQualityPreset {
  id: string;
  name: string;
  description: string;
  quality: number;
  maxWidth: number;
  maxHeight: number;
  targetFileSize: number; // KB
  useCase: string;
  recommendedFor: string[];
  compressionLevel: "aggressive" | "balanced" | "conservative";
}

export interface MobileFormatRecommendation {
  format: OutputFormat;
  preset: MobileQualityPreset;
  reason: string;
  estimatedSavings: number; // percentage
  pros: string[];
  cons: string[];
}

export interface DeviceProfile {
  type: "low-end" | "mid-range" | "high-end";
  connectionSpeed: "slow" | "medium" | "fast";
  screenDensity: "low" | "medium" | "high" | "ultra-high";
  memoryConstraints: boolean;
}

export class MobilePresetsManager {
  private static readonly QUALITY_PRESETS: Record<string, MobileQualityPreset> = {
    "data-saver": {
      id: "data-saver",
      name: "Data Saver",
      description: "Maximum compression for minimal data usage",
      quality: 45,
      maxWidth: 800,
      maxHeight: 800,
      targetFileSize: 50, // 50KB
      useCase: "Social media sharing on slow connections",
      recommendedFor: ["slow connections", "limited data plans", "low-end devices"],
      compressionLevel: "aggressive",
    },
    "mobile-web": {
      id: "mobile-web",
      name: "Mobile Web",
      description: "Optimized for mobile web viewing",
      quality: 65,
      maxWidth: 1200,
      maxHeight: 1200,
      targetFileSize: 150, // 150KB
      useCase: "Mobile websites and web apps",
      recommendedFor: ["mobile browsers", "responsive websites", "PWAs"],
      compressionLevel: "balanced",
    },
    "mobile-app": {
      id: "mobile-app",
      name: "Mobile App",
      description: "Balanced quality for mobile applications",
      quality: 75,
      maxWidth: 1600,
      maxHeight: 1600,
      targetFileSize: 300, // 300KB
      useCase: "Mobile app interfaces and content",
      recommendedFor: ["native apps", "hybrid apps", "in-app content"],
      compressionLevel: "balanced",
    },
    "mobile-hd": {
      id: "mobile-hd",
      name: "Mobile HD",
      description: "High quality for modern mobile devices",
      quality: 85,
      maxWidth: 2048,
      maxHeight: 2048,
      targetFileSize: 500, // 500KB
      useCase: "High-resolution mobile displays",
      recommendedFor: ["flagship devices", "retina displays", "photo viewing"],
      compressionLevel: "conservative",
    },
    "mobile-print": {
      id: "mobile-print",
      name: "Mobile Print",
      description: "Print-ready quality from mobile",
      quality: 90,
      maxWidth: 3000,
      maxHeight: 3000,
      targetFileSize: 1000, // 1MB
      useCase: "Mobile-to-print workflows",
      recommendedFor: ["photo printing", "document printing", "high-quality output"],
      compressionLevel: "conservative",
    },
  };

  private static readonly FORMAT_RECOMMENDATIONS: Record<
    OutputFormat,
    {
      mobileScore: number;
      compressionEfficiency: number;
      browserSupport: number;
      qualityRetention: number;
    }
  > = {
    webp: {
      mobileScore: 95,
      compressionEfficiency: 90,
      browserSupport: 85,
      qualityRetention: 88,
    },
    avif: {
      mobileScore: 90,
      compressionEfficiency: 95,
      browserSupport: 70,
      qualityRetention: 92,
    },
    jpeg: {
      mobileScore: 80,
      compressionEfficiency: 75,
      browserSupport: 100,
      qualityRetention: 75,
    },
    png: {
      mobileScore: 60,
      compressionEfficiency: 40,
      browserSupport: 100,
      qualityRetention: 100,
    },
    gif: {
      mobileScore: 50,
      compressionEfficiency: 30,
      browserSupport: 100,
      qualityRetention: 60,
    },
  };

  static getPresets(): Record<string, MobileQualityPreset> {
    return { ...this.QUALITY_PRESETS };
  }

  static getPreset(id: string): MobileQualityPreset | undefined {
    return this.QUALITY_PRESETS[id];
  }

  static getRecommendedPreset(deviceProfile: DeviceProfile): MobileQualityPreset {
    // Low-end devices or slow connections
    if (deviceProfile.type === "low-end" || deviceProfile.connectionSpeed === "slow") {
      return this.QUALITY_PRESETS["data-saver"];
    }

    // Mid-range devices with medium connections
    if (deviceProfile.type === "mid-range" && deviceProfile.connectionSpeed === "medium") {
      return this.QUALITY_PRESETS["mobile-web"];
    }

    // High-end devices with fast connections
    if (deviceProfile.type === "high-end" && deviceProfile.connectionSpeed === "fast") {
      if (deviceProfile.screenDensity === "ultra-high") {
        return this.QUALITY_PRESETS["mobile-hd"];
      }
      return this.QUALITY_PRESETS["mobile-app"];
    }

    // Default fallback
    return this.QUALITY_PRESETS["mobile-web"];
  }

  static getFormatRecommendations(
    deviceProfile: DeviceProfile,
    originalFormat: string,
    fileSize: number
  ): MobileFormatRecommendation[] {
    const recommendations: MobileFormatRecommendation[] = [];
    const preset = this.getRecommendedPreset(deviceProfile);

    // Analyze each format
    for (const [format, metrics] of Object.entries(this.FORMAT_RECOMMENDATIONS)) {
      const outputFormat = format as OutputFormat;

      // Skip if browser support is too low for the device
      if (deviceProfile.type === "low-end" && metrics.browserSupport < 90) {
        continue;
      }

      const recommendation: MobileFormatRecommendation = {
        format: outputFormat,
        preset,
        reason: this.generateRecommendationReason(outputFormat, metrics, deviceProfile),
        estimatedSavings: this.calculateEstimatedSavings(originalFormat, outputFormat, fileSize),
        pros: this.getFormatPros(outputFormat, deviceProfile),
        cons: this.getFormatCons(outputFormat, deviceProfile),
      };

      recommendations.push(recommendation);
    }

    // Sort by mobile score and compression efficiency
    return recommendations.sort((a, b) => {
      const aMetrics = this.FORMAT_RECOMMENDATIONS[a.format];
      const bMetrics = this.FORMAT_RECOMMENDATIONS[b.format];
      const aScore = aMetrics.mobileScore + aMetrics.compressionEfficiency;
      const bScore = bMetrics.mobileScore + bMetrics.compressionEfficiency;
      return bScore - aScore;
    });
  }

  static createMobileConversionOptions(
    preset: MobileQualityPreset,
    format: OutputFormat
  ): ConversionOptions {
    return {
      format,
      quality: preset.quality,
      maxWidth: preset.maxWidth,
      maxHeight: preset.maxHeight,
    };
  }

  static detectDeviceProfile(): DeviceProfile {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Detect device type
    let deviceType: DeviceProfile["type"] = "mid-range";

    if ("deviceMemory" in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory <= 2) deviceType = "low-end";
      else if (memory >= 8) deviceType = "high-end";
    } else if ("hardwareConcurrency" in navigator) {
      const cores = navigator.hardwareConcurrency;
      if (cores <= 2) deviceType = "low-end";
      else if (cores >= 8) deviceType = "high-end";
    }

    // Detect connection speed
    let connectionSpeed: DeviceProfile["connectionSpeed"] = "medium";

    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType) {
        if (["slow-2g", "2g"].includes(connection.effectiveType)) {
          connectionSpeed = "slow";
        } else if (["4g"].includes(connection.effectiveType)) {
          connectionSpeed = "fast";
        }
      }
    }

    // Detect screen density
    let screenDensity: DeviceProfile["screenDensity"] = "medium";

    if (devicePixelRatio >= 3) {
      screenDensity = "ultra-high";
    } else if (devicePixelRatio >= 2) {
      screenDensity = "high";
    } else if (devicePixelRatio < 1.5) {
      screenDensity = "low";
    }

    // Check memory constraints
    const memoryConstraints =
      deviceType === "low-end" || screenWidth * screenHeight * devicePixelRatio > 2000000; // Large screen with high DPI

    return {
      type: deviceType,
      connectionSpeed,
      screenDensity,
      memoryConstraints,
    };
  }

  private static generateRecommendationReason(
    format: OutputFormat,
    metrics: (typeof this.FORMAT_RECOMMENDATIONS)[OutputFormat],
    deviceProfile: DeviceProfile
  ): string {
    if (format === "webp") {
      return "Excellent compression with good quality retention, widely supported on mobile";
    }

    if (format === "avif") {
      return "Best compression available, ideal for modern devices with fast connections";
    }

    if (format === "jpeg") {
      return "Universal compatibility with decent compression for photos";
    }

    if (format === "png") {
      return "Lossless quality with transparency support, but larger file sizes";
    }

    return "Basic format with universal support";
  }

  private static calculateEstimatedSavings(
    originalFormat: string,
    targetFormat: OutputFormat,
    fileSize: number
  ): number {
    const compressionRatios: Record<string, number> = {
      "image/jpeg": 0.8,
      "image/png": 1.0,
      "image/webp": 0.6,
      "image/avif": 0.5,
      "image/gif": 0.9,
    };

    const originalRatio = compressionRatios[originalFormat] || 0.8;
    const targetRatio = compressionRatios[`image/${targetFormat}`] || 0.8;

    return Math.max(0, Math.round((1 - targetRatio / originalRatio) * 100));
  }

  private static getFormatPros(format: OutputFormat, deviceProfile: DeviceProfile): string[] {
    const pros: Record<OutputFormat, string[]> = {
      webp: [
        "25-35% smaller than JPEG",
        "Supports transparency",
        "Good mobile browser support",
        "Fast decoding on mobile",
      ],
      avif: [
        "50% smaller than JPEG",
        "Excellent quality retention",
        "HDR support",
        "Future-proof format",
      ],
      jpeg: [
        "Universal browser support",
        "Small file sizes for photos",
        "Hardware acceleration",
        "Familiar format",
      ],
      png: [
        "Lossless compression",
        "Transparency support",
        "Universal support",
        "No compression artifacts",
      ],
      gif: [
        "Animation support",
        "Universal support",
        "Small for simple graphics",
        "Transparency support",
      ],
    };

    return pros[format] || [];
  }

  private static getFormatCons(format: OutputFormat, deviceProfile: DeviceProfile): string[] {
    const cons: Record<OutputFormat, string[]> = {
      webp: ["Limited support in older browsers", "Slower encoding than JPEG"],
      avif: ["Limited browser support", "Slow encoding/decoding", "Not supported on older devices"],
      jpeg: ["Lossy compression", "No transparency support", "Compression artifacts"],
      png: ["Large file sizes", "Not ideal for photos", "No progressive loading"],
      gif: ["Limited color palette", "Large file sizes", "Poor photo quality"],
    };

    return cons[format] || [];
  }
}
