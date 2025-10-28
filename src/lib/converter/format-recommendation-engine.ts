import type { OutputFormat } from "@/types/formats";
import { FORMATS } from "./formats";

export interface RecommendationContext {
  file: File;
  useCase: "web" | "print" | "archive" | "social" | "email" | "mobile";
  priority: "quality" | "size" | "compatibility" | "speed";
  browserSupport: "modern" | "legacy" | "all";
  hasTransparency?: boolean;
  targetFileSize?: number; // in bytes
  dimensions?: { width: number; height: number };
}

export interface FormatRecommendation {
  format: OutputFormat;
  confidence: number; // 0-100
  reasons: string[];
  warnings: string[];
  expectedSavings: number; // percentage
  qualityImpact: "none" | "minimal" | "moderate" | "significant";
}

export interface RecommendationResult {
  primary: FormatRecommendation;
  alternatives: FormatRecommendation[];
  explanation: string;
}

export class FormatRecommendationEngine {
  static async getRecommendation(context: RecommendationContext): Promise<RecommendationResult> {
    const recommendations = await this.analyzeAllFormats(context);
    const sortedRecommendations = recommendations.sort((a, b) => b.confidence - a.confidence);

    const primary = sortedRecommendations[0];
    const alternatives = sortedRecommendations.slice(1, 4);

    return {
      primary,
      alternatives,
      explanation: this.generateExplanation(context, primary),
    };
  }

  private static async analyzeAllFormats(
    context: RecommendationContext
  ): Promise<FormatRecommendation[]> {
    const formats = Object.keys(FORMATS) as OutputFormat[];
    const recommendations: FormatRecommendation[] = [];

    for (const format of formats) {
      const recommendation = await this.analyzeFormat(format, context);
      recommendations.push(recommendation);
    }

    return recommendations;
  }

  private static async analyzeFormat(
    format: OutputFormat,
    context: RecommendationContext
  ): Promise<FormatRecommendation> {
    const formatData = FORMATS[format];
    let confidence = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    let expectedSavings = 0;
    let qualityImpact: FormatRecommendation["qualityImpact"] = "none";

    // Analyze use case compatibility
    const useCaseScore = this.getUseCaseScore(format, context.useCase);
    confidence += useCaseScore.score;
    reasons.push(...useCaseScore.reasons);
    warnings.push(...useCaseScore.warnings);

    // Analyze priority alignment
    const priorityScore = this.getPriorityScore(format, context.priority);
    confidence += priorityScore.score;
    reasons.push(...priorityScore.reasons);

    // Analyze browser support requirements
    const browserScore = this.getBrowserSupportScore(format, context.browserSupport);
    confidence += browserScore.score;
    if (browserScore.score < 20) {
      warnings.push(browserScore.warning || "Limited browser support");
    }

    // Analyze transparency requirements
    if (context.hasTransparency !== undefined) {
      const transparencyScore = this.getTransparencyScore(format, context.hasTransparency);
      confidence += transparencyScore.score;
      if (transparencyScore.warning) {
        warnings.push(transparencyScore.warning);
      }
    }

    // Analyze file characteristics
    const fileScore = await this.getFileCharacteristicsScore(format, context);
    confidence += fileScore.score;
    expectedSavings = fileScore.expectedSavings;
    qualityImpact = fileScore.qualityImpact;

    // Normalize confidence to 0-100
    confidence = Math.min(100, Math.max(0, confidence));

    return {
      format,
      confidence,
      reasons: reasons.filter(Boolean),
      warnings: warnings.filter(Boolean),
      expectedSavings,
      qualityImpact,
    };
  }

