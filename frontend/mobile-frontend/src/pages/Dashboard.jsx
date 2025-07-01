/**
 * Mobile Dashboard Page for Flowlet Financial Application
 * Optimized for mobile viewing with touch-friendly interface
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../components/security/MobileAuthGuard';

const Dashboard = () => {
  const { user } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [accountData, setAccountData] = useState({
    balance: 12450.75,
    currency: 'USD',
    accountNumber: '****1234'
  });
  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: 1,
      type: 'credit',
      amount: 2500.00,
      description: 'Salary Deposit',
      date: '2024-01-15',
      category: 'Income'
    },
    {
      id: 2,
      type: 'debit',
      amount: 85.50,
      description: 'Grocery Store',
      date: '2024-01-14',
      category: 'Food'
    },
    {
      id: 3,
      type: 'debit',
      amount: 1200.00,
      description: 'Rent Payment',
      date: '2024-01-13',
      category: 'Housing'
    }
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountData.currency
    }).format(amount);
  };

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || 'User'}!</h1>
        <p className="text-muted-foreground">Here's your financial overview</p>
      </div>

      {/* Account Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Main Account</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBalanceVisibility}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-primary-foreground/80 text-sm">{accountData.accountNumber}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-3xl font-bold">
              {balanceVisible ? formatCurrency(accountData.balance) : '••••••'}
            </p>
            <p className="text-primary-foreground/80 text-sm">Available Balance</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-16 flex-col gap-2">
            <Plus className="h-5 w-5" />
            <span className="text-sm">Send Money</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-2">
            <ArrowDownLeft className="h-5 w-5" />
            <span className="text-sm">Request</span>
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'credit' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {transaction.category}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cards Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Cards</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Flowlet Platinum</p>
                <p className="text-xs text-muted-foreground">****1234</p>
              </div>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

