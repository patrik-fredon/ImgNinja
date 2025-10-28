import { HTMLAttributes, forwardRef } from "react";

interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "responsive" | "auto-fit" | "auto-fill" | "flex";
  minItemWidth?: string;
  gap?: "sm" | "md" | "lg" | "responsive";
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>(
  (
    {
      className = "",
      variant = "responsive",
      minItemWidth = "280px",
      gap = "responsive",
      columns,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = "w-full";

    const variantClasses = {
      responsive: "grid-responsive",
      "auto-fit": "grid-auto-fit",
      "auto-fill": "grid-auto-fill",
      flex: "flex-responsive",
    };

    const gapClasses = {
      sm: "gap-2 sm:gap-3 md:gap-4",
      md: "gap-3 sm:gap-4 md:gap-6",
      lg: "gap-4 sm:gap-6 md:gap-8",
      responsive: "", // Uses clamp in CSS
    };

    // Custom grid columns if specified
    const customGridStyle = columns
      ? {
          display: "grid",
          gap: gap === "responsive" ? "clamp(1rem, 3vw, 2rem)" : undefined,
          gridTemplateColumns: `repeat(1, 1fr)`,
          "@media (min-width: 640px)": {
            gridTemplateColumns: `repeat(${columns.sm || 2}, 1fr)`,
          },
          "@media (min-width: 768px)": {
            gridTemplateColumns: `repeat(${columns.md || 3}, 1fr)`,
          },
          "@media (min-width: 1024px)": {
            gridTemplateColumns: `repeat(${columns.lg || 4}, 1fr)`,
          },
          "@media (min-width: 1280px)": {
            gridTemplateColumns: `repeat(${
              columns.xl || columns.lg || 4
            }, 1fr)`,
          },
        }
      : undefined;

    // Custom min-width for auto-fit/auto-fill
    const autoGridStyle =
      (variant === "auto-fit" || variant === "auto-fill") &&
      minItemWidth !== "280px"
        ? {
            gridTemplateColumns: `repeat(${variant}, minmax(${minItemWidth}, 1fr))`,
          }
        : undefined;

    const classes = `${baseClasses} ${variantClasses[variant]} ${gapClasses[gap]} ${className}`;

    const style = {
      ...customGridStyle,
      ...autoGridStyle,
      ...props.style,
    };

    return (
      <div ref={ref} className={classes} style={style} {...props}>
        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = "ResponsiveGrid";

export { ResponsiveGrid };
export type { ResponsiveGridProps };
