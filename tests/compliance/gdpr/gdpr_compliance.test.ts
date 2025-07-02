import { vi } from 'vitest';
import { getUserData, deleteUserData, updateConsent } from "@/lib/utils";

describe("GDPR Compliance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow users to request their data (Right to Access)", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ userId: "123", data: "user_data_here" }),
      })
    ) as any;

    const userData = await getUserData("123");
    expect(userData).toEqual({ userId: "123", data: "user_data_here" });
    expect(global.fetch).toHaveBeenCalledWith("/api/user/123/data");
  });

  it("should allow users to request data deletion (Right to Erasure)", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "User data deleted" }),
      })
    ) as any;

    const response = await deleteUserData("123");
    expect(response.message).toBe("User data deleted");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/123/data",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("should allow users to update their consent preferences", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Consent updated" }),
      })
    ) as any;

    const response = await updateConsent("123", { marketing: true, analytics: false });
    expect(response.message).toBe("Consent updated");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/123/consent",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ marketing: true, analytics: false }),
      })
    );
  });
});


