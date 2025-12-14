import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard";
import { fetchWalletData } from "@/services/walletService";
import { useAuth } from "@/hooks/useAuth";
import { Wallet } from "lucide-react";
// Mock the dependencies
jest.mock("@/services/walletService", () =>
  require("../../__mocks__/walletService"),
);
jest.mock("@/hooks/useAuth", () => require("../../__mocks__/useAuth"));
const mockWalletData = {
  quickStats: [
    {
      title: "Total Balance",
      value: "$100.00",
      change: "+1.0%",
      trend: "up",
      icon: Wallet,
    },
  ],
  recentTransactions: [
    {
      id: 1,
      description: "Test Transaction",
      amount: 50.0,
      date: "2024-01-01",
      category: "Test",
    },
  ],
};
describe("Dashboard", () => {
  beforeEach(() => {
    // Reset mocks before each test
    fetchWalletData.mockClear();
    useAuth.mockClear();
    // Default successful mock for data fetching
    fetchWalletData.mockResolvedValue(mockWalletData);
    // Default mock for useAuth
    useAuth.mockReturnValue({
      user: { name: "Test User" },
    });
  });
  it("renders the loading state initially", () => {
    // Mock a pending promise to keep it in the loading state
    fetchWalletData.mockReturnValue(new Promise(() => {}));
    render(_jsx(Dashboard, {}));
    expect(screen.getByText(/Loading dashboard data.../i)).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon-Loader2")).toBeInTheDocument();
  });
  it("renders the welcome message with user name", async () => {
    render(_jsx(Dashboard, {}));
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test!/i)).toBeInTheDocument();
    });
  });
  it("renders the wallet summary and transaction list on successful data fetch", async () => {
    render(_jsx(Dashboard, {}));
    await waitFor(() => {
      // Check for WalletSummary content
      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      // Check for TransactionList content
      expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
      expect(screen.getByText("Test Transaction")).toBeInTheDocument();
      expect(screen.getByText("+$50.00")).toBeInTheDocument();
    });
  });
  it("renders the error state on failed data fetch", async () => {
    const errorMessage = "Failed to fetch wallet data due to a server error.";
    fetchWalletData.mockRejectedValue(new Error(errorMessage));
    render(_jsx(Dashboard, {}));
    await waitFor(() => {
      expect(
        screen.getByText(`Error loading data: ${errorMessage}`),
      ).toBeInTheDocument();
      expect(screen.queryByText("Total Balance")).not.toBeInTheDocument();
    });
  });
  it('renders "User" when user name is not available', async () => {
    useAuth.mockReturnValue({
      user: {}, // No name property
    });
    render(_jsx(Dashboard, {}));
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, User!/i)).toBeInTheDocument();
    });
  });
});
