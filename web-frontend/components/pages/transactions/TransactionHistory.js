import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Download } from "lucide-react";
const TransactionHistory = ({
  transactions = [
    {
      id: "1",
      date: "2025-01-14",
      description: "Coffee Shop",
      amount: -4.5,
      type: "debit",
      status: "completed",
      category: "Food & Dining",
    },
    {
      id: "2",
      date: "2025-01-13",
      description: "Salary Deposit",
      amount: 2000.0,
      type: "credit",
      status: "completed",
      category: "Income",
    },
    {
      id: "3",
      date: "2025-01-12",
      description: "Online Purchase",
      amount: -75.0,
      type: "debit",
      status: "completed",
      category: "Shopping",
    },
    {
      id: "4",
      date: "2025-01-11",
      description: "Restaurant Bill",
      amount: -30.0,
      type: "debit",
      status: "completed",
      category: "Food & Dining",
    },
    {
      id: "5",
      date: "2025-01-10",
      description: "Gas Station",
      amount: -45.2,
      type: "debit",
      status: "pending",
      category: "Transportation",
    },
  ],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);
  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
  }, [filteredTransactions]);
  return _jsxs("div", {
    className: "container mx-auto p-6 space-y-6",
    children: [
      _jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          _jsx("h1", {
            className: "text-3xl font-bold",
            children: "Transaction History",
          }),
          _jsxs(Button, {
            variant: "outline",
            className: "flex items-center gap-2",
            children: [_jsx(Download, { className: "h-4 w-4" }), "Export"],
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, { children: "Summary" }),
          }),
          _jsx(CardContent, {
            children: _jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-3 gap-4",
              children: [
                _jsxs("div", {
                  className: "text-center",
                  children: [
                    _jsx("p", {
                      className: "text-sm text-gray-500",
                      children: "Total Transactions",
                    }),
                    _jsx("p", {
                      className: "text-2xl font-bold",
                      children: filteredTransactions.length,
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "text-center",
                  children: [
                    _jsx("p", {
                      className: "text-sm text-gray-500",
                      children: "Net Amount",
                    }),
                    _jsxs("p", {
                      className: `text-2xl font-bold ${totalAmount >= 0 ? "text-green-600" : "text-red-600"}`,
                      children: [
                        totalAmount >= 0 ? "+" : "",
                        formatCurrency(totalAmount),
                      ],
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "text-center",
                  children: [
                    _jsx("p", {
                      className: "text-sm text-gray-500",
                      children: "Period",
                    }),
                    _jsx("p", {
                      className: "text-2xl font-bold",
                      children: "Last 30 Days",
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      _jsx(Card, {
        children: _jsx(CardContent, {
          className: "pt-6",
          children: _jsxs("div", {
            className: "flex flex-col md:flex-row gap-4",
            children: [
              _jsx("div", {
                className: "flex-1",
                children: _jsxs("div", {
                  className: "relative",
                  children: [
                    _jsx(Search, {
                      className:
                        "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                    }),
                    _jsx(Input, {
                      placeholder: "Search transactions...",
                      value: searchTerm,
                      onChange: (e) => setSearchTerm(e.target.value),
                      className: "pl-10",
                    }),
                  ],
                }),
              }),
              _jsxs("div", {
                className: "flex gap-2",
                children: [
                  _jsxs("select", {
                    value: statusFilter,
                    onChange: (e) => setStatusFilter(e.target.value),
                    className: "px-3 py-2 border rounded-md bg-background",
                    children: [
                      _jsx("option", { value: "all", children: "All Status" }),
                      _jsx("option", {
                        value: "completed",
                        children: "Completed",
                      }),
                      _jsx("option", { value: "pending", children: "Pending" }),
                      _jsx("option", { value: "failed", children: "Failed" }),
                    ],
                  }),
                  _jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    children: [
                      _jsx(Filter, { className: "h-4 w-4 mr-2" }),
                      "More Filters",
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      _jsx(Card, {
        children: _jsx(CardContent, {
          className: "p-0",
          children: _jsxs(Table, {
            children: [
              _jsx(TableHeader, {
                children: _jsxs(TableRow, {
                  children: [
                    _jsx(TableHead, { children: "Date" }),
                    _jsx(TableHead, { children: "Description" }),
                    _jsx(TableHead, { children: "Category" }),
                    _jsx(TableHead, { children: "Amount" }),
                    _jsx(TableHead, { children: "Status" }),
                  ],
                }),
              }),
              _jsx(TableBody, {
                children: filteredTransactions.map((transaction) =>
                  _jsxs(
                    TableRow,
                    {
                      className: "hover:bg-gray-50",
                      children: [
                        _jsx(TableCell, {
                          className: "font-medium",
                          children: formatDate(transaction.date),
                        }),
                        _jsx(TableCell, { children: transaction.description }),
                        _jsx(TableCell, {
                          children:
                            transaction.category &&
                            _jsx(Badge, {
                              variant: "outline",
                              children: transaction.category,
                            }),
                        }),
                        _jsxs(TableCell, {
                          className: `font-semibold ${
                            transaction.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`,
                          children: [
                            transaction.type === "credit" ? "+" : "-",
                            formatCurrency(transaction.amount),
                          ],
                        }),
                        _jsx(TableCell, {
                          children: _jsx(Badge, {
                            variant: getStatusBadgeVariant(transaction.status),
                            children:
                              transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1),
                          }),
                        }),
                      ],
                    },
                    transaction.id,
                  ),
                ),
              }),
            ],
          }),
        }),
      }),
      filteredTransactions.length === 0 &&
        _jsx(Card, {
          children: _jsx(CardContent, {
            className: "text-center py-8",
            children: _jsx("p", {
              className: "text-gray-500",
              children: "No transactions found matching your criteria.",
            }),
          }),
        }),
    ],
  });
};
export default TransactionHistory;
