import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  CheckCircle,
  FileText,
  AlertTriangle,
  Wallet,
} from "lucide-react";
export default function CompliancePage() {
  const complianceFeatures = [
    {
      icon: _jsx(Shield, { className: "h-8 w-8 text-blue-500" }),
      title: "KYC/AML",
      description:
        "Automated identity verification and anti-money laundering checks",
    },
    {
      icon: _jsx(FileText, { className: "h-8 w-8 text-green-500" }),
      title: "Audit Trails",
      description: "Complete transaction history with detailed audit logs",
    },
    {
      icon: _jsx(CheckCircle, { className: "h-8 w-8 text-purple-500" }),
      title: "Regulatory Compliance",
      description: "Built-in compliance with GDPR, PSD2, and FinCEN",
    },
    {
      icon: _jsx(AlertTriangle, { className: "h-8 w-8 text-yellow-500" }),
      title: "Risk Management",
      description: "Real-time risk scoring and fraud prevention",
    },
  ];
  return _jsxs("div", {
    className: "min-h-screen bg-gradient-to-b from-background to-secondary/20",
    children: [
      _jsx("header", {
        className: "border-b",
        children: _jsx("div", {
          className: "container mx-auto px-4 py-4",
          children: _jsxs("nav", {
            className: "flex items-center justify-between",
            children: [
              _jsxs(Link, {
                to: "/home",
                className: "flex items-center gap-2",
                children: [
                  _jsx(Wallet, { className: "h-8 w-8 text-primary" }),
                  _jsx("span", {
                    className: "text-2xl font-bold",
                    children: "Flowlet",
                  }),
                ],
              }),
              _jsx(Link, {
                to: "/login",
                children: _jsx(Button, { children: "Get Started" }),
              }),
            ],
          }),
        }),
      }),
      _jsxs("section", {
        className: "container mx-auto px-4 py-20",
        children: [
          _jsxs("div", {
            className: "max-w-3xl mx-auto text-center mb-16",
            children: [
              _jsx("h1", {
                className: "text-5xl font-bold mb-6",
                children: "Compliance Built-In",
              }),
              _jsx("p", {
                className: "text-xl text-muted-foreground mb-8",
                children:
                  "Stay compliant with financial regulations across all jurisdictions",
              }),
            ],
          }),
          _jsx("div", {
            className: "grid md:grid-cols-2 gap-6",
            children: complianceFeatures.map((feature, index) =>
              _jsx(
                Card,
                {
                  children: _jsxs(CardHeader, {
                    children: [
                      _jsx("div", {
                        className: "mb-2",
                        children: feature.icon,
                      }),
                      _jsx(CardTitle, { children: feature.title }),
                      _jsx(CardDescription, { children: feature.description }),
                    ],
                  }),
                },
                index,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
