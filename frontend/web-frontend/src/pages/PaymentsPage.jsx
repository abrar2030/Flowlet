import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  QrCode,
  Link as LinkIcon,
  CreditCard,
  Building,
  Smartphone
} from 'lucide-react';

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  // Mock payment data
  const paymentMethods = [
    { id: 'wallet', name: 'Flowlet Wallet', icon: ArrowUpRight, balance: '$2,500.75' },
    { id: 'card', name: 'Credit Card', icon: CreditCard, last4: '4242' },
    { id: 'bank', name: 'Bank Account', icon: Building, last4: '1234' },
  ];

  const recentPayments = [
    {
      id: 'pay_001',
      type: 'sent',
      recipient: 'Alice Johnson',
      amount: 150.00,
      currency: 'USD',
      status: 'completed',
      timestamp: '2024-06-10T14:30:00Z',
      method: 'wallet'
    },
    {
      id: 'pay_002',
      type: 'received',
      sender: 'Bob Smith',
      amount: 75.50,
      currency: 'USD',
      status: 'completed',
      timestamp: '2024-06-10T12:15:00Z',
      method: 'wallet'
    },
    {
      id: 'pay_003',
      type: 'sent',
      recipient: 'Coffee Shop',
      amount: 12.99,
      currency: 'USD',
      status: 'pending',
      timestamp: '2024-06-10T10:45:00Z',
      method: 'card'
    }
  ];

  const paymentRequests = [
    {
      id: 'req_001',
      from: 'Charlie Brown',
      amount: 200.00,
      currency: 'USD',
      description: 'Dinner split',
      status: 'pending',
      expiresAt: '2024-06-11T18:00:00Z'
    },
    {
      id: 'req_002',
      from: 'Diana Prince',
      amount: 50.00,
      currency: 'USD',
      description: 'Movie tickets',
      status: 'pending',
      expiresAt: '2024-06-12T20:00:00Z'
    }
  ];

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">
            Send, receive, and manage your payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Payment
          </Button>
          <Button variant="outline">
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </Button>
        </div>
      </div>

      {/* Payment Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send">Send Money</TabsTrigger>
              <TabsTrigger value="request">Request Money</TabsTrigger>
              <TabsTrigger value="link">Payment Link</TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Payment</CardTitle>
                  <CardDescription>
                    Transfer money to friends, family, or businesses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <Input
                      id="recipient"
                      placeholder="Email, phone, or wallet ID"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Input
                      id="note"
                      placeholder="What's this payment for?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="space-y-2">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            paymentMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <method.icon className="h-5 w-5" />
                              <span className="font-medium">{method.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {method.balance || `•••• ${method.last4}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Send Payment
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="request" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Request Payment</CardTitle>
                  <CardDescription>
                    Request money from someone else
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="requestFrom">Request From</Label>
                    <Input
                      id="requestFrom"
                      placeholder="Email, phone, or wallet ID"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requestAmount">Amount</Label>
                      <Input
                        id="requestAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requestCurrency">Currency</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestNote">Description</Label>
                    <Input
                      id="requestNote"
                      placeholder="What's this request for?"
                    />
                  </div>

                  <Button className="w-full">
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Send Request
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Payment Link</CardTitle>
                  <CardDescription>
                    Generate a shareable link for payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkAmount">Amount</Label>
                      <Input
                        id="linkAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkCurrency">Currency</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkDescription">Description</Label>
                    <Input
                      id="linkDescription"
                      placeholder="What's this payment for?"
                    />
                  </div>

                  <Button className="w-full">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Generate Link
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Payment Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Requests</CardTitle>
            <CardDescription>Pending requests from others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentRequests.map((request) => (
                <div key={request.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{request.from}</span>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {request.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold">
                      {formatCurrency(request.amount, request.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Expires {formatDate(request.expiresAt)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Accept</Button>
                    <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Your latest payment activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    payment.type === 'received' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {payment.type === 'received' ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {payment.type === 'received' ? `From ${payment.sender}` : `To ${payment.recipient}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.timestamp)} • {payment.method}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-2">
                  <div>
                    <p className={`font-medium ${
                      payment.type === 'received' ? 'text-green-600' : 'text-foreground'
                    }`}>
                      {payment.type === 'received' ? '+' : '-'}
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                  {getStatusIcon(payment.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsPage;

