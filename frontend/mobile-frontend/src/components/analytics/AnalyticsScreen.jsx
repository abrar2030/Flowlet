import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Filter,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { useAnalyticsStore, useUIStore } from '../../store/index.js';
import { analyticsAPI } from '../../services/api.js';
import { useAuth, useApi } from '../../hooks/index.js';

const AnalyticsScreen = () => {
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const {
    spendingData,
    incomeData,
    categoryData,
    budgets,
    insights,
    setSpendingData,
    setIncomeData,
    setCategoryData,
    setBudgets,
    setInsights,
  } = useAnalyticsStore();

  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockSpendingData = [
    { month: 'Jan', spending: 2400, income: 3200, budget: 2800 },
    { month: 'Feb', spending: 1800, income: 3200, budget: 2800 },
    { month: 'Mar', spending: 2200, income: 3400, budget: 2800 },
    { month: 'Apr', spending: 2600, income: 3200, budget: 2800 },
    { month: 'May', spending: 3100, income: 3600, budget: 2800 },
    { month: 'Jun', spending: 2850, income: 3200, budget: 2800 },
  ];

  const mockCategoryData = [
    { name: 'Food & Dining', value: 850, color: '#8884d8', budget: 1000 },
    { name: 'Shopping', value: 650, color: '#82ca9d', budget: 800 },
    { name: 'Transportation', value: 420, color: '#ffc658', budget: 500 },
    { name: 'Entertainment', value: 380, color: '#ff7300', budget: 400 },
    { name: 'Bills & Utilities', value: 320, color: '#00ff88', budget: 350 },
    { name: 'Healthcare', value: 230, color: '#ff0088', budget: 300 },
  ];

  const mockIncomeData = [
    { month: 'Jan', salary: 3000, freelance: 200, investments: 0 },
    { month: 'Feb', salary: 3000, freelance: 200, investments: 0 },
    { month: 'Mar', salary: 3000, freelance: 400, investments: 0 },
    { month: 'Apr', salary: 3000, freelance: 200, investments: 0 },
    { month: 'May', salary: 3000, freelance: 600, investments: 0 },
    { month: 'Jun', salary: 3000, freelance: 200, investments: 0 },
  ];

  const mockBudgets = [
    { 
      id: 1, 
      category: 'Food & Dining', 
      budget: 1000, 
      spent: 850, 
      remaining: 150,
      status: 'on-track'
    },
    { 
      id: 2, 
      category: 'Shopping', 
      budget: 800, 
      spent: 650, 
      remaining: 150,
      status: 'on-track'
    },
    { 
      id: 3, 
      category: 'Transportation', 
      budget: 500, 
      spent: 420, 
      remaining: 80,
      status: 'on-track'
    },
    { 
      id: 4, 
      category: 'Entertainment', 
      budget: 400, 
      spent: 380, 
      remaining: 20,
      status: 'warning'
    },
  ];

  const mockInsights = [
    {
      type: 'positive',
      title: 'Great Savings This Month!',
      description: 'You saved 15% more than last month by reducing dining expenses.',
      amount: 180,
      icon: TrendingUp
    },
    {
      type: 'warning',
      title: 'Entertainment Budget Alert',
      description: 'You\'ve spent 95% of your entertainment budget with 5 days left.',
      amount: 20,
      icon: AlertCircle
    },
    {
      type: 'info',
      title: 'Income Increase',
      description: 'Your freelance income increased by 200% this month.',
      amount: 400,
      icon: ArrowUpRight
    },
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      // For demo purposes, use mock data
      setSpendingData(mockSpendingData);
      setIncomeData(mockIncomeData);
      setCategoryData(mockCategoryData);
      setBudgets(mockBudgets);
      setInsights(mockInsights);

      // In real implementation:
      // const analyticsData = await request(() => analyticsAPI.getAnalytics(user.id, timeRange));
      // setSpendingData(analyticsData.spending);
      // setIncomeData(analyticsData.income);
      // setCategoryData(analyticsData.categories);
      // setBudgets(analyticsData.budgets);
      // setInsights(analyticsData.insights);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Load Analytics',
        message: error.message || 'Could not load analytics data.',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalSpending = mockSpendingData.reduce((sum, item) => sum + item.spending, 0);
  const totalIncome = mockSpendingData.reduce((sum, item) => sum + item.income, 0);
  const totalBudget = mockBudgets.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = mockBudgets.reduce((sum, item) => sum + item.spent, 0);
  const savingsRate = ((totalIncome - totalSpending) / totalIncome * 100).toFixed(1);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spent / budget.budget) * 100;
    if (percentage >= 90) return { color: 'text-red-600', status: 'Over Budget' };
    if (percentage >= 75) return { color: 'text-yellow-600', status: 'Warning' };
    return { color: 'text-green-600', status: 'On Track' };
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 safe-top safe-bottom">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Track your financial performance and insights</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-mobile">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">+12.5%</span>
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spending</p>
                    <p className="text-2xl font-bold text-red-600">${totalSpending.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                      <span className="text-sm text-red-600">+5.2%</span>
                    </div>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Savings Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{savingsRate}%</p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-sm text-blue-600">+2.1%</span>
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Used</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {((totalSpent / totalBudget) * 100).toFixed(0)}%
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-muted-foreground">
                        ${(totalBudget - totalSpent).toLocaleString()} left
                      </span>
                    </div>
                  </div>
                  <PieChart className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="spending">Spending</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Spending vs Income Chart */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Income vs Spending Trend</CardTitle>
                  <CardDescription>Track your financial flow over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockSpendingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="income" 
                          stackId="1"
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.6}
                          name="Income"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="spending" 
                          stackId="2"
                          stroke="#ef4444" 
                          fill="#ef4444" 
                          fillOpacity={0.6}
                          name="Spending"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-mobile">
                  <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>Where your money goes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={mockCategoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {mockCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Insights */}
                <Card className="card-mobile">
                  <CardHeader>
                    <CardTitle>Financial Insights</CardTitle>
                    <CardDescription>AI-powered recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockInsights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-border">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <p className="font-medium">{insight.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                            {insight.amount && (
                              <Badge variant="secondary" className="mt-2">
                                ${insight.amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Spending Tab */}
            <TabsContent value="spending" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Monthly Spending Analysis</CardTitle>
                  <CardDescription>Detailed breakdown of your expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockSpendingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Spending']} />
                        <Bar dataKey="spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Details */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Spending by category with budget comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCategoryData.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ${category.value.toLocaleString()} / ${category.budget.toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={(category.value / category.budget) * 100} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{((category.value / category.budget) * 100).toFixed(0)}% used</span>
                          <span>${(category.budget - category.value).toLocaleString()} remaining</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Income Tab */}
            <TabsContent value="income" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Income Sources</CardTitle>
                  <CardDescription>Track your income streams over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockIncomeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                        <Bar dataKey="salary" stackId="a" fill="#10b981" name="Salary" />
                        <Bar dataKey="freelance" stackId="a" fill="#3b82f6" name="Freelance" />
                        <Bar dataKey="investments" stackId="a" fill="#8b5cf6" name="Investments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Income Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="card-mobile">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Average Monthly</p>
                    <p className="text-2xl font-bold">${(totalIncome / 6).toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="card-mobile">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                    <p className="text-2xl font-bold text-blue-600">+8.5%</p>
                  </CardContent>
                </Card>

                <Card className="card-mobile">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Projected Annual</p>
                    <p className="text-2xl font-bold">${(totalIncome * 2).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Budgets Tab */}
            <TabsContent value="budgets" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Budget Overview</CardTitle>
                      <CardDescription>Monitor your spending against budgets</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Target className="w-4 h-4 mr-2" />
                      Set Budget
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockBudgets.map((budget) => {
                      const status = getBudgetStatus(budget);
                      const percentage = (budget.spent / budget.budget) * 100;
                      
                      return (
                        <div key={budget.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{budget.category}</p>
                              <p className="text-sm text-muted-foreground">
                                ${budget.spent.toLocaleString()} of ${budget.budget.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={percentage >= 90 ? 'destructive' : percentage >= 75 ? 'secondary' : 'default'}>
                              {status.status}
                            </Badge>
                          </div>
                          
                          <Progress value={percentage} className="h-3" />
                          
                          <div className="flex justify-between text-sm">
                            <span className={status.color}>
                              {percentage.toFixed(0)}% used
                            </span>
                            <span className="text-muted-foreground">
                              ${budget.remaining.toLocaleString()} remaining
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Performance */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Budget Performance</CardTitle>
                  <CardDescription>How well you're sticking to your budgets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {mockBudgets.filter(b => b.status === 'on-track').length}
                      </p>
                      <p className="text-sm text-muted-foreground">On Track</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {mockBudgets.filter(b => b.status === 'warning').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Warning</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">0</p>
                      <p className="text-sm text-muted-foreground">Over Budget</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {((mockBudgets.filter(b => b.status === 'on-track').length / mockBudgets.length) * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;

