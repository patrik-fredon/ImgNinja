"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ColorInfo } from "@/lib/converter/analysis";

interface ColorPaletteProps {
  colors: ColorInfo[];
  className?: string;
  showPercentages?: boolean;
  maxColors?: number;
}

export function ColorPalette({
  colors,
  className = "",
  showPercentages = true,
  maxColors = 10,
}: ColorPaletteProps) {
  const t = useTranslations();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const displayColors = colors.slice(0, maxColors);

  const copyColor = async (color: ColorInfo, format: "hex" | "rgb" | "hsl") => {
    let colorValue: string;

    switch (format) {
      case "hex":
        colorValue = color.hex;
        break;
      case "rgb":
        colorValue = `rgb(${color.rgb.join(", ")})`;
        break;
      case "hsl": {
        const hsl = rgbToHsl(color.rgb[0], color.rgb[1], color.rgb[2]);
        colorValue = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
        break;
      }
    }

    try {
      await navigator.clipboard.writeText(colorValue);
      setCopiedColor(colorValue);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error("Failed to copy color:", err);
    }
  };

  const exportPalette = (format: "css" | "json" | "ase") => {
    let content: string;

    switch (format) {
      case "css":
        content = `:root {\n${displayColors
          .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
          .join("\n")}\n}`;
        break;
      case "json":
        content = JSON.stringify(
          displayColors.map((color) => ({
            hex: color.hex,
            rgb: color.rgb,
            percentage: color.percentage,
          })),
          null,
          2
        );
        break;
      case "ase":
        // Adobe Swatch Exchange format (simplified)
        content = displayColors
          .map((color, index) => `Color ${index + 1}: ${color.hex}`)
          .join("\n");
        break;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palette.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard className={className}>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle>Color Palette</GlassCardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "primary" : "outline"}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "primary" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Color Display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-5 gap-3">
            {displayColors.map((color, index) => (
              <ColorSwatch
                key={color.hex}
                color={color}
                index={index}
                showPercentage={showPercentages}
                onCopy={copyColor}
                copied={copiedColor === color.hex}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayColors.map((color, index) => (
              <ColorRow
                key={color.hex}
                color={color}
                index={index}
                showPercentage={showPercentages}
                onCopy={copyColor}
                copied={copiedColor?.includes(color.hex) || false}
              />
            ))}
          </div>
        )}

        {/* Color Statistics */}
        <div className="pt-4 border-t border-white/20">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Colors:</span>
              <p className="font-medium">{colors.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Dominant:</span>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: colors[0]?.hex }}
                />
                <span className="font-medium">{colors[0]?.hex}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-600">Coverage:</span>
              <p className="font-medium">
                {displayColors
                  .reduce((sum, color) => sum + color.percentage, 0)
                  .toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportPalette("css")}
            >
              Export CSS
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportPalette("json")}
            >
              Export JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportPalette("ase")}
            >
              Export ASE
            </Button>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

interface ColorSwatchProps {
  color: ColorInfo;
  index: number;
  showPercentage: boolean;
  onCopy: (color: ColorInfo, format: "hex" | "rgb" | "hsl") => void;
  copied: boolean;
}

function ColorSwatch({
  color,
  index,
  showPercentage,
  onCopy,
  copied,
}: ColorSwatchProps) {
  return (
    <Tooltip content={`${color.hex} (${color.percentage.toFixed(1)}%)`}>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onCopy(color, "hex")}
          className="w-full aspect-square rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors relative overflow-hidden group"
          style={{ backgroundColor: color.hex }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              {copied ? "✓" : "📋"}
            </span>
          </div>
        </button>
        <div className="text-center">
          <p className="text-xs font-mono text-gray-700">{color.hex}</p>
          {showPercentage && (
            <p className="text-xs text-gray-500">
              {color.percentage.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </Tooltip>
  );
}

interface ColorRowProps {
  color: ColorInfo;
  index: number;
  showPercentage: boolean;
  onCopy: (color: ColorInfo, format: "hex" | "rgb" | "hsl") => void;
  copied: boolean;
}

function ColorRow({
  color,
  index,
  showPercentage,
  onCopy,
  copied,
}: ColorRowProps) {
  const hsl = rgbToHsl(color.rgb[0], color.rgb[1], color.rgb[2]);

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div
        className="w-12 h-12 rounded-lg border border-gray-300 shrink-0"
        style={{ backgroundColor: color.hex }}
      />

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onCopy(color, "hex")}
            className="font-mono text-sm hover:text-blue-600 transition-colors"
          >
            {color.hex}
          </button>
          <button
            onClick={() => onCopy(color, "rgb")}
            className="font-mono text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            rgb({color.rgb.join(", ")})
          </button>
          <button
            onClick={() => onCopy(color, "hsl")}
            className="font-mono text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            hsl({hsl[0]}, {hsl[1]}%, {hsl[2]}%)
          </button>
        </div>
        {showPercentage && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-300"
                style={{
                  width: `${Math.min(color.percentage, 100)}%`,
                  backgroundColor: color.hex,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {color.percentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }

    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
