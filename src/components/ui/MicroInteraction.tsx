import { HTMLAttributes, forwardRef } from "react";

interface MicroInteractionProps extends HTMLAttributes<HTMLDivElement> {
  effect?: "lift" | "scale" | "glow" | "float" | "shimmer" | "pulse";
  intensity?: "subtle" | "normal" | "strong";
  disabled?: boolean;
}

const MicroInteraction = forwardRef<HTMLDivElement, MicroInteractionProps>(
  (
    {
      className = "",
      effect = "lift",
      intensity = "normal",
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    if (disabled) {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      );
    }

    const baseClasses = "micro-interaction";

    const effectClasses = {
      lift:
        intensity === "subtle"
          ? "hover:translate-y-[-1px] hover:shadow-sm"
          : intensity === "strong"
          ? "hover-lift hover:shadow-xl"
          : "hover:translate-y-[-2px] hover:shadow-md",
      scale:
        intensity === "subtle"
          ? "hover:scale-[1.02]"
          : intensity === "strong"
          ? "hover:scale-110"
          : "hover-scale",
      glow:
        intensity === "subtle"
          ? "hover:shadow-[0_0_10px_rgba(102,126,234,0.2)]"
          : intensity === "strong"
          ? "hover:shadow-[0_0_30px_rgba(102,126,234,0.6)]"
          : "hover-glow",
      float: "animate-float",
      shimmer: "animate-shimmer",
      pulse:
        intensity === "subtle" ? "hover:animate-pulse" : "animate-pulse-glow",
    };

    const classes = `${baseClasses} ${effectClasses[effect]} ${className}`;

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

MicroInteraction.displayName = "MicroInteraction";

export { MicroInteraction };
export type { MicroInteractionProps };
