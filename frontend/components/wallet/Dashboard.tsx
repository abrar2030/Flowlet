import React, { useState, useEffect } from "react";
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
import { DashboardState } from "@/types/wallet";
import { fetchWalletData } from "@/services/walletService"; // Will be mocked for testing
import WalletSummary from "./WalletSummary";
import TransactionList from "./TransactionList";

// --- Helper Components ---

/**
 * Displays the welcome message and quick action buttons.
 */
const WelcomeSection: React.FC<{ userName: string }> = ({ userName }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome back, {userName}!
      </h1>
      <p className="text-muted-foreground">
        Here's what's happening with your finances today.
      </p>
    </div>
    <div className="flex space-x-2 mt-4 sm:mt-0">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Transaction
      </Button>
      <Button variant="outline">
        <Send className="mr-2 h-4 w-4" />
        Send Money
      </Button>
    </div>
  </div>
);

/**
 * Displays a list of quick action buttons.
 */
const QuickActionsCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
      <CardDescription>Common tasks and shortcuts</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button className="w-full justify-start" variant="outline">
        <Send className="mr-2 h-4 w-4" />
        Send Money
      </Button>
      <Button className="w-full justify-start" variant="outline">
        <ArrowDownRight className="mr-2 h-4 w-4" />
        Request Money
      </Button>
      <Button className="w-full justify-start" variant="outline">
        <CreditCard className="mr-2 h-4 w-4" />
        Pay Bills
      </Button>
      <Button className="w-full justify-start" variant="outline">
        <Plus className="mr-2 h-4 w-4" />
        Add Account
      </Button>
    </CardContent>
  </Card>
);

// --- Main Component ---

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.name?.split(" ")[0] || "User";

  const [state, setState] = useState<DashboardState>({
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
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p className="text-lg text-muted-foreground">
          Loading dashboard data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center space-x-3">
        <AlertTriangle className="h-6 w-6" />
        <p className="font-medium">Error loading data: {error}</p>
      </div>
    );
  }

  // Data is guaranteed to be present if we reach this point
  if (!data) {
    // Should not happen if error handling is correct, but good for type safety
    return null;
  }

  return (
    <div className="space-y-6">
      <WelcomeSection userName={userName} />

      {/* Wallet Summary (Quick Stats) */}
      <WalletSummary quickStats={data.quickStats} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Transactions */}
        <TransactionList transactions={data.recentTransactions} />

        {/* Quick Actions */}
        <QuickActionsCard />
      </div>
    </div>
  );
};

export default Dashboard;
