import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Shield,
  Smartphone,
  Key,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Download,
  Upload,
  Fingerprint,
  Mail
} from 'lucide-react';

interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'backup_codes' | 'biometric';
  name: string;
  description: string;
  enabled: boolean;
  verified: boolean;
  lastUsed?: string;
  metadata?: Record<string, any>;
}

interface MFASetupProps {
  currentMethods?: MFAMethod[];
  onMethodEnable?: (method: MFAMethod) => Promise<void>;
  onMethodDisable?: (methodId: string) => Promise<void>;
  onMethodVerify?: (methodId: string, code: string) => Promise<boolean>;
  onGenerateBackupCodes?: () => Promise<string[]>;
  onDownloadBackupCodes?: (codes: string[]) => void;
  requireMultipleMethods?: boolean;
  className?: string;
}

interface SetupState {
  activeTab: string;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  totpSecret: string | null;
  totpQrCode: string | null;
  verificationCode: string;
  backupCodes: string[];
  phoneNumber: string;
  emailAddress: string;
  biometricSupported: boolean;
  setupProgress: number;
}

export function MFASetup({
  currentMethods = [],
  onMethodEnable,
  onMethodDisable,
  onMethodVerify,
  onGenerateBackupCodes,
  onDownloadBackupCodes,
  requireMultipleMethods = true,
  className = ''
}: MFASetupProps) {
  const [state, setState] = useState<SetupState>({
    activeTab: 'overview',
    isLoading: false,
    error: null,
    success: null,
    totpSecret: null,
    totpQrCode: null,
    verificationCode: '',
    backupCodes: [],
    phoneNumber: '',
    emailAddress: '',
    biometricSupported: false,
    setupProgress: 0
  });

  // Check biometric support
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        try {
          const available = await (navigator.credentials as any).get({
            publicKey: {
              challenge: new Uint8Array(32),
              rp: { name: 'Test' },
              user: {
                id: new Uint8Array(16),
                name: 'test',
                displayName: 'Test'
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
              timeout: 1000
            }
          });
          setState(prev => ({ ...prev, biometricSupported: true }));
        } catch (error) {
          // Biometric not available or user cancelled
          setState(prev => ({ ...prev, biometricSupported: false }));
        }
      }
    };

    checkBiometricSupport();
  }, []);

  // Calculate setup progress
  useEffect(() => {
    const enabledMethods = currentMethods.filter(m => m.enabled && m.verified);
    const totalMethods = 4; // TOTP, SMS, Email, Backup Codes
    const progress = (enabledMethods.length / totalMethods) * 100;
    setState(prev => ({ ...prev, setupProgress: Math.min(100, progress) }));
  }, [currentMethods]);

  const handleMethodToggle = useCallback(async (method: MFAMethod) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (method.enabled) {
        if (onMethodDisable) {
          await onMethodDisable(method.id);
          setState(prev => ({ ...prev, success: `${method.name} disabled successfully` }));
        }
      } else {
        if (onMethodEnable) {
          await onMethodEnable(method);
          setState(prev => ({ ...prev, success: `${method.name} enabled successfully` }));
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to ${method.enabled ? 'disable' : 'enable'} ${method.name}`
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [onMethodEnable, onMethodDisable]);

  const handleVerification = useCallback(async (methodId: string) => {
    if (!state.verificationCode.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter verification code' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (onMethodVerify) {
        const success = await onMethodVerify(methodId, state.verificationCode);
        if (success) {
          setState(prev => ({
            ...prev,
            success: 'Method verified successfully',
            verificationCode: ''
          }));
        } else {
          setState(prev => ({ ...prev, error: 'Invalid verification code' }));
        }
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Verification failed' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.verificationCode, onMethodVerify]);

  const handleGenerateBackupCodes = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (onGenerateBackupCodes) {
        const codes = await onGenerateBackupCodes();
        setState(prev => ({
          ...prev,
          backupCodes: codes,
          success: 'Backup codes generated successfully'
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to generate backup codes' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [onGenerateBackupCodes]);

  const handleDownloadBackupCodes = useCallback(() => {
    if (onDownloadBackupCodes && state.backupCodes.length > 0) {
      onDownloadBackupCodes(state.backupCodes);
    }
  }, [onDownloadBackupCodes, state.backupCodes]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setState(prev => ({ ...prev, success: 'Copied to clipboard' }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to copy to clipboard' }));
    }
  }, []);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'totp': return <Key className="w-5 h-5" />;
      case 'sms': return <Smartphone className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'backup_codes': return <Download className="w-5 h-5" />;
      case 'biometric': return <Fingerprint className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getMethodStatus = (method: MFAMethod) => {
    if (!method.enabled) return { color: 'bg-gray-100 text-gray-600', text: 'Disabled' };
    if (!method.verified) return { color: 'bg-yellow-100 text-yellow-600', text: 'Pending' };
    return { color: 'bg-green-100 text-green-600', text: 'Active' };
  };

  const enabledMethods = currentMethods.filter(m => m.enabled && m.verified);
  const isSecure = enabledMethods.length >= (requireMultipleMethods ? 2 : 1);

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-3 text-blue-600" />
              Multi-Factor Authentication Setup
            </div>
            <Badge className={isSecure ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
              {isSecure ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Secure
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs Setup
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Setup Progress</span>
                <span>{Math.round(state.setupProgress)}%</span>
              </div>
              <Progress value={state.setupProgress} className="h-2" />
            </div>

            <p className="text-sm text-gray-600">
              Multi-factor authentication adds an extra layer of security to your account.
              {requireMultipleMethods && ' We recommend enabling at least two methods.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {state.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{state.success}</AlertDescription>
        </Alert>
      )}

      {/* MFA Methods */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="totp">Authenticator</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4">
            {currentMethods.map((method) => {
              const status = getMethodStatus(method);
              return (
                <Card key={method.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getMethodIcon(method.type)}
                        <div>
                          <h3 className="font-medium">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.description}</p>
                          {method.lastUsed && (
                            <p className="text-xs text-gray-500">
                              Last used: {new Date(method.lastUsed).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={status.color}>{status.text}</Badge>
                        <Button
                          onClick={() => handleMethodToggle(method)}
                          disabled={state.isLoading}
                          size="sm"
                          variant={method.enabled ? "destructive" : "default"}
                        >
                          {method.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TOTP Tab */}
        <TabsContent value="totp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Authenticator App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Use an authenticator app like Google Authenticator, Authy, or 1Password to generate time-based codes.
              </p>

              {state.totpQrCode && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white border rounded-lg">
                      <QrCode className="w-32 h-32 text-gray-400" />
                      <p className="text-xs text-center mt-2">QR Code Placeholder</p>
                    </div>
                  </div>

                  <div>
                    <Label>Manual Entry Key</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        value={state.totpSecret || ''}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(state.totpSecret || '')}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <div className="flex space-x-2">
                  <Input
                    value={state.verificationCode}
                    onChange={(e) => setState(prev => ({ ...prev, verificationCode: e.target.value }))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="font-mono"
                  />
                  <Button
                    onClick={() => handleVerification('totp')}
                    disabled={state.isLoading || !state.verificationCode}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                SMS Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Receive verification codes via SMS to your mobile phone.
              </p>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={state.phoneNumber}
                  onChange={(e) => setState(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <div className="flex space-x-2">
                  <Input
                    value={state.verificationCode}
                    onChange={(e) => setState(prev => ({ ...prev, verificationCode: e.target.value }))}
                    placeholder="Enter code from SMS"
                    maxLength={6}
                    className="font-mono"
                  />
                  <Button
                    onClick={() => handleVerification('sms')}
                    disabled={state.isLoading || !state.verificationCode}
                  >
                    Verify
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => {/* Send SMS code */}}
                disabled={state.isLoading || !state.phoneNumber}
                variant="outline"
                className="w-full"
              >
                Send Verification Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Receive verification codes via email as a backup method.
              </p>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={state.emailAddress}
                  onChange={(e) => setState(prev => ({ ...prev, emailAddress: e.target.value }))}
                  placeholder="your.email@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <div className="flex space-x-2">
                  <Input
                    value={state.verificationCode}
                    onChange={(e) => setState(prev => ({ ...prev, verificationCode: e.target.value }))}
                    placeholder="Enter code from email"
                    maxLength={6}
                    className="font-mono"
                  />
                  <Button
                    onClick={() => handleVerification('email')}
                    disabled={state.isLoading || !state.verificationCode}
                  >
                    Verify
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => {/* Send email code */}}
                disabled={state.isLoading || !state.emailAddress}
                variant="outline"
                className="w-full"
              >
                Send Verification Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Codes Tab */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Backup Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Backup codes can be used when your other MFA methods are unavailable.
                Each code can only be used once.
              </p>

              {state.backupCodes.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                    {state.backupCodes.map((code, index) => (
                      <div key={index} className="font-mono text-sm p-2 bg-white rounded border">
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleDownloadBackupCodes}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(state.backupCodes.join('\n'))}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                  </div>

                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Store these codes in a safe place. They won't be shown again.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateBackupCodes}
                  disabled={state.isLoading}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
                  Generate Backup Codes
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MFASetup;
