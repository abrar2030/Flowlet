import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Plus, Send, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';

const Dashboard = () => {
  // Mock data for demonstration
  const walletBalance = 12450.75;
  const monthlyIncome = 5200.00;
  const monthlyExpenses = 3150.25;
  const recentTransactions = [
    { id: 1, type: 'income', amount: 2500, description: 'Salary Deposit', date: '2025-06-10', category: 'Income' },
    { id: 2, type: 'expense', amount: -85.50, description: 'Grocery Store', date: '2025-06-09', category: 'Food' },
    { id: 3, type: 'expense', amount: -45.00, description: 'Gas Station', date: '2025-06-08', category: 'Transport' },
    { id: 4, type: 'income', amount: 150.00, description: 'Freelance Work', date: '2025-06-07', category: 'Income' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 safe-top safe-bottom">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your financial overview.</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button className="btn-mobile gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
          </div>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-mobile gradient-primary text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/90 text-sm font-medium">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">${walletBalance.toLocaleString()}</p>
                    <p className="text-white/80 text-sm mt-1">Available to spend</p>
                  </div>
                  <Wallet className="w-8 h-8 text-white/80" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="card-mobile">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">${monthlyIncome.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">+12.5%</span>
                    </div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-mobile">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">${monthlyExpenses.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                      <span className="text-sm text-red-600">+5.2%</span>
                    </div>
                  </div>
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your money with ease</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <Send className="w-6 h-6 mb-2" />
                  <span className="text-sm">Send Money</span>
                </Button>
                
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  <span className="text-sm">Request Money</span>
                </Button>
                
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="text-sm">Add Money</span>
                </Button>
                
                <Button variant="outline" className="btn-mobile h-20 flex-col">
                  <Wallet className="w-6 h-6 mb-2" />
                  <span className="text-sm">View Wallet</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-mobile">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest financial activity</CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'income' ? 
                          <ArrowUpRight className="w-5 h-5" /> : 
                          <ArrowDownRight className="w-5 h-5" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

