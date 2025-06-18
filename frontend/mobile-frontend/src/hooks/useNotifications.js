import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService.js';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize notifications on mount
  useEffect(() => {
    const initializeNotifications = async () => {
      setIsLoading(true);
      try {
        const initialized = await notificationService.initialize();
        const status = await notificationService.getSubscriptionStatus();
        
        setIsSupported(status.supported);
        setIsSubscribed(status.subscribed);
        setPermission(status.permission || 'default');
      } catch (error) {
        console.error('Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setIsLoading(true);
    try {
      const subscription = await notificationService.subscribe();
      if (subscription) {
        setIsSubscribed(true);
        return subscription;
      } else {
        throw new Error('Failed to subscribe to push notifications');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await notificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send different types of notifications
  const sendTransactionNotification = useCallback((transaction) => {
    notificationService.sendTransactionNotification(transaction);
  }, []);

  const sendSecurityAlert = useCallback((alert) => {
    notificationService.sendSecurityAlert(alert);
  }, []);

  const sendCardAlert = useCallback((card, action) => {
    notificationService.sendCardAlert(card, action);
  }, []);

  const showNotification = useCallback((title, options) => {
    notificationService.showNotification(title, options);
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendTransactionNotification,
    sendSecurityAlert,
    sendCardAlert,
    showNotification
  };
};

