"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ResponsiveAdContainer } from "@/components/ads/ResponsiveAdContainer";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Links Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => router.push(`/${locale}/privacy`)}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm touch-manipulation min-h-[44px] flex items-center"
            >
              {t("layout.footer.privacy")}
            </button>
            <button
              onClick={() => router.push(`/${locale}/formats`)}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm touch-manipulation min-h-[44px] flex items-center"
            >
              {t("layout.footer.formats")}
            </button>
          </div>

          {/* Copyright Section */}
          <div className="text-sm text-gray-500 mt-2 md:mt-0">
            {t("layout.footer.copyright", { year: currentYear })}
          </div>
        </div>

        {/* Footer Ad Placement */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 flex justify-center px-2">
          <ResponsiveAdContainer
            position="footer"
            adUnitId={process.env.NEXT_PUBLIC_GOOGLE_ADS_FOOTER_SLOT}
            className="mx-auto w-full"
            enableABTesting={true}
            testId="footer-placement-test"
          />
        </div>

        {/* Attribution Section */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
          <div className="text-center text-xs text-gray-400">
            Built with Next.js and Tailwind CSS
          </div>
        </div>
      </div>
    </footer>
  );
}
