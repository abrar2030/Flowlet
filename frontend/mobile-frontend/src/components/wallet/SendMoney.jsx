import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  User, 
  Smartphone, 
  Mail, 
  DollarSign, 
  ArrowRight, 
  QrCode, 
  Contacts,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { useWalletStore, useUIStore } from '../../store/index.js';
import { walletAPI } from '../../services/api.js';
import { useAuth, useApi, useFormValidation } from '../../hooks/index.js';

const SendMoney = () => {
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const { wallets, activeWallet } = useWalletStore();
  
  const [step, setStep] = useState(1); // 1: Recipient, 2: Amount, 3: Confirm, 4: Success
  const [sendMethod, setSendMethod] = useState('contact'); // contact, phone, email, qr
  const [recentContacts] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', avatar: null },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', avatar: null },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', avatar: null },
  ]);

  // Form validation rules
  const validationRules = {
    recipient: [
      (value) => !value ? 'Recipient is required' : '',
    ],
    amount: [
      (value) => !value ? 'Amount is required' : '',
      (value) => isNaN(value) || parseFloat(value) <= 0 ? 'Amount must be a positive number' : '',
      (value) => parseFloat(value) > (activeWallet?.balance || 0) ? 'Insufficient balance' : '',
    ],
    note: [],
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
  } = useFormValidation(
    {
      recipient: '',
      amount: '',
      note: '',
      wallet: activeWallet?.id || '',
    },
    validationRules
  );

  const handleNext = () => {
    if (step === 1 && !values.recipient) {
      addNotification({
        type: 'error',
        title: 'Recipient Required',
        message: 'Please select or enter a recipient.',
      });
      return;
    }
    
    if (step === 2 && !validateAll()) {
      return;
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSendMoney = async () => {
    try {
      // Mock successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification({
        type: 'success',
        title: 'Money Sent!',
        message: `$${values.amount} sent successfully to ${values.recipient}`,
      });
      
      setStep(4);
      
      // In real implementation:
      // const transferData = {
      //   to_wallet: values.recipient,
      //   amount: parseFloat(values.amount),
      //   currency: activeWallet.currency,
      //   description: values.note || 'Money transfer',
      // };
      // await request(() => walletAPI.transfer(activeWallet.id, transferData));
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Transfer Failed',
        message: error.message || 'Failed to send money. Please try again.',
      });
    }
  };

  const handleStartOver = () => {
    reset();
    setStep(1);
    setSendMethod('contact');
  };

  const selectContact = (contact) => {
    handleChange('recipient', contact.email);
    setStep(2);
  };

  const renderRecipientStep = () => (
    <Card className="card-mobile">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-6 h-6 mr-2 text-primary" />
          Select Recipient
        </CardTitle>
        <CardDescription>
          Choose how you want to send money
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={sendMethod} onValueChange={setSendMethod}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contact">Contacts</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contact" className="space-y-4">
            <div>
              <Label>Recent Contacts</Label>
              <div className="space-y-2 mt-2">
                {recentContacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => selectContact(contact)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="phone" className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-2">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={values.recipient}
                  onChange={(e) => handleChange('recipient', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={values.recipient}
                  onChange={(e) => handleChange('recipient', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="qr" className="space-y-4">
            <div className="text-center py-8">
              <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">QR Code scanner coming soon</p>
              <Button variant="outline" className="mt-4">
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleNext}
            disabled={!values.recipient}
            className="btn-mobile gradient-primary text-white"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAmountStep = () => (
    <Card className="card-mobile">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-primary" />
          Enter Amount
        </CardTitle>
        <CardDescription>
          Sending to: {values.recipient}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Wallet Selection */}
        <div>
          <Label>From Wallet</Label>
          <Select value={values.wallet} onValueChange={(value) => handleChange('wallet', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{wallet.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      ${wallet.balance.toLocaleString()}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div>
          <Label htmlFor="amount">Amount</Label>
          <div className="relative mt-2">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={values.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              className={`pl-10 text-2xl font-semibold ${errors.amount && touched.amount ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.amount && touched.amount && (
            <p className="text-sm text-destructive mt-1">{errors.amount}</p>
          )}
          
          {activeWallet && (
            <p className="text-sm text-muted-foreground mt-2">
              Available: ${activeWallet.balance.toLocaleString()}
            </p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <Label>Quick Amounts</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[10, 25, 50, 100].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => handleChange('amount', amount.toString())}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <Label htmlFor="note">Note (Optional)</Label>
          <Textarea
            id="note"
            placeholder="What's this for?"
            value={values.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!values.amount || !!errors.amount}
            className="btn-mobile gradient-primary text-white"
          >
            Review
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfirmStep = () => {
    const selectedWallet = wallets.find(w => w.id === values.wallet);
    
    return (
      <Card className="card-mobile">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-primary" />
            Confirm Transfer
          </CardTitle>
          <CardDescription>
            Please review the details before sending
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Transfer Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">{values.recipient}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-2xl">${parseFloat(values.amount).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{selectedWallet?.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fee:</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            
            {values.note && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground text-sm">Note:</span>
                <p className="mt-1">{values.note}</p>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">Security Notice</p>
              <p className="text-blue-700 dark:text-blue-200 mt-1">
                This transfer cannot be reversed. Please ensure all details are correct.
              </p>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button 
              onClick={handleSendMoney}
              disabled={isLoading}
              className="btn-mobile gradient-primary text-white"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                <>
                  Send Money
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSuccessStep = () => (
    <Card className="card-mobile">
      <CardContent className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Money Sent Successfully!
        </h2>
        
        <p className="text-muted-foreground mb-6">
          ${parseFloat(values.amount).toLocaleString()} has been sent to {values.recipient}
        </p>
        
        <div className="bg-muted rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Transaction ID: TX123456789</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The recipient will be notified and funds will be available instantly.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={handleStartOver}
            className="btn-mobile gradient-primary text-white"
          >
            Send Another Transfer
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
          >
            Back to Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 safe-top safe-bottom">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Send Money</h1>
            <p className="text-muted-foreground mt-1">Transfer money quickly and securely</p>
          </div>
          
          {step < 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </motion.div>

        {/* Progress Indicator */}
        {step < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center space-x-4"
          >
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && renderRecipientStep()}
          {step === 2 && renderAmountStep()}
          {step === 3 && renderConfirmStep()}
          {step === 4 && renderSuccessStep()}
        </motion.div>
      </div>
    </div>
  );
};

export default SendMoney;

