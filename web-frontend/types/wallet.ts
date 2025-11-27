import { LucideIcon } from "lucide-react";

// --- Data Interfaces ---

/**
 * Interface for a single quick statistic displayed on the dashboard.
 */
export interface QuickStat {
  title: string;
  value: string; // Display value (e.g., "$12,345.67")
  change: string; // Change percentage (e.g., "+2.5%")
  trend: "up" | "down";
  icon: LucideIcon;
}

/**
 * Interface for a single financial transaction.
 */
export interface Transaction {
  id: number;
  description: string;
  amount: number; // Positive for income, negative for expense
  date: string; // ISO date string or similar (e.g., "YYYY-MM-DD")
  category: string;
}

/**
 * Interface for the main wallet data fetched from the service.
 */
export interface WalletData {
  quickStats: QuickStat[];
  recentTransactions: Transaction[];
}

// --- Component Props Interfaces ---

/**
 * Interface for the props of the WalletSummary component.
 */
export interface WalletSummaryProps {
  quickStats: QuickStat[];
}

/**
 * Interface for the props of the TransactionList component.
 */
export interface TransactionListProps {
  transactions: Transaction[];
}

// --- State Interfaces ---

/**
 * Interface for the state managed by the main Dashboard component.
 */
export interface DashboardState {
  data: WalletData | null;
  isLoading: boolean;
  error: string | null;
}

// --- Utility/Mock Interfaces ---

/**
 * Minimal interface for the authenticated user object.
 */
export interface User {
  name?: string;
  // Add other user properties as needed by the application
}
