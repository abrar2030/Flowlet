import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Settings, 
  Lock, 
  Unlock, 
  DollarSign, 
  Calendar, 
  Shield, 
  Eye, 
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  MapPin,
  Smartphone,
  Globe,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { useCardStore, useUIStore } from '../../store/index.js';
import { cardAPI } from '../../services/api.js';
import { useAuth, useApi, useClipboard } from '../../hooks/index.js';
import { useParams, useNavigate } from 'react-router-dom';

const CardDetails = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const { cards, updateCard } = useCardStore();
  const { copy, copied } = useClipboard();
  
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [editingLimits, setEditingLimits] = useState(false);
  const [tempLimits, setTempLimits] = useState({});

  const card = cards.find(c => c.id === cardId);

  // Mock transaction data for this card
  const [recentTransactions] = useState([
    {
      id: 'tx_1',
      amount: -45.99,
      merchant: 'Amazon',
      category: 'Shopping',
      date: '2025-06-10T14:30:00Z',
      status: 'completed',
      location: 'Online'
    },
    {
      id: 'tx_2',
      amount: -12.50,
      merchant: 'Starbucks',
      category: 'Food & Drink',
      date: '2025-06-10T09:15:00Z',
      status: 'completed',
      location: 'New York, NY'
    },
    {
      id: 'tx_3',
      amount: -89.00,
      merchant: 'Shell Gas Station',
      category: 'Gas',
      date: '2025-06-09T18:45:00Z',
      status: 'completed',
      location: 'Brooklyn, NY'
    }
  ]);

  useEffect(() => {
    if (card) {
      setTempLimits({
        daily: card.spending_limit_daily,
        monthly: card.spending_limit_monthly
      });
    }
  }, [card]);

  if (!card) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Card Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested card could not be found.</p>
          <Button onClick={() => navigate('/cards')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cards
          </Button>
        </div>
      </div>
    );
  }

  const handleCardToggle = async () => {
    try {
      const newStatus = card.status === 'active' ? 'frozen' : 'active';
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateCard(card.id, { status: newStatus });
      
      addNotification({
        type: 'success',
        title: `Card ${newStatus === 'frozen' ? 'Frozen' : 'Activated'}`,
        message: `Your card has been ${newStatus === 'frozen' ? 'frozen' : 'activated'} successfully.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: error.message || 'Failed to update card status.',
      });
    }
  };

  const handleLimitsSave = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateCard(card.id, {
        spending_limit_daily: tempLimits.daily,
        spending_limit_monthly: tempLimits.monthly
      });
      
      setEditingLimits(false);
      
      addNotification({
        type: 'success',
        title: 'Limits Updated',
        message: 'Spending limits have been updated successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update spending limits.',
      });
    }
  };

  const handleCopyCardNumber = async () => {
    const success = await copy(card.card_number.replace(/\s/g, ''));
    if (success) {
      addNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Card number copied to clipboard.',
      });
    }
  };

  const maskCardNumber = (cardNumber) => {
    if (!showSensitiveInfo) {
      return cardNumber.replace(/\d(?=\d{4})/g, '*');
    }
    return cardNumber;
  };

  const getSpendingPercentage = (spent, limit) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 safe-top safe-bottom">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cards')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Card Details</h1>
              <p className="text-muted-foreground mt-1">Manage your card settings and view activity</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
          >
            {showSensitiveInfo ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showSensitiveInfo ? 'Hide' : 'Show'} Details
          </Button>
        </motion.div>

        {/* Card Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-mobile overflow-hidden">
            <div className={`${card.color} p-8 text-white relative`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-2">
                  {card.type === 'physical' ? 
                    <CreditCard className="w-6 h-6" /> : 
                    <Smartphone className="w-6 h-6" />
                  }
                  <Badge 
                    variant={card.status === 'active' ? 'default' : 'secondary'}
                    className={`${card.status === 'active' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'}`}
                  >
                    {card.type} • {card.status}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <p className="text-white/80 text-sm">Brand</p>
                  <p className="text-xl font-bold">{card.brand}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-white/80 text-sm mb-2">Card Number</p>
                  <div className="flex items-center space-x-3">
                    <p className="text-2xl font-mono font-semibold tracking-wider">
                      {maskCardNumber(card.card_number)}
                    </p>
                    {showSensitiveInfo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCardNumber}
                        className="text-white/80 hover:text-white hover:bg-white/10"
                      >
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-white/80 text-xs mb-1">Cardholder</p>
                    <p className="font-medium">{card.cardholder_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-white/80 text-xs mb-1">Expires</p>
                    <p className="font-medium">
                      {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-white/80 text-xs mb-1">CVV</p>
                    <p className="font-medium">
                      {showSensitiveInfo ? card.cvv : '***'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={card.status === 'active' ? 'destructive' : 'default'}
                      onClick={handleCardToggle}
                      disabled={isLoading}
                      className="btn-mobile h-auto py-4 flex-col"
                    >
                      {card.status === 'active' ? (
                        <>
                          <Lock className="w-6 h-6 mb-2" />
                          <span>Freeze Card</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-6 h-6 mb-2" />
                          <span>Unfreeze Card</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="btn-mobile h-auto py-4 flex-col"
                    >
                      <Settings className="w-6 h-6 mb-2" />
                      <span>Card Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Spending Overview */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Spending Overview</CardTitle>
                  <CardDescription>Track your spending against limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Daily Spending</span>
                      <span className="text-sm text-muted-foreground">
                        ${card.current_daily_spent.toLocaleString()} / ${card.spending_limit_daily.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary rounded-full h-3 transition-all duration-300"
                        style={{ 
                          width: `${getSpendingPercentage(card.current_daily_spent, card.spending_limit_daily)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(100 - getSpendingPercentage(card.current_daily_spent, card.spending_limit_daily)).toFixed(1)}% remaining today
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Monthly Spending</span>
                      <span className="text-sm text-muted-foreground">
                        ${card.current_monthly_spent.toLocaleString()} / ${card.spending_limit_monthly.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-secondary rounded-full h-3 transition-all duration-300"
                        style={{ 
                          width: `${getSpendingPercentage(card.current_monthly_spent, card.spending_limit_monthly)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(100 - getSpendingPercentage(card.current_monthly_spent, card.spending_limit_monthly)).toFixed(1)}% remaining this month
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card Stats */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Card Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-semibold">{formatDate(card.created_at)}</p>
                    </div>
                    
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Last Used</p>
                      <p className="font-semibold">{formatDate(card.last_used)}</p>
                    </div>
                    
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="font-semibold">{recentTransactions.length}</p>
                    </div>
                    
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Security</p>
                      <p className="font-semibold">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Controls Tab */}
            <TabsContent value="controls" className="space-y-6">
              {/* Spending Limits */}
              <Card className="card-mobile">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Spending Limits</CardTitle>
                      <CardDescription>Set daily and monthly spending limits</CardDescription>
                    </div>
                    <Button
                      variant={editingLimits ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (editingLimits) {
                          handleLimitsSave();
                        } else {
                          setEditingLimits(true);
                        }
                      }}
                      disabled={isLoading}
                    >
                      {editingLimits ? (
                        isLoading ? 'Saving...' : 'Save Changes'
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Limits
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Daily Limit: ${editingLimits ? tempLimits.daily : card.spending_limit_daily}</Label>
                    {editingLimits ? (
                      <div className="mt-2 space-y-2">
                        <Slider
                          value={[tempLimits.daily]}
                          onValueChange={(value) => setTempLimits(prev => ({ ...prev, daily: value[0] }))}
                          max={5000}
                          min={100}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>$100</span>
                          <span>$5,000</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2"
                            style={{ 
                              width: `${getSpendingPercentage(card.current_daily_spent, card.spending_limit_daily)}%` 
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${card.current_daily_spent} spent today
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Monthly Limit: ${editingLimits ? tempLimits.monthly : card.spending_limit_monthly}</Label>
                    {editingLimits ? (
                      <div className="mt-2 space-y-2">
                        <Slider
                          value={[tempLimits.monthly]}
                          onValueChange={(value) => setTempLimits(prev => ({ ...prev, monthly: value[0] }))}
                          max={20000}
                          min={500}
                          step={100}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>$500</span>
                          <span>$20,000</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-secondary rounded-full h-2"
                            style={{ 
                              width: `${getSpendingPercentage(card.current_monthly_spent, card.spending_limit_monthly)}%` 
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${card.current_monthly_spent} spent this month
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {editingLimits && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingLimits(false);
                          setTempLimits({
                            daily: card.spending_limit_daily,
                            monthly: card.spending_limit_monthly
                          });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction Controls */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Transaction Controls</CardTitle>
                  <CardDescription>Control where and how your card can be used</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Online Transactions</p>
                        <p className="text-sm text-muted-foreground">Allow online purchases</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">International Transactions</p>
                        <p className="text-sm text-muted-foreground">Allow purchases abroad</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">ATM Withdrawals</p>
                        <p className="text-sm text-muted-foreground">Allow cash withdrawals</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest activity on this card</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.merchant}</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                              <Badge variant="outline" className="text-xs">
                                {transaction.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{transaction.location}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            ${Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <Badge 
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center mt-6">
                    <Button variant="outline">
                      View All Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Card Settings</CardTitle>
                  <CardDescription>Manage your card preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nickname">Card Nickname</Label>
                      <Input
                        id="nickname"
                        defaultValue={card.type === 'physical' ? 'Physical Card' : 'Virtual Card'}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Transaction Notifications</p>
                        <p className="text-sm text-muted-foreground">Get notified of all transactions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-muted-foreground">Alerts for suspicious activity</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-border">
                    <h4 className="font-medium text-destructive mb-4">Danger Zone</h4>
                    <div className="space-y-3">
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel Card
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        This action cannot be undone. Your card will be permanently deactivated.
                      </p>
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

export default CardDetails;

