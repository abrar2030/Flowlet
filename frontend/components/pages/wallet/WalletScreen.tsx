import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
}

interface WalletScreenProps {
  balance?: number;
  recentTransactions?: Transaction[];
}

const WalletScreen: React.FC<WalletScreenProps> = ({
  balance = 1234.56,
  recentTransactions = [
    { id: '1', description: 'Coffee Shop', amount: -4.50, type: 'debit', date: '2025-01-14' },
    { id: '2', description: 'Salary Deposit', amount: 2000.00, type: 'credit', date: '2025-01-13' },
    { id: '3', description: 'Online Purchase', amount: -75.00, type: 'debit', date: '2025-01-12' },
  ]
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Wallet</h1>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Current Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'credit'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-16 flex flex-col gap-1">
          <span className="text-sm">Send Money</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1">
          <span className="text-sm">Receive Money</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1">
          <span className="text-sm">View Cards</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1">
          <span className="text-sm">Analytics</span>
        </Button>
      </div>
    </div>
  );
};

export default WalletScreen;
