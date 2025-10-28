"use client";

import { useState, useEffect } from "react";

interface AdBlockerFallbackProps {
  className?: string;
  position: string;
}

export function AdBlockerFallback({ className = "", position }: AdBlockerFallbackProps) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Detect ad blocker by trying to create a fake ad element
    const detectAdBlocker = () => {
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      testAd.className = "adsbox";
      testAd.style.position = "absolute";
      testAd.style.left = "-10000px";
      document.body.appendChild(testAd);

      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0;
        setShowFallback(isBlocked);
        document.body.removeChild(testAd);
      }, 100);
    };

    detectAdBlocker();
  }, []);

  if (!showFallback) {
    return null;
  }

  const getFallbackContent = () => {
    switch (position) {
      case "header":
      case "footer":
        return (
          <div className="bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-800">Support ImgNinja</span>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              We notice you're using an ad blocker. ImgNinja is free thanks to our sponsors.
            </p>
            <button className="text-xs bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Consider Whitelisting Us
            </button>
          </div>
        );

      case "sidebar":
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Helpful Tools</h3>
              <p className="text-xs text-gray-600 mb-3">
                Discover more image editing and optimization tools
              </p>
              <div className="space-y-2">
                <button className="w-full text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors">
                  Image Compressor
                </button>
                <button className="w-full text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors">
                  Batch Converter
                </button>
                <button className="w-full text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors">
                  Format Guide
                </button>
              </div>
            </div>
          </div>
        );

      case "inline":
        return (
          <div className="bg-linear-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">💡 Pro Tip</h4>
                <p className="text-xs text-gray-600 mb-2">
                  For best results, use WebP format for web images - it provides excellent
                  compression with high quality.
                </p>
                <button className="text-xs text-green-700 hover:text-green-800 font-medium">
                  Learn more about formats →
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <span className="text-xs text-gray-500">Content</span>
          </div>
        );
    }
  };

  return <div className={className}>{getFallbackContent()}</div>;
}
