"use client";

import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { AdSlotType } from "./AdPlacement";

const AdPlacement = lazy(() =>
  import("./AdPlacement").then((module) => ({ default: module.AdPlacement }))
);

interface LazyAdPlacementProps {
  slot: AdSlotType;
  adUnitId?: string;
  className?: string;
}

const AD_SLOT_DIMENSIONS = {
  header: "w-[728px] h-[90px]",
  sidebar: "w-[300px] h-[250px]",
  footer: "w-[728px] h-[90px]",
};

export function LazyAdPlacement({ slot, adUnitId, className }: LazyAdPlacementProps) {
  const skeletonClasses = `${AD_SLOT_DIMENSIONS[slot]} ${className}`;

  return (
    <Suspense fallback={<LoadingSkeleton variant="card" className={skeletonClasses} />}>
      <AdPlacement slot={slot} adUnitId={adUnitId} className={className} />
    </Suspense>
  );
}
