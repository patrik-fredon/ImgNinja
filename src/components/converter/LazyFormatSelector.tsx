"use client";

import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { OutputFormat } from "@/types/formats";

const FormatSelector = lazy(() =>
  import("./FormatSelector").then((module) => ({
    default: module.FormatSelector,
  }))
);

interface LazyFormatSelectorProps {
  selectedFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
}

function FormatSelectorSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton variant="text" lines={1} className="w-40" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <LoadingSkeleton variant="text" lines={1} className="w-16" />
            <LoadingSkeleton variant="text" lines={2} className="w-full" />
            <div className="flex items-center space-x-2">
              <LoadingSkeleton
                variant="button"
                className="w-4 h-4 rounded-full"
              />
              <LoadingSkeleton variant="text" lines={1} className="w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LazyFormatSelector(props: LazyFormatSelectorProps) {
  return (
    <Suspense fallback={<FormatSelectorSkeleton />}>
      <FormatSelector {...props} />
    </Suspense>
  );
}
