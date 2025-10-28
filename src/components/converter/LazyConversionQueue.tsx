"use client";

import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { withLazyLoading } from "@/lib/utils/lazy-wrapper";
import type { ConversionItem } from "./ConversionQueue";

interface LazyConversionQueueProps {
  items: ConversionItem[];
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
}

function ConversionQueueSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton variant="text" lines={1} className="w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <LoadingSkeleton variant="text" lines={1} className="w-48" />
            <LoadingSkeleton variant="button" className="w-8 h-8" />
          </div>
          <LoadingSkeleton variant="progress" />
          <div className="flex justify-between items-center">
            <LoadingSkeleton variant="text" lines={1} className="w-24" />
            <LoadingSkeleton variant="button" className="w-20" />
          </div>
        </div>
      ))}
      <LoadingSkeleton variant="button" className="w-full h-10" />
    </div>
  );
}

export const LazyConversionQueue = withLazyLoading<LazyConversionQueueProps>(
  () => import("./ConversionQueue"),
  ConversionQueueSkeleton,
  "ConversionQueue"
);
