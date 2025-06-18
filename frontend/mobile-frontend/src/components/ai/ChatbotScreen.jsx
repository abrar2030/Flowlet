import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Paperclip, 
  MoreVertical,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  DollarSign,
  CreditCard,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import { useAIStore, useUIStore } from '../../store/index.js';
import { aiAPI } from '../../services/api.js';
import { useAuth, useApi, useClipboard } from '../../hooks/index.js';

const ChatbotScreen = () => {
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const { copy } = useClipboard();
  const {
    messages,
    isTyping,
    suggestions,
    setMessages,
    setIsTyping,
    setSuggestions,
    addMessage,
    clearMessages,
  } = useAIStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Mock AI responses and suggestions
  const mockSuggestions = [
    { id: 1, text: "What's my spending this month?", icon: DollarSign },
    { id: 2, text: "Show my card transactions", icon: CreditCard },
    { id: 3, text: "How can I save more money?", icon: TrendingUp },
    { id: 4, text: "Check my account security", icon: Shield },
  ];

  const mockResponses = {
    "spending": {
      text: "Based on your recent activity, you've spent $2,850 this month across all categories. Your biggest expenses were:\n\n• Food & Dining: $850 (30%)\n• Shopping: $650 (23%)\n• Transportation: $420 (15%)\n\nYou're currently 15% under your monthly budget of $3,200. Great job staying on track! 🎉",
      type: "financial_summary"
    },
    "transactions": {
      text: "Here are your recent card transactions:\n\n• Amazon - $45.99 (Shopping)\n• Starbucks - $12.50 (Food & Drink)\n• Shell Gas - $89.00 (Transportation)\n• Netflix - $15.99 (Entertainment)\n\nAll transactions appear normal with no suspicious activity detected. Your cards are secure! 🔒",
      type: "transaction_list"
    },
    "save": {
      text: "I've analyzed your spending patterns and found several ways to save money:\n\n💡 **Smart Suggestions:**\n• Switch to a cheaper phone plan: Save $25/month\n• Cook at home 2 more times per week: Save $120/month\n• Use cashback credit card for groceries: Earn $15/month\n\n📊 **Potential monthly savings: $160**\n\nWould you like me to help you set up automatic savings goals?",
      type: "savings_advice"
    },
    "security": {
      text: "Your account security looks excellent! Here's your security status:\n\n✅ **All Good:**\n• Two-factor authentication enabled\n• Strong password (last updated 2 months ago)\n• No suspicious login attempts\n• All devices recognized\n\n🛡️ **Recommendations:**\n• Consider updating your password every 3 months\n• Enable biometric login for faster access\n\nYour financial data is safe and secure!",
      type: "security_status"
    },
    "default": {
      text: "I'm here to help you with your finances! I can assist you with:\n\n💰 Spending analysis and budgeting\n💳 Card and transaction management\n📊 Financial insights and recommendations\n🔒 Account security and fraud protection\n\nWhat would you like to know about your finances today?",
      type: "general_help"
    }
  };

  useEffect(() => {
    setSuggestions(mockSuggestions);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('spending') || lowerMessage.includes('spent') || lowerMessage.includes('expense')) {
      return mockResponses.spending;
    } else if (lowerMessage.includes('transaction') || lowerMessage.includes('card') || lowerMessage.includes('payment')) {
      return mockResponses.transactions;
    } else if (lowerMessage.includes('save') || lowerMessage.includes('saving') || lowerMessage.includes('budget')) {
      return mockResponses.save;
    } else if (lowerMessage.includes('security') || lowerMessage.includes('safe') || lowerMessage.includes('fraud')) {
      return mockResponses.security;
    } else {
      return mockResponses.default;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    addMessage(userMessage);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse = getAIResponse(inputMessage);
      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        type: aiResponse.type,
        actions: aiResponse.type === 'savings_advice' ? [
          { label: 'Set Savings Goal', action: 'set_goal' },
          { label: 'View Budget', action: 'view_budget' }
        ] : []
      };

      addMessage(botMessage);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion.text);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text) => {
    copy(text);
    addNotification({
      type: 'success',
      title: 'Copied!',
      message: 'Message copied to clipboard.',
    });
  };

  const handleFeedback = (messageId, type) => {
    addNotification({
      type: 'success',
      title: 'Feedback Received',
      message: `Thank you for your ${type} feedback!`,
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'financial_summary':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'transaction_list':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'savings_advice':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'security_status':
        return <Shield className="w-4 h-4 text-green-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border p-4 safe-top"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Flowlet AI Assistant</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={clearMessages}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Flowlet AI!</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  I'm your personal financial assistant. I can help you track spending, 
                  manage budgets, analyze transactions, and provide security insights.
                </p>
                
                {/* Quick Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {mockSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion.id}
                      variant="outline"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="h-auto p-4 flex items-center justify-start space-x-3"
                    >
                      <suggestion.icon className="w-5 h-5 text-primary" />
                      <span>{suggestion.text}</span>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gradient-primary text-white'
                      }`}>
                        {message.sender === 'user' ? 
                          <User className="w-4 h-4" /> : 
                          <Bot className="w-4 h-4" />
                        }
                      </div>
                      
                      {/* Message Content */}
                      <div className={`rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {message.sender === 'bot' && message.type !== 'text' && (
                              <div className="flex items-center space-x-2 mb-2">
                                {getMessageIcon(message.type)}
                                <Badge variant="secondary" className="text-xs">
                                  {message.type.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                            )}
                            
                            <div className="whitespace-pre-wrap text-sm">
                              {message.text}
                            </div>
                            
                            {/* Action Buttons */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="flex space-x-2 mt-3">
                                {message.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Message Actions */}
                          {message.sender === 'bot' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleCopyMessage(message.text)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFeedback(message.id, 'positive')}>
                                  <ThumbsUp className="w-4 h-4 mr-2" />
                                  Helpful
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFeedback(message.id, 'negative')}>
                                  <ThumbsDown className="w-4 h-4 mr-2" />
                                  Not Helpful
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        
                        <p className={`text-xs mt-2 ${
                          message.sender === 'user' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border p-4 safe-bottom"
        >
          <div className="max-w-4xl mx-auto">
            {/* Quick Suggestions (when no messages) */}
            {messages.length === 0 && (
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                {mockSuggestions.slice(0, 3).map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="shrink-0"
                  >
                    <suggestion.icon className="w-4 h-4 mr-2" />
                    {suggestion.text}
                  </Button>
                ))}
              </div>
            )}
            
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your finances..."
                  className="pr-20 min-h-[44px] resize-none"
                  disabled={isLoading || isTyping}
                />
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? 
                      <MicOff className="w-4 h-4 text-red-500" /> : 
                      <Mic className="w-4 h-4" />
                    }
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || isTyping}
                className="h-11 w-11 p-0 gradient-primary text-white"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatbotScreen;

