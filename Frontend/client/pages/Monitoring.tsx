import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, TrendingUp } from "lucide-react";

export default function Monitoring() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="mx-auto max-w-md">
            <div className="mb-6">
              <Activity className="h-16 w-16 text-primary mx-auto mb-4" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Advanced Monitoring
            </h1>
            <p className="text-muted-foreground mb-8">
              Detailed analytics, performance metrics, and real-time monitoring
              dashboards will be available here.
            </p>
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Coming Soon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Real-time performance charts</li>
                  <li>• Custom dashboard builder</li>
                  <li>• Advanced alerting system</li>
                  <li>• Cost optimization insights</li>
                  <li>• API usage analytics</li>
                </ul>
                <Button className="w-full mt-4" disabled>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Feature In Development
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
