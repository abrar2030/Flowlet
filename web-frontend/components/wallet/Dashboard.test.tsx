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
    (fetchWalletData as jest.Mock).mockClear();
    (useAuth as jest.Mock).mockClear();

    // Default successful mock for data fetching
    (fetchWalletData as jest.Mock).mockResolvedValue(mockWalletData);

    // Default mock for useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: { name: "Test User" },
    });
  });

  it("renders the loading state initially", () => {
    // Mock a pending promise to keep it in the loading state
    (fetchWalletData as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);

    expect(screen.getByText(/Loading dashboard data.../i)).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon-Loader2")).toBeInTheDocument();
  });

  it("renders the welcome message with user name", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test!/i)).toBeInTheDocument();
    });
  });

  it("renders the wallet summary and transaction list on successful data fetch", async () => {
    render(<Dashboard />);

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
    (fetchWalletData as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(`Error loading data: ${errorMessage}`),
      ).toBeInTheDocument();
      expect(screen.queryByText("Total Balance")).not.toBeInTheDocument();
    });
  });

  it('renders "User" when user name is not available', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {}, // No name property
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, User!/i)).toBeInTheDocument();
    });
  });
});
