import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS, THEME_CONFIG } from '../services/constants.js';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (accessToken, refreshToken) => set({ 
        accessToken, 
        refreshToken, 
        isAuthenticated: !!accessToken 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null, 
        isAuthenticated: false,
        error: null 
      }),
      
      // Getters
      getUser: () => get().user,
      getAccessToken: () => get().accessToken,
      isLoggedIn: () => get().isAuthenticated && !!get().accessToken,
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Wallet Store
export const useWalletStore = create((set, get) => ({
  // State
  wallets: [],
  activeWallet: null,
  balance: null,
  transactions: [],
  isLoading: false,
  error: null,
  
  // Actions
  setWallets: (wallets) => set({ wallets }),
  
  setActiveWallet: (wallet) => set({ activeWallet: wallet }),
  
  setBalance: (balance) => set({ balance }),
  
  setTransactions: (transactions) => set({ transactions }),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  })),
  
  updateWallet: (walletId, updates) => set((state) => ({
    wallets: state.wallets.map(wallet => 
      wallet.id === walletId ? { ...wallet, ...updates } : wallet
    ),
    activeWallet: state.activeWallet?.id === walletId 
      ? { ...state.activeWallet, ...updates } 
      : state.activeWallet
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Getters
  getActiveWallet: () => get().activeWallet,
  getWalletById: (id) => get().wallets.find(wallet => wallet.id === id),
  getTotalBalance: () => get().wallets.reduce((total, wallet) => total + (wallet.balance || 0), 0),
}));

// Card Store
export const useCardStore = create((set, get) => ({
  // State
  cards: [],
  activeCard: null,
  cardTransactions: [],
  isLoading: false,
  error: null,
  
  // Actions
  setCards: (cards) => set({ cards }),
  
  setActiveCard: (card) => set({ activeCard: card }),
  
  setCardTransactions: (transactions) => set({ cardTransactions: transactions }),
  
  addCard: (card) => set((state) => ({
    cards: [...state.cards, card]
  })),
  
  updateCard: (cardId, updates) => set((state) => ({
    cards: state.cards.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    ),
    activeCard: state.activeCard?.id === cardId 
      ? { ...state.activeCard, ...updates } 
      : state.activeCard
  })),
  
  removeCard: (cardId) => set((state) => ({
    cards: state.cards.filter(card => card.id !== cardId),
    activeCard: state.activeCard?.id === cardId ? null : state.activeCard
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Getters
  getActiveCard: () => get().activeCard,
  getCardById: (id) => get().cards.find(card => card.id === id),
  getActiveCards: () => get().cards.filter(card => card.status === 'active'),
}));

// UI Store
export const useUIStore = create(
  persist(
    (set, get) => ({
      // State
      theme: THEME_CONFIG.SYSTEM,
      isDarkMode: false,
      language: 'en',
      notifications: [],
      isOnline: navigator.onLine,
      sidebarOpen: false,
      
      // Actions
      setTheme: (theme) => set({ theme }),
      
      setDarkMode: (isDarkMode) => set({ isDarkMode }),
      
      setLanguage: (language) => set({ language }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, { 
          id: Date.now(), 
          timestamp: new Date().toISOString(),
          ...notification 
        }]
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notif => notif.id !== id)
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Getters
      getTheme: () => get().theme,
      getNotifications: () => get().notifications,
      getUnreadNotifications: () => get().notifications.filter(notif => !notif.read),
    }),
    {
      name: STORAGE_KEYS.THEME,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

// Analytics Store
export const useAnalyticsStore = create((set, get) => ({
  // State
  insights: null,
  spendingData: [],
  incomeData: [],
  categoryBreakdown: [],
  monthlyTrends: [],
  isLoading: false,
  error: null,
  
  // Actions
  setInsights: (insights) => set({ insights }),
  
  setSpendingData: (data) => set({ spendingData: data }),
  
  setIncomeData: (data) => set({ incomeData: data }),
  
  setCategoryBreakdown: (data) => set({ categoryBreakdown: data }),
  
  setMonthlyTrends: (data) => set({ monthlyTrends: data }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Getters
  getInsights: () => get().insights,
  getSpendingTotal: () => get().spendingData.reduce((total, item) => total + item.amount, 0),
  getIncomeTotal: () => get().incomeData.reduce((total, item) => total + item.amount, 0),
}));

// AI Store
export const useAIStore = create((set, get) => ({
  // State
  chatMessages: [],
  fraudAlerts: [],
  recommendations: [],
  isTyping: false,
  isLoading: false,
  error: null,
  
  // Actions
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...message
    }]
  })),
  
  setChatMessages: (messages) => set({ chatMessages: messages }),
  
  setFraudAlerts: (alerts) => set({ fraudAlerts: alerts }),
  
  addFraudAlert: (alert) => set((state) => ({
    fraudAlerts: [alert, ...state.fraudAlerts]
  })),
  
  setRecommendations: (recommendations) => set({ recommendations }),
  
  setTyping: (isTyping) => set({ isTyping }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  clearChat: () => set({ chatMessages: [] }),
  
  // Getters
  getChatMessages: () => get().chatMessages,
  getActiveFraudAlerts: () => get().fraudAlerts.filter(alert => alert.status === 'active'),
  getHighPriorityAlerts: () => get().fraudAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical'),
}));

// Security Store
export const useSecurityStore = create((set, get) => ({
  // State
  apiKeys: [],
  auditLogs: [],
  securityReport: null,
  biometricEnabled: false,
  twoFactorEnabled: false,
  isLoading: false,
  error: null,
  
  // Actions
  setApiKeys: (keys) => set({ apiKeys: keys }),
  
  addApiKey: (key) => set((state) => ({
    apiKeys: [...state.apiKeys, key]
  })),
  
  removeApiKey: (keyId) => set((state) => ({
    apiKeys: state.apiKeys.filter(key => key.id !== keyId)
  })),
  
  setAuditLogs: (logs) => set({ auditLogs: logs }),
  
  setSecurityReport: (report) => set({ securityReport: report }),
  
  setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
  
  setTwoFactorEnabled: (enabled) => set({ twoFactorEnabled: enabled }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Getters
  getActiveApiKeys: () => get().apiKeys.filter(key => key.is_active),
  getRecentAuditLogs: () => get().auditLogs.slice(0, 10),
}));

// Global store selector hooks
export const useStore = () => ({
  auth: useAuthStore(),
  wallet: useWalletStore(),
  card: useCardStore(),
  ui: useUIStore(),
  analytics: useAnalyticsStore(),
  ai: useAIStore(),
  security: useSecurityStore(),
});

// Store reset function for logout
export const resetAllStores = () => {
  useWalletStore.getState().setWallets([]);
  useWalletStore.getState().setActiveWallet(null);
  useWalletStore.getState().setBalance(null);
  useWalletStore.getState().setTransactions([]);
  
  useCardStore.getState().setCards([]);
  useCardStore.getState().setActiveCard(null);
  useCardStore.getState().setCardTransactions([]);
  
  useAnalyticsStore.getState().setInsights(null);
  useAnalyticsStore.getState().setSpendingData([]);
  useAnalyticsStore.getState().setIncomeData([]);
  
  useAIStore.getState().setChatMessages([]);
  useAIStore.getState().setFraudAlerts([]);
  useAIStore.getState().setRecommendations([]);
  
  useSecurityStore.getState().setApiKeys([]);
  useSecurityStore.getState().setAuditLogs([]);
  useSecurityStore.getState().setSecurityReport(null);
  
  useUIStore.getState().clearNotifications();
};

