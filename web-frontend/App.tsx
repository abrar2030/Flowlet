import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "@/store";

// Layout Components
import Layout from "@/components/Layout";
import LoadingScreen from "@/components/LoadingScreen";
import OfflineIndicator from "@/components/OfflineIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";

// Auth Components
import LoginScreen from "@/components/auth/LoginScreen";
import RegisterScreen from "@/components/auth/RegisterScreen";
import OnboardingFlow from "@/components/auth/OnboardingFlow";

// Page Components - Dashboard & Wallet
import Dashboard from "@/components/wallet/Dashboard";
import WalletScreen from "@/components/pages/wallet/WalletScreen";
import TransactionHistory from "@/components/pages/transactions/TransactionHistory";
import SendMoney from "@/components/pages/transactions/SendMoney";
import ReceiveMoney from "@/components/pages/transactions/ReceiveMoney";

// Card Components
import CardsScreen from "@/components/pages/cards/CardsScreen";
import CardDetails from "@/components/pages/cards/CardDetails";
import IssueCard from "@/components/pages/cards/IssueCard";

// Analytics & AI
import AnalyticsScreen from "@/components/pages/analytics/AnalyticsScreen";
import ChatbotScreen from "@/components/pages/ai/ChatbotScreen";
import FraudAlerts from "@/components/pages/ai/FraudAlerts";
import AIFraudDetectionScreen from "@/components/pages/ai/AIFraudDetectionScreen";

// Security & Settings
import SecurityScreen from "@/components/pages/security/SecurityScreen";
import EnhancedSecurityScreen from "@/components/pages/security/EnhancedSecurityScreen";
import SettingsScreen from "@/components/pages/settings/SettingsScreen";

// Budgeting
import AdvancedBudgetingScreen from "@/components/pages/budgeting/AdvancedBudgetingScreen";

// Public Pages
import HomePage from "@/components/pages/HomePage";
import PaymentsPage from "@/components/pages/PaymentsPage";
import CompliancePage from "@/components/pages/CompliancePage";
import DeveloperPortalPage from "@/components/pages/DeveloperPortalPage";

// Route Guards
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus, useResponsive } from "@/hooks";

import "./App.css";

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const { isMobile } = useResponsive();

  // Show loading screen during initial auth check
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <ErrorBoundary>
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
                <Route
                  path="wallet/transactions"
                  element={<TransactionHistory />}
                />
                <Route path="wallet/send" element={<SendMoney />} />
                <Route path="wallet/receive" element={<ReceiveMoney />} />

                {/* Card Routes */}
                <Route path="cards" element={<CardsScreen />} />
                <Route path="cards/:cardId" element={<CardDetails />} />
                <Route path="cards/issue" element={<IssueCard />} />

                {/* Analytics */}
                <Route path="analytics" element={<AnalyticsScreen />} />

                {/* Financial Planning */}
                <Route
                  path="financial-planning"
                  element={<AdvancedBudgetingScreen />}
                />
                <Route path="budgeting" element={<AdvancedBudgetingScreen />} />

                {/* AI Features */}
                <Route path="chat" element={<ChatbotScreen />} />
                <Route path="alerts" element={<FraudAlerts />} />
                <Route
                  path="fraud-detection"
                  element={<AIFraudDetectionScreen />}
                />

                {/* Security & Settings */}
                <Route path="security" element={<SecurityScreen />} />
                <Route
                  path="security/advanced"
                  element={<EnhancedSecurityScreen />}
                />
                <Route path="settings" element={<SettingsScreen />} />
              </Route>

              {/* Catch all route */}
              <Route
                path="*"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/home" replace />
                  )
                }
              />
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                },
              }}
            />
          </Router>
        </div>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
