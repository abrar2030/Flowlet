import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Smartphone,
  Globe,
} from "lucide-react";

interface CardData {
  id: string;
  cardNumber: string;
  cardType: "debit" | "credit" | "prepaid";
  cardBrand: "visa" | "mastercard" | "amex" | "discover";
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  status: "active" | "blocked" | "expired" | "inactive";
  isVirtual: boolean;
  balance?: number;
  creditLimit?: number;
  lastUsed?: string;
}

interface CardsScreenProps {
  cards?: CardData[];
  onViewCard?: (cardId: string) => void;
  onBlockCard?: (cardId: string) => void;
  onUnblockCard?: (cardId: string) => void;
  onAddCard?: () => void;
}

const CardsScreen: React.FC<CardsScreenProps> = ({
  cards = [
    {
      id: "1",
      cardNumber: "**** **** **** 1234",
      cardType: "debit",
      cardBrand: "visa",
      holderName: "John Doe",
      expiryMonth: 12,
      expiryYear: 2028,
      status: "active",
      isVirtual: false,
      balance: 1234.56,
      lastUsed: "2025-01-14",
    },
    {
      id: "2",
      cardNumber: "**** **** **** 5678",
      cardType: "credit",
      cardBrand: "mastercard",
      holderName: "John Doe",
      expiryMonth: 8,
      expiryYear: 2027,
      status: "active",
      isVirtual: false,
      creditLimit: 5000,
      lastUsed: "2025-01-13",
    },
    {
      id: "3",
      cardNumber: "**** **** **** 9012",
      cardType: "credit",
      cardBrand: "amex",
      holderName: "John Doe",
      expiryMonth: 6,
      expiryYear: 2026,
      status: "blocked",
      isVirtual: false,
      creditLimit: 10000,
      lastUsed: "2025-01-10",
    },
    {
      id: "4",
      cardNumber: "**** **** **** 3456",
      cardType: "debit",
      cardBrand: "visa",
      holderName: "John Doe",
      expiryMonth: 3,
      expiryYear: 2029,
      status: "active",
      isVirtual: true,
      balance: 500.0,
      lastUsed: "2025-01-12",
    },
  ],
  onViewCard,
  onBlockCard,
  onUnblockCard,
  onAddCard,
}) => {
  const [showCardNumbers, setShowCardNumbers] = useState<
    Record<string, boolean>
  >({});

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getCardBrandColor = (brand: string): string => {
    switch (brand) {
      case "visa":
        return "from-blue-600 to-blue-800";
      case "mastercard":
        return "from-red-600 to-red-800";
      case "amex":
        return "from-green-600 to-green-800";
      case "discover":
        return "from-orange-600 to-orange-800";
      default:
        return "from-gray-600 to-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "blocked":
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      case "inactive":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const toggleCardNumberVisibility = (cardId: string) => {
    setShowCardNumbers((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleCardAction = (
    action: "view" | "block" | "unblock",
    cardId: string,
  ) => {
    switch (action) {
      case "view":
        onViewCard?.(cardId);
        break;
      case "block":
        onBlockCard?.(cardId);
        break;
      case "unblock":
        onUnblockCard?.(cardId);
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">My Cards</h1>
        </div>
        <Button onClick={onAddCard} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Card
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            {/* Card Visual */}
            <div
              className={`bg-gradient-to-br ${getCardBrandColor(card.cardBrand)} p-6 text-white relative`}
            >
              {card.isVirtual && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Virtual
                  </Badge>
                </div>
              )}

              <div className="flex justify-between items-start mb-8">
                <div className="text-lg font-bold capitalize">
                  {card.cardBrand}
                </div>
                <div className="text-right">{getStatusBadge(card.status)}</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono tracking-wider">
                    {showCardNumbers[card.id]
                      ? "1234 5678 9012 3456"
                      : card.cardNumber}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardNumberVisibility(card.id)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    {showCardNumbers[card.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-75">CARDHOLDER</p>
                    <p className="font-medium">{card.holderName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75">EXPIRES</p>
                    <p className="font-medium">
                      {String(card.expiryMonth).padStart(2, "0")}/
                      {String(card.expiryYear).slice(-2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Details */}
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Type</span>
                <Badge variant="outline" className="capitalize">
                  {card.cardType}
                </Badge>
              </div>

              {card.balance !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Available Balance
                  </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(card.balance)}
                  </span>
                </div>
              )}

              {card.creditLimit !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Credit Limit</span>
                  <span className="font-semibold">
                    {formatCurrency(card.creditLimit)}
                  </span>
                </div>
              )}

              {card.lastUsed && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Used</span>
                  <span className="text-sm">{formatDate(card.lastUsed)}</span>
                </div>
              )}

              {/* Card Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCardAction("view", card.id)}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>

                {card.status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCardAction("block", card.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                ) : card.status === "blocked" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCardAction("unblock", card.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Unlock className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Plus className="h-5 w-5" />
              <span className="text-sm">Request Physical Card</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Smartphone className="h-5 w-5" />
              <span className="text-sm">Create Virtual Card</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Globe className="h-5 w-5" />
              <span className="text-sm">Travel Notification</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Tip:</strong> Never share your card details, PIN, or
          CVV with anyone. If you suspect unauthorized use, block your card
          immediately using the controls above.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CardsScreen;
