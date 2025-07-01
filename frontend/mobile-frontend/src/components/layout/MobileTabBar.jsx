/**
 * Mobile Tab Bar Component for Flowlet Financial Application
 * Bottom navigation optimized for mobile touch interfaces
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, ArrowUpDown, Wallet, Settings } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const MobileTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'cards',
      label: 'Cards',
      icon: CreditCard,
      path: '/cards'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ArrowUpDown,
      path: '/transactions'
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      path: '/wallet'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  const handleTabPress = async (tab) => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      navigate(tab.path);
    } catch (error) {
      console.error('Tab navigation failed:', error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab)}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-xs ${isActive ? 'text-primary font-medium' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar;

