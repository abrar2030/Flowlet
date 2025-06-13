import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Wallet, 
  CreditCard, 
  BarChart3, 
  MessageCircle, 
  Shield, 
  Settings,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Sun,
  Moon,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useAuth, useTheme } from '../../hooks/index.js';
import { useUIStore, useAIStore } from '../../store/index.js';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { sidebarOpen, setSidebarOpen, notifications } = useUIStore();
  const { getActiveFraudAlerts } = useAIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const fraudAlerts = getActiveFraudAlerts();
  const unreadNotifications = notifications.filter(n => !n.read);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
    { id: 'cards', label: 'Cards', icon: CreditCard, path: '/cards' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle, path: '/chat' },
    { id: 'security', label: 'Security', icon: Shield, path: '/security' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden bg-card border-b border-border sticky top-0 z-40 safe-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="touch-target"
            >
              <Menu className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Flowlet</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative touch-target"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5" />
              {(unreadNotifications.length > 0 || fraudAlerts.length > 0) && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  {unreadNotifications.length + fraudAlerts.length}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="relative touch-target"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* User Dropdown Menu */}
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-4 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50"
            >
              <div className="p-4 border-b border-border">
                <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={toggleTheme}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 lg:hidden safe-top safe-bottom"
            >
              <MobileSidebar
                navigationItems={navigationItems}
                isActivePath={isActivePath}
                handleNavigation={handleNavigation}
                onClose={() => setSidebarOpen(false)}
                user={user}
                handleLogout={handleLogout}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <div className="w-64 bg-card border-r border-border min-h-screen sticky top-0">
          <DesktopSidebar
            navigationItems={navigationItems}
            isActivePath={isActivePath}
            handleNavigation={handleNavigation}
            user={user}
            handleLogout={handleLogout}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Click outside handler for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

// Mobile Sidebar Component
const MobileSidebar = ({ 
  navigationItems, 
  isActivePath, 
  handleNavigation, 
  onClose, 
  user, 
  handleLogout, 
  toggleTheme, 
  isDarkMode 
}) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-border">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl">Flowlet</span>
      </div>
      
      <Button variant="ghost" size="sm" onClick={onClose} className="touch-target">
        <X className="w-6 h-6" />
      </Button>
    </div>

    {/* User Info */}
    <div className="p-6 border-b border-border">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-medium">{user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-4">
      <div className="space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={isActivePath(item.path) ? "default" : "ghost"}
            className={`w-full justify-start h-12 ${
              isActivePath(item.path) 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            onClick={() => handleNavigation(item.path)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Button>
        ))}
      </div>
    </nav>

    {/* Footer */}
    <div className="p-4 border-t border-border space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={toggleTheme}
      >
        {isDarkMode ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </Button>
      
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-3" />
        Sign Out
      </Button>
    </div>
  </div>
);

// Desktop Sidebar Component
const DesktopSidebar = ({ 
  navigationItems, 
  isActivePath, 
  handleNavigation, 
  user, 
  handleLogout, 
  toggleTheme, 
  isDarkMode 
}) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="p-6 border-b border-border">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl">Flowlet</span>
      </div>
    </div>

    {/* User Info */}
    <div className="p-6 border-b border-border">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-medium">{user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-4">
      <div className="space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={isActivePath(item.path) ? "default" : "ghost"}
            className={`w-full justify-start h-12 ${
              isActivePath(item.path) 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            onClick={() => handleNavigation(item.path)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Button>
        ))}
      </div>
    </nav>

    {/* Footer */}
    <div className="p-4 border-t border-border space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={toggleTheme}
      >
        {isDarkMode ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </Button>
      
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-3" />
        Sign Out
      </Button>
    </div>
  </div>
);

export default Layout;

