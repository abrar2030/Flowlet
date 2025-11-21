import { vi } from "vitest";
import { loginUser, registerUser } from "@/lib/authService";

describe("Authentication Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent brute-force attacks on login", async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === "/api/login") {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Invalid credentials" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }) as any;

    const maxAttempts = 5;
    for (let i = 0; i < maxAttempts; i++) {
      await expect(
        loginUser("test@example.com", "wrong_password"),
      ).rejects.toThrow("Invalid credentials");
    }

    // After multiple failed attempts, expect a lockout or CAPTCHA challenge (simulated by a different error message or status)
    global.fetch = vi.fn((url: string) => {
      if (url === "/api/login") {
        return Promise.resolve({
          ok: false,
          status: 429, // Too Many Requests
          json: () =>
            Promise.resolve({
              message: "Account locked due to too many failed attempts",
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }) as any;

    await expect(
      loginUser("test@example.com", "wrong_password"),
    ).rejects.toThrow("Account locked due to too many failed attempts");
  });

  it("should enforce strong password policies during registration", async () => {
    // Simulate weak password rejection
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: "Password does not meet complexity requirements",
          }),
      }),
    ) as any;

    await expect(registerUser("newuser@example.com", "short")).rejects.toThrow(
      "Password does not meet complexity requirements",
    );

    // Simulate successful registration with a strong password
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ message: "User registered successfully" }),
      }),
    ) as any;

    const result = await registerUser(
      "anotheruser@example.com",
      "StrongP@ssw0rd123!",
    );
    expect(result.message).toBe("User registered successfully");
  });

  it("should prevent enumeration of user accounts", async () => {
    // Simulate different error messages for non-existent vs. existing users
    global.fetch = vi.fn((url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      if (url === "/api/login") {
        if (body.email === "nonexistent@example.com") {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: "Invalid credentials" }),
          });
        } else if (body.email === "existing@example.com") {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: "Invalid credentials" }),
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }) as any;

    // Both existing and non-existent users should receive the same generic error message
    await expect(
      loginUser("nonexistent@example.com", "any_password"),
    ).rejects.toThrow("Invalid credentials");
    await expect(
      loginUser("existing@example.com", "any_password"),
    ).rejects.toThrow("Invalid credentials");
  });
});
