"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AdPlacement } from "./AdPlacement";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const switchLanguage = (newLocale: string) => {
    const currentPath = pathname.replace(`/${locale}`, "");
    router.push(`/${newLocale}${currentPath}`);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Ad Placement */}
        <div className="flex justify-center mb-4 mt-4">
          <AdPlacement
            slot="header"
            adUnitId={process.env.NEXT_PUBLIC_GOOGLE_ADS_HEADER_SLOT}
            className="mx-auto"
          />
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">ImgNinja</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              {t("layout.header.home")}
            </button>
            <button
              onClick={() => router.push(`/${locale}/formats`)}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              {t("layout.header.formats")}
            </button>
            <button
              onClick={() => router.push(`/${locale}/privacy`)}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              {t("layout.header.privacy")}
            </button>
          </nav>

          {/* Language Switcher & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => switchLanguage("cs")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  locale === "cs"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                CS
              </button>
              <button
                onClick={() => switchLanguage("en")}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  locale === "en"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                EN
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  router.push(`/${locale}`);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                {t("layout.header.home")}
              </button>
              <button
                onClick={() => {
                  router.push(`/${locale}/formats`);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                {t("layout.header.formats")}
              </button>
              <button
                onClick={() => {
                  router.push(`/${locale}/privacy`);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                {t("layout.header.privacy")}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
