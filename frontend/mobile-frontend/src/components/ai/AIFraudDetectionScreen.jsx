import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Brain,
  TrendingUp,
  MapPin,
  Clock,
  CreditCard,
  DollarSign,
  Activity,
  Filter,
  Search,
  Download,
  Bell,
  Settings,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { financialAPI } from '../../utils/api.js';

const AIFraudDetectionScreen = () => {
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [transactionMonitoring, setTransactionMonitoring] = useState([]);
  const [riskAnalytics, setRiskAnalytics] = useState({});
  const [aiInsights, setAiInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Settings state
  const [fraudSettings, setFraudSettings] = useState({
    realTimeMonitoring: true,
    aiAnalysis: true,
    velocityChecks: true,
    geolocationAnalysis: true,
    behaviorAnalysis: true,
    riskThreshold: 'medium',
    alertChannels: {
      email: true,
      sms: true,
      push: true,
      inApp: true
    },
    autoBlock: false,
    whitelistEnabled: true
  });

  useEffect(() => {
    loadFraudData();
  }, [selectedTimeframe]);

  const loadFraudData = async () => {
    setIsLoading(true);
    try {
      const [alerts, monitoring, analytics, insights] = await Promise.all([
        financialAPI.getFraudAlerts({ timeframe: selectedTimeframe }),
        financialAPI.getTransactionMonitoring({ timeframe: selectedTimeframe }),
        financialAPI.getRiskAnalytics({ timeframe: selectedTimeframe }),
        financialAPI.getAIInsights({ timeframe: selectedTimeframe })
      ]);

      setFraudAlerts(alerts || mockFraudAlerts);
      setTransactionMonitoring(monitoring || mockTransactionMonitoring);
      setRiskAnalytics(analytics || mockRiskAnalytics);
      setAiInsights(insights || mockAiInsights);
    } catch (error) {
      console.error('Failed to load fraud data:', error);
      // Use mock data as fallback
      setFraudAlerts(mockFraudAlerts);
      setTransactionMonitoring(mockTransactionMonitoring);
      setRiskAnalytics(mockRiskAnalytics);
      setAiInsights(mockAiInsights);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlertAction = async (alertId, action) => {
    try {
      await financialAPI.handleFraudAlert(alertId, action);
      setFraudAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: action === 'approve' ? 'resolved' : 'blocked' }
          : alert
      ));
    } catch (error) {
      console.error('Failed to handle alert:', error);
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      const updatedSettings = { ...fraudSettings, [setting]: value };
      await financialAPI.updateFraudSettings({ [setting]: value });
      setFraudSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update fraud setting:', error);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'blocked': return 'destructive';
      case 'resolved': return 'success';
      case 'pending': return 'warning';
      case 'investigating': return 'secondary';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredAlerts = fraudAlerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
          <h1 className="text-3xl font-bold text-foreground">AI Fraud Detection</h1>
          <p className="text-muted-foreground">Advanced fraud monitoring and prevention</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold">{riskAnalytics.overallRiskScore}/100</p>
              </div>
              <div className={`p-3 rounded-full ${getRiskColor(riskAnalytics.riskLevel)}`}>
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={riskAnalytics.overallRiskScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{riskAnalytics.activeAlerts}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +{riskAnalytics.alertsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blocked Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(riskAnalytics.blockedAmount)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {riskAnalytics.blockedTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Detection Rate</p>
                <p className="text-2xl font-bold">{riskAnalytics.detectionRate}%</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {riskAnalytics.falsePositiveRate}% false positive
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="alerts">Fraud Alerts</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Risk Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Fraud Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Fraud Alerts</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getRiskColor(alert.riskLevel)}`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                            <Badge variant="outline" className={getRiskColor(alert.riskLevel)}>
                              {alert.riskLevel} risk
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <div className="font-medium">{formatCurrency(alert.amount)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Transaction ID:</span>
                              <div className="font-medium">{alert.transactionId}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <div className="font-medium">{alert.location}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time:</span>
                              <div className="font-medium">{formatDate(alert.timestamp)}</div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="text-sm text-muted-foreground mb-1">AI Confidence:</div>
                            <div className="flex items-center gap-2">
                              <Progress value={alert.confidence} className="h-2 flex-1" />
                              <span className="text-sm font-medium">{alert.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {alert.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAlertAction(alert.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAlertAction(alert.id, 'block')}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Block
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Live Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <h2 className="text-2xl font-semibold">Real-Time Transaction Monitoring</h2>
          
          <div className="grid gap-4">
            {transactionMonitoring.map(transaction => (
              <Card key={transaction.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getRiskColor(transaction.riskLevel)}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                        <div className="text-sm text-muted-foreground">{transaction.merchant}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {transaction.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{formatDate(transaction.timestamp)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Risk: {transaction.riskScore}/100
                        </div>
                      </div>
                    </div>
                  </div>
                  {transaction.flags.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-muted-foreground mb-2">Risk Factors:</div>
                      <div className="flex flex-wrap gap-2">
                        {transaction.flags.map((flag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Risk Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-semibold">Risk Analytics Dashboard</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Risk Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockRiskTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="riskScore" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="alertCount" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fraud Types */}
            <Card>
              <CardHeader>
                <CardTitle>Fraud Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockFraudTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <h2 className="text-2xl font-semibold">AI-Powered Insights</h2>
          
          <div className="grid gap-4">
            {aiInsights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{insight.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{insight.description}</p>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{insight.category}</Badge>
                        <div className="text-xs text-muted-foreground">
                          Confidence: {insight.confidence}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Impact: {insight.impact}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-semibold">Fraud Detection Settings</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Detection Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Detection Methods</CardTitle>
                <CardDescription>Configure fraud detection algorithms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Real-time Monitoring</div>
                    <div className="text-sm text-muted-foreground">Monitor transactions in real-time</div>
                  </div>
                  <Switch
                    checked={fraudSettings.realTimeMonitoring}
                    onCheckedChange={(checked) => handleSettingChange('realTimeMonitoring', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">AI Analysis</div>
                    <div className="text-sm text-muted-foreground">Use machine learning for detection</div>
                  </div>
                  <Switch
                    checked={fraudSettings.aiAnalysis}
                    onCheckedChange={(checked) => handleSettingChange('aiAnalysis', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Velocity Checks</div>
                    <div className="text-sm text-muted-foreground">Monitor transaction frequency</div>
                  </div>
                  <Switch
                    checked={fraudSettings.velocityChecks}
                    onCheckedChange={(checked) => handleSettingChange('velocityChecks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Geolocation Analysis</div>
                    <div className="text-sm text-muted-foreground">Analyze transaction locations</div>
                  </div>
                  <Switch
                    checked={fraudSettings.geolocationAnalysis}
                    onCheckedChange={(checked) => handleSettingChange('geolocationAnalysis', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Behavior Analysis</div>
                    <div className="text-sm text-muted-foreground">Monitor user behavior patterns</div>
                  </div>
                  <Switch
                    checked={fraudSettings.behaviorAnalysis}
                    onCheckedChange={(checked) => handleSettingChange('behaviorAnalysis', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alert Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Configuration</CardTitle>
                <CardDescription>Configure how you receive fraud alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Risk Threshold</label>
                  <Select
                    value={fraudSettings.riskThreshold}
                    onValueChange={(value) => handleSettingChange('riskThreshold', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Alert on all suspicious activity)</SelectItem>
                      <SelectItem value="medium">Medium (Alert on moderate risk)</SelectItem>
                      <SelectItem value="high">High (Alert only on high risk)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Alert Channels</div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Notifications</span>
                    <Switch
                      checked={fraudSettings.alertChannels.email}
                      onCheckedChange={(checked) => 
                        handleSettingChange('alertChannels', { ...fraudSettings.alertChannels, email: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS Alerts</span>
                    <Switch
                      checked={fraudSettings.alertChannels.sms}
                      onCheckedChange={(checked) => 
                        handleSettingChange('alertChannels', { ...fraudSettings.alertChannels, sms: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push Notifications</span>
                    <Switch
                      checked={fraudSettings.alertChannels.push}
                      onCheckedChange={(checked) => 
                        handleSettingChange('alertChannels', { ...fraudSettings.alertChannels, push: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">In-App Notifications</span>
                    <Switch
                      checked={fraudSettings.alertChannels.inApp}
                      onCheckedChange={(checked) => 
                        handleSettingChange('alertChannels', { ...fraudSettings.alertChannels, inApp: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-block Suspicious Transactions</div>
                    <div className="text-sm text-muted-foreground">Automatically block high-risk transactions</div>
                  </div>
                  <Switch
                    checked={fraudSettings.autoBlock}
                    onCheckedChange={(checked) => handleSettingChange('autoBlock', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data
const mockFraudAlerts = [
  {
    id: 1,
    title: 'Unusual Transaction Pattern',
    description: 'Multiple high-value transactions detected in short timeframe',
    riskLevel: 'high',
    status: 'pending',
    amount: 5000,
    transactionId: 'TXN-001',
    location: 'New York, NY',
    timestamp: '2025-06-13T19:30:00Z',
    confidence: 92
  },
  {
    id: 2,
    title: 'Geolocation Anomaly',
    description: 'Transaction from unusual location detected',
    riskLevel: 'medium',
    status: 'investigating',
    amount: 1200,
    transactionId: 'TXN-002',
    location: 'Los Angeles, CA',
    timestamp: '2025-06-13T18:15:00Z',
    confidence: 78
  }
];

const mockTransactionMonitoring = [
  {
    id: 1,
    amount: 2500,
    merchant: 'Online Store XYZ',
    location: 'New York, NY',
    timestamp: '2025-06-13T20:00:00Z',
    status: 'approved',
    riskLevel: 'low',
    riskScore: 25,
    flags: []
  },
  {
    id: 2,
    amount: 8000,
    merchant: 'Electronics Store',
    location: 'Miami, FL',
    timestamp: '2025-06-13T19:45:00Z',
    status: 'pending',
    riskLevel: 'high',
    riskScore: 85,
    flags: ['High Amount', 'Unusual Location', 'Velocity Check']
  }
];

const mockRiskAnalytics = {
  overallRiskScore: 35,
  riskLevel: 'low',
  activeAlerts: 12,
  alertsToday: 3,
  blockedAmount: 25000,
  blockedTransactions: 8,
  detectionRate: 94.5,
  falsePositiveRate: 2.1
};

const mockAiInsights = [
  {
    title: 'Velocity Pattern Detected',
    description: 'User showing increased transaction frequency. Consider adjusting velocity thresholds.',
    category: 'Behavior Analysis',
    confidence: 87,
    impact: 'Medium'
  },
  {
    title: 'New Merchant Category',
    description: 'User making first transaction in luxury goods category. Monitor for unusual patterns.',
    category: 'Spending Pattern',
    confidence: 72,
    impact: 'Low'
  }
];

const mockRiskTrends = [
  { date: '06/07', riskScore: 45, alertCount: 8 },
  { date: '06/08', riskScore: 52, alertCount: 12 },
  { date: '06/09', riskScore: 38, alertCount: 6 },
  { date: '06/10', riskScore: 41, alertCount: 9 },
  { date: '06/11', riskScore: 35, alertCount: 5 },
  { date: '06/12', riskScore: 48, alertCount: 11 },
  { date: '06/13', riskScore: 35, alertCount: 7 }
];

const mockFraudTypes = [
  { type: 'Card Fraud', count: 15 },
  { type: 'Identity Theft', count: 8 },
  { type: 'Account Takeover', count: 5 },
  { type: 'Phishing', count: 12 },
  { type: 'Synthetic ID', count: 3 }
];

export default AIFraudDetectionScreen;

