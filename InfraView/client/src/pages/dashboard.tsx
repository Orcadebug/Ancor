import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DeploymentWizard } from "@/components/dashboard/deployment-wizard";
import { ActiveDeployments } from "@/components/dashboard/active-deployments";
import { SystemMonitoring } from "@/components/dashboard/system-monitoring";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { DeploymentDetailsModal } from "@/components/modals/deployment-details-modal";
import { Deployment } from "@shared/schema";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

interface DashboardStats {
  activeDeployments: number;
  documentsProcessed: number;
  monthlyCost: number;
  successRate: number;
}

export default function Dashboard() {
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { user } = useAuthStore();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", user?.organizationId],
    queryFn: () => api.getDashboardStats(user?.organizationId || ""),
    enabled: !!user?.organizationId,
  });

  const handleNewDeployment = () => {
    setLocation("/deployment-wizard");
  };

  const handleContinueWizard = (selectedIndustry: string) => {
    setLocation(`/deployment-wizard?industry=${selectedIndustry}`);
  };

  const handleViewDeploymentDetails = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setIsModalOpen(true);
  };

  const handleStopDeployment = (deploymentId: string) => {
    // TODO: Implement stop deployment API call
    console.log("Stopping deployment:", deploymentId);
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Deployment Dashboard"
          subtitle="Deploy and manage your AI infrastructure"
          onNewDeployment={handleNewDeployment}
        />
        
        <div className="flex-1 overflow-auto p-6">
          <StatsCards data={stats} isLoading={statsLoading} />
          
          <DeploymentWizard onContinue={handleContinueWizard} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ActiveDeployments onViewDetails={handleViewDeploymentDetails} />
            <SystemMonitoring />
          </div>

          <DocumentUpload />
        </div>
      </div>

      <DeploymentDetailsModal
        deployment={selectedDeployment}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onStopDeployment={handleStopDeployment}
      />
    </div>
  );
}
