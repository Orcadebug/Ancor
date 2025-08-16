import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  DollarSign,
  Zap,
  AlertTriangle,
  TrendingUp,
  Rocket,
  Brain,
  Shield,
  FileText,
  MessageSquare,
  Workflow,
  Database,
  Clock,
  Users,
  Target,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                AI Document Processing Platform
              </h1>
              <p className="text-muted-foreground mt-2">
                Intelligent document analysis powered by LLaMA 3 and automated
                workflows
              </p>
            </div>
            <Link to="/deploy">
              <Button size="lg" className="flex items-center space-x-2">
                <Rocket className="h-5 w-5" />
                <span>Deploy AI System</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Documents Processed"
            value="2,847"
            icon={FileText}
            trend={{ value: "+156 today", isPositive: true }}
            color="text-primary"
          />
          <MetricCard
            title="AI Queries (24h)"
            value="1,245"
            icon={MessageSquare}
            trend={{ value: "+23.5%", isPositive: true }}
            color="text-green-600"
          />
          <MetricCard
            title="Avg Processing Time"
            value="2.1s"
            icon={Zap}
            trend={{ value: "-0.4s", isPositive: true }}
            color="text-blue-600"
          />
          <MetricCard
            title="Active Workflows"
            value="12"
            icon={Workflow}
            trend={{ value: "+3 this week", isPositive: true }}
            color="text-purple-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <DeploymentStatus />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/documents" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </Link>
              <Link to="/chat" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask AI Assistant
                </Button>
              </Link>
              <Link to="/workflows" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Workflow className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </Link>
              <Link to="/deploy" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy New System
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Document Processing Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Document Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Legal Contracts
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={75} className="w-24" />
                    <span className="text-sm font-medium">456</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Financial Reports
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={60} className="w-24" />
                    <span className="text-sm font-medium">234</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Meeting Notes
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={45} className="w-24" />
                    <span className="text-sm font-medium">189</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Research Papers
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={30} className="w-24" />
                    <span className="text-sm font-medium">78</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>AI Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Query Accuracy
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={94} className="w-24" />
                    <span className="text-sm font-medium">94%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Document Confidence
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={89} className="w-24" />
                    <span className="text-sm font-medium">89%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Workflow Success
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={97} className="w-24" />
                    <span className="text-sm font-medium">97%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    User Satisfaction
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress value={92} className="w-24" />
                    <span className="text-sm font-medium">4.6/5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Document processed: Employment_Contract_2024.pdf
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Auto-summarized and indexed • 5 minutes ago
                  </p>
                </div>
                <Badge variant="secondary">Legal</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Workflow "Daily Digest" completed successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Email sent to 12 stakeholders • 2 hours ago
                  </p>
                </div>
                <Badge variant="secondary">Automation</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    AI query: "Compare Q3 vs Q4 financial performance"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Complex analysis completed in 3.2s • 4 hours ago
                  </p>
                </div>
                <Badge variant="secondary">Analysis</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    LLaMA 3 70B system deployed successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CoreWeave us-east-1 • 6 hours ago
                  </p>
                </div>
                <Badge variant="secondary">Infrastructure</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
