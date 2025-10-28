// File validation utilities for image converter
// Validates file type and size before conversion

export const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/webp',
  'image/avif',
] as const;

export const MAX_FILE_SIZE = 52428800; // 50MB in bytes

export type ValidationErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
}

/**
 * Validates file type against accepted MIME types
 */
export function validateFileType(file: File): ValidationResult {
  if (!ACCEPTED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: `Unsupported file type: ${file.type}. Accepted formats: PNG, JPEG, GIF, BMP, TIFF, SVG, WebP, AVIF`,
      },
    };
  }

  return { valid: true };
}

/**
 * Validates file size against maximum limit
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1048576).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / 1048576).toFixed(0);
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size (${sizeMB}MB) exceeds maximum limit of ${maxSizeMB}MB`,
      },
    };
  }

  return { valid: true };
}

/**
 * Validates file for conversion
 * Checks both file type and size
 */
export function validateFile(file: File): ValidationResult {
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_FILE',
        message: 'Invalid file object',
      },
    };
  }

  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Validates multiple files
 * Returns array of validation results in same order as input
 */
export function validateFiles(files: File[]): ValidationResult[] {
  return files.map(validateFile);
}

/**
 * Checks if all files in array are valid
 */
export function areAllFilesValid(files: File[]): boolean {
  return validateFiles(files).every((result) => result.valid);
}
