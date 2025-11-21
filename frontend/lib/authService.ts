// Authentication Service for Flowlet Frontend
import { api, TokenManager, ApiError } from "./api";

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_verified: boolean;
  kyc_status: "pending" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
}

// Authentication Service Class
class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        "/api/v1/auth/login",
        credentials,
      );

      // Store tokens and user data
      TokenManager.setAccessToken(response.access_token);
      TokenManager.setRefreshToken(response.refresh_token);
      TokenManager.setUser(response.user);

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Login failed", 500);
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        "/api/v1/auth/register",
        userData,
      );

      // Store tokens and user data
      TokenManager.setAccessToken(response.access_token);
      TokenManager.setRefreshToken(response.refresh_token);
      TokenManager.setUser(response.user);

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Registration failed", 500);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens on server
      await api.post("/api/v1/auth/logout");
    } catch (error) {
      // Even if server logout fails, clear local tokens
      console.warn("Server logout failed:", error);
    } finally {
      // Always clear local storage
      TokenManager.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();

    if (!refreshToken) {
      throw new ApiError("No refresh token available", 401);
    }

    try {
      const response = await api.post<{ access_token: string }>(
        "/api/v1/auth/refresh",
        {
          refresh_token: refreshToken,
        },
      );

      TokenManager.setAccessToken(response.access_token);
      return response.access_token;
    } catch (error) {
      // If refresh fails, clear tokens and redirect to login
      TokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await api.get<User>("/api/v1/auth/profile");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        TokenManager.clearTokens();
      }
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      return await api.put<User>("/api/v1/auth/profile", userData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await api.post("/api/v1/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await api.post("/api/v1/auth/forgot-password", { email });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await api.post("/api/v1/auth/reset-password", {
        token,
        password,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await api.post("/api/v1/auth/verify-email", { token });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    try {
      await api.post("/api/v1/auth/resend-verification");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = TokenManager.getAccessToken();
    const user = TokenManager.getUser();

    return !!(token && user && !TokenManager.isTokenExpired(token));
  }

  /**
   * Get current user from local storage
   */
  getCurrentUserFromStorage(): User | null {
    return TokenManager.getUser();
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(): Promise<{ qr_code: string; secret: string }> {
    try {
      return await api.post("/api/v1/auth/2fa/enable");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify two-factor authentication setup
   */
  async verifyTwoFactor(code: string): Promise<void> {
    try {
      await api.post("/api/v1/auth/2fa/verify", { code });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(password: string): Promise<void> {
    try {
      await api.post("/api/v1/auth/2fa/disable", { password });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getSessions(): Promise<any[]> {
    try {
      return await api.get("/api/v1/auth/sessions");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/api/v1/auth/sessions/${sessionId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke all other sessions
   */
  async revokeAllOtherSessions(): Promise<void> {
    try {
      await api.post("/api/v1/auth/sessions/revoke-all");
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
