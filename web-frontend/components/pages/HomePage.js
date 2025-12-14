import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  Wallet,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
export default function HomePage() {
  const features = [
    {
      icon: _jsx(Wallet, { className: "h-8 w-8" }),
      title: "Digital Wallets",
      description:
        "Seamlessly manage multi-currency digital wallets with real-time balance tracking.",
    },
    {
      icon: _jsx(CreditCard, { className: "h-8 w-8" }),
      title: "Card Issuance",
      description:
        "Issue virtual and physical cards instantly with comprehensive controls.",
    },
    {
      icon: _jsx(Shield, { className: "h-8 w-8" }),
      title: "Bank-Grade Security",
      description:
        "Enterprise-level encryption and fraud detection to keep your funds safe.",
    },
    {
      icon: _jsx(Zap, { className: "h-8 w-8" }),
      title: "Instant Payments",
      description:
        "Send and receive payments instantly with low fees and multiple payment methods.",
    },
    {
      icon: _jsx(Globe, { className: "h-8 w-8" }),
      title: "Global Reach",
      description:
        "Support for multiple currencies and international transactions.",
    },
    {
      icon: _jsx(TrendingUp, { className: "h-8 w-8" }),
      title: "Analytics & Insights",
      description:
        "Track spending patterns and get actionable insights on your finances.",
    },
  ];
  const benefits = [
    "KYC/AML Compliance Built-in",
    "PCI-DSS Certified Infrastructure",
    "Real-time Transaction Monitoring",
    "Advanced Fraud Detection AI",
    "Multi-factor Authentication",
    "24/7 Customer Support",
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
              _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  _jsx(Wallet, { className: "h-8 w-8 text-primary" }),
                  _jsx("span", {
                    className: "text-2xl font-bold",
                    children: "Flowlet",
                  }),
                ],
              }),
              _jsxs("div", {
                className: "flex items-center gap-4",
                children: [
                  _jsx(Link, {
                    to: "/login",
                    children: _jsx(Button, {
                      variant: "ghost",
                      children: "Sign In",
                    }),
                  }),
                  _jsx(Link, {
                    to: "/register",
                    children: _jsx(Button, { children: "Get Started" }),
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      _jsx("section", {
        className: "container mx-auto px-4 py-20",
        children: _jsxs("div", {
          className: "max-w-3xl mx-auto text-center",
          children: [
            _jsx("h1", {
              className:
                "text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent",
              children: "Embedded Finance Platform for Modern Businesses",
            }),
            _jsx("p", {
              className: "text-xl text-muted-foreground mb-8",
              children:
                "Seamlessly integrate wallets, payments, and cards into your products. Built for developers, trusted by enterprises.",
            }),
            _jsxs("div", {
              className: "flex items-center justify-center gap-4",
              children: [
                _jsx(Link, {
                  to: "/register",
                  children: _jsxs(Button, {
                    size: "lg",
                    className: "gap-2",
                    children: [
                      "Start Building ",
                      _jsx(ArrowRight, { className: "h-4 w-4" }),
                    ],
                  }),
                }),
                _jsx(Link, {
                  to: "/developer",
                  children: _jsx(Button, {
                    size: "lg",
                    variant: "outline",
                    children: "View Documentation",
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      _jsxs("section", {
        className: "container mx-auto px-4 py-20",
        children: [
          _jsxs("div", {
            className: "text-center mb-12",
            children: [
              _jsx("h2", {
                className: "text-3xl font-bold mb-4",
                children: "Everything You Need for Embedded Finance",
              }),
              _jsx("p", {
                className: "text-muted-foreground max-w-2xl mx-auto",
                children:
                  "A complete suite of financial services designed to integrate seamlessly into your application.",
              }),
            ],
          }),
          _jsx("div", {
            className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6",
            children: features.map((feature, index) =>
              _jsx(
                Card,
                {
                  className:
                    "border-2 hover:border-primary/50 transition-colors",
                  children: _jsxs(CardHeader, {
                    children: [
                      _jsx("div", {
                        className: "text-primary mb-2",
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
      _jsx("section", {
        className: "container mx-auto px-4 py-20 bg-secondary/30 rounded-lg",
        children: _jsxs("div", {
          className: "max-w-4xl mx-auto",
          children: [
            _jsx("h2", {
              className: "text-3xl font-bold mb-8 text-center",
              children: "Built with Compliance & Security First",
            }),
            _jsx("div", {
              className: "grid md:grid-cols-2 gap-4",
              children: benefits.map((benefit, index) =>
                _jsxs(
                  "div",
                  {
                    className: "flex items-center gap-3",
                    children: [
                      _jsx(CheckCircle, {
                        className: "h-5 w-5 text-green-500 flex-shrink-0",
                      }),
                      _jsx("span", { children: benefit }),
                    ],
                  },
                  index,
                ),
              ),
            }),
          ],
        }),
      }),
      _jsx("section", {
        className: "container mx-auto px-4 py-20",
        children: _jsx(Card, {
          className: "border-2 border-primary/50",
          children: _jsxs(CardContent, {
            className: "p-12 text-center",
            children: [
              _jsx("h2", {
                className: "text-3xl font-bold mb-4",
                children: "Ready to Build the Future of Finance?",
              }),
              _jsx("p", {
                className: "text-muted-foreground mb-6 max-w-2xl mx-auto",
                children:
                  "Join hundreds of companies using Flowlet to embed financial services into their products.",
              }),
              _jsx(Link, {
                to: "/register",
                children: _jsxs(Button, {
                  size: "lg",
                  className: "gap-2",
                  children: [
                    "Get Started Free ",
                    _jsx(ArrowRight, { className: "h-4 w-4" }),
                  ],
                }),
              }),
            ],
          }),
        }),
      }),
      _jsx("footer", {
        className: "border-t mt-20",
        children: _jsx("div", {
          className: "container mx-auto px-4 py-8",
          children: _jsxs("div", {
            className: "flex items-center justify-between",
            children: [
              _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  _jsx(Wallet, { className: "h-6 w-6 text-primary" }),
                  _jsx("span", {
                    className: "font-semibold",
                    children: "Flowlet",
                  }),
                ],
              }),
              _jsx("p", {
                className: "text-sm text-muted-foreground",
                children: "\u00A9 2024 Flowlet. All rights reserved.",
              }),
            ],
          }),
        }),
      }),
    ],
  });
}
