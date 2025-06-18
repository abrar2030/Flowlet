import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadWalletData();
    } else {
      setWallet(null);
      setTransactions([]);
    }
  }, [isAuthenticated, user]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Get user's wallets
      const walletsResponse = await apiService.getUserWallets(user.id);
      if (walletsResponse.wallets && walletsResponse.wallets.length > 0) {
        const primaryWallet = walletsResponse.wallets[0]; // Use first wallet as primary
        setWallet(primaryWallet);
        
        // Load transactions for the primary wallet
        const transactionsResponse = await apiService.getWalletTransactions(primaryWallet.wallet_id);
        setTransactions(transactionsResponse.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshWalletData = async () => {
    if (wallet) {
      try {
        // Refresh wallet balance
        const balanceResponse = await apiService.getWalletBalance(wallet.wallet_id);
        setWallet(prev => ({
          ...prev,
          balance: balanceResponse.balance,
          available_balance: balanceResponse.available_balance
        }));
        
        // Refresh transactions
        const transactionsResponse = await apiService.getWalletTransactions(wallet.wallet_id);
        setTransactions(transactionsResponse.transactions || []);
      } catch (error) {
        console.error('Failed to refresh wallet data:', error);
      }
    }
  };

  const sendPayment = async (paymentData) => {
    if (!wallet) {
      return { success: false, error: 'No wallet available' };
    }

    setLoading(true);
    try {
      // Use wallet transfer for internal transfers
      const transferResponse = await apiService.transferFunds(wallet.wallet_id, {
        to_wallet_id: paymentData.toWalletId,
        amount: paymentData.amount,
        description: paymentData.description || `Payment to ${paymentData.recipient}`
      });

      if (transferResponse.transfer_id) {
        // Refresh wallet data after successful transfer
        await refreshWalletData();
        return { success: true, transaction: transferResponse };
      } else {
        return { success: false, error: 'Transfer failed' };
      }
    } catch (error) {
      console.error('Payment failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const requestPayment = async (requestData) => {
    setLoading(true);
    try {
      // For now, create a mock payment request
      // In a real implementation, this would create a payment request in the backend
      const paymentRequest = {
        id: 'req_' + Date.now(),
        amount: requestData.amount,
        currency: requestData.currency || 'USD',
        description: requestData.description,
        from: requestData.from,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      return { success: true, request: paymentRequest };
    } catch (error) {
      console.error('Payment request failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getTransactionHistory = (filters = {}) => {
    let filteredTransactions = [...transactions];

    if (filters.type) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === filters.type);
    }

    if (filters.currency) {
      filteredTransactions = filteredTransactions.filter(tx => tx.currency === filters.currency);
    }

    if (filters.status) {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === filters.status);
    }

    return filteredTransactions;
  };

  const createWallet = async (walletData) => {
    try {
      setLoading(true);
      const response = await apiService.createWallet({
        user_id: user.id,
        wallet_type: walletData.type || 'user',
        currency: walletData.currency || 'USD'
      });

      if (response.wallet_id) {
        // Reload wallet data
        await loadWalletData();
        return { success: true, wallet: response };
      } else {
        return { success: false, error: 'Wallet creation failed' };
      }
    } catch (error) {
      console.error('Wallet creation failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const freezeWallet = async () => {
    if (!wallet) return { success: false, error: 'No wallet available' };

    try {
      setLoading(true);
      const response = await apiService.freezeWallet(wallet.wallet_id);
      
      if (response.status === 'suspended') {
        setWallet(prev => ({ ...prev, status: 'suspended' }));
        return { success: true, message: response.message };
      } else {
        return { success: false, error: 'Failed to freeze wallet' };
      }
    } catch (error) {
      console.error('Wallet freeze failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const unfreezeWallet = async () => {
    if (!wallet) return { success: false, error: 'No wallet available' };

    try {
      setLoading(true);
      const response = await apiService.unfreezeWallet(wallet.wallet_id);
      
      if (response.status === 'active') {
        setWallet(prev => ({ ...prev, status: 'active' }));
        return { success: true, message: response.message };
      } else {
        return { success: false, error: 'Failed to unfreeze wallet' };
      }
    } catch (error) {
      console.error('Wallet unfreeze failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      transactions,
      loading,
      sendPayment,
      requestPayment,
      getTransactionHistory,
      createWallet,
      freezeWallet,
      unfreezeWallet,
      refreshWalletData,
      loadWalletData
    }}>
      {children}
    </WalletContext.Provider>
  );
};

