import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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

  // Mock wallet data
  const mockWallet = {
    id: 'wallet_123',
    userId: user?.id,
    balances: {
      USD: 2500.75,
      EUR: 1200.50,
      GBP: 850.25
    },
    status: 'active',
    type: 'personal',
    createdAt: '2024-01-15T10:00:00Z',
    lastActivity: new Date().toISOString()
  };

  // Mock transaction data
  const mockTransactions = [
    {
      id: 'tx_001',
      type: 'credit',
      amount: 500.00,
      currency: 'USD',
      description: 'Salary deposit',
      status: 'completed',
      timestamp: '2024-06-10T09:30:00Z',
      reference: 'SAL_2024_06'
    },
    {
      id: 'tx_002',
      type: 'debit',
      amount: 125.50,
      currency: 'USD',
      description: 'Online purchase - Amazon',
      status: 'completed',
      timestamp: '2024-06-09T14:22:00Z',
      reference: 'AMZ_ORDER_123'
    },
    {
      id: 'tx_003',
      type: 'credit',
      amount: 75.25,
      currency: 'USD',
      description: 'Refund - Store return',
      status: 'completed',
      timestamp: '2024-06-08T11:15:00Z',
      reference: 'REF_STORE_456'
    },
    {
      id: 'tx_004',
      type: 'debit',
      amount: 200.00,
      currency: 'USD',
      description: 'Transfer to savings',
      status: 'pending',
      timestamp: '2024-06-10T16:45:00Z',
      reference: 'SAVE_TRANSFER_789'
    }
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      setWallet(mockWallet);
      setTransactions(mockTransactions);
    } else {
      setWallet(null);
      setTransactions([]);
    }
  }, [isAuthenticated, user]);

  const sendPayment = async (paymentData) => {
    setLoading(true);
    try {
      // Simulate API call
      const newTransaction = {
        id: 'tx_' + Date.now(),
        type: 'debit',
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: `Payment to ${paymentData.recipient}`,
        status: 'pending',
        timestamp: new Date().toISOString(),
        reference: 'PAY_' + Date.now()
      };

      // Update wallet balance
      const updatedWallet = {
        ...wallet,
        balances: {
          ...wallet.balances,
          [paymentData.currency]: wallet.balances[paymentData.currency] - paymentData.amount
        }
      };

      setWallet(updatedWallet);
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Simulate processing delay
      setTimeout(() => {
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === newTransaction.id 
              ? { ...tx, status: 'completed' }
              : tx
          )
        );
      }, 3000);

      return { success: true, transaction: newTransaction };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const requestPayment = async (requestData) => {
    setLoading(true);
    try {
      // Simulate API call
      const paymentRequest = {
        id: 'req_' + Date.now(),
        amount: requestData.amount,
        currency: requestData.currency,
        description: requestData.description,
        from: requestData.from,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      return { success: true, request: paymentRequest };
    } catch (error) {
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

  return (
    <WalletContext.Provider value={{
      wallet,
      transactions,
      loading,
      sendPayment,
      requestPayment,
      getTransactionHistory
    }}>
      {children}
    </WalletContext.Provider>
  );
};

