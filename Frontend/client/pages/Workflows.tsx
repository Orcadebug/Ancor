import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Workflow,
  Play,
  Pause,
  Settings,
  Plus,
  Copy,
  Edit,
  Trash2,
  Calendar,
  Mail,
  MessageSquare,
  FileText,
  Database,
  Globe,
  Zap,
  Filter,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Upload,
  Download,
  Search,
  Users,
  Shield,
  ExternalLink,
} from "lucide-react";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "document" | "notification" | "reporting" | "integration";
  icon: any;
  steps: string[];
  estimatedSetupTime: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  usageCount?: number;
}

interface ActiveWorkflow {
  id: string;
  name: string;
  status: "running" | "paused" | "error" | "draft";
  lastRun: string;
  successRate: number;
  totalRuns: number;
  category: string;
  trigger: string;
  nextRun?: string;
}

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: "success" | "error" | "running";
  startTime: string;
  duration: string;
  trigger: string;
  errorMessage?: string;
}

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "auto-process",
    name: "Auto-Process New Documents",
    description:
      "Automatically extract text, embed, summarize, and notify team when new documents are uploaded",
    category: "document",
    icon: FileText,
    steps: [
      "Monitor Google Drive for new files",
      "Extract text and metadata",
      "Generate embeddings in ChromaDB",
      "Create AI summary",
      "Send notification to team",
    ],
    estimatedSetupTime: "5 minutes",
    difficulty: "Easy",
    usageCount: 234,
  },
  {
    id: "daily-digest",
    name: "Daily Digest Generation",
    description:
      "Generate and email a daily summary of document updates and key insights",
    category: "reporting",
    icon: Mail,
    steps: [
      "Scheduled trigger daily at 9 AM",
      "Query document updates from last 24h",
      "Generate summary with AI",
      "Format email template",
      "Send to stakeholders list",
    ],
    estimatedSetupTime: "10 minutes",
    difficulty: "Medium",
    usageCount: 156,
  },
  {
    id: "question-routing",
    name: "Intelligent Question Routing",
    description:
      "Analyze incoming questions and route to appropriate team members based on content",
    category: "notification",
    icon: MessageSquare,
    steps: [
      "Receive form submission",
      "Analyze question with AI",
      "Determine appropriate department",
      "Route to team member",
      "Send confirmation to requester",
    ],
    estimatedSetupTime: "15 minutes",
    difficulty: "Advanced",
    usageCount: 89,
  },
  {
    id: "compliance-monitor",
    name: "Compliance Monitoring",
    description:
      "Scan documents for sensitive content and flag potential compliance issues",
    category: "document",
    icon: Shield,
    steps: [
      "Monitor document uploads",
      "Scan for sensitive data patterns",
      "Check against compliance rules",
      "Flag issues and create alerts",
      "Notify compliance officer",
    ],
    estimatedSetupTime: "20 minutes",
    difficulty: "Advanced",
    usageCount: 67,
  },
  {
    id: "crm-sync",
    name: "CRM Integration Sync",
    description:
      "Sync document insights and client communications with Salesforce or HubSpot",
    category: "integration",
    icon: Database,
    steps: [
      "Detect client-related documents",
      "Extract key information",
      "Match with CRM contacts",
      "Update CRM records",
      "Log activity timeline",
    ],
    estimatedSetupTime: "25 minutes",
    difficulty: "Advanced",
    usageCount: 45,
  },
  {
    id: "meeting-summary",
    name: "Meeting Notes Processor",
    description:
      "Process meeting recordings/notes and distribute action items to participants",
    category: "notification",
    icon: Users,
    steps: [
      "Upload meeting recording/notes",
      "Transcribe and analyze content",
      "Extract action items and decisions",
      "Create calendar events",
      "Send summaries to participants",
    ],
    estimatedSetupTime: "12 minutes",
    difficulty: "Medium",
    usageCount: 178,
  },
];

const activeWorkflows: ActiveWorkflow[] = [
  {
    id: "1",
    name: "Auto-Process New Documents",
    status: "running",
    lastRun: "2024-01-15T14:30:00Z",
    successRate: 98.5,
    totalRuns: 1247,
    category: "Document Processing",
    trigger: "File Upload",
    nextRun: "Real-time",
  },
  {
    id: "2",
    name: "Daily Digest Generation",
    status: "running",
    lastRun: "2024-01-15T09:00:00Z",
    successRate: 100,
    totalRuns: 45,
    category: "Reporting",
    trigger: "Schedule",
    nextRun: "Tomorrow 9:00 AM",
  },
  {
    id: "3",
    name: "Compliance Monitoring",
    status: "paused",
    lastRun: "2024-01-14T16:20:00Z",
    successRate: 95.2,
    totalRuns: 523,
    category: "Security",
    trigger: "Document Upload",
  },
];

