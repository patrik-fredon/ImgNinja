"use client";

import { useErrors } from "@/lib/errors/context";
import { ErrorDisplay } from "./ErrorDisplay";
import {
  isValidationError,
  isConversionError,
  isBrowserError,
  isFileError,
} from "@/lib/errors/types";

export function ErrorList() {
  const { errors, removeError } = useErrors();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {errors.map((error, index) => {
        let errorType:
          | "validation"
          | "conversion"
          | "browser"
          | "file"
          | "network"
          | "generic" = "generic";

        if (isValidationError(error)) {
          errorType = "validation";
        } else if (isConversionError(error)) {
          errorType = "conversion";
        } else if (isBrowserError(error)) {
          errorType = "browser";
        } else if (isFileError(error)) {
          errorType = "file";
        } else if (error.code === "NETWORK_ERROR") {
          errorType = "network";
        }

        return (
          <ErrorDisplay
            key={`${error.timestamp}-${index}`}
            type={errorType}
            message={error.message}
            details={error.details}
            onDismiss={() => removeError(index)}
            recoveryActions={error.recoveryActions}
          />
        );
      })}
    </div>
  );
}
