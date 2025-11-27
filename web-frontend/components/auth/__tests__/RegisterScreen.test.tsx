import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/utils";
import RegisterScreen from "@/components/auth/RegisterScreen";

// Mock the auth hooks and store
vi.mock("@/hooks/redux", () => ({
  useAppDispatch: () => vi.fn(),
}));

vi.mock("@/store/authSlice", () => ({
  registerUser: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("RegisterScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders registration form correctly", () => {
    render(<RegisterScreen />);

    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(
      screen.getByText("Join Flowlet and start managing your finances"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    render(<RegisterScreen />);

    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Name must be at least 2 characters"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Please enter a valid email address"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
    });
  });

  it("validates password confirmation", async () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "different123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it("requires terms acceptance", async () => {
    render(<RegisterScreen />);

    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("You must accept the terms and conditions"),
      ).toBeInTheDocument();
    });
  });

  it("toggles password visibility for both password fields", () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const toggleButtons = screen.getAllByRole("button", { name: "" }); // Eye icon buttons

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Toggle first password field
    fireEvent.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Toggle second password field
    fireEvent.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute("type", "text");
  });

  it("has links to terms and privacy policy", () => {
    render(<RegisterScreen />);

    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("has link to sign in page", () => {
    render(<RegisterScreen />);

    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });
});
