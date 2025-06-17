import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Wallet, WalletType } from '@/types';

interface WalletState {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallets: [],
  activeWallet: null,
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallets: (state, action: PayloadAction<Wallet[]>) => {
      state.wallets = action.payload;
      if (!state.activeWallet && action.payload.length > 0) {
        state.activeWallet = action.payload[0];
      }
    },
    setActiveWallet: (state, action: PayloadAction<Wallet>) => {
      state.activeWallet = action.payload;
    },
    addWallet: (state, action: PayloadAction<Wallet>) => {
      state.wallets.push(action.payload);
    },
    updateWallet: (state, action: PayloadAction<Wallet>) => {
      const index = state.wallets.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.wallets[index] = action.payload;
        if (state.activeWallet?.id === action.payload.id) {
          state.activeWallet = action.payload;
        }
      }
    },
    removeWallet: (state, action: PayloadAction<string>) => {
      state.wallets = state.wallets.filter(w => w.id !== action.payload);
      if (state.activeWallet?.id === action.payload) {
        state.activeWallet = state.wallets[0] || null;
      }
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
  setWallets,
  setActiveWallet,
  addWallet,
  updateWallet,
  removeWallet,
  setLoading,
  setError,
  clearError,
} = walletSlice.actions;

export default walletSlice.reducer;

