/**
 * Performance optimization utilities for reducing main thread blocking
 */

/**
 * Break up long-running tasks using scheduler.postTask or setTimeout
 */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if ("scheduler" in window && "postTask" in (window.scheduler as any)) {
      // Use scheduler.postTask if available (Chrome 94+)
      (window.scheduler as any).postTask(resolve, { priority: "user-blocking" });
    } else {
      // Fallback to setTimeout
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Process array items in chunks to avoid blocking the main thread
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R | Promise<R>,
  chunkSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    // Process chunk
    const chunkResults = await Promise.all(chunk.map((item, index) => processor(item, i + index)));

    results.push(...chunkResults);

    // Yield to main thread after each chunk
    if (i + chunkSize < items.length) {
      await yieldToMain();
    }
  }

  return results;
}

/**
 * Debounce function calls to reduce excessive processing
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function calls to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure and log performance of a function
 */
export function measurePerformance<T extends (...args: any[]) => any>(name: string, func: T): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);

    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
      });
    } else {
      const end = performance.now();
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
  }) as T;
}

/**
 * Create a performance-optimized event listener
 */
export function createOptimizedEventListener<K extends keyof WindowEventMap>(
  element: Window | Document | Element,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: {
    passive?: boolean;
    throttle?: number;
    debounce?: number;
  }
) {
  let optimizedListener = listener;

  if (options?.throttle) {
    optimizedListener = throttle(listener, options.throttle);
  } else if (options?.debounce) {
    optimizedListener = debounce(listener, options.debounce);
  }

  const eventOptions: AddEventListenerOptions = {
    passive: options?.passive ?? true,
  };

  element.addEventListener(type as string, optimizedListener as EventListener, eventOptions);

  return () => {
    element.removeEventListener(type as string, optimizedListener as EventListener);
  };
}

/**
 * Intersection Observer with performance optimizations
 */
export function createOptimizedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit & {
    throttle?: number;
  }
): IntersectionObserver {
  let optimizedCallback = callback;

  if (options?.throttle) {
    optimizedCallback = throttle(callback, options.throttle);
  }

  return new IntersectionObserver(optimizedCallback, {
    rootMargin: options?.rootMargin ?? "50px",
    threshold: options?.threshold ?? 0.1,
  });
}

/**
 * Preload critical resources with priority hints
 */
export function preloadCriticalResource(
  href: string,
  as: "script" | "style" | "font" | "image",
  options?: {
    crossOrigin?: "anonymous" | "use-credentials";
    fetchPriority?: "high" | "low" | "auto";
  }
): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;

  if (options?.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  if (options?.fetchPriority && "fetchPriority" in link) {
    (link as any).fetchPriority = options.fetchPriority;
  }

  document.head.appendChild(link);
}

/**
 * Optimize images for better LCP
 */
export function optimizeImageLoading(img: HTMLImageElement): void {
  // Add loading="eager" for above-the-fold images
  if (img.getBoundingClientRect().top < window.innerHeight) {
    img.loading = "eager";
    img.fetchPriority = "high";
  } else {
    img.loading = "lazy";
  }

  // Add decode="async" for better performance
  img.decoding = "async";
}
