import { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import {
  FORMATS,
  getSupportedFormats,
  isValidFormat,
  getFormatMetadata,
} from "@/lib/converter/formats";
import type { OutputFormat } from "@/types/formats";

interface FormatPageProps {
  params: {
    locale: string;
    format: string;
  };
}

export async function generateStaticParams() {
  const formats = getSupportedFormats();
  const locales = ["en", "cs"];

  return locales.flatMap((locale) =>
    formats.map((format) => ({
      locale,
      format,
    }))
  );
}

export async function generateMetadata({ params }: FormatPageProps): Promise<Metadata> {
  const { format, locale } = params;

  if (!isValidFormat(format)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "formats" });
  const formatData = getFormatMetadata(format);
  const baseUrl = process.env["NEXT_PUBLIC_SITE_URL"] || "https://imgninja.com";
  const currentUrl = `${baseUrl}/${locale}/formats/${format}`;

  return {
    title: `${formatData.name} Format Converter - Free Online Tool | ImgNinja`,
    description: `Convert images to ${formatData.name} format online. ${t(
      `${format}.description`
    )} Free, fast, and secure image conversion.`,
    keywords: [
      `${format} converter`,
      `convert to ${format}`,
      `${formatData.name} format`,
      "image converter",
      "online converter",
      "free converter",
      `${format} optimization`,
      `${format} compression`,
    ],
    authors: [{ name: "ImgNinja" }],
    creator: "ImgNinja",
    publisher: "ImgNinja",
    alternates: {
      canonical: currentUrl,
      languages: {
        cs: `${baseUrl}/cs/formats/${format}`,
        en: `${baseUrl}/en/formats/${format}`,
      },
    },
    openGraph: {
      title: `${formatData.name} Format Converter - Free Online Tool`,
      description: `Convert images to ${formatData.name} format online. ${t(
        `${format}.description`
      )}`,
      type: "website",
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      alternateLocale: locale === "cs" ? ["en_US"] : ["cs_CZ"],
      url: currentUrl,
      siteName: "ImgNinja",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${formatData.name} Format Converter`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${formatData.name} Format Converter - Free Online Tool`,
      description: `Convert images to ${formatData.name} format online. Free, fast, and secure.`,
      images: [`${baseUrl}/og-image.png`],
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
    category: "technology",
  };
}

export default function FormatPage({ params }: FormatPageProps) {
  const { format, locale } = params;

  if (!isValidFormat(format)) {
    notFound();
  }

  const t = useTranslations("formats");
  const tPage = useTranslations("formats.page");
  const formatData = getFormatMetadata(format);
  const baseUrl = process.env["NEXT_PUBLIC_SITE_URL"] || "https://imgninja.com";

  // Structured data for the format page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${formatData.name} Format Converter`,
    description: `Convert images to ${formatData.name} format online. Free, fast, and secure image conversion.`,
    url: `${baseUrl}/${locale}/formats/${format}`,
    mainEntity: {
      "@type": "SoftwareApplication",
      name: `${formatData.name} Image Converter`,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web Browser",
      description: `Free online tool to convert images to ${formatData.name} format`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        `Convert images to ${formatData.name}`,
        "Client-side processing for privacy",
        "No file uploads required",
        "Batch conversion support",
        "Quality control settings",
      ],
      softwareVersion: "1.0",
      author: {
        "@type": "Organization",
        name: "ImgNinja",
        url: baseUrl,
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${baseUrl}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Formats",
          item: `${baseUrl}/${locale}/formats`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: formatData.name,
          item: `${baseUrl}/${locale}/formats/${format}`,
        },
      ],
    },
    about: {
      "@type": "Thing",
      name: `${formatData.name} Image Format`,
      description: t(`${format}.description`),
      sameAs: [
        `https://en.wikipedia.org/wiki/${formatData.name}`,
        `https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#${format}`,
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{formatData.name}</h1>
          <p className="text-xl text-gray-600 mb-6">{t(`${format}.description`)}</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">{tPage("details")}</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="font-medium text-gray-700">{tPage("mimeType")}:</dt>
                  <dd className="text-gray-600">{formatData.mimeType}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">{tPage("fileExtension")}:</dt>
                  <dd className="text-gray-600">{formatData.extension}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">{tPage("qualityControl")}:</dt>
                  <dd className="text-gray-600">
                    {formatData.supportsQuality ? tPage("supported") : tPage("notSupported")}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">{tPage("transparency")}:</dt>
                  <dd className="text-gray-600">
                    {formatData.supportsTransparency ? tPage("supported") : tPage("notSupported")}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">{tPage("recommended")}:</dt>
                  <dd className="text-gray-600">
                    {formatData.recommended ? (
                      <span className="text-green-600 font-medium">{tPage("yes")}</span>
                    ) : (
                      <span className="text-gray-500">{tPage("no")}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">{tPage("useCase")}</h2>
              <p className="text-gray-700 mb-4">{t(`${format}.useCase`)}</p>

              <h3 className="text-lg font-medium mb-2">{tPage("bestFor")}</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {getUseCases(format).map((useCase, index) => (
                  <li key={index}>{useCase}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">{tPage("browserCompatibility")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">{tPage("browser")}</th>
                    <th className="text-left py-3 px-4 font-medium">{tPage("support")}</th>
                    <th className="text-left py-3 px-4 font-medium">{tPage("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 flex items-center">
                      <span className="mr-2">🌐</span>
                      Chrome
                    </td>
                    <td className="py-3 px-4">{formatData.browserSupport.chrome}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tPage("supported")}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 flex items-center">
                      <span className="mr-2">🦊</span>
                      Firefox
                    </td>
                    <td className="py-3 px-4">{formatData.browserSupport.firefox}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tPage("supported")}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 flex items-center">
                      <span className="mr-2">🧭</span>
                      Safari
                    </td>
                    <td className="py-3 px-4">{formatData.browserSupport.safari}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tPage("supported")}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 flex items-center">
                      <span className="mr-2">🌊</span>
                      Edge
                    </td>
                    <td className="py-3 px-4">{formatData.browserSupport.edge}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tPage("supported")}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">{tPage("conversionExamples")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">
                  {tPage("convertTo", { format: formatData.name })}
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  {getConversionRecommendations(format, "to").map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">
                  {tPage("convertFrom", { format: formatData.name })}
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  {getConversionRecommendations(format, "from").map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{tPage("technicalSpecs")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">{tPage("compression")}</h3>
                <p className="text-gray-700 mb-2">{getCompressionInfo(format)}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">{tPage("fileSize")}</h3>
                <p className="text-gray-700 mb-2">{getFileSizeInfo(format)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getUseCases(format: OutputFormat): string[] {
  switch (format) {
    case "webp":
      return [
        "Web images with transparency",
        "Modern websites and applications",
        "Images requiring good compression with quality",
        "Progressive web apps",
      ];
    case "avif":
      return [
        "Next-generation web applications",
        "High-quality images with minimal file size",
        "Modern browsers with cutting-edge support",
        "Performance-critical applications",
      ];
    case "png":
      return [
        "Graphics and logos",
        "Images with transparency",
        "Screenshots and UI elements",
        "Images requiring lossless compression",
      ];
    case "jpeg":
      return [
        "Photographs and complex images",
        "Images without transparency",
        "Legacy system compatibility",
        "Email attachments and sharing",
      ];
    case "gif":
      return [
        "Simple animations",
        "Low-color graphics",
        "Legacy web content",
        "Memes and social media",
      ];
    default:
      return [];
  }
}

function getConversionRecommendations(format: OutputFormat, direction: "to" | "from"): string[] {
  if (direction === "to") {
    switch (format) {
      case "webp":
        return [
          "Converting JPEG/PNG for web use",
          "Reducing file size while maintaining quality",
          "Supporting transparency in web images",
          "Modernizing legacy image formats",
        ];
      case "avif":
        return [
          "Maximum compression for modern browsers",
          "Converting high-resolution images",
          "Performance optimization projects",
          "Next-gen web development",
        ];
      case "png":
        return [
          "Converting images that need transparency",
          "Converting graphics and logos",
          "When lossless quality is required",
          "For editing and further processing",
        ];
      case "jpeg":
        return [
          "Converting for universal compatibility",
          "Reducing file size for photos",
          "Email and social media sharing",
          "Legacy system requirements",
        ];
      case "gif":
        return [
          "Creating simple animations",
          "Converting for retro compatibility",
          "Social media memes",
          "Low-bandwidth situations",
        ];
      default:
        return [];
    }
  } else {
    switch (format) {
      case "webp":
        return [
          "To JPEG for broader compatibility",
          "To PNG when transparency is critical",
          "To AVIF for better compression",
          "To legacy formats for older systems",
        ];
      case "avif":
        return [
          "To WebP for wider browser support",
          "To JPEG for universal compatibility",
          "To PNG for transparency preservation",
          "To legacy formats when needed",
        ];
      case "png":
        return [
          "To WebP for better web performance",
          "To JPEG for smaller file sizes",
          "To AVIF for maximum compression",
          "When transparency is not needed",
        ];
      case "jpeg":
        return [
          "To WebP for better compression",
          "To PNG when transparency is needed",
          "To AVIF for next-gen compression",
          "For web optimization",
        ];
      case "gif":
        return [
          "To WebP for better quality",
          "To PNG for static images",
          "To modern formats for web use",
          "When animation is not needed",
        ];
      default:
        return [];
    }
  }
}

function getCompressionInfo(format: OutputFormat): string {
  switch (format) {
    case "webp":
      return "WebP uses both lossy and lossless compression, typically achieving 25-35% better compression than JPEG while maintaining similar quality.";
    case "avif":
      return "AVIF provides superior compression efficiency, often 50% better than JPEG and 20% better than WebP, using modern AV1 codec technology.";
    case "png":
      return "PNG uses lossless compression with LZ77 algorithm, preserving all image data but resulting in larger file sizes for complex images.";
    case "jpeg":
      return "JPEG uses lossy DCT-based compression, excellent for photographs but not suitable for images with sharp edges or transparency.";
    case "gif":
      return "GIF uses LZW lossless compression limited to 256 colors, suitable for simple graphics but inefficient for complex images.";
    default:
      return "";
  }
}

function getFileSizeInfo(format: OutputFormat): string {
  switch (format) {
    case "webp":
      return "Generally 25-35% smaller than equivalent JPEG files and significantly smaller than PNG for photographic content.";
    case "avif":
      return "Typically 50% smaller than JPEG and 20% smaller than WebP, offering the best compression ratios available.";
    case "png":
      return "Larger file sizes due to lossless compression, but efficient for images with few colors or transparency.";
    case "jpeg":
      return "Good balance between file size and quality for photographs, with adjustable compression levels.";
    case "gif":
      return "Small for simple graphics with few colors, but inefficient for complex images or photographs.";
    default:
      return "";
  }
}
