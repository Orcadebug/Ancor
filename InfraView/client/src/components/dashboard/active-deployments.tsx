import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Square, AlertTriangle } from "lucide-react";
import { Deployment } from "@shared/schema";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/supabase-api";
import { useState } from "react";

interface ActiveDeploymentsProps {
  onViewDetails?: (deployment: Deployment) => void;
}

export function ActiveDeployments({ onViewDetails }: ActiveDeploymentsProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [stoppingDeployments, setStoppingDeployments] = useState<Set<string>>(new Set());
  
  const { data: deploymentsData, isLoading } = useQuery({
    queryKey: ["/api/deployments", user?.organization_id],
    queryFn: async () => {
      const result = await apiClient.get(`/api/deployments/organization/${user?.organization_id || user?.id}`);
      return result;
    },
    enabled: !!user,
  });

  const stopDeploymentMutation = useMutation({
    mutationFn: async (deploymentId: string) => {
      return await apiClient.delete(`/api/deployments/${deploymentId}`);
    },
    onSuccess: (data, deploymentId) => {
      // Remove from stopping set
      setStoppingDeployments(prev => {
        const newSet = new Set(prev);
        newSet.delete(deploymentId);
        return newSet;
      });
      
      // Refresh deployments list
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
    },
    onError: (error, deploymentId) => {
      console.error('Failed to stop deployment:', error);
      // Remove from stopping set on error
      setStoppingDeployments(prev => {
        const newSet = new Set(prev);
        newSet.delete(deploymentId);
        return newSet;
      });
    }
  });

  const deployments = deploymentsData?.deployments || [];

  const handleStopDeployment = async (deploymentId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the row click
    
    if (confirm('Are you sure you want to stop this deployment? This action cannot be undone.')) {
      setStoppingDeployments(prev => new Set(prev).add(deploymentId));
      stopDeploymentMutation.mutate(deploymentId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "deploying":
      case "provisioning":
        return "bg-yellow-500";
      case "terminating":
        return "bg-orange-500";
      case "terminated":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "deploying":
      case "provisioning":
        return "Deploying...";
      case "terminating":
        return "Stopping...";
      case "terminated":
        return "Stopped";
      default:
        return status;
    }
  };

  const canStopDeployment = (status: string) => {
    return status === "active" || status === "deploying" || status === "provisioning";
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
            {deployments.map((deployment) => {
              const isStoppingThis = stoppingDeployments.has(deployment.id);
              const currentStatus = isStoppingThis ? 'terminating' : deployment.status;
              
              return (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onViewDetails?.(deployment)}
                  data-testid={`deployment-${deployment.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(currentStatus)}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{deployment.name}</p>
                      <p className="text-sm text-gray-500">{deployment.model_size || deployment.model} • {deployment.cloud_provider || deployment.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      {currentStatus === "active" ? (
                        <>
                          <p className="text-sm font-medium text-gray-900">
                            ${(deployment.cost_per_hour * 24 * 30).toFixed(2)}/mo
                          </p>
                          {deployment.endpoint_url && (
                            <a
                              href={deployment.endpoint_url}
                              className="text-xs text-primary hover:underline flex items-center"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`link-deployment-url-${deployment.id}`}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {new URL(deployment.endpoint_url).hostname}
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-yellow-600">{getStatusText(currentStatus)}</p>
                      )}
                    </div>
                    
                    {/* Stop button */}
                    {canStopDeployment(deployment.status) && !isStoppingThis && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleStopDeployment(deployment.id, e)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        data-testid={`stop-deployment-${deployment.id}`}
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    )}
                    
                    {/* Stopping indicator */}
                    {isStoppingThis && (
                      <div className="flex items-center text-orange-600 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1 animate-pulse" />
                        Stopping...
                      </div>
                    )}
                    
                    {/* Terminated status */}
                    {deployment.status === 'terminated' && (
                      <div className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                        Stopped
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
