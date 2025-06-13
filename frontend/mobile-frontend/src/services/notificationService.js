// Push Notification Service
class NotificationService {
  constructor() {
    this.permission = 'default';
    this.registration = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize push notifications
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Request notification permission
      this.permission = await Notification.requestPermission();
      
      if (this.permission === 'granted') {
        // Register service worker
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        return true;
      } else {
        console.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.registration || this.permission !== 'granted') {
      console.warn('Cannot subscribe: service worker not registered or permission denied');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push subscription cancelled');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Show local notification
  showNotification(title, options = {}) {
    if (this.permission === 'granted') {
      const defaultOptions = {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'flowlet-notification',
        requireInteraction: false,
        ...options
      };

      if (this.registration) {
        this.registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    }
  }

  // Send notification for different types of events
  sendTransactionNotification(transaction) {
    const title = transaction.type === 'credit' ? 'Money Received' : 'Payment Sent';
    const body = `${transaction.type === 'credit' ? '+' : '-'}$${transaction.amount} ${transaction.type === 'credit' ? 'from' : 'to'} ${transaction.counterparty}`;
    
    this.showNotification(title, {
      body,
      icon: '/transaction-icon.png',
      data: { type: 'transaction', transactionId: transaction.id }
    });
  }

  sendSecurityAlert(alert) {
    this.showNotification('Security Alert', {
      body: alert.message,
      icon: '/security-icon.png',
      requireInteraction: true,
      data: { type: 'security', alertId: alert.id }
    });
  }

  sendCardAlert(card, action) {
    const title = `Card ${action}`;
    const body = `Your ${card.type} card ending in ${card.lastFour} has been ${action.toLowerCase()}`;
    
    this.showNotification(title, {
      body,
      icon: '/card-icon.png',
      data: { type: 'card', cardId: card.id, action }
    });
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get current subscription status
  async getSubscriptionStatus() {
    if (!this.registration) {
      return { subscribed: false, supported: this.isSupported };
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return {
        subscribed: !!subscription,
        supported: this.isSupported,
        permission: this.permission
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { subscribed: false, supported: this.isSupported };
    }
  }
}

export default new NotificationService();

