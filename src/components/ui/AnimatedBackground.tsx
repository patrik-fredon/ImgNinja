import { HTMLAttributes, forwardRef } from "react";

interface AnimatedBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "gradient" | "particles" | "hero" | "subtle";
  particleCount?: number;
  speed?: "slow" | "normal" | "fast";
}

const AnimatedBackground = forwardRef<HTMLDivElement, AnimatedBackgroundProps>(
  (
    {
      className = "",
      variant = "gradient",
      particleCount = 20,
      speed = "normal",
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = "relative overflow-hidden";

    const variantClasses = {
      gradient: "bg-gradient-animated",
      particles: "bg-gradient-hero",
      hero: "bg-gradient-hero",
      subtle: "bg-gradient-brand",
    };

    const speedClasses = {
      slow: "[&_.particle]:animate-[particle-float_8s_ease-in-out_infinite]",
      normal: "[&_.particle]:animate-[particle-float_6s_ease-in-out_infinite]",
      fast: "[&_.particle]:animate-[particle-float_4s_ease-in-out_infinite]",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${speedClasses[speed]} ${className}`;

    const renderParticles = () => {
      if (variant !== "particles" && variant !== "hero") return null;

      return Array.from({ length: particleCount }, (_, i) => (
        <div
          key={i}
          className="particle absolute w-2 h-2 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
          }}
        />
      ));
    };

    return (
      <div ref={ref} className={classes} {...props}>
        {renderParticles()}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

AnimatedBackground.displayName = "AnimatedBackground";

export { AnimatedBackground };
export type { AnimatedBackgroundProps };
