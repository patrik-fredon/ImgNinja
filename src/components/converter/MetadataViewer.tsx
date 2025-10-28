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
import type { ImageMetadata } from "@/lib/converter/analysis";

interface MetadataViewerProps {
  metadata: ImageMetadata;
  className?: string;
  editable?: boolean;
  onMetadataChange?: (metadata: Partial<ImageMetadata>) => void;
}

export function MetadataViewer({
  metadata,
  className = "",
  editable = false,
  onMetadataChange,
}: MetadataViewerProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState(metadata);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Unknown";
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleSave = () => {
    onMetadataChange?.(editedMetadata);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMetadata(metadata);
    setIsEditing(false);
  };

  return (
    <GlassCard className={className}>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle>Image Metadata</GlassCardTitle>
          {editable && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Basic Properties */}
        <div className="grid grid-cols-2 gap-4">
          <MetadataField
            label="File Size"
            value={formatFileSize(metadata.fileSize)}
            copyable
          />
          <MetadataField label="Format" value={metadata.format} copyable />
          <MetadataField
            label="Color Depth"
            value={`${metadata.colorDepth}-bit`}
          />
          <MetadataField
            label="Transparency"
            value={metadata.hasTransparency ? "Yes" : "No"}
          />
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Timestamps</h4>
          <div className="grid grid-cols-1 gap-2">
            <MetadataField
              label="Created"
              value={formatDate(metadata.created)}
              copyable
            />
            <MetadataField
              label="Modified"
              value={formatDate(metadata.modified)}
              copyable
            />
          </div>
        </div>

        {/* Camera Information */}
        {metadata.camera && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Camera Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {metadata.camera.make && (
                <MetadataField
                  label="Camera Make"
                  value={metadata.camera.make}
                  copyable
                />
              )}
              {metadata.camera.model && (
                <MetadataField
                  label="Camera Model"
                  value={metadata.camera.model}
                  copyable
                />
              )}
              {metadata.camera.iso && (
                <MetadataField
                  label="ISO"
                  value={metadata.camera.iso.toString()}
                />
              )}
              {metadata.camera.aperture && (
                <MetadataField
                  label="Aperture"
                  value={`f/${metadata.camera.aperture}`}
                />
              )}
              {metadata.camera.shutterSpeed && (
                <MetadataField
                  label="Shutter Speed"
                  value={metadata.camera.shutterSpeed}
                />
              )}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2))}
            >
              Copy JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const csvData = Object.entries(metadata)
                  .filter(([, value]) => typeof value !== "object")
                  .map(([key, value]) => `${key},${value}`)
                  .join("\n");
                copyToClipboard(`Property,Value\n${csvData}`);
              }}
            >
              Copy CSV
            </Button>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

interface MetadataFieldProps {
  label: string;
  value: string;
  copyable?: boolean;
}

function MetadataField({ label, value, copyable = false }: MetadataFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyable) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}:</span>
        {copyable && (
          <Tooltip content={copied ? "Copied!" : "Click to copy"}>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {copied ? "✓" : "📋"}
            </button>
          </Tooltip>
        )}
      </div>
      <p className="font-medium text-gray-900 break-all">{value}</p>
    </div>
  );
}
