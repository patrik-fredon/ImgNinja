import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  const locales = ["en", "cs"];
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: `${t("title")} - Image Converter`,
    description: t("metaDescription"),
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = useTranslations("privacy");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-gray-600 mb-6">{t("subtitle")}</p>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Client-Side Processing Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("clientSide.title")}</h2>
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">{t("clientSide.guarantee")}</p>
              </div>
            </div>
          </div>
          <p className="text-gray-700 mb-4">{t("clientSide.description")}</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>{t("clientSide.point1")}</li>
            <li>{t("clientSide.point2")}</li>
            <li>{t("clientSide.point3")}</li>
            <li>{t("clientSide.point4")}</li>
          </ul>
        </section>

        {/* Data Handling Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("dataHandling.title")}</h2>
          <p className="text-gray-700 mb-4">{t("dataHandling.description")}</p>

          <h3 className="text-xl font-medium mb-3">{t("dataHandling.browserStorage.title")}</h3>
          <p className="text-gray-700 mb-4">{t("dataHandling.browserStorage.description")}</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>{t("dataHandling.browserStorage.point1")}</li>
            <li>{t("dataHandling.browserStorage.point2")}</li>
            <li>{t("dataHandling.browserStorage.point3")}</li>
            <li>{t("dataHandling.browserStorage.point4")}</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">{t("dataHandling.dataClearing.title")}</h3>
          <p className="text-gray-700 mb-4">{t("dataHandling.dataClearing.description")}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">
              {t("dataHandling.dataClearing.howTo.title")}
            </h4>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>{t("dataHandling.dataClearing.howTo.step1")}</li>
              <li>{t("dataHandling.dataClearing.howTo.step2")}</li>
              <li>{t("dataHandling.dataClearing.howTo.step3")}</li>
              <li>{t("dataHandling.dataClearing.howTo.step4")}</li>
            </ol>
          </div>
        </section>

        {/* Third-Party Integrations Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("thirdParty.title")}</h2>
          <p className="text-gray-700 mb-4">{t("thirdParty.description")}</p>

          <h3 className="text-xl font-medium mb-3">{t("thirdParty.googleAds.title")}</h3>
          <p className="text-gray-700 mb-4">{t("thirdParty.googleAds.description")}</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>{t("thirdParty.googleAds.point1")}</li>
            <li>{t("thirdParty.googleAds.point2")}</li>
            <li>{t("thirdParty.googleAds.point3")}</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">{t("thirdParty.analytics.title")}</h3>
          <p className="text-gray-700 mb-4">{t("thirdParty.analytics.description")}</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>{t("thirdParty.analytics.point1")}</li>
            <li>{t("thirdParty.analytics.point2")}</li>
            <li>{t("thirdParty.analytics.point3")}</li>
          </ul>
        </section>

        {/* Technical Implementation Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("technical.title")}</h2>
          <p className="text-gray-700 mb-4">{t("technical.description")}</p>

          <h3 className="text-xl font-medium mb-3">{t("technical.webWorkers.title")}</h3>
          <p className="text-gray-700 mb-4">{t("technical.webWorkers.description")}</p>

          <h3 className="text-xl font-medium mb-3">{t("technical.canvasApi.title")}</h3>
          <p className="text-gray-700 mb-4">{t("technical.canvasApi.description")}</p>

          <h3 className="text-xl font-medium mb-3">{t("technical.fileApi.title")}</h3>
          <p className="text-gray-700 mb-4">{t("technical.fileApi.description")}</p>
        </section>

        {/* User Rights Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("userRights.title")}</h2>
          <p className="text-gray-700 mb-4">{t("userRights.description")}</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>{t("userRights.point1")}</li>
            <li>{t("userRights.point2")}</li>
            <li>{t("userRights.point3")}</li>
            <li>{t("userRights.point4")}</li>
          </ul>
        </section>

        {/* Security Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("security.title")}</h2>
          <p className="text-gray-700 mb-4">{t("security.description")}</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>{t("security.point1")}</li>
            <li>{t("security.point2")}</li>
            <li>{t("security.point3")}</li>
            <li>{t("security.point4")}</li>
          </ul>
        </section>

        {/* Contact Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t("contact.title")}</h2>
          <p className="text-gray-700 mb-4">{t("contact.description")}</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700">{t("contact.info")}</p>
          </div>
        </section>

        {/* Last Updated */}
        <section className="border-t pt-6">
          <p className="text-sm text-gray-500">{t("lastUpdated")}</p>
        </section>
      </div>
    </div>
  );
}
