import { HTMLAttributes, forwardRef, ElementType } from "react";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: "hero" | "title" | "subtitle" | "body-lg" | "body" | "body-sm";
  as?: ElementType;
  color?: "default" | "white" | "muted" | "accent" | "success" | "warning" | "error";
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className = "", variant = "body", as, color = "default", children, ...props }, ref) => {
    const variantClasses = {
      hero: "text-hero",
      title: "text-title",
      subtitle: "text-subtitle",
      "body-lg": "text-body-lg",
      body: "text-body",
      "body-sm": "text-body-sm",
    };

    const colorClasses = {
      default: "text-gray-900",
      white: "text-white drop-shadow-sm",
      muted: "text-gray-600",
      accent: "text-transparent bg-clip-text bg-gradient-brand",
      success: "text-green-600",
      warning: "text-yellow-600",
      error: "text-red-600",
    };

    const defaultElements = {
      hero: "h1",
      title: "h2",
      subtitle: "h3",
      "body-lg": "p",
      body: "p",
      "body-sm": "p",
    };

    const Component = as || defaultElements[variant];
    const classes = `${variantClasses[variant]} ${colorClasses[color]} ${className}`;

    return (
      <Component ref={ref} className={classes} {...props}>
        {children}
      </Component>
    );
  }
);

Typography.displayName = "Typography";

export { Typography };
export type { TypographyProps };
