import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, User, DollarSign, MessageSquare, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const sendMoneySchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(10000, 'Amount cannot exceed $10,000'),
  currency: z.string().min(1, 'Currency is required'),
  notes: z.string().optional(),
});

type SendMoneyFormData = z.infer<typeof sendMoneySchema>;

interface SendMoneyProps {
  onSendMoney?: (data: SendMoneyFormData) => Promise<void>;
  availableBalance?: number;
}

const SendMoney: React.FC<SendMoneyProps> = ({
  onSendMoney,
  availableBalance = 1234.56
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<SendMoneyFormData>({
    resolver: zodResolver(sendMoneySchema),
    mode: 'onChange',
    defaultValues: {
      currency: 'USD',
    }
  });

  const watchedAmount = watch('amount');
  const watchedRecipient = watch('recipient');
  const watchedCurrency = watch('currency');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const onSubmit = async (data: SendMoneyFormData) => {
    if (data.amount > availableBalance) {
      return;
    }

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsLoading(true);
    try {
      await onSendMoney?.(data);
      // Reset form or redirect on success
    } catch (error) {
      console.error('Failed to send money:', error);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  if (showConfirmation) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Confirm Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                Please review the transaction details carefully before confirming.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Recipient:</span>
                <span>{watchedRecipient}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Amount:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(watchedAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Currency:</span>
                <span>{watchedCurrency}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm & Send'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Send className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Send Money</h1>
      </div>

      {/* Balance Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(availableBalance)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Send Money Form */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Recipient
              </Label>
              <Input
                id="recipient"
                placeholder="Enter recipient's name, email, or account number"
                {...register('recipient')}
                className={errors.recipient ? 'border-red-500' : ''}
              />
              {errors.recipient && (
                <p className="text-sm text-red-500">{errors.recipient.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
              {watchedAmount > availableBalance && (
                <p className="text-sm text-red-500">Amount exceeds available balance</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={watchedCurrency}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-500">{errors.currency.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add a note for this transaction"
                {...register('notes')}
                rows={3}
              />
            </div>

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your transaction is protected by bank-level security. You will be asked to confirm before the money is sent.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || (watchedAmount > availableBalance) || isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Review & Send Money
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendMoney;
