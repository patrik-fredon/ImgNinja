"use client";

import { lazy, Suspense, ComponentType } from "react";

interface LazyWrapperOptions<T> {
  importFn: () => Promise<{ [key: string]: ComponentType<T> }>;
  componentName?: string;
  fallback?: React.ReactNode;
}

/**
 * Generic lazy wrapper utility to reduce code duplication
 * @param options Configuration for lazy loading
 * @returns Lazy-loaded component with suspense boundary
 */
export function createLazyWrapper<T extends Record<string, any> = any>({
  importFn,
  componentName = "default",
  fallback = null,
}: LazyWrapperOptions<T>) {
  const LazyComponent = lazy(() =>
    importFn().then((module) => ({
      default: module[componentName] || module.default,
    }))
  );

  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

/**
 * Higher-order component for creating lazy components with custom skeletons
 */
export function withLazyLoading<T extends Record<string, any>>(
  importFn: () => Promise<{ [key: string]: ComponentType<T> }>,
  SkeletonComponent: ComponentType,
  componentName?: string
) {
  return createLazyWrapper<T>({
    importFn,
    componentName,
    fallback: <SkeletonComponent />,
  });
}
