"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { AppError, ErrorWithRecovery } from "./types";
import { getRecoveryActions, logError } from "./handlers";
import type { OutputFormat } from "@/types/formats";

interface ErrorContextValue {
  errors: ErrorWithRecovery[];
  addError: (error: AppError, recoveryContext?: RecoveryContext) => void;
  removeError: (index: number) => void;
  clearErrors: () => void;
}

interface RecoveryContext {
  onRetry?: () => void;
  onSelectDifferentFile?: () => void;
  onChangeFormat?: (format: OutputFormat) => void;
  onReduceQuality?: () => void;
  onClearFiles?: () => void;
  availableFormats?: OutputFormat[];
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorWithRecovery[]>([]);

  const addError = useCallback(
    (error: AppError, recoveryContext?: RecoveryContext) => {
      logError(error);

      const errorWithRecovery: ErrorWithRecovery = {
        ...error,
        recoveryActions: getRecoveryActions(error, recoveryContext),
      };

      setErrors((prev) => [...prev, errorWithRecovery]);
    },
    []
  );

  const removeError = useCallback((index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const value: ErrorContextValue = {
    errors,
    addError,
    removeError,
    clearErrors,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}

export function useErrors() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrors must be used within an ErrorProvider");
  }
  return context;
}

// Hook for handling specific error types with recovery actions
export function useErrorHandler() {
  const { addError } = useErrors();

  const handleValidationError = useCallback(
    (
      error: AppError,
      context?: {
        onSelectDifferentFile?: () => void;
        onClearFiles?: () => void;
        onReduceQuality?: () => void;
      }
    ) => {
      addError(error, context);
    },
    [addError]
  );

  const handleConversionError = useCallback(
    (
      error: AppError,
      context?: {
        onRetry?: () => void;
        onChangeFormat?: (format: OutputFormat) => void;
        availableFormats?: OutputFormat[];
      }
    ) => {
      addError(error, context);
    },
    [addError]
  );

  const handleBrowserError = useCallback(
    (
      error: AppError,
      context?: {
        onChangeFormat?: (format: OutputFormat) => void;
        availableFormats?: OutputFormat[];
      }
    ) => {
      addError(error, context);
    },
    [addError]
  );

  const handleFileError = useCallback(
    (
      error: AppError,
      context?: {
        onSelectDifferentFile?: () => void;
        onRetry?: () => void;
      }
    ) => {
      addError(error, context);
    },
    [addError]
  );

  return {
    handleValidationError,
    handleConversionError,
    handleBrowserError,
    handleFileError,
    addError,
  };
}
