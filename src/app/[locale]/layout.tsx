import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Image Converter",
    default: "Free Online Image Converter",
  },
  description:
    "Convert images to WebP, AVIF, PNG, JPEG. Fast, free, and private - all processing happens in your browser.",
  keywords: [
    "image converter",
    "webp converter",
    "avif converter",
    "online image tool",
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
