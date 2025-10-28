"use client";

import { useTranslations } from "next-intl";
import { Button } from "./Button";
import { Card } from "./Card";

export type ErrorType =
  | "validation"
  | "conversion"
  | "browser"
  | "network"
  | "file"
  | "generic";

export interface ErrorDisplayProps {
  type: ErrorType;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  recoveryActions?: Array<{
    label: string;
    action: () => void;
    variant?: "primary" | "secondary";
  }>;
}

const ERROR_ICONS: Record<ErrorType, string> = {
  validation: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  conversion: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  browser:
    "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  network:
    "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
  file: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  generic:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
};

const ERROR_COLORS: Record<
  ErrorType,
  { bg: string; border: string; text: string; icon: string }
> = {
  validation: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    icon: "text-yellow-600",
  },
  conversion: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: "text-red-600",
  },
  browser: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: "text-blue-600",
  },
  network: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    icon: "text-purple-600",
  },
  file: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    icon: "text-orange-600",
  },
  generic: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    icon: "text-gray-600",
  },
};

export function ErrorDisplay({
  type,
  message,
  details,
  onRetry,
  onDismiss,
  recoveryActions,
}: ErrorDisplayProps) {
  const t = useTranslations("errors");
  const colors = ERROR_COLORS[type];
  const iconPath = ERROR_ICONS[type];

  return (
    <Card className={`p-4 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start space-x-3">
        <div className="shrink-0">
          <svg
            className={`w-5 h-5 ${colors.icon}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={iconPath}
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${colors.text}`}>
            {t(`types.${type}.title`)}
          </h4>
          <p className={`mt-1 text-sm ${colors.text}`}>{message}</p>

          {details && (
            <details className="mt-2">
              <summary
                className={`text-xs font-medium ${colors.text} cursor-pointer`}
              >
                {t("showDetails")}
              </summary>
              <p className={`mt-1 text-xs ${colors.text} opacity-75`}>
                {details}
              </p>
            </details>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {recoveryActions?.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                variant={action.variant === "primary" ? "primary" : "outline"}
                size="sm"
                className={
                  action.variant === "primary"
                    ? ""
                    : `${colors.border} ${colors.text} hover:${colors.bg}`
                }
              >
                {action.label}
              </Button>
            ))}

            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className={`${colors.border} ${colors.text} hover:${colors.bg}`}
              >
                {t("retry")}
              </Button>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`shrink-0 ${colors.text} hover:opacity-75`}
            aria-label={t("dismiss")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </Card>
  );
}

// Convenience components for specific error types
export function ValidationError(props: Omit<ErrorDisplayProps, "type">) {
  return <ErrorDisplay {...props} type="validation" />;
}

export function ConversionError(props: Omit<ErrorDisplayProps, "type">) {
  return <ErrorDisplay {...props} type="conversion" />;
}

export function BrowserError(props: Omit<ErrorDisplayProps, "type">) {
  return <ErrorDisplay {...props} type="browser" />;
}

export function NetworkError(props: Omit<ErrorDisplayProps, "type">) {
  return <ErrorDisplay {...props} type="network" />;
}

export function FileError(props: Omit<ErrorDisplayProps, "type">) {
  return <ErrorDisplay {...props} type="file" />;
}
