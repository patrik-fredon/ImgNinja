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
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-sm text-gray-700">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gray-200 ${sizeClasses[size]}`}
      >
        <div
          className={`h-full transition-all duration-300 ease-in-out ${variantClasses[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
export type { ProgressProps };
