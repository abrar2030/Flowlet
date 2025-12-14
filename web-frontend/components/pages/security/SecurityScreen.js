import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
  return _jsxs("div", {
    className: "container mx-auto p-6 max-w-4xl",
    children: [
      _jsxs("div", {
        className: "mb-8",
        children: [
          _jsx("h1", {
            className: "text-3xl font-bold mb-2",
            children: "Security Center",
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children: "Manage your account security settings",
          }),
        ],
      }),
      _jsxs(Card, {
        className: "mb-6",
        children: [
          _jsx(CardHeader, {
            children: _jsxs("div", {
              className: "flex items-center gap-3",
              children: [
                _jsx(Shield, { className: "h-8 w-8 text-green-500" }),
                _jsxs("div", {
                  children: [
                    _jsx(CardTitle, { children: "Security Status" }),
                    _jsx(CardDescription, {
                      children: "Your account is secure",
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsx(Badge, {
              variant: "success",
              className: "text-sm",
              children: "All Systems Protected",
            }),
          }),
        ],
      }),
      _jsx("div", {
        className: "grid gap-4",
        children: securityFeatures.map((feature) =>
          _jsx(
            Card,
            {
              children: _jsx(CardHeader, {
                children: _jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    _jsxs("div", {
                      className: "flex items-center gap-3",
                      children: [
                        _jsx(feature.icon, {
                          className: "h-6 w-6 text-primary",
                        }),
                        _jsxs("div", {
                          children: [
                            _jsx(CardTitle, {
                              className: "text-lg",
                              children: feature.title,
                            }),
                            _jsx(CardDescription, {
                              children: feature.description,
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(Badge, {
                          variant: "success",
                          children: feature.status,
                        }),
                        _jsx(Button, {
                          variant: "outline",
                          size: "sm",
                          children: "Configure",
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            },
            feature.title,
          ),
        ),
      }),
    ],
  });
}
