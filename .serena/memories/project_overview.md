# ImgNinja Project Overview

## Project Purpose
ImgNinja is a free online image converter that processes images locally in the browser. It converts between WebP, AVIF, PNG, JPEG, and GIF formats with complete privacy - no uploads to servers required.

## Key Features
- Client-side image processing using Canvas API and Web Workers
- Support for multiple formats: WebP, AVIF, PNG, JPEG, GIF
- Batch conversion with queue management
- Quality control and size estimation
- Drag & drop file upload
- Multi-language support (Czech/English)
- Privacy-focused (no server uploads)
- Google Ads integration for monetization
- SEO optimized with structured data

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Languages**: TypeScript, Czech (default) + English via next-intl
- **Styling**: Tailwind CSS 4
- **Routing**: Internationalized routing under `src/app/[locale]/`
- **State Management**: React useReducer for conversion state
- **Image Processing**: Canvas API, Web Workers, JSZip for batch downloads
- **Linting/Formatting**: Biome
- **Deployment**: Optimized for static/SSR deployment

## Architecture
- **Client-side processing**: All image conversion happens in browser
- **Lazy loading**: Components and libraries loaded on demand
- **Error handling**: Comprehensive error system with recovery options
- **Performance**: Web Workers for background processing
- **SEO**: Structured data, meta tags, sitemap generation
- **Monetization**: Google Ads integration with CSP headers