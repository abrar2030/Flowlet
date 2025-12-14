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
  ArrowRight,
  Zap,
  Globe,
  Shield,
  DollarSign,
  CreditCard,
  Wallet,
} from "lucide-react";
export default function PaymentsPage() {
  const paymentFeatures = [
    {
      icon: _jsx(Zap, { className: "h-8 w-8 text-yellow-500" }),
      title: "Instant Transfers",
      description: "Real-time payment processing with sub-second settlements",
    },
    {
      icon: _jsx(Globe, { className: "h-8 w-8 text-blue-500" }),
      title: "Global Coverage",
      description: "Accept payments from 190+ countries in 135+ currencies",
    },
    {
      icon: _jsx(Shield, { className: "h-8 w-8 text-green-500" }),
      title: "Fraud Prevention",
      description: "AI-powered fraud detection with 99.9% accuracy",
    },
    {
      icon: _jsx(DollarSign, { className: "h-8 w-8 text-purple-500" }),
      title: "Low Fees",
      description: "Competitive rates starting at 0.5% per transaction",
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
                children: "Payment Processing Made Simple",
              }),
              _jsx("p", {
                className: "text-xl text-muted-foreground mb-8",
                children:
                  "Accept payments globally with our secure, fast, and reliable payment infrastructure",
              }),
              _jsx(Link, {
                to: "/register",
                children: _jsxs(Button, {
                  size: "lg",
                  className: "gap-2",
                  children: [
                    "Start Processing ",
                    _jsx(ArrowRight, { className: "h-4 w-4" }),
                  ],
                }),
              }),
            ],
          }),
          _jsx("div", {
            className: "grid md:grid-cols-2 gap-6 mb-16",
            children: paymentFeatures.map((feature, index) =>
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
          _jsx(Card, {
            className: "border-2 border-primary/50",
            children: _jsxs(CardContent, {
              className: "p-12 text-center",
              children: [
                _jsx(CreditCard, {
                  className: "h-16 w-16 mx-auto mb-4 text-primary",
                }),
                _jsx("h2", {
                  className: "text-2xl font-bold mb-4",
                  children: "Ready to accept payments?",
                }),
                _jsx("p", {
                  className: "text-muted-foreground mb-6",
                  children: "Get started in minutes with our easy integration",
                }),
                _jsx(Link, {
                  to: "/register",
                  children: _jsx(Button, {
                    size: "lg",
                    children: "Create Account",
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
