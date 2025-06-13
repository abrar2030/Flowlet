import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Plus, 
  Send, 
  Download, 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  CreditCard,
  Smartphone,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { useWalletStore, useUIStore } from '../../store/index.js';
import { walletAPI } from '../../services/api.js';
import { useAuth, useApi } from '../../hooks/index.js';

const WalletScreen = () => {
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const {
    wallets,
    activeWallet,
    balance,
    transactions,
    setWallets,
    setActiveWallet,
    setBalance,
    setTransactions,
    updateWallet,
  } = useWalletStore();

  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock data for demonstration
  const mockWallets = [
    {
      id: 'wallet_1',
      name: 'Primary Wallet',
      currency: 'USD',
      balance: 12450.75,
      type: 'user',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'wallet_2',
      name: 'Savings Wallet',
      currency: 'USD',
      balance: 5200.00,
      type: 'user',
      status: 'active',
      created_at: '2025-01-15T00:00:00Z'
    },
    {
      id: 'wallet_3',
      name: 'EUR Wallet',
      currency: 'EUR',
      balance: 850.30,
      type: 'user',
      status: 'active',
      created_at: '2025-02-01T00:00:00Z'
    }
  ];

  const mockTransactions = [
    {
      id: 'tx_1',
      type: 'deposit',
      amount: 2500.00,
      currency: 'USD',
      description: 'Salary Deposit',
      status: 'completed',
      created_at: '2025-06-10T14:30:00Z',
      category: 'Income',
      from_wallet: null,
      to_wallet: 'wallet_1'
    },
    {
      id: 'tx_2',
      type: 'withdrawal',
      amount: -85.50,
      currency: 'USD',
      description: 'ATM Withdrawal',
      status: 'completed',
      created_at: '2025-06-09T16:45:00Z',
      category: 'Cash',
      from_wallet: 'wallet_1',
      to_wallet: null
    },
    {
      id: 'tx_3',
      type: 'transfer',
      amount: -200.00,
      currency: 'USD',
      description: 'Transfer to Savings',
      status: 'completed',
      created_at: '2025-06-08T10:15:00Z',
      category: 'Transfer',
      from_wallet: 'wallet_1',
      to_wallet: 'wallet_2'
    },
    {
      id: 'tx_4',
      type: 'deposit',
      amount: 150.00,
      currency: 'USD',
      description: 'Freelance Payment',
      status: 'completed',
      created_at: '2025-06-07T09:20:00Z',
      category: 'Income',
      from_wallet: null,
      to_wallet: 'wallet_1'
    },
    {
      id: 'tx_5',
      type: 'withdrawal',
      amount: -45.00,
      currency: 'USD',
      description: 'Online Purchase',
      status: 'pending',
      created_at: '2025-06-06T18:30:00Z',
      category: 'Shopping',
      from_wallet: 'wallet_1',
      to_wallet: null
    }
  ];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      // For demo purposes, use mock data
      setWallets(mockWallets);
      setActiveWallet(mockWallets[0]);
      setBalance(mockWallets[0].balance);
      setTransactions(mockTransactions);

      // In real implementation, uncomment below:
      // const walletsData = await request(() => walletAPI.getUserWallets(user.id));
      // setWallets(walletsData);
      // if (walletsData.length > 0) {
      //   setActiveWallet(walletsData[0]);
      //   const balanceData = await request(() => walletAPI.getBalance(walletsData[0].id));
      //   setBalance(balanceData.balance);
      //   const transactionsData = await request(() => walletAPI.getTransactions(walletsData[0].id));
      //   setTransactions(transactionsData.transactions);
      // }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Load Wallet',
        message: error.message || 'Could not load wallet data.',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleWalletSwitch = (wallet) => {
    setActiveWallet(wallet);
    setBalance(wallet.balance);
    // Filter transactions for the selected wallet
    const walletTransactions = mockTransactions.filter(tx => 
      tx.from_wallet === wallet.id || tx.to_wallet === wallet.id
    );
    setTransactions(walletTransactions);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'transfer':
        return <Send className="w-5 h-5 text-blue-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalIncome = transactions
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = Math.abs(transactions
    .filter(tx => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 safe-top safe-bottom">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground mt-1">Manage your digital wallets and transactions</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="touch-target"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button className="btn-mobile gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </motion.div>

        {/* Wallet Selector */}
        {wallets.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-mobile">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Select Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {wallets.map((wallet) => (
                    <Button
                      key={wallet.id}
                      variant={activeWallet?.id === wallet.id ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start"
                      onClick={() => handleWalletSwitch(wallet)}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="font-medium">{wallet.name}</span>
                        <Badge variant="secondary">{wallet.currency}</Badge>
                      </div>
                      <span className="text-sm opacity-80">
                        ${wallet.balance.toLocaleString()}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-mobile gradient-primary text-white border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6 text-white/80" />
                  <CardTitle className="text-white/90">
                    {activeWallet?.name || 'Primary Wallet'}
                  </CardTitle>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-white/80 text-sm">Available Balance</p>
                  <p className="text-4xl font-bold text-white">
                    {showBalance ? `$${balance?.toLocaleString() || '0.00'}` : '••••••'}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    {activeWallet?.currency || 'USD'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-white/80 text-xs">This Month Income</p>
                    <p className="text-white font-semibold">
                      +${totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80 text-xs">This Month Expenses</p>
                    <p className="text-white font-semibold">
                      -${totalExpenses.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <Send className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm">Send Money</span>
                </Button>
                
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <Download className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm">Request</span>
                </Button>
                
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <Plus className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm">Add Money</span>
                </Button>
                
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <CreditCard className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm">Pay Bills</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Track all your wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="transfer">Transfers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </p>
                            <Badge 
                              variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {transaction.category}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {filteredTransactions.length > 0 && (
                <div className="text-center mt-6">
                  <Button variant="outline">
                    Load More Transactions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WalletScreen;

