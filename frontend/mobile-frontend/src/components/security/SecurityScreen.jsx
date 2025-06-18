import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  QrCode, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  User, 
  Bell, 
  Globe, 
  Download, 
  Trash2, 
  LogOut, 
  RotateCcw,
  Copy,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { useSecurityStore, useUIStore } from '../../store/index.js';
import { securityAPI } from '../../services/api.js';
import { useAuth, useApi, useClipboard } from '../../hooks/index.js';

const SecurityScreen = () => {
  const { user } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification } = useUIStore();
  const { copy } = useClipboard();
  const {
    securitySettings,
    twoFactorEnabled,
    biometricEnabled,
    setSecuritySettings,
    setTwoFactorEnabled,
    setBiometricEnabled,
  } = useSecurityStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Mock security data
  const mockSecuritySettings = {
    two_factor_auth: true,
    biometric_login: true,
    session_timeout: 30,
    login_notifications: true,
    transaction_notifications: true,
    security_alerts: true,
    data_encryption: true,
    auto_logout: true,
    device_trust: true,
    api_access: true
  };

  const mockApiKey = 'sk_live_51H7...8xYz';
  const mockDevices = [
    {
      id: 'device_1',
      name: 'iPhone 15 Pro',
      type: 'mobile',
      location: 'New York, NY',
      last_active: '2025-06-11T14:30:00Z',
      is_current: true,
      trusted: true
    },
    {
      id: 'device_2',
      name: 'MacBook Pro',
      type: 'desktop',
      location: 'New York, NY',
      last_active: '2025-06-10T09:15:00Z',
      is_current: false,
      trusted: true
    },
    {
      id: 'device_3',
      name: 'Chrome Browser',
      type: 'web',
      location: 'Unknown Location',
      last_active: '2025-06-08T16:45:00Z',
      is_current: false,
      trusted: false
    }
  ];

  const mockSessions = [
    {
      id: 'session_1',
      device: 'iPhone 15 Pro',
      location: 'New York, NY',
      ip_address: '192.168.1.100',
      started: '2025-06-11T08:00:00Z',
      last_activity: '2025-06-11T14:30:00Z',
      is_current: true
    },
    {
      id: 'session_2',
      device: 'MacBook Pro',
      location: 'New York, NY',
      ip_address: '192.168.1.101',
      started: '2025-06-10T09:00:00Z',
      last_activity: '2025-06-10T17:30:00Z',
      is_current: false
    }
  ];

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // For demo purposes, use mock data
      setSecuritySettings(mockSecuritySettings);
      setTwoFactorEnabled(mockSecuritySettings.two_factor_auth);
      setBiometricEnabled(mockSecuritySettings.biometric_login);

      // In real implementation:
      // const securityData = await request(() => securityAPI.getSecuritySettings(user.id));
      // setSecuritySettings(securityData);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Load Security Settings',
        message: error.message || 'Could not load security settings.',
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New passwords do not match.',
      });
      return;
    }

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      addNotification({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Password Change Failed',
        message: error.message || 'Failed to change password.',
      });
    }
  };

  const handleToggle2FA = async () => {
    if (!twoFactorEnabled) {
      // Enable 2FA
      setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
      setShow2FADialog(true);
    } else {
      // Disable 2FA
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTwoFactorEnabled(false);
        addNotification({
          type: 'success',
          title: '2FA Disabled',
          message: 'Two-factor authentication has been disabled.',
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Failed to Disable 2FA',
          message: error.message || 'Could not disable two-factor authentication.',
        });
      }
    }
  };

  const handleVerify2FA = async () => {
    try {
      // Mock verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTwoFactorEnabled(true);
      setShow2FADialog(false);
      setVerificationCode('');
      
      addNotification({
        type: 'success',
        title: '2FA Enabled',
        message: 'Two-factor authentication has been enabled successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Verification Failed',
        message: 'Invalid verification code. Please try again.',
      });
    }
  };

  const handleBiometricToggle = async (enabled) => {
    try {
      // Mock biometric setup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBiometricEnabled(enabled);
      
      addNotification({
        type: 'success',
        title: enabled ? 'Biometric Login Enabled' : 'Biometric Login Disabled',
        message: `Biometric authentication has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Biometric Setup Failed',
        message: error.message || 'Could not configure biometric authentication.',
      });
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addNotification({
        type: 'success',
        title: 'Device Revoked',
        message: 'Device access has been revoked successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Revocation Failed',
        message: error.message || 'Could not revoke device access.',
      });
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addNotification({
        type: 'success',
        title: 'Session Ended',
        message: 'Session has been terminated successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Session End Failed',
        message: error.message || 'Could not end session.',
      });
    }
  };

  const handleCopyApiKey = () => {
    copy(mockApiKey);
    addNotification({
      type: 'success',
      title: 'API Key Copied',
      message: 'API key has been copied to clipboard.',
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'desktop':
        return <Settings className="w-5 h-5" />;
      case 'web':
        return <Globe className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 safe-top safe-bottom">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security</h1>
            <p className="text-muted-foreground mt-1">Manage your account security and privacy</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={twoFactorEnabled && biometricEnabled ? 'default' : 'secondary'}>
              {twoFactorEnabled && biometricEnabled ? 'Highly Secure' : 'Secure'}
            </Badge>
          </div>
        </motion.div>

        {/* Security Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-mobile">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Account Secure</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your account is protected with advanced security features
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="authentication" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="authentication">Auth</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>
            
            {/* Authentication Tab */}
            <TabsContent value="authentication" className="space-y-6">
              {/* Password Security */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Password & Authentication</CardTitle>
                  <CardDescription>Manage your login credentials and authentication methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">Last changed 2 months ago</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                      Change Password
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          {twoFactorEnabled ? 'Enabled with authenticator app' : 'Add an extra layer of security'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={handleToggle2FA}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Fingerprint className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Biometric Login</p>
                        <p className="text-sm text-muted-foreground">
                          {biometricEnabled ? 'Face ID / Touch ID enabled' : 'Use fingerprint or face recognition'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={biometricEnabled}
                      onCheckedChange={handleBiometricToggle}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your active login sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{session.device}</p>
                            <p className="text-sm text-muted-foreground">{session.location}</p>
                            <p className="text-xs text-muted-foreground">
                              Last active: {formatTimestamp(session.last_activity)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {session.is_current && (
                            <Badge variant="default">Current</Badge>
                          )}
                          {!session.is_current && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEndSession(session.id)}
                            >
                              End Session
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Devices Tab */}
            <TabsContent value="devices" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Trusted Devices</CardTitle>
                  <CardDescription>Manage devices that can access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            {getDeviceIcon(device.type)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{device.name}</p>
                              {device.is_current && (
                                <Badge variant="default">Current Device</Badge>
                              )}
                              {device.trusted && (
                                <Badge variant="secondary">Trusted</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{device.location}</p>
                            <p className="text-xs text-muted-foreground">
                              Last active: {formatTimestamp(device.last_active)}
                            </p>
                          </div>
                        </div>
                        
                        {!device.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeDevice(device.id)}
                          >
                            Revoke Access
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control your data and privacy preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Encryption</p>
                      <p className="text-sm text-muted-foreground">Encrypt sensitive data at rest</p>
                    </div>
                    <Switch checked={securitySettings?.data_encryption} disabled />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Login Notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                    </div>
                    <Switch checked={securitySettings?.login_notifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Transaction Notifications</p>
                      <p className="text-sm text-muted-foreground">Alerts for all transactions</p>
                    </div>
                    <Switch checked={securitySettings?.transaction_notifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Logout</p>
                      <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                    </div>
                    <Switch checked={securitySettings?.auto_logout} />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Session Timeout</Label>
                    <Select defaultValue="30">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Export or delete your account data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Account Data
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                  
                  <div className="pt-4 border-t border-border">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Danger Zone:</strong> These actions cannot be undone.
                      </AlertDescription>
                    </Alert>
                    
                    <Button variant="destructive" className="w-full mt-4">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* API Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>Manage API keys and developer access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">API Access</p>
                      <p className="text-sm text-muted-foreground">Enable programmatic access to your account</p>
                    </div>
                    <Switch checked={securitySettings?.api_access} />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={mockApiKey}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyApiKey}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep your API key secure. Do not share it publicly.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Regenerate Key
                    </Button>
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      API Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Password Change Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  Change Password
                </Button>
                <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 2FA Setup Dialog */}
        <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Scan the QR code with your authenticator app and enter the verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleVerify2FA} disabled={isLoading || verificationCode.length !== 6}>
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SecurityScreen;

