import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INDUSTRIES } from "@shared/schema";
import { Scale, Heart, BarChart3 } from "lucide-react";

const industryIcons = {
  legal: Scale,
  healthcare: Heart,
  finance: BarChart3,
  professional: BarChart3,
};

interface DeploymentWizardProps {
  onContinue?: (selectedIndustry: string) => void;
}

export function DeploymentWizard({ onContinue }: DeploymentWizardProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("legal");

  const handleContinue = () => {
    onContinue?.(selectedIndustry);
  };

  return (
    <Card className="border border-gray-200 mb-8">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Quick Deployment Wizard</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Deploy a complete AI infrastructure in minutes</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Step Progress */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-medium">1</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Industry Selection</p>
              <p className="text-xs text-gray-500">Choose your use case</p>
            </div>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-4"></div>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-500 rounded-full text-sm font-medium">2</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Model Selection</p>
              <p className="text-xs text-gray-400">Choose AI model</p>
            </div>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-4"></div>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-500 rounded-full text-sm font-medium">3</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Infrastructure</p>
              <p className="text-xs text-gray-400">Configure resources</p>
            </div>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-4"></div>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-500 rounded-full text-sm font-medium">4</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Deploy</p>
              <p className="text-xs text-gray-400">Launch system</p>
            </div>
          </div>
        </div>

        {/* Step 1 Content */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select your industry and use case:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INDUSTRIES.map((industry) => {
                const Icon = industryIcons[industry.id as keyof typeof industryIcons];
                const isSelected = selectedIndustry === industry.id;
                
                return (
                  <div
                    key={industry.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedIndustry(industry.id)}
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

          <div className="flex justify-end space-x-3">
            <Button variant="outline" data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleContinue}
              className="bg-primary hover:bg-blue-700"
              data-testid="button-continue"
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
