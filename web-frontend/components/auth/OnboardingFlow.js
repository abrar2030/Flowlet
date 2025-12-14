import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const steps = [
    {
      title: "Welcome to Flowlet",
      description: "Your comprehensive financial management platform",
      content: _jsxs("div", {
        className: "text-center space-y-4",
        children: [
          _jsx("div", {
            className:
              "mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center",
            children: _jsx(CheckCircle, { className: "w-8 h-8 text-primary" }),
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children:
              "Manage your finances, track expenses, and grow your wealth all in one place.",
          }),
        ],
      }),
    },
    {
      title: "Secure & Trusted",
      description: "Bank-level security for your peace of mind",
      content: _jsxs("div", {
        className: "text-center space-y-4",
        children: [
          _jsx("div", {
            className:
              "mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center",
            children: _jsx(CheckCircle, {
              className: "w-8 h-8 text-green-600",
            }),
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children:
              "Your data is protected with enterprise-grade encryption and security measures.",
          }),
        ],
      }),
    },
    {
      title: "Smart Analytics",
      description: "AI-powered insights for better financial decisions",
      content: _jsxs("div", {
        className: "text-center space-y-4",
        children: [
          _jsx("div", {
            className:
              "mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center",
            children: _jsx(CheckCircle, { className: "w-8 h-8 text-blue-600" }),
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children:
              "Get personalized insights and recommendations to optimize your financial health.",
          }),
        ],
      }),
    },
  ];
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSkip = () => {
    navigate("/dashboard");
  };
  const progress = ((currentStep + 1) / steps.length) * 100;
  return _jsx("div", {
    className:
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4",
    children: _jsxs(Card, {
      className: "w-full max-w-md",
      children: [
        _jsx(CardHeader, {
          children: _jsxs("div", {
            className: "space-y-2",
            children: [
              _jsx(Progress, { value: progress, className: "w-full" }),
              _jsxs("div", {
                className: "flex justify-between text-xs text-muted-foreground",
                children: [
                  _jsxs("span", {
                    children: ["Step ", currentStep + 1, " of ", steps.length],
                  }),
                  _jsxs("span", {
                    children: [Math.round(progress), "% complete"],
                  }),
                ],
              }),
            ],
          }),
        }),
        _jsxs(CardContent, {
          className: "space-y-6",
          children: [
            _jsxs("div", {
              className: "text-center space-y-2",
              children: [
                _jsx(CardTitle, {
                  className: "text-xl",
                  children: steps[currentStep].title,
                }),
                _jsx(CardDescription, {
                  children: steps[currentStep].description,
                }),
              ],
            }),
            steps[currentStep].content,
            _jsxs("div", {
              className: "flex justify-between space-x-2",
              children: [
                _jsx("div", {
                  className: "flex space-x-2",
                  children:
                    currentStep > 0 &&
                    _jsxs(Button, {
                      variant: "outline",
                      onClick: handlePrevious,
                      children: [
                        _jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
                        "Previous",
                      ],
                    }),
                }),
                _jsxs("div", {
                  className: "flex space-x-2",
                  children: [
                    _jsx(Button, {
                      variant: "ghost",
                      onClick: handleSkip,
                      children: "Skip",
                    }),
                    _jsxs(Button, {
                      onClick: handleNext,
                      children: [
                        currentStep === steps.length - 1
                          ? "Get Started"
                          : "Next",
                        _jsx(ArrowRight, { className: "w-4 h-4 ml-2" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
};
export default OnboardingFlow;
