/**
 * Resource preloading utilities for Core Web Vitals optimization
 */

interface PreloadOptions {
  as: "script" | "style" | "font" | "image" | "fetch";
  crossOrigin?: "anonymous" | "use-credentials";
  type?: string;
  media?: string;
}

class ResourcePreloader {
  private preloadedResources = new Set<string>();

  /**
   * Preload a resource with specified options
   */
  preload(href: string, options: PreloadOptions): void {
    if (typeof window === "undefined" || this.preloadedResources.has(href)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = options.as;

    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    if (options.type) {
      link.type = options.type;
    }

    if (options.media) {
      link.media = options.media;
    }

    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  /**
   * Preload critical fonts
   */
  preloadFonts(): void {
    const fonts = [
      {
        href: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
        type: "font/woff2",
      },
    ];

    fonts.forEach((font) => {
      this.preload(font.href, {
        as: "font",
        type: font.type,
        crossOrigin: "anonymous",
      });
    });
  }

  /**
   * Preload critical images
   */
  preloadImages(): void {
    const images = ["/og-image.png", "/favicon-32x32.png", "/apple-touch-icon.png"];

    images.forEach((src) => {
      this.preload(src, { as: "image" });
    });
  }

  /**
   * Preload critical scripts
   */
  preloadScripts(): void {
    const scripts = ["/_next/static/chunks/webpack.js", "/_next/static/chunks/main.js"];

    scripts.forEach((src) => {
      this.preload(src, { as: "script" });
    });
  }

  /**
   * DNS prefetch for external domains
   */
  dnsPrefetch(): void {
    const domains = [
      "//fonts.googleapis.com",
      "//fonts.gstatic.com",
      "//pagead2.googlesyndication.com",
      "//www.googletagservices.com",
      "//www.google-analytics.com",
    ];

    domains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  /**
   * Preconnect to critical origins
   */
  preconnect(): void {
    const origins = [
      {
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous" as const,
      },
      {
        href: "https://pagead2.googlesyndication.com",
        crossOrigin: "anonymous" as const,
      },
    ];

    origins.forEach((origin) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin.href;
      if (origin.crossOrigin) {
        link.crossOrigin = origin.crossOrigin;
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Initialize all preloading strategies
   */
  init(): void {
    if (typeof window === "undefined") return;

    // Run immediately for critical resources
    this.dnsPrefetch();
    this.preconnect();
    this.preloadFonts();
    this.preloadImages();

    // Defer non-critical preloading
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        this.preloadScripts();
      });
    } else {
      setTimeout(() => {
        this.preloadScripts();
      }, 100);
    }
  }
}

export const preloader = new ResourcePreloader();

/**
 * Hook for component-level preloading
 */
export const usePreloader = () => {
  return {
    preloadImage: (src: string) => preloader.preload(src, { as: "image" }),
    preloadScript: (src: string) => preloader.preload(src, { as: "script" }),
    preloadStyle: (href: string) => preloader.preload(href, { as: "style" }),
  };
};
