import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Activity,
  BarChart3,
} from "lucide-react";
export default function AnalyticsScreen() {
  const stats = [
    {
      title: "Total Transactions",
      value: "1,234",
      change: "+12%",
      icon: Activity,
    },
    {
      title: "Total Volume",
      value: "$45,678",
      change: "+8%",
      icon: DollarSign,
    },
    { title: "Active Cards", value: "23", change: "+3", icon: CreditCard },
    {
      title: "Avg Transaction",
      value: "$37.02",
      change: "-2%",
      icon: BarChart3,
    },
  ];
  return _jsxs("div", {
    className: "container mx-auto p-6",
    children: [
      _jsxs("div", {
        className: "mb-8",
        children: [
          _jsx("h1", {
            className: "text-3xl font-bold mb-2",
            children: "Analytics Dashboard",
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children: "Track your financial performance and insights",
          }),
        ],
      }),
      _jsx("div", {
        className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8",
        children: stats.map((stat) =>
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
                _jsxs(CardContent, {
                  children: [
                    _jsx("div", {
                      className: "text-2xl font-bold",
                      children: stat.value,
                    }),
                    _jsxs("p", {
                      className:
                        "text-xs text-muted-foreground flex items-center gap-1",
                      children: [
                        _jsx(TrendingUp, { className: "h-3 w-3" }),
                        stat.change,
                        " from last month",
                      ],
                    }),
                  ],
                }),
              ],
            },
            stat.title,
          ),
        ),
      }),
      _jsxs(Tabs, {
        defaultValue: "overview",
        className: "space-y-4",
        children: [
          _jsxs(TabsList, {
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, {
                value: "transactions",
                children: "Transactions",
              }),
              _jsx(TabsTrigger, { value: "spending", children: "Spending" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "overview",
            className: "space-y-4",
            children: _jsxs(Card, {
              children: [
                _jsxs(CardHeader, {
                  children: [
                    _jsx(CardTitle, { children: "Transaction Overview" }),
                    _jsx(CardDescription, {
                      children: "Your transaction activity over time",
                    }),
                  ],
                }),
                _jsx(CardContent, {
                  className:
                    "h-[300px] flex items-center justify-center text-muted-foreground",
                  children: "Chart visualization would be displayed here",
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "transactions",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, {
                    children: "Transaction Analysis",
                  }),
                }),
                _jsx(CardContent, {
                  children: "Detailed transaction analytics",
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "spending",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, { children: "Spending Patterns" }),
                }),
                _jsx(CardContent, { children: "Spending category breakdown" }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
