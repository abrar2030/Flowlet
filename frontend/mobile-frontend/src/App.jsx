import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useTheme, useOnlineStatus } from './hooks/index.js';
import { useUIStore } from './store/useUIStore.js';

// Layout Components
import Layout from './components/common/Layout.jsx';
import LoadingScreen from './components/common/LoadingScreen.jsx';
import OfflineIndicator from './components/common/OfflineIndicator.jsx';

// Auth Components
import LoginScreen from './components/auth/LoginScreen.jsx';
import RegisterScreen from './components/auth/RegisterScreen.jsx';
import OnboardingFlow from './components/auth/OnboardingFlow.jsx';

// Main App Components
import Dashboard from './components/wallet/Dashboard.jsx';
import WalletScreen from './components/wallet/WalletScreen.jsx';
import TransactionHistory from './components/wallet/TransactionHistory.jsx';
import SendMoney from './components/wallet/SendMoney.jsx';
import ReceiveMoney from './components/wallet/ReceiveMoney.jsx';

// Card Components
import CardsScreen from './components/cards/CardsScreen.jsx';
import CardDetails from './components/cards/CardDetails.jsx';
import IssueCard from './components/cards/IssueCard.jsx';

// Analytics Components
import AnalyticsScreen from './components/analytics/AnalyticsScreen.jsx';

// AI Components
import ChatbotScreen from './components/ai/ChatbotScreen.jsx';
import FraudAlerts from './components/ai/FraudAlerts.jsx';
import AIFraudDetectionScreen from './components/ai/AIFraudDetectionScreen.jsx';

// Security Components
import SecurityScreen from './components/security/SecurityScreen.jsx';
import SettingsScreen from './components/security/SettingsScreen.jsx';
import EnhancedSecurityScreen from './components/security/EnhancedSecurityScreen.jsx';

// Financial Components
import AdvancedBudgetingScreen from './components/financial/AdvancedBudgetingScreen.jsx';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const isOnline = useOnlineStatus();
  const { setOnlineStatus } = useUIStore();

  // Update online status in store
  useEffect(() => {
    setOnlineStatus(isOnline);
  }, [isOnline, setOnlineStatus]);

  // Show loading screen during initial auth check
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${theme}`}>
      <Router>
        {/* Offline Indicator */}
        {!isOnline && <OfflineIndicator />}
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginScreen />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterScreen />
              </PublicRoute>
            } 
          />
          <Route 
            path="/onboarding" 
            element={
              <PublicRoute>
                <OnboardingFlow />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Wallet Routes */}
            <Route path="wallet" element={<WalletScreen />} />
            <Route path="wallet/transactions" element={<TransactionHistory />} />
            <Route path="wallet/send" element={<SendMoney />} />
            <Route path="wallet/receive" element={<ReceiveMoney />} />
            
            {/* Card Routes */}
            <Route path="cards" element={<CardsScreen />} />
            <Route path="cards/:cardId" element={<CardDetails />} />
            <Route path="cards/issue" element={<IssueCard />} />
            
            {/* Analytics */}
            <Route path="analytics" element={<AnalyticsScreen />} />
            
            {/* Financial Planning */}
            <Route path="financial-planning" element={<AdvancedBudgetingScreen />} />
            <Route path="budgeting" element={<AdvancedBudgetingScreen />} />
            
            {/* AI Features */}
            <Route path="chat" element={<ChatbotScreen />} />
            <Route path="alerts" element={<FraudAlerts />} />
            <Route path="fraud-detection" element={<AIFraudDetectionScreen />} />
            
            {/* Security & Settings */}
            <Route path="security" element={<SecurityScreen />} />
            <Route path="security/advanced" element={<EnhancedSecurityScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>

          {/* Catch all route */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

