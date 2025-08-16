import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";

export default function UserManagement() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="User Management"
          subtitle="Manage users and access permissions"
        />
        
        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-500">User management features coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
