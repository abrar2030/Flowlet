import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  Plus, 
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Copy,
  Download,
  Smartphone,
  Globe,
  ShoppingCart,
  Fuel,
  Utensils,
  MoreHorizontal
} from 'lucide-react';

const CardsPage = () => {
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [newCardDialogOpen, setNewCardDialogOpen] = useState(false);

  // Mock card data
  const cards = [
    {
      id: 'card_001',
      type: 'virtual',
      name: 'Primary Card',
      number: '4242424242424242',
      expiryMonth: '12',
      expiryYear: '2027',
      cvv: '123',
      status: 'active',
      balance: 2500.75,
      spentThisMonth: 1250.30,
      limit: 5000,
      isLocked: false,
      controls: {
        onlineTransactions: true,
        contactlessPayments: true,
        atmWithdrawals: true,
        internationalTransactions: false
      },
      categories: {
        groceries: true,
        restaurants: true,
        gas: true,
        shopping: false,
        entertainment: true
      }
    },
    {
      id: 'card_002',
      type: 'physical',
      name: 'Travel Card',
      number: '5555555555554444',
      expiryMonth: '08',
      expiryYear: '2026',
      cvv: '456',
      status: 'active',
      balance: 1200.50,
      spentThisMonth: 450.75,
      limit: 3000,
      isLocked: false,
      controls: {
        onlineTransactions: true,
        contactlessPayments: true,
        atmWithdrawals: true,
        internationalTransactions: true
      },
      categories: {
        groceries: true,
        restaurants: true,
        gas: true,
        shopping: true,
        entertainment: true
      }
    }
  ];

  const recentTransactions = [
    {
      id: 'tx_001',
      cardId: 'card_001',
      merchant: 'Amazon',
      amount: 89.99,
      currency: 'USD',
      category: 'shopping',
      timestamp: '2024-06-10T14:30:00Z',
      status: 'completed'
    },
    {
      id: 'tx_002',
      cardId: 'card_002',
      merchant: 'Starbucks',
      amount: 5.75,
      currency: 'USD',
      category: 'restaurants',
      timestamp: '2024-06-10T09:15:00Z',
      status: 'completed'
    },
    {
      id: 'tx_003',
      cardId: 'card_001',
      merchant: 'Shell Gas Station',
      amount: 45.20,
      currency: 'USD',
      category: 'gas',
      timestamp: '2024-06-09T18:45:00Z',
      status: 'completed'
    }
  ];

  const formatCardNumber = (number) => {
    if (!showCardNumbers) return '•••• •••• •••• ' + number.slice(-4);
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'groceries':
        return <ShoppingCart className="h-4 w-4" />;
      case 'restaurants':
        return <Utensils className="h-4 w-4" />;
      case 'gas':
        return <Fuel className="h-4 w-4" />;
      case 'shopping':
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cards</h1>
          <p className="text-muted-foreground">
            Manage your virtual and physical payment cards
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newCardDialogOpen} onOpenChange={setNewCardDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request New Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request New Card</DialogTitle>
                <DialogDescription>
                  Choose the type of card you'd like to request
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Smartphone className="h-12 w-12 mx-auto text-primary mb-4" />
                      <h3 className="font-semibold mb-2">Virtual Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Instant digital card for online purchases
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
                      <h3 className="font-semibold mb-2">Physical Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Physical card delivered to your address
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Card Name</Label>
                  <Input
                    id="cardName"
                    placeholder="Enter a name for your card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spendingLimit">Monthly Spending Limit</Label>
                  <Input
                    id="spendingLimit"
                    type="number"
                    placeholder="5000"
                  />
                </div>
                <Button className="w-full">Request Card</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => setShowCardNumbers(!showCardNumbers)}
          >
            {showCardNumbers ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showCardNumbers ? 'Hide' : 'Show'} Numbers
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {card.type === 'virtual' ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                    {card.name}
                  </CardTitle>
                  <CardDescription>
                    {card.type === 'virtual' ? 'Virtual Card' : 'Physical Card'}
                  </CardDescription>
                </div>
                <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                  {card.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Card Visual */}
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-lg p-6 text-primary-foreground">
                <div className="flex justify-between items-start mb-8">
                  <div className="text-sm opacity-80">Flowlet</div>
                  <div className="text-sm opacity-80">{card.type.toUpperCase()}</div>
                </div>
                <div className="space-y-4">
                  <div className="text-lg font-mono tracking-wider">
                    {formatCardNumber(card.number)}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-80">EXPIRES</div>
                      <div className="text-sm">
                        {showCardNumbers ? `${card.expiryMonth}/${card.expiryYear}` : '••/••'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs opacity-80">CVV</div>
                      <div className="text-sm">
                        {showCardNumbers ? card.cvv : '•••'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(card.number)}
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Copy Number
                </Button>
                <Button variant="outline" size="sm">
                  {card.isLocked ? (
                    <>
                      <Unlock className="mr-2 h-3 w-3" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-3 w-3" />
                      Lock
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-3 w-3" />
                  Settings
                </Button>
              </div>

              {/* Spending Info */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Spent this month</span>
                  <span className="font-medium">
                    {formatCurrency(card.spentThisMonth)} / {formatCurrency(card.limit)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(card.spentThisMonth / card.limit) * 100}%` }}
                  />
                </div>
              </div>

              {/* Controls */}
              <Tabs defaultValue="controls" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="controls">Controls</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>
                
                <TabsContent value="controls" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">Online Transactions</span>
                    </div>
                    <Switch checked={card.controls.onlineTransactions} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Contactless Payments</span>
                    </div>
                    <Switch checked={card.controls.contactlessPayments} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">ATM Withdrawals</span>
                    </div>
                    <Switch checked={card.controls.atmWithdrawals} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">International Transactions</span>
                    </div>
                    <Switch checked={card.controls.internationalTransactions} />
                  </div>
                </TabsContent>
                
                <TabsContent value="categories" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-sm">Groceries</span>
                    </div>
                    <Switch checked={card.categories.groceries} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Utensils className="h-4 w-4" />
                      <span className="text-sm">Restaurants</span>
                    </div>
                    <Switch checked={card.categories.restaurants} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Fuel className="h-4 w-4" />
                      <span className="text-sm">Gas Stations</span>
                    </div>
                    <Switch checked={card.categories.gas} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-sm">Shopping</span>
                    </div>
                    <Switch checked={card.categories.shopping} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Card Transactions</CardTitle>
          <CardDescription>Latest activity across all your cards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => {
              const card = cards.find(c => c.id === transaction.cardId);
              return (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.merchant}</p>
                      <p className="text-sm text-muted-foreground">
                        {card?.name} • {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      -{formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <Badge variant="default" className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CardsPage;

