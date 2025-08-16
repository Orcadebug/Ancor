import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Globe,
  Database,
} from "lucide-react";

interface Deployment {
  id: string;
  name: string;
  model: string;
  provider: string;
  region: string;
  status: "running" | "stopped" | "deploying" | "error";
  uptime: string;
  requests: string;
}

const mockDeployments: Deployment[] = [
  {
    id: "1",
    name: "GPT-4 Production",
    model: "GPT-4",
    provider: "AWS",
    region: "us-east-1",
    status: "running",
    uptime: "24h 15m",
    requests: "1.2K",
  },
  {
    id: "2",
    name: "Claude Staging",
    model: "Claude-3",
    provider: "Google Cloud",
    region: "us-central1",
    status: "running",
    uptime: "12h 42m",
    requests: "340",
  },
  {
    id: "3",
    name: "Llama Dev",
    model: "Llama-2-70B",
    provider: "Azure",
    region: "eastus",
    status: "stopped",
    uptime: "0h 0m",
    requests: "0",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-green-500";
    case "stopped":
      return "bg-gray-500";
    case "deploying":
      return "bg-yellow-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "running":
      return "default";
    case "stopped":
      return "secondary";
    case "deploying":
      return "outline";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

export function DeploymentStatus() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Deployments</span>
          <Button size="sm">View All</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockDeployments.map((deployment) => (
          <div
            key={deployment.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(deployment.status)}`}
              />
              <div>
                <h4 className="font-medium text-foreground">
                  {deployment.name}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <Cpu className="h-3 w-3" />
                    <span>{deployment.model}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>{deployment.provider}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Database className="h-3 w-3" />
                    <span>{deployment.region}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <Badge variant={getStatusVariant(deployment.status)}>
                  {deployment.status}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {deployment.uptime} • {deployment.requests} req
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {deployment.status === "running" ? (
                  <Button size="sm" variant="outline">
                    <Pause className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
