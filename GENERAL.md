# ImgNinja - Technical Record

## Project Initialization (Task 1)

### Setup Completed

- Next.js 16.0.0 (App Router) with TypeScript
- Tailwind CSS 4.0.0 with PostCSS
- next-intl 4.4.0 for internationalization
- React 19.2.0

### Project Structure

```
src/
├── app/
│   ├── [locale]/          # Locale-prefixed routes
│   │   ├── layout.tsx     # Root layout with next-intl
│   │   └── page.tsx       # Home page
│   ├── layout.tsx         # Root wrapper
│   ├── page.tsx           # Root redirect to /cs
│   └── globals.css        # Tailwind directives
├── components/            # React components (empty)
├── lib/                   # Utilities and core logic (empty)
├── types/                 # TypeScript types (empty)
├── i18n.ts               # next-intl configuration
└── middleware.ts         # Locale routing middleware
```

### Configuration Files

- **tsconfig.json**: Path aliases configured (@/components, @/lib, @/app, @/types)
- **next.config.ts**: next-intl plugin integrated
- **tailwind.config.ts**: Content paths configured
- **package.json**: Scripts for dev, build, start, lint, format

### Internationalization

- Locales: Czech (cs) - default, English (en)
- Routing: locale-prefixed (always) - /cs/, /en/
- Messages: messages/cs.json, messages/en.json

## Internationalization Configuration (Task 2)

### i18n Setup

- **src/i18n.ts**: getRequestConfig with dynamic message loading
- **src/middleware.ts**: createMiddleware with locale routing (cs, en, default: cs, localePrefix: always)
- **Matcher**: `/((?!api|_next|_vercel|.*\\..*).*)` - excludes API routes and static files

### Translation Structure

Comprehensive translations added for:

- Common UI elements (loading, error, success, buttons)
- Converter interface (upload, format selection, quality control, queue)
- Format descriptions (WebP, AVIF, PNG, JPEG, GIF)
- Layout components (header, footer)
- Privacy notices
- Error messages

### Locale Layout

- **src/app/[locale]/layout.tsx**: Root layout with NextIntlClientProvider
- HTML lang attribute set dynamically
- Messages loaded server-side via getMessages()
- SEO metadata configured (title template, description, keywords, Open Graph)

### Build Status

- ✅ TypeScript compilation successful
- ✅ Production build successful
- ✅ Dev server runs on port 3001

## Format Definitions and Metadata (Task 3)

### Type Definitions

- **src/types/formats.ts**: OutputFormat type and FormatMetadata interface
  - OutputFormat: 'webp' | 'avif' | 'png' | 'jpeg' | 'gif'
  - FormatMetadata: Complete interface with id, name, mimeType, extension, quality/transparency support, browser compatibility, descriptions

### Format Metadata

- **src/lib/converter/formats.ts**: FORMATS constant with complete metadata
  - WebP: Modern format, excellent compression, transparency support, recommended for web
  - AVIF: Next-gen format, superior compression, transparency support, recommended for modern browsers
  - PNG: Lossless format, transparency support, universal compatibility
  - JPEG: Universal format, good compression, no transparency
  - GIF: Legacy format, animation support, transparency support

### Validation Utilities

- `isValidFormat()`: Type guard for OutputFormat validation
- `getSupportedFormats()`: Returns array of all supported formats
- `getFormatMetadata()`: Retrieves metadata for specific format

### Browser Support Data

Complete browser compatibility information for all formats:

- WebP: Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
- AVIF: Chrome 85+, Firefox 93+, Safari 16+, Edge 85+
- PNG/JPEG/GIF: Universal support across all browsers

## Browser Feature Detection Utilities (Task 4)

### Browser Support Detection

- **src/lib/utils/browser-support.ts**: Feature detection utilities
  - `detectFormatSupport()`: Detects browser support for image formats using Canvas API
    - Tests WebP and AVIF support via canvas.toDataURL()
    - Returns Record<OutputFormat, boolean> mapping formats to support status
    - Handles SSR gracefully (returns false for all formats)
  - `supportsWebWorker()`: Checks if Web Workers are available
  - `supportsOffscreenCanvas()`: Checks if OffscreenCanvas is available

### Implementation Details

- Canvas-based format detection using 1x1 canvas and toDataURL()
- SSR-safe checks (typeof window/document checks)
- PNG, JPEG, GIF assumed universally supported
- WebP and AVIF tested dynamically based on browser capabilities

## Core Image Conversion Engine (Task 5)

### ImageConverter Class

- **src/lib/converter/engine.ts**: Core conversion engine implementation
  - `ImageConverter` class with complete conversion functionality
  - Client-side image processing using Canvas API and ImageBitmap

### Interfaces

- **ConversionOptions**: Configuration for conversion
  - format: OutputFormat (target format)
  - quality: number (1-100 for lossy formats)
  - maxWidth?: number (optional resize constraint)
  - maxHeight?: number (optional resize constraint)

- **ConversionResult**: Conversion output data
  - blob: Blob (converted image data)
  - size: number (output file size in bytes)
  - width: number (output image width)
  - height: number (output image height)
  - duration: number (conversion time in milliseconds)

### Core Methods

- **convert()**: Main conversion method
  - Loads file using createImageBitmap()
  - Calculates dimensions with optional resize
  - Creates canvas and renders image
  - Converts to target format using canvas.toBlob()
  - Applies quality parameter for lossy formats
  - Returns ConversionResult with blob and metadata

