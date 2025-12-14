import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Archive,
  Eye,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
const SAMPLE_WORKFLOWS = [
  {
    id: "1",
    name: "Payment Processing Pipeline",
    description:
      "Automated payment processing with fraud detection and compliance checks",
    status: "active",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    version: 3,
    nodeCount: 8,
    executionCount: 1247,
    successRate: 98.5,
    lastRun: new Date("2024-01-21"),
    creator: "John Doe",
    category: "Payments",
  },
  {
    id: "2",
    name: "KYC Verification Flow",
    description:
      "Customer verification workflow with document validation and risk assessment",
    status: "active",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    version: 2,
    nodeCount: 12,
    executionCount: 856,
    successRate: 94.2,
    lastRun: new Date("2024-01-21"),
    creator: "Jane Smith",
    category: "Compliance",
  },
  {
    id: "3",
    name: "Card Issuance Automation",
    description: "Automated card creation and activation process",
    status: "paused",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-15"),
    version: 1,
    nodeCount: 6,
    executionCount: 423,
    successRate: 99.1,
    lastRun: new Date("2024-01-15"),
    creator: "Mike Johnson",
    category: "Cards",
  },
  {
    id: "4",
    name: "Fraud Alert System",
    description: "Real-time fraud detection and alert notification system",
    status: "active",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-19"),
    version: 4,
    nodeCount: 15,
    executionCount: 2341,
    successRate: 96.8,
    lastRun: new Date("2024-01-21"),
    creator: "Sarah Wilson",
    category: "Security",
  },
  {
    id: "5",
    name: "Monthly Report Generation",
    description: "Automated monthly financial reports and analytics",
    status: "draft",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-21"),
    version: 1,
    nodeCount: 4,
    executionCount: 0,
    successRate: 0,
    creator: "Alex Brown",
    category: "Analytics",
  },
];
const WorkflowList = ({ onCreateNew, onEditWorkflow }) => {
  const [workflows] = useState(SAMPLE_WORKFLOWS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || workflow.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || workflow.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "draft":
        return "bg-gray-500";
      case "archived":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return _jsx(Play, { className: "h-3 w-3" });
      case "paused":
        return _jsx(Pause, { className: "h-3 w-3" });
      case "draft":
        return _jsx(Edit, { className: "h-3 w-3" });
      case "archived":
        return _jsx(Archive, { className: "h-3 w-3" });
      default:
        return _jsx(AlertCircle, { className: "h-3 w-3" });
    }
  };
  const categories = [
    "all",
    ...Array.from(new Set(workflows.map((w) => w.category))),
  ];
  return _jsxs("div", {
    className: "p-6 space-y-6",
    children: [
      _jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          _jsxs("div", {
            children: [
              _jsxs("h1", {
                className: "text-3xl font-bold flex items-center gap-2",
                children: [
                  _jsx(Zap, { className: "h-8 w-8 text-primary" }),
                  "Workflow Management",
                ],
              }),
              _jsx("p", {
                className: "text-muted-foreground mt-1",
                children:
                  "Create and manage your financial automation workflows",
              }),
            ],
          }),
          _jsxs(Button, {
            onClick: onCreateNew,
            className: "gap-2",
            children: [_jsx(Plus, { className: "h-4 w-4" }), "Create Workflow"],
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-4 gap-4",
        children: [
          _jsx(Card, {
            children: _jsxs(CardContent, {
              className: "p-4",
              children: [
                _jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    _jsx(Activity, { className: "h-4 w-4 text-blue-500" }),
                    _jsx("span", {
                      className: "text-sm font-medium",
                      children: "Total Workflows",
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "text-2xl font-bold mt-1",
                  children: workflows.length,
                }),
              ],
            }),
          }),
          _jsx(Card, {
            children: _jsxs(CardContent, {
              className: "p-4",
              children: [
                _jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    _jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" }),
                    _jsx("span", {
                      className: "text-sm font-medium",
                      children: "Active",
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "text-2xl font-bold mt-1",
                  children: workflows.filter((w) => w.status === "active")
                    .length,
                }),
              ],
            }),
          }),
          _jsx(Card, {
            children: _jsxs(CardContent, {
              className: "p-4",
              children: [
                _jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    _jsx(TrendingUp, { className: "h-4 w-4 text-purple-500" }),
                    _jsx("span", {
                      className: "text-sm font-medium",
                      children: "Total Executions",
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "text-2xl font-bold mt-1",
                  children: workflows
                    .reduce((sum, w) => sum + w.executionCount, 0)
                    .toLocaleString(),
                }),
              ],
            }),
          }),
          _jsx(Card, {
            children: _jsxs(CardContent, {
              className: "p-4",
              children: [
                _jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    _jsx(Activity, { className: "h-4 w-4 text-orange-500" }),
                    _jsx("span", {
                      className: "text-sm font-medium",
                      children: "Avg Success Rate",
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "text-2xl font-bold mt-1",
                  children: [
                    (
                      workflows.reduce((sum, w) => sum + w.successRate, 0) /
                      workflows.length
                    ).toFixed(1),
                    "%",
                  ],
                }),
              ],
            }),
          }),
        ],
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
                placeholder: "Search workflows...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "pl-10",
              }),
            ],
          }),
          _jsxs(Select, {
            value: statusFilter,
            onValueChange: setStatusFilter,
            children: [
              _jsx(SelectTrigger, {
                className: "w-[180px]",
                children: _jsx(SelectValue, {
                  placeholder: "Filter by status",
                }),
              }),
              _jsxs(SelectContent, {
                children: [
                  _jsx(SelectItem, { value: "all", children: "All Statuses" }),
                  _jsx(SelectItem, { value: "active", children: "Active" }),
                  _jsx(SelectItem, { value: "paused", children: "Paused" }),
                  _jsx(SelectItem, { value: "draft", children: "Draft" }),
                  _jsx(SelectItem, { value: "archived", children: "Archived" }),
                ],
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
        ],
      }),
      _jsx("div", {
        className: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6",
        children: filteredWorkflows.map((workflow) =>
          _jsx(
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
                        className: "flex items-start justify-between",
                        children: [
                          _jsxs("div", {
                            className: "flex-1",
                            children: [
                              _jsx(CardTitle, {
                                className: "text-lg line-clamp-1",
                                children: workflow.name,
                              }),
                              _jsx("p", {
                                className:
                                  "text-sm text-muted-foreground mt-1 line-clamp-2",
                                children: workflow.description,
                              }),
                            ],
                          }),
                          _jsxs(DropdownMenu, {
                            children: [
                              _jsx(DropdownMenuTrigger, {
                                asChild: true,
                                children: _jsx(Button, {
                                  variant: "ghost",
                                  size: "sm",
                                  children: _jsx(MoreVertical, {
                                    className: "h-4 w-4",
                                  }),
                                }),
                              }),
                              _jsxs(DropdownMenuContent, {
                                align: "end",
                                children: [
                                  _jsxs(DropdownMenuItem, {
                                    onClick: () => onEditWorkflow(workflow.id),
                                    children: [
                                      _jsx(Edit, { className: "h-4 w-4 mr-2" }),
                                      "Edit",
                                    ],
                                  }),
                                  _jsxs(DropdownMenuItem, {
                                    children: [
                                      _jsx(Eye, { className: "h-4 w-4 mr-2" }),
                                      "View Details",
                                    ],
                                  }),
                                  _jsxs(DropdownMenuItem, {
                                    children: [
                                      _jsx(Copy, { className: "h-4 w-4 mr-2" }),
                                      "Duplicate",
                                    ],
                                  }),
                                  _jsx(DropdownMenuSeparator, {}),
                                  _jsxs(DropdownMenuItem, {
                                    className: "text-red-600",
                                    children: [
                                      _jsx(Trash2, {
                                        className: "h-4 w-4 mr-2",
                                      }),
                                      "Delete",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "flex items-center gap-2 mt-3",
                        children: [
                          _jsxs(Badge, {
                            variant: "secondary",
                            className: `${getStatusColor(workflow.status)} text-white`,
                            children: [
                              getStatusIcon(workflow.status),
                              _jsx("span", {
                                className: "ml-1 capitalize",
                                children: workflow.status,
                              }),
                            ],
                          }),
                          _jsx(Badge, {
                            variant: "outline",
                            children: workflow.category,
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs(CardContent, {
                    className: "space-y-4",
                    children: [
                      _jsxs("div", {
                        className: "grid grid-cols-2 gap-4 text-sm",
                        children: [
                          _jsxs("div", {
                            children: [
                              _jsx("div", {
                                className: "text-muted-foreground",
                                children: "Nodes",
                              }),
                              _jsx("div", {
                                className: "font-medium",
                                children: workflow.nodeCount,
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            children: [
                              _jsx("div", {
                                className: "text-muted-foreground",
                                children: "Executions",
                              }),
                              _jsx("div", {
                                className: "font-medium",
                                children:
                                  workflow.executionCount.toLocaleString(),
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        children: [
                          _jsxs("div", {
                            className: "flex justify-between text-sm mb-1",
                            children: [
                              _jsx("span", {
                                className: "text-muted-foreground",
                                children: "Success Rate",
                              }),
                              _jsxs("span", {
                                className: "font-medium",
                                children: [workflow.successRate, "%"],
                              }),
                            ],
                          }),
                          _jsx(Progress, {
                            value: workflow.successRate,
                            className: "h-2",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className:
                          "flex items-center justify-between text-xs text-muted-foreground",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-1",
                            children: [
                              _jsx(Avatar, {
                                className: "h-4 w-4",
                                children: _jsx(AvatarFallback, {
                                  className: "text-xs",
                                  children: workflow.creator
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join(""),
                                }),
                              }),
                              _jsx("span", { children: workflow.creator }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex items-center gap-1",
                            children: [
                              _jsx(Clock, { className: "h-3 w-3" }),
                              _jsx("span", {
                                children: workflow.lastRun
                                  ? `Last run ${workflow.lastRun.toLocaleDateString()}`
                                  : "Never run",
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "flex gap-2 pt-2",
                        children: [
                          _jsxs(Button, {
                            variant: "outline",
                            size: "sm",
                            className: "flex-1",
                            onClick: () => onEditWorkflow(workflow.id),
                            children: [
                              _jsx(Edit, { className: "h-3 w-3 mr-1" }),
                              "Edit",
                            ],
                          }),
                          _jsx(Button, {
                            variant:
                              workflow.status === "active"
                                ? "destructive"
                                : "default",
                            size: "sm",
                            className: "flex-1",
                            children:
                              workflow.status === "active"
                                ? _jsxs(_Fragment, {
                                    children: [
                                      _jsx(Pause, {
                                        className: "h-3 w-3 mr-1",
                                      }),
                                      "Pause",
                                    ],
                                  })
                                : _jsxs(_Fragment, {
                                    children: [
                                      _jsx(Play, { className: "h-3 w-3 mr-1" }),
                                      "Run",
                                    ],
                                  }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            },
            workflow.id,
          ),
        ),
      }),
      filteredWorkflows.length === 0 &&
        _jsxs("div", {
          className: "text-center py-12",
          children: [
            _jsx(Zap, {
              className: "h-12 w-12 mx-auto text-muted-foreground mb-4",
            }),
            _jsx("h3", {
              className: "text-lg font-medium mb-2",
              children: "No workflows found",
            }),
            _jsx("p", {
              className: "text-muted-foreground mb-4",
              children:
                searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Create your first workflow to get started",
            }),
            !searchTerm &&
              statusFilter === "all" &&
              categoryFilter === "all" &&
              _jsxs(Button, {
                onClick: onCreateNew,
                children: [
                  _jsx(Plus, { className: "h-4 w-4 mr-2" }),
                  "Create Your First Workflow",
                ],
              }),
          ],
        }),
    ],
  });
};
export default WorkflowList;
