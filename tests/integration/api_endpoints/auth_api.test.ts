import { vi } from 'vitest';
import { loginUser, registerUser } from "@/lib/authService";

describe("Authentication API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully register a new user", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "User registered successfully" }),
      })
    ) as any;

    const result = await registerUser("test@example.com", "password123");
    expect(result.message).toBe("User registered successfully");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      })
    );
  });

  it("should handle registration failure", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: "User already exists" }),
      })
    ) as any;

    await expect(registerUser("test@example.com", "password123")).rejects.toThrow("User already exists");
  });

  it("should successfully log in an existing user", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: "mock_token", user: { email: "test@example.com" } }),
      })
    ) as any;

    const result = await loginUser("test@example.com", "password123");
    expect(result.token).toBe("mock_token");
    expect(result.user.email).toBe("test@example.com");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      })
    );
  });

  it("should handle login failure", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: "Invalid credentials" }),
      })
    ) as any;

    await expect(loginUser("test@example.com", "wrong_password")).rejects.toThrow("Invalid credentials");
  });
});
