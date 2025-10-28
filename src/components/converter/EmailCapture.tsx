"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface EmailCaptureProps {
  trigger?: "conversion" | "visit" | "manual";
  showAfterConversions?: number;
  className?: string;
  onEmailCaptured?: (email: string, preferences: EmailPreferences) => void;
}

interface EmailPreferences {
  tips: boolean;
  updates: boolean;
  newsletter: boolean;
  frequency: "weekly" | "monthly" | "quarterly";
}

interface EmailCaptureState {
  email: string;
  preferences: EmailPreferences;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
  showForm: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  tips: true,
  updates: false,
  newsletter: false,
  frequency: "monthly",
};

export function EmailCapture({
  trigger = "manual",
  showAfterConversions = 3,
  className = "",
  onEmailCaptured,
}: EmailCaptureProps) {
  const t = useTranslations();
  const [state, setState] = useState<EmailCaptureState>({
    email: "",
    preferences: DEFAULT_PREFERENCES,
    isSubmitting: false,
    isSubmitted: false,
    error: null,
    showForm: false,
  });

  useEffect(() => {
    if (trigger === "conversion") {
      checkConversionTrigger();
    } else if (trigger === "visit") {
      checkVisitTrigger();
    } else {
      setState((prev) => ({ ...prev, showForm: true }));
    }
  }, [trigger, showAfterConversions]);

  const checkConversionTrigger = () => {
    try {
      const conversions = localStorage.getItem("imgninja_conversion_count");
      const count = conversions ? parseInt(conversions) : 0;
      const emailCaptured = localStorage.getItem("imgninja_email_captured");

      if (count >= showAfterConversions && !emailCaptured) {
        setState((prev) => ({ ...prev, showForm: true }));
      }
    } catch (error) {
      console.error("Failed to check conversion trigger:", error);
    }
  };

  const checkVisitTrigger = () => {
    try {
      const visits = localStorage.getItem("imgninja_visit_count");
      const count = visits ? parseInt(visits) : 0;
      const emailCaptured = localStorage.getItem("imgninja_email_captured");

      if (count >= 3 && !emailCaptured) {
        setState((prev) => ({ ...prev, showForm: true }));
      }
    } catch (error) {
      console.error("Failed to check visit trigger:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email || !isValidEmail(state.email)) {
      setState((prev) => ({
        ...prev,
        error: "Please enter a valid email address",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Simulate API call - replace with actual implementation
      await submitEmail(state.email, state.preferences);

      // Mark as captured in localStorage
      localStorage.setItem("imgninja_email_captured", "true");
      localStorage.setItem("imgninja_email_preferences", JSON.stringify(state.preferences));

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        isSubmitted: true,
      }));

      onEmailCaptured?.(state.email, state.preferences);

      // Auto-hide after success
      setTimeout(() => {
        setState((prev) => ({ ...prev, showForm: false }));
      }, 3000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: "Failed to subscribe. Please try again.",
      }));
    }
  };

  const handleDismiss = () => {
    setState((prev) => ({ ...prev, showForm: false }));
    // Remember dismissal for this session
    sessionStorage.setItem("imgninja_email_dismissed", "true");
  };

  const updatePreference = <K extends keyof EmailPreferences>(
    key: K,
    value: EmailPreferences[K]
  ) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  };

  if (!state.showForm) {
    return null;
  }

  if (state.isSubmitted) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="p-6 text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Thank you for subscribing!</h3>
          <p className="text-green-700">
            You'll receive helpful tips and updates based on your preferences.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-brand-200 bg-linear-to-br from-brand-50 to-blue-50`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-brand-900">Get Image Optimization Tips</CardTitle>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-xl"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-brand-800 mb-4">
              Join thousands of users who receive expert tips on image optimization, new features,
              and best practices for web performance.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={state.email}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    email: e.target.value,
                    error: null,
                  }))
                }
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          {/* Email Preferences */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">What would you like to receive?</h4>
            <div className="space-y-2">
              {[
                {
                  key: "tips",
                  label: "Optimization tips and tutorials",
                  description: "Learn how to get the best results",
                },
                {
                  key: "updates",
                  label: "Product updates and new features",
                  description: "Be first to know about improvements",
                },
                {
                  key: "newsletter",
                  label: "Monthly newsletter",
                  description: "Industry insights and trends",
                },
              ].map((option) => (
                <label key={option.key} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={state.preferences[option.key as keyof EmailPreferences] as boolean}
                    onChange={(e) =>
                      updatePreference(
                        option.key as keyof EmailPreferences,
                        e.target.checked as any
                      )
                    }
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Frequency</label>
            <select
              value={state.preferences.frequency}
              onChange={(e) =>
                updatePreference("frequency", e.target.value as EmailPreferences["frequency"])
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          {state.error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{state.error}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={state.isSubmitting} className="flex-1">
              {state.isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
            <Button type="button" variant="outline" onClick={handleDismiss}>
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

// Utility functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function submitEmail(email: string, preferences: EmailPreferences): Promise<void> {
  // Simulate API call - replace with actual implementation
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate success/failure
      if (Math.random() > 0.1) {
        // 90% success rate
        resolve();
      } else {
        reject(new Error("Network error"));
      }
    }, 1000);
  });
}

// Hook to track conversions for trigger
export function useConversionTracking() {
  const incrementConversionCount = () => {
    try {
      const current = localStorage.getItem("imgninja_conversion_count");
      const count = current ? parseInt(current) : 0;
      localStorage.setItem("imgninja_conversion_count", (count + 1).toString());
    } catch (error) {
      console.error("Failed to track conversion:", error);
    }
  };

  const incrementVisitCount = () => {
    try {
      const current = localStorage.getItem("imgninja_visit_count");
      const count = current ? parseInt(current) : 0;
      localStorage.setItem("imgninja_visit_count", (count + 1).toString());
    } catch (error) {
      console.error("Failed to track visit:", error);
    }
  };

  return { incrementConversionCount, incrementVisitCount };
}