const recentExecutions: WorkflowExecution[] = [
  {
    id: "1",
    workflowName: "Auto-Process New Documents",
    status: "success",
    startTime: "2024-01-15T14:30:00Z",
    duration: "45s",
    trigger: "File: Contract_Amendment.pdf",
  },
  {
    id: "2",
    workflowName: "Daily Digest Generation",
    status: "success",
    startTime: "2024-01-15T09:00:00Z",
    duration: "2m 15s",
    trigger: "Scheduled",
  },
  {
    id: "3",
    workflowName: "Question Routing",
    status: "error",
    startTime: "2024-01-15T13:45:00Z",
    duration: "12s",
    trigger: "Form Submission",
    errorMessage: "Failed to connect to Slack API",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "running":
      return "text-green-600";
    case "paused":
      return "text-yellow-600";
    case "error":
      return "text-red-600";
    case "draft":
      return "text-gray-600";
    case "success":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "running":
      return "default";
    case "paused":
      return "secondary";
    case "error":
      return "destructive";
    case "draft":
      return "outline";
    case "success":
      return "default";
    default:
      return "secondary";
  }
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Easy":
      return "text-green-600";
    case "Medium":
      return "text-yellow-600";
    case "Advanced":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function Workflows() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = workflowTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderTemplateCard = (template: WorkflowTemplate) => {
    const IconComponent = template.icon;

    return (
      <Card key={template.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">{template.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getDifficultyColor(template.difficulty)}`}
                  >
                    {template.difficulty}
                  </Badge>
                  {template.usageCount && (
                    <Badge variant="secondary" className="text-xs">
                      {template.usageCount} uses
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {template.estimatedSetupTime}
              </p>
              <p className="text-xs text-muted-foreground">setup time</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-4">{template.description}</p>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Workflow Steps:</p>
            <div className="space-y-1">
              {template.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm text-muted-foreground"
                >
                  <span className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Deploy Template
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderActiveWorkflows = () => (
    <div className="space-y-4">
      {activeWorkflows.map((workflow) => (
        <Card key={workflow.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{workflow.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {workflow.category}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(workflow.status)}>
                {workflow.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="font-semibold">{workflow.successRate}%</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="font-semibold">
                  {workflow.totalRuns.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Last Run</p>
                <p className="font-semibold text-xs">
                  {formatDate(workflow.lastRun).split(" ")[1]}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Trigger</p>
                <p className="font-semibold text-xs">{workflow.trigger}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {workflow.nextRun && (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Next: {workflow.nextRun}</span>
                  </>
                )}
              </div>
              <div className="flex space-x-2">
                {workflow.status === "running" ? (
                  <Button size="sm" variant="outline">
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderExecutionHistory = () => (
    <div className="space-y-3">
      {recentExecutions.map((execution) => {
        const statusIcon =
          execution.status === "success"
            ? CheckCircle
            : execution.status === "error"
              ? AlertTriangle
              : Clock;

        return (
          <Card key={execution.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <statusIcon
                    className={`h-5 w-5 ${getStatusColor(execution.status)}`}
                  />
                  <div>
                    <p className="font-medium">{execution.workflowName}</p>
                    <p className="text-sm text-muted-foreground">
                      {execution.trigger} • {execution.duration}
                    </p>
                    {execution.errorMessage && (
                      <p className="text-sm text-red-600">
                        {execution.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(execution.startTime)}
                  </p>
                  <Badge
                    variant={getStatusBadgeVariant(execution.status)}
                    className="text-xs"
                  >
                    {execution.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderWorkflowBuilder = () => (
    <div className="space-y-6">
      <Card className="border-dashed border-2">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Workflow className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Visual Workflow Builder
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag-and-drop interface powered by n8n for creating custom workflows
          </p>
          <Button>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Workflow Builder
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 border rounded">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm">ChromaDB</span>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm">Slack</span>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm">Webhook</span>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm">Schedule</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Industry Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 border rounded">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm">LegalDoc Parser</span>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">HIPAA Compliance</span>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Financial Analysis</span>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="text-sm">CRM Connector</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Upload className="h-3 w-3 mr-2" />
              Import Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Download className="h-3 w-3 mr-2" />
              Export Workflow
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Copy className="h-3 w-3 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Settings className="h-3 w-3 mr-2" />
              Global Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Workflow Automation
          </h1>
          <p className="text-muted-foreground mt-2">
            Automate document processing and business workflows with n8n
            integration
          </p>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workflow templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="document">
                      Document Processing
                    </SelectItem>
                    <SelectItem value="notification">Notifications</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="integration">Integrations</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTemplates.map(renderTemplateCard)}
            </div>
          </TabsContent>

          <TabsContent value="active">{renderActiveWorkflows()}</TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Executions</h3>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            {renderExecutionHistory()}
          </TabsContent>

          <TabsContent value="builder">{renderWorkflowBuilder()}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
