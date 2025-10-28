import type { OutputFormat, FormatMetadata } from '@/types/formats';

export const FORMATS: Record<OutputFormat, FormatMetadata> = {
  webp: {
    id: 'webp',
    name: 'WebP',
    mimeType: 'image/webp',
    extension: '.webp',
    supportsQuality: true,
    supportsTransparency: true,
    browserSupport: {
      chrome: '23+',
      firefox: '65+',
      safari: '14+',
      edge: '18+',
    },
    description: 'Modern format with excellent compression',
    useCase: 'Best for web images with transparency',
    recommended: true,
  },
  avif: {
    id: 'avif',
    name: 'AVIF',
    mimeType: 'image/avif',
    extension: '.avif',
    supportsQuality: true,
    supportsTransparency: true,
    browserSupport: {
      chrome: '85+',
      firefox: '93+',
      safari: '16+',
      edge: '85+',
    },
    description: 'Next-gen format with superior compression',
    useCase: 'Best compression for modern browsers',
    recommended: true,
  },
  png: {
    id: 'png',
    name: 'PNG',
    mimeType: 'image/png',
    extension: '.png',
    supportsQuality: false,
    supportsTransparency: true,
    browserSupport: {
      chrome: 'All',
      firefox: 'All',
      safari: 'All',
      edge: 'All',
    },
    description: 'Lossless format with transparency support',
    useCase: 'Best for graphics, logos, and images requiring transparency',
    recommended: false,
  },
  jpeg: {
    id: 'jpeg',
    name: 'JPEG',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    supportsQuality: true,
    supportsTransparency: false,
    browserSupport: {
      chrome: 'All',
      firefox: 'All',
      safari: 'All',
      edge: 'All',
    },
    description: 'Universal format with good compression',
    useCase: 'Best for photographs without transparency',
    recommended: false,
  },
  gif: {
    id: 'gif',
    name: 'GIF',
    mimeType: 'image/gif',
    extension: '.gif',
    supportsQuality: false,
    supportsTransparency: true,
    browserSupport: {
      chrome: 'All',
      firefox: 'All',
      safari: 'All',
      edge: 'All',
    },
    description: 'Legacy format with animation support',
    useCase: 'Best for simple animations and graphics',
    recommended: false,
  },
};

export function isValidFormat(format: string): format is OutputFormat {
  return format in FORMATS;
}

export function getSupportedFormats(): OutputFormat[] {
  return Object.keys(FORMATS) as OutputFormat[];
}

export function getFormatMetadata(format: OutputFormat): FormatMetadata {
  return FORMATS[format];
}
