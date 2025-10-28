import { ButtonHTMLAttributes, forwardRef } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glassVariant?: "default" | "light" | "dark";
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      glassVariant = "default",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation relative overflow-hidden";

    const glassClasses = {
      default: "glass glass-hover",
      light: "glass-light glass-hover",
      dark: "glass-dark glass-hover",
    };

    const variantClasses = {
      primary:
        "text-white shadow-lg hover:shadow-xl focus-visible:ring-white/50",
      secondary:
        "text-white/90 hover:text-white shadow-md hover:shadow-lg focus-visible:ring-white/30",
      accent:
        "text-white shadow-lg hover:shadow-xl focus-visible:ring-pink-300",
      ghost:
        "text-white/80 hover:text-white shadow-sm hover:shadow-md focus-visible:ring-white/20",
    };

    const sizeClasses = {
      sm: "h-10 sm:h-9 px-4 text-sm",
      md: "h-12 sm:h-11 px-5 text-base",
      lg: "h-14 px-8 text-lg",
    };

    const gradientOverlay =
      variant === "primary"
        ? "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/20 before:to-purple-600/20 before:rounded-xl before:transition-opacity before:duration-300 hover:before:opacity-80"
        : variant === "accent"
        ? "before:absolute before:inset-0 before:bg-gradient-to-r before:from-pink-500/20 before:to-red-500/20 before:rounded-xl before:transition-opacity before:duration-300 hover:before:opacity-80"
        : "";

    const classes = `${baseClasses} ${glassClasses[glassVariant]} ${variantClasses[variant]} ${sizeClasses[size]} ${gradientOverlay} ${className}`;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin relative z-10"
            viewBox="0 0 24 24"
          >
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
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton };
export type { GlassButtonProps };
