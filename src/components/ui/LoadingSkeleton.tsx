interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "card" | "button" | "image" | "progress";
  lines?: number;
}

export function LoadingSkeleton({
  className = "",
  variant = "text",
  lines = 1,
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  switch (variant) {
    case "text":
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseClasses} h-4 ${
                i === lines - 1 ? "w-3/4" : "w-full"
              }`}
            />
          ))}
        </div>
      );

    case "card":
      return (
        <div className={`${baseClasses} p-6 ${className}`}>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      );

    case "button":
      return <div className={`${baseClasses} h-10 w-24 ${className}`} />;

    case "image":
      return <div className={`${baseClasses} aspect-video ${className}`} />;

    case "progress":
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            <div className="h-3 bg-gray-300 rounded w-12"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-gray-300 rounded animate-pulse w-1/3"></div>
          </div>
        </div>
      );

    default:
      return <div className={`${baseClasses} h-4 ${className}`} />;
  }
}
