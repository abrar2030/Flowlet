import { useState, useEffect, useCallback } from 'react';
import offlineStorageService from '../services/offlineStorageService.js';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineActions, setOfflineActions] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageStats, setStorageStats] = useState(null);

  // Initialize offline storage
  useEffect(() => {
    const initializeOfflineStorage = async () => {
      try {
        await offlineStorageService.initialize();
        setIsInitialized(true);
        
        // Load offline actions
        const actions = await offlineStorageService.getOfflineActions();
        setOfflineActions(actions.filter(action => !action.synced));
        
        // Get storage stats
        const stats = await offlineStorageService.getStorageStats();
        setStorageStats(stats);
      } catch (error) {
        console.error('Error initializing offline storage:', error);
      }
    };

    initializeOfflineStorage();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync offline actions when coming back online
  const syncOfflineActions = useCallback(async () => {
    if (!isInitialized || !isOnline) return;

    try {
      const actions = await offlineStorageService.getOfflineActions();
      const unsyncedActions = actions.filter(action => !action.synced);

      for (const action of unsyncedActions) {
        try {
          // Attempt to sync the action
          await syncAction(action);
          
          // Mark as synced
          await offlineStorageService.markActionSynced(action.id);
          
          // Remove from local state
          setOfflineActions(prev => prev.filter(a => a.id !== action.id));
        } catch (error) {
          console.error('Failed to sync action:', action, error);
        }
      }

      // Update storage stats
      const stats = await offlineStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error syncing offline actions:', error);
    }
  }, [isInitialized, isOnline]);

  // Store action for offline execution
  const storeOfflineAction = useCallback(async (actionType, actionData) => {
    if (!isInitialized) return null;

    try {
      const action = await offlineStorageService.storeOfflineAction({
        type: actionType,
        data: actionData
      });

      setOfflineActions(prev => [...prev, action]);
      return action;
    } catch (error) {
      console.error('Error storing offline action:', error);
      return null;
    }
  }, [isInitialized]);

  // Cache transaction data
  const cacheTransaction = useCallback(async (transaction) => {
    if (!isInitialized) return;

    try {
      await offlineStorageService.cacheTransaction(transaction);
    } catch (error) {
      console.error('Error caching transaction:', error);
    }
  }, [isInitialized]);

  // Get cached transactions
  const getCachedTransactions = useCallback(async () => {
    if (!isInitialized) return [];

    try {
      return await offlineStorageService.getCachedTransactions();
    } catch (error) {
      console.error('Error getting cached transactions:', error);
      return [];
    }
  }, [isInitialized]);

  // Cache user preference
  const cacheUserPreference = useCallback(async (key, value) => {
    if (!isInitialized) return;

    try {
      await offlineStorageService.cacheUserPreference(key, value);
    } catch (error) {
      console.error('Error caching user preference:', error);
    }
  }, [isInitialized]);

  // Get cached user preference
  const getCachedUserPreference = useCallback(async (key) => {
    if (!isInitialized) return null;

    try {
      return await offlineStorageService.getCachedUserPreference(key);
    } catch (error) {
      console.error('Error getting cached user preference:', error);
      return null;
    }
  }, [isInitialized]);

  // Cache API response
  const cacheApiResponse = useCallback(async (endpoint, data, ttl) => {
    if (!isInitialized) return;

    try {
      await offlineStorageService.cacheApiResponse(endpoint, data, ttl);
    } catch (error) {
      console.error('Error caching API response:', error);
    }
  }, [isInitialized]);

  // Get cached API response
  const getCachedApiResponse = useCallback(async (endpoint) => {
    if (!isInitialized) return null;

    try {
      return await offlineStorageService.getCachedApiResponse(endpoint);
    } catch (error) {
      console.error('Error getting cached API response:', error);
      return null;
    }
  }, [isInitialized]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await offlineStorageService.clearAllData();
      setOfflineActions([]);
      setStorageStats(null);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }, [isInitialized]);

  return {
    isOnline,
    isInitialized,
    offlineActions,
    storageStats,
    storeOfflineAction,
    syncOfflineActions,
    cacheTransaction,
    getCachedTransactions,
    cacheUserPreference,
    getCachedUserPreference,
    cacheApiResponse,
    getCachedApiResponse,
    clearOfflineData
  };
};

// Helper function to sync individual actions
async function syncAction(action) {
  // This would typically make API calls to sync the action
  // For now, we'll simulate the sync process
  console.log('Syncing action:', action);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, you would:
  // 1. Make the appropriate API call based on action.type
  // 2. Handle success/failure responses
  // 3. Update local state accordingly
  
  return true;
}

