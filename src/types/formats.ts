export type OutputFormat = 'webp' | 'avif' | 'png' | 'jpeg' | 'gif';

export interface FormatMetadata {
  id: OutputFormat;
  name: string;
  mimeType: string;
  extension: string;
  supportsQuality: boolean;
  supportsTransparency: boolean;
  browserSupport: {
    chrome: string;
    firefox: string;
    safari: string;
    edge: string;
  };
  description: string;
  useCase: string;
  recommended: boolean;
}
