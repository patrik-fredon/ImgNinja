import { HTMLAttributes } from "react";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
}

function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  className = "",
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variantClasses = {
    default: "bg-gradient-brand",
    success: "bg-gradient-success",
    warning: "bg-gradient-to-r from-yellow-400 to-orange-500",
    error: "bg-gradient-to-r from-red-500 to-pink-600",
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="mb-2 flex justify-between text-sm font-medium text-gray-700">
          <span>Progress</span>
          <span className="text-brand-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gray-200 shadow-inner ${sizeClasses[size]}`}
      >
        <div
          className={`h-full transition-all duration-500 ease-out ${variantClasses[variant]} rounded-full shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
export type { ProgressProps };
