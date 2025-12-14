import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
const WalletScreen = ({
  balance = 1234.56,
  recentTransactions = [
    {
      id: "1",
      description: "Coffee Shop",
      amount: -4.5,
      type: "debit",
      date: "2025-01-14",
    },
    {
      id: "2",
      description: "Salary Deposit",
      amount: 2000.0,
      type: "credit",
      date: "2025-01-13",
    },
    {
      id: "3",
      description: "Online Purchase",
      amount: -75.0,
      type: "debit",
      date: "2025-01-12",
    },
  ],
}) => {
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
  return _jsxs("div", {
    className: "container mx-auto p-6 space-y-6",
    children: [
      _jsxs("div", {
        className: "flex items-center gap-2 mb-6",
        children: [
          _jsx(Wallet, { className: "h-8 w-8 text-primary" }),
          _jsx("h1", { className: "text-3xl font-bold", children: "Wallet" }),
        ],
      }),
      _jsxs(Card, {
        className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, {
              className: "text-xl font-semibold",
              children: "Current Balance",
            }),
          }),
          _jsx(CardContent, {
            children: _jsx("p", {
              className: "text-4xl font-bold",
              children: formatCurrency(balance),
            }),
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, {
              className: "text-xl font-semibold",
              children: "Recent Transactions",
            }),
          }),
          _jsx(CardContent, {
            children: _jsx("div", {
              className: "space-y-4",
              children: recentTransactions.map((transaction) =>
                _jsxs(
                  "div",
                  {
                    className:
                      "flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors",
                    children: [
                      _jsxs("div", {
                        className: "flex items-center gap-3",
                        children: [
                          _jsx("div", {
                            className: `p-2 rounded-full ${
                              transaction.type === "credit"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`,
                            children:
                              transaction.type === "credit"
                                ? _jsx(TrendingUp, { className: "h-4 w-4" })
                                : _jsx(TrendingDown, { className: "h-4 w-4" }),
                          }),
                          _jsxs("div", {
                            children: [
                              _jsx("p", {
                                className: "font-medium",
                                children: transaction.description,
                              }),
                              _jsx("p", {
                                className: "text-sm text-gray-500",
                                children: formatDate(transaction.date),
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
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
                    ],
                  },
                  transaction.id,
                ),
              ),
            }),
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-2 md:grid-cols-4 gap-4",
        children: [
          _jsx(Button, {
            variant: "outline",
            className: "h-16 flex flex-col gap-1",
            children: _jsx("span", {
              className: "text-sm",
              children: "Send Money",
            }),
          }),
          _jsx(Button, {
            variant: "outline",
            className: "h-16 flex flex-col gap-1",
            children: _jsx("span", {
              className: "text-sm",
              children: "Receive Money",
            }),
          }),
          _jsx(Button, {
            variant: "outline",
            className: "h-16 flex flex-col gap-1",
            children: _jsx("span", {
              className: "text-sm",
              children: "View Cards",
            }),
          }),
          _jsx(Button, {
            variant: "outline",
            className: "h-16 flex flex-col gap-1",
            children: _jsx("span", {
              className: "text-sm",
              children: "Analytics",
            }),
          }),
        ],
      }),
    ],
  });
};
export default WalletScreen;
