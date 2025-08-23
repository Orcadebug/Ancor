import { Link, useLocation } from "wouter";
import { Brain, Rocket, Settings, FileText, GitBranch, BarChart3, Users, CreditCard, Cog, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  {
    section: "DEPLOYMENT",
    items: [
      { name: "Quick Deploy", href: "/", icon: Rocket },
      { name: "Deployment Wizard", href: "/deployment-wizard", icon: Settings },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { name: "Document Library", href: "/document-library", icon: FileText },
      { name: "Workflow Builder", href: "/workflow-builder", icon: GitBranch },
      { name: "System Monitor", href: "/system-monitor", icon: BarChart3 },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { name: "User Management", href: "/user-management", icon: Users },
      { name: "Billing & Usage", href: "/billing", icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Cog },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0 h-screen flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Platform</h1>
            <p className="text-sm text-gray-500">Infrastructure Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.section}>
            <div className="pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.section}
              </p>
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
            <div className="pt-4" />
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600 w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.full_name || user?.email}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
                data-testid="button-user-menu"
              >
                <Cog className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
