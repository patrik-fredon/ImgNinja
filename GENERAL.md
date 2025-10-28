# ImgNinja - Technical Documentation

## Project Overview

ImgNinja is a client-side image conversion web application built with Next.js 15, providing privacy-focused image format conversion entirely within the user's browser.

## Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS 4
- **Internationalization**: next-intl (Czech/English)
- **Processing**: Canvas API, Web Workers, OffscreenCanvas

### Core Components

#### Image Conversion Engine (`src/lib/converter/`)

- `engine.ts`: Main conversion orchestrator using Canvas API
- `worker.ts`: Web Worker for heavy processing with OffscreenCanvas
- `formats.ts`: Format definitions and metadata
- `validation.ts`: File validation utilities

#### UI Components (`src/components/`)

- **Converter Components**: FileUpload, FormatSelector, QualityControl, ConversionQueue, DownloadButton
- **Layout Components**: Header, Footer, AdPlacement
- **UI Components**: Button, Card, Progress

#### Format Information System

- **Dynamic Routes**: `/[locale]/formats/[format]` with SSG
- **Static Generation**: 10 pages (5 formats × 2 locales)
- **Comprehensive Content**: Format details, browser compatibility, conversion recommendations, technical specifications

### Internationalization

- **Locales**: Czech (default), English
- **Routing**: URL-based with `localePrefix: "always"`
- **Translation Files**: `messages/cs.json`, `messages/en.json`
- **Coverage**: Complete UI translation including format information pages

### Performance Features

- **Static Site Generation**: Format pages pre-rendered at build time
- **Web Workers**: Non-blocking image processing
- **Code Splitting**: Dynamic imports for conversion engine
- **Responsive Design**: Mobile-first approach (320px minimum)

### Privacy & Security

- **Client-Side Processing**: No server uploads
- **Local Storage**: Temporary processing only
- **Content Security Policy**: Strict headers
- **Ad Integration**: Privacy-respecting Google Ads

## Build Configuration

- **Output**: Standalone mode for deployment
- **Path Aliases**: `@/components`, `@/lib`, `@/types`
- **TypeScript**: Strict mode with comprehensive type coverage

## Recent Technical Changes

### Task 19: Privacy Policy Page (Latest)

- Implemented comprehensive privacy policy page with SSG
- Added detailed client-side processing guarantees
- Created transparent data handling explanations
- Enhanced privacy translations for both Czech and English
- Covered all privacy requirements (9.1-9.4) with no server upload statements

### Task 18: Format Information Pages

- Implemented comprehensive format information pages with SSG
- Added detailed browser compatibility tables
- Created conversion recommendation system
- Enhanced internationalization with format-specific translations
- Achieved successful build with all 13 static pages generated

---
*Technical documentation maintained by FredonBytes development team*
