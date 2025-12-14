// Wallet Service for Flowlet web-frontend
import { api } from "./api";
// Wallet Service Class
class WalletService {
  /**
   * Get all user accounts
   */
  async getAccounts() {
    try {
      return await api.get("/api/v1/accounts");
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get specific account by ID
   */
  async getAccount(accountId) {
    try {
      return await api.get(`/api/v1/accounts/${accountId}`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Create new account
   */
  async createAccount(accountData) {
    try {
      return await api.post("/api/v1/accounts", accountData);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get account balance
   */
  async getAccountBalance(accountId) {
    try {
      return await api.get(`/api/v1/accounts/${accountId}/balance`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Deposit funds to account
   */
  async depositFunds(depositData) {
    try {
      return await api.post(
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
  async withdrawFunds(withdrawalData) {
    try {
      return await api.post(
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
  async transferFunds(transferData) {
    try {
      return await api.post("/api/v1/transfers", transferData);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get transaction history
   */
  async getTransactions(accountId, filters) {
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
      const url = `/api/v1/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ""}`;
      return await api.get(url);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get specific transaction
   */
  async getTransaction(transactionId) {
    try {
      return await api.get(`/api/v1/transactions/${transactionId}`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Cancel pending transaction
   */
  async cancelTransaction(transactionId) {
    try {
      await api.post(`/api/v1/transactions/${transactionId}/cancel`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get all user cards
   */
  async getCards() {
    try {
      return await api.get("/api/v1/cards");
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get specific card
   */
  async getCard(cardId) {
    try {
      return await api.get(`/api/v1/cards/${cardId}`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Issue new card
   */
  async issueCard(cardData) {
    try {
      return await api.post("/api/v1/cards", cardData);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Activate card
   */
  async activateCard(cardId, activationCode) {
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
  async toggleCardStatus(cardId, action) {
    try {
      await api.post(`/api/v1/cards/${cardId}/${action}`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Update card limits
   */
  async updateCardLimits(cardId, limits) {
    try {
      return await api.put(`/api/v1/cards/${cardId}/limits`, limits);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get card transactions
   */
  async getCardTransactions(cardId, filters) {
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
      const url = `/api/v1/cards/${cardId}/transactions${queryString ? `?${queryString}` : ""}`;
      return await api.get(url);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Request card PIN change
   */
  async changeCardPin(cardId, currentPin, newPin) {
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
  async getSpendingAnalytics(accountId, period) {
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
  async getAccountSummary() {
    try {
      return await api.get("/api/v1/dashboard/summary");
    } catch (error) {
      throw error;
    }
  }
  /**
   * Search transactions
   */
  async searchTransactions(query, filters) {
    try {
      const params = new URLSearchParams({ search: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== "search") {
            params.append(key, value.toString());
          }
        });
      }
      return await api.get(`/api/v1/transactions/search?${params.toString()}`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Export transactions
   */
  async exportTransactions(accountId, format, filters) {
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
      return response;
    } catch (error) {
      throw error;
    }
  }
}
// Export singleton instance
export const walletService = new WalletService();
export default walletService;
