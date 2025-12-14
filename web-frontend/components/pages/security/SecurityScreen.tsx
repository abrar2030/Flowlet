import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Key, Eye, AlertTriangle } from "lucide-react";

export default function SecurityScreen() {
  const securityFeatures = [
    {
      title: "Two-Factor Authentication",
      description: "Enhanced account security",
      status: "enabled",
      icon: Lock,
    },
    {
      title: "Biometric Login",
      description: "Fingerprint and face recognition",
      status: "enabled",
      icon: Eye,
    },
    {
      title: "API Keys",
      description: "Manage your API access",
      status: "active",
      icon: Key,
    },
    {
      title: "Security Alerts",
      description: "Real-time security notifications",
      status: "enabled",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Center</h1>
        <p className="text-muted-foreground">
          Manage your account security settings
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Your account is secure</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="success" className="text-sm">
            All Systems Protected
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {securityFeatures.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{feature.status}</Badge>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
