import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Copy, 
  Share, 
  Download, 
  CreditCard, 
  Building, 
  Globe,
  CheckCircle
} from 'lucide-react';

interface AccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  routingNumber: string;
  swiftCode: string;
}

interface ReceiveMoneyProps {
  accountDetails?: AccountDetails;
  qrCodeUrl?: string;
}

const ReceiveMoney: React.FC<ReceiveMoneyProps> = ({
  accountDetails = {
    bankName: 'Flowlet Bank',
    accountNumber: '1234 5678 9012 3456',
    accountName: 'John Doe',
    routingNumber: '021000021',
    swiftCode: 'FLOWLTXX'
  },
  qrCodeUrl = 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=QR+Code'
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareAccountDetails = async () => {
    const shareData = {
      title: 'My Account Details',
      text: `Send money to: ${accountDetails.accountName}\nAccount: ${accountDetails.accountNumber}\nBank: ${accountDetails.bankName}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await copyToClipboard(shareData.text, 'share');
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const generatePaymentLink = () => {
    const amount = customAmount ? `?amount=${customAmount}` : '';
    return `https://flowlet.app/pay/${accountDetails.accountNumber}${amount}`;
  };

  const CopyButton: React.FC<{ text: string; fieldName: string }> = ({ text, fieldName }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, fieldName)}
      className="h-8 w-8 p-0"
    >
      {copiedField === fieldName ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <QrCode className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Receive Money</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Scan to Pay</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img 
                  src={qrCodeUrl} 
                  alt="Payment QR Code" 
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>
            
            <p className="text-gray-600">
              Share this QR code with anyone who wants to send you money
            </p>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="customAmount">Request Specific Amount (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(generatePaymentLink(), 'paymentLink')}
                >
                  {copiedField === 'paymentLink' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {customAmount && (
                <p className="text-sm text-gray-500">
                  Payment link: {generatePaymentLink()}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={shareAccountDetails} className="flex-1">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Share these details with anyone who wants to send you money via bank transfer.
              </AlertDescription>
            </Alert>

            {/* Bank Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Bank Name</p>
                    <p className="text-sm text-gray-600">{accountDetails.bankName}</p>
                  </div>
                </div>
                <CopyButton text={accountDetails.bankName} fieldName="bankName" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Account Number</p>
                    <p className="text-sm text-gray-600 font-mono">{accountDetails.accountNumber}</p>
                  </div>
                </div>
                <CopyButton text={accountDetails.accountNumber} fieldName="accountNumber" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <div>
                    <p className="font-medium">Account Name</p>
                    <p className="text-sm text-gray-600">{accountDetails.accountName}</p>
                  </div>
                </div>
                <CopyButton text={accountDetails.accountName} fieldName="accountName" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">#</span>
                  </div>
                  <div>
                    <p className="font-medium">Routing Number</p>
                    <p className="text-sm text-gray-600 font-mono">{accountDetails.routingNumber}</p>
                  </div>
                </div>
                <CopyButton text={accountDetails.routingNumber} fieldName="routingNumber" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">SWIFT/BIC Code</p>
                    <p className="text-sm text-gray-600 font-mono">{accountDetails.swiftCode}</p>
                    <Badge variant="secondary" className="mt-1">International Transfers</Badge>
                  </div>
                </div>
                <CopyButton text={accountDetails.swiftCode} fieldName="swiftCode" />
              </div>
            </div>

            {/* Copy All Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                const allDetails = `Bank: ${accountDetails.bankName}\nAccount: ${accountDetails.accountNumber}\nName: ${accountDetails.accountName}\nRouting: ${accountDetails.routingNumber}\nSWIFT: ${accountDetails.swiftCode}`;
                copyToClipboard(allDetails, 'allDetails');
              }}
            >
              {copiedField === 'allDetails' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Copied All Details
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Details
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              <strong>Security Notice:</strong> Only share your account details with trusted parties. 
              Never share your login credentials, PIN, or passwords with anyone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiveMoney;

