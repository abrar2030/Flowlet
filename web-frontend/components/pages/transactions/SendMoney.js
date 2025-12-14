import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, User, DollarSign, MessageSquare, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
const sendMoneySchema = z.object({
  recipient: z.string().min(1, "Recipient is required"),
  amount: z
    .number()
    .min(0.01, "Amount must be greater than 0")
    .max(10000, "Amount cannot exceed $10,000"),
  currency: z.string().min(1, "Currency is required"),
  notes: z.string().optional(),
});
const SendMoney = ({ onSendMoney, availableBalance = 1234.56 }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(sendMoneySchema),
    mode: "onChange",
    defaultValues: {
      currency: "USD",
    },
  });
  const watchedAmount = watch("amount");
  const watchedRecipient = watch("recipient");
  const watchedCurrency = watch("currency");
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  const onSubmit = async (data) => {
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
      console.error("Failed to send money:", error);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };
  const handleCancel = () => {
    setShowConfirmation(false);
  };
  if (showConfirmation) {
    return _jsx("div", {
      className: "container mx-auto p-6 max-w-2xl",
      children: _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              className: "flex items-center gap-2",
              children: [
                _jsx(Shield, { className: "h-6 w-6 text-blue-600" }),
                "Confirm Transaction",
              ],
            }),
          }),
          _jsxs(CardContent, {
            className: "space-y-6",
            children: [
              _jsx(Alert, {
                children: _jsx(AlertDescription, {
                  children:
                    "Please review the transaction details carefully before confirming.",
                }),
              }),
              _jsxs("div", {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    className:
                      "flex justify-between items-center p-4 bg-gray-50 rounded-lg",
                    children: [
                      _jsx("span", {
                        className: "font-medium",
                        children: "Recipient:",
                      }),
                      _jsx("span", { children: watchedRecipient }),
                    ],
                  }),
                  _jsxs("div", {
                    className:
                      "flex justify-between items-center p-4 bg-gray-50 rounded-lg",
                    children: [
                      _jsx("span", {
                        className: "font-medium",
                        children: "Amount:",
                      }),
                      _jsx("span", {
                        className: "text-xl font-bold text-blue-600",
                        children: formatCurrency(watchedAmount || 0),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className:
                      "flex justify-between items-center p-4 bg-gray-50 rounded-lg",
                    children: [
                      _jsx("span", {
                        className: "font-medium",
                        children: "Currency:",
                      }),
                      _jsx("span", { children: watchedCurrency }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "flex gap-4",
                children: [
                  _jsx(Button, {
                    variant: "outline",
                    onClick: handleCancel,
                    className: "flex-1",
                    disabled: isLoading,
                    children: "Cancel",
                  }),
                  _jsx(Button, {
                    onClick: handleSubmit(onSubmit),
                    className: "flex-1",
                    disabled: isLoading,
                    children: isLoading ? "Processing..." : "Confirm & Send",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  }
  return _jsxs("div", {
    className: "container mx-auto p-6 max-w-2xl",
    children: [
      _jsxs("div", {
        className: "flex items-center gap-2 mb-6",
        children: [
          _jsx(Send, { className: "h-8 w-8 text-primary" }),
          _jsx("h1", {
            className: "text-3xl font-bold",
            children: "Send Money",
          }),
        ],
      }),
      _jsx(Card, {
        className: "mb-6",
        children: _jsx(CardContent, {
          className: "pt-6",
          children: _jsxs("div", {
            className: "text-center",
            children: [
              _jsx("p", {
                className: "text-sm text-gray-500",
                children: "Available Balance",
              }),
              _jsx("p", {
                className: "text-2xl font-bold text-green-600",
                children: formatCurrency(availableBalance),
              }),
            ],
          }),
        }),
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, { children: "Transfer Details" }),
          }),
          _jsx(CardContent, {
            children: _jsxs("form", {
              onSubmit: handleSubmit(onSubmit),
              className: "space-y-6",
              children: [
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsxs(Label, {
                      htmlFor: "recipient",
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(User, { className: "h-4 w-4" }),
                        "Recipient",
                      ],
                    }),
                    _jsx(Input, {
                      id: "recipient",
                      placeholder:
                        "Enter recipient's name, email, or account number",
                      ...register("recipient"),
                      className: errors.recipient ? "border-red-500" : "",
                    }),
                    errors.recipient &&
                      _jsx("p", {
                        className: "text-sm text-red-500",
                        children: errors.recipient.message,
                      }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsxs(Label, {
                      htmlFor: "amount",
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(DollarSign, { className: "h-4 w-4" }),
                        "Amount",
                      ],
                    }),
                    _jsx(Input, {
                      id: "amount",
                      type: "number",
                      step: "0.01",
                      placeholder: "0.00",
                      ...register("amount", { valueAsNumber: true }),
                      className: errors.amount ? "border-red-500" : "",
                    }),
                    errors.amount &&
                      _jsx("p", {
                        className: "text-sm text-red-500",
                        children: errors.amount.message,
                      }),
                    watchedAmount > availableBalance &&
                      _jsx("p", {
                        className: "text-sm text-red-500",
                        children: "Amount exceeds available balance",
                      }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Label, { htmlFor: "currency", children: "Currency" }),
                    _jsxs(Select, {
                      value: watchedCurrency,
                      onValueChange: (value) => setValue("currency", value),
                      children: [
                        _jsx(SelectTrigger, {
                          children: _jsx(SelectValue, {
                            placeholder: "Select currency",
                          }),
                        }),
                        _jsxs(SelectContent, {
                          children: [
                            _jsx(SelectItem, {
                              value: "USD",
                              children: "USD - US Dollar",
                            }),
                            _jsx(SelectItem, {
                              value: "EUR",
                              children: "EUR - Euro",
                            }),
                            _jsx(SelectItem, {
                              value: "GBP",
                              children: "GBP - British Pound",
                            }),
                            _jsx(SelectItem, {
                              value: "CAD",
                              children: "CAD - Canadian Dollar",
                            }),
                          ],
                        }),
                      ],
                    }),
                    errors.currency &&
                      _jsx("p", {
                        className: "text-sm text-red-500",
                        children: errors.currency.message,
                      }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsxs(Label, {
                      htmlFor: "notes",
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(MessageSquare, { className: "h-4 w-4" }),
                        "Notes (Optional)",
                      ],
                    }),
                    _jsx(Textarea, {
                      id: "notes",
                      placeholder: "Add a note for this transaction",
                      ...register("notes"),
                      rows: 3,
                    }),
                  ],
                }),
                _jsxs(Alert, {
                  children: [
                    _jsx(Shield, { className: "h-4 w-4" }),
                    _jsx(AlertDescription, {
                      children:
                        "Your transaction is protected by bank-level security. You will be asked to confirm before the money is sent.",
                    }),
                  ],
                }),
                _jsxs(Button, {
                  type: "submit",
                  className: "w-full",
                  disabled:
                    !isValid || watchedAmount > availableBalance || isLoading,
                  children: [
                    _jsx(Send, { className: "h-4 w-4 mr-2" }),
                    "Review & Send Money",
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
};
export default SendMoney;
