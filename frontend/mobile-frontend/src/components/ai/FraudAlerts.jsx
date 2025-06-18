import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Eye, 
  MapPin, 
  Clock, 
  CreditCard, 
  Smartphone, 
  Globe, 
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  Bell,
  BellOff,
  Filter,
  Search,
  MoreVertical,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import { useSecurityStore, useUIStore } from '../../store/index.js';
import { securityAPI } from '../../services/api.js';
import { useAuth, useApi } from '../../hooks/index.js';

const FraudAlerts = () => {
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const {
    fraudAlerts,
    securitySettings,
    setFraudAlerts,
    setSecuritySettings,
    updateAlert,
    dismissAlert,
  } = useSecurityStore();

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Mock fraud alerts data
  const mockFraudAlerts = [
    {
      id: 'alert_1',
      type: 'suspicious_transaction',
      severity: 'high',
      status: 'active',
      title: 'Unusual Transaction Detected',
      description: 'A transaction of $1,250 was attempted from an unrecognized location in Miami, FL.',
      amount: 1250,
      location: 'Miami, FL',
      merchant: 'Unknown Merchant',
      timestamp: '2025-06-11T14:30:00Z',
      card_last_four: '9012',
      risk_score: 85,
      actions: ['block_transaction', 'verify_identity', 'contact_support'],
      details: {
        ip_address: '192.168.1.100',
        device: 'Unknown Device',
        transaction_id: 'tx_suspicious_001'
      }
    },
    {
      id: 'alert_2',
      type: 'login_anomaly',
      severity: 'medium',
      status: 'investigating',
      title: 'Unusual Login Activity',
      description: 'Multiple login attempts detected from a new device in London, UK.',
      location: 'London, UK',
      timestamp: '2025-06-11T09:15:00Z',
      risk_score: 65,
      actions: ['secure_account', 'change_password', 'enable_2fa'],
      details: {
        ip_address: '203.0.113.42',
        device: 'Chrome on Windows',
        attempts: 5
      }
    },
    {
      id: 'alert_3',
      type: 'card_skimming',
      severity: 'high',
      status: 'resolved',
      title: 'Potential Card Skimming',
      description: 'Your card was used at a location flagged for skimming devices.',
      location: 'ATM - 5th Avenue',
      merchant: 'Chase ATM',
      timestamp: '2025-06-10T18:45:00Z',
      card_last_four: '2222',
      risk_score: 75,
      actions: ['freeze_card', 'request_replacement', 'monitor_account'],
      resolution: 'Card frozen and replacement issued'
    },
    {
      id: 'alert_4',
      type: 'spending_pattern',
      severity: 'low',
      status: 'active',
      title: 'Unusual Spending Pattern',
      description: 'Your spending has increased by 300% compared to your usual pattern.',
      amount: 2400,
      timestamp: '2025-06-10T12:00:00Z',
      risk_score: 35,
      actions: ['review_transactions', 'set_spending_limit', 'ignore_alert'],
      details: {
        usual_amount: 800,
        current_amount: 2400,
        category: 'Shopping'
      }
    }
  ];

  const mockSecuritySettings = {
    fraud_monitoring: true,
    real_time_alerts: true,
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    transaction_limits: true,
    location_tracking: true,
    device_verification: true,
    risk_threshold: 'medium'
  };

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    try {
      // For demo purposes, use mock data
      setFraudAlerts(mockFraudAlerts);
      setSecuritySettings(mockSecuritySettings);

      // In real implementation:
      // const alertsData = await request(() => securityAPI.getFraudAlerts(user.id));
      // const settingsData = await request(() => securityAPI.getSecuritySettings(user.id));
      // setFraudAlerts(alertsData);
      // setSecuritySettings(settingsData);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Load Alerts',
        message: error.message || 'Could not load fraud alerts.',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFraudData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAlertAction = async (alertId, action) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (action === 'dismiss') {
        dismissAlert(alertId);
      } else {
        updateAlert(alertId, { status: 'investigating' });
      }
      
      addNotification({
        type: 'success',
        title: 'Action Completed',
        message: `Alert ${action} completed successfully.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: error.message || 'Failed to process alert action.',
      });
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      setSecuritySettings({ ...securitySettings, [setting]: value });
      
      addNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Security settings have been updated.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update settings.',
      });
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-950';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950';
      case 'low':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-950';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-red-600';
      case 'investigating':
        return 'text-yellow-600';
      case 'resolved':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'suspicious_transaction':
        return <CreditCard className="w-5 h-5" />;
      case 'login_anomaly':
        return <Smartphone className="w-5 h-5" />;
      case 'card_skimming':
        return <Shield className="w-5 h-5" />;
      case 'spending_pattern':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAlerts = fraudAlerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeAlerts = fraudAlerts.filter(alert => alert.status === 'active').length;
  const highRiskAlerts = fraudAlerts.filter(alert => alert.severity === 'high').length;

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
            <h1 className="text-3xl font-bold text-foreground">Fraud Alerts</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage security threats</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Security Overview */}
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
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{activeAlerts}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Risk</p>
                    <p className="text-2xl font-bold text-orange-600">{highRiskAlerts}</p>
                  </div>
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monitoring</p>
                    <p className="text-2xl font-bold text-green-600">
                      {securitySettings?.fraud_monitoring ? 'ON' : 'OFF'}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Protection</p>
                    <p className="text-2xl font-bold text-blue-600">Active</p>
                  </div>
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="alerts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="alerts">Fraud Alerts</TabsTrigger>
              <TabsTrigger value="settings">Security Settings</TabsTrigger>
            </TabsList>
            
            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-6">
              {/* Filters */}
              <Card className="card-mobile">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search alerts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full md:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Alerts</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Alerts List */}
              <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                  <Card className="card-mobile">
                    <CardContent className="text-center py-12">
                      <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
                      <p className="text-muted-foreground">
                        No fraud alerts found. Your account is secure.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="card-mobile">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                                {getAlertIcon(alert.type)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold">{alert.title}</h3>
                                  <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'secondary' : 'default'}>
                                    {alert.severity.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className={getStatusColor(alert.status)}>
                                    {alert.status.toUpperCase()}
                                  </Badge>
                                </div>
                                
                                <p className="text-muted-foreground mb-3">{alert.description}</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Time</p>
                                    <p className="font-medium">{formatTimestamp(alert.timestamp)}</p>
                                  </div>
                                  
                                  {alert.location && (
                                    <div>
                                      <p className="text-muted-foreground">Location</p>
                                      <p className="font-medium">{alert.location}</p>
                                    </div>
                                  )}
                                  
                                  {alert.amount && (
                                    <div>
                                      <p className="text-muted-foreground">Amount</p>
                                      <p className="font-medium">${alert.amount.toLocaleString()}</p>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <p className="text-muted-foreground">Risk Score</p>
                                    <p className={`font-medium ${alert.risk_score >= 70 ? 'text-red-600' : alert.risk_score >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {alert.risk_score}/100
                                    </p>
                                  </div>
                                </div>
                                
                                {alert.resolution && (
                                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <p className="text-sm text-green-800 dark:text-green-200">
                                        <strong>Resolved:</strong> {alert.resolution}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAlertAction(alert.id, 'dismiss')}>
                                  <X className="w-4 h-4 mr-2" />
                                  Dismiss Alert
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Contact Support
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Action Buttons */}
                          {alert.status === 'active' && alert.actions && (
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                              {alert.actions.slice(0, 3).map((action, index) => (
                                <Button
                                  key={index}
                                  variant={index === 0 ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleAlertAction(alert.id, action)}
                                  disabled={isLoading}
                                >
                                  {action.replace('_', ' ').toUpperCase()}
                                </Button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Fraud Monitoring */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Fraud Monitoring</CardTitle>
                  <CardDescription>Configure how we monitor and detect suspicious activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Real-time Fraud Detection</p>
                      <p className="text-sm text-muted-foreground">Monitor transactions as they happen</p>
                    </div>
                    <Switch
                      checked={securitySettings?.fraud_monitoring}
                      onCheckedChange={(checked) => handleSettingChange('fraud_monitoring', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Location Tracking</p>
                      <p className="text-sm text-muted-foreground">Track transaction locations for anomaly detection</p>
                    </div>
                    <Switch
                      checked={securitySettings?.location_tracking}
                      onCheckedChange={(checked) => handleSettingChange('location_tracking', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Device Verification</p>
                      <p className="text-sm text-muted-foreground">Verify new devices before allowing transactions</p>
                    </div>
                    <Switch
                      checked={securitySettings?.device_verification}
                      onCheckedChange={(checked) => handleSettingChange('device_verification', checked)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Risk Threshold</label>
                    <Select
                      value={securitySettings?.risk_threshold}
                      onValueChange={(value) => handleSettingChange('risk_threshold', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - More alerts, higher security</SelectItem>
                        <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                        <SelectItem value="high">High - Fewer alerts, more convenience</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Alert Notifications</CardTitle>
                  <CardDescription>Choose how you want to be notified about security alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Instant alerts on your device</p>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings?.push_notifications}
                      onCheckedChange={(checked) => handleSettingChange('push_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">Text message alerts</p>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings?.sms_notifications}
                      onCheckedChange={(checked) => handleSettingChange('sms_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Detailed email reports</p>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings?.email_notifications}
                      onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Status */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Security Status</CardTitle>
                  <CardDescription>Overview of your account security</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Fraud monitoring is active
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          All cards are secure
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          Advanced protection enabled
                        </span>
                      </div>
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

export default FraudAlerts;

