import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Settings,
  Activity,
  FileText,
  Plus,
  Minus,
  RefreshCw,
  Zap,
} from "lucide-react";

interface Deployment {
  id: string;
  name: string;
  model: string;
  provider: string;
  region: string;
  status: "running" | "stopped" | "deploying" | "error";
  instances: number;
  uptime: string;
  cpu: string;
  memory: string;
  requests: string;
  lastBackup: string;
}

const mockDeployments: Deployment[] = [
  {
    id: "1",
    name: "GPT-4 Production",
    model: "GPT-4",
    provider: "AWS",
    region: "us-east-1",
    status: "running",
    instances: 2,
    uptime: "24h 15m",
    cpu: "45%",
    memory: "67%",
    requests: "1.2K",
    lastBackup: "2 hours ago",
  },
  {
    id: "2",
    name: "Claude Staging",
    model: "Claude-3",
    provider: "Google Cloud",
    region: "us-central1",
    status: "running",
    instances: 1,
    uptime: "12h 42m",
    cpu: "28%",
    memory: "42%",
    requests: "340",
    lastBackup: "6 hours ago",
  },
  {
    id: "3",
    name: "Llama Dev",
    model: "Llama-2-70B",
    provider: "Azure",
    region: "eastus",
    status: "stopped",
    instances: 0,
    uptime: "0h 0m",
    cpu: "0%",
    memory: "0%",
    requests: "0",
    lastBackup: "1 day ago",
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

export default function Manage() {
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(
    null,
  );

  const renderInstanceControls = (deployment: Deployment) => (
    <div className="flex items-center space-x-2">
      <Button size="sm" variant="outline">
        <Minus className="h-3 w-3" />
      </Button>
      <span className="text-sm font-medium px-2">{deployment.instances}</span>
      <Button size="sm" variant="outline">
        <Plus className="h-3 w-3" />
      </Button>
      <span className="text-xs text-muted-foreground ml-2">instances</span>
    </div>
  );

  const renderActionButtons = (deployment: Deployment) => (
    <div className="flex items-center space-x-2">
      {deployment.status === "running" ? (
        <Button size="sm" variant="outline">
          <Pause className="h-3 w-3 mr-1" />
          Stop
        </Button>
      ) : (
        <Button size="sm" variant="outline">
          <Play className="h-3 w-3 mr-1" />
          Start
        </Button>
      )}
      <Button size="sm" variant="outline">
        <RotateCcw className="h-3 w-3 mr-1" />
        Restart
      </Button>
      <Button size="sm" variant="outline">
        <Settings className="h-3 w-3 mr-1" />
        Config
      </Button>
    </div>
  );

  const renderTroubleshootingTools = (deployment: Deployment) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="flex items-center justify-center p-4 h-auto"
        >
          <div className="text-center">
            <RefreshCw className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Restart Service</p>
            <p className="text-xs text-muted-foreground">
              Fix hanging processes
            </p>
          </div>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center p-4 h-auto"
        >
          <div className="text-center">
            <Zap className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Clear Cache</p>
            <p className="text-xs text-muted-foreground">Free up memory</p>
          </div>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center p-4 h-auto"
        >
          <div className="text-center">
            <Activity className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Health Check</p>
            <p className="text-xs text-muted-foreground">Run diagnostics</p>
          </div>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center p-4 h-auto"
        >
          <div className="text-center">
            <FileText className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-medium">View Logs</p>
            <p className="text-xs text-muted-foreground">Debug issues</p>
          </div>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Instance Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Start, stop, scale, and troubleshoot your AI model deployments
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scaling">Scaling</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
            <TabsTrigger value="logs">Logs & Monitoring</TabsTrigger>
            <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6">
              {mockDeployments.map((deployment) => (
                <Card
                  key={deployment.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(deployment.status)}`}
                        />
                        <div>
                          <h3 className="font-semibold text-lg">
                            {deployment.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {deployment.model} • {deployment.provider} •{" "}
                            {deployment.region}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(deployment.status)}>
                        {deployment.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="font-semibold">{deployment.uptime}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          CPU Usage
                        </p>
                        <p className="font-semibold">{deployment.cpu}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Memory</p>
                        <p className="font-semibold">{deployment.memory}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Requests
                        </p>
                        <p className="font-semibold">{deployment.requests}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {renderInstanceControls(deployment)}
                      {renderActionButtons(deployment)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scaling" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-scaling Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">
                    Select Deployment
                  </label>
                  <Select
                    value={selectedDeployment || ""}
                    onValueChange={setSelectedDeployment}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a deployment to configure" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDeployments.map((deployment) => (
                        <SelectItem key={deployment.id} value={deployment.id}>
                          {deployment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDeployment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          CPU-based Scaling
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm">
                              Scale up when CPU exceeds 70%
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Add instances automatically
                            </p>
                          </div>
                          <div>
                            <label className="text-sm">
                              Scale down when CPU below 30%
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Remove unnecessary instances
                            </p>
                          </div>
                          <div>
                            <label className="text-sm">
                              Min instances: 1 | Max instances: 10
                            </label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Request-based Scaling
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm">
                              Scale up when requests exceed 1000/min
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Handle traffic spikes
                            </p>
                          </div>
                          <div>
                            <label className="text-sm">
                              Scale down when requests below 100/min
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Reduce costs during low traffic
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Backup Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockDeployments.map((deployment) => (
                    <div
                      key={deployment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{deployment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last backup: {deployment.lastBackup}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Backup
                        </Button>
                        <Button size="sm" variant="outline">
                          <Upload className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automated Backup Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Daily Backups</p>
                        <p className="text-sm text-muted-foreground">
                          Every day at 2:00 AM UTC
                        </p>
                      </div>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Weekly Full Backup</p>
                        <p className="text-sm text-muted-foreground">
                          Sundays at 1:00 AM UTC
                        </p>
                      </div>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Retention Policy</p>
                        <p className="text-sm text-muted-foreground">
                          Keep backups for 30 days
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <div className="text-green-600">
                    [2024-01-15 14:32:15] INFO: GPT-4 Production - Request
                    processed successfully (247ms)
                  </div>
                  <div className="text-blue-600">
                    [2024-01-15 14:32:10] DEBUG: Claude Staging - Scaling up to
                    2 instances due to CPU usage
                  </div>
                  <div className="text-green-600">
                    [2024-01-15 14:32:05] INFO: GPT-4 Production - Request
                    processed successfully (198ms)
                  </div>
                  <div className="text-yellow-600">
                    [2024-01-15 14:31:58] WARN: GPT-4 Production - High memory
                    usage detected (78%)
                  </div>
                  <div className="text-green-600">
                    [2024-01-15 14:31:45] INFO: Claude Staging - Request
                    processed successfully (156ms)
                  </div>
                  <div className="text-red-600">
                    [2024-01-15 14:31:30] ERROR: Llama Dev - Instance failed to
                    start, retrying...
                  </div>
                  <div className="text-blue-600">
                    [2024-01-15 14:31:15] DEBUG: GPT-4 Production - Auto-scaling
                    triggered
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export Logs
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshoot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium">
                    Select Deployment
                  </label>
                  <Select
                    value={selectedDeployment || ""}
                    onValueChange={setSelectedDeployment}
                  >
                    <SelectTrigger className="mt-2 mb-6">
                      <SelectValue placeholder="Choose a deployment to troubleshoot" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDeployments.map((deployment) => (
                        <SelectItem key={deployment.id} value={deployment.id}>
                          {deployment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDeployment &&
                  renderTroubleshootingTools(
                    mockDeployments.find((d) => d.id === selectedDeployment)!,
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
