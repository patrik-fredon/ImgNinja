"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { OutputFormat } from "@/types/formats";
import { FORMATS } from "@/lib/converter/formats";

interface UserPreferences {
  defaultFormat: OutputFormat;
  defaultQuality: number;
  autoDownload: boolean;
  showAdvancedOptions: boolean;
  preferredFileNaming: "original" | "timestamp" | "custom";
  customFilePrefix: string;
  maxFileSize: number; // in MB
  enableNotifications: boolean;
  theme: "light" | "dark" | "auto";
  language: "en" | "cs";
  saveHistory: boolean;
  autoOptimize: boolean;
  compressionLevel: "low" | "medium" | "high";
}

interface UserPreferencesProps {
  className?: string;
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultFormat: "webp",
  defaultQuality: 80,
  autoDownload: false,
  showAdvancedOptions: false,
  preferredFileNaming: "original",
  customFilePrefix: "",
  maxFileSize: 10,
  enableNotifications: true,
  theme: "auto",
  language: "en",
  saveHistory: true,
  autoOptimize: true,
  compressionLevel: "medium",
};

export function UserPreferences({ className = "", onPreferencesChange }: UserPreferencesProps) {
  const t = useTranslations();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem("imgninja_user_preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    }
  };

  const savePreferences = (newPreferences: UserPreferences) => {
    try {
      localStorage.setItem("imgninja_user_preferences", JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      setHasChanges(false);
      onPreferencesChange?.(newPreferences);

      // Apply theme immediately
      if (newPreferences.theme !== "auto") {
        document.documentElement.setAttribute("data-theme", newPreferences.theme);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    } catch (error) {
      console.error("Failed to save user preferences:", error);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (confirm("Are you sure you want to reset all preferences to defaults?")) {
      savePreferences(DEFAULT_PREFERENCES);
    }
  };

  const exportPreferences = () => {
    const exportData = {
      preferences,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imgninja_preferences_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.preferences) {
          const importedPrefs = { ...DEFAULT_PREFERENCES, ...data.preferences };
          savePreferences(importedPrefs);
          alert("Preferences imported successfully!");
        }
      } catch (error) {
        alert("Failed to import preferences. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Preferences</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportPreferences}>
              Export
            </Button>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" as="span">
                Import
              </Button>
              <input type="file" accept=".json" onChange={importPreferences} className="hidden" />
            </label>
            <Button size="sm" variant="outline" onClick={resetToDefaults}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Conversion Defaults */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Defaults</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Format</label>
              <select
                value={preferences.defaultFormat}
                onChange={(e) => updatePreference("defaultFormat", e.target.value as OutputFormat)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(FORMATS).map(([format, data]) => (
                  <option key={format} value={format}>
                    {data.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Quality ({preferences.defaultQuality}%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={preferences.defaultQuality}
                onChange={(e) => updatePreference("defaultQuality", parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compression Level
              </label>
              <select
                value={preferences.compressionLevel}
                onChange={(e) =>
                  updatePreference(
                    "compressionLevel",
                    e.target.value as UserPreferences["compressionLevel"]
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="low">Low (Faster, Larger files)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Slower, Smaller files)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max File Size ({preferences.maxFileSize} MB)
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={preferences.maxFileSize}
                onChange={(e) => updatePreference("maxFileSize", parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* File Naming */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Naming</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Naming Convention
              </label>
              <div className="space-y-2">
                {[
                  { value: "original", label: "Keep original name" },
                  { value: "timestamp", label: "Add timestamp" },
                  { value: "custom", label: "Custom prefix" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="fileNaming"
                      value={option.value}
                      checked={preferences.preferredFileNaming === option.value}
                      onChange={(e) =>
                        updatePreference(
                          "preferredFileNaming",
                          e.target.value as UserPreferences["preferredFileNaming"]
                        )
                      }
                      className="mr-2"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {preferences.preferredFileNaming === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prefix
                </label>
                <input
                  type="text"
                  value={preferences.customFilePrefix}
                  onChange={(e) => updatePreference("customFilePrefix", e.target.value)}
                  placeholder="e.g., converted_"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Behavior Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavior</h3>
          <div className="space-y-4">
            {[
              {
                key: "autoDownload",
                label: "Auto-download converted files",
                description: "Automatically start download when conversion completes",
              },
              {
                key: "showAdvancedOptions",
                label: "Show advanced options",
                description: "Display advanced conversion settings by default",
              },
              {
                key: "autoOptimize",
                label: "Auto-optimize settings",
                description: "Automatically suggest optimal settings for each image",
              },
              {
                key: "saveHistory",
                label: "Save conversion history",
                description: "Keep track of your conversions for easy access",
              },
              {
                key: "enableNotifications",
                label: "Enable notifications",
                description: "Show browser notifications for completed conversions",
              },
            ].map((setting) => (
              <div key={setting.key} className="flex items-start">
                <input
                  type="checkbox"
                  id={setting.key}
                  checked={preferences[setting.key as keyof UserPreferences] as boolean}
                  onChange={(e) =>
                    updatePreference(setting.key as keyof UserPreferences, e.target.checked as any)
                  }
                  className="mt-1 mr-3"
                />
                <div>
                  <label htmlFor={setting.key} className="font-medium text-gray-900 cursor-pointer">
                    {setting.label}
                  </label>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) =>
                  updatePreference("theme", e.target.value as UserPreferences["theme"])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) =>
                  updatePreference("language", e.target.value as UserPreferences["language"])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="en">English</option>
                <option value="cs">Čeština</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={() => savePreferences(preferences)}>Save Preferences</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
