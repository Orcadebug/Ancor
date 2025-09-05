import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES, MODELS, PROVIDERS } from "@shared/schema";
import { Scale, Heart, BarChart3, Briefcase } from "lucide-react";

const industryIcons = {
  legal: Scale,
  healthcare: Heart,
  finance: BarChart3,
  professional: Briefcase,
};

export default function DeploymentWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    model: "",
    provider: "",
  });

  // Get industry from URL params if navigated from dashboard
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const industry = urlParams.get("industry");
    if (industry) {
      setFormData(prev => ({ ...prev, industry }));
    }
  }, []);

  const steps = [
    { number: 1, title: "Industry Selection", subtitle: "Choose your use case" },
    { number: 2, title: "Model Selection", subtitle: "Choose AI model" },
    { number: 3, title: "Infrastructure", subtitle: "Configure resources" },
    { number: 4, title: "Deploy", subtitle: "Launch system" },
  ];

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Deploy the system with real API call
      try {
        console.log("Deploying with data:", formData);
        
        // Import Supabase API client and make deployment request
        const { apiClient } = await import("@/lib/supabase-api");
        const result = await apiClient.post("/api/deployments", {
          name: formData.name,
          industry: formData.industry,
          model: formData.model,
          provider: formData.provider,
          description: `${formData.industry} deployment using ${formData.model} on ${formData.provider}`
        });
        
        console.log("✅ Deployment created successfully:", result);
        
        // Navigate to dashboard to see the new deployment
        setLocation("/dashboard");
        
      } catch (error) {
        console.error("❌ Deployment failed:", error);
        alert("Deployment failed. Please check your connection and try again.");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/");
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.industry !== "";
      case 2:
        return formData.model !== "";
      case 3:
        return formData.provider !== "";
      case 4:
        return formData.name !== "";
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Select your industry and use case:
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INDUSTRIES.map((industry) => {
                  const Icon = industryIcons[industry.id as keyof typeof industryIcons];
                  const isSelected = formData.industry === industry.id;
                  
                  return (
                    <div
                      key={industry.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, industry: industry.id }))}
                      data-testid={`industry-${industry.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon 
                          className={`text-xl ${
                            isSelected ? "text-primary" : "text-gray-400"
                          }`} 
                        />
                        <div>
                          <h4 className={`font-medium ${
                            isSelected ? "text-gray-900" : "text-gray-700"
                          }`}>
                            {industry.name}
                          </h4>
                          <p className="text-xs text-gray-500">{industry.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Select AI model for your deployment:
              </Label>
              <div className="space-y-3">
                {MODELS.map((model) => {
                  const isSelected = formData.model === model.id;
                  
                  return (
                    <div
                      key={model.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, model: model.id }))}
                      data-testid={`model-${model.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${
                            isSelected ? "text-gray-900" : "text-gray-700"
                          }`}>
                            {model.name}
                          </h4>
                          <p className="text-sm text-gray-500">{model.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${model.cost}/mo</p>
                          <p className="text-xs text-gray-500">base cost</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Select cloud provider:
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROVIDERS.map((provider) => {
                  const isSelected = formData.provider === provider.id;
                  
                  return (
                    <div
                      key={provider.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, provider: provider.id }))}
                      data-testid={`provider-${provider.id}`}
                    >
                      <div>
                        <h4 className={`font-medium ${
                          isSelected ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {provider.name}
                        </h4>
                        <p className="text-sm text-gray-500">{provider.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="deployment-name" className="text-sm font-medium text-gray-700">
                Deployment Name
              </Label>
              <Input
                id="deployment-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter a name for your deployment"
                className="mt-1"
                data-testid="input-deployment-name"
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Deployment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry:</span>
                  <span className="text-gray-900">
                    {INDUSTRIES.find(i => i.id === formData.industry)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="text-gray-900">
                    {MODELS.find(m => m.id === formData.model)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="text-gray-900">
                    {PROVIDERS.find(p => p.id === formData.provider)?.name}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">Estimated Monthly Cost:</span>
                    <span className="text-gray-900">
                      ${((MODELS.find(m => m.id === formData.model)?.cost || 0) * 1.07).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Deployment Wizard"
          subtitle="Set up your AI infrastructure step by step"
        />
        
        <div className="flex-1 overflow-auto p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="border-b border-gray-200">
              <CardTitle>Create New Deployment</CardTitle>
              
              {/* Step Progress */}
              <div className="flex items-center justify-between mt-6">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        step.number <= currentStep
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        {step.number}
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-medium ${
                          step.number <= currentStep ? "text-gray-900" : "text-gray-500"
                        }`}>
                          {step.title}
                        </p>
                        <p className={`text-xs ${
                          step.number <= currentStep ? "text-gray-500" : "text-gray-400"
                        }`}>
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-px bg-gray-200 mx-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {renderStepContent()}
              
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="bg-primary hover:bg-blue-700"
                  data-testid="button-next"
                >
                  {currentStep === 4 ? "Deploy System" : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
