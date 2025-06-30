/**
 * GDPR Consent Management Component for Flowlet Financial Application
 * Implements comprehensive consent management for GDPR compliance
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Settings, Info, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { COMPLIANCE_CONFIG, ComplianceUtils } from '../../config/compliance';

const ConsentManager = () => {
  const [consentState, setConsentState] = useState({
    hasConsented: false,
    consentDate: null,
    consentVersion: '1.0',
    categories: {},
    showBanner: false,
    showPreferences: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeConsent();
  }, []);

  const initializeConsent = useCallback(async () => {
    try {
      // Load existing consent from storage
      const savedConsent = localStorage.getItem('gdpr-consent');
      
      if (savedConsent) {
        const consentData = JSON.parse(savedConsent);
        
        // Check if consent is still valid
        if (isConsentValid(consentData)) {
          setConsentState(prev => ({
            ...prev,
            hasConsented: true,
            consentDate: new Date(consentData.consentDate),
            consentVersion: consentData.version,
            categories: consentData.categories,
            showBanner: false
          }));
          
          // Apply consent settings
          applyConsentSettings(consentData.categories);
        } else {
          // Consent expired or invalid, show banner
          setConsentState(prev => ({
            ...prev,
            showBanner: true,
            categories: getDefaultConsentCategories()
          }));
        }
      } else {
        // No existing consent, show banner
        setConsentState(prev => ({
          ...prev,
          showBanner: true,
          categories: getDefaultConsentCategories()
        }));
      }
    } catch (error) {
      console.error('Failed to initialize consent:', error);
      setError('Failed to load consent preferences');
    }
  }, []);

  const isConsentValid = (consentData) => {
    if (!consentData || !consentData.consentDate) return false;
    
    const consentAge = Date.now() - new Date(consentData.consentDate).getTime();
    const maxAge = COMPLIANCE_CONFIG.GDPR.DATA_RETENTION.CONSENT_DATA;
    
    return consentAge < maxAge && consentData.version === '1.0';
  };

  const getDefaultConsentCategories = () => {
    const categories = {};
    COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES.forEach(category => {
      categories[category.id] = {
        ...category,
        enabled: category.required || category.enabled
      };
    });
    return categories;
  };

  const handleAcceptAll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const categories = {};
      COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES.forEach(category => {
        categories[category.id] = {
          ...category,
          enabled: true
        };
      });

      await saveConsent(categories);
      
      setConsentState(prev => ({
        ...prev,
        hasConsented: true,
        consentDate: new Date(),
        categories,
        showBanner: false
      }));

      applyConsentSettings(categories);
    } catch (error) {
      setError('Failed to save consent preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSelected = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await saveConsent(consentState.categories);
      
      setConsentState(prev => ({
        ...prev,
        hasConsented: true,
        consentDate: new Date(),
        showBanner: false
      }));

      applyConsentSettings(consentState.categories);
    } catch (error) {
      setError('Failed to save consent preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const categories = {};
      COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES.forEach(category => {
        categories[category.id] = {
          ...category,
          enabled: category.required // Only keep required categories
        };
      });

      await saveConsent(categories);
      
      setConsentState(prev => ({
        ...prev,
        hasConsented: true,
        consentDate: new Date(),
        categories,
        showBanner: false
      }));

      applyConsentSettings(categories);
    } catch (error) {
      setError('Failed to save consent preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId, enabled) => {
    setConsentState(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryId]: {
          ...prev.categories[categoryId],
          enabled
        }
      }
    }));
  };

  const handleUpdatePreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await saveConsent(consentState.categories);
      
      setConsentState(prev => ({
        ...prev,
        consentDate: new Date(),
        showPreferences: false
      }));

      applyConsentSettings(consentState.categories);
    } catch (error) {
      setError('Failed to update consent preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConsent = async (categories) => {
    const consentData = {
      hasConsented: true,
      consentDate: new Date().toISOString(),
      version: '1.0',
      categories,
      userAgent: navigator.userAgent,
      ipAddress: 'client-side', // Server should log actual IP
      timestamp: Date.now()
    };

    // Save to local storage
    localStorage.setItem('gdpr-consent', JSON.stringify(consentData));

    // Send to server for audit trail
    try {
      await fetch('/api/consent/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consentData)
      });
    } catch (error) {
      console.error('Failed to record consent on server:', error);
      // Don't throw error as local storage save succeeded
    }
  };

  const applyConsentSettings = (categories) => {
    // Apply analytics consent
    if (categories.analytics?.enabled) {
      // Enable analytics tracking
      window.gtag && window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else {
      // Disable analytics tracking
      window.gtag && window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Apply marketing consent
    if (categories.marketing?.enabled) {
      // Enable marketing tracking
      window.gtag && window.gtag('consent', 'update', {
        ad_storage: 'granted'
      });
    } else {
      // Disable marketing tracking
      window.gtag && window.gtag('consent', 'update', {
        ad_storage: 'denied'
      });
    }

    // Apply functional consent
    if (categories.functional?.enabled) {
      // Enable functional cookies
      document.cookie = 'functional_consent=granted; path=/; secure; samesite=strict';
    } else {
      // Clear functional cookies
      document.cookie = 'functional_consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }

    // Dispatch consent change event
    window.dispatchEvent(new CustomEvent('consentChanged', {
      detail: { categories }
    }));
  };

  const withdrawConsent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear consent data
      localStorage.removeItem('gdpr-consent');
      
      // Record withdrawal
      const withdrawalData = {
        action: 'withdraw',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      await fetch('/api/consent/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(withdrawalData)
      });

      // Reset state
      setConsentState({
        hasConsented: false,
        consentDate: null,
        consentVersion: '1.0',
        categories: getDefaultConsentCategories(),
        showBanner: true,
        showPreferences: false
      });

      // Clear all non-essential cookies
      clearNonEssentialCookies();
      
    } catch (error) {
      setError('Failed to withdraw consent');
    } finally {
      setIsLoading(false);
    }
  };

  const clearNonEssentialCookies = () => {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Essential cookies that should not be cleared
    const essentialCookies = ['session', 'csrf', 'auth', 'security'];
    
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      // Don't clear essential cookies
      if (!essentialCookies.some(essential => cookieName.includes(essential))) {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });
  };

  // Consent Banner Component
  const ConsentBanner = () => {
    if (!consentState.showBanner) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
        <div className="container mx-auto p-4">
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">We value your privacy</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies and similar technologies to provide, protect, and improve our services. 
                By clicking "Accept All", you consent to our use of cookies for analytics, marketing, 
                and functional purposes. You can customize your preferences at any time.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConsentState(prev => ({ ...prev, showPreferences: true }))}
                disabled={isLoading}
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                disabled={isLoading}
              >
                Reject All
              </Button>
              
              <Button
                size="sm"
                onClick={handleAcceptAll}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Accept All'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Consent Preferences Dialog
  const ConsentPreferences = () => (
    <Dialog 
      open={consentState.showPreferences} 
      onOpenChange={(open) => setConsentState(prev => ({ ...prev, showPreferences: open }))}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Manage your cookie and privacy preferences. You can change these settings at any time.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {Object.values(consentState.categories).map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    {category.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={category.enabled}
                    onCheckedChange={(enabled) => handleCategoryToggle(category.id, enabled)}
                    disabled={category.required || isLoading}
                  />
                </div>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setConsentState(prev => ({ ...prev, showPreferences: false }))}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePreferences}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Consent Status Component
  const ConsentStatus = () => {
    if (!consentState.hasConsented) return null;

    return (
      <div className="text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="h-3 w-3 text-green-500" />
          <span>
            Consent given on {consentState.consentDate?.toLocaleDateString()}
          </span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => setConsentState(prev => ({ ...prev, showPreferences: true }))}
          >
            Manage preferences
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <ConsentBanner />
      <ConsentPreferences />
      
      {/* Consent management trigger for settings page */}
      <div className="space-y-4">
        <ConsentStatus />
        
        {consentState.hasConsented && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Cookie Preferences
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cookie Preferences</DialogTitle>
                  <DialogDescription>
                    Manage your cookie and privacy preferences.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {Object.values(consentState.categories).map((category) => (
                    <Card key={category.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{category.name}</CardTitle>
                            {category.required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <Switch
                            checked={category.enabled}
                            onCheckedChange={(enabled) => handleCategoryToggle(category.id, enabled)}
                            disabled={category.required || isLoading}
                          />
                        </div>
                        <CardDescription className="text-sm">
                          {category.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="destructive"
                    onClick={withdrawConsent}
                    disabled={isLoading}
                  >
                    Withdraw All Consent
                  </Button>
                  <Button
                    onClick={handleUpdatePreferences}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </>
  );
};

export default ConsentManager;

