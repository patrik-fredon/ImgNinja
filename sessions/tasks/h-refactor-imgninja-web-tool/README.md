---
name: h-refactor-imgninja-web-tool
branch: feature/h-refactor-imgninja-web-tool
status: pending
created: 2025-10-28
---

# ImgNinja Web Tool Refactoring & Enhancement

## Problem/Goal

ImgNinja je webový nástroj pro konverzi obrázků, který aktuálně trpí několika kritickými problémy:

**Kritické chyby (blokují funkčnost)**:
- CSP policy blokuje Web Workers → ImageConverter nefunguje
- Chybějící ikony a assets (favicons, apple-touch-icon)
- Chybějící font `/fonts/inter-var.woff2` (zbytečný preload)
- Service Worker cache selhává na dynamických cestách
- MIME type chyba pro CSS soubory

**UX/Design problémy**:
- Layout není vycentrovaný
- Design není dostatečně atraktivní
- Chybí prostor pro reklamní plochy (hlavní zdroj příjmů)
- Chybí features pro širší publikum

**Cíl**: Vytvořit působivý, funkční web tool s:
- ✅ Opravenými kritickými chybami
- ✅ Moderním, atraktivním designem
- ✅ Vycentrovaným layoutem s místem pro reklamy
- ✅ Rozšířenými funkcemi pro širší publikum
- ✅ Optimalizací pomocí moderních praktik
- ✅ Zachováním jednoduchosti a intuitivnosti

## Success Criteria

- [ ] **Konzole čistá** - žádné chyby, ImageConverter funguje
- [ ] **Assets na místě** - všechny ikony a fonty načítané
- [ ] **Design který zaujme** - moderní, pestrý, odlišný od ostatních
- [ ] **Vycentrovaný layout** - čistý, vzdušný, s místem pro reklamy
- [ ] **Intuitivní použití** - drag & drop funguje, batch conversion funguje
- [ ] **Rychlé načítání** - lazy loading kde má smysl

## Context Manifest

### How ImgNinja Currently Works: Architecture Overview

ImgNinja is a client-side image conversion tool built with Next.js 15 using the App Router. When a user visits the site, they land on the main converter page at `/[locale]/page.tsx`, which is a client component that orchestrates the entire conversion workflow. The application's architecture is designed around privacy - all image processing happens directly in the user's browser using Canvas API and Web Workers, with zero server uploads.

**Application Entry Point and Layout Structure:**

The application has a two-level layout system. At the root level (`src/app/layout.tsx`), there's a minimal wrapper that simply renders children. The actual layout logic lives in `src/app/[locale]/layout.tsx`, which wraps all localized routes. This locale layout handles several critical responsibilities:

1. **Font Loading**: Uses Google Fonts' Inter typeface with display:swap optimization, configured via Next.js font system (NOT local fonts). The layout mistakenly preloads `/fonts/inter-var.woff2` at line 230-236, but this file doesn't exist - the fonts are loaded from Google Fonts via the `next/font/google` import.

2. **Internationalization Setup**: Integrates `next-intl` with NextIntlClientProvider, loading messages from `messages/cs.json` and `messages/en.json`. Czech is the default locale. The routing structure uses `localePrefix: "always"` meaning URLs always include the locale prefix (e.g., `/cs/`, `/en/`).

3. **SEO and Metadata**: Generates comprehensive metadata including Open Graph tags, Twitter cards, JSON-LD structured data (WebApplication schema), and icons. The metadata references several assets that may or may not exist: `/favicon-16x16.png`, `/favicon-32x32.png`, `/apple-touch-icon.png`, `/safari-pinned-tab.svg`, `/og-image.png`, `/screenshot.png`, and `/site.webmanifest`.

4. **Service Worker Registration**: Inline script in the `<head>` registers `/sw.js` on window load. The service worker itself (`public/sw.js`) attempts to cache static assets including hardcoded paths like `/_next/static/css/app/[locale]/layout.css` and `/_next/static/js/app/[locale]/layout.js`. These are LITERAL path strings with `[locale]` in them, which will fail because Next.js generates hashed filenames. This is a critical bug causing cache failures.

5. **Error Handling Infrastructure**: Wraps the app in ErrorProvider (from `src/lib/errors/context.tsx`) and ErrorBoundary components. Also includes PerformanceMonitor for tracking Core Web Vitals.

