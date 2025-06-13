import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  PiggyBank, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  LineChart,
  Lightbulb,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';
import { FinancialValidators } from '../../utils/validation.js';
import { financialAPI } from '../../utils/api.js';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedBudgetingScreen = () => {
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [spendingData, setSpendingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    alertThreshold: 80
  });

  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'savings',
    priority: 'medium'
  });

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Load budgets, goals, and analytics data
      const [budgetsData, goalsData, analyticsData] = await Promise.all([
        financialAPI.getBudgets({ period: selectedPeriod }),
        financialAPI.getGoals(),
        financialAPI.getSpendingAnalytics({ period: selectedPeriod })
      ]);

      setBudgets(budgetsData || mockBudgets);
      setGoals(goalsData || mockGoals);
      setSpendingData(analyticsData?.spendingByCategory || mockSpendingData);
      
      // Generate insights based on data
      generateInsights(budgetsData, goalsData, analyticsData);
    } catch (error) {
      console.error('Failed to load financial data:', error);
      // Use mock data as fallback
      setBudgets(mockBudgets);
      setGoals(mockGoals);
      setSpendingData(mockSpendingData);
      generateInsights(mockBudgets, mockGoals, { spendingByCategory: mockSpendingData });
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = (budgetsData, goalsData, analyticsData) => {
    const newInsights = [];

    // Budget insights
    budgetsData?.forEach(budget => {
      const spentPercentage = (budget.spent / budget.amount) * 100;
      
      if (spentPercentage > 90) {
        newInsights.push({
          id: `budget-${budget.id}`,
          type: 'warning',
          title: 'Budget Alert',
          message: `You've spent ${spentPercentage.toFixed(1)}% of your ${budget.category} budget`,
          action: 'Review spending',
          priority: 'high'
        });
      } else if (spentPercentage < 50 && new Date().getDate() > 20) {
        newInsights.push({
          id: `budget-under-${budget.id}`,
          type: 'success',
          title: 'Great Budgeting',
          message: `You're under budget in ${budget.category}. Consider saving the extra!`,
          action: 'Move to savings',
          priority: 'low'
        });
      }
    });

    // Goal insights
    goalsData?.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 30 && progress < 80) {
        newInsights.push({
          id: `goal-${goal.id}`,
          type: 'warning',
          title: 'Goal at Risk',
          message: `${goal.title} needs ${((goal.targetAmount - goal.currentAmount) / daysLeft).toFixed(2)} per day to reach target`,
          action: 'Increase savings',
          priority: 'high'
        });
      }
    });

    // Spending pattern insights
    const totalSpending = analyticsData?.spendingByCategory?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const highestCategory = analyticsData?.spendingByCategory?.reduce((max, item) => 
      item.amount > (max?.amount || 0) ? item : max, null);

    if (highestCategory && (highestCategory.amount / totalSpending) > 0.4) {
      newInsights.push({
        id: 'spending-concentration',
        type: 'info',
        title: 'Spending Concentration',
        message: `${((highestCategory.amount / totalSpending) * 100).toFixed(1)}% of spending is on ${highestCategory.category}`,
        action: 'Diversify spending',
        priority: 'medium'
      });
    }

    setInsights(newInsights);
  };

  const handleCreateBudget = async () => {
    const validation = FinancialValidators.validateAmount(budgetForm.amount);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      const newBudget = {
        id: Date.now(),
        category: budgetForm.category,
        amount: parseFloat(budgetForm.amount),
        spent: 0,
        period: budgetForm.period,
        alertThreshold: budgetForm.alertThreshold,
        createdAt: new Date().toISOString()
      };

      setBudgets(prev => [...prev, newBudget]);
      setBudgetForm({ category: '', amount: '', period: 'monthly', alertThreshold: 80 });
      setShowCreateBudget(false);
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handleCreateGoal = async () => {
    const amountValidation = FinancialValidators.validateAmount(goalForm.targetAmount);
    if (!amountValidation.isValid) {
      alert(amountValidation.error);
      return;
    }

    try {
      const newGoal = {
        id: Date.now(),
        title: goalForm.title,
        targetAmount: parseFloat(goalForm.targetAmount),
        currentAmount: parseFloat(goalForm.currentAmount || 0),
        targetDate: goalForm.targetDate,
        category: goalForm.category,
        priority: goalForm.priority,
        createdAt: new Date().toISOString()
      };

      setGoals(prev => [...prev, newGoal]);
      setGoalForm({ title: '', targetAmount: '', currentAmount: '', targetDate: '', category: 'savings', priority: 'medium' });
      setShowCreateGoal(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage >= 100) return { status: 'exceeded', color: 'destructive' };
    if (percentage >= budget.alertThreshold) return { status: 'warning', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const getGoalProgress = (goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Planning</h1>
          <p className="text-muted-foreground">Advanced budgeting and goal management</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Financial Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map(insight => (
              <Alert key={insight.id} variant={insight.type === 'warning' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <div>
                    <strong>{insight.title}:</strong> {insight.message}
                  </div>
                  <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                    {insight.action}
                  </Badge>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="budgets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
        </TabsList>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Budget Management</h2>
            <Dialog open={showCreateBudget} onOpenChange={setShowCreateBudget}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                  <DialogDescription>Set up a new budget category to track your spending</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={budgetForm.category} onValueChange={(value) => setBudgetForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Budget Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={budgetForm.amount}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Period</label>
                    <Select value={budgetForm.period} onValueChange={(value) => setBudgetForm(prev => ({ ...prev, period: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Alert Threshold (%)</label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={budgetForm.alertThreshold}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) }))}
                    />
                  </div>
                  <Button onClick={handleCreateBudget} className="w-full">
                    Create Budget
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map(budget => {
              const { status, color } = getBudgetStatus(budget);
              const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
              
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg capitalize">{budget.category}</CardTitle>
                          <CardDescription>{budget.period}</CardDescription>
                        </div>
                        <Badge variant={color}>
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Spent: {formatCurrency(budget.spent)}</span>
                          <span>Budget: {formatCurrency(budget.amount)}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground text-center">
                          {percentage.toFixed(1)}% used
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Remaining: {formatCurrency(Math.max(0, budget.amount - budget.spent))}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Financial Goals</h2>
            <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
              <DialogTrigger asChild>
                <Button>
                  <Target className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Financial Goal</DialogTitle>
                  <DialogDescription>Set up a new savings or financial goal</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Goal Title</label>
                    <Input
                      placeholder="e.g., Emergency Fund"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={goalForm.targetAmount}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Current Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={goalForm.currentAmount}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, currentAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Date</label>
                    <Input
                      type="date"
                      value={goalForm.targetDate}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={goalForm.category} onValueChange={(value) => setGoalForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="debt">Debt Payoff</SelectItem>
                        <SelectItem value="purchase">Major Purchase</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={goalForm.priority} onValueChange={(value) => setGoalForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateGoal} className="w-full">
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {goals.map(goal => {
              const progress = getGoalProgress(goal);
              const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
              const dailyTarget = (goal.targetAmount - goal.currentAmount) / Math.max(daysLeft, 1);
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                          <CardDescription className="capitalize">{goal.category}</CardDescription>
                        </div>
                        <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}>
                          {goal.priority} priority
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {formatCurrency(goal.currentAmount)}</span>
                          <span>Target: {formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="text-xs text-muted-foreground text-center">
                          {progress.toFixed(1)}% complete
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Days left:</span>
                          <div className="font-medium">{daysLeft > 0 ? daysLeft : 'Overdue'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Daily target:</span>
                          <div className="font-medium">{formatCurrency(dailyTarget)}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount)}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-semibold">Financial Analytics</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={mockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="spending" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="income" stroke="#82ca9d" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <h2 className="text-2xl font-semibold">AI-Powered Recommendations</h2>
          
          <div className="grid gap-4">
            {mockRecommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {rec.type === 'savings' && <PiggyBank className="w-5 h-5 text-primary" />}
                      {rec.type === 'investment' && <TrendingUp className="w-5 h-5 text-primary" />}
                      {rec.type === 'budget' && <Target className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{rec.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary">{rec.impact}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-current" />
                          {rec.confidence}% confidence
                        </div>
                      </div>
                    </div>
                    <Button size="sm">Apply</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data
const mockBudgets = [
  { id: 1, category: 'food', amount: 800, spent: 650, period: 'monthly', alertThreshold: 80 },
  { id: 2, category: 'transportation', amount: 300, spent: 280, period: 'monthly', alertThreshold: 85 },
  { id: 3, category: 'entertainment', amount: 200, spent: 120, period: 'monthly', alertThreshold: 75 },
];

const mockGoals = [
  { id: 1, title: 'Emergency Fund', targetAmount: 10000, currentAmount: 6500, targetDate: '2025-12-31', category: 'savings', priority: 'high' },
  { id: 2, title: 'Vacation Fund', targetAmount: 3000, currentAmount: 1200, targetDate: '2025-08-15', category: 'vacation', priority: 'medium' },
];

const mockSpendingData = [
  { category: 'Food', amount: 650 },
  { category: 'Transportation', amount: 280 },
  { category: 'Entertainment', amount: 120 },
  { category: 'Shopping', amount: 200 },
  { category: 'Utilities', amount: 150 },
];

const mockTrendData = [
  { month: 'Jan', spending: 2400, income: 4000 },
  { month: 'Feb', spending: 2200, income: 4000 },
  { month: 'Mar', spending: 2600, income: 4200 },
  { month: 'Apr', spending: 2300, income: 4000 },
  { month: 'May', spending: 2500, income: 4100 },
  { month: 'Jun', spending: 2400, income: 4000 },
];

const mockRecommendations = [
  {
    type: 'savings',
    title: 'Optimize Your Emergency Fund',
    description: 'Based on your spending patterns, consider increasing your emergency fund target to 6 months of expenses.',
    impact: 'High Impact',
    confidence: 92
  },
  {
    type: 'budget',
    title: 'Reduce Food Spending',
    description: 'You\'re consistently over budget on food. Consider meal planning to reduce costs by 15-20%.',
    impact: 'Medium Impact',
    confidence: 87
  },
  {
    type: 'investment',
    title: 'Start Investing Surplus',
    description: 'You have consistent surplus each month. Consider investing $300/month in a diversified portfolio.',
    impact: 'High Impact',
    confidence: 78
  }
];

export default AdvancedBudgetingScreen;

