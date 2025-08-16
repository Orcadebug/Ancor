import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Scale,
  Heart,
  DollarSign,
  Users,
  Brain,
  Cpu,
  Globe,
  Settings,
  Rocket,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Database,
  Shield,
  Zap,
  FileText,
  MessageSquare,
  Workflow,
  BarChart3,
  Lock,
  Server,
} from "lucide-react";

interface DeploymentConfig {
  industry: string;
  useCase: string;
  model: string;
  region: string;
  compliance: string;
  organization: string;
  teamSize: string;
  documentVolume: string;
}

const industries = [
  {
    id: "legal",
    name: "Legal",
    icon: Scale,
    description: "Contracts, case files, briefs, legal research",
    useCases: [
      "Contract Analysis",
      "Legal Research",
      "Case Management",
      "Due Diligence",
      "Compliance Review",
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Heart,
    description: "Patient records, research docs, clinical data",
    useCases: [
      "Medical Records Analysis",
      "Clinical Research",
      "Treatment Planning",
      "Drug Discovery",
      "Regulatory Documentation",
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: DollarSign,
    description: "Reports, compliance docs, investment analysis",
    useCases: [
      "Financial Analysis",
      "Risk Assessment",
      "Compliance Monitoring",
      "Investment Research",
      "Audit Documentation",
    ],
  },
  {
    id: "professional",
    name: "Professional Services",
    icon: Users,
    description: "Proposals, client docs, project management",
    useCases: [
      "Proposal Generation",
      "Client Communication",
      "Project Documentation",
      "Knowledge Management",
      "Business Intelligence",
    ],
  },
];

const models = [
  {
    id: "llama-3-8b",
    name: "LLaMA 3 8B",
    type: "Lightweight",
    price: 300,
    description: "Perfect for basic document analysis and small teams",
    specs: "8 billion parameters • 4-16GB VRAM • Up to 1M tokens/day",
    recommended: false,
  },
  {
    id: "llama-3-70b",
    name: "LLaMA 3 70B",
    type: "Recommended",
    price: 1200,
    description: "Ideal balance of performance and cost for most organizations",
    specs: "70 billion parameters • 40-80GB VRAM • Up to 10M tokens/day",
    recommended: true,
  },
  {
    id: "llama-3-405b",
    name: "LLaMA 3 405B",
    type: "Enterprise",
    price: 3000,
    description: "Maximum performance for large-scale enterprise deployments",
    specs: "405 billion parameters • 200GB+ VRAM • Up to 100M tokens/day",
    recommended: false,
  },
];

const regions = [
  { id: "us-east", name: "US-East", location: "Virginia", latency: "~20ms" },
  { id: "us-west", name: "US-West", location: "California", latency: "~15ms" },
  {
    id: "eu-central",
    name: "EU-Central",
    location: "Frankfurt",
    latency: "~25ms",
  },
];

const compliancePresets = [
  {
    id: "soc2",
    name: "SOC 2",
    description: "Security and availability controls",
  },
  { id: "hipaa", name: "HIPAA", description: "Healthcare data protection" },
  {
    id: "legal",
    name: "Legal Industry",
    description: "Attorney-client privilege protection",
  },
  { id: "gdpr", name: "GDPR", description: "EU data protection regulations" },
];

export default function Deploy() {
  const [currentStep, setCurrentStep] = useState(1);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [config, setConfig] = useState<DeploymentConfig>({
    industry: "",
    useCase: "",
    model: "",
    region: "",
    compliance: "",
    organization: "",
    teamSize: "",
    documentVolume: "",
  });

  const steps = [
    { number: 1, title: "Industry & Use Case", icon: Scale },
    { number: 2, title: "Model Selection", icon: Brain },
    { number: 3, title: "Infrastructure", icon: Server },
    { number: 4, title: "Deploy System", icon: Rocket },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.industry && config.useCase;
      case 2:
        return config.model;
      case 3:
        return config.region && config.compliance && config.organization;
      default:
        return true;
    }
  };

  const selectedIndustry = industries.find((i) => i.id === config.industry);

  const startDeployment = async () => {
    setIsDeploying(true);
    setDeploymentProgress(0);

    // Simulate deployment progress
    const steps = [
      { progress: 10, message: "Provisioning CoreWeave GPU instances..." },
      { progress: 25, message: "Setting up dual A100 GPUs for LLaMA 3 70B..." },
      { progress: 40, message: "Configuring vLLM with quantized model..." },
      { progress: 55, message: "Deploying ChromaDB vector storage cluster..." },
      { progress: 70, message: "Setting up LlamaIndex RAG pipeline..." },
      { progress: 85, message: "Configuring n8n workflow automation..." },
      { progress: 95, message: "Deploying Streamlit chat interface..." },
      { progress: 100, message: "System deployment complete!" },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDeploymentProgress(step.progress);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-2">Select Your Industry</h3>
        <p className="text-muted-foreground mb-6">
          Choose your industry to get pre-configured templates and compliance
          settings
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {industries.map((industry) => {
            const IconComponent = industry.icon;
            return (
              <Card
                key={industry.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  config.industry === industry.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    industry: industry.id,
                    useCase: "",
                  }))
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">
                        {industry.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {industry.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {industry.useCases.slice(0, 3).map((useCase, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {useCase}
                          </Badge>
                        ))}
                        {industry.useCases.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{industry.useCases.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {config.industry && selectedIndustry && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Primary Use Case</h3>
          <p className="text-muted-foreground mb-4">
            What's your main use case for AI document processing?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedIndustry.useCases.map((useCase) => (
              <Card
                key={useCase}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.useCase === useCase
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => setConfig((prev) => ({ ...prev, useCase }))}
              >
                <CardContent className="p-4 text-center">
                  <p className="font-medium">{useCase}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-2">
          Choose Your LLaMA 3 Model
        </h3>
        <p className="text-muted-foreground mb-6">
          Select the model size based on your performance needs and budget
        </p>
        <div className="space-y-4">
          {models.map((model) => (
            <Card
              key={model.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                config.model === model.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
              } ${model.recommended ? "border-primary" : ""}`}
              onClick={() =>
                setConfig((prev) => ({ ...prev, model: model.id }))
              }
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xl font-bold">{model.name}</h4>
                        {model.recommended && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {model.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${model.price}
                    </p>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">
                  {model.description}
                </p>
                <p className="text-sm text-muted-foreground">{model.specs}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h4 className="font-semibold mb-2">Custom Model Upload</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Have your own fine-tuned model? Upload it for deployment
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-2">
          Infrastructure Configuration
        </h3>
        <p className="text-muted-foreground mb-6">
          Auto-provision on CoreWeave with optimal GPU configuration
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Cpu className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold">CoreWeave GPU Setup</h4>
                  <p className="text-sm text-muted-foreground">
                    Dual A100 80GB GPUs
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GPU Memory:</span>
                  <span className="font-medium">160GB Total</span>
                </div>
                <div className="flex justify-between">
                  <span>Compute:</span>
                  <span className="font-medium">312 TFLOPS</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="font-medium">800 Gbps</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organization">Organization Name</Label>
                <Input
                  id="organization"
                  placeholder="Your Company Inc."
                  value={config.organization}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      organization: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Select
                  value={config.teamSize}
                  onValueChange={(value) =>
                    setConfig((prev) => ({ ...prev, teamSize: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 users</SelectItem>
                    <SelectItem value="6-20">6-20 users</SelectItem>
                    <SelectItem value="21-100">21-100 users</SelectItem>
                    <SelectItem value="100+">100+ users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentVolume">Expected Document Volume</Label>
                <Select
                  value={config.documentVolume}
                  onValueChange={(value) =>
                    setConfig((prev) => ({ ...prev, documentVolume: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Documents per month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-100">1-100 documents</SelectItem>
                    <SelectItem value="101-1000">
                      101-1,000 documents
                    </SelectItem>
                    <SelectItem value="1001-10000">
                      1,001-10,000 documents
                    </SelectItem>
                    <SelectItem value="10000+">10,000+ documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="region">CoreWeave Region</Label>
            <div className="mt-2 space-y-2">
              {regions.map((region) => (
                <Card
                  key={region.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    config.region === region.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, region: region.id }))
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{region.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {region.location}
                        </p>
                      </div>
                      <Badge variant="outline">{region.latency}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="compliance">Compliance Preset</Label>
            <div className="mt-2 space-y-2">
              {compliancePresets.map((preset) => (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    config.compliance === preset.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, compliance: preset.id }))
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{preset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          Complete System Deployment
        </h3>
        <p className="text-muted-foreground mb-6">
          We'll automatically provision your entire AI document processing stack
        </p>
      </div>

      {!isDeploying ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Deployment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Industry
                    </p>
                    <p className="font-semibold">{selectedIndustry?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Use Case
                    </p>
                    <p className="font-semibold">{config.useCase}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Model
                    </p>
                    <p className="font-semibold">
                      {models.find((m) => m.id === config.model)?.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Region
                    </p>
                    <p className="font-semibold">
                      {regions.find((r) => r.id === config.region)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Compliance
                    </p>
                    <p className="font-semibold">
                      {
                        compliancePresets.find(
                          (c) => c.id === config.compliance,
                        )?.name
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Monthly Cost
                    </p>
                    <p className="font-semibold text-primary text-xl">
                      ${models.find((m) => m.id === config.model)?.price}/month
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="h-6 w-6 text-primary" />
                <span>What We'll Deploy For You</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Cpu className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">GPU Infrastructure</p>
                      <p className="text-sm text-muted-foreground">
                        vLLM + quantized LLaMA 3 on dual A100s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Vector Storage</p>
                      <p className="text-sm text-muted-foreground">
                        ChromaDB cluster for embeddings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">RAG Pipeline</p>
                      <p className="text-sm text-muted-foreground">
                        LlamaIndex configured for your industry
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Workflow className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Automation</p>
                      <p className="text-sm text-muted-foreground">
                        n8n with pre-built workflows
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Chat Interface</p>
                      <p className="text-sm text-muted-foreground">
                        Streamlit UI with your branding
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        JWT auth with user management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Monitoring</p>
                      <p className="text-sm text-muted-foreground">
                        Audit logging & backup systems
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Security</p>
                      <p className="text-sm text-muted-foreground">
                        VPC, firewall, SSL certificates
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <Button size="lg" className="w-full" onClick={startDeployment}>
                  <Rocket className="h-5 w-5 mr-2" />
                  Deploy Complete System (Est. 15-20 minutes)
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Rocket className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  Deploying Your AI System
                </h4>
                <p className="text-muted-foreground">
                  Setting up your complete document processing infrastructure...
                </p>
              </div>
              <div className="space-y-4">
                <Progress value={deploymentProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {deploymentProgress < 100
                    ? "Provisioning infrastructure and deploying services..."
                    : "🎉 Your AI system is ready! Check your email for access details."}
                </p>
              </div>
              {deploymentProgress === 100 && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-green-800">
                        Deployment Successful!
                      </p>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your AI document processing system is live and ready to
                      use.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Chat Interface
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage System
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Document Processing Deployment
          </h1>
          <p className="text-muted-foreground">
            Deploy a complete AI-powered document processing system in 4 steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center min-w-0">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                  currentStep >= step.number
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <step.icon className="h-6 w-6" />
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.number
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Step {step.number}
                </p>
                <p
                  className={`text-xs ${
                    currentStep >= step.number
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
              </div>

              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-4 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderCurrentStep()}</div>

        {/* Navigation */}
        {!isDeploying && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : deploymentProgress < 100 ? (
              <Button disabled>Deploying...</Button>
            ) : (
              <Button disabled>Deployment Complete</Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
