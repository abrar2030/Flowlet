import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
  return _jsxs("div", {
    className: "container mx-auto p-6",
    children: [
      _jsxs("div", {
        className: "mb-8",
        children: [
          _jsx("h1", {
            className: "text-3xl font-bold mb-2",
            children: "AI Fraud Detection",
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children: "Advanced machine learning powered fraud prevention",
          }),
        ],
      }),
      _jsx("div", {
        className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8",
        children: metrics.map((metric) =>
          _jsxs(
            Card,
            {
              children: [
                _jsxs(CardHeader, {
                  className:
                    "flex flex-row items-center justify-between space-y-0 pb-2",
                  children: [
                    _jsx(CardTitle, {
                      className: "text-sm font-medium",
                      children: metric.title,
                    }),
                    _jsx(metric.icon, {
                      className: "h-4 w-4 text-muted-foreground",
                    }),
                  ],
                }),
                _jsxs(CardContent, {
                  children: [
                    _jsxs("div", {
                      className: "text-2xl font-bold flex items-center gap-2",
                      children: [
                        metric.value,
                        metric.color &&
                          _jsx(Badge, {
                            variant: metric.color,
                            className: "text-xs",
                            children: "Active",
                          }),
                      ],
                    }),
                    metric.change &&
                      _jsxs("p", {
                        className: "text-xs text-muted-foreground mt-1",
                        children: [metric.change, " from last period"],
                      }),
                  ],
                }),
              ],
            },
            metric.title,
          ),
        ),
      }),
      _jsxs(Tabs, {
        defaultValue: "overview",
        className: "space-y-4",
        children: [
          _jsxs(TabsList, {
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, { value: "models", children: "ML Models" }),
              _jsx(TabsTrigger, {
                value: "rules",
                children: "Detection Rules",
              }),
            ],
          }),
          _jsx(TabsContent, {
            value: "overview",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "Fraud Detection Overview" }),
                    _jsx(CardDescription, {
                      children: "Real-time monitoring and threat detection",
                    }),
                  ],
                }),
                _jsx(CardContent, {
                  className:
                    "h-[400px] flex items-center justify-center text-muted-foreground",
                  children:
                    "Advanced fraud detection dashboard with real-time analytics",
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "models",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "Machine Learning Models" }),
                    _jsx(CardDescription, {
                      children: "Active AI models for fraud detection",
                    }),
                  ],
                }),
                _jsx(CardContent, {
                  children: _jsx("div", {
                    className: "space-y-4",
                    children: [
                      "Anomaly Detection",
                      "Pattern Recognition",
                      "Behavior Analysis",
                    ].map((model) =>
                      _jsxs(
                        "div",
                        {
                          className:
                            "flex items-center justify-between p-4 border rounded-lg",
                          children: [
                            _jsx("span", {
                              className: "font-medium",
                              children: model,
                            }),
                            _jsx(Badge, {
                              variant: "success",
                              children: "Active",
                            }),
                          ],
                        },
                        model,
                      ),
                    ),
                  }),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "rules",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, { children: "Detection Rules" }),
                }),
                _jsx(CardContent, {
                  children: "Custom fraud detection rules and configurations",
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
