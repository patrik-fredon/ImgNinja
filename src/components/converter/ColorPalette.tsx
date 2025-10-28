"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ColorInfo } from "@/lib/converter/analysis";

interface ColorPaletteProps {
  file: File;
  className?: string;
}

interface ExtractedPalette {
  dominant: ColorInfo[];
  complementary: ColorInfo[];
  analogous: ColorInfo[];
  triadic: ColorInfo[];
}

export function ColorPalette({ file, className = "" }: ColorPaletteProps) {
  const t = useTranslations();
  const [palette, setPalette] = useState<ExtractedPalette | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [viewMode, setViewMode] = useState<"dominant" | "complementary" | "analogous" | "triadic">(
    "dominant"
  );

  useEffect(() => {
    const extractColors = async () => {
      setIsLoading(true);

      try {
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
        const extractedPalette = await analyzeImageColors(imageData);

        setPalette(extractedPalette);
        bitmap.close();
      } catch (error) {
        console.error("Color extraction failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    extractColors();
  }, [file]);

  const handleColorClick = (color: ColorInfo) => {
    setSelectedColor(color);
    navigator.clipboard.writeText(color.hex);
  };

  const handleExportPalette = () => {
    if (!palette) return;

    const exportData = {
      filename: file.name,
      palette: palette,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.split(".")[0]}_palette.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSS = () => {
    if (!palette) return;

    const cssVariables = palette.dominant
      .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
      .join("\n");

    const cssContent = `:root {\n${cssVariables}\n}`;

    const blob = new Blob([cssContent], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.split(".")[0]}_palette.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Extracting Colors...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!palette) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-gray-600">
            <p>Unable to extract color palette</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPalette = palette[viewMode];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Color Palette</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPalette}>
              Export JSON
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCSS}>
              Export CSS
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* View Mode Selector */}
        <div className="flex gap-2 overflow-x-auto">
          {(["dominant", "complementary", "analogous", "triadic"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                viewMode === mode
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Color Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {currentPalette.map((color, index) => (
              <ColorSwatch
                key={`${color.hex}-${index}`}
                color={color}
                isSelected={selectedColor?.hex === color.hex}
                onClick={() => handleColorClick(color)}
              />
            ))}
          </div>

          {/* Selected Color Details */}
          {selectedColor && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Selected Color</h4>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-white shadow-md"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">HEX:</span>
                    <span className="ml-2 font-mono font-medium">{selectedColor.hex}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">RGB:</span>
                    <span className="ml-2 font-mono font-medium">
                      rgb({selectedColor.rgb.join(", ")})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">HSL:</span>
                    <span className="ml-2 font-mono font-medium">
                      {rgbToHsl(selectedColor.rgb[0], selectedColor.rgb[1], selectedColor.rgb[2])}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Usage:</span>
                    <span className="ml-2 font-medium">{selectedColor.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Click any color to copy its hex value</p>
            </div>
          )}
        </div>

        {/* Color Harmony Information */}
        <div className="text-sm text-gray-600">
          <h4 className="font-semibold text-gray-900 mb-2">Color Harmony Types</h4>
          <div className="space-y-1">
            <p>
              <strong>Dominant:</strong> Most frequently used colors in the image
            </p>
            <p>
              <strong>Complementary:</strong> Colors opposite on the color wheel
            </p>
            <p>
              <strong>Analogous:</strong> Colors adjacent on the color wheel
            </p>
            <p>
              <strong>Triadic:</strong> Three colors evenly spaced on the color wheel
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ColorSwatchProps {
  color: ColorInfo;
  isSelected: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, isSelected, onClick }: ColorSwatchProps) {
  return (
    <div className="text-center">
      <button
        onClick={onClick}
        className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
          isSelected ? "border-brand-500 ring-2 ring-brand-200" : "border-white shadow-md"
        }`}
        style={{ backgroundColor: color.hex }}
        title={`${color.hex} (${color.percentage.toFixed(1)}%)`}
      />
      <p className="text-xs text-gray-600 mt-1 font-mono">{color.hex}</p>
      <p className="text-xs text-gray-500">{color.percentage.toFixed(1)}%</p>
    </div>
  );
}

// Utility functions
async function analyzeImageColors(imageData: ImageData): Promise<ExtractedPalette> {
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

  const dominant: ColorInfo[] = sortedColors.slice(0, 5).map(([hex, count]) => ({
    hex,
    rgb: hexToRgb(hex),
    percentage: (count / totalPixels) * 100,
  }));

  // Generate color harmonies based on dominant colors
  const baseColor = dominant[0];
  const complementary = generateComplementaryColors(baseColor);
  const analogous = generateAnalogousColors(baseColor);
  const triadic = generateTriadicColors(baseColor);

  return {
    dominant,
    complementary,
    analogous,
    triadic,
  };
}

function generateComplementaryColors(baseColor: ColorInfo): ColorInfo[] {
  const [h, s, l] = rgbToHslArray(baseColor.rgb[0], baseColor.rgb[1], baseColor.rgb[2]);
  const complementaryH = (h + 180) % 360;

  return [
    baseColor,
    ...[-30, -15, 15, 30].map((offset) => {
      const newH = (complementaryH + offset + 360) % 360;
      const rgb = hslToRgb(newH, s, l);
      return {
        hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
        rgb,
        percentage: 0,
      };
    }),
  ];
}

function generateAnalogousColors(baseColor: ColorInfo): ColorInfo[] {
  const [h, s, l] = rgbToHslArray(baseColor.rgb[0], baseColor.rgb[1], baseColor.rgb[2]);

  return [-60, -30, 0, 30, 60].map((offset) => {
    const newH = (h + offset + 360) % 360;
    const rgb = hslToRgb(newH, s, l);
    return {
      hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
      rgb,
      percentage: offset === 0 ? baseColor.percentage : 0,
    };
  });
}

function generateTriadicColors(baseColor: ColorInfo): ColorInfo[] {
  const [h, s, l] = rgbToHslArray(baseColor.rgb[0], baseColor.rgb[1], baseColor.rgb[2]);

  return [0, 120, 240]
    .map((offset) => {
      const newH = (h + offset) % 360;
      const rgb = hslToRgb(newH, s, l);
      return {
        hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
        rgb,
        percentage: offset === 0 ? baseColor.percentage : 0,
      };
    })
    .concat([
      // Add two more variations
      ...[-60, 60].map((offset) => {
        const newH = (h + offset + 360) % 360;
        const rgb = hslToRgb(newH, s * 0.8, l);
        return {
          hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
          rgb,
          percentage: 0,
        };
      }),
    ]);
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

function rgbToHsl(r: number, g: number, b: number): string {
  const [h, s, l] = rgbToHslArray(r, g, b);
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function rgbToHslArray(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
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
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
