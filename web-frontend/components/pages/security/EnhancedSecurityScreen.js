import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, Activity, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
export default function EnhancedSecurityScreen() {
  return _jsxs("div", {
    className: "container mx-auto p-6",
    children: [
      _jsxs("div", {
        className: "mb-8",
        children: [
          _jsx("h1", {
            className: "text-3xl font-bold mb-2",
            children: "Advanced Security",
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children: "Enterprise-grade security features and monitoring",
          }),
        ],
      }),
      _jsxs(Tabs, {
        defaultValue: "overview",
        className: "space-y-4",
        children: [
          _jsxs(TabsList, {
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, {
                value: "monitoring",
                children: "Monitoring",
              }),
              _jsx(TabsTrigger, { value: "policies", children: "Policies" }),
              _jsx(TabsTrigger, {
                value: "compliance",
                children: "Compliance",
              }),
            ],
          }),
          _jsxs(TabsContent, {
            value: "overview",
            className: "space-y-4",
            children: [
              _jsx("div", {
                className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
                children: [
                  { title: "Threat Level", value: "Low", icon: Shield },
                  { title: "Active Sessions", value: "3", icon: Activity },
                  { title: "Failed Attempts", value: "0", icon: Lock },
                  { title: "Alerts", value: "2", icon: Bell },
                ].map((stat) =>
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
                              children: stat.title,
                            }),
                            _jsx(stat.icon, {
                              className: "h-4 w-4 text-muted-foreground",
                            }),
                          ],
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "text-2xl font-bold",
                            children: stat.value,
                          }),
                        }),
                      ],
                    },
                    stat.title,
                  ),
                ),
              }),
              _jsxs(Card, {
                children: [
                  _jsxs(CardHeader, {
                    children: [
                      _jsx(CardTitle, { children: "Security Features" }),
                      _jsx(CardDescription, {
                        children: "Configure advanced security options",
                      }),
                    ],
                  }),
                  _jsx(CardContent, {
                    className: "space-y-4",
                    children: [
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
                    ].map((feature) =>
                      _jsxs(
                        "div",
                        {
                          className: "flex items-center justify-between py-2",
                          children: [
                            _jsxs("div", {
                              className: "space-y-0.5",
                              children: [
                                _jsx(Label, {
                                  htmlFor: feature.id,
                                  children: feature.label,
                                }),
                                _jsx("p", {
                                  className: "text-sm text-muted-foreground",
                                  children: feature.description,
                                }),
                              ],
                            }),
                            _jsx(Switch, {
                              id: feature.id,
                              defaultChecked: true,
                            }),
                          ],
                        },
                        feature.id,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
          _jsx(TabsContent, {
            value: "monitoring",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "Security Monitoring" }),
                    _jsx(CardDescription, {
                      children: "Real-time security event monitoring",
                    }),
                  ],
                }),
                _jsx(CardContent, {
                  className:
                    "h-[400px] flex items-center justify-center text-muted-foreground",
                  children:
                    "Security monitoring dashboard with live threat detection",
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "policies",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, { children: "Security Policies" }),
                }),
                _jsx(CardContent, {
                  children: "Manage organizational security policies",
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "compliance",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, { children: "Compliance Reports" }),
                }),
                _jsx(CardContent, {
                  children: "View compliance status and generate reports",
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
