import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";

export default function SystemMonitor() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="System Monitor"
          subtitle="Monitor performance and health of your deployments"
        />
        
        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Monitor</h3>
              <p className="text-gray-500">Advanced monitoring dashboard coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
