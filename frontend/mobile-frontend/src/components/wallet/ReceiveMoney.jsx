import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  QrCode, 
  Copy, 
  Share, 
  DollarSign, 
  CheckCircle,
  Smartphone,
  Mail,
  Link,
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
import { useAuth, useClipboard, useFormValidation } from '../../hooks/index.js';

const ReceiveMoney = () => {
  const { user } = useAuth();
  const { addNotification } = useUIStore();
  const { wallets, activeWallet } = useWalletStore();
  const { copy, copied } = useClipboard();
  
  const [requestMethod, setRequestMethod] = useState('link'); // link, qr, email, sms
  const [showQR, setShowQR] = useState(false);

  // Form validation rules
  const validationRules = {
    amount: [
      (value) => value && (isNaN(value) || parseFloat(value) <= 0) ? 'Amount must be a positive number' : '',
    ],
    note: [],
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    reset,
  } = useFormValidation(
    {
      amount: '',
      note: '',
      wallet: activeWallet?.id || '',
    },
    validationRules
  );

  // Generate payment link (mock)
  const generatePaymentLink = () => {
    const baseUrl = 'https://flowlet.app/pay';
    const params = new URLSearchParams({
      to: user?.id || 'user123',
      wallet: values.wallet,
      ...(values.amount && { amount: values.amount }),
      ...(values.note && { note: values.note }),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const paymentLink = generatePaymentLink();
  const selectedWallet = wallets.find(w => w.id === values.wallet) || activeWallet;

  const handleCopyLink = async () => {
    const success = await copy(paymentLink);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Link Copied!',
        message: 'Payment link has been copied to clipboard.',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Flowlet Payment Request',
          text: values.note || 'Payment request from Flowlet',
          url: paymentLink,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Payment Request - Flowlet');
    const body = encodeURIComponent(
      `Hi,\n\nI'm requesting a payment${values.amount ? ` of $${values.amount}` : ''} through Flowlet.\n\n${
        values.note ? `Note: ${values.note}\n\n` : ''
      }Click the link below to pay:\n${paymentLink}\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSendSMS = () => {
    const message = encodeURIComponent(
      `Payment request${values.amount ? ` for $${values.amount}` : ''} via Flowlet: ${paymentLink}`
    );
    window.open(`sms:?body=${message}`);
  };

  const renderRequestForm = () => (
    <Card className="card-mobile">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="w-6 h-6 mr-2 text-primary" />
          Request Payment
        </CardTitle>
        <CardDescription>
          Create a payment request to receive money
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Wallet Selection */}
        <div>
          <Label>Receive to Wallet</Label>
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
                      {wallet.currency}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input (Optional) */}
        <div>
          <Label htmlFor="amount">Amount (Optional)</Label>
          <div className="relative mt-2">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={values.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              className={`pl-10 ${errors.amount && touched.amount ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.amount && touched.amount && (
            <p className="text-sm text-destructive mt-1">{errors.amount}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Leave empty to let the sender choose the amount
          </p>
        </div>

        {/* Note */}
        <div>
          <Label htmlFor="note">Note (Optional)</Label>
          <Textarea
            id="note"
            placeholder="What's this payment for?"
            value={values.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderPaymentLink = () => (
    <Card className="card-mobile">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Link className="w-6 h-6 mr-2 text-primary" />
          Payment Link
        </CardTitle>
        <CardDescription>
          Share this link to receive payments
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        {(values.amount || values.note) && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            {values.amount && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-lg">${parseFloat(values.amount).toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">{selectedWallet?.name}</span>
            </div>
            
            {values.note && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground text-sm">Note:</span>
                <p className="mt-1">{values.note}</p>
              </div>
            )}
          </div>
        )}

        {/* Link Display */}
        <div>
          <Label>Payment Link</Label>
          <div className="flex items-center space-x-2 mt-2">
            <Input
              value={paymentLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {copied && (
            <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>
          )}
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            className="btn-mobile h-auto py-4 flex-col"
          >
            <Share className="w-5 h-5 mb-2" />
            <span className="text-sm">Share Link</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowQR(true)}
            className="btn-mobile h-auto py-4 flex-col"
          >
            <QrCode className="w-5 h-5 mb-2" />
            <span className="text-sm">QR Code</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleSendEmail}
            className="btn-mobile h-auto py-4 flex-col"
          >
            <Mail className="w-5 h-5 mb-2" />
            <span className="text-sm">Send Email</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSendSMS}
            className="btn-mobile h-auto py-4 flex-col"
          >
            <Smartphone className="w-5 h-5 mb-2" />
            <span className="text-sm">Send SMS</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderQRCode = () => (
    <Card className="card-mobile">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <QrCode className="w-6 h-6 mr-2 text-primary" />
              QR Code
            </CardTitle>
            <CardDescription>
              Scan to pay with any Flowlet app
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQR(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="text-center space-y-6">
        {/* QR Code Placeholder */}
        <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">QR Code would appear here</p>
            <p className="text-sm text-muted-foreground mt-2">
              In a real implementation, this would show a scannable QR code
            </p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-muted rounded-lg p-4">
          <div className="space-y-2">
            {values.amount && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">${parseFloat(values.amount).toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">{selectedWallet?.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Recipient:</span>
              <span className="font-medium">{user?.first_name} {user?.last_name}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex-1"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
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
            <h1 className="text-3xl font-bold text-foreground">Receive Money</h1>
            <p className="text-muted-foreground mt-1">Request payments and get paid instantly</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <X className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Wallet Info */}
        {selectedWallet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-mobile gradient-secondary text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Receiving to</p>
                    <p className="text-xl font-semibold">{selectedWallet.name}</p>
                    <p className="text-white/80 text-sm">{selectedWallet.currency} Wallet</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Current Balance</p>
                    <p className="text-xl font-bold">${selectedWallet.balance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {showQR ? renderQRCode() : (
            <div className="space-y-6">
              {renderRequestForm()}
              {renderPaymentLink()}
            </div>
          )}
        </motion.div>

        {/* Tips */}
        {!showQR && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-mobile">
              <CardHeader>
                <CardTitle className="text-lg">Tips for Receiving Money</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p>Share your payment link via any messaging app or email</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p>QR codes work great for in-person payments</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p>Payments are instant and secure with bank-level encryption</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p>You'll get notified immediately when payment is received</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReceiveMoney;

