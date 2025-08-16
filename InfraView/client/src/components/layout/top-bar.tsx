import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  subtitle: string;
  onNewDeployment?: () => void;
}

export function TopBar({ title, subtitle, onNewDeployment }: TopBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="relative p-2 text-gray-400 hover:text-gray-600"
            data-testid="button-notifications"
          >
            <Bell className="text-lg" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          {onNewDeployment && (
            <Button 
              onClick={onNewDeployment}
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="button-new-deployment"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Deployment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
