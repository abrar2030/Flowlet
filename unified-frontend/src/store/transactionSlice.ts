import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction, TransactionType, TransactionStatus } from '@/types';

interface TransactionState {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: {
    type?: TransactionType;
    status?: TransactionStatus;
    dateRange?: {
      start: string;
      end: string;
    };
    category?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: TransactionState = {
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
  name: 'transaction',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    setRecentTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.recentTransactions = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      state.recentTransactions.unshift(action.payload);
      if (state.recentTransactions.length > 10) {
        state.recentTransactions = state.recentTransactions.slice(0, 10);
      }
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }
      const recentIndex = state.recentTransactions.findIndex(t => t.id === action.payload.id);
      if (recentIndex !== -1) {
        state.recentTransactions[recentIndex] = action.payload;
      }
    },
    setFilters: (state, action: PayloadAction<Partial<TransactionState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<TransactionState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
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

