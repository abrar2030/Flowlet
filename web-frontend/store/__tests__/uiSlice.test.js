import { describe, it, expect } from "vitest";
import uiReducer, {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  setOnlineStatus,
  setGlobalLoading,
  setComponentLoading,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearToasts,
} from "@/store/uiSlice";
describe("uiSlice", () => {
  const initialState = {
    theme: "system",
    sidebarOpen: true,
    mobileMenuOpen: false,
    notifications: [],
    unreadNotifications: 0,
    isOnline: true,
    loading: {
      global: false,
      components: {},
    },
    modals: {},
    toasts: [],
  };
  it("should handle setTheme", () => {
    const action = setTheme("dark");
    const newState = uiReducer(initialState, action);
    expect(newState.theme).toBe("dark");
  });
  it("should handle toggleSidebar", () => {
    const action = toggleSidebar();
    const newState = uiReducer(initialState, action);
    expect(newState.sidebarOpen).toBe(false);
  });
  it("should handle setSidebarOpen", () => {
    const action = setSidebarOpen(false);
    const newState = uiReducer(initialState, action);
    expect(newState.sidebarOpen).toBe(false);
  });
  it("should handle toggleMobileMenu", () => {
    const action = toggleMobileMenu();
    const newState = uiReducer(initialState, action);
    expect(newState.mobileMenuOpen).toBe(true);
  });
  it("should handle setMobileMenuOpen", () => {
    const action = setMobileMenuOpen(true);
    const newState = uiReducer(initialState, action);
    expect(newState.mobileMenuOpen).toBe(true);
  });
  it("should handle addNotification", () => {
    const notification = {
      id: "1",
      type: "info",
      title: "Test Notification",
      message: "This is a test",
      timestamp: "2023-01-01T00:00:00Z",
      read: false,
    };
    const action = addNotification(notification);
    const newState = uiReducer(initialState, action);
    expect(newState.notifications).toHaveLength(1);
    expect(newState.notifications[0]).toEqual(notification);
    expect(newState.unreadNotifications).toBe(1);
  });
  it("should handle markNotificationAsRead", () => {
    const stateWithNotification = {
      ...initialState,
      notifications: [
        {
          id: "1",
          type: "info",
          title: "Test",
          message: "Test",
          timestamp: "2023-01-01T00:00:00Z",
          read: false,
        },
      ],
      unreadNotifications: 1,
    };
    const action = markNotificationAsRead("1");
    const newState = uiReducer(stateWithNotification, action);
    expect(newState.notifications[0].read).toBe(true);
    expect(newState.unreadNotifications).toBe(0);
  });
  it("should handle markAllNotificationsAsRead", () => {
    const stateWithNotifications = {
      ...initialState,
      notifications: [
        {
          id: "1",
          type: "info",
          title: "Test 1",
          message: "Test 1",
          timestamp: "2023-01-01T00:00:00Z",
          read: false,
        },
        {
          id: "2",
          type: "warning",
          title: "Test 2",
          message: "Test 2",
          timestamp: "2023-01-01T00:00:00Z",
          read: false,
        },
      ],
      unreadNotifications: 2,
    };
    const action = markAllNotificationsAsRead();
    const newState = uiReducer(stateWithNotifications, action);
    expect(newState.notifications.every((n) => n.read)).toBe(true);
    expect(newState.unreadNotifications).toBe(0);
  });
  it("should handle removeNotification", () => {
    const stateWithNotification = {
      ...initialState,
      notifications: [
        {
          id: "1",
          type: "info",
          title: "Test",
          message: "Test",
          timestamp: "2023-01-01T00:00:00Z",
          read: false,
        },
      ],
      unreadNotifications: 1,
    };
    const action = removeNotification("1");
    const newState = uiReducer(stateWithNotification, action);
    expect(newState.notifications).toHaveLength(0);
    expect(newState.unreadNotifications).toBe(0);
  });
  it("should handle setOnlineStatus", () => {
    const action = setOnlineStatus(false);
    const newState = uiReducer(initialState, action);
    expect(newState.isOnline).toBe(false);
  });
  it("should handle setGlobalLoading", () => {
    const action = setGlobalLoading(true);
    const newState = uiReducer(initialState, action);
    expect(newState.loading.global).toBe(true);
  });
  it("should handle setComponentLoading", () => {
    const action = setComponentLoading({
      component: "dashboard",
      loading: true,
    });
    const newState = uiReducer(initialState, action);
    expect(newState.loading.components.dashboard).toBe(true);
  });
  it("should handle openModal", () => {
    const action = openModal("testModal");
    const newState = uiReducer(initialState, action);
    expect(newState.modals.testModal).toBe(true);
  });
  it("should handle closeModal", () => {
    const stateWithModal = {
      ...initialState,
      modals: { testModal: true },
    };
    const action = closeModal("testModal");
    const newState = uiReducer(stateWithModal, action);
    expect(newState.modals.testModal).toBe(false);
  });
  it("should handle addToast", () => {
    const toast = {
      type: "success",
      title: "Success",
      message: "Operation completed",
    };
    const action = addToast(toast);
    const newState = uiReducer(initialState, action);
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0]).toMatchObject(toast);
    expect(newState.toasts[0].id).toBeDefined();
  });
  it("should handle removeToast", () => {
    const stateWithToast = {
      ...initialState,
      toasts: [
        {
          id: "1",
          type: "info",
          title: "Test",
          message: "Test",
        },
      ],
    };
    const action = removeToast("1");
    const newState = uiReducer(stateWithToast, action);
    expect(newState.toasts).toHaveLength(0);
  });
  it("should handle clearToasts", () => {
    const stateWithToasts = {
      ...initialState,
      toasts: [
        {
          id: "1",
          type: "info",
          title: "Test 1",
          message: "Test 1",
        },
        {
          id: "2",
          type: "success",
          title: "Test 2",
          message: "Test 2",
        },
      ],
    };
    const action = clearToasts();
    const newState = uiReducer(stateWithToasts, action);
    expect(newState.toasts).toHaveLength(0);
  });
});
