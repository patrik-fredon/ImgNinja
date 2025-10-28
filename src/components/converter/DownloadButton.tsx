"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import JSZip from "jszip";
import { Button } from "@/components/ui/Button";
import { FORMATS } from "@/lib/converter/formats";
import type { OutputFormat } from "@/types/formats";

export interface DownloadableFile {
  id: string;
  originalName: string;
  outputFormat: OutputFormat;
  blob: Blob;
}

interface DownloadButtonProps {
  file?: DownloadableFile;
  files?: DownloadableFile[];
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DownloadButton({
  file,
  files,
  variant = "primary",
  size = "md",
  className = "",
}: DownloadButtonProps) {
  const t = useTranslations();

  const generateFileName = useCallback(
    (originalName: string, format: OutputFormat): string => {
      const formatData = FORMATS[format];
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
      return `${nameWithoutExt}${formatData.extension}`;
    },
    []
  );

  const downloadSingleFile = useCallback(
    (file: DownloadableFile) => {
      const fileName = generateFileName(file.originalName, file.outputFormat);
      const url = URL.createObjectURL(file.blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    },
    [generateFileName]
  );

  const downloadMultipleFiles = useCallback(
    async (files: DownloadableFile[]) => {
      const zip = new JSZip();

      // Add each file to the ZIP
      for (const file of files) {
        const fileName = generateFileName(file.originalName, file.outputFormat);
        zip.file(fileName, file.blob);
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);

      // Download ZIP file
      const link = document.createElement("a");
      link.href = url;
      link.download = "converted-images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    },
    [generateFileName]
  );

  const handleDownload = useCallback(async () => {
    if (file) {
      downloadSingleFile(file);
    } else if (files && files.length > 0) {
      if (files.length === 1) {
        downloadSingleFile(files[0]);
      } else {
        await downloadMultipleFiles(files);
      }
    }
  }, [file, files, downloadSingleFile, downloadMultipleFiles]);

  const getButtonText = () => {
    if (file) {
      return t("common.download");
    }
    if (files && files.length > 1) {
      return t("converter.download.downloadAll");
    }
    return t("common.download");
  };

  // Don't render if no files to download
  if (!file && (!files || files.length === 0)) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      className={className}
    >
      {getButtonText()}
    </Button>
  );
}
