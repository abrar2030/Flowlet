import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  transactions: [],
  recentTransactions: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};
const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
    setRecentTransactions: (state, action) => {
      state.recentTransactions = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
      state.recentTransactions.unshift(action.payload);
      if (state.recentTransactions.length > 10) {
        state.recentTransactions = state.recentTransactions.slice(0, 10);
      }
    },
    updateTransaction: (state, action) => {
      const index = state.transactions.findIndex(
        (t) => t.id === action.payload.id,
      );
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }
      const recentIndex = state.recentTransactions.findIndex(
        (t) => t.id === action.payload.id,
      );
      if (recentIndex !== -1) {
        state.recentTransactions[recentIndex] = action.payload;
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});
export const {
  setTransactions,
  setRecentTransactions,
  addTransaction,
  updateTransaction,
  setFilters,
  clearFilters,
  setPagination,
  setLoading,
  setError,
  clearError,
} = transactionSlice.actions;
export default transactionSlice.reducer;
