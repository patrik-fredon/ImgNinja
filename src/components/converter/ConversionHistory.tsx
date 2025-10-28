"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { OutputFormat } from "@/types/formats";
import { FORMATS } from "@/lib/converter/formats";

interface ConversionHistoryItem {
  id: string;
  fileName: string;
  originalFormat: string;
  targetFormat: OutputFormat;
  originalSize: number;
  convertedSize: number;
  timestamp: Date;
  isFavorite: boolean;
  downloadUrl?: string;
}

interface ConversionHistoryProps {
  className?: string;
}

export function ConversionHistory({ className = "" }: ConversionHistoryProps) {
  const t = useTranslations();
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "favorites" | "recent">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "savings">("date");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem("imgninja_conversion_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        const historyItems = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(historyItems);
      }
    } catch (error) {
      console.error("Failed to load conversion history:", error);
    }
  };

  const saveHistory = (newHistory: ConversionHistoryItem[]) => {
    try {
      localStorage.setItem("imgninja_conversion_history", JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error("Failed to save conversion history:", error);
    }
  };

  const addToHistory = (item: Omit<ConversionHistoryItem, "id" | "timestamp" | "isFavorite">) => {
    const newItem: ConversionHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      isFavorite: false,
    };

    const newHistory = [newItem, ...history].slice(0, 100); // Keep last 100 items
    saveHistory(newHistory);
  };

  const toggleFavorite = (id: string) => {
    const newHistory = history.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    saveHistory(newHistory);
  };

  const removeFromHistory = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    saveHistory(newHistory);
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all conversion history?")) {
      saveHistory([]);
    }
  };

  const exportHistory = () => {
    const exportData = {
      history: history,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imgninja_history_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredHistory = () => {
    let filtered = [...history];

    switch (filter) {
      case "favorites":
        filtered = filtered.filter((item) => item.isFavorite);
        break;
      case "recent":
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter((item) => item.timestamp > oneWeekAgo);
        break;
    }

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "savings":
        filtered.sort((a, b) => {
          const savingsA = ((a.originalSize - a.convertedSize) / a.originalSize) * 100;
          const savingsB = ((b.originalSize - b.convertedSize) / b.originalSize) * 100;
          return savingsB - savingsA;
        });
        break;
      case "date":
      default:
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
    }

    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Expose addToHistory function globally for other components to use
  useEffect(() => {
    (window as any).addToConversionHistory = addToHistory;
    return () => {
      delete (window as any).addToConversionHistory;
    };
  }, [history]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Conversion History</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportHistory}>
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={clearHistory}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="favorites">Favorites</option>
              <option value="recent">Recent (7 days)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="savings">Savings</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No conversion history found</p>
            <p className="text-sm mt-1">
              {filter === "favorites"
                ? "Mark conversions as favorites to see them here"
                : "Start converting images to build your history"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onToggleFavorite={() => toggleFavorite(item.id)}
                onRemove={() => removeFromHistory(item.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface HistoryItemProps {
  item: ConversionHistoryItem;
  onToggleFavorite: () => void;
  onRemove: () => void;
}

function HistoryItem({ item, onToggleFavorite, onRemove }: HistoryItemProps) {
  const savings = ((item.originalSize - item.convertedSize) / item.originalSize) * 100;
  const targetFormatData = FORMATS[item.targetFormat];

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 truncate">{item.fileName}</h4>
          <button
            onClick={onToggleFavorite}
            className={`text-lg ${
              item.isFavorite ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
            }`}
            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {item.isFavorite ? "★" : "☆"}
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            {item.originalFormat.replace("image/", "").toUpperCase()} → {targetFormatData.name}
          </span>
          <span>
            {formatFileSize(item.originalSize)} → {formatFileSize(item.convertedSize)}
          </span>
          <span className={`font-medium ${savings > 0 ? "text-green-600" : "text-red-600"}`}>
            {savings > 0 ? "-" : "+"}
            {Math.abs(savings).toFixed(1)}%
          </span>
          <span className="text-gray-500">{item.timestamp.toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        {item.downloadUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(item.downloadUrl, "_blank")}
          >
            Download
          </Button>
        )}
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 p-1"
          title="Remove from history"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
