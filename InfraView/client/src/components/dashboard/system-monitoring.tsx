import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { SystemMetrics } from "@shared/schema";

export function SystemMonitoring() {
  const { data: metrics, isLoading } = useQuery<SystemMetrics>({
    queryKey: ["/api/system-metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getProgressColor = (value: number, type: string) => {
    switch (type) {
      case "gpu":
        return value > 80 ? "bg-red-500" : value > 60 ? "bg-yellow-500" : "bg-green-500";
      case "response":
        return value > 70 ? "bg-red-500" : value > 40 ? "bg-yellow-500" : "bg-blue-500";
      case "queue":
        return value > 60 ? "bg-yellow-500" : "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">System Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-4 bg-gray-300 rounded w-12"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const gpuUtilization = metrics?.gpuUtilization || 0;
  const responseTime = Number(metrics?.responseTime) || 0;
  const queueLength = metrics?.queueLength || 0;
  const queriesToday = metrics?.queriesToday || 0;
  const errorRate = Number(metrics?.errorRate) || 0;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">System Performance</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Last 24h</span>
            <RefreshCw className="text-xs w-3 h-3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">GPU Utilization</span>
              <span className="text-sm text-gray-900" data-testid="metric-gpu-utilization">
                {gpuUtilization}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(gpuUtilization, "gpu")}`}
                style={{ width: `${gpuUtilization}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Response Time</span>
              <span className="text-sm text-gray-900" data-testid="metric-response-time">
                {responseTime}s avg
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(Math.min(responseTime * 20, 100), "response")}`}
                style={{ width: `${Math.min(responseTime * 20, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Document Queue</span>
              <span className="text-sm text-gray-900" data-testid="metric-queue-length">
                {queueLength} pending
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(Math.min(queueLength * 2, 100), "queue")}`}
                style={{ width: `${Math.min(queueLength * 2, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Queries Today</p>
                <p className="font-semibold text-gray-900" data-testid="metric-queries-today">
                  {queriesToday.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Error Rate</p>
                <p className="font-semibold text-green-600" data-testid="metric-error-rate">
                  {errorRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
