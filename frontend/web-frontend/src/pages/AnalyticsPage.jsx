import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Mock analytics data
  const kpiData = {
    totalRevenue: { value: 125430, change: 12.5, trend: 'up' },
    totalTransactions: { value: 2847, change: -3.2, trend: 'down' },
    activeUsers: { value: 1234, change: 8.7, trend: 'up' },
    averageTransaction: { value: 44.05, change: 5.1, trend: 'up' }
  };

  const revenueData = [
    { name: 'Jan', revenue: 12000, transactions: 450 },
    { name: 'Feb', revenue: 15000, transactions: 520 },
    { name: 'Mar', revenue: 18000, transactions: 680 },
    { name: 'Apr', revenue: 22000, transactions: 750 },
    { name: 'May', revenue: 19000, transactions: 620 },
    { name: 'Jun', revenue: 25000, transactions: 890 }
  ];

  const transactionVolumeData = [
    { name: 'Week 1', volume: 45000 },
    { name: 'Week 2', volume: 52000 },
    { name: 'Week 3', volume: 48000 },
    { name: 'Week 4', volume: 61000 },
    { name: 'Week 5', volume: 55000 }
  ];

  const paymentMethodData = [
    { name: 'Wallet', value: 45, color: '#8884d8' },
    { name: 'Credit Card', value: 30, color: '#82ca9d' },
    { name: 'Bank Transfer', value: 20, color: '#ffc658' },
    { name: 'Other', value: 5, color: '#ff7300' }
  ];

  const userGrowthData = [
    { name: 'Jan', users: 1000, newUsers: 150 },
    { name: 'Feb', users: 1150, newUsers: 200 },
    { name: 'Mar', users: 1350, newUsers: 180 },
    { name: 'Apr', users: 1530, newUsers: 220 },
    { name: 'May', users: 1750, newUsers: 190 },
    { name: 'Jun', users: 1940, newUsers: 250 }
  ];

  const topTransactions = [
    { id: 'tx_001', amount: 2500, type: 'payment', merchant: 'Amazon', timestamp: '2024-06-10T14:30:00Z' },
    { id: 'tx_002', amount: 1800, type: 'transfer', merchant: 'Bank Transfer', timestamp: '2024-06-10T12:15:00Z' },
    { id: 'tx_003', amount: 1200, type: 'payment', merchant: 'Apple Store', timestamp: '2024-06-10T10:45:00Z' },
    { id: 'tx_004', amount: 950, type: 'payment', merchant: 'Netflix', timestamp: '2024-06-09T18:20:00Z' },
    { id: 'tx_005', amount: 750, type: 'transfer', merchant: 'Savings Account', timestamp: '2024-06-09T16:10:00Z' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and metrics for your financial operations
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpiData.totalRevenue.value)}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {getTrendIcon(kpiData.totalRevenue.trend)}
              <span className={getTrendColor(kpiData.totalRevenue.trend)}>
                {kpiData.totalRevenue.change}%
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(kpiData.totalTransactions.value)}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {getTrendIcon(kpiData.totalTransactions.trend)}
              <span className={getTrendColor(kpiData.totalTransactions.trend)}>
                {Math.abs(kpiData.totalTransactions.change)}%
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(kpiData.activeUsers.value)}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {getTrendIcon(kpiData.activeUsers.trend)}
              <span className={getTrendColor(kpiData.activeUsers.trend)}>
                {kpiData.activeUsers.change}%
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpiData.averageTransaction.value)}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {getTrendIcon(kpiData.averageTransaction.trend)}
              <span className={getTrendColor(kpiData.averageTransaction.trend)}>
                {kpiData.averageTransaction.change}%
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Transactions</CardTitle>
            <CardDescription>
              Monthly revenue and transaction count trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="right" dataKey="transactions" fill="#8884d8" opacity={0.3} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Distribution of payment methods used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>
              Weekly transaction volume trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={transactionVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              Total users and new user acquisition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" />
                <Bar dataKey="newUsers" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Transactions</CardTitle>
              <CardDescription>
                Highest value transactions in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.merchant}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>
                Key metrics at a glance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <span className="font-bold text-green-600">98.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Failed Transactions</span>
                <span className="font-bold text-red-600">1.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Processing Time</span>
                <span className="font-bold">2.3s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Peak Hour</span>
                <span className="font-bold">2:00 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Top Country</span>
                <span className="font-bold">United States</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
              <CardDescription>
                System performance notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">All systems operational</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">High transaction volume</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

