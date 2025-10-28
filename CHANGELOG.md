# Changelog

## 2025-01-XX - Project Initialization & i18n Configuration

### Added

- Next.js 16.0.0 with App Router and TypeScript
- Tailwind CSS 4.0.0 configuration
- next-intl 4.4.0 for Czech/English localization
- Locale-prefixed routing (/cs/, /en/)
- Path aliases in tsconfig.json
- Basic project structure (app, components, lib, types)
- Comprehensive translations for converter UI, formats, layout, errors, privacy

### Configured

- i18n.ts with getRequestConfig and dynamic message loading
- middleware.ts with createMiddleware (locales: cs/en, default: cs, localePrefix: always)
- Root layout with NextIntlClientProvider and SEO metadata
- Translation files with complete UI strings for converter interface

## 2025-01-XX - Format Definitions and Metadata

### Added

- src/types/formats.ts: OutputFormat type and FormatMetadata interface
- src/lib/converter/formats.ts: FORMATS constant with complete metadata for WebP, AVIF, PNG, JPEG, GIF
- Format validation utilities: isValidFormat(), getSupportedFormats(), getFormatMetadata()
- Browser compatibility data for all supported formats

## 2025-01-XX - Browser Feature Detection

### Added

- src/lib/utils/browser-support.ts: Browser feature detection utilities
- detectFormatSupport(): Canvas API-based format support detection for WebP, AVIF, PNG, JPEG, GIF
- supportsWebWorker(): Web Worker availability check
- supportsOffscreenCanvas(): OffscreenCanvas availability check
- SSR-safe implementation with graceful fallbacks

## 2025-01-XX - Core Image Conversion Engine

### Added

- src/lib/converter/engine.ts: ImageConverter class with complete conversion functionality
- convert(): Main conversion method using Canvas API, ImageBitmap, and toBlob()
- estimateSize(): Heuristic-based size prediction without actual conversion
- getSupportedFormats(): Returns supported output formats
- canConvert(): Validates source to target format conversion
- ConversionOptions and ConversionResult interfaces
- Automatic dimension calculation with aspect ratio preservation
- Performance tracking and resource management

## 2025-01-XX - Web Worker for Heavy Processing

### Added

- src/lib/converter/worker.ts: Web Worker implementation for non-blocking image conversion
- OffscreenCanvas-based conversion in worker context
- Message protocol: CONVERT, PROGRESS, SUCCESS, ERROR
- Progress reporting during conversion (10%, 30%, 50%, 70%, 100%)
- Error handling with detailed error messages
- convertWithWorker(): Worker-based conversion method in ImageConverter
- Worker instantiation with lazy loading and reuse
- Automatic fallback to main thread if Worker/OffscreenCanvas unsupported
- terminate(): Worker cleanup method

## 2025-01-XX - File Validation Utilities

### Added

- src/lib/converter/validation.ts: File validation utilities for image converter
- ACCEPTED_MIME_TYPES: Array of accepted input formats (PNG, JPEG, GIF, BMP, TIFF, SVG, WebP, AVIF)
- MAX_FILE_SIZE: 50MB file size limit constant
- ValidationError and ValidationResult types for type-safe validation
- validateFileType(): MIME type validation against accepted formats
- validateFileSize(): File size validation against 50MB limit
- validateFile(): Main validation function checking both type and size
- validateFiles(): Batch validation for multiple files
- areAllFilesValid(): Convenience function for quick batch validation checks
- Clear error messages with specific details (file type, size in MB, limits)

---
*FredonBytes*
