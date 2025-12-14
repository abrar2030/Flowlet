import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export default function IssueCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardType: "virtual",
    cardholderName: "",
    spendingLimit: "1000",
    purpose: "business",
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    navigate("/cards");
  };
  return _jsxs("div", {
    className: "container mx-auto p-6 max-w-2xl",
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
        children: [
          _jsx(CardHeader, {
            children: _jsxs("div", {
              className: "flex items-center gap-3",
              children: [
                _jsx(CreditCard, { className: "h-8 w-8 text-primary" }),
                _jsxs("div", {
                  children: [
                    _jsx(CardTitle, { children: "Issue New Card" }),
                    _jsx(CardDescription, {
                      children: "Create a new virtual or physical card",
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsxs("form", {
              onSubmit: handleSubmit,
              className: "space-y-6",
              children: [
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Label, { htmlFor: "cardType", children: "Card Type" }),
                    _jsxs(Select, {
                      value: formData.cardType,
                      onValueChange: (v) =>
                        setFormData({ ...formData, cardType: v }),
                      children: [
                        _jsx(SelectTrigger, {
                          children: _jsx(SelectValue, {}),
                        }),
                        _jsxs(SelectContent, {
                          children: [
                            _jsx(SelectItem, {
                              value: "virtual",
                              children: "Virtual Card",
                            }),
                            _jsx(SelectItem, {
                              value: "physical",
                              children: "Physical Card",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Label, {
                      htmlFor: "name",
                      children: "Cardholder Name",
                    }),
                    _jsx(Input, {
                      id: "name",
                      value: formData.cardholderName,
                      onChange: (e) =>
                        setFormData({
                          ...formData,
                          cardholderName: e.target.value,
                        }),
                      placeholder: "John Doe",
                      required: true,
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Label, {
                      htmlFor: "limit",
                      children: "Spending Limit (USD)",
                    }),
                    _jsx(Input, {
                      id: "limit",
                      type: "number",
                      value: formData.spendingLimit,
                      onChange: (e) =>
                        setFormData({
                          ...formData,
                          spendingLimit: e.target.value,
                        }),
                      placeholder: "1000",
                      required: true,
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "space-y-2",
                  children: [
                    _jsx(Label, { htmlFor: "purpose", children: "Purpose" }),
                    _jsxs(Select, {
                      value: formData.purpose,
                      onValueChange: (v) =>
                        setFormData({ ...formData, purpose: v }),
                      children: [
                        _jsx(SelectTrigger, {
                          children: _jsx(SelectValue, {}),
                        }),
                        _jsxs(SelectContent, {
                          children: [
                            _jsx(SelectItem, {
                              value: "business",
                              children: "Business Expenses",
                            }),
                            _jsx(SelectItem, {
                              value: "personal",
                              children: "Personal Use",
                            }),
                            _jsx(SelectItem, {
                              value: "travel",
                              children: "Travel",
                            }),
                            _jsx(SelectItem, {
                              value: "subscription",
                              children: "Subscriptions",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx(Button, {
                  type: "submit",
                  className: "w-full",
                  disabled: loading,
                  children: loading ? "Issuing Card..." : "Issue Card",
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
