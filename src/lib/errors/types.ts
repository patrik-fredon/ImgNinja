// Error types and utilities for the image converter application

export type ErrorCode =
  // Validation errors
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_FILE"
  | "TOO_MANY_FILES"

  // Conversion errors
  | "CONVERSION_FAILED"
  | "BATCH_CONVERSION_FAILED"
  | "ENHANCED_WORKER_ERROR"
  | "CANVAS_ERROR"
  | "WORKER_ERROR"
  | "MEMORY_ERROR"
  | "TIMEOUT_ERROR"

  // Browser compatibility errors
  | "UNSUPPORTED_FORMAT"
  | "BROWSER_NOT_SUPPORTED"
  | "FEATURE_NOT_AVAILABLE"
  | "WEBWORKER_NOT_SUPPORTED"

  // File handling errors
  | "FILE_READ_ERROR"
  | "FILE_CORRUPT"
  | "DOWNLOAD_ERROR"

  // Network/system errors
  | "NETWORK_ERROR"
  | "QUOTA_EXCEEDED"
  | "PERMISSION_DENIED"

  // Generic errors
  | "UNKNOWN_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  originalError?: Error;
  timestamp: number;
  context?: Record<string, any>;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void;
  variant?: "primary" | "secondary";
}

export interface ErrorWithRecovery extends AppError {
  recoveryActions?: ErrorRecoveryAction[];
}

export class ImageConverterError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: string;
  public readonly context?: Record<string, any>;
  public readonly timestamp: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: string,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = "ImageConverterError";
    this.code = code;
    this.details = details;
    this.context = context;
    this.timestamp = Date.now();

    if (originalError) {
      this.stack = originalError.stack;
      this.cause = originalError;
    }
  }

  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      originalError: this.cause as Error,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

// Error factory functions
export function createValidationError(
  code: Extract<
    ErrorCode,
    "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "INVALID_FILE" | "TOO_MANY_FILES"
  >,
  message: string,
  details?: string,
  context?: Record<string, any>
): ImageConverterError {
  return new ImageConverterError(code, message, details, context);
}

export function createConversionError(
  code: Extract<
    ErrorCode,
    "CONVERSION_FAILED" | "BATCH_CONVERSION_FAILED" | "ENHANCED_WORKER_ERROR" | "CANVAS_ERROR" | "WORKER_ERROR" | "MEMORY_ERROR" | "TIMEOUT_ERROR"
  >,
  message: string,
  details?: string,
  context?: Record<string, any>,
  originalError?: Error
): ImageConverterError {
  return new ImageConverterError(code, message, details, context, originalError);
}

export function createBrowserError(
  code: Extract<
    ErrorCode,
    | "UNSUPPORTED_FORMAT"
    | "BROWSER_NOT_SUPPORTED"
    | "FEATURE_NOT_AVAILABLE"
    | "WEBWORKER_NOT_SUPPORTED"
  >,
  message: string,
  details?: string,
  context?: Record<string, any>
): ImageConverterError {
  return new ImageConverterError(code, message, details, context);
}

export function createFileError(
  code: Extract<ErrorCode, "FILE_READ_ERROR" | "FILE_CORRUPT" | "DOWNLOAD_ERROR">,
  message: string,
  details?: string,
  context?: Record<string, any>,
  originalError?: Error
): ImageConverterError {
  return new ImageConverterError(code, message, details, context, originalError);
}

// Error type guards
export function isValidationError(error: AppError): boolean {
  return ["INVALID_FILE_TYPE", "FILE_TOO_LARGE", "INVALID_FILE", "TOO_MANY_FILES"].includes(
    error.code
  );
}

export function isConversionError(error: AppError): boolean {
  return [
    "CONVERSION_FAILED",
    "CANVAS_ERROR",
    "WORKER_ERROR",
    "MEMORY_ERROR",
    "TIMEOUT_ERROR",
  ].includes(error.code);
}

export function isBrowserError(error: AppError): boolean {
  return [
    "UNSUPPORTED_FORMAT",
    "BROWSER_NOT_SUPPORTED",
    "FEATURE_NOT_AVAILABLE",
    "WEBWORKER_NOT_SUPPORTED",
  ].includes(error.code);
}

export function isFileError(error: AppError): boolean {
  return ["FILE_READ_ERROR", "FILE_CORRUPT", "DOWNLOAD_ERROR"].includes(error.code);
}

// Error severity levels
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export function getErrorSeverity(error: AppError): ErrorSeverity {
  switch (error.code) {
    case "INVALID_FILE_TYPE":
    case "FILE_TOO_LARGE":
    case "TOO_MANY_FILES":
      return "low";

    case "UNSUPPORTED_FORMAT":
    case "BROWSER_NOT_SUPPORTED":
    case "FILE_READ_ERROR":
      return "medium";

    case "CONVERSION_FAILED":
    case "CANVAS_ERROR":
    case "WORKER_ERROR":
    case "FILE_CORRUPT":
      return "high";

    case "MEMORY_ERROR":
    case "QUOTA_EXCEEDED":
    case "PERMISSION_DENIED":
    case "UNKNOWN_ERROR":
      return "critical";

    default:
      return "medium";
  }
}
