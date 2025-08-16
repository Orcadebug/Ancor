import { Server, FileText, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsData {
  activeDeployments: number;
  documentsProcessed: number;
  monthlyCost: number;
  successRate: number;
}

interface StatsCardsProps {
  data?: StatsData;
  isLoading?: boolean;
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  const stats = [
    {
      title: "Active Deployments",
      value: data?.activeDeployments || 0,
      change: "+2",
      changeText: "this month",
      icon: Server,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      changeColor: "text-green-600",
    },
    {
      title: "Documents Processed",
      value: data?.documentsProcessed || 0,
      change: "+18%",
      changeText: "vs last month",
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      changeColor: "text-green-600",
    },
    {
      title: "Monthly Cost",
      value: `$${data?.monthlyCost || 0}`,
      change: "+$84",
      changeText: "platform fee",
      icon: DollarSign,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      changeColor: "text-red-600",
    },
    {
      title: "Query Success Rate",
      value: `${data?.successRate || 0}%`,
      change: "+0.3%",
      changeText: "improvement",
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      changeColor: "text-green-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="mt-4 h-4 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p 
                    className="text-3xl font-bold text-gray-900"
                    data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.iconColor} text-xl`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`${stat.changeColor} font-medium`}>{stat.change}</span>
                <span className="text-gray-500 ml-1">{stat.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
