"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ImageMetadata } from "@/lib/converter/analysis";

interface MetadataViewerProps {
  file: File;
  className?: string;
}

interface ExtendedMetadata extends ImageMetadata {
  exif?: {
    [key: string]: string | number | undefined;
  };
  technical?: {
    compression?: string;
    colorProfile?: string;
    orientation?: number;
    dpi?: { x: number; y: number };
  };
}

export function MetadataViewer({ file, className = "" }: MetadataViewerProps) {
  const t = useTranslations();
  const [metadata, setMetadata] = useState<ExtendedMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<Partial<ExtendedMetadata>>({});

  useEffect(() => {
    const extractMetadata = async () => {
      setIsLoading(true);

      try {
        const bitmap = await createImageBitmap(file);

        const basicMetadata: ExtendedMetadata = {
          fileSize: file.size,
          format: file.type,
          colorDepth: 24,
          hasTransparency: file.type.includes("png") || file.type.includes("webp"),
          created: new Date(file.lastModified),
          modified: new Date(file.lastModified),
          technical: {
            compression: getCompressionType(file.type),
            colorProfile: "sRGB",
            orientation: 1,
            dpi: { x: 72, y: 72 },
          },
        };

        // Try to extract EXIF data if available
        try {
          const exifData = await extractExifData(file);
          basicMetadata.exif = exifData;

          if (exifData.DateTime) {
            basicMetadata.created = new Date(exifData.DateTime as string);
          }

          if (exifData.Make && exifData.Model) {
            basicMetadata.camera = {
              make: exifData.Make as string,
              model: exifData.Model as string,
              iso: exifData.ISO as number,
              aperture: exifData.FNumber as number,
              shutterSpeed: exifData.ExposureTime as string,
            };
          }
        } catch (error) {
          console.log("EXIF extraction failed:", error);
        }

        setMetadata(basicMetadata);
        bitmap.close();
      } catch (error) {
        console.error("Metadata extraction failed:", error);
        setMetadata({
          fileSize: file.size,
          format: file.type,
          colorDepth: 24,
          hasTransparency: false,
          created: new Date(file.lastModified),
          modified: new Date(file.lastModified),
        });
      } finally {
        setIsLoading(false);
      }
    };

    extractMetadata();
  }, [file]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedMetadata({ ...metadata });
  };

  const handleSave = () => {
    if (editedMetadata && metadata) {
      setMetadata({ ...metadata, ...editedMetadata });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedMetadata({});
  };

  const handleExport = () => {
    if (!metadata) return;

    const exportData = {
      filename: file.name,
      metadata: metadata,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.split(".")[0]}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading Metadata...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-gray-600">
            <p>Unable to extract metadata</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Image Metadata</CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleEdit}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  Export
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <MetadataField
              label="File Name"
              value={file.name}
              isEditing={isEditing}
              onChange={(value) => setEditedMetadata((prev) => ({ ...prev, fileName: value }))}
            />
            <MetadataField label="File Size" value={formatFileSize(metadata.fileSize)} readOnly />
            <MetadataField label="Format" value={metadata.format} readOnly />
            <MetadataField
              label="Color Depth"
              value={`${metadata.colorDepth}-bit`}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedMetadata((prev) => ({
                  ...prev,
                  colorDepth: parseInt(value),
                }))
              }
            />
            <MetadataField
              label="Transparency"
              value={metadata.hasTransparency ? "Yes" : "No"}
              readOnly
            />
            <MetadataField
              label="Created"
              value={metadata.created?.toLocaleDateString()}
              isEditing={isEditing}
              type="date"
              onChange={(value) =>
                setEditedMetadata((prev) => ({
                  ...prev,
                  created: new Date(value),
                }))
              }
            />
          </div>
        </div>

        {/* Technical Details */}
        {metadata.technical && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Technical Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <MetadataField
                label="Compression"
                value={metadata.technical.compression || "Unknown"}
                readOnly
              />
              <MetadataField
                label="Color Profile"
                value={metadata.technical.colorProfile || "Unknown"}
                isEditing={isEditing}
                onChange={(value) =>
                  setEditedMetadata((prev) => ({
                    ...prev,
                    technical: { ...prev.technical, colorProfile: value },
                  }))
                }
              />
              <MetadataField
                label="DPI"
                value={
                  metadata.technical.dpi
                    ? `${metadata.technical.dpi.x} × ${metadata.technical.dpi.y}`
                    : "Unknown"
                }
                readOnly
              />
              <MetadataField
                label="Orientation"
                value={metadata.technical.orientation?.toString() || "1"}
                isEditing={isEditing}
                onChange={(value) =>
                  setEditedMetadata((prev) => ({
                    ...prev,
                    technical: {
                      ...prev.technical,
                      orientation: parseInt(value),
                    },
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* Camera Information */}
        {metadata.camera && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Camera Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <MetadataField
                label="Make"
                value={metadata.camera.make || "Unknown"}
                isEditing={isEditing}
                onChange={(value) =>
                  setEditedMetadata((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, make: value },
                  }))
                }
              />
              <MetadataField
                label="Model"
                value={metadata.camera.model || "Unknown"}
                isEditing={isEditing}
                onChange={(value) =>
                  setEditedMetadata((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, model: value },
                  }))
                }
              />
              <MetadataField
                label="ISO"
                value={metadata.camera.iso?.toString() || "Unknown"}
                isEditing={isEditing}
                onChange={(value) =>
                  setEditedMetadata((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, iso: parseInt(value) },
                  }))
                }
              />
              <MetadataField
                label="Aperture"
                value={metadata.camera.aperture ? `f/${metadata.camera.aperture}` : "Unknown"}
                isEditing={isEditing}
                onChange={(value) =>
                  setEditedMetadata((prev) => ({
                    ...prev,
                    camera: {
                      ...prev.camera,
                      aperture: parseFloat(value.replace("f/", "")),
                    },
                  }))
                }
              />
              <MetadataField
                label="Shutter Speed"
                value={metadata.camera.shutterSpeed || "Unknown"}
                isEditing={isEditing}
                onChange={(value) =>
                  setEditedMetadata((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, shutterSpeed: value },
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* EXIF Data */}
        {metadata.exif && Object.keys(metadata.exif).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">EXIF Data</h4>
            <div className="max-h-48 overflow-y-auto">
              <div className="space-y-2 text-sm">
                {Object.entries(metadata.exif).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">{key}:</span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetadataFieldProps {
  label: string;
  value?: string;
  isEditing?: boolean;
  readOnly?: boolean;
  type?: "text" | "date" | "number";
  onChange?: (value: string) => void;
}

function MetadataField({
  label,
  value = "",
  isEditing = false,
  readOnly = false,
  type = "text",
  onChange,
}: MetadataFieldProps) {
  return (
    <div>
      <span className="text-gray-600">{label}:</span>
      {isEditing && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="block w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      ) : (
        <p className="font-medium">{value || "Unknown"}</p>
      )}
    </div>
  );
}

// Utility functions
function getCompressionType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "JPEG";
    case "image/png":
      return "PNG (Lossless)";
    case "image/webp":
      return "WebP";
    case "image/avif":
      return "AVIF";
    case "image/gif":
      return "GIF (LZW)";
    default:
      return "Unknown";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function extractExifData(file: File): Promise<{ [key: string]: string | number }> {
  // This is a simplified EXIF extraction
  // In a real implementation, you'd use a library like exif-js or piexifjs
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Simplified EXIF parsing - in reality this would be much more complex
      resolve({
        "File Name": file.name,
        "File Size": file.size,
        "MIME Type": file.type,
        "Last Modified": new Date(file.lastModified).toISOString(),
      });
    };
    reader.readAsArrayBuffer(file);
  });
}
