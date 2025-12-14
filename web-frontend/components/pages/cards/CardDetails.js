import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Lock,
  Unlock,
  Trash2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
export default function CardDetails() {
  const { cardId } = useParams();
  const [showNumber, setShowNumber] = useState(false);
  const [card] = useState({
    id: cardId || "1",
    last4: "4242",
    brand: "Visa",
    type: "Virtual",
    status: "active",
    balance: 1250.0,
    limit: 5000.0,
    expiryMonth: "12",
    expiryYear: "2027",
    cvv: "123",
  });
  return _jsxs("div", {
    className: "container mx-auto p-6 max-w-4xl",
    children: [
      _jsx(Link, {
        to: "/cards",
        children: _jsxs(Button, {
          variant: "ghost",
          className: "mb-6",
          children: [
            _jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            "Back to Cards",
          ],
        }),
      }),
      _jsxs(Card, {
        className: "mb-6",
        children: [
          _jsx(CardHeader, {
            children: _jsxs("div", {
              className: "flex items-center justify-between",
              children: [
                _jsxs("div", {
                  children: [
                    _jsx(CardTitle, {
                      className: "text-2xl",
                      children: "Card Details",
                    }),
                    _jsx(CardDescription, {
                      children: "Manage your card settings and limits",
                    }),
                  ],
                }),
                _jsx(Badge, {
                  variant: card.status === "active" ? "success" : "destructive",
                  children: card.status,
                }),
              ],
            }),
          }),
          _jsxs(CardContent, {
            children: [
              _jsxs("div", {
                className:
                  "bg-gradient-to-br from-primary to-purple-600 rounded-lg p-6 text-white mb-6",
                children: [
                  _jsxs("div", {
                    className: "flex justify-between items-start mb-8",
                    children: [
                      _jsx(CreditCard, { className: "h-8 w-8" }),
                      _jsx("span", {
                        className: "text-sm",
                        children: card.type,
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "mb-4",
                    children: [
                      _jsxs("div", {
                        className: "flex items-center gap-2 mb-2",
                        children: [
                          _jsx("span", {
                            className: "font-mono text-xl tracking-wider",
                            children: showNumber
                              ? `4242 4242 4242 ${card.last4}`
                              : `•••• •••• •••• ${card.last4}`,
                          }),
                          _jsx(Button, {
                            variant: "ghost",
                            size: "icon",
                            onClick: () => setShowNumber(!showNumber),
                            children: showNumber
                              ? _jsx(EyeOff, { className: "h-4 w-4" })
                              : _jsx(Eye, { className: "h-4 w-4" }),
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "flex gap-8 text-sm",
                        children: [
                          _jsxs("div", {
                            children: [
                              _jsx("span", {
                                className: "opacity-70",
                                children: "Expires",
                              }),
                              " ",
                              card.expiryMonth,
                              "/",
                              card.expiryYear,
                            ],
                          }),
                          _jsxs("div", {
                            children: [
                              _jsx("span", {
                                className: "opacity-70",
                                children: "CVV",
                              }),
                              " ",
                              showNumber ? card.cvv : "•••",
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "grid md:grid-cols-2 gap-4 mb-6",
                children: [
                  _jsxs("div", {
                    className: "p-4 border rounded-lg",
                    children: [
                      _jsx("div", {
                        className: "text-sm text-muted-foreground mb-1",
                        children: "Available Balance",
                      }),
                      _jsxs("div", {
                        className: "text-2xl font-bold",
                        children: ["$", card.balance.toFixed(2)],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "p-4 border rounded-lg",
                    children: [
                      _jsx("div", {
                        className: "text-sm text-muted-foreground mb-1",
                        children: "Credit Limit",
                      }),
                      _jsxs("div", {
                        className: "text-2xl font-bold",
                        children: ["$", card.limit.toFixed(2)],
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "flex gap-4",
                children: [
                  _jsxs(Button, {
                    variant: "outline",
                    className: "flex-1",
                    children: [
                      _jsx(Lock, { className: "mr-2 h-4 w-4" }),
                      "Freeze Card",
                    ],
                  }),
                  _jsxs(Button, {
                    variant: "outline",
                    className: "flex-1",
                    children: [
                      _jsx(Unlock, { className: "mr-2 h-4 w-4" }),
                      "Change PIN",
                    ],
                  }),
                  _jsx(Button, {
                    variant: "destructive",
                    children: _jsx(Trash2, { className: "h-4 w-4" }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
