import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { walletService } from "@/lib/walletService";
import { ApiError } from "@/lib/api";
// Initial state
const initialState = {
  accounts: [],
  currentAccount: null,
  transactions: [],
  cards: [],
  currentCard: null,
  dashboardSummary: null,
  analytics: null,
  isLoading: false,
  error: null,
};
// Async thunks
export const fetchAccounts = createAsyncThunk(
  "wallet/fetchAccounts",
  async (_, { rejectWithValue }) => {
    try {
      return await walletService.getAccounts();
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to fetch accounts");
    }
  },
);
export const fetchAccountDetails = createAsyncThunk(
  "wallet/fetchAccountDetails",
  async (accountId, { rejectWithValue }) => {
    try {
      return await walletService.getAccount(accountId);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(
        error.message || "Failed to fetch account details",
      );
    }
  },
);
export const createAccount = createAsyncThunk(
  "wallet/createAccount",
  async (accountData, { rejectWithValue }) => {
    try {
      return await walletService.createAccount(accountData);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to create account");
    }
  },
);
export const fetchTransactions = createAsyncThunk(
  "wallet/fetchTransactions",
  async ({ accountId, filters }, { rejectWithValue }) => {
    try {
      const response = await walletService.getTransactions(accountId, filters);
      return response.data || [];
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to fetch transactions");
    }
  },
);
export const depositFunds = createAsyncThunk(
  "wallet/depositFunds",
  async (depositData, { rejectWithValue }) => {
    try {
      return await walletService.depositFunds(depositData);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to deposit funds");
    }
  },
);
export const withdrawFunds = createAsyncThunk(
  "wallet/withdrawFunds",
  async (withdrawalData, { rejectWithValue }) => {
    try {
      return await walletService.withdrawFunds(withdrawalData);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to withdraw funds");
    }
  },
);
export const transferFunds = createAsyncThunk(
  "wallet/transferFunds",
  async (transferData, { rejectWithValue }) => {
    try {
      return await walletService.transferFunds(transferData);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to transfer funds");
    }
  },
);
export const fetchCards = createAsyncThunk(
  "wallet/fetchCards",
  async (_, { rejectWithValue }) => {
    try {
      return await walletService.getCards();
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to fetch cards");
    }
  },
);
export const fetchCardDetails = createAsyncThunk(
  "wallet/fetchCardDetails",
  async (cardId, { rejectWithValue }) => {
    try {
      return await walletService.getCard(cardId);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to fetch card details");
    }
  },
);
export const issueCard = createAsyncThunk(
  "wallet/issueCard",
  async (cardData, { rejectWithValue }) => {
    try {
      return await walletService.issueCard(cardData);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to issue card");
    }
  },
);
export const activateCard = createAsyncThunk(
  "wallet/activateCard",
  async ({ cardId, activationCode }, { rejectWithValue }) => {
    try {
      await walletService.activateCard(cardId, activationCode);
      return cardId;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || "Failed to activate card");
    }
  },
);
export const toggleCardStatus = createAsyncThunk(
  "wallet/toggleCardStatus",
  async ({ cardId, action }, { rejectWithValue }) => {
    try {
      await walletService.toggleCardStatus(cardId, action);
      return { cardId, action };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(error.message || `Failed to ${action} card`);
    }
  },
);
export const fetchDashboardSummary = createAsyncThunk(
  "wallet/fetchDashboardSummary",
  async (_, { rejectWithValue }) => {
    try {
      return await walletService.getAccountSummary();
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(
        error.message || "Failed to fetch dashboard summary",
      );
    }
  },
);
export const fetchSpendingAnalytics = createAsyncThunk(
  "wallet/fetchSpendingAnalytics",
  async ({ accountId, period }, { rejectWithValue }) => {
    try {
      return await walletService.getSpendingAnalytics(accountId, period);
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(
        error.message || "Failed to fetch spending analytics",
      );
    }
  },
);
// Slice
const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentAccount: (state, action) => {
      state.currentAccount = action.payload;
    },
    setCurrentCard: (state, action) => {
      state.currentCard = action.payload;
    },
    clearWalletState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Accounts
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        if (action.payload.length > 0 && !state.currentAccount) {
          state.currentAccount = action.payload[0];
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Fetch Account Details
    builder
      .addCase(fetchAccountDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAccount = action.payload;
        // Update account in accounts array
        const index = state.accounts.findIndex(
          (acc) => acc.id === action.payload.id,
        );
        if (index !== -1) {
          state.accounts[index] = action.payload;
        } else {
          state.accounts.push(action.payload);
        }
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Create Account
    builder
      .addCase(createAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts.push(action.payload);
        state.currentAccount = action.payload;
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Fetch Transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Deposit Funds
    builder
      .addCase(depositFunds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(depositFunds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = [action.payload, ...state.transactions];
        // Update account balance
        if (
          state.currentAccount &&
          state.currentAccount.id === action.payload.account_id
        ) {
          state.currentAccount.balance += action.payload.amount;
          state.currentAccount.available_balance += action.payload.amount;
        }
        const accountIndex = state.accounts.findIndex(
          (acc) => acc.id === action.payload.account_id,
        );
        if (accountIndex !== -1) {
          state.accounts[accountIndex].balance += action.payload.amount;
          state.accounts[accountIndex].available_balance +=
            action.payload.amount;
        }
      })
      .addCase(depositFunds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Withdraw Funds
    builder
      .addCase(withdrawFunds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawFunds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = [action.payload, ...state.transactions];
        // Update account balance
        if (
          state.currentAccount &&
          state.currentAccount.id === action.payload.account_id
        ) {
          state.currentAccount.balance -= action.payload.amount;
          state.currentAccount.available_balance -= action.payload.amount;
        }
        const accountIndex = state.accounts.findIndex(
          (acc) => acc.id === action.payload.account_id,
        );
        if (accountIndex !== -1) {
          state.accounts[accountIndex].balance -= action.payload.amount;
          state.accounts[accountIndex].available_balance -=
            action.payload.amount;
        }
      })
      .addCase(withdrawFunds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Transfer Funds
    builder
      .addCase(transferFunds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(transferFunds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = [action.payload, ...state.transactions];
        // Update account balances
        const fromAccountIndex = state.accounts.findIndex(
          (acc) => acc.id === action.payload.from_account_id,
        );
        if (fromAccountIndex !== -1) {
          state.accounts[fromAccountIndex].balance -= action.payload.amount;
          state.accounts[fromAccountIndex].available_balance -=
            action.payload.amount;
        }
        const toAccountIndex = state.accounts.findIndex(
          (acc) => acc.id === action.payload.to_account_id,
        );
        if (toAccountIndex !== -1) {
          state.accounts[toAccountIndex].balance += action.payload.amount;
          state.accounts[toAccountIndex].available_balance +=
            action.payload.amount;
        }
        if (state.currentAccount) {
          if (state.currentAccount.id === action.payload.from_account_id) {
            state.currentAccount.balance -= action.payload.amount;
            state.currentAccount.available_balance -= action.payload.amount;
          } else if (state.currentAccount.id === action.payload.to_account_id) {
            state.currentAccount.balance += action.payload.amount;
            state.currentAccount.available_balance += action.payload.amount;
          }
        }
      })
      .addCase(transferFunds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Fetch Cards
    builder
      .addCase(fetchCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cards = action.payload;
        if (action.payload.length > 0 && !state.currentCard) {
          state.currentCard = action.payload[0];
        }
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Fetch Card Details
    builder
      .addCase(fetchCardDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCardDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCard = action.payload;
        // Update card in cards array
        const index = state.cards.findIndex(
          (card) => card.id === action.payload.id,
        );
        if (index !== -1) {
          state.cards[index] = action.payload;
        } else {
          state.cards.push(action.payload);
        }
      })
      .addCase(fetchCardDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Issue Card
    builder
      .addCase(issueCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(issueCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cards.push(action.payload);
        state.currentCard = action.payload;
      })
      .addCase(issueCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Activate Card
    builder
      .addCase(activateCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(activateCard.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update card status
        const cardIndex = state.cards.findIndex(
          (card) => card.id === action.payload,
        );
        if (cardIndex !== -1) {
          state.cards[cardIndex].status = "active";
        }
        if (state.currentCard && state.currentCard.id === action.payload) {
          state.currentCard.status = "active";
        }
      })
      .addCase(activateCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Toggle Card Status
    builder
      .addCase(toggleCardStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleCardStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update card status
        const { cardId, action: cardAction } = action.payload;
        const newStatus = cardAction === "block" ? "blocked" : "active";
        const cardIndex = state.cards.findIndex((card) => card.id === cardId);
        if (cardIndex !== -1) {
          state.cards[cardIndex].status = newStatus;
        }
        if (state.currentCard && state.currentCard.id === cardId) {
          state.currentCard.status = newStatus;
        }
      })
      .addCase(toggleCardStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Fetch Dashboard Summary
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardSummary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // Fetch Spending Analytics
    builder
      .addCase(fetchSpendingAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSpendingAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchSpendingAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});
export const {
  clearError,
  setCurrentAccount,
  setCurrentCard,
  clearWalletState,
} = walletSlice.actions;
export default walletSlice.reducer;
