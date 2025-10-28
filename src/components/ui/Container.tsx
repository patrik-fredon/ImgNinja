import { HTMLAttributes, forwardRef } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "narrow" | "default" | "wide" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "responsive";
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className = "",
      size = "default",
      padding = "responsive",
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      narrow: "container-narrow",
      default: "container-responsive",
      wide: "container-wide",
      full: "w-full",
    };

    const paddingClasses = {
      none: "",
      sm: "px-4",
      md: "px-6",
      lg: "px-8",
      responsive: "", // Uses clamp in CSS class
    };

    const classes = `${sizeClasses[size]} ${paddingClasses[padding]} ${className}`;

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

export { Container };
export type { ContainerProps };
