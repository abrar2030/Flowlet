import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import Dashboard from "@/components/wallet/Dashboard";
import { mockUser } from "@/test/utils";

// Mock the auth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome message with user name", () => {
    render(<Dashboard />);

    expect(screen.getByText("Welcome back, Test!")).toBeInTheDocument();
    expect(
      screen.getByText("Here's what's happening with your finances today."),
    ).toBeInTheDocument();
  });

  it("displays quick stats cards", () => {
    render(<Dashboard />);

    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Monthly Income")).toBeInTheDocument();
    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    expect(screen.getByText("Savings Rate")).toBeInTheDocument();
  });

  it("shows quick action buttons", () => {
    render(<Dashboard />);

    expect(
      screen.getByRole("button", { name: /add transaction/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send money/i }),
    ).toBeInTheDocument();
  });

  it("displays recent transactions section", () => {
    render(<Dashboard />);

    expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
    expect(
      screen.getByText("Your latest financial activity"),
    ).toBeInTheDocument();
    expect(screen.getByText("Grocery Store")).toBeInTheDocument();
    expect(screen.getByText("Salary Deposit")).toBeInTheDocument();
  });

  it("shows quick actions sidebar", () => {
    render(<Dashboard />);

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("Common tasks and shortcuts")).toBeInTheDocument();

    // Check for quick action buttons
    const quickActionButtons = screen.getAllByRole("button");
    const buttonTexts = quickActionButtons.map((button) => button.textContent);

    expect(buttonTexts).toContain("Send Money");
    expect(buttonTexts).toContain("Request Money");
    expect(buttonTexts).toContain("Pay Bills");
    expect(buttonTexts).toContain("Add Account");
  });

  it("displays transaction amounts with correct formatting", () => {
    render(<Dashboard />);

    // Check for positive amount (income)
    expect(screen.getByText("+$4,200.00")).toBeInTheDocument();

    // Check for negative amounts (expenses)
    expect(screen.getByText("-$85.32")).toBeInTheDocument();
    expect(screen.getByText("-$120.45")).toBeInTheDocument();
  });

  it("shows view all transactions button", () => {
    render(<Dashboard />);

    expect(
      screen.getByRole("button", { name: /view all transactions/i }),
    ).toBeInTheDocument();
  });

  it("displays percentage changes for stats", () => {
    render(<Dashboard />);

    expect(screen.getByText("+2.5% from last month")).toBeInTheDocument();
    expect(screen.getByText("+8.1% from last month")).toBeInTheDocument();
    expect(screen.getByText("-3.2% from last month")).toBeInTheDocument();
    expect(screen.getByText("+5.4% from last month")).toBeInTheDocument();
  });
});
