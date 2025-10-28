// File validation utilities for image converter
// Validates file type and size before conversion

import {
  ImageConverterError,
  createValidationError,
  type AppError
} from '@/lib/errors/types';
import { getErrorMessage } from '@/lib/errors/handlers';

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
export const MAX_FILES = 10;

export interface ValidationResult {
  valid: boolean;
  error?: AppError;
}

/**
 * Validates file type against accepted MIME types
 */
export function validateFileType(file: File): ValidationResult {
  if (!ACCEPTED_MIME_TYPES.includes(file.type as any)) {
    const error = createValidationError(
      'INVALID_FILE_TYPE',
      getErrorMessage('INVALID_FILE_TYPE', { fileType: file.type }),
      `Accepted formats: ${ACCEPTED_MIME_TYPES.join(', ')}`,
      { fileType: file.type, fileName: file.name }
    );

    return {
      valid: false,
      error: error.toAppError(),
    };
  }

  return { valid: true };
}

/**
 * Validates file size against maximum limit
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const error = createValidationError(
      'FILE_TOO_LARGE',
      getErrorMessage('FILE_TOO_LARGE', { fileSize: file.size }),
      `Maximum allowed size: ${(MAX_FILE_SIZE / 1048576).toFixed(0)}MB`,
      {
        fileSize: file.size,
        fileName: file.name,
        maxSize: MAX_FILE_SIZE
      }
    );

    return {
      valid: false,
      error: error.toAppError(),
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
    const error = createValidationError(
      'INVALID_FILE',
      getErrorMessage('INVALID_FILE'),
      'File object is null, undefined, or not a valid File instance',
      { file: typeof file }
    );

    return {
      valid: false,
      error: error.toAppError(),
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
  // Check file count limit first
  if (files.length > MAX_FILES) {
    const error = createValidationError(
      'TOO_MANY_FILES',
      getErrorMessage('TOO_MANY_FILES', { count: files.length }),
      `Maximum allowed files: ${MAX_FILES}`,
      { fileCount: files.length, maxFiles: MAX_FILES }
    );

    // Return error for all files if count exceeds limit
    return files.map(() => ({
      valid: false,
      error: error.toAppError(),
    }));
  }

  return files.map(validateFile);
}

/**
 * Checks if all files in array are valid
 */
export function areAllFilesValid(files: File[]): boolean {
  return validateFiles(files).every((result) => result.valid);
}

/**
 * Gets the first validation error from a list of files
 */
export function getFirstValidationError(files: File[]): AppError | null {
  const results = validateFiles(files);
  const firstError = results.find(result => !result.valid);
  return firstError?.error || null;
}
