import { HTMLAttributes, forwardRef } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "light" | "dark";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className = "",
      variant = "default",
      padding = "md",
      hover = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = "rounded-xl transition-all duration-300 ease-out";

    const variantClasses = {
      default: "glass",
      light: "glass-light",
      dark: "glass-dark",
    };

    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    const hoverClass = hover ? "glass-hover" : "";

    const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`;

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

interface GlassCardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const GlassCardHeader = forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

GlassCardHeader.displayName = "GlassCardHeader";

interface GlassCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const GlassCardTitle = forwardRef<HTMLHeadingElement, GlassCardTitleProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-lg font-semibold leading-none tracking-tight text-white drop-shadow-sm ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

GlassCardTitle.displayName = "GlassCardTitle";

interface GlassCardDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {}

const GlassCardDescription = forwardRef<
  HTMLParagraphElement,
  GlassCardDescriptionProps
>(({ className = "", children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-white/80 drop-shadow-sm ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});

GlassCardDescription.displayName = "GlassCardDescription";

interface GlassCardContentProps extends HTMLAttributes<HTMLDivElement> {}

const GlassCardContent = forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

GlassCardContent.displayName = "GlassCardContent";

interface GlassCardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const GlassCardFooter = forwardRef<HTMLDivElement, GlassCardFooterProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-4 flex items-center ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCardFooter.displayName = "GlassCardFooter";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
};
export type {
  GlassCardProps,
  GlassCardHeaderProps,
  GlassCardTitleProps,
  GlassCardDescriptionProps,
  GlassCardContentProps,
  GlassCardFooterProps,
};
