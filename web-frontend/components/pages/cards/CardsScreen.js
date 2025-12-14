import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
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
const CardsScreen = ({
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
  const [showCardNumbers, setShowCardNumbers] = useState({});
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const getCardBrandColor = (brand) => {
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
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return _jsx(Badge, {
          className: "bg-green-100 text-green-800",
          children: "Active",
        });
      case "blocked":
        return _jsx(Badge, {
          className: "bg-red-100 text-red-800",
          children: "Blocked",
        });
      case "expired":
        return _jsx(Badge, {
          className: "bg-gray-100 text-gray-800",
          children: "Expired",
        });
      case "inactive":
        return _jsx(Badge, {
          className: "bg-yellow-100 text-yellow-800",
          children: "Inactive",
        });
      default:
        return _jsx(Badge, { variant: "outline", children: status });
    }
  };
  const toggleCardNumberVisibility = (cardId) => {
    setShowCardNumbers((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };
  const handleCardAction = (action, cardId) => {
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
  return _jsxs("div", {
    className: "container mx-auto p-6 space-y-6",
    children: [
      _jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          _jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              _jsx(CreditCard, { className: "h-8 w-8 text-primary" }),
              _jsx("h1", {
                className: "text-3xl font-bold",
                children: "My Cards",
              }),
            ],
          }),
          _jsxs(Button, {
            onClick: onAddCard,
            className: "flex items-center gap-2",
            children: [_jsx(Plus, { className: "h-4 w-4" }), "Add New Card"],
          }),
        ],
      }),
      _jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        children: cards.map((card) =>
          _jsxs(
            Card,
            {
              className: "overflow-hidden",
              children: [
                _jsxs("div", {
                  className: `bg-gradient-to-br ${getCardBrandColor(card.cardBrand)} p-6 text-white relative`,
                  children: [
                    card.isVirtual &&
                      _jsx("div", {
                        className: "absolute top-4 right-4",
                        children: _jsxs(Badge, {
                          className: "bg-white/20 text-white border-white/30",
                          children: [
                            _jsx(Smartphone, { className: "h-3 w-3 mr-1" }),
                            "Virtual",
                          ],
                        }),
                      }),
                    _jsxs("div", {
                      className: "flex justify-between items-start mb-8",
                      children: [
                        _jsx("div", {
                          className: "text-lg font-bold capitalize",
                          children: card.cardBrand,
                        }),
                        _jsx("div", {
                          className: "text-right",
                          children: getStatusBadge(card.status),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-4",
                      children: [
                        _jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            _jsx("span", {
                              className: "text-xl font-mono tracking-wider",
                              children: showCardNumbers[card.id]
                                ? "1234 5678 9012 3456"
                                : card.cardNumber,
                            }),
                            _jsx(Button, {
                              variant: "ghost",
                              size: "sm",
                              onClick: () =>
                                toggleCardNumberVisibility(card.id),
                              className:
                                "text-white hover:bg-white/20 h-8 w-8 p-0",
                              children: showCardNumbers[card.id]
                                ? _jsx(EyeOff, { className: "h-4 w-4" })
                                : _jsx(Eye, { className: "h-4 w-4" }),
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className: "flex justify-between items-end",
                          children: [
                            _jsxs("div", {
                              children: [
                                _jsx("p", {
                                  className: "text-xs opacity-75",
                                  children: "CARDHOLDER",
                                }),
                                _jsx("p", {
                                  className: "font-medium",
                                  children: card.holderName,
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "text-right",
                              children: [
                                _jsx("p", {
                                  className: "text-xs opacity-75",
                                  children: "EXPIRES",
                                }),
                                _jsxs("p", {
                                  className: "font-medium",
                                  children: [
                                    String(card.expiryMonth).padStart(2, "0"),
                                    "/",
                                    String(card.expiryYear).slice(-2),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs(CardContent, {
                  className: "p-4 space-y-4",
                  children: [
                    _jsxs("div", {
                      className: "flex justify-between items-center",
                      children: [
                        _jsx("span", {
                          className: "text-sm text-gray-600",
                          children: "Type",
                        }),
                        _jsx(Badge, {
                          variant: "outline",
                          className: "capitalize",
                          children: card.cardType,
                        }),
                      ],
                    }),
                    card.balance !== undefined &&
                      _jsxs("div", {
                        className: "flex justify-between items-center",
                        children: [
                          _jsx("span", {
                            className: "text-sm text-gray-600",
                            children: "Available Balance",
                          }),
                          _jsx("span", {
                            className: "font-semibold text-green-600",
                            children: formatCurrency(card.balance),
                          }),
                        ],
                      }),
                    card.creditLimit !== undefined &&
                      _jsxs("div", {
                        className: "flex justify-between items-center",
                        children: [
                          _jsx("span", {
                            className: "text-sm text-gray-600",
                            children: "Credit Limit",
                          }),
                          _jsx("span", {
                            className: "font-semibold",
                            children: formatCurrency(card.creditLimit),
                          }),
                        ],
                      }),
                    card.lastUsed &&
                      _jsxs("div", {
                        className: "flex justify-between items-center",
                        children: [
                          _jsx("span", {
                            className: "text-sm text-gray-600",
                            children: "Last Used",
                          }),
                          _jsx("span", {
                            className: "text-sm",
                            children: formatDate(card.lastUsed),
                          }),
                        ],
                      }),
                    _jsxs("div", {
                      className: "flex gap-2 pt-2",
                      children: [
                        _jsxs(Button, {
                          variant: "outline",
                          size: "sm",
                          onClick: () => handleCardAction("view", card.id),
                          className: "flex-1",
                          children: [
                            _jsx(Settings, { className: "h-4 w-4 mr-1" }),
                            "Manage",
                          ],
                        }),
                        card.status === "active"
                          ? _jsx(Button, {
                              variant: "outline",
                              size: "sm",
                              onClick: () => handleCardAction("block", card.id),
                              className: "text-red-600 hover:text-red-700",
                              children: _jsx(Lock, { className: "h-4 w-4" }),
                            })
                          : card.status === "blocked"
                            ? _jsx(Button, {
                                variant: "outline",
                                size: "sm",
                                onClick: () =>
                                  handleCardAction("unblock", card.id),
                                className:
                                  "text-green-600 hover:text-green-700",
                                children: _jsx(Unlock, {
                                  className: "h-4 w-4",
                                }),
                              })
                            : null,
                      ],
                    }),
                  ],
                }),
              ],
            },
            card.id,
          ),
        ),
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsx(CardTitle, { children: "Quick Actions" }),
          }),
          _jsx(CardContent, {
            children: _jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-3 gap-4",
              children: [
                _jsxs(Button, {
                  variant: "outline",
                  className: "h-16 flex flex-col gap-1",
                  children: [
                    _jsx(Plus, { className: "h-5 w-5" }),
                    _jsx("span", {
                      className: "text-sm",
                      children: "Request Physical Card",
                    }),
                  ],
                }),
                _jsxs(Button, {
                  variant: "outline",
                  className: "h-16 flex flex-col gap-1",
                  children: [
                    _jsx(Smartphone, { className: "h-5 w-5" }),
                    _jsx("span", {
                      className: "text-sm",
                      children: "Create Virtual Card",
                    }),
                  ],
                }),
                _jsxs(Button, {
                  variant: "outline",
                  className: "h-16 flex flex-col gap-1",
                  children: [
                    _jsx(Globe, { className: "h-5 w-5" }),
                    _jsx("span", {
                      className: "text-sm",
                      children: "Travel Notification",
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      _jsxs(Alert, {
        children: [
          _jsx(Lock, { className: "h-4 w-4" }),
          _jsxs(AlertDescription, {
            children: [
              _jsx("strong", { children: "Security Tip:" }),
              " Never share your card details, PIN, or CVV with anyone. If you suspect unauthorized use, block your card immediately using the controls above.",
            ],
          }),
        ],
      }),
    ],
  });
};
export default CardsScreen;
