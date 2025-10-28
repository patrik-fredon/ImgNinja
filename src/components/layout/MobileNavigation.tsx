"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { TouchOptimizedButton } from "@/components/ui/TouchOptimizedButton";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className = "" }: MobileNavigationProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useMobileDetection();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navigation on scroll down, show on scroll up
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobile]);

  if (!isMobile) return null;

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isFormatsPage = pathname.includes("/formats");
  const isPrivacyPage = pathname.includes("/privacy");

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      } ${className}`}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {/* Home */}
        <TouchOptimizedButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}`)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 ${
            isHomePage ? "text-brand-600" : "text-gray-600"
          }`}
          hapticFeedback={true}
        >
          <svg
            className={`w-5 h-5 ${isHomePage ? "text-brand-600" : "text-gray-600"}`}
            fill={isHomePage ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isHomePage ? 0 : 2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs font-medium">{t("layout.header.home")}</span>
        </TouchOptimizedButton>

        {/* Formats */}
        <TouchOptimizedButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/formats`)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 ${
            isFormatsPage ? "text-brand-600" : "text-gray-600"
          }`}
          hapticFeedback={true}
        >
          <svg
            className={`w-5 h-5 ${isFormatsPage ? "text-brand-600" : "text-gray-600"}`}
            fill={isFormatsPage ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isFormatsPage ? 0 : 2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-medium">{t("layout.header.formats")}</span>
        </TouchOptimizedButton>

        {/* Convert Action Button */}
        <div className="flex-1 flex justify-center">
          <TouchOptimizedButton
            variant="primary"
            size="sm"
            onClick={() => {
              if (!isHomePage) {
                router.push(`/${locale}`);
              }
              // Scroll to converter section after navigation
              setTimeout(() => {
                const converterSection = document.getElementById("converter-section");
                if (converterSection) {
                  converterSection.scrollIntoView({ behavior: "smooth" });
                }
              }, 100);
            }}
            className="w-12 h-12 rounded-full bg-gradient-brand shadow-lg"
            hapticFeedback={true}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </TouchOptimizedButton>
        </div>

        {/* Settings/More */}
        <TouchOptimizedButton
          variant="ghost"
          size="sm"
          onClick={() => {
            // Toggle language or show settings menu
            const newLocale = locale === "cs" ? "en" : "cs";
            const currentPath = pathname.replace(`/${locale}`, "");
            router.push(`/${newLocale}${currentPath}`);
          }}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-600"
          hapticFeedback={true}
        >
          <div className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded text-xs font-bold">
            {locale.toUpperCase()}
          </div>
          <span className="text-xs font-medium">Language</span>
        </TouchOptimizedButton>

        {/* Privacy */}
        <TouchOptimizedButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/privacy`)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 ${
            isPrivacyPage ? "text-brand-600" : "text-gray-600"
          }`}
          hapticFeedback={true}
        >
          <svg
            className={`w-5 h-5 ${isPrivacyPage ? "text-brand-600" : "text-gray-600"}`}
            fill={isPrivacyPage ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isPrivacyPage ? 0 : 2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-xs font-medium">{t("layout.header.privacy")}</span>
        </TouchOptimizedButton>
      </div>
    </nav>
  );
}
