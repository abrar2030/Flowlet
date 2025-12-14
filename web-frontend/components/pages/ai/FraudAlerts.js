import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
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
  const getSeverityColor = (type) => {
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
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return _jsx(AlertTriangle, { className: "h-4 w-4" });
      case "reviewed":
        return _jsx(Eye, { className: "h-4 w-4" });
      case "resolved":
        return _jsx(CheckCircle, { className: "h-4 w-4" });
      default:
        return _jsx(XCircle, { className: "h-4 w-4" });
    }
  };
  return _jsxs("div", {
    className: "container mx-auto p-6",
    children: [
      _jsxs("div", {
        className: "mb-8",
        children: [
          _jsx("h1", {
            className: "text-3xl font-bold mb-2",
            children: "Fraud Alerts",
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children: "Monitor and manage suspicious activities",
          }),
        ],
      }),
      _jsx("div", {
        className: "grid gap-4",
        children: alerts.map((alert) =>
          _jsxs(
            Card,
            {
              children: [
                _jsx(CardHeader, {
                  children: _jsxs("div", {
                    className: "flex items-start justify-between",
                    children: [
                      _jsxs("div", {
                        className: "flex-1",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-2 mb-2",
                            children: [
                              _jsx(CardTitle, {
                                className: "text-lg",
                                children: alert.title,
                              }),
                              _jsx(Badge, {
                                variant: getSeverityColor(alert.type),
                                children: alert.type,
                              }),
                            ],
                          }),
                          _jsx(CardDescription, {
                            children: alert.description,
                          }),
                          _jsx("p", {
                            className: "text-sm text-muted-foreground mt-2",
                            children: alert.time,
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                          getStatusIcon(alert.status),
                          _jsx("span", {
                            className: "text-sm capitalize",
                            children: alert.status,
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                _jsx(CardContent, {
                  children: _jsxs("div", {
                    className: "flex gap-2",
                    children: [
                      _jsx(Button, {
                        size: "sm",
                        variant: "outline",
                        children: "View Details",
                      }),
                      alert.status === "pending" &&
                        _jsxs(_Fragment, {
                          children: [
                            _jsx(Button, {
                              size: "sm",
                              variant: "default",
                              children: "Approve",
                            }),
                            _jsx(Button, {
                              size: "sm",
                              variant: "destructive",
                              children: "Block",
                            }),
                          ],
                        }),
                    ],
                  }),
                }),
              ],
            },
            alert.id,
          ),
        ),
      }),
    ],
  });
}
