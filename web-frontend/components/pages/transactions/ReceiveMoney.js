import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  QrCode,
  Copy,
  Share,
  Download,
  CreditCard,
  Building,
  Globe,
  CheckCircle,
} from "lucide-react";
const ReceiveMoney = ({
  accountDetails = {
    bankName: "Flowlet Bank",
    accountNumber: "1234 5678 9012 3456",
    accountName: "John Doe",
    routingNumber: "021000021",
    swiftCode: "FLOWLTXX",
  },
  qrCodeUrl = "https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=QR+Code",
}) => {
  const [copiedField, setCopiedField] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };
  const shareAccountDetails = async () => {
    const shareData = {
      title: "My Account Details",
      text: `Send money to: ${accountDetails.accountName}\nAccount: ${accountDetails.accountNumber}\nBank: ${accountDetails.bankName}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await copyToClipboard(shareData.text, "share");
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };
  const generatePaymentLink = () => {
    const amount = customAmount ? `?amount=${customAmount}` : "";
    return `https://flowlet.app/pay/${accountDetails.accountNumber}${amount}`;
  };
  const CopyButton = ({ text, fieldName }) =>
    _jsx(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => copyToClipboard(text, fieldName),
      className: "h-8 w-8 p-0",
      children:
        copiedField === fieldName
          ? _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })
          : _jsx(Copy, { className: "h-4 w-4" }),
    });
  return _jsxs("div", {
    className: "container mx-auto p-6 max-w-4xl",
    children: [
      _jsxs("div", {
        className: "flex items-center gap-2 mb-6",
        children: [
          _jsx(QrCode, { className: "h-8 w-8 text-primary" }),
          _jsx("h1", {
            className: "text-3xl font-bold",
            children: "Receive Money",
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
        children: [
          _jsxs(Card, {
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, {
                  className: "text-center",
                  children: "Scan to Pay",
                }),
              }),
              _jsxs(CardContent, {
                className: "text-center space-y-4",
                children: [
                  _jsx("div", {
                    className: "flex justify-center",
                    children: _jsx("div", {
                      className:
                        "p-4 bg-white border-2 border-gray-200 rounded-lg",
                      children: _jsx("img", {
                        src: qrCodeUrl,
                        alt: "Payment QR Code",
                        className: "w-48 h-48 object-contain",
                      }),
                    }),
                  }),
                  _jsx("p", {
                    className: "text-gray-600",
                    children:
                      "Share this QR code with anyone who wants to send you money",
                  }),
                  _jsxs("div", {
                    className: "space-y-2",
                    children: [
                      _jsx(Label, {
                        htmlFor: "customAmount",
                        children: "Request Specific Amount (Optional)",
                      }),
                      _jsxs("div", {
                        className: "flex gap-2",
                        children: [
                          _jsx(Input, {
                            id: "customAmount",
                            type: "number",
                            placeholder: "0.00",
                            value: customAmount,
                            onChange: (e) => setCustomAmount(e.target.value),
                            className: "flex-1",
                          }),
                          _jsx(Button, {
                            variant: "outline",
                            onClick: () =>
                              copyToClipboard(
                                generatePaymentLink(),
                                "paymentLink",
                              ),
                            children:
                              copiedField === "paymentLink"
                                ? _jsx(CheckCircle, {
                                    className: "h-4 w-4 text-green-600",
                                  })
                                : _jsx(Copy, { className: "h-4 w-4" }),
                          }),
                        ],
                      }),
                      customAmount &&
                        _jsxs("p", {
                          className: "text-sm text-gray-500",
                          children: ["Payment link: ", generatePaymentLink()],
                        }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex gap-2",
                    children: [
                      _jsxs(Button, {
                        variant: "outline",
                        onClick: shareAccountDetails,
                        className: "flex-1",
                        children: [
                          _jsx(Share, { className: "h-4 w-4 mr-2" }),
                          "Share",
                        ],
                      }),
                      _jsxs(Button, {
                        variant: "outline",
                        className: "flex-1",
                        children: [
                          _jsx(Download, { className: "h-4 w-4 mr-2" }),
                          "Download QR",
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsxs(Card, {
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, { children: "Account Details" }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsx(Alert, {
                    children: _jsx(AlertDescription, {
                      children:
                        "Share these details with anyone who wants to send you money via bank transfer.",
                    }),
                  }),
                  _jsxs("div", {
                    className: "space-y-4",
                    children: [
                      _jsxs("div", {
                        className:
                          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [
                              _jsx(Building, {
                                className: "h-5 w-5 text-gray-600",
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx("p", {
                                    className: "font-medium",
                                    children: "Bank Name",
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600",
                                    children: accountDetails.bankName,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsx(CopyButton, {
                            text: accountDetails.bankName,
                            fieldName: "bankName",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className:
                          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [
                              _jsx(CreditCard, {
                                className: "h-5 w-5 text-gray-600",
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx("p", {
                                    className: "font-medium",
                                    children: "Account Number",
                                  }),
                                  _jsx("p", {
                                    className:
                                      "text-sm text-gray-600 font-mono",
                                    children: accountDetails.accountNumber,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsx(CopyButton, {
                            text: accountDetails.accountNumber,
                            fieldName: "accountNumber",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className:
                          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [
                              _jsx("div", {
                                className:
                                  "h-5 w-5 bg-gray-600 rounded-full flex items-center justify-center",
                                children: _jsx("span", {
                                  className: "text-white text-xs font-bold",
                                  children: "A",
                                }),
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx("p", {
                                    className: "font-medium",
                                    children: "Account Name",
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600",
                                    children: accountDetails.accountName,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsx(CopyButton, {
                            text: accountDetails.accountName,
                            fieldName: "accountName",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className:
                          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [
                              _jsx("div", {
                                className:
                                  "h-5 w-5 bg-gray-600 rounded flex items-center justify-center",
                                children: _jsx("span", {
                                  className: "text-white text-xs font-bold",
                                  children: "#",
                                }),
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx("p", {
                                    className: "font-medium",
                                    children: "Routing Number",
                                  }),
                                  _jsx("p", {
                                    className:
                                      "text-sm text-gray-600 font-mono",
                                    children: accountDetails.routingNumber,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsx(CopyButton, {
                            text: accountDetails.routingNumber,
                            fieldName: "routingNumber",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className:
                          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [
                              _jsx(Globe, {
                                className: "h-5 w-5 text-gray-600",
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx("p", {
                                    className: "font-medium",
                                    children: "SWIFT/BIC Code",
                                  }),
                                  _jsx("p", {
                                    className:
                                      "text-sm text-gray-600 font-mono",
                                    children: accountDetails.swiftCode,
                                  }),
                                  _jsx(Badge, {
                                    variant: "secondary",
                                    className: "mt-1",
                                    children: "International Transfers",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsx(CopyButton, {
                            text: accountDetails.swiftCode,
                            fieldName: "swiftCode",
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsx(Button, {
                    variant: "outline",
                    className: "w-full",
                    onClick: () => {
                      const allDetails = `Bank: ${accountDetails.bankName}\nAccount: ${accountDetails.accountNumber}\nName: ${accountDetails.accountName}\nRouting: ${accountDetails.routingNumber}\nSWIFT: ${accountDetails.swiftCode}`;
                      copyToClipboard(allDetails, "allDetails");
                    },
                    children:
                      copiedField === "allDetails"
                        ? _jsxs(_Fragment, {
                            children: [
                              _jsx(CheckCircle, {
                                className: "h-4 w-4 mr-2 text-green-600",
                              }),
                              "Copied All Details",
                            ],
                          })
                        : _jsxs(_Fragment, {
                            children: [
                              _jsx(Copy, { className: "h-4 w-4 mr-2" }),
                              "Copy All Details",
                            ],
                          }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsx(Card, {
        className: "mt-6",
        children: _jsx(CardContent, {
          className: "pt-6",
          children: _jsx(Alert, {
            children: _jsxs(AlertDescription, {
              children: [
                _jsx("strong", { children: "Security Notice:" }),
                " Only share your account details with trusted parties. Never share your login credentials, PIN, or passwords with anyone.",
              ],
            }),
          }),
        }),
      }),
    ],
  });
};
export default ReceiveMoney;
