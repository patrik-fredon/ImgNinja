// Error handling utilities and recovery strategies

import type { OutputFormat } from '@/types/formats';
import {
  AppError,
  ErrorCode,
  ErrorWithRecovery,
  ImageConverterError,
  createValidationError,
  createConversionError,
  createBrowserError,
  createFileError,
  getErrorSeverity
} from './types';

// Error message mapping for user-friendly display
export function getErrorMessage(code: ErrorCode, context?: Record<string, any>): string {
  switch (code) {
    case 'INVALID_FILE_TYPE':
      return `Unsupported file type${context?.fileType ? `: ${context.fileType}` : ''}. Please select a valid image file.`;

    case 'FILE_TOO_LARGE':
      return `File is too large${context?.fileSize ? ` (${Math.round(context.fileSize / 1024 / 1024)}MB)` : ''}. Maximum size is 50MB.`;

    case 'INVALID_FILE':
      return 'Invalid or corrupted file. Please select a different image.';

    case 'TOO_MANY_FILES':
      return `Too many files selected${context?.count ? ` (${context.count})` : ''}. Maximum is 10 files.`;

    case 'CONVERSION_FAILED':
      return 'Image conversion failed. Please try again or select a different format.';

    case 'CANVAS_ERROR':
      return 'Browser canvas error occurred during conversion. Try refreshing the page.';

    case 'WORKER_ERROR':
      return 'Background processing error. Conversion will continue without Web Worker support.';

    case 'MEMORY_ERROR':
      return 'Not enough memory to process this image. Try a smaller file or close other browser tabs.';

    case 'TIMEOUT_ERROR':
      return 'Conversion took too long and was cancelled. Try a smaller image or different format.';

    case 'UNSUPPORTED_FORMAT':
      return `${context?.format || 'This format'} is not supported by your browser. Try a different output format.`;

    case 'BROWSER_NOT_SUPPORTED':
      return 'Your browser does not support the required features. Please update your browser or try a different one.';

    case 'FEATURE_NOT_AVAILABLE':
      return `${context?.feature || 'This feature'} is not available in your browser. Some functionality may be limited.`;

    case 'WEBWORKER_NOT_SUPPORTED':
      return 'Web Workers are not supported. Conversion will run on the main thread and may be slower.';

    case 'FILE_READ_ERROR':
      return 'Could not read the selected file. Please try selecting it again.';

    case 'FILE_CORRUPT':
      return 'The selected file appears to be corrupted or damaged. Please try a different image.';

    case 'DOWNLOAD_ERROR':
      return 'Failed to download the converted image. Please try again.';

    case 'NETWORK_ERROR':
      return 'Network connection error. Please check your internet connection.';

    case 'QUOTA_EXCEEDED':
      return 'Browser storage quota exceeded. Please clear some space or close other tabs.';

    case 'PERMISSION_DENIED':
      return 'Permission denied. Please allow the required permissions and try again.';

    case 'UNKNOWN_ERROR':
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Error details for technical information
export function getErrorDetails(code: ErrorCode, originalError?: Error): string | undefined {
  if (originalError) {
    return `Technical details: ${originalError.message}`;
  }

  switch (code) {
    case 'CANVAS_ERROR':
      return 'The HTML5 Canvas API failed to process the image. This may be due to browser limitations or corrupted image data.';

    case 'WORKER_ERROR':
      return 'Web Worker thread encountered an error during background processing. Fallback to main thread processing.';

    case 'MEMORY_ERROR':
      return 'Insufficient memory available for image processing. Large images require significant memory resources.';

    case 'BROWSER_NOT_SUPPORTED':
      return 'Required APIs: Canvas API, File API, Blob API. Web Workers and OffscreenCanvas recommended for optimal performance.';

    case 'UNSUPPORTED_FORMAT':
      return 'Format support varies by browser. WebP and AVIF require modern browsers.';

    default:
      return undefined;
  }
}

// Recovery actions for different error types
export function getRecoveryActions(error: AppError, context?: {
  onRetry?: () => void;
  onSelectDifferentFile?: () => void;
  onChangeFormat?: (format: OutputFormat) => void;
  onReduceQuality?: () => void;
  onClearFiles?: () => void;
  availableFormats?: OutputFormat[];
}): ErrorWithRecovery['recoveryActions'] {
  const actions: ErrorWithRecovery['recoveryActions'] = [];

  switch (error.code) {
    case 'INVALID_FILE_TYPE':
    case 'FILE_CORRUPT':
    case 'INVALID_FILE':
      if (context?.onSelectDifferentFile) {
        actions.push({
          label: 'Select Different File',
          action: context.onSelectDifferentFile,
          variant: 'primary',
        });
      }
      break;

    case 'FILE_TOO_LARGE':
      if (context?.onSelectDifferentFile) {
        actions.push({
          label: 'Select Smaller File',
          action: context.onSelectDifferentFile,
          variant: 'primary',
        });
      }
      if (context?.onReduceQuality) {
        actions.push({
          label: 'Reduce Quality',
          action: context.onReduceQuality,
          variant: 'secondary',
        });
      }
      break;

    case 'TOO_MANY_FILES':
      if (context?.onClearFiles) {
        actions.push({
          label: 'Clear All Files',
          action: context.onClearFiles,
          variant: 'primary',
        });
      }
      break;

    case 'UNSUPPORTED_FORMAT':
      if (context?.onChangeFormat && context?.availableFormats) {
        const fallbackFormat = context.availableFormats.find(f => f === 'jpeg') || context.availableFormats[0];
        if (fallbackFormat) {
          actions.push({
            label: `Try ${fallbackFormat.toUpperCase()}`,
            action: () => context.onChangeFormat!(fallbackFormat),
            variant: 'primary',
          });
        }
      }
      break;

    case 'MEMORY_ERROR':
      actions.push({
        label: 'Close Other Tabs',
        action: () => {
          alert('Please close other browser tabs to free up memory, then try again.');
        },
        variant: 'secondary',
      });
      if (context?.onReduceQuality) {
        actions.push({
          label: 'Reduce Quality',
          action: context.onReduceQuality,
          variant: 'primary',
        });
      }
      break;

    case 'CONVERSION_FAILED':
    case 'CANVAS_ERROR':
    case 'TIMEOUT_ERROR':
      if (context?.onRetry) {
        actions.push({
          label: 'Try Again',
          action: context.onRetry,
          variant: 'primary',
        });
      }
      if (context?.onChangeFormat && context?.availableFormats) {
        const fallbackFormat = context.availableFormats.find(f => f === 'png') || context.availableFormats[0];
        if (fallbackFormat) {
          actions.push({
            label: `Try ${fallbackFormat.toUpperCase()}`,
            action: () => context.onChangeFormat!(fallbackFormat),
            variant: 'secondary',
          });
        }
      }
      break;

    case 'BROWSER_NOT_SUPPORTED':
      actions.push({
        label: 'Update Browser',
        action: () => {
          window.open('https://browsehappy.com/', '_blank');
        },
        variant: 'primary',
      });
      break;

    case 'DOWNLOAD_ERROR':
      if (context?.onRetry) {
        actions.push({
          label: 'Try Download Again',
          action: context.onRetry,
          variant: 'primary',
        });
      }
      break;
  }

  return actions.length > 0 ? actions : undefined;
}

// Convert generic errors to ImageConverterError
export function handleGenericError(error: unknown, context?: Record<string, any>): ImageConverterError {
  if (error instanceof ImageConverterError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to categorize the error based on the message
    const message = error.message.toLowerCase();

    if (message.includes('canvas') || message.includes('context')) {
      return createConversionError('CANVAS_ERROR', 'Canvas processing failed', error.message, context, error);
    }

    if (message.includes('worker') || message.includes('thread')) {
      return createConversionError('WORKER_ERROR', 'Web Worker error', error.message, context, error);
    }

    if (message.includes('memory') || message.includes('allocation')) {
      return createConversionError('MEMORY_ERROR', 'Memory error', error.message, context, error);
    }

    if (message.includes('timeout') || message.includes('time')) {
      return createConversionError('TIMEOUT_ERROR', 'Operation timeout', error.message, context, error);
    }

    if (message.includes('file') || message.includes('read')) {
      return createFileError('FILE_READ_ERROR', 'File reading failed', error.message, context, error);
    }

    if (message.includes('network') || message.includes('fetch')) {
      return new ImageConverterError('NETWORK_ERROR', 'Network error', error.message, context, error);
    }

    if (message.includes('quota') || message.includes('storage')) {
      return new ImageConverterError('QUOTA_EXCEEDED', 'Storage quota exceeded', error.message, context, error);
    }

    if (message.includes('permission') || message.includes('denied')) {
      return new ImageConverterError('PERMISSION_DENIED', 'Permission denied', error.message, context, error);
    }

    // Generic conversion error for unrecognized Error objects
    return createConversionError('CONVERSION_FAILED', 'Conversion failed', error.message, context, error);
  }

  // Handle non-Error objects
  const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
  return new ImageConverterError('UNKNOWN_ERROR', errorMessage, undefined, context);
}

// Error logging (for development and debugging)
export function logError(error: AppError): void {
  if (process.env.NODE_ENV === 'development') {
    const severity = getErrorSeverity(error);
    const logMethod = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';

    console[logMethod]('ImageConverter Error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString(),
      originalError: error.originalError,
    });
  }
}