  private static getUseCaseScore(format: OutputFormat, useCase: RecommendationContext["useCase"]) {
    const scores: Record<
      OutputFormat,
      Record<typeof useCase, { score: number; reasons: string[]; warnings: string[] }>
    > = {
      webp: {
        web: {
          score: 30,
          reasons: ["Excellent web compression", "Good browser support"],
          warnings: [],
        },
        print: { score: 15, reasons: [], warnings: ["Not ideal for print quality"] },
        archive: { score: 20, reasons: ["Good compression for storage"], warnings: [] },
        social: { score: 25, reasons: ["Good for social media"], warnings: [] },
        email: {
          score: 25,
          reasons: ["Reduces email size"],
          warnings: ["Some email clients may not support"],
        },
        mobile: { score: 30, reasons: ["Excellent for mobile bandwidth"], warnings: [] },
      },
      avif: {
        web: {
          score: 35,
          reasons: ["Superior compression", "Future-proof format"],
          warnings: ["Limited older browser support"],
        },
        print: {
          score: 20,
          reasons: ["High quality potential"],
          warnings: ["Limited software support"],
        },
        archive: { score: 30, reasons: ["Excellent compression for archival"], warnings: [] },
        social: {
          score: 30,
          reasons: ["Best compression for social media"],
          warnings: ["Platform support varies"],
        },
        email: { score: 20, reasons: [], warnings: ["Poor email client support"] },
        mobile: {
          score: 35,
          reasons: ["Best compression for mobile"],
          warnings: ["Requires modern devices"],
        },
      },
      jpeg: {
        web: { score: 25, reasons: ["Universal compatibility"], warnings: ["Larger file sizes"] },
        print: {
          score: 30,
          reasons: ["Excellent print quality", "Wide software support"],
          warnings: [],
        },
        archive: { score: 20, reasons: ["Universal format"], warnings: ["Lossy compression"] },
        social: { score: 25, reasons: ["Universal platform support"], warnings: [] },
        email: { score: 30, reasons: ["Universal email support"], warnings: [] },
        mobile: {
          score: 20,
          reasons: ["Universal mobile support"],
          warnings: ["Larger file sizes"],
        },
      },
      png: {
        web: {
          score: 20,
          reasons: ["Lossless quality", "Transparency support"],
          warnings: ["Large file sizes"],
        },
        print: {
          score: 35,
          reasons: ["Perfect print quality", "Lossless compression"],
          warnings: [],
        },
        archive: {
          score: 35,
          reasons: ["Perfect archival quality"],
          warnings: ["Large file sizes"],
        },
        social: { score: 15, reasons: [], warnings: ["Large file sizes for social media"] },
        email: { score: 15, reasons: [], warnings: ["Large files for email"] },
        mobile: { score: 10, reasons: [], warnings: ["Too large for mobile bandwidth"] },
      },
      gif: {
        web: {
          score: 15,
          reasons: ["Animation support"],
          warnings: ["Poor compression", "Limited colors"],
        },
        print: { score: 5, reasons: [], warnings: ["Poor print quality", "Limited colors"] },
        archive: { score: 10, reasons: [], warnings: ["Poor quality for archival"] },
        social: { score: 20, reasons: ["Animation support"], warnings: ["Large file sizes"] },
        email: { score: 10, reasons: [], warnings: ["Large file sizes", "Poor quality"] },
        mobile: { score: 10, reasons: [], warnings: ["Large file sizes", "Poor quality"] },
      },
    };

    return scores[format][useCase] || { score: 0, reasons: [], warnings: [] };
  }

  private static getPriorityScore(
    format: OutputFormat,
    priority: RecommendationContext["priority"]
  ) {
    const scores: Record<
      OutputFormat,
      Record<typeof priority, { score: number; reasons: string[] }>
    > = {
      webp: {
        quality: { score: 25, reasons: ["Good quality retention"] },
        size: { score: 30, reasons: ["Excellent compression"] },
        compatibility: { score: 25, reasons: ["Good modern browser support"] },
        speed: { score: 25, reasons: ["Fast encoding/decoding"] },
      },
      avif: {
        quality: { score: 30, reasons: ["Superior quality retention"] },
        size: { score: 35, reasons: ["Best-in-class compression"] },
        compatibility: { score: 15, reasons: [] },
        speed: { score: 20, reasons: [] },
      },
      jpeg: {
        quality: { score: 25, reasons: ["Good quality for photos"] },
        size: { score: 20, reasons: ["Decent compression"] },
        compatibility: { score: 35, reasons: ["Universal compatibility"] },
        speed: { score: 30, reasons: ["Very fast processing"] },
      },
      png: {
        quality: { score: 35, reasons: ["Perfect lossless quality"] },
        size: { score: 10, reasons: [] },
        compatibility: { score: 35, reasons: ["Universal compatibility"] },
        speed: { score: 25, reasons: ["Fast processing"] },
      },
      gif: {
        quality: { score: 10, reasons: [] },
        size: { score: 15, reasons: [] },
        compatibility: { score: 35, reasons: ["Universal compatibility"] },
        speed: { score: 30, reasons: ["Very fast processing"] },
      },
    };

    return scores[format][priority] || { score: 0, reasons: [] };
  }

