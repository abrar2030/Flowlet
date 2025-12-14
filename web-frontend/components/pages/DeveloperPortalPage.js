import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code, Book, Zap, Terminal, Wallet } from "lucide-react";
export default function DeveloperPortalPage() {
  const devResources = [
    {
      icon: _jsx(Book, { className: "h-8 w-8" }),
      title: "API Documentation",
      description: "Complete API reference with examples",
    },
    {
      icon: _jsx(Code, { className: "h-8 w-8" }),
      title: "SDKs & Libraries",
      description: "Official SDKs for all major languages",
    },
    {
      icon: _jsx(Zap, { className: "h-8 w-8" }),
      title: "Quick Start",
      description: "Get up and running in minutes",
    },
    {
      icon: _jsx(Terminal, { className: "h-8 w-8" }),
      title: "Sandbox Environment",
      description: "Test your integration safely",
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
                children: "Developer Portal",
              }),
              _jsx("p", {
                className: "text-xl text-muted-foreground mb-8",
                children:
                  "Everything you need to integrate Flowlet into your application",
              }),
              _jsx(Link, {
                to: "/register",
                children: _jsx(Button, {
                  size: "lg",
                  children: "Get API Keys",
                }),
              }),
            ],
          }),
          _jsx("div", {
            className: "grid md:grid-cols-2 gap-6",
            children: devResources.map((resource, index) =>
              _jsx(
                Card,
                {
                  children: _jsxs(CardHeader, {
                    children: [
                      _jsx("div", {
                        className: "mb-2 text-primary",
                        children: resource.icon,
                      }),
                      _jsx(CardTitle, { children: resource.title }),
                      _jsx(CardDescription, { children: resource.description }),
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
