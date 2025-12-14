import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
// Mock all the components to avoid complex setup
vi.mock("@/components/LoadingScreen", () => ({
  default: () => _jsx("div", { children: "Loading..." }),
}));
vi.mock("@/components/OfflineIndicator", () => ({
  default: () => _jsx("div", { children: "Offline" }),
}));
vi.mock("@/components/auth/LoginScreen", () => ({
  default: () => _jsx("div", { children: "Login Screen" }),
}));
vi.mock("@/components/auth/RegisterScreen", () => ({
  default: () => _jsx("div", { children: "Register Screen" }),
}));
vi.mock("@/components/Layout", () => ({
  default: ({ children }) => _jsxs("div", { children: ["Layout: ", children] }),
}));
vi.mock("@/components/wallet/Dashboard", () => ({
  default: () => _jsx("div", { children: "Dashboard" }),
}));
// Mock hooks
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/hooks", () => ({
  useOnlineStatus: vi.fn(() => true),
  useResponsive: vi.fn(() => ({ isMobile: false })),
}));
import { useAuth } from "@/hooks/useAuth";
describe("App Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("shows loading screen when auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      refreshAuthToken: vi.fn(),
    });
    render(_jsx(App, {}));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
  it("redirects to login when not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      refreshAuthToken: vi.fn(),
    });
    render(_jsx(BrowserRouter, { children: _jsx(App, {}) }));
    // Should redirect to home page for unauthenticated users
    expect(window.location.pathname).toBe("/");
  });
  it("shows dashboard when authenticated", () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      avatar: "",
      role: "user",
      preferences: {
        theme: "light",
        language: "en",
        currency: "USD",
        notifications: {
          email: true,
          push: true,
          sms: false,
          transactionAlerts: true,
          securityAlerts: true,
          marketingEmails: false,
        },
      },
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      token: "test-token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
      refreshAuthToken: vi.fn(),
    });
    render(_jsx(BrowserRouter, { children: _jsx(App, {}) }));
    expect(screen.getByText(/Layout:/)).toBeInTheDocument();
  });
  it("shows offline indicator when offline", () => {
    const { useOnlineStatus } = require("@/hooks");
    vi.mocked(useOnlineStatus).mockReturnValue(false);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      refreshAuthToken: vi.fn(),
    });
    render(_jsx(App, {}));
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
  it("handles error boundary", () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const ThrowError = () => {
      throw new Error("Test error");
    };
    vi.mocked(useAuth).mockImplementation(() => {
      throw new Error("Test error");
    });
    render(_jsx(App, {}));
    // Should show error boundary UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
