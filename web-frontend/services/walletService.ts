import { WalletData, QuickStat, Transaction } from "@/types/wallet";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from "lucide-react";

// Mock data based on the original Dashboard.tsx content
const mockQuickStats: QuickStat[] = [
  {
    title: "Total Balance",
    value: "$12,345.67",
    change: "+2.5%",
    trend: "up",
    icon: Wallet,
  },
  {
    title: "Monthly Income",
    value: "$4,200.00",
    change: "+8.1%",
    trend: "up",
    icon: ArrowDownRight,
  },
  {
    title: "Monthly Expenses",
    value: "$2,850.30",
    change: "-3.2%",
    trend: "down",
    icon: ArrowUpRight,
  },
  {
    title: "Savings Rate",
    value: "32.1%",
    change: "+5.4%",
    trend: "up",
    icon: TrendingUp,
  },
];

const mockRecentTransactions: Transaction[] = [
  {
    id: 1,
    description: "Grocery Store",
    amount: -85.32,
    date: "2024-01-15",
    category: "Food",
  },
  {
    id: 2,
    description: "Salary Deposit",
    amount: 4200.0,
    date: "2024-01-15",
    category: "Income",
  },
  {
    id: 3,
    description: "Electric Bill",
    amount: -120.45,
    date: "2024-01-14",
    category: "Utilities",
  },
  {
    id: 4,
    description: "Coffee Shop",
    amount: -12.5,
    date: "2024-01-14",
    category: "Food",
  },
  {
    id: 5,
    description: "Gas Station",
    amount: -65.0,
    date: "2024-01-13",
    category: "Transport",
  },
];

const mockWalletData: WalletData = {
  quickStats: mockQuickStats,
  recentTransactions: mockRecentTransactions,
};

/**
 * Simulates fetching wallet data from an API.
 * Includes a delay to simulate network latency and a small chance of failure.
 * @returns A promise that resolves with WalletData.
 */
export const fetchWalletData = (): Promise<WalletData> => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      // Simulate a random API error for demonstration purposes
      if (Math.random() < 0.05) {
        reject(new Error("Failed to fetch wallet data due to a server error."));
        return;
      }

      // Simulate successful data validation and return
      resolve(mockWalletData);
    }, 1000); // 1 second delay
  });
};
