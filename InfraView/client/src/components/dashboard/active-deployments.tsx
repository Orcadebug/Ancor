import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Deployment } from "@shared/schema";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

interface ActiveDeploymentsProps {
  onViewDetails?: (deployment: Deployment) => void;
}

export function ActiveDeployments({ onViewDetails }: ActiveDeploymentsProps) {
  const { user } = useAuthStore();
  
  const { data: deploymentsData, isLoading } = useQuery({
    queryKey: ["/api/deployments", user?.organization_id],
    queryFn: () => api.getDeployments(user?.organization_id || ""),
    enabled: !!user?.organization_id,
  });

  const deployments = deploymentsData?.deployments || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "deploying":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "deploying":
        return "Deploying...";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Active Deployments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                      <div className="h-3 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Active Deployments</CardTitle>
          <Button variant="link" className="text-sm text-primary hover:text-blue-700" data-testid="button-view-all-deployments">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!deployments || deployments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No active deployments</p>
            <p className="text-sm text-gray-400 mt-1">Create your first deployment to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onViewDetails?.(deployment)}
                data-testid={`deployment-${deployment.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(deployment.status)}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{deployment.name}</p>
                    <p className="text-sm text-gray-500">{deployment.model} • {deployment.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  {deployment.status === "active" ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        ${deployment.monthlyCost}/mo
                      </p>
                      {deployment.chatUrl && (
                        <a
                          href={deployment.chatUrl}
                          className="text-xs text-primary hover:underline flex items-center"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`link-deployment-url-${deployment.id}`}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {new URL(deployment.chatUrl).hostname}
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-yellow-600">{getStatusText(deployment.status)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
