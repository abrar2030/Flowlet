// Offline Storage Service using IndexedDB
class OfflineStorageService {
  constructor() {
    this.dbName = 'FlowletOfflineDB';
    this.dbVersion = 1;
    this.db = null;
  }

  // Initialize IndexedDB
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Generic method to add data to a store
  async addData(storeName, data) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get data from a store
  async getData(storeName, key) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get all data from a store
  async getAllData(storeName) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to update data in a store
  async updateData(storeName, data) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to delete data from a store
  async deleteData(storeName, key) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cache transaction data for offline viewing
  async cacheTransaction(transaction) {
    try {
      await this.addData('transactions', {
        ...transaction,
        cached: true,
        timestamp: Date.now()
      });
    } catch (error) {
      // If transaction already exists, update it
      if (error.name === 'ConstraintError') {
        await this.updateData('transactions', {
          ...transaction,
          cached: true,
          timestamp: Date.now()
        });
      } else {
        throw error;
      }
    }
  }

  // Get cached transactions
  async getCachedTransactions() {
    return await this.getAllData('transactions');
  }

  // Store offline action for later sync
  async storeOfflineAction(action) {
    const offlineAction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action,
      timestamp: Date.now(),
      synced: false
    };

    await this.addData('offlineActions', offlineAction);
    return offlineAction;
  }

  // Get all offline actions
  async getOfflineActions() {
    return await this.getAllData('offlineActions');
  }

  // Mark offline action as synced
  async markActionSynced(actionId) {
    const action = await this.getData('offlineActions', actionId);
    if (action) {
      action.synced = true;
      await this.updateData('offlineActions', action);
    }
  }

  // Remove synced offline action
  async removeOfflineAction(actionId) {
    await this.deleteData('offlineActions', actionId);
  }

  // Cache user preferences
  async cacheUserPreference(key, value) {
    await this.updateData('userPreferences', { key, value, timestamp: Date.now() });
  }

  // Get cached user preference
  async getCachedUserPreference(key) {
    const result = await this.getData('userPreferences', key);
    return result ? result.value : null;
  }

  // Cache API response data
  async cacheApiResponse(endpoint, data, ttl = 300000) { // 5 minutes default TTL
    await this.updateData('cachedData', {
      key: endpoint,
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get cached API response
  async getCachedApiResponse(endpoint) {
    const cached = await this.getData('cachedData', endpoint);
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      await this.deleteData('cachedData', endpoint);
      return null;
    }

    return cached.data;
  }

  // Clear expired cache entries
  async clearExpiredCache() {
    const allCached = await this.getAllData('cachedData');
    const now = Date.now();

    for (const item of allCached) {
      if (now - item.timestamp > item.ttl) {
        await this.deleteData('cachedData', item.key);
      }
    }
  }

  // Get storage usage statistics
  async getStorageStats() {
    const transactions = await this.getAllData('transactions');
    const offlineActions = await this.getAllData('offlineActions');
    const preferences = await this.getAllData('userPreferences');
    const cachedData = await this.getAllData('cachedData');

    return {
      transactions: transactions.length,
      offlineActions: offlineActions.length,
      preferences: preferences.length,
      cachedData: cachedData.length,
      totalItems: transactions.length + offlineActions.length + preferences.length + cachedData.length
    };
  }

  // Clear all offline data
  async clearAllData() {
    const stores = ['transactions', 'offlineActions', 'userPreferences', 'cachedData'];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export default new OfflineStorageService();

