import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink } from "lucide-react";
import { Deployment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface DeploymentDetailsModalProps {
  deployment: Deployment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStopDeployment?: (deploymentId: string) => void;
}

export function DeploymentDetailsModal({
  deployment,
  open,
  onOpenChange,
  onStopDeployment,
}: DeploymentDetailsModalProps) {
  const { toast } = useToast();

  if (!deployment) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "URL has been copied to clipboard.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "deploying":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const platformFee = Number(deployment.platformFee) || 0;
  const monthlyCost = Number(deployment.monthlyCost) || 0;
  const baseCost = monthlyCost - platformFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="deployment-details-description" className="max-w-2xl max-h-screen overflow-y-auto">
        <p id="deployment-details-description" className="sr-only">Deployment details modal</p>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Deployment Details
          </DialogTitle>
          <DialogDescription>
            View and manage your AI infrastructure deployment configuration and status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">System Name</label>
              <p className="mt-1 text-sm text-gray-900" data-testid="deployment-name">
                {deployment.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <Badge className={`mt-1 ${getStatusColor(deployment.status)}`} data-testid="deployment-status">
                {deployment.status}
              </Badge>
            </div>
          </div>

          {(deployment.chatUrl || deployment.apiUrl) && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Access URLs</label>
              <div className="mt-2 space-y-2">
                {deployment.chatUrl && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Chat Interface</p>
                      <p className="text-xs text-gray-500" data-testid="chat-url">
                        {deployment.chatUrl}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(deployment.chatUrl!)}
                        className="text-primary hover:text-blue-700"
                        data-testid="button-copy-chat-url"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={deployment.chatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-blue-700"
                        data-testid="link-open-chat"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
                {deployment.apiUrl && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">API Endpoint</p>
                      <p className="text-xs text-gray-500" data-testid="api-url">
                        {deployment.apiUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(deployment.apiUrl!)}
                      className="text-primary hover:text-blue-700"
                      data-testid="button-copy-api-url"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <p className="mt-1 text-sm text-gray-900" data-testid="deployment-model">
                {deployment.model}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <p className="mt-1 text-sm text-gray-900" data-testid="deployment-provider">
                {deployment.provider}
              </p>
            </div>
          </div>

          {monthlyCost > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Cost Breakdown</label>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Infrastructure Cost</span>
                  <span className="text-gray-900" data-testid="base-cost">
                    ${baseCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee (7%)</span>
                  <span className="text-gray-900" data-testid="platform-fee">
                    ${platformFee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-900">Total Monthly Cost</span>
                    <span className="text-gray-900" data-testid="total-cost">
                      ${monthlyCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button variant="outline" data-testid="button-manage-deployment">
            Manage
          </Button>
          {onStopDeployment && (
            <Button
              variant="destructive"
              onClick={() => onStopDeployment(deployment.id)}
              data-testid="button-stop-deployment"
            >
              Stop Deployment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
