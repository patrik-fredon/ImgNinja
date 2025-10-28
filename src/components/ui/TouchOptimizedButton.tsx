"use client";

import { ButtonHTMLAttributes, forwardRef, useState } from "react";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface TouchOptimizedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  hapticFeedback?: boolean;
}

const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      hapticFeedback = true,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const { isTouchDevice, isMobile } = useMobileDetection();
    const [isPressed, setIsPressed] = useState(false);

    const handleTouchStart = () => {
      setIsPressed(true);
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(10); // Light haptic feedback
      }
    };

    const handleTouchEnd = () => {
      setIsPressed(false);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(20); // Slightly stronger feedback on click
      }
      onClick?.(e);
    };

    // Enhanced touch target size for mobile
    const touchTargetSize = isMobile ? "min-h-[44px] min-w-[44px]" : "";

    const baseClasses = `
      inline-flex items-center justify-center rounded-xl font-semibold 
      transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
      touch-manipulation select-none ${touchTargetSize}
      ${isPressed && isTouchDevice ? "scale-95" : ""}
      ${isTouchDevice ? "active:scale-95" : "hover:scale-105"}
    `;

    const variantClasses = {
      primary: `
        bg-gradient-brand text-white shadow-md
        ${isTouchDevice ? "active:shadow-lg" : "hover:shadow-lg hover:scale-105"}
        focus-visible:ring-brand-500
      `,
      secondary: `
        bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md
        ${
          isTouchDevice
            ? "active:from-gray-700 active:to-gray-800"
            : "hover:from-gray-700 hover:to-gray-800 hover:shadow-lg"
        }
        focus-visible:ring-gray-500
      `,
      outline: `
        border-2 border-brand-300 bg-white text-brand-700
        ${
          isTouchDevice
            ? "active:bg-brand-50 active:border-brand-400"
            : "hover:bg-brand-50 hover:border-brand-400"
        }
        focus-visible:ring-brand-500
      `,
      ghost: `
        text-brand-700
        ${
          isTouchDevice
            ? "active:bg-brand-50 active:text-brand-800"
            : "hover:bg-brand-50 hover:text-brand-800"
        }
        focus-visible:ring-brand-500
      `,
    };

    const sizeClasses = {
      sm: isMobile ? "h-12 px-4 text-sm" : "h-10 px-4 text-sm",
      md: isMobile ? "h-14 px-5 text-base" : "h-12 px-5 text-base",
      lg: isMobile ? "h-16 px-8 text-lg" : "h-14 px-8 text-lg",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

TouchOptimizedButton.displayName = "TouchOptimizedButton";

export { TouchOptimizedButton };
export type { TouchOptimizedButtonProps };
