import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import WalletPage from './pages/WalletPage';
import PaymentsPage from './pages/PaymentsPage';
import CardsPage from './pages/CardsPage';
import CompliancePage from './pages/CompliancePage';
import DeveloperPortalPage from './pages/DeveloperPortalPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Navbar 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
              />
              
              <div className="flex">
                <Sidebar 
                  open={sidebarOpen} 
                  setOpen={setSidebarOpen} 
                />
                
                <main className="flex-1 lg:ml-64">
                  <div className="min-h-screen">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/wallet" element={<WalletPage />} />
                      <Route path="/payments" element={<PaymentsPage />} />
                      <Route path="/cards" element={<CardsPage />} />
                      <Route path="/compliance" element={<CompliancePage />} />
                      <Route path="/developer" element={<DeveloperPortalPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </div>
                </main>
              </div>
              
              <Footer />
            </div>
          </Router>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

