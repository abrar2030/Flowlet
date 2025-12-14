import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, Eye, Activity, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function EnhancedSecurityScreen() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Security</h1>
        <p className="text-muted-foreground">
          Enterprise-grade security features and monitoring
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Threat Level", value: "Low", icon: Shield },
              { title: "Active Sessions", value: "3", icon: Activity },
              { title: "Failed Attempts", value: "0", icon: Lock },
              { title: "Alerts", value: "2", icon: Bell },
            ].map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
              <CardDescription>
                Configure advanced security options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  id: "encryption",
                  label: "End-to-End Encryption",
                  description: "Encrypt all data transmissions",
                },
                {
                  id: "audit",
                  label: "Audit Logging",
                  description: "Track all security events",
                },
                {
                  id: "ip-whitelist",
                  label: "IP Whitelisting",
                  description: "Restrict access by IP address",
                },
                {
                  id: "session-timeout",
                  label: "Session Timeout",
                  description: "Automatic logout after inactivity",
                },
              ].map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={feature.id}>{feature.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <Switch id={feature.id} defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
              <CardDescription>
                Real-time security event monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
              Security monitoring dashboard with live threat detection
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
            </CardHeader>
            <CardContent>Manage organizational security policies</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              View compliance status and generate reports
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
