// Wallet Service for Flowlet Frontend
import { api, ApiError, PaginatedResponse } from "./api";

// Types
export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  account_type: "checking" | "savings" | "business";
  balance: number;
  available_balance: number;
  currency: string;
  status: "active" | "inactive" | "frozen" | "closed";
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  transaction_type:
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "payment"
    | "refund";
  amount: number;
  currency: string;
  description: string;
  reference_number: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // For transfers
  from_account_id?: string;
  to_account_id?: string;
  recipient_name?: string;
  sender_name?: string;
}

export interface Card {
  id: string;
  user_id: string;
  account_id: string;
  card_number: string; // Masked
  card_type: "debit" | "credit" | "prepaid";
  card_brand: "visa" | "mastercard" | "amex";
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  status: "active" | "inactive" | "blocked" | "expired";
  daily_limit: number;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface TransferRequest {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  reference?: string;
}

export interface DepositRequest {
  account_id: string;
  amount: number;
  description?: string;
  payment_method?: string;
}

export interface WithdrawalRequest {
  account_id: string;
  amount: number;
  description?: string;
  withdrawal_method?: string;
}

export interface CardRequest {
  account_id: string;
  card_type: "debit" | "credit" | "prepaid";
  daily_limit?: number;
  monthly_limit?: number;
}

export interface TransactionFilters {
  account_id?: string;
  transaction_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

// Wallet Service Class
class WalletService {
  /**
   * Get all user accounts
   */
  async getAccounts(): Promise<Account[]> {
    try {
      return await api.get<Account[]>("/api/v1/accounts");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get specific account by ID
   */
  async getAccount(accountId: string): Promise<Account> {
    try {
      return await api.get<Account>(`/api/v1/accounts/${accountId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new account
   */
  async createAccount(accountData: {
    account_type: "checking" | "savings" | "business";
    currency?: string;
  }): Promise<Account> {
    try {
      return await api.post<Account>("/api/v1/accounts", accountData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string): Promise<{
    balance: number;
    available_balance: number;
    currency: string;
  }> {
    try {
      return await api.get(`/api/v1/accounts/${accountId}/balance`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deposit funds to account
   */
  async depositFunds(depositData: DepositRequest): Promise<Transaction> {
    try {
      return await api.post<Transaction>(
        `/api/v1/accounts/${depositData.account_id}/deposit`,
        depositData,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Withdraw funds from account
   */
  async withdrawFunds(withdrawalData: WithdrawalRequest): Promise<Transaction> {
    try {
      return await api.post<Transaction>(
        `/api/v1/accounts/${withdrawalData.account_id}/withdraw`,
        withdrawalData,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transfer funds between accounts
   */
  async transferFunds(transferData: TransferRequest): Promise<Transaction> {
    try {
      return await api.post<Transaction>("/api/v1/transfers", transferData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    accountId: string,
    filters?: TransactionFilters,
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const queryString = params.toString();
      const url = `/api/v1/accounts/${accountId}/transactions${
        queryString ? `?${queryString}` : ""
      }`;

      return await api.get<Transaction[]>(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get specific transaction
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      return await api.get<Transaction>(
        `/api/v1/transactions/${transactionId}`,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel pending transaction
   */
  async cancelTransaction(transactionId: string): Promise<void> {
    try {
      await api.post(`/api/v1/transactions/${transactionId}/cancel`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all user cards
   */
  async getCards(): Promise<Card[]> {
    try {
      return await api.get<Card[]>("/api/v1/cards");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get specific card
   */
  async getCard(cardId: string): Promise<Card> {
    try {
      return await api.get<Card>(`/api/v1/cards/${cardId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Issue new card
   */
  async issueCard(cardData: CardRequest): Promise<Card> {
    try {
      return await api.post<Card>("/api/v1/cards", cardData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activate card
   */
  async activateCard(cardId: string, activationCode: string): Promise<void> {
    try {
      await api.post(`/api/v1/cards/${cardId}/activate`, {
        activation_code: activationCode,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Block/Unblock card
   */
  async toggleCardStatus(
    cardId: string,
    action: "block" | "unblock",
  ): Promise<void> {
    try {
      await api.post(`/api/v1/cards/${cardId}/${action}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update card limits
   */
  async updateCardLimits(
    cardId: string,
    limits: { daily_limit?: number; monthly_limit?: number },
  ): Promise<Card> {
    try {
      return await api.put<Card>(`/api/v1/cards/${cardId}/limits`, limits);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get card transactions
   */
  async getCardTransactions(
    cardId: string,
    filters?: TransactionFilters,
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const queryString = params.toString();
      const url = `/api/v1/cards/${cardId}/transactions${
        queryString ? `?${queryString}` : ""
      }`;

      return await api.get<Transaction[]>(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request card PIN change
   */
  async changeCardPin(
    cardId: string,
    currentPin: string,
    newPin: string,
  ): Promise<void> {
    try {
      await api.post(`/api/v1/cards/${cardId}/change-pin`, {
        current_pin: currentPin,
        new_pin: newPin,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get spending analytics
   */
  async getSpendingAnalytics(
    accountId?: string,
    period?: "week" | "month" | "quarter" | "year",
  ): Promise<{
    total_spent: number;
    categories: Array<{ category: string; amount: number; percentage: number }>;
    trends: Array<{ date: string; amount: number }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append("account_id", accountId);
      if (period) params.append("period", period);

      const queryString = params.toString();
      const url = `/api/v1/analytics/spending${queryString ? `?${queryString}` : ""}`;

      return await api.get(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get account summary
   */
  async getAccountSummary(): Promise<{
    total_balance: number;
    total_accounts: number;
    total_cards: number;
    recent_transactions: Transaction[];
    monthly_spending: number;
    monthly_income: number;
  }> {
    try {
      return await api.get("/api/v1/dashboard/summary");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search transactions
   */
  async searchTransactions(
    query: string,
    filters?: TransactionFilters,
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const params = new URLSearchParams({ search: query });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== "search") {
            params.append(key, value.toString());
          }
        });
      }

      return await api.get<Transaction[]>(
        `/api/v1/transactions/search?${params.toString()}`,
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export transactions
   */
  async exportTransactions(
    accountId: string,
    format: "csv" | "pdf",
    filters?: TransactionFilters,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(
        `/api/v1/accounts/${accountId}/transactions/export?${params.toString()}`,
        { responseType: "blob" },
      );

      return response as unknown as Blob;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
