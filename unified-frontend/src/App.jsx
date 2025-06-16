import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layout Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import OfflineIndicator from './components/OfflineIndicator';

// Auth Components
import LoginScreen from './components/auth/LoginScreen';
import RegisterScreen from './components/auth/RegisterScreen';
import OnboardingFlow from './components/auth/OnboardingFlow';

// Main App Components
import Dashboard from './components/wallet/Dashboard';
import WalletScreen from './components/wallet/WalletScreen';
import TransactionHistory from './components/wallet/TransactionHistory';
import SendMoney from './components/wallet/SendMoney';
import ReceiveMoney from './components/wallet/ReceiveMoney';

// Card Components
import CardsScreen from './components/cards/CardsScreen';
import CardDetails from './components/cards/CardDetails';
import IssueCard from './components/cards/IssueCard';

// Analytics Components
import AnalyticsScreen from './components/analytics/AnalyticsScreen';

// AI Components
import ChatbotScreen from './components/ai/ChatbotScreen';
import FraudAlerts from './components/ai/FraudAlerts';
import AIFraudDetectionScreen from './components/ai/AIFraudDetectionScreen';

// Security Components
import SecurityScreen from './components/security/SecurityScreen';
import SettingsScreen from './components/security/SettingsScreen';
import EnhancedSecurityScreen from './components/security/EnhancedSecurityScreen';

// Financial Components
import AdvancedBudgetingScreen from './components/financial/AdvancedBudgetingScreen';

// Web-specific pages
import HomePage from './components/web/HomePage';
import PaymentsPage from './components/web/PaymentsPage';
import CompliancePage from './components/web/CompliancePage';
import DeveloperPortalPage from './components/web/DeveloperPortalPage';

import './App.css';

// Custom hooks for unified functionality
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token with backend
      setIsAuthenticated(true);
      setUser({ id: 1, name: 'Demo User', email: 'demo@flowlet.com' });
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('authToken', 'demo-token');
      setIsAuthenticated(true);
      setUser({ id: 1, name: 'Demo User', email: credentials.email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  return { isAuthenticated, isLoading, user, login, logout };
};

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

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
  const isOnline = useOnlineStatus();
  const { isMobile } = useResponsive();

  // Show loading screen during initial auth check
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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

          {/* Public web pages */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/developer" element={<DeveloperPortalPage />} />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout isMobile={isMobile} />
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
                <Navigate to="/home" replace />
            } 
          />
        </Routes>
        
        <Toaster position="top-right" />
      </Router>
    </div>
  );
}

export default App;

