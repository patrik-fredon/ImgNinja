# ImgNinja - Image Converter Project Overview

## Purpose
Free online image converter web application built with Next.js 15. Enables users to convert images between various formats (WebP, AVIF, PNG, JPEG, GIF) with emphasis on web-optimized outputs. All processing happens client-side in the browser for privacy.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Internationalization**: next-intl (Czech + English)
- **Runtime**: React 19
- **Build Tool**: Turbopack (Next.js 15 default)
- **Image Processing**: Browser Canvas API, OffscreenCanvas for Web Workers

## Project Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/           # Utilities and core logic
└── types/         # TypeScript type definitions
```

## Key Features
- Client-side image conversion (no server uploads)
- Multi-format support (WebP, AVIF, PNG, JPEG, GIF)
- Batch processing (up to 10 files)
- Quality adjustment for lossy formats
- Bilingual (Czech/English) with locale-prefixed routing
- SEO optimized with SSG/ISR
- Google Ads integration ready
- Privacy-focused (all processing in browser)
