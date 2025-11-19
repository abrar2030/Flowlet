import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Users,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Mock data for analytics
const ANALYTICS_DATA = {
  overview: {
    totalExecutions: 15847,
    successRate: 96.8,
    avgExecutionTime: 2.3,
    activeWorkflows: 12,
    totalSavings: 125000,
    executionTrend: 12.5
  },
  topWorkflows: [
    { name: 'Payment Processing Pipeline', executions: 4521, successRate: 98.5, avgTime: 1.8 },
    { name: 'Fraud Alert System', executions: 3892, successRate: 96.2, avgTime: 0.9 },
    { name: 'KYC Verification Flow', executions: 2847, successRate: 94.1, avgTime: 4.2 },
    { name: 'Card Issuance Automation', executions: 1923, successRate: 99.1, avgTime: 3.1 },
    { name: 'Compliance Reporting', executions: 1456, successRate: 97.8, avgTime: 5.7 }
  ],
  executionHistory: [
    { date: '2024-01-15', executions: 1247, success: 1205, failed: 42 },
    { date: '2024-01-16', executions: 1389, success: 1342, failed: 47 },
    { date: '2024-01-17', executions: 1156, success: 1121, failed: 35 },
    { date: '2024-01-18', executions: 1523, success: 1478, failed: 45 },
    { date: '2024-01-19', executions: 1678, success: 1623, failed: 55 },
    { date: '2024-01-20', executions: 1445, success: 1398, failed: 47 },
    { date: '2024-01-21', executions: 1289, success: 1251, failed: 38 }
  ],
  errorAnalysis: [
    { type: 'Network Timeout', count: 89, percentage: 32.1 },
    { type: 'Validation Error', count: 67, percentage: 24.2 },
    { type: 'API Rate Limit', count: 45, percentage: 16.2 },
    { type: 'Authentication Failed', count: 38, percentage: 13.7 },
    { type: 'Data Format Error', count: 28, percentage: 10.1 },
    { type: 'Other', count: 10, percentage: 3.6 }
  ]
};

const WorkflowAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('executions');

  const { overview, topWorkflows, executionHistory, errorAnalysis } = ANALYTICS_DATA;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Workflow Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor performance and optimize your automation workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                  <p className="text-2xl font-bold">{overview.totalExecutions.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+{overview.executionTrend}%</span>
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{overview.successRate}%</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={overview.successRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Execution Time</p>
                  <p className="text-2xl font-bold">{overview.avgExecutionTime}s</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">-8.2%</span>
                <span className="text-muted-foreground ml-1">faster</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                  <p className="text-2xl font-bold">${overview.totalSavings.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">This month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topWorkflows.map((workflow, index) => (
                    <div key={workflow.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{workflow.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {workflow.executions.toLocaleString()} executions • {workflow.avgTime}s avg
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={workflow.successRate > 95 ? 'default' : 'secondary'}>
                          {workflow.successRate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Execution History Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executionHistory.map((day, index) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground w-16">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{day.executions}</span>
                          <span className="text-xs text-muted-foreground">executions</span>
                        </div>
                        <div className="flex gap-1">
                          <div
                            className="h-2 bg-green-500 rounded-sm"
                            style={{ width: `${(day.success / day.executions) * 100}%` }}
                          />
                          <div
                            className="h-2 bg-red-500 rounded-sm"
                            style={{ width: `${(day.failed / day.executions) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((day.success / day.executions) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorAnalysis.map((error, index) => (
                  <div key={error.type} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{error.type}</span>
                        <span className="text-sm text-muted-foreground">
                          {error.count} ({error.percentage}%)
                        </span>
                      </div>
                      <Progress value={error.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Usage Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Usage pattern analysis coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Category breakdown coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Cost analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowAnalytics;
