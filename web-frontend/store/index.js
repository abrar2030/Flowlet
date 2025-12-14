import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./authSlice";
import walletReducer from "./walletSlice";
import transactionReducer from "./transactionSlice";
import uiReducer from "./uiSlice";
import { api } from "./api";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    transaction: transactionReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(api.middleware),
  devTools: process.env.NODE_ENV !== "production",
});
setupListeners(store.dispatch);
