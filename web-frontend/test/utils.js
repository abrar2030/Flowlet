import { jsx as _jsx } from "react/jsx-runtime";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import authReducer from "@/store/authSlice";
import walletReducer from "@/store/walletSlice";
import transactionReducer from "@/store/transactionSlice";
import uiReducer from "@/store/uiSlice";
import { api } from "@/store/api";
// Create a custom render function that includes providers
const createTestStore = (preloadedState) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      wallet: walletReducer,
      transaction: transactionReducer,
      ui: uiReducer,
      [api.reducerPath]: api.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(api.middleware),
  });
};
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {},
) => {
  const Wrapper = ({ children }) => {
    return _jsx(Provider, {
      store: store,
      children: _jsx(BrowserRouter, { children: children }),
    });
  };
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};
// Mock user for testing
export const mockUser = {
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
// Mock wallet for testing
export const mockWallet = {
  id: "1",
  userId: "1",
  balance: 1000,
  currency: "USD",
  type: "checking",
  isActive: true,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};
// Mock transaction for testing
export const mockTransaction = {
  id: "1",
  walletId: "1",
  type: "deposit",
  amount: 100,
  currency: "USD",
  description: "Test transaction",
  category: "income",
  status: "completed",
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};
export * from "@testing-library/react";
export { renderWithProviders as render };
