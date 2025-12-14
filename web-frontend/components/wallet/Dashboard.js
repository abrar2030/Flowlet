import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Send,
  CreditCard,
  ArrowDownRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Will be mocked for testing
import { fetchWalletData } from "@/services/walletService"; // Will be mocked for testing
import WalletSummary from "./WalletSummary";
import TransactionList from "./TransactionList";
// --- Helper Components ---
/**
 * Displays the welcome message and quick action buttons.
 */
const WelcomeSection = ({ userName }) =>
  _jsxs("div", {
    className: "flex flex-col sm:flex-row sm:items-center sm:justify-between",
    children: [
      _jsxs("div", {
        children: [
          _jsxs("h1", {
            className: "text-3xl font-bold tracking-tight",
            children: ["Welcome back, ", userName, "!"],
          }),
          _jsx("p", {
            className: "text-muted-foreground",
            children: "Here's what's happening with your finances today.",
          }),
        ],
      }),
      _jsxs("div", {
        className: "flex space-x-2 mt-4 sm:mt-0",
        children: [
          _jsxs(Button, {
            children: [
              _jsx(Plus, { className: "mr-2 h-4 w-4" }),
              "Add Transaction",
            ],
          }),
          _jsxs(Button, {
            variant: "outline",
            children: [_jsx(Send, { className: "mr-2 h-4 w-4" }), "Send Money"],
          }),
        ],
      }),
    ],
  });
/**
 * Displays a list of quick action buttons.
 */
const QuickActionsCard = () =>
  _jsxs(Card, {
    children: [
      _jsxs(CardHeader, {
        children: [
          _jsx(CardTitle, { children: "Quick Actions" }),
          _jsx(CardDescription, { children: "Common tasks and shortcuts" }),
        ],
      }),
      _jsxs(CardContent, {
        className: "space-y-3",
        children: [
          _jsxs(Button, {
            className: "w-full justify-start",
            variant: "outline",
            children: [_jsx(Send, { className: "mr-2 h-4 w-4" }), "Send Money"],
          }),
          _jsxs(Button, {
            className: "w-full justify-start",
            variant: "outline",
            children: [
              _jsx(ArrowDownRight, { className: "mr-2 h-4 w-4" }),
              "Request Money",
            ],
          }),
          _jsxs(Button, {
            className: "w-full justify-start",
            variant: "outline",
            children: [
              _jsx(CreditCard, { className: "mr-2 h-4 w-4" }),
              "Pay Bills",
            ],
          }),
          _jsxs(Button, {
            className: "w-full justify-start",
            variant: "outline",
            children: [
              _jsx(Plus, { className: "mr-2 h-4 w-4" }),
              "Add Account",
            ],
          }),
        ],
      }),
    ],
  });
// --- Main Component ---
const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.name?.split(" ")[0] || "User";
  const [state, setState] = useState({
    data: null,
    isLoading: true,
    error: null,
  });
  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component
    const loadData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const walletData = await fetchWalletData();
        if (isMounted) {
          setState({
            data: walletData,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        if (isMounted) {
          setState({
            data: null,
            isLoading: false,
            error: errorMessage,
          });
        }
      }
    };
    loadData();
    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this runs once on mount
  const { data, isLoading, error } = state;
  if (isLoading) {
    return _jsxs("div", {
      className: "flex justify-center items-center h-64",
      children: [
        _jsx(Loader2, { className: "mr-2 h-8 w-8 animate-spin" }),
        _jsx("p", {
          className: "text-lg text-muted-foreground",
          children: "Loading dashboard data...",
        }),
      ],
    });
  }
  if (error) {
    return _jsxs("div", {
      className:
        "p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center space-x-3",
      children: [
        _jsx(AlertTriangle, { className: "h-6 w-6" }),
        _jsxs("p", {
          className: "font-medium",
          children: ["Error loading data: ", error],
        }),
      ],
    });
  }
  // Data is guaranteed to be present if we reach this point
  if (!data) {
    // Should not happen if error handling is correct, but good for type safety
    return null;
  }
  return _jsxs("div", {
    className: "space-y-6",
    children: [
      _jsx(WelcomeSection, { userName: userName }),
      _jsx(WalletSummary, { quickStats: data.quickStats }),
      _jsxs("div", {
        className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
        children: [
          _jsx(TransactionList, { transactions: data.recentTransactions }),
          _jsx(QuickActionsCard, {}),
        ],
      }),
    ],
  });
};
export default Dashboard;
