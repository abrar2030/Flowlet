import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

export default function FraudAlerts() {
  const alerts = [
    {
      id: "1",
      type: "high",
      title: "Unusual Transaction Pattern",
      description: "Multiple small transactions detected",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: "2",
      type: "medium",
      title: "Location Anomaly",
      description: "Transaction from new location",
      time: "5 hours ago",
      status: "reviewed",
    },
    {
      id: "3",
      type: "low",
      title: "Velocity Check",
      description: "Rapid successive transactions",
      time: "1 day ago",
      status: "resolved",
    },
  ];

  const getSeverityColor = (type: string) => {
    switch (type) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="h-4 w-4" />;
      case "reviewed":
        return <Eye className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fraud Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and manage suspicious activities
        </p>
      </div>

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <Badge variant={getSeverityColor(alert.type) as any}>
                      {alert.type}
                    </Badge>
                  </div>
                  <CardDescription>{alert.description}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">
                    {alert.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(alert.status)}
                  <span className="text-sm capitalize">{alert.status}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                {alert.status === "pending" && (
                  <>
                    <Button size="sm" variant="default">
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      Block
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
