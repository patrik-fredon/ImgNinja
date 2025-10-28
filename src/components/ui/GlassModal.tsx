import { HTMLAttributes, forwardRef, useEffect } from "react";

interface GlassModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const GlassModal = forwardRef<HTMLDivElement, GlassModalProps>(
  (
    {
      className = "",
      isOpen,
      onClose,
      size = "md",
      closeOnOverlayClick = true,
      showCloseButton = true,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
    };

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
        onClick={handleOverlayClick}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <div
          ref={ref}
          className={`glass-light relative w-full ${sizeClasses[size]} rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 ${className}`}
          {...props}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 glass rounded-full p-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-110"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {children}
        </div>
      </div>
    );
  }
);

GlassModal.displayName = "GlassModal";

interface GlassModalHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const GlassModalHeader = forwardRef<HTMLDivElement, GlassModalHeaderProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mb-6 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

GlassModalHeader.displayName = "GlassModalHeader";

interface GlassModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const GlassModalTitle = forwardRef<HTMLHeadingElement, GlassModalTitleProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={`text-xl font-semibold leading-none tracking-tight text-white drop-shadow-sm ${className}`}
        {...props}
      >
        {children}
      </h2>
    );
  }
);

GlassModalTitle.displayName = "GlassModalTitle";

interface GlassModalDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {}

const GlassModalDescription = forwardRef<
  HTMLParagraphElement,
  GlassModalDescriptionProps
>(({ className = "", children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`mt-2 text-sm text-white/80 drop-shadow-sm ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});

GlassModalDescription.displayName = "GlassModalDescription";

interface GlassModalContentProps extends HTMLAttributes<HTMLDivElement> {}

const GlassModalContent = forwardRef<HTMLDivElement, GlassModalContentProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mb-6 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

GlassModalContent.displayName = "GlassModalContent";

interface GlassModalFooterProps extends HTMLAttributes<HTMLDivElement> {}

const GlassModalFooter = forwardRef<HTMLDivElement, GlassModalFooterProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-end gap-3 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassModalFooter.displayName = "GlassModalFooter";

export {
  GlassModal,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalContent,
  GlassModalFooter,
};
export type {
  GlassModalProps,
  GlassModalHeaderProps,
  GlassModalTitleProps,
  GlassModalDescriptionProps,
  GlassModalContentProps,
  GlassModalFooterProps,
};
