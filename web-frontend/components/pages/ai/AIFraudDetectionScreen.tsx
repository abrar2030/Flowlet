import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIFraudDetectionScreen() {
  const metrics = [
    { title: "Risk Score", value: "Low", color: "success", icon: Shield },
    {
      title: "Threats Blocked",
      value: "47",
      change: "+12%",
      icon: AlertTriangle,
    },
    {
      title: "Transactions Analyzed",
      value: "1,234",
      change: "+8%",
      icon: Activity,
    },
    {
      title: "Detection Accuracy",
      value: "99.7%",
      change: "+0.2%",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Fraud Detection</h1>
        <p className="text-muted-foreground">
          Advanced machine learning powered fraud prevention
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {metric.value}
                {metric.color && (
                  <Badge variant={metric.color as any} className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              {metric.change && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.change} from last period
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">ML Models</TabsTrigger>
          <TabsTrigger value="rules">Detection Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Overview</CardTitle>
              <CardDescription>
                Real-time monitoring and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
              Advanced fraud detection dashboard with real-time analytics
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Machine Learning Models</CardTitle>
              <CardDescription>
                Active AI models for fraud detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "Anomaly Detection",
                  "Pattern Recognition",
                  "Behavior Analysis",
                ].map((model) => (
                  <div
                    key={model}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <span className="font-medium">{model}</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Detection Rules</CardTitle>
            </CardHeader>
            <CardContent>
              Custom fraud detection rules and configurations
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
