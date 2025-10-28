import { MetadataRoute } from 'next'
import { getSupportedFormats } from '@/lib/converter/formats'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://imgninja.com'
  const locales = ['en', 'cs']
  const formats = getSupportedFormats()

  const routes: MetadataRoute.Sitemap = []

  // Add homepage for each locale
  locales.forEach(locale => {
    routes.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          en: `${baseUrl}/en`,
          cs: `${baseUrl}/cs`,
        },
      },
    })
  })

  // Add privacy pages for each locale
  locales.forEach(locale => {
    routes.push({
      url: `${baseUrl}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: {
        languages: {
          en: `${baseUrl}/en/privacy`,
          cs: `${baseUrl}/cs/privacy`,
        },
      },
    })
  })

  // Add format pages for each locale and format
  locales.forEach(locale => {
    formats.forEach(format => {
      routes.push({
        url: `${baseUrl}/${locale}/formats/${format}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: {
          languages: {
            en: `${baseUrl}/en/formats/${format}`,
            cs: `${baseUrl}/cs/formats/${format}`,
          },
        },
      })
    })
  })

  return routes
}