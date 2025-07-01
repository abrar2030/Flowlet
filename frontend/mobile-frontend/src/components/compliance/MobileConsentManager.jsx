/**
 * Mobile Consent Management Component for Flowlet Financial Application
 * GDPR-compliant consent management optimized for mobile interfaces
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, Cookie, Eye, Target, Settings, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { COMPLIANCE_CONFIG } from '../../config/compliance.js';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const MobileConsentManager = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentView, setCurrentView] = useState('banner'); // banner, details, preferences
  const [consentData, setConsentData] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize consent manager
  useEffect(() => {
    initializeConsent();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeConsent = async () => {
    try {
      // Check for existing consent
      const existingConsent = getStoredConsent();
      
      if (existingConsent) {
        setConsentData(existingConsent);
        setPreferences(existingConsent.categories || {});
        
        // Check if consent needs renewal
        const needsRenewal = checkConsentRenewal(existingConsent);
        if (needsRenewal) {
          setIsVisible(true);
          setCurrentView('renewal');
        }
      } else {
        // First visit - show consent banner
        setIsVisible(true);
        setCurrentView('banner');
        initializeDefaultPreferences();
      }
    } catch (error) {
      console.error('Consent initialization failed:', error);
    }
  };

  const initializeDefaultPreferences = () => {
    const defaultPrefs = {};
    
    Object.entries(COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES).forEach(([key, category]) => {
      defaultPrefs[key] = {
        granted: category.required,
        timestamp: Date.now(),
        required: category.required
      };
    });
    
    setPreferences(defaultPrefs);
  };

  const setupEventListeners = () => {
    // Listen for app state changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for consent requests
    window.addEventListener('requestConsent', handleConsentRequest);
  };

  const cleanupEventListeners = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('requestConsent', handleConsentRequest);
  };

  const handleVisibilityChange = () => {
    if (!document.hidden && isVisible) {
      // App became visible - check consent status
      const consent = getStoredConsent();
      if (consent && checkConsentRenewal(consent)) {
        setCurrentView('renewal');
      }
    }
  };

  const handleConsentRequest = (event) => {
    const { purpose, required } = event.detail;
    
    if (required && !hasValidConsent(purpose)) {
      setIsVisible(true);
      setCurrentView('details');
    }
  };

  const getStoredConsent = () => {
    try {
      const stored = localStorage.getItem('flowlet-consent');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored consent:', error);
      return null;
    }
  };

  const storeConsent = (consent) => {
    try {
      localStorage.setItem('flowlet-consent', JSON.stringify(consent));
      
      // Also store in secure storage if available (native)
      if (Capacitor.isNativePlatform()) {
        // Would use SecureStoragePlugin here
      }
    } catch (error) {
      console.error('Failed to store consent:', error);
    }
  };

  const checkConsentRenewal = (consent) => {
    if (!consent || !consent.timestamp) return true;
    
    const age = Date.now() - consent.timestamp;
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    
    return age > maxAge;
  };

  const hasValidConsent = (purpose) => {
    if (!consentData) return false;
    
    return COMPLIANCE_CONFIG.ComplianceUtils.validateConsent(consentData, purpose);
  };

  const handleAcceptAll = async () => {
    try {
      setIsLoading(true);
      
      // Haptic feedback
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }

      const allGranted = {};
      Object.keys(COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES).forEach(key => {
        allGranted[key] = {
          granted: true,
          timestamp: Date.now(),
          required: COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES[key].required
        };
      });

      await saveConsent(allGranted);
      setHasInteracted(true);
      setIsVisible(false);
    } catch (error) {
      console.error('Accept all failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectOptional = async () => {
    try {
      setIsLoading(true);
      
      // Haptic feedback
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }

      const necessaryOnly = {};
      Object.entries(COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES).forEach(([key, category]) => {
        necessaryOnly[key] = {
          granted: category.required,
          timestamp: Date.now(),
          required: category.required
        };
      });

      await saveConsent(necessaryOnly);
      setHasInteracted(true);
      setIsVisible(false);
    } catch (error) {
      console.error('Reject optional failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsLoading(true);
      
      // Haptic feedback
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }

      await saveConsent(preferences);
      setHasInteracted(true);
      setIsVisible(false);
    } catch (error) {
      console.error('Save preferences failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConsent = async (categories) => {
    const consent = {
      version: '1.0',
      timestamp: Date.now(),
      categories,
      userAgent: navigator.userAgent,
      platform: Capacitor.isNativePlatform() ? 'mobile-native' : 'mobile-web',
      ipAddress: 'client-side', // Would be set by server
      gdprApplies: true
    };

    // Store locally
    storeConsent(consent);
    setConsentData(consent);
    setPreferences(categories);

    // Send to server
    try {
      await fetch('/api/consent/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consent)
      });
    } catch (error) {
      console.error('Failed to record consent on server:', error);
    }

    // Apply consent settings
    applyConsentSettings(categories);
  };

  const applyConsentSettings = (categories) => {
    // Apply analytics consent
    if (categories.ANALYTICS?.granted) {
      // Enable analytics
      window.gtag && window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else {
      // Disable analytics
      window.gtag && window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Apply marketing consent
    if (categories.MARKETING?.granted) {
      // Enable marketing
      window.gtag && window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      });
    } else {
      // Disable marketing
      window.gtag && window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }

    // Dispatch consent change event
    window.dispatchEvent(new CustomEvent('consentChanged', {
      detail: { categories }
    }));
  };

  const togglePreference = (categoryKey) => {
    const category = COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES[categoryKey];
    
    if (category.required) return; // Can't toggle required categories

    setPreferences(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        granted: !prev[categoryKey]?.granted,
        timestamp: Date.now()
      }
    }));

    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const getCategoryIcon = (categoryKey) => {
    const icons = {
      NECESSARY: Shield,
      FUNCTIONAL: Settings,
      ANALYTICS: Eye,
      MARKETING: Target
    };
    return icons[categoryKey] || Cookie;
  };

  const renderBanner = () => (
    <Card className="w-full max-w-sm mx-auto shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription className="text-sm">
          We use cookies and similar technologies to provide our services and improve your experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleAcceptAll}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Accept All'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRejectOptional}
            disabled={isLoading}
            className="w-full"
          >
            Necessary Only
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView('details')}
            className="w-full text-sm"
          >
            Customize Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDetails = () => (
    <Card className="w-full max-w-md mx-auto shadow-lg max-h-[80vh] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Privacy Preferences</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-sm">
          Choose which types of data processing you're comfortable with.
        </CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-4 pb-4">
          {Object.entries(COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES).map(([key, category]) => {
            const Icon = getCategoryIcon(key);
            const isGranted = preferences[key]?.granted || false;
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{category.name}</span>
                    {category.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <Switch
                    checked={isGranted}
                    onCheckedChange={() => togglePreference(key)}
                    disabled={category.required}
                  />
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {category.description}
                </p>
                {key !== 'MARKETING' && <Separator />}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <CardContent className="pt-3 flex-shrink-0">
        <div className="flex gap-2">
          <Button 
            onClick={handleSavePreferences}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('banner')}
            className="flex-1"
          >
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderRenewal = () => (
    <Card className="w-full max-w-sm mx-auto shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Update Privacy Settings
        </CardTitle>
        <CardDescription className="text-sm">
          Your privacy preferences have expired. Please review and update your settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            We've updated our privacy practices. Please review your consent preferences.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => setCurrentView('details')}
            className="w-full"
          >
            Review Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAcceptAll}
            disabled={isLoading}
            className="w-full"
          >
            Keep Current Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
      <div className="w-full animate-in slide-in-from-bottom-4 duration-300">
        {currentView === 'banner' && renderBanner()}
        {currentView === 'details' && renderDetails()}
        {currentView === 'renewal' && renderRenewal()}
      </div>
    </div>
  );
};

// Consent Status Component
export const ConsentStatus = () => {
  const [consentData, setConsentData] = useState(null);

  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem('flowlet-consent');
        if (stored) {
          setConsentData(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load consent data:', error);
      }
    };

    loadConsent();

    // Listen for consent changes
    const handleConsentChange = (event) => {
      setConsentData(prev => ({
        ...prev,
        categories: event.detail.categories
      }));
    };

    window.addEventListener('consentChanged', handleConsentChange);
    
    return () => {
      window.removeEventListener('consentChanged', handleConsentChange);
    };
  }, []);

  if (!consentData) {
    return null;
  }

  const grantedCount = Object.values(consentData.categories || {})
    .filter(category => category.granted).length;
  const totalCount = Object.keys(COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privacy Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span>Consent Categories</span>
          <Badge variant="outline">
            {grantedCount}/{totalCount} Active
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Last updated: {new Date(consentData.timestamp).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

// Consent Hook
export const useConsent = () => {
  const [consentData, setConsentData] = useState(null);

  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem('flowlet-consent');
        if (stored) {
          setConsentData(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load consent data:', error);
      }
    };

    loadConsent();

    const handleConsentChange = (event) => {
      setConsentData(prev => ({
        ...prev,
        categories: event.detail.categories
      }));
    };

    window.addEventListener('consentChanged', handleConsentChange);
    
    return () => {
      window.removeEventListener('consentChanged', handleConsentChange);
    };
  }, []);

  const hasConsent = useCallback((purpose) => {
    if (!consentData) return false;
    return COMPLIANCE_CONFIG.ComplianceUtils.validateConsent(consentData, purpose);
  }, [consentData]);

  const requestConsent = useCallback((purpose, required = false) => {
    window.dispatchEvent(new CustomEvent('requestConsent', {
      detail: { purpose, required }
    }));
  }, []);

  return {
    consentData,
    hasConsent,
    requestConsent
  };
};

export default MobileConsentManager;