- **estimateSize()**: Size prediction without conversion
  - Loads image to get dimensions
  - Uses heuristic formulas based on format and quality
  - PNG: pixels *4* 0.5 (RGBA with compression)
  - GIF: pixels * 0.3
  - Lossy formats: pixels *3* qualityFactor * compressionFactor
  - Compression factors: AVIF (0.08) < WebP (0.12) < JPEG (0.15)

- **getSupportedFormats()**: Returns array of supported OutputFormat values

- **canConvert()**: Validates source to target conversion
  - Checks source format against valid input formats
  - Validates target format is supported
  - Supports: PNG, JPEG, GIF, BMP, TIFF, WebP, AVIF as sources

### Implementation Details

- Direct Canvas API usage for rendering
- ImageBitmap for efficient image loading
- Automatic dimension calculation with aspect ratio preservation
- Performance tracking with performance.now()
- Clean resource management (bitmap.close())
- Clear error messages for conversion failures

## Web Worker for Heavy Processing (Task 6)

### Worker Implementation

- **src/lib/converter/worker.ts**: Standalone Web Worker for non-blocking image conversion
  - Runs in worker context using self.onmessage
  - Uses OffscreenCanvas for better performance
  - Implements message-based communication protocol

### Message Protocol

- **ConversionMessage** (main → worker):
  - type: 'CONVERT'
  - id: unique identifier for request tracking
  - file: File object to convert
  - options: format, mimeType, quality, dimensions, supportsQuality flag

- **ProgressMessage** (worker → main):
  - type: 'PROGRESS'
  - id: request identifier
  - progress: number (10, 30, 50, 70)

- **SuccessMessage** (worker → main):
  - type: 'SUCCESS'
  - id: request identifier
  - blob: converted image Blob
  - size, width, height, duration: conversion metadata

- **ErrorMessage** (worker → main):
  - type: 'ERROR'
  - id: request identifier
  - error: error message string

### Worker Conversion Flow

1. Receive CONVERT message with file and options
2. Report 10% progress
3. Create ImageBitmap from file
4. Report 30% progress
5. Calculate dimensions with aspect ratio preservation
6. Create OffscreenCanvas with target dimensions
7. Report 50% progress
8. Draw image to canvas context
9. Report 70% progress
10. Convert to blob using canvas.convertToBlob()
11. Send SUCCESS message with blob and metadata

### Engine Integration

- **ImageConverter** class extended with worker support:
  - `workerSupported`: Detects Worker and OffscreenCanvas availability
  - `worker`: Lazy-loaded Worker instance (reused across conversions)
  - `getWorker()`: Creates worker on first use with module type
  - `convertWithWorker()`: Worker-based conversion with progress callback
    - Generates unique ID for request tracking
    - Sets up message listener for responses
    - Posts CONVERT message to worker
    - Returns Promise<ConversionResult>
    - Automatically falls back to convert() if worker unsupported
  - `terminate()`: Cleanup method to terminate worker

### Worker Features

- **Non-blocking**: Runs in separate thread, prevents UI freezing
- **Progress reporting**: Real-time progress updates during conversion
- **Error handling**: Catches and reports errors with clear messages
- **Resource management**: Proper cleanup with bitmap.close()
- **Fallback support**: Automatic fallback to main thread if unsupported
- **Reusable**: Single worker instance handles multiple conversions

### Use Cases

- Large image conversions (prevents UI blocking)
- Batch processing (concurrent conversions up to 10 files)
- Heavy processing operations (high-resolution images)
- Better performance for modern browsers with OffscreenCanvas support

## File Validation Utilities (Task 7)

### Validation Module

- **src/lib/converter/validation.ts**: File validation utilities for image converter
  - Validates file type and size before conversion
  - Ensures only accepted formats are processed
  - Enforces file size limits for performance

### Constants

- **ACCEPTED_MIME_TYPES**: Array of accepted input MIME types
  - image/png, image/jpeg, image/jpg, image/gif
  - image/bmp, image/tiff, image/svg+xml
  - image/webp, image/avif
- **MAX_FILE_SIZE**: 52428800 bytes (50MB)

### Types

- **ValidationErrorCode**: Union type for error codes
  - INVALID_FILE_TYPE: Unsupported file format
  - FILE_TOO_LARGE: File exceeds size limit
  - INVALID_FILE: Invalid file object
- **ValidationError**: Error object with code and message
- **ValidationResult**: Result object with valid flag and optional error

### Core Functions

- **validateFileType()**: Validates file MIME type against accepted formats
  - Returns ValidationResult with error if type not accepted
  - Provides clear message listing accepted formats

- **validateFileSize()**: Validates file size against 50MB limit
  - Returns ValidationResult with error if size exceeded
  - Displays actual size and limit in MB

- **validateFile()**: Main validation function
  - Checks file object validity
  - Validates both type and size
  - Returns first validation error encountered

- **validateFiles()**: Batch validation for multiple files
  - Returns array of ValidationResult in same order as input
  - Each file validated independently

- **areAllFilesValid()**: Convenience function for batch validation
  - Returns boolean indicating if all files pass validation
  - Useful for quick checks before processing

### Implementation Details

- Minimal, direct validation logic
- Clear error messages with specific details
- No over-engineering or defensive coding
- Production-ready error handling
- Type-safe with TypeScript strict mode

---
*FredonBytes*
