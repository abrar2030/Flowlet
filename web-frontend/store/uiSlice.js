import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  theme: "system",
  sidebarOpen: true,
  mobileMenuOpen: false,
  notifications: [],
  unreadNotifications: 0,
  isOnline: navigator.onLine,
  loading: {
    global: false,
    components: {},
  },
  modals: {},
  toasts: [],
};
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadNotifications += 1;
      }
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload,
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true));
      state.unreadNotifications = 0;
    },
    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(
        (n) => n.id === action.payload,
      );
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadNotifications = Math.max(
            0,
            state.unreadNotifications - 1,
          );
        }
        state.notifications.splice(index, 1);
      }
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setComponentLoading: (state, action) => {
      state.loading.components[action.payload.component] =
        action.payload.loading;
    },
    openModal: (state, action) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },
    addToast: (state, action) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});
export const {
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
} = uiSlice.actions;
export default uiSlice.reducer;
