"use client";

import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { withLazyLoading } from "@/lib/utils/lazy-wrapper";
import type { OutputFormat } from "@/types/formats";

interface LazyQualityControlProps {
  quality: number;
  onQualityChange: (quality: number) => void;
  format: OutputFormat;
  estimatedSize?: number;
}

function QualityControlSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton variant="text" lines={1} className="w-32" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <LoadingSkeleton variant="text" lines={1} className="w-16" />
          <LoadingSkeleton variant="text" lines={1} className="w-12" />
        </div>
        <LoadingSkeleton variant="button" className="w-full h-2 rounded-full" />
      </div>
      <div className="flex justify-between text-sm">
        <LoadingSkeleton variant="text" lines={1} className="w-24" />
        <LoadingSkeleton variant="text" lines={1} className="w-20" />
      </div>
    </div>
  );
}

export const LazyQualityControl = withLazyLoading<LazyQualityControlProps>(
  () => import("./QualityControl"),
  QualityControlSkeleton,
  "QualityControl"
);
