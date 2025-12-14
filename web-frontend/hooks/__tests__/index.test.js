import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useOnlineStatus,
  useResponsive,
  useLocalStorage,
  useDebounce,
} from "@/hooks";
describe("useOnlineStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("returns initial online status", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });
  it("updates status when going offline", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
  });
});
describe("useResponsive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("returns correct responsive states for mobile", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });
  it("returns correct responsive states for tablet", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });
  it("returns correct responsive states for desktop", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });
});
describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });
  it("returns initial value when no stored value exists", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial-value"),
    );
    expect(result.current[0]).toBe("initial-value");
  });
  it("returns stored value when it exists", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-value"));
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial-value"),
    );
    expect(result.current[0]).toBe("stored-value");
  });
  it("updates localStorage when value is set", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial-value"),
    );
    act(() => {
      result.current[1]("new-value");
    });
    expect(result.current[0]).toBe("new-value");
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
  });
  it("handles function updates", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", 0));
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(1);
  });
});
describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });
  it("debounces value updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );
    expect(result.current).toBe("initial");
    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial"); // Still old value
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("updated"); // Now updated
  });
  it("cancels previous timeout on rapid updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );
    rerender({ value: "first-update", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    rerender({ value: "second-update", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("second-update");
  });
});
