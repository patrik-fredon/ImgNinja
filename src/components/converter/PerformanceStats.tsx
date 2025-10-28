"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ImageConverter } from "@/lib/converter/engine";

interface WorkerPoolStats {
  totalWorkers: number;
  busyWorkers: number;
  queuedTasks: number;
  maxWorkers: number;
  supported: boolean;
}

interface PerformanceStatsProps {
  converter?: ImageConverter;
  className?: string;
}

export function PerformanceStats({ converter, className = "" }: PerformanceStatsProps) {
  const [stats, setStats] = useState<WorkerPoolStats | null>(null);

  useEffect(() => {
    if (!converter) return;

    const updateStats = () => {
      const workerStats = converter.getWorkerPoolStats();
      setStats(workerStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [converter]);

  if (!stats || !stats.supported) {
    return null;
  }

  return (
    <Card variant="outlined" className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Performance Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Workers:</span>
              <span className="font-medium">
                {stats.busyWorkers}/{stats.totalWorkers}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Queued Tasks:</span>
              <span className="font-medium">{stats.queuedTasks}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Max Workers:</span>
              <span className="font-medium">{stats.maxWorkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-medium ${
                  stats.busyWorkers > 0 ? "text-blue-600" : "text-green-600"
                }`}
              >
                {stats.busyWorkers > 0 ? "Processing" : "Ready"}
              </span>
            </div>
          </div>
        </div>

        {/* Worker utilization bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Worker Utilization</span>
            <span>{Math.round((stats.busyWorkers / stats.totalWorkers) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(stats.busyWorkers / stats.totalWorkers) * 100}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
