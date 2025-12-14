import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your Flowlet AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand your question. Let me help you with that...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };
  return _jsx("div", {
    className: "container mx-auto p-6 max-w-4xl",
    children: _jsxs(Card, {
      className: "h-[calc(100vh-12rem)]",
      children: [
        _jsx(CardHeader, {
          children: _jsxs(CardTitle, {
            className: "flex items-center gap-2",
            children: [
              _jsx(Bot, { className: "h-6 w-6 text-primary" }),
              "AI Assistant",
            ],
          }),
        }),
        _jsxs(CardContent, {
          className: "flex flex-col h-full",
          children: [
            _jsx("div", {
              className: "flex-1 overflow-y-auto space-y-4 mb-4",
              children: messages.map((message) =>
                _jsxs(
                  "div",
                  {
                    className: `flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`,
                    children: [
                      message.role === "assistant" &&
                        _jsx(Bot, {
                          className: "h-8 w-8 text-primary flex-shrink-0",
                        }),
                      _jsx("div", {
                        className: `max-w-[70%] rounded-lg p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`,
                        children: message.content,
                      }),
                      message.role === "user" &&
                        _jsx(User, { className: "h-8 w-8 flex-shrink-0" }),
                    ],
                  },
                  message.id,
                ),
              ),
            }),
            _jsxs("div", {
              className: "flex gap-2",
              children: [
                _jsx(Input, {
                  value: input,
                  onChange: (e) => setInput(e.target.value),
                  onKeyPress: (e) => e.key === "Enter" && handleSend(),
                  placeholder: "Ask me anything about your finances...",
                }),
                _jsx(Button, {
                  onClick: handleSend,
                  size: "icon",
                  children: _jsx(Send, { className: "h-4 w-4" }),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
