import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/authSlice";
import uiReducer from "@/store/uiSlice";
import LoginScreen from "@/components/auth/LoginScreen";
// Mock the auth hooks and store
vi.mock("@/hooks/redux", () => ({
  useAppDispatch: () => vi.fn(),
}));
vi.mock("@/store/authSlice", () => ({
  loginUser: vi.fn(),
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }) =>
      _jsx("a", { href: to, ...props, children: children }),
  };
});
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
  });
};
const renderWithProviders = (ui) => {
  const store = createTestStore();
  return render(
    _jsx(Provider, {
      store: store,
      children: _jsx(BrowserRouter, { children: ui }),
    }),
  );
};
describe("LoginScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("renders login form correctly", () => {
    renderWithProviders(_jsx(LoginScreen, {}));
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to your Flowlet account to continue"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });
  it("has demo credentials pre-filled", () => {
    renderWithProviders(_jsx(LoginScreen, {}));
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    expect(emailInput.value).toBe("demo@flowlet.com");
    expect(passwordInput.value).toBe("demo123");
  });
  it("displays demo credentials information", () => {
    renderWithProviders(_jsx(LoginScreen, {}));
    expect(screen.getByText("Demo Credentials:")).toBeInTheDocument();
    expect(screen.getByText("Email: demo@flowlet.com")).toBeInTheDocument();
    expect(screen.getByText("Password: demo123")).toBeInTheDocument();
  });
  it("has links to register and forgot password", () => {
    renderWithProviders(_jsx(LoginScreen, {}));
    expect(screen.getByText("Sign up")).toBeInTheDocument();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });
});
