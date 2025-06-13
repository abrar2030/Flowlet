import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Eye, 
  EyeOff, 
  Freeze, 
  Play, 
  Settings, 
  MoreVertical,
  Smartphone,
  Shield,
  TrendingUp,
  Calendar,
  DollarSign,
  Lock,
  Unlock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import { useCardStore, useUIStore } from '../../store/index.js';
import { cardAPI } from '../../services/api.js';
import { useAuth, useApi } from '../../hooks/index.js';
import { useNavigate } from 'react-router-dom';

const CardsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const {
    cards,
    activeCard,
    setCards,
    setActiveCard,
    updateCard,
    addCard,
  } = useCardStore();

  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockCards = [
    {
      id: 'card_1',
      type: 'virtual',
      status: 'active',
      card_number: '4532 1234 5678 9012',
      expiry_month: 12,
      expiry_year: 2027,
      cvv: '123',
      cardholder_name: 'John Doe',
      spending_limit_daily: 1000,
      spending_limit_monthly: 5000,
      current_daily_spent: 245.50,
      current_monthly_spent: 1850.75,
      created_at: '2025-01-15T00:00:00Z',
      last_used: '2025-06-10T14:30:00Z',
      brand: 'Visa',
      color: 'gradient-primary'
    },
    {
      id: 'card_2',
      type: 'physical',
      status: 'active',
      card_number: '5555 4444 3333 2222',
      expiry_month: 8,
      expiry_year: 2026,
      cvv: '456',
      cardholder_name: 'John Doe',
      spending_limit_daily: 2000,
      spending_limit_monthly: 10000,
      current_daily_spent: 0,
      current_monthly_spent: 3200.25,
      created_at: '2025-02-01T00:00:00Z',
      last_used: '2025-06-09T16:45:00Z',
      brand: 'Mastercard',
      color: 'gradient-secondary'
    },
    {
      id: 'card_3',
      type: 'virtual',
      status: 'frozen',
      card_number: '4111 1111 1111 1111',
      expiry_month: 6,
      expiry_year: 2028,
      cvv: '789',
      cardholder_name: 'John Doe',
      spending_limit_daily: 500,
      spending_limit_monthly: 2000,
      current_daily_spent: 0,
      current_monthly_spent: 125.00,
      created_at: '2025-03-10T00:00:00Z',
      last_used: '2025-06-05T10:20:00Z',
      brand: 'Visa',
      color: 'bg-gray-600'
    }
  ];

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      // For demo purposes, use mock data
      setCards(mockCards);
      if (mockCards.length > 0) {
        setActiveCard(mockCards[0]);
      }

      // In real implementation:
      // const cardsData = await request(() => cardAPI.getUserCards(user.id));
      // setCards(cardsData);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Load Cards',
        message: error.message || 'Could not load card data.',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCardToggle = async (cardId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateCard(cardId, { status: newStatus });
      
      addNotification({
        type: 'success',
        title: `Card ${newStatus === 'frozen' ? 'Frozen' : 'Activated'}`,
        message: `Your card has been ${newStatus === 'frozen' ? 'frozen' : 'activated'} successfully.`,
      });

      // In real implementation:
      // if (newStatus === 'frozen') {
      //   await request(() => cardAPI.freeze(cardId));
      // } else {
      //   await request(() => cardAPI.unfreeze(cardId));
      // }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: error.message || 'Failed to update card status.',
      });
    }
  };

  const maskCardNumber = (cardNumber) => {
    if (!showCardNumbers) {
      return cardNumber.replace(/\d(?=\d{4})/g, '*');
    }
    return cardNumber;
  };

  const getCardIcon = (type) => {
    return type === 'physical' ? <CreditCard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'frozen':
        return 'text-blue-600';
      case 'blocked':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSpendingPercentage = (spent, limit) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 safe-top safe-bottom">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cards</h1>
            <p className="text-muted-foreground mt-1">Manage your virtual and physical cards</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCardNumbers(!showCardNumbers)}
              className="touch-target"
            >
              {showCardNumbers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showCardNumbers ? 'Hide' : 'Show'} Numbers
            </Button>
            
            <Button 
              onClick={() => navigate('/cards/issue')}
              className="btn-mobile gradient-primary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        </motion.div>

        {/* Cards Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle>Cards Overview</CardTitle>
              <CardDescription>Quick stats about your cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{cards.length}</p>
                  <p className="text-sm text-muted-foreground">Total Cards</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {cards.filter(c => c.status === 'active').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {cards.filter(c => c.status === 'frozen').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Frozen</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {cards.filter(c => c.type === 'virtual').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Virtual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cards List */}
        <div className="space-y-4">
          {cards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="card-mobile">
                <CardContent className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Cards Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by issuing your first virtual or physical card
                  </p>
                  <Button 
                    onClick={() => navigate('/cards/issue')}
                    className="btn-mobile gradient-primary text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Issue Your First Card
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="card-mobile overflow-hidden">
                  {/* Card Visual */}
                  <div className={`${card.color} p-6 text-white relative`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getCardIcon(card.type)}
                        <Badge 
                          variant={card.status === 'active' ? 'default' : 'secondary'}
                          className={`${card.status === 'active' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'}`}
                        >
                          {card.type} • {card.status}
                        </Badge>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/cards/${card.id}`)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Card Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCardToggle(card.id, card.status)}
                            disabled={isLoading}
                          >
                            {card.status === 'active' ? (
                              <>
                                <Freeze className="w-4 h-4 mr-2" />
                                Freeze Card
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Unfreeze Card
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-white/80 text-sm">Card Number</p>
                        <p className="text-xl font-mono font-semibold tracking-wider">
                          {maskCardNumber(card.card_number)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-xs">Cardholder</p>
                          <p className="font-medium">{card.cardholder_name}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white/80 text-xs">Expires</p>
                          <p className="font-medium">
                            {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white/80 text-xs">Brand</p>
                          <p className="font-medium">{card.brand}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Info */}
                  <CardContent className="p-6 space-y-4">
                    {/* Spending Limits */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Daily Spending</span>
                        <span className="text-sm text-muted-foreground">
                          ${card.current_daily_spent.toLocaleString()} / ${card.spending_limit_daily.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{ 
                            width: `${getSpendingPercentage(card.current_daily_spent, card.spending_limit_daily)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Monthly Spending</span>
                        <span className="text-sm text-muted-foreground">
                          ${card.current_monthly_spent.toLocaleString()} / ${card.spending_limit_monthly.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-secondary rounded-full h-2 transition-all duration-300"
                          style={{ 
                            width: `${getSpendingPercentage(card.current_monthly_spent, card.spending_limit_monthly)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Card Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-medium">{formatDate(card.created_at)}</p>
                      </div>
                      
                      <div className="text-center">
                        <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Last Used</p>
                        <p className="text-sm font-medium">{formatDate(card.last_used)}</p>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/cards/${card.id}`)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                      
                      <Button
                        variant={card.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleCardToggle(card.id, card.status)}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {card.status === 'active' ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Freeze
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Unfreeze
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-mobile">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Security Tips</p>
                  <p className="text-blue-700 dark:text-blue-200 mt-1">
                    Keep your cards secure. Freeze them instantly if lost or stolen. 
                    Monitor spending limits and transaction alerts regularly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CardsScreen;