6. **Layout Components**: Renders Header, main content, and Footer. Both Header and Footer include AdPlacement components for Google Ads monetization.

**Current Layout Visual Structure:**
```
<Header> (includes header ad placement)
  └─ Logo + Navigation + Language Switcher
<main className="flex-1">
  └─ Page content (not centered, full width with max-w-6xl)
<Footer> (includes footer ad placement)
  └─ Links + Copyright + Attribution
```

The layout uses `min-h-screen flex flex-col` on the body, with `flex-1` on main to push footer down. However, the page content itself (`src/app/[locale]/page.tsx`) has `className="min-h-screen bg-gray-50"` which creates visual layout issues.

**Image Conversion Engine Architecture:**

The conversion system is split between main thread and Web Worker processing:

1. **Main Thread (engine.ts)**: The `ImageConverter` class provides two conversion methods:
   - `convert()`: Synchronous processing using Canvas API
   - `convertWithWorker()`: Asynchronous processing using Web Worker with OffscreenCanvas

2. **Web Worker (worker.ts)**: Handles heavy processing off the main thread. The worker is initialized via dynamic import: `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`. This creates a module-type worker, which is CRITICAL for the CSP policy.

**The CSP Policy Problem - ROOT CAUSE:**

In `next.config.ts` lines 54-67, the CSP header includes:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagservices.com ...
```

This policy allows scripts from 'self' but the Web Worker is loaded as a module worker. Module workers require `worker-src 'self'` or `child-src 'self'` in the CSP, which is MISSING. The current CSP doesn't explicitly allow Web Workers at all. This causes the "Refused to create a worker" error in the console.

**Image Conversion Flow - Step by Step:**

When a user uploads images through the FileUpload component:

1. **File Upload** (`src/components/converter/FileUpload.tsx`): User drags/drops or clicks to select files. The component:
   - Validates each file using `validateFile()` from `src/lib/converter/validation.ts`
   - Checks file type against ACCEPTED_MIME_TYPES (png, jpeg, jpg, gif, bmp, tiff, svg+xml, webp, avif)
   - Checks file size against MAX_FILE_SIZE (50MB)
   - Creates preview URLs using FileReader.readAsDataURL()
   - Extracts image dimensions by creating temporary Image objects
   - Passes only VALID files to parent via `onFilesSelected()`

2. **Validation Layer** (`src/lib/converter/validation.ts`): Centralized validation that returns `ValidationResult` objects. If validation fails, errors are added to the ErrorContext with recovery actions (select different file, clear files, reduce quality).

3. **Format and Quality Selection**: User selects output format (webp, avif, png, jpeg, gif) via FormatSelector and adjusts quality (10-100) via QualityControl. Format metadata comes from `FORMATS` constant in `src/lib/converter/formats.ts`, which defines:
   - MIME type (e.g., 'image/webp')
   - File extension (e.g., '.webp')
   - Whether format supports quality control (lossy vs lossless)
   - Whether format supports transparency
   - Browser support matrix
   - Recommended status

4. **Size Estimation**: When format/quality changes, the converter calls `estimateSize()` which:
   - Creates ImageBitmap from file
   - Calculates dimensions (accounting for maxWidth/maxHeight constraints)
   - Applies format-specific compression factors (JPEG: 0.15, WebP: 0.12, AVIF: 0.08)
   - Returns estimated output size in bytes

5. **Conversion Initialization**: User clicks "Convert" button, triggering `handleStartConversion()` which:
   - Dispatches START_CONVERSION action to reducer
   - Iterates through selectedFiles array
   - Creates ConversionItem for each file with unique ID
   - Adds item to conversionItems array with status "pending"

6. **Worker-Based Conversion** (`convertWithWorker()`): For each file:
   - Creates or retrieves existing Web Worker
   - Generates unique message ID
   - Sets up message listener for worker responses
   - Sets 30-second timeout for conversion
   - Posts CONVERT message to worker with file and options
   - Worker receives file, creates ImageBitmap, draws to OffscreenCanvas
   - Worker sends PROGRESS messages (10%, 30%, 50%, 70%)
   - Worker calls `canvas.convertToBlob()` with MIME type and quality
   - Worker sends SUCCESS message with blob, size, dimensions, duration
   - Main thread updates ConversionItem status to "complete"

7. **Error Handling**: If conversion fails at any point:
   - Worker sends ERROR message with error string
   - Main thread wraps in ImageConverterError with error code
   - Error is logged via `logError()` which console.errors it
   - ConversionItem status updated to "error" with error message
   - Error displayed in UI via ErrorList component

8. **Download Process**: User clicks download on completed item:
   - Creates object URL from outputBlob
   - Generates filename: `{originalName}.{extension}`
   - Creates invisible `<a>` element with download attribute
   - Triggers click, removes element
   - Revokes object URL after 100ms

9. **Batch Download**: User clicks "Download All":
   - Filters for completed items with outputBlobs
   - Dynamically imports JSZip library
   - Creates ZIP file with all converted images
   - Downloads ZIP as "converted-images.zip"

**State Management Pattern:**

The app uses useReducer for conversion state management (NOT Context API, NOT Redux). The ConversionState includes:
- selectedFiles: File[]
- outputFormat: OutputFormat
- quality: number
- conversionItems: ConversionItem[]
- isConverting: boolean
- estimatedSize?: number

Actions handle: SET_FILES, SET_FORMAT, SET_QUALITY, START_CONVERSION, ADD_CONVERSION_ITEM, UPDATE_CONVERSION_ITEM, REMOVE_CONVERSION_ITEM, CLEAR_COMPLETED, SET_ESTIMATED_SIZE.

**Lazy Loading Strategy:**

The app uses aggressive code splitting to optimize initial bundle size:

1. **ImageConverter**: Dynamically imported in useEffect at line 149-161 of page.tsx
2. **Format Components**: LazyFormatSelector, LazyQualityControl, LazyConversionQueue (wrapper components that lazy load the actual implementations)
3. **JSZip**: Only loaded when user clicks "Download All"
4. **Format Metadata**: Dynamically imported when needed for downloads

This means the main page bundle doesn't include heavy processing code until user interaction requires it.

**Component Architecture:**

Components follow a clear hierarchy:
- **Layout Components** (`src/components/layout/`): Header, Footer, AdPlacement
- **Converter Components** (`src/components/converter/`): FileUpload, FormatSelector, QualityControl, ConversionQueue, DownloadButton
- **UI Components** (`src/components/ui/`): Button, Card, Progress, ErrorList, ErrorBoundary, LoadingSkeleton, PerformanceMonitor

All components use Tailwind 4 utility classes. The design system is minimal:
- Colors: Blue for primary actions, gray for neutral elements, green for success, red for errors
- Typography: Inter font family via CSS variable `--font-inter`
- Spacing: Standard Tailwind scale (4, 6, 8, etc.)
- Touch targets: Minimum 44px for mobile (enforced via global CSS in globals.css)

**Styling Approach:**

Tailwind 4 is configured via `tailwind.config.ts` with:
- Content: All files in `src/**/*.{js,ts,jsx,tsx,mdx}`
- Font family extension: Inter as default sans-serif
- Custom CSS in `src/app/globals.css` for touch-manipulation utilities and range input styling

The current design is MINIMAL and UTILITARIAN - primarily gray and blue, with no unique visual identity. There's no custom color palette, no gradients, no unique visual flourishes.

**Ad Placement System:**

AdPlacement component (`src/components/layout/AdPlacement.tsx`) handles Google Ads integration:
- Lazy loads Google AdSense script on mount
- Checks localStorage for "ads-disabled" preference
- Three slot types: "header", "sidebar", "footer"
- Responsive dimensions: 320x50 for header/footer, 300x250 for sidebar
- Currently ONLY header and footer placements are used (no sidebar in current layout)
- Shows loading skeleton while ads load
- Falls back to placeholder if no adUnitId provided

**Current Console Errors (Critical):**

1. **CSP Worker Blocking**: "Refused to create a worker from 'blob:...' because it violates the Content Security Policy directive" - Web Workers are blocked by CSP
2. **Missing Font**: 404 on `/fonts/inter-var.woff2` - Preload link points to non-existent file
3. **Missing Favicons**: 404 on `/favicon-16x16.png`, `/favicon-32x32.png`, `/apple-touch-icon.png`, `/safari-pinned-tab.svg` - Metadata references non-existent icons
4. **Service Worker Cache Failures**: SW tries to cache `/_next/static/css/app/[locale]/layout.css` (literal string) which doesn't exist - actual files have hashed names
5. **MIME Type Warnings**: Potential CSS MIME type issues from malformed cache paths

**Missing Assets Inventory:**

From layout.tsx metadata and preload links:
- `/fonts/inter-var.woff2` (doesn't exist, unnecessary because using Google Fonts)
- `/favicon-16x16.png`
- `/favicon-32x32.png`
- `/apple-touch-icon.png`
- `/safari-pinned-tab.svg`
- `/og-image.png` (referenced but not verified)
- `/screenshot.png` (referenced but not verified)

Actually present in `/public/`:
- `site.webmanifest`
- `sw.js`
- `web-app-manifest-192x192.png`
- `web-app-manifest-512x512.png`

**Internationalization Implementation:**

next-intl configuration in `src/i18n.ts` loads messages based on locale (defaulting to 'cs'). Translation files provide comprehensive coverage including:
- Common UI strings (buttons, states, actions)
- Converter-specific strings (upload, format selection, quality control, queue)
- Format information (descriptions, use cases, browser support)
- Error messages with context
- Privacy policy content
- Layout elements (header, footer)

Translation keys use nested structure: `converter.upload.title`, `formats.webp.description`, etc.

**Error Handling System:**

Sophisticated error system in `src/lib/errors/`:

1. **Error Types** (`types.ts`): 34 error codes organized by category:
   - Validation: INVALID_FILE_TYPE, FILE_TOO_LARGE, INVALID_FILE, TOO_MANY_FILES
   - Conversion: CONVERSION_FAILED, CANVAS_ERROR, WORKER_ERROR, MEMORY_ERROR, TIMEOUT_ERROR
   - Browser: UNSUPPORTED_FORMAT, BROWSER_NOT_SUPPORTED, FEATURE_NOT_AVAILABLE, WEBWORKER_NOT_SUPPORTED
   - File: FILE_READ_ERROR, FILE_CORRUPT, DOWNLOAD_ERROR
   - System: NETWORK_ERROR, QUOTA_EXCEEDED, PERMISSION_DENIED, UNKNOWN_ERROR

2. **Error Context** (`context.tsx`): React Context that maintains error stack with recovery actions. Errors can include:
   - onRetry: Try conversion again
   - onSelectDifferentFile: Clear and choose new file
   - onChangeFormat: Switch to different output format
   - onReduceQuality: Lower quality setting
   - onClearFiles: Clear all selected files

3. **Error Display** (`ErrorList.tsx`): Shows errors at top of page with recovery action buttons

**Performance Monitoring:**

PerformanceMonitor component tracks Core Web Vitals (CLS, LCP) and logs to console. Configuration in `next.config.ts` enables webVitalsAttribution for detailed debugging.

### What Needs to Change for This Refactoring

**Critical Fixes Required:**

1. **CSP Policy Update**: Add `worker-src 'self' blob:` and `child-src 'self' blob:` to CSP in next.config.ts to allow Web Workers. The current policy blocks worker creation entirely.

2. **Remove Broken Font Preload**: Delete lines 230-236 in layout.tsx that preload `/fonts/inter-var.woff2`. Inter is already loaded via Google Fonts (line 12-17), making this preload unnecessary and error-causing.

3. **Fix Service Worker Cache**: Rewrite `public/sw.js` to either:
   - Use wildcard patterns for `_next/static/*` instead of hardcoded paths
   - Cache only the root routes (`/cs`, `/en`) and let Next.js handle static assets
   - Implement runtime caching strategy instead of install-time caching

4. **Generate Missing Icons**: Create or source the following assets:
   - favicon-16x16.png
   - favicon-32x32.png
   - apple-touch-icon.png (180x180)
   - safari-pinned-tab.svg
   - og-image.png (1200x630)
   - screenshot.png (for schema.org)

5. **MIME Type Issues**: Once SW cache is fixed, MIME type errors should resolve (they're likely caused by serving 404 HTML as CSS).

**Design Enhancement Strategy:**

Current design is bland gray/blue. To make it "modern, colorful, and unique":

1. **Color Palette**: Need vibrant, modern color scheme beyond basic blue. Consider:
   - Gradient backgrounds (popular in modern web tools)
   - Color-coded format badges (each format gets its own color)
   - Accent colors for interactive elements
   - Subtle background patterns or textures

2. **Visual Hierarchy**: Current layout is flat. Consider:
   - Glassmorphism effects for cards
   - Depth via shadows and layering
   - Animated micro-interactions
   - Progress indicators with color transitions

3. **Typography**: Inter is good but presentation is plain. Consider:
   - Larger, bolder headings
   - Gradient text effects on key CTAs
   - Better font size scale for visual hierarchy

4. **Iconography**: Current icons are basic SVG outlines. Consider:
   - Duotone or gradient icons
   - Animated icons for active states
   - Custom format icons (beyond generic image icon)

**Layout Restructuring for Ad Placement:**

Current layout has NO SPACE for meaningful ad placement. Header and footer ads exist but are minimal. For better monetization:

1. **Sidebar Ad Area**: Add right sidebar (desktop only) for 300x250 ad units. Current layout is single column.

2. **Center Content with Ad Columns**: Use 3-column grid on desktop:
   - Left column: (optional) ads or navigation
   - Center column: Converter UI (narrower than current max-w-6xl)
   - Right column: Ads + conversion queue

3. **In-Feed Ad Slots**: Between conversion steps (after upload, before format selection) for native ad integration

4. **Mobile Ad Strategy**: Currently only header/footer. Consider:
   - Sticky bottom ad bar
   - Interstitial ads between conversion steps
   - In-feed ads in conversion queue

**UX Enhancements Required:**

1. **Drag & Drop**: Already implemented in FileUpload.tsx (lines 110-131) but needs testing

2. **Batch Conversion**: Already implemented (lines 240-310 in page.tsx) but UI could be clearer about batch capabilities

3. **Progress Indication**: Already implemented with progress bars but could be more visual/engaging

4. **Better Empty States**: Show compelling examples/use cases when no files selected

5. **Format Recommendations**: Auto-suggest best format based on source file (already have canConvert() logic)

### Technical Reference Details

#### Key File Paths for Implementation

**Layout & Structure:**
- Main layout: `src/app/[locale]/layout.tsx` (lines 226-294 contain HTML structure)
- Page component: `src/app/[locale]/page.tsx` (lines 399-502 contain UI structure)
- Header: `src/components/layout/Header.tsx`
- Footer: `src/components/layout/Footer.tsx`
- Ad placement: `src/components/layout/AdPlacement.tsx`

**Conversion Engine:**
- Main engine: `src/lib/converter/engine.ts`
- Web Worker: `src/lib/converter/worker.ts`
- Format definitions: `src/lib/converter/formats.ts`
- Validation: `src/lib/converter/validation.ts`

**UI Components:**
- File upload: `src/components/converter/FileUpload.tsx`
- Format selector: `src/components/converter/FormatSelector.tsx`
- Quality control: `src/components/converter/QualityControl.tsx`
- Conversion queue: `src/components/converter/ConversionQueue.tsx`

**Configuration:**
- Next.js config: `next.config.ts` (CSP at lines 46-119)
- Tailwind config: `tailwind.config.ts`
- TypeScript config: `tsconfig.json` (path aliases at lines 25-40)
- Global CSS: `src/app/globals.css`

**Assets:**
- Service Worker: `public/sw.js`
- Manifest: `public/site.webmanifest`
- Icons: `public/` (need to create missing ones)

#### Component Interfaces

**ConversionItem (central data structure):**
```typescript
interface ConversionItem {
  id: string;
  file: File;
  outputFormat: OutputFormat;
  quality: number;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  outputBlob?: Blob;
  outputSize?: number;
  error?: string;
}
```

**ConversionOptions (engine input):**
```typescript
interface ConversionOptions {
  format: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}
```

**ConversionResult (engine output):**
```typescript
interface ConversionResult {
  blob: Blob;
  size: number;
  width: number;
  height: number;
  duration: number;
}
```

**FormatMetadata (format definition):**
```typescript
interface FormatMetadata {
  id: OutputFormat;
  name: string;
  mimeType: string;
  extension: string;
  supportsQuality: boolean;
  supportsTransparency: boolean;
  browserSupport: { chrome: string; firefox: string; safari: string; edge: string };
  description: string;
  useCase: string;
  recommended: boolean;
}
```

#### CSP Policy Fix Required

Current CSP (next.config.ts lines 54-67):
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagservices.com ...",
```

Needs:
```typescript
"worker-src 'self' blob:",
"child-src 'self' blob:",
```

#### Tailwind 4 Configuration

Configured in `tailwind.config.ts`:
- Content glob: `./src/**/*.{js,ts,jsx,tsx,mdx}`
- Font family: `sans: ['var(--font-inter)', 'system-ui', 'sans-serif']`
- Extending theme: Only font customization, no custom colors/spacing yet

To add custom colors, modify theme.extend:
```typescript
theme: {
  extend: {
    colors: {
      brand: { /* custom palette */ },
    },
    fontFamily: { /* already configured */ },
  },
}
```

#### Environment Variables

Referenced in code:
- `NEXT_PUBLIC_SITE_URL`: Base URL for metadata (defaults to https://imgninja.com)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: Google Search Console verification
- `NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID`: AdSense client ID
- `NEXT_PUBLIC_GOOGLE_ADS_HEADER_SLOT`: Header ad unit ID
- `NEXT_PUBLIC_GOOGLE_ADS_FOOTER_SLOT`: Footer ad unit ID

#### Service Worker Fix Strategy

Current problematic code (public/sw.js lines 2-9):
```javascript
const STATIC_ASSETS = [
  '/',
  '/cs',
  '/en',
  '/_next/static/css/app/[locale]/layout.css', // WRONG - literal string
  '/_next/static/js/app/[locale]/layout.js',   // WRONG - literal string
];
```

Replace with runtime caching strategy or remove static asset caching entirely (Next.js handles this better with Cache-Control headers).

#### Dependencies

Critical packages (from package.json):
- `next`: ^16.0.0 (App Router)
- `react`: ^19.2.0
- `react-dom`: ^19.2.0
- `next-intl`: ^4.4.0 (i18n)
- `tailwindcss`: ^4.0.0 (styling)
- `jszip`: ^3.10.1 (batch download)
- `typescript`: ^5.9.3

No state management libraries (uses React built-ins).
No UI component libraries (custom components).
No testing libraries (no tests).

#### Browser API Usage

- **Canvas API**: Core conversion (CanvasRenderingContext2D)
- **OffscreenCanvas**: Worker-based conversion
- **ImageBitmap**: Image loading and manipulation
- **Web Workers**: Parallel processing
- **File API**: File reading and validation
- **Blob API**: Output file creation
- **URL.createObjectURL**: Download URL generation
- **FileReader**: Preview generation

All APIs have good browser support (Chrome 85+, Firefox 93+, Safari 16+, Edge 85+ for AVIF; broader for other features).

#### Performance Patterns

1. **Code Splitting**: Dynamic imports for heavy modules (ImageConverter, JSZip, format metadata)
2. **Lazy Loading**: Suspense boundaries for converter components
3. **Web Workers**: Off-thread processing prevents UI blocking
4. **Image Optimization**: Canvas API with quality control
5. **Caching**: Service Worker attempts caching (broken, needs fix)
6. **Bundle Optimization**: optimizePackageImports in next.config.ts for @/components and @/lib

#### Implementation Priorities

Based on task requirements:

**Priority 1 - Fix Console Errors:**
1. Add worker-src/child-src to CSP (next.config.ts)
2. Remove broken font preload (layout.tsx lines 230-236)
3. Generate missing favicons (use favicon generator tool)
4. Fix or remove Service Worker caching (public/sw.js)

**Priority 2 - Design Overhaul:**
1. Create custom color palette in Tailwind config
2. Redesign page.tsx layout with visual interest
3. Add animations and micro-interactions
4. Enhance component styling (Card, Button, etc.)
5. Create unique visual identity (gradients, patterns, custom icons)

**Priority 3 - Layout Restructuring:**
1. Implement 3-column layout for desktop (ads + content + ads/queue)
2. Center main content with proper spacing
3. Add sidebar ad placement slots
4. Ensure mobile responsiveness maintained

**Priority 4 - UX Polish:**
1. Improve drag & drop feedback
2. Add format recommendations
3. Enhance empty states
4. Improve progress visualization
5. Add success animations

## User Notes

### Požadavky uživatele
- **Priorita 1**: Opravit všechny chyby z dev konzole
- **Priorita 2**: Atraktivní design jako rozhodující faktor
- **Priorita 3**: Jednoduchost (důležitá)
- **Priorita 4**: Rychlý a optimalizovaný development s moderními praktikami
- **Fokus**: Implementovat pouze to co je zadáno

### Monetizace
- Příjmy z reklam (Google Ads)
- Reklamy nebudou moc "ubíjející"
- Dostatek prostoru pro reklamní plochy

### Filozofie projektu
- Co nejjednodušší
- Pokrývá tool, který každý potřebuje
- Široké publikum

## Work Log
- [2025-10-28] Task created, awaiting context gathering and implementation
