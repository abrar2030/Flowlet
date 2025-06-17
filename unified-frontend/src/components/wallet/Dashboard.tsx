import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Plus, Send, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const quickStats = [
    {
      title: 'Total Balance',
      value: '$12,345.67',
      change: '+2.5%',
      trend: 'up',
      icon: Wallet,
    },
    {
      title: 'Monthly Income',
      value: '$4,200.00',
      change: '+8.1%',
      trend: 'up',
      icon: ArrowDownRight,
    },
    {
      title: 'Monthly Expenses',
      value: '$2,850.30',
      change: '-3.2%',
      trend: 'down',
      icon: ArrowUpRight,
    },
    {
      title: 'Savings Rate',
      value: '32.1%',
      change: '+5.4%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  const recentTransactions = [
    { id: 1, description: 'Grocery Store', amount: -85.32, date: '2024-01-15', category: 'Food' },
    { id: 2, description: 'Salary Deposit', amount: 4200.00, date: '2024-01-15', category: 'Income' },
    { id: 3, description: 'Electric Bill', amount: -120.45, date: '2024-01-14', category: 'Utilities' },
    { id: 4, description: 'Coffee Shop', amount: -12.50, date: '2024-01-14', category: 'Food' },
    { id: 5, description: 'Gas Station', amount: -65.00, date: '2024-01-13', category: 'Transport' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your finances today.
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          <Button variant="outline">
            <Send className="mr-2 h-4 w-4" />
            Send Money
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.amount > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Transactions
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Send className="mr-2 h-4 w-4" />
              Send Money
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Request Money
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Bills
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

