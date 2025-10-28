"use client";

import { useTranslations } from "next-intl";
import { OutputFormat } from "@/types/formats";
import { FORMATS, getSupportedFormats } from "@/lib/converter/formats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface FormatSelectorProps {
  selectedFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  sourceFormat?: string;
}

export function FormatSelector({
  selectedFormat,
  onFormatChange,
  sourceFormat,
}: FormatSelectorProps) {
  const t = useTranslations();
  const supportedFormats = getSupportedFormats();

  const handleFormatSelect = (format: OutputFormat) => {
    if (format !== selectedFormat) {
      onFormatChange(format);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t("converter.format.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t("converter.format.selectFormat")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {supportedFormats.map((format) => {
          const formatData = FORMATS[format];
          const isSelected = selectedFormat === format;
          const isRecommended = formatData.recommended;

          return (
            <Card
              key={format}
              variant="outlined"
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50"
                  : "hover:border-gray-300"
              }`}
              onClick={() => handleFormatSelect(format)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {t(`formats.${format}.name`)}
                  </CardTitle>
                  {isRecommended && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Recommended
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="mb-3">
                  {t(`formats.${format}.description`)}
                </CardDescription>

                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    <strong>Use case:</strong> {t(`formats.${format}.useCase`)}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {formatData.supportsTransparency && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        Transparency
                      </span>
                    )}
                    {formatData.supportsQuality && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                        Quality Control
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    <strong>Browser Support:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-xs">
                        Chrome {formatData.browserSupport.chrome}
                      </span>
                      <span className="text-xs">
                        • Firefox {formatData.browserSupport.firefox}
                      </span>
                      <span className="text-xs">
                        • Safari {formatData.browserSupport.safari}
                      </span>
                      <span className="text-xs">
                        • Edge {formatData.browserSupport.edge}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
