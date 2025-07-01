/**
 * Mobile Navigation Bar Component for Flowlet Financial Application
 * Optimized for mobile touch interfaces with security features
 */

import React, { useState, useEffect } from 'react';
import { Menu, Bell, Shield, User, Settings, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../security/MobileAuthGuard';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const MobileNavbar = () => {
  const { user, logout, sessionTimeRemaining } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    // Load notification count
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // Simulate notification loading
      setNotifications(3);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMenuToggle = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    setShowMenu(!showMenu);
  };

  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatTimeRemaining = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <nav className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMenuToggle}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Flowlet</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sessionTimeRemaining > 0 && sessionTimeRemaining < 5 * 60 * 1000 && (
            <Badge variant="destructive" className="text-xs">
              {formatTimeRemaining(sessionTimeRemaining)}
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          <Button variant="ghost" size="sm" className="p-2">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="bg-background w-80 h-full shadow-lg animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">{user?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3"
                onClick={() => setShowMenu(false)}
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3"
                onClick={() => setShowMenu(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavbar;

