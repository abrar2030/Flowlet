import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle2,
  DollarSign,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
// Mock data for analytics
const ANALYTICS_DATA = {
  overview: {
    totalExecutions: 15847,
    successRate: 96.8,
    avgExecutionTime: 2.3,
    activeWorkflows: 12,
    totalSavings: 125000,
    executionTrend: 12.5,
  },
  topWorkflows: [
    {
      name: "Payment Processing Pipeline",
      executions: 4521,
      successRate: 98.5,
      avgTime: 1.8,
    },
    {
      name: "Fraud Alert System",
      executions: 3892,
      successRate: 96.2,
      avgTime: 0.9,
    },
    {
      name: "KYC Verification Flow",
      executions: 2847,
      successRate: 94.1,
      avgTime: 4.2,
    },
    {
      name: "Card Issuance Automation",
      executions: 1923,
      successRate: 99.1,
      avgTime: 3.1,
    },
    {
      name: "Compliance Reporting",
      executions: 1456,
      successRate: 97.8,
      avgTime: 5.7,
    },
  ],
  executionHistory: [
    { date: "2024-01-15", executions: 1247, success: 1205, failed: 42 },
    { date: "2024-01-16", executions: 1389, success: 1342, failed: 47 },
    { date: "2024-01-17", executions: 1156, success: 1121, failed: 35 },
    { date: "2024-01-18", executions: 1523, success: 1478, failed: 45 },
    { date: "2024-01-19", executions: 1678, success: 1623, failed: 55 },
    { date: "2024-01-20", executions: 1445, success: 1398, failed: 47 },
    { date: "2024-01-21", executions: 1289, success: 1251, failed: 38 },
  ],
  errorAnalysis: [
    { type: "Network Timeout", count: 89, percentage: 32.1 },
    { type: "Validation Error", count: 67, percentage: 24.2 },
    { type: "API Rate Limit", count: 45, percentage: 16.2 },
    { type: "Authentication Failed", count: 38, percentage: 13.7 },
    { type: "Data Format Error", count: 28, percentage: 10.1 },
    { type: "Other", count: 10, percentage: 3.6 },
  ],
};
const WorkflowAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("executions");
  const { overview, topWorkflows, executionHistory, errorAnalysis } =
    ANALYTICS_DATA;
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
                  _jsx(BarChart3, { className: "h-8 w-8 text-primary" }),
                  "Workflow Analytics",
                ],
              }),
              _jsx("p", {
                className: "text-muted-foreground mt-1",
                children:
                  "Monitor performance and optimize your automation workflows",
              }),
            ],
          }),
          _jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              _jsxs(Select, {
                value: timeRange,
                onValueChange: setTimeRange,
                children: [
                  _jsx(SelectTrigger, {
                    className: "w-[140px]",
                    children: _jsx(SelectValue, {}),
                  }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, {
                        value: "24h",
                        children: "Last 24 hours",
                      }),
                      _jsx(SelectItem, {
                        value: "7d",
                        children: "Last 7 days",
                      }),
                      _jsx(SelectItem, {
                        value: "30d",
                        children: "Last 30 days",
                      }),
                      _jsx(SelectItem, {
                        value: "90d",
                        children: "Last 90 days",
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs(Button, {
                variant: "outline",
                size: "sm",
                children: [
                  _jsx(Download, { className: "h-4 w-4 mr-2" }),
                  "Export Report",
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        children: [
          _jsx(motion.div, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.1 },
            children: _jsx(Card, {
              children: _jsxs(CardContent, {
                className: "p-4",
                children: [
                  _jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("p", {
                            className:
                              "text-sm font-medium text-muted-foreground",
                            children: "Total Executions",
                          }),
                          _jsx("p", {
                            className: "text-2xl font-bold",
                            children: overview.totalExecutions.toLocaleString(),
                          }),
                        ],
                      }),
                      _jsx("div", {
                        className: "p-2 bg-blue-100 rounded-lg",
                        children: _jsx(Activity, {
                          className: "h-4 w-4 text-blue-600",
                        }),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex items-center mt-2 text-sm",
                    children: [
                      _jsx(TrendingUp, {
                        className: "h-3 w-3 text-green-500 mr-1",
                      }),
                      _jsxs("span", {
                        className: "text-green-500",
                        children: ["+", overview.executionTrend, "%"],
                      }),
                      _jsx("span", {
                        className: "text-muted-foreground ml-1",
                        children: "vs last period",
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
          _jsx(motion.div, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.2 },
            children: _jsx(Card, {
              children: _jsxs(CardContent, {
                className: "p-4",
                children: [
                  _jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("p", {
                            className:
                              "text-sm font-medium text-muted-foreground",
                            children: "Success Rate",
                          }),
                          _jsxs("p", {
                            className: "text-2xl font-bold",
                            children: [overview.successRate, "%"],
                          }),
                        ],
                      }),
                      _jsx("div", {
                        className: "p-2 bg-green-100 rounded-lg",
                        children: _jsx(CheckCircle2, {
                          className: "h-4 w-4 text-green-600",
                        }),
                      }),
                    ],
                  }),
                  _jsx("div", {
                    className: "mt-2",
                    children: _jsx(Progress, {
                      value: overview.successRate,
                      className: "h-2",
                    }),
                  }),
                ],
              }),
            }),
          }),
          _jsx(motion.div, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.3 },
            children: _jsx(Card, {
              children: _jsxs(CardContent, {
                className: "p-4",
                children: [
                  _jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("p", {
                            className:
                              "text-sm font-medium text-muted-foreground",
                            children: "Avg Execution Time",
                          }),
                          _jsxs("p", {
                            className: "text-2xl font-bold",
                            children: [overview.avgExecutionTime, "s"],
                          }),
                        ],
                      }),
                      _jsx("div", {
                        className: "p-2 bg-orange-100 rounded-lg",
                        children: _jsx(Clock, {
                          className: "h-4 w-4 text-orange-600",
                        }),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex items-center mt-2 text-sm",
                    children: [
                      _jsx(TrendingDown, {
                        className: "h-3 w-3 text-green-500 mr-1",
                      }),
                      _jsx("span", {
                        className: "text-green-500",
                        children: "-8.2%",
                      }),
                      _jsx("span", {
                        className: "text-muted-foreground ml-1",
                        children: "faster",
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
          _jsx(motion.div, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.4 },
            children: _jsx(Card, {
              children: _jsxs(CardContent, {
                className: "p-4",
                children: [
                  _jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("p", {
                            className:
                              "text-sm font-medium text-muted-foreground",
                            children: "Cost Savings",
                          }),
                          _jsxs("p", {
                            className: "text-2xl font-bold",
                            children: [
                              "$",
                              overview.totalSavings.toLocaleString(),
                            ],
                          }),
                        ],
                      }),
                      _jsx("div", {
                        className: "p-2 bg-purple-100 rounded-lg",
                        children: _jsx(DollarSign, {
                          className: "h-4 w-4 text-purple-600",
                        }),
                      }),
                    ],
                  }),
                  _jsx("div", {
                    className: "flex items-center mt-2 text-sm",
                    children: _jsx("span", {
                      className: "text-muted-foreground",
                      children: "This month",
                    }),
                  }),
                ],
              }),
            }),
          }),
        ],
      }),
      _jsxs(Tabs, {
        defaultValue: "performance",
        className: "space-y-4",
        children: [
          _jsxs(TabsList, {
            children: [
              _jsx(TabsTrigger, {
                value: "performance",
                children: "Performance",
              }),
              _jsx(TabsTrigger, {
                value: "errors",
                children: "Error Analysis",
              }),
              _jsx(TabsTrigger, { value: "usage", children: "Usage Patterns" }),
              _jsx(TabsTrigger, { value: "costs", children: "Cost Analysis" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "performance",
            className: "space-y-4",
            children: _jsxs("div", {
              className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
              children: [
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Top Performing Workflows",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-4",
                        children: topWorkflows.map((workflow, index) =>
                          _jsxs(
                            "div",
                            {
                              className:
                                "flex items-center justify-between p-3 border rounded-lg",
                              children: [
                                _jsxs("div", {
                                  className: "flex-1",
                                  children: [
                                    _jsx("div", {
                                      className: "font-medium text-sm",
                                      children: workflow.name,
                                    }),
                                    _jsxs("div", {
                                      className:
                                        "text-xs text-muted-foreground mt-1",
                                      children: [
                                        workflow.executions.toLocaleString(),
                                        " executions \u2022",
                                        " ",
                                        workflow.avgTime,
                                        "s avg",
                                      ],
                                    }),
                                  ],
                                }),
                                _jsx("div", {
                                  className: "text-right",
                                  children: _jsxs(Badge, {
                                    variant:
                                      workflow.successRate > 95
                                        ? "default"
                                        : "secondary",
                                    children: [workflow.successRate, "%"],
                                  }),
                                }),
                              ],
                            },
                            workflow.name,
                          ),
                        ),
                      }),
                    }),
                  ],
                }),
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Execution History",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: executionHistory.map((day, index) =>
                          _jsxs(
                            "div",
                            {
                              className: "flex items-center gap-3",
                              children: [
                                _jsx("div", {
                                  className:
                                    "text-xs text-muted-foreground w-16",
                                  children: new Date(
                                    day.date,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  }),
                                }),
                                _jsxs("div", {
                                  className: "flex-1",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center gap-2 mb-1",
                                      children: [
                                        _jsx("span", {
                                          className: "text-sm font-medium",
                                          children: day.executions,
                                        }),
                                        _jsx("span", {
                                          className:
                                            "text-xs text-muted-foreground",
                                          children: "executions",
                                        }),
                                      ],
                                    }),
                                    _jsxs("div", {
                                      className: "flex gap-1",
                                      children: [
                                        _jsx("div", {
                                          className:
                                            "h-2 bg-green-500 rounded-sm",
                                          style: {
                                            width: `${(day.success / day.executions) * 100}%`,
                                          },
                                        }),
                                        _jsx("div", {
                                          className:
                                            "h-2 bg-red-500 rounded-sm",
                                          style: {
                                            width: `${(day.failed / day.executions) * 100}%`,
                                          },
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className: "text-xs text-muted-foreground",
                                  children: [
                                    (
                                      (day.success / day.executions) *
                                      100
                                    ).toFixed(1),
                                    "%",
                                  ],
                                }),
                              ],
                            },
                            day.date,
                          ),
                        ),
                      }),
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "errors",
            className: "space-y-4",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, { children: "Error Analysis" }),
                }),
                _jsx(CardContent, {
                  children: _jsx("div", {
                    className: "space-y-4",
                    children: errorAnalysis.map((error, index) =>
                      _jsx(
                        "div",
                        {
                          className: "flex items-center gap-4",
                          children: _jsxs("div", {
                            className: "flex-1",
                            children: [
                              _jsxs("div", {
                                className:
                                  "flex items-center justify-between mb-1",
                                children: [
                                  _jsx("span", {
                                    className: "font-medium text-sm",
                                    children: error.type,
                                  }),
                                  _jsxs("span", {
                                    className: "text-sm text-muted-foreground",
                                    children: [
                                      error.count,
                                      " (",
                                      error.percentage,
                                      "%)",
                                    ],
                                  }),
                                ],
                              }),
                              _jsx(Progress, {
                                value: error.percentage,
                                className: "h-2",
                              }),
                            ],
                          }),
                        },
                        error.type,
                      ),
                    ),
                  }),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "usage",
            className: "space-y-4",
            children: _jsxs("div", {
              className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
              children: [
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Peak Usage Hours",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsxs("div", {
                        className: "text-center text-muted-foreground",
                        children: [
                          _jsx(BarChart3, {
                            className: "h-12 w-12 mx-auto mb-4 opacity-50",
                          }),
                          _jsx("p", {
                            children: "Usage pattern analysis coming soon",
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Workflow Categories",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsxs("div", {
                        className: "text-center text-muted-foreground",
                        children: [
                          _jsx(Activity, {
                            className: "h-12 w-12 mx-auto mb-4 opacity-50",
                          }),
                          _jsx("p", {
                            children: "Category breakdown coming soon",
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "costs",
            className: "space-y-4",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, { children: "Cost Breakdown" }),
                }),
                _jsx(CardContent, {
                  children: _jsxs("div", {
                    className: "text-center text-muted-foreground",
                    children: [
                      _jsx(DollarSign, {
                        className: "h-12 w-12 mx-auto mb-4 opacity-50",
                      }),
                      _jsx("p", { children: "Cost analysis coming soon" }),
                    ],
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
};
export default WorkflowAnalytics;