  private static getBrowserSupportScore(
    format: OutputFormat,
    requirement: RecommendationContext["browserSupport"]
  ) {
    const formatData = FORMATS[format];
    const support = formatData.browserSupport;

    const isUniversal = Object.values(support).every((version) => version === "All");
    const isModern = Object.values(support).every(
      (version) => version === "All" || parseInt(version.replace("+", "")) >= 80
    );

    switch (requirement) {
      case "all":
        if (isUniversal) return { score: 35, warning: undefined };
        if (isModern) return { score: 20, warning: "Limited support in older browsers" };
        return { score: 5, warning: "Poor browser compatibility" };

      case "modern":
        if (isUniversal || isModern) return { score: 35, warning: undefined };
        return { score: 15, warning: "Limited support in some modern browsers" };

      case "legacy":
        if (isUniversal) return { score: 35, warning: undefined };
        return { score: 10, warning: "Not supported in legacy browsers" };

      default:
        return { score: 20, warning: undefined };
    }
  }

  private static getTransparencyScore(format: OutputFormat, needsTransparency: boolean) {
    const formatData = FORMATS[format];

    if (needsTransparency && formatData.supportsTransparency) {
      return { score: 20, warning: undefined };
    }

    if (needsTransparency && !formatData.supportsTransparency) {
      return { score: 0, warning: "Format does not support transparency" };
    }

    if (!needsTransparency && !formatData.supportsTransparency) {
      return { score: 10, warning: undefined };
    }

    return { score: 5, warning: undefined };
  }

  private static async getFileCharacteristicsScore(
    format: OutputFormat,
    context: RecommendationContext
  ): Promise<{
    score: number;
    expectedSavings: number;
    qualityImpact: FormatRecommendation["qualityImpact"];
  }> {
    const file = context.file;
    let score = 0;
    let expectedSavings = 0;
    let qualityImpact: FormatRecommendation["qualityImpact"] = "none";

    // Analyze file type and size
    const isPhoto = file.type.includes("jpeg") || file.type.includes("jpg");
    const isLarge = file.size > 1024 * 1024; // > 1MB
    const hasAlpha = file.type.includes("png") && context.hasTransparency;

    switch (format) {
      case "avif":
        if (isPhoto) {
          score += 15;
          expectedSavings = 50;
          qualityImpact = "minimal";
        }
        if (isLarge) {
          score += 10;
          expectedSavings = Math.max(expectedSavings, 60);
        }
        break;

      case "webp":
        if (isPhoto) {
          score += 10;
          expectedSavings = 30;
          qualityImpact = "minimal";
        }
        if (hasAlpha) {
          score += 15;
          expectedSavings = 40;
        }
        if (isLarge) {
          score += 8;
          expectedSavings = Math.max(expectedSavings, 35);
        }
        break;

      case "jpeg":
        if (isPhoto && !hasAlpha) {
          score += 12;
          expectedSavings = 20;
          qualityImpact = "minimal";
        }
        if (file.type.includes("png") && !hasAlpha) {
          score += 15;
          expectedSavings = 60;
          qualityImpact = "none";
        }
        break;

      case "png":
        if (hasAlpha) {
          score += 10;
          expectedSavings = 0;
          qualityImpact = "none";
        }
        if (file.type.includes("jpeg")) {
          score -= 5;
          expectedSavings = -50; // Likely to be larger
          qualityImpact = "none";
        }
        break;

      case "gif":
        score -= 5; // Generally not recommended
        expectedSavings = -20;
        qualityImpact = "significant";
        break;
    }

    return { score, expectedSavings, qualityImpact };
  }

  private static generateExplanation(
    context: RecommendationContext,
    primary: FormatRecommendation
  ): string {
    const formatData = FORMATS[primary.format];

    let explanation = `${formatData.name} is recommended for your ${context.useCase} use case`;

    if (context.priority === "size") {
      explanation += " with size optimization priority";
    } else if (context.priority === "quality") {
      explanation += " with quality preservation priority";
    } else if (context.priority === "compatibility") {
      explanation += " with maximum compatibility priority";
    }

    explanation += `. This format offers ${primary.reasons.join(", ").toLowerCase()}`;

    if (primary.expectedSavings > 0) {
      explanation += ` and can reduce your file size by approximately ${primary.expectedSavings}%`;
    }

    if (primary.warnings.length > 0) {
      explanation += `. Note: ${primary.warnings.join(", ").toLowerCase()}`;
    }

    return explanation + ".";
  }
}

// Convenience function for simple recommendations
export async function getQuickRecommendation(
  file: File,
  useCase: RecommendationContext["useCase"] = "web"
): Promise<OutputFormat> {
  const context: RecommendationContext = {
    file,
    useCase,
    priority: "size",
    browserSupport: "modern",
  };

  const result = await FormatRecommendationEngine.getRecommendation(context);
  return result.primary.format;
}
