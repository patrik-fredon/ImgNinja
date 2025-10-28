"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { MicroInteraction } from "@/components/ui/MicroInteraction";
import { Typography } from "@/components/ui/Typography";

interface HeroSectionProps {
  onGetStarted: () => void;
  ctaVariant?: "gradient" | "glassmorphic" | "animated";
}

export function HeroSection({
  onGetStarted,
  ctaVariant = "gradient",
}: HeroSectionProps) {
  const t = useTranslations();
  const [currentStat, setCurrentStat] = useState(0);

  // Social proof statistics
  const stats = [
    { number: "2M+", label: t("hero.stats.conversions") },
    { number: "500K+", label: t("hero.stats.users") },
    { number: "99.9%", label: t("hero.stats.privacy") },
    { number: "0s", label: t("hero.stats.uploads") },
  ];

  // Rotate statistics every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [stats.length]);

  const renderCTA = () => {
    const baseClasses =
      "px-8 py-4 text-lg font-semibold transition-all duration-300";

    switch (ctaVariant) {
      case "glassmorphic":
        return (
          <GlassButton
            variant="primary"
            size="lg"
            onClick={onGetStarted}
            className={`${baseClasses} animate-pulse-glow`}
          >
            {t("hero.cta.primary")}
          </GlassButton>
        );

      case "animated":
        return (
          <MicroInteraction effect="lift">
            <button
              onClick={onGetStarted}
              className={`${baseClasses} bg-gradient-animated text-white rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105`}
            >
              {t("hero.cta.primary")}
            </button>
          </MicroInteraction>
        );

      default:
        return (
          <button
            onClick={onGetStarted}
            className={`${baseClasses} bg-gradient-brand text-white rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 hover:bg-gradient-accent`}
          >
            {t("hero.cta.primary")}
          </button>
        );
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground variant="particles" className="absolute inset-0" />

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-brand rounded-full opacity-20 animate-float" />
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-gradient-accent rounded-full opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-12 h-12 bg-gradient-success rounded-full opacity-25 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-20 right-1/3 w-24 h-24 bg-gradient-brand rounded-full opacity-15 animate-float"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Hero Title */}
        <MicroInteraction effect="scale">
          <Typography
            variant="hero"
            className="mb-6 bg-gradient-brand bg-clip-text text-transparent animate-slide-in-up"
          >
            {t("hero.title")}
          </Typography>
        </MicroInteraction>

        {/* Hero Subtitle */}
        <Typography
          variant="subtitle"
          className="mb-8 text-gray-600 max-w-3xl mx-auto animate-slide-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {t("hero.subtitle")}
        </Typography>

        {/* Value Proposition Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          <MicroInteraction effect="lift">
            <GlassCard variant="light" className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-brand rounded-lg mx-auto mb-4 flex items-center justify-center">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <Typography variant="body" className="font-semibold mb-2">
                {t("hero.features.privacy.title")}
              </Typography>
              <Typography variant="body" className="text-gray-600 text-sm">
                {t("hero.features.privacy.description")}
              </Typography>
            </GlassCard>
          </MicroInteraction>

          <MicroInteraction effect="lift">
            <GlassCard variant="light" className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <Typography variant="body" className="font-semibold mb-2">
                {t("hero.features.speed.title")}
              </Typography>
              <Typography variant="body" className="text-gray-600 text-sm">
                {t("hero.features.speed.description")}
              </Typography>
            </GlassCard>
          </MicroInteraction>

          <MicroInteraction effect="lift">
            <GlassCard variant="light" className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-success rounded-lg mx-auto mb-4 flex items-center justify-center">
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <Typography variant="body" className="font-semibold mb-2">
                {t("hero.features.quality.title")}
              </Typography>
              <Typography variant="body" className="text-gray-600 text-sm">
                {t("hero.features.quality.description")}
              </Typography>
            </GlassCard>
          </MicroInteraction>
        </div>

        {/* Social Proof Statistics */}
        <div
          className="mb-12 animate-slide-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <GlassCard variant="default" className="p-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-2 animate-pulse-glow">
                {stats[currentStat].number}
              </div>
              <div className="text-gray-600 text-sm">
                {stats[currentStat].label}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in-up"
          style={{ animationDelay: "0.8s" }}
        >
          {renderCTA()}

          <MicroInteraction effect="glow">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              {t("hero.cta.secondary")}
            </button>
          </MicroInteraction>
        </div>

        {/* Trust Indicators */}
        <div
          className="mt-12 animate-slide-in-up"
          style={{ animationDelay: "1s" }}
        >
          <Typography variant="body" className="text-gray-500 text-sm mb-4">
            {t("hero.trust.title")}
          </Typography>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-xs font-semibold text-gray-400">WebP</div>
            <div className="text-xs font-semibold text-gray-400">AVIF</div>
            <div className="text-xs font-semibold text-gray-400">PNG</div>
            <div className="text-xs font-semibold text-gray-400">JPEG</div>
            <div className="text-xs font-semibold text-gray-400">GIF</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <MicroInteraction effect="pulse">
          <button
            onClick={onGetStarted}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </MicroInteraction>
      </div>
    </section>
  );
}
