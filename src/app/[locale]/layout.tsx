import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "../globals.css";

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: RootLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://imgninja.com";
  const currentUrl = `${baseUrl}/${locale}`;

  return {
    title: {
      template: `%s | ${t("siteName")}`,
      default: t("title"),
    },
    description: t("description"),
    keywords: t("keywords")
      .split(",")
      .map((k) => k.trim()),
    authors: [{ name: t("siteName") }],
    creator: t("siteName"),
    publisher: t("siteName"),
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        cs: `${baseUrl}/cs`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      alternateLocale: locale === "cs" ? ["en_US"] : ["cs_CZ"],
      title: t("title"),
      description: t("description"),
      siteName: t("siteName"),
      url: currentUrl,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.png"],
      creator: "@imgninja",
      site: "@imgninja",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    category: "technology",
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" },
      ],
    },
    manifest: "/site.webmanifest",
  };
}

// Fallback static metadata for build time
export const metadata: Metadata = {
  title: {
    template: "%s | ImgNinja - Free Image Converter",
    default: "ImgNinja - Free Online Image Converter",
  },
  description:
    "Convert images to WebP, AVIF, PNG, JPEG formats instantly. Fast, free, and completely private - all processing happens in your browser. No uploads, no registration required.",
  keywords: [
    "image converter",
    "webp converter",
    "avif converter",
    "png converter",
    "jpeg converter",
    "online image tool",
    "free image converter",
    "browser image processing",
    "client-side image conversion",
    "private image converter",
    "no upload image converter",
    "web image optimization",
    "image format converter",
    "ImgNinja",
  ],
  authors: [{ name: "ImgNinja" }],
  creator: "ImgNinja",
  publisher: "ImgNinja",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://imgninja.com"
  ),
  alternates: {
    canonical: "/",
    languages: {
      cs: "/cs",
      en: "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["cs_CZ"],
    title: "ImgNinja - Free Online Image Converter",
    description:
      "Convert images to WebP, AVIF, PNG, JPEG formats instantly. Fast, free, and completely private - all processing happens in your browser.",
    siteName: "ImgNinja",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ImgNinja - Free Online Image Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ImgNinja - Free Online Image Converter",
    description:
      "Convert images to WebP, AVIF, PNG, JPEG formats instantly. Fast, free, and completely private - all processing happens in your browser.",
    images: ["/og-image.png"],
    creator: "@imgninja",
    site: "@imgninja",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  category: "technology",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://imgninja.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ImgNinja",
    alternateName: [
      "Image Converter",
      "Free Image Converter",
      "Online Image Converter",
    ],
    description:
      "Free online image converter that processes images locally in your browser. Convert between WebP, AVIF, PNG, JPEG formats with complete privacy.",
    url: baseUrl,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    browserRequirements:
      "Requires JavaScript. Modern browser with Canvas API support.",
    softwareVersion: "1.0",
    dateCreated: "2024-10-01",
    dateModified: new Date().toISOString().split("T")[0],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2024-10-01",
    },
    featureList: [
      "Convert images to WebP format",
      "Convert images to AVIF format",
      "Convert images to PNG format",
      "Convert images to JPEG format",
      "Client-side processing for privacy",
      "No file uploads required",
      "Batch conversion support",
      "Quality control settings",
      "Browser compatibility detection",
      "Drag and drop file upload",
      "Real-time size estimation",
      "Multiple language support",
    ],
    screenshot: `${baseUrl}/screenshot.png`,
    image: `${baseUrl}/og-image.png`,
    author: {
      "@type": "Organization",
      name: "ImgNinja",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "ImgNinja",
      url: baseUrl,
    },
    creator: {
      "@type": "Organization",
      name: "ImgNinja",
    },
    inLanguage: ["en", "cs"],
    availableLanguage: [
      {
        "@type": "Language",
        name: "English",
        alternateName: "en",
      },
      {
        "@type": "Language",
        name: "Czech",
        alternateName: "cs",
      },
    ],
    isAccessibleForFree: true,
    usageInfo: `${baseUrl}/${locale}/privacy`,
    privacyPolicy: `${baseUrl}/${locale}/privacy`,
    termsOfService: `${baseUrl}/${locale}/privacy`,
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "ImgNinja Image Converter",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web Browser",
      permissions: "No special permissions required",
      storageRequirements: "Temporary browser storage only",
    },
    potentialAction: {
      "@type": "UseAction",
      name: "Convert Images",
      description: "Convert images between different formats",
      target: {
        "@type": "EntryPoint",
        urlTemplate: baseUrl,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
          "https://schema.org/IOSPlatform",
          "https://schema.org/AndroidPlatform",
        ],
      },
    },
  };

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
