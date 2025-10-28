/**
 * SEO utilities for structured data and rich snippets
 */

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface BreadcrumbItem {
  name: string;
  item: string;
  position: number;
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate HowTo structured data
 */
export function generateHowToStructuredData(
  name: string,
  description: string,
  steps: HowToStep[],
  totalTime?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    totalTime,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}

/**
 * Generate Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: item.item,
    })),
  };
}

/**
 * Generate WebApplication structured data
 */
export function generateWebApplicationStructuredData(
  name: string,
  description: string,
  url: string,
  features: string[],
  screenshots?: string[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires JavaScript. Modern browser with Canvas API support.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: features,
    screenshot: screenshots,
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: "ImgNinja",
      url,
    },
  };
}

/**
 * Generate Article structured data
 */
export function generateArticleStructuredData(
  headline: string,
  description: string,
  url: string,
  datePublished: string,
  dateModified: string,
  authorName: string = "ImgNinja",
  image?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "ImgNinja",
      logo: {
        "@type": "ImageObject",
        url: `${url}/logo.png`,
      },
    },
    image,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ImgNinja",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Free online image converter that processes images locally in your browser",
    foundingDate: "2024",
    sameAs: ["https://twitter.com/imgninja", "https://github.com/imgninja"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Czech"],
    },
  };
}

/**
 * Generate LocalBusiness structured data (if applicable)
 */
export function generateLocalBusinessStructuredData(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "ImgNinja",
    url: baseUrl,
    description: "Free online image converter service",
    priceRange: "Free",
    paymentAccepted: "Not applicable - Free service",
    currenciesAccepted: "Not applicable - Free service",
  };
}

/**
 * Generate SoftwareApplication structured data
 */
export function generateSoftwareApplicationStructuredData(
  name: string,
  description: string,
  url: string,
  features: string[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    permissions: "No special permissions required",
    storageRequirements: "Temporary browser storage only",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: features,
    softwareVersion: "1.0",
    releaseNotes: "Initial release with core image conversion features",
    author: {
      "@type": "Organization",
      name: "ImgNinja",
    },
  };
}

/**
 * Generate meta tags for social sharing
 */
export function generateSocialMetaTags(
  title: string,
  description: string,
  url: string,
  image: string,
  locale: string = "en_US"
) {
  return {
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale,
      siteName: "ImgNinja",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@imgninja",
      site: "@imgninja",
    },
  };
}

/**
 * Generate canonical URLs with locale support
 */
export function generateCanonicalUrls(baseUrl: string, path: string, currentLocale: string) {
  return {
    canonical: `${baseUrl}/${currentLocale}${path}`,
    languages: {
      cs: `${baseUrl}/cs${path}`,
      en: `${baseUrl}/en${path}`,
    },
  };
}

/**
 * Generate robots meta configuration
 */
export function generateRobotsConfig(index: boolean = true, follow: boolean = true) {
  return {
    index,
    follow,
    googleBot: {
      index,
      follow,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}
