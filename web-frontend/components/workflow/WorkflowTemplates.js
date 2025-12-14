import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Eye,
  Play,
  DollarSign,
  Shield,
  CreditCard,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
const WORKFLOW_TEMPLATES = [
  {
    id: "1",
    name: "Payment Processing Pipeline",
    description:
      "Complete payment processing workflow with fraud detection, validation, and notification system",
    category: "Payments",
    difficulty: "intermediate",
    estimatedTime: "15 min",
    nodeCount: 8,
    rating: 4.8,
    downloads: 1247,
    author: "Flowlet Team",
    tags: ["payments", "fraud-detection", "notifications"],
    icon: DollarSign,
    color: "bg-green-500",
    preview: [
      "Payment Received",
      "Fraud Check",
      "Validate Amount",
      "Process Payment",
      "Send Confirmation",
    ],
    features: [
      "Real-time fraud detection",
      "Multi-currency support",
      "Automated notifications",
      "Compliance checks",
    ],
  },
  {
    id: "2",
    name: "KYC Verification Flow",
    description:
      "Comprehensive customer verification workflow with document validation and risk assessment",
    category: "Compliance",
    difficulty: "advanced",
    estimatedTime: "25 min",
    nodeCount: 12,
    rating: 4.9,
    downloads: 856,
    author: "Compliance Pro",
    tags: ["kyc", "verification", "compliance", "risk-assessment"],
    icon: Shield,
    color: "bg-blue-500",
    preview: [
      "Document Upload",
      "ID Verification",
      "Address Validation",
      "Risk Assessment",
      "Approval Decision",
    ],
    features: [
      "Document OCR",
      "Biometric verification",
      "Risk scoring",
      "Regulatory compliance",
    ],
  },
  {
    id: "3",
    name: "Card Issuance Automation",
    description:
      "Automated card creation, activation, and delivery tracking system",
    category: "Cards",
    difficulty: "beginner",
    estimatedTime: "10 min",
    nodeCount: 6,
    rating: 4.7,
    downloads: 623,
    author: "Card Solutions",
    tags: ["cards", "issuance", "activation", "delivery"],
    icon: CreditCard,
    color: "bg-purple-500",
    preview: [
      "Application Review",
      "Card Creation",
      "PIN Generation",
      "Activation",
      "Delivery Tracking",
    ],
    features: [
      "Instant card creation",
      "Secure PIN generation",
      "Delivery tracking",
      "Activation notifications",
    ],
  },
  {
    id: "4",
    name: "Fraud Alert System",
    description:
      "Real-time fraud detection and alert notification system with machine learning",
    category: "Security",
    difficulty: "advanced",
    estimatedTime: "30 min",
    nodeCount: 15,
    rating: 4.9,
    downloads: 1089,
    author: "Security Expert",
    tags: ["fraud", "alerts", "machine-learning", "real-time"],
    icon: AlertTriangle,
    color: "bg-red-500",
    preview: [
      "Transaction Monitor",
      "ML Analysis",
      "Risk Scoring",
      "Alert Generation",
      "Response Action",
    ],
    features: [
      "ML-powered detection",
      "Real-time monitoring",
      "Multi-channel alerts",
      "Automated responses",
    ],
  },
  {
    id: "5",
    name: "Customer Onboarding",
    description:
      "Complete customer onboarding workflow with welcome emails and account setup",
    category: "Customer Management",
    difficulty: "beginner",
    estimatedTime: "12 min",
    nodeCount: 7,
    rating: 4.6,
    downloads: 945,
    author: "UX Team",
    tags: ["onboarding", "welcome", "account-setup", "emails"],
    icon: Users,
    color: "bg-indigo-500",
    preview: [
      "Registration",
      "Email Verification",
      "Profile Setup",
      "Welcome Email",
      "Account Activation",
    ],
    features: [
      "Personalized welcome",
      "Progressive profiling",
      "Email automation",
      "Account verification",
    ],
  },
  {
    id: "6",
    name: "Monthly Report Generation",
    description:
      "Automated monthly financial reports with analytics and email distribution",
    category: "Analytics",
    difficulty: "intermediate",
    estimatedTime: "20 min",
    nodeCount: 9,
    rating: 4.5,
    downloads: 534,
    author: "Analytics Team",
    tags: ["reports", "analytics", "monthly", "email"],
    icon: BarChart3,
    color: "bg-teal-500",
    preview: [
      "Data Collection",
      "Analysis",
      "Report Generation",
      "Chart Creation",
      "Email Distribution",
    ],
    features: [
      "Automated scheduling",
      "Interactive charts",
      "PDF generation",
      "Email distribution",
    ],
  },
  {
    id: "7",
    name: "Transaction Reconciliation",
    description:
      "Automated transaction matching and reconciliation with exception handling",
    category: "Operations",
    difficulty: "advanced",
    estimatedTime: "35 min",
    nodeCount: 18,
    rating: 4.8,
    downloads: 412,
    author: "Operations Team",
    tags: ["reconciliation", "matching", "exceptions", "automation"],
    icon: CheckCircle2,
    color: "bg-emerald-500",
    preview: [
      "Data Import",
      "Transaction Matching",
      "Exception Detection",
      "Manual Review",
      "Final Report",
    ],
    features: [
      "Smart matching",
      "Exception handling",
      "Audit trails",
      "Automated reporting",
    ],
  },
  {
    id: "8",
    name: "API Integration Workflow",
    description:
      "Template for integrating external APIs with error handling and retry logic",
    category: "Integration",
    difficulty: "intermediate",
    estimatedTime: "18 min",
    nodeCount: 10,
    rating: 4.4,
    downloads: 678,
    author: "Integration Team",
    tags: ["api", "integration", "error-handling", "retry"],
    icon: Globe,
    color: "bg-orange-500",
    preview: [
      "API Call",
      "Response Validation",
      "Error Handling",
      "Retry Logic",
      "Data Processing",
    ],
    features: [
      "Retry mechanisms",
      "Error handling",
      "Rate limiting",
      "Response validation",
    ],
  },
];
const WorkflowTemplates = ({ onUseTemplate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const filteredTemplates = WORKFLOW_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesCategory =
      categoryFilter === "all" || template.category === categoryFilter;
    const matchesDifficulty =
      difficultyFilter === "all" || template.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  const categories = [
    "all",
    ...Array.from(new Set(WORKFLOW_TEMPLATES.map((t) => t.category))),
  ];
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return _jsxs("div", {
    className: "p-6 space-y-6",
    children: [
      _jsx("div", {
        className: "flex items-center justify-between",
        children: _jsxs("div", {
          children: [
            _jsxs("h1", {
              className: "text-3xl font-bold flex items-center gap-2",
              children: [
                _jsx(Zap, { className: "h-8 w-8 text-primary" }),
                "Workflow Templates",
              ],
            }),
            _jsx("p", {
              className: "text-muted-foreground mt-1",
              children: "Get started quickly with pre-built workflow templates",
            }),
          ],
        }),
      }),
      _jsxs("div", {
        className: "flex flex-col sm:flex-row gap-4",
        children: [
          _jsxs("div", {
            className: "relative flex-1",
            children: [
              _jsx(Search, {
                className:
                  "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
              }),
              _jsx(Input, {
                placeholder: "Search templates...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "pl-10",
              }),
            ],
          }),
          _jsxs(Select, {
            value: categoryFilter,
            onValueChange: setCategoryFilter,
            children: [
              _jsx(SelectTrigger, {
                className: "w-[180px]",
                children: _jsx(SelectValue, {
                  placeholder: "Filter by category",
                }),
              }),
              _jsx(SelectContent, {
                children: categories.map((category) =>
                  _jsx(
                    SelectItem,
                    {
                      value: category,
                      children:
                        category === "all" ? "All Categories" : category,
                    },
                    category,
                  ),
                ),
              }),
            ],
          }),
          _jsxs(Select, {
            value: difficultyFilter,
            onValueChange: setDifficultyFilter,
            children: [
              _jsx(SelectTrigger, {
                className: "w-[180px]",
                children: _jsx(SelectValue, {
                  placeholder: "Filter by difficulty",
                }),
              }),
              _jsxs(SelectContent, {
                children: [
                  _jsx(SelectItem, {
                    value: "all",
                    children: "All Difficulties",
                  }),
                  _jsx(SelectItem, { value: "beginner", children: "Beginner" }),
                  _jsx(SelectItem, {
                    value: "intermediate",
                    children: "Intermediate",
                  }),
                  _jsx(SelectItem, { value: "advanced", children: "Advanced" }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        children: [
          _jsx("h2", {
            className: "text-xl font-semibold mb-4",
            children: "Featured Templates",
          }),
          _jsx("div", {
            className: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6",
            children: filteredTemplates.slice(0, 3).map((template) => {
              const Icon = template.icon;
              return _jsx(
                motion.div,
                {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  whileHover: { y: -2 },
                  transition: { duration: 0.2 },
                  children: _jsxs(Card, {
                    className: "h-full hover:shadow-lg transition-shadow",
                    children: [
                      _jsxs(CardHeader, {
                        className: "pb-3",
                        children: [
                          _jsxs("div", {
                            className: "flex items-start gap-3",
                            children: [
                              _jsx("div", {
                                className: `p-3 rounded-lg ${template.color} text-white`,
                                children: _jsx(Icon, { className: "h-6 w-6" }),
                              }),
                              _jsxs("div", {
                                className: "flex-1",
                                children: [
                                  _jsx(CardTitle, {
                                    className: "text-lg line-clamp-1",
                                    children: template.name,
                                  }),
                                  _jsx("p", {
                                    className:
                                      "text-sm text-muted-foreground mt-1 line-clamp-2",
                                    children: template.description,
                                  }),
                                ],
                              }),
                              _jsx(Star, {
                                className:
                                  "h-4 w-4 text-yellow-500 fill-current",
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex items-center gap-2 mt-3",
                            children: [
                              _jsx(Badge, {
                                variant: "outline",
                                children: template.category,
                              }),
                              _jsx(Badge, {
                                className: getDifficultyColor(
                                  template.difficulty,
                                ),
                                children: template.difficulty,
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs(CardContent, {
                        className: "space-y-4",
                        children: [
                          _jsxs("div", {
                            className: "grid grid-cols-3 gap-4 text-sm",
                            children: [
                              _jsxs("div", {
                                className: "text-center",
                                children: [
                                  _jsx("div", {
                                    className: "text-muted-foreground",
                                    children: "Nodes",
                                  }),
                                  _jsx("div", {
                                    className: "font-medium",
                                    children: template.nodeCount,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "text-center",
                                children: [
                                  _jsx("div", {
                                    className: "text-muted-foreground",
                                    children: "Time",
                                  }),
                                  _jsx("div", {
                                    className: "font-medium",
                                    children: template.estimatedTime,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "text-center",
                                children: [
                                  _jsx("div", {
                                    className: "text-muted-foreground",
                                    children: "Rating",
                                  }),
                                  _jsx("div", {
                                    className: "font-medium",
                                    children: template.rating,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex flex-wrap gap-1",
                            children: [
                              template.tags.slice(0, 3).map((tag) =>
                                _jsx(
                                  Badge,
                                  {
                                    variant: "secondary",
                                    className: "text-xs",
                                    children: tag,
                                  },
                                  tag,
                                ),
                              ),
                              template.tags.length > 3 &&
                                _jsxs(Badge, {
                                  variant: "secondary",
                                  className: "text-xs",
                                  children: ["+", template.tags.length - 3],
                                }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex gap-2 pt-2",
                            children: [
                              _jsxs(Dialog, {
                                children: [
                                  _jsx(DialogTrigger, {
                                    asChild: true,
                                    children: _jsxs(Button, {
                                      variant: "outline",
                                      size: "sm",
                                      className: "flex-1",
                                      children: [
                                        _jsx(Eye, {
                                          className: "h-3 w-3 mr-1",
                                        }),
                                        "Preview",
                                      ],
                                    }),
                                  }),
                                  _jsxs(DialogContent, {
                                    className: "max-w-2xl",
                                    children: [
                                      _jsx(DialogHeader, {
                                        children: _jsxs(DialogTitle, {
                                          className: "flex items-center gap-2",
                                          children: [
                                            _jsx("div", {
                                              className: `p-2 rounded ${template.color} text-white`,
                                              children: _jsx(Icon, {
                                                className: "h-4 w-4",
                                              }),
                                            }),
                                            template.name,
                                          ],
                                        }),
                                      }),
                                      _jsx(TemplatePreview, {
                                        template: template,
                                        onUse: () => onUseTemplate(template.id),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsxs(Button, {
                                size: "sm",
                                className: "flex-1",
                                onClick: () => onUseTemplate(template.id),
                                children: [
                                  _jsx(Play, { className: "h-3 w-3 mr-1" }),
                                  "Use Template",
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                },
                template.id,
              );
            }),
          }),
        ],
      }),
      _jsxs("div", {
        children: [
          _jsx("h2", {
            className: "text-xl font-semibold mb-4",
            children: "All Templates",
          }),
          _jsx("div", {
            className: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6",
            children: filteredTemplates.slice(3).map((template) => {
              const Icon = template.icon;
              return _jsx(
                motion.div,
                {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  whileHover: { y: -2 },
                  transition: { duration: 0.2 },
                  children: _jsxs(Card, {
                    className: "h-full hover:shadow-lg transition-shadow",
                    children: [
                      _jsxs(CardHeader, {
                        className: "pb-3",
                        children: [
                          _jsxs("div", {
                            className: "flex items-start gap-3",
                            children: [
                              _jsx("div", {
                                className: `p-2 rounded ${template.color} text-white`,
                                children: _jsx(Icon, { className: "h-5 w-5" }),
                              }),
                              _jsxs("div", {
                                className: "flex-1",
                                children: [
                                  _jsx(CardTitle, {
                                    className: "text-base line-clamp-1",
                                    children: template.name,
                                  }),
                                  _jsx("p", {
                                    className:
                                      "text-xs text-muted-foreground mt-1 line-clamp-2",
                                    children: template.description,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex items-center gap-2 mt-2",
                            children: [
                              _jsx(Badge, {
                                variant: "outline",
                                className: "text-xs",
                                children: template.category,
                              }),
                              _jsx(Badge, {
                                className: `text-xs ${getDifficultyColor(template.difficulty)}`,
                                children: template.difficulty,
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs(CardContent, {
                        className: "space-y-3",
                        children: [
                          _jsxs("div", {
                            className: "grid grid-cols-2 gap-3 text-xs",
                            children: [
                              _jsxs("div", {
                                children: [
                                  _jsx("div", {
                                    className: "text-muted-foreground",
                                    children: "Downloads",
                                  }),
                                  _jsx("div", {
                                    className: "font-medium",
                                    children: template.downloads,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx("div", {
                                    className: "text-muted-foreground",
                                    children: "Author",
                                  }),
                                  _jsx("div", {
                                    className: "font-medium",
                                    children: template.author,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex gap-2",
                            children: [
                              _jsxs(Dialog, {
                                children: [
                                  _jsx(DialogTrigger, {
                                    asChild: true,
                                    children: _jsxs(Button, {
                                      variant: "outline",
                                      size: "sm",
                                      className: "flex-1",
                                      children: [
                                        _jsx(Eye, {
                                          className: "h-3 w-3 mr-1",
                                        }),
                                        "Preview",
                                      ],
                                    }),
                                  }),
                                  _jsxs(DialogContent, {
                                    className: "max-w-2xl",
                                    children: [
                                      _jsx(DialogHeader, {
                                        children: _jsxs(DialogTitle, {
                                          className: "flex items-center gap-2",
                                          children: [
                                            _jsx("div", {
                                              className: `p-2 rounded ${template.color} text-white`,
                                              children: _jsx(Icon, {
                                                className: "h-4 w-4",
                                              }),
                                            }),
                                            template.name,
                                          ],
                                        }),
                                      }),
                                      _jsx(TemplatePreview, {
                                        template: template,
                                        onUse: () => onUseTemplate(template.id),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsxs(Button, {
                                size: "sm",
                                className: "flex-1",
                                onClick: () => onUseTemplate(template.id),
                                children: [
                                  _jsx(Play, { className: "h-3 w-3 mr-1" }),
                                  "Use",
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                },
                template.id,
              );
            }),
          }),
        ],
      }),
      filteredTemplates.length === 0 &&
        _jsxs("div", {
          className: "text-center py-12",
          children: [
            _jsx(Search, {
              className: "h-12 w-12 mx-auto text-muted-foreground mb-4",
            }),
            _jsx("h3", {
              className: "text-lg font-medium mb-2",
              children: "No templates found",
            }),
            _jsx("p", {
              className: "text-muted-foreground mb-4",
              children: "Try adjusting your search terms or filters",
            }),
          ],
        }),
    ],
  });
};
// Template Preview Component
const TemplatePreview = ({ template, onUse }) => {
  const Icon = template.icon;
  return _jsxs("div", {
    className: "space-y-6",
    children: [
      _jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-2 gap-6",
        children: [
          _jsxs("div", {
            children: [
              _jsx("h3", {
                className: "font-semibold mb-3",
                children: "Workflow Steps",
              }),
              _jsx("div", {
                className: "space-y-2",
                children: template.preview.map((step, index) =>
                  _jsxs(
                    "div",
                    {
                      className: "flex items-center gap-3 p-2 border rounded",
                      children: [
                        _jsx("div", {
                          className:
                            "w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center",
                          children: index + 1,
                        }),
                        _jsx("span", { className: "text-sm", children: step }),
                      ],
                    },
                    index,
                  ),
                ),
              }),
            ],
          }),
          _jsxs("div", {
            children: [
              _jsx("h3", {
                className: "font-semibold mb-3",
                children: "Key Features",
              }),
              _jsx("div", {
                className: "space-y-2",
                children: template.features.map((feature, index) =>
                  _jsxs(
                    "div",
                    {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(CheckCircle2, {
                          className: "h-4 w-4 text-green-500",
                        }),
                        _jsx("span", {
                          className: "text-sm",
                          children: feature,
                        }),
                      ],
                    },
                    index,
                  ),
                ),
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "flex items-center justify-between pt-4 border-t",
        children: [
          _jsxs("div", {
            className: "flex items-center gap-4 text-sm text-muted-foreground",
            children: [
              _jsxs("span", { children: [template.nodeCount, " nodes"] }),
              _jsxs("span", { children: [template.estimatedTime, " setup"] }),
              _jsxs("span", { children: [template.downloads, " downloads"] }),
            ],
          }),
          _jsxs(Button, {
            onClick: onUse,
            children: [
              _jsx(Play, { className: "h-4 w-4 mr-2" }),
              "Use This Template",
            ],
          }),
        ],
      }),
    ],
  });
};
export default WorkflowTemplates;
