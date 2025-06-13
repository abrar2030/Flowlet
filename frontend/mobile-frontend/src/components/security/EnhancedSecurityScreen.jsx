import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  MapPin,
  Fingerprint,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Settings,
  Bell,
  CreditCard,
  Activity,
  Globe,
  Wifi,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { SecurityUtils, BiometricUtils, SessionUtils } from '../../utils/security.js';
import { financialAPI } from '../../utils/api.js';

const EnhancedSecurityScreen = () => {
  const [securitySettings, setSecuritySettings] = useState({});
  const [devices, setDevices] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [mfaSetup, setMfaSetup] = useState({
    method: 'sms',
    phoneNumber: '',
    email: '',
    backupCodes: []
  });

  useEffect(() => {
    loadSecurityData();
    checkBiometricAvailability();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const [settings, devicesData, alerts, history] = await Promise.all([
        financialAPI.getSecuritySettings(),
        financialAPI.getTrustedDevices(),
        financialAPI.getSecurityAlerts(),
        financialAPI.getLoginHistory()
      ]);

      setSecuritySettings(settings || mockSecuritySettings);
      setDevices(devicesData || mockDevices);
      setSecurityAlerts(alerts || mockSecurityAlerts);
      setLoginHistory(history || mockLoginHistory);
      
      calculateSecurityScore(settings || mockSecuritySettings);
    } catch (error) {
      console.error('Failed to load security data:', error);
      // Use mock data as fallback
      setSecuritySettings(mockSecuritySettings);
      setDevices(mockDevices);
      setSecurityAlerts(mockSecurityAlerts);
      setLoginHistory(mockLoginHistory);
      calculateSecurityScore(mockSecuritySettings);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricAvailability = async () => {
    const available = await BiometricUtils.isAvailable();
    setBiometricAvailable(available);
  };

  const calculateSecurityScore = (settings) => {
    let score = 0;
    const maxScore = 100;

    // Password strength (20 points)
    if (settings.passwordStrength === 'strong') score += 20;
    else if (settings.passwordStrength === 'medium') score += 10;

    // MFA enabled (25 points)
    if (settings.mfaEnabled) score += 25;

    // Biometric enabled (20 points)
    if (settings.biometricEnabled) score += 20;

    // Login notifications (10 points)
    if (settings.loginNotifications) score += 10;

    // Transaction alerts (10 points)
    if (settings.transactionAlerts) score += 10;

    // Device management (10 points)
    if (settings.deviceManagement) score += 10;

    // Session timeout (5 points)
    if (settings.sessionTimeout <= 30) score += 5;

    setSecurityScore(score);
  };

  const handleSecuritySettingChange = async (setting, value) => {
    try {
      const updatedSettings = { ...securitySettings, [setting]: value };
      await financialAPI.updateSecuritySettings({ [setting]: value });
      setSecuritySettings(updatedSettings);
      calculateSecurityScore(updatedSettings);
    } catch (error) {
      console.error('Failed to update security setting:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const validation = SecurityUtils.validatePasswordStrength(passwordForm.newPassword);
    if (!validation.isValid) {
      alert('Password does not meet security requirements');
      return;
    }

    try {
      await financialAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    }
  };

  const handleEnableBiometric = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      
      const credential = await BiometricUtils.register(userId, userName);
      
      // Store credential ID for future authentication
      localStorage.setItem(`biometric_${userId}`, credential.id);
      
      await handleSecuritySettingChange('biometricEnabled', true);
      alert('Biometric authentication enabled successfully');
    } catch (error) {
      console.error('Failed to enable biometric authentication:', error);
      alert('Failed to enable biometric authentication');
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    try {
      await financialAPI.revokeDevice(deviceId);
      setDevices(prev => prev.filter(device => device.id !== deviceId));
      alert('Device revoked successfully');
    } catch (error) {
      console.error('Failed to revoke device:', error);
      alert('Failed to revoke device');
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await financialAPI.dismissSecurityAlert(alertId);
      setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'tablet': return <Smartphone className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Center</h1>
          <p className="text-muted-foreground">Manage your account security and privacy settings</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Security Score</div>
          <div className={`text-2xl font-bold ${getSecurityScoreColor(securityScore)}`}>
            {securityScore}/100
          </div>
        </div>
      </div>

      {/* Security Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Security Score</span>
              <span className={getSecurityScoreColor(securityScore)}>{securityScore}/100</span>
            </div>
            <Progress value={securityScore} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {securitySettings.mfaEnabled ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>Multi-Factor Auth</span>
            </div>
            <div className="flex items-center gap-2">
              {securitySettings.biometricEnabled ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>Biometric Login</span>
            </div>
            <div className="flex items-center gap-2">
              {securitySettings.passwordStrength === 'strong' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
              <span>Strong Password</span>
            </div>
            <div className="flex items-center gap-2">
              {securitySettings.loginNotifications ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>Login Alerts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityAlerts.map(alert => (
              <Alert key={alert.id} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <div>
                    <strong>{alert.title}</strong>
                    <p className="text-sm mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(alert.timestamp)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDismissAlert(alert.id)}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Authentication Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>Manage your login and authentication methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Multi-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                  </div>
                  <Switch
                    checked={securitySettings.mfaEnabled}
                    onCheckedChange={(checked) => handleSecuritySettingChange('mfaEnabled', checked)}
                  />
                </div>

                {biometricAvailable && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Biometric Login</div>
                      <div className="text-sm text-muted-foreground">Use fingerprint or face recognition</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={securitySettings.biometricEnabled}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleEnableBiometric();
                          } else {
                            handleSecuritySettingChange('biometricEnabled', false);
                          }
                        }}
                      />
                      {!securitySettings.biometricEnabled && (
                        <Button size="sm" variant="outline" onClick={handleEnableBiometric}>
                          <Fingerprint className="w-4 h-4 mr-2" />
                          Setup
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Choose a strong password to protect your account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Current Password</label>
                          <Input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">New Password</label>
                          <Input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                          {passwordForm.newPassword && (
                            <div className="mt-2">
                              {(() => {
                                const validation = SecurityUtils.validatePasswordStrength(passwordForm.newPassword);
                                return (
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Password Requirements:</div>
                                    <div className={`text-xs ${validation.requirements.minLength ? 'text-green-600' : 'text-red-600'}`}>
                                      ✓ At least 8 characters
                                    </div>
                                    <div className={`text-xs ${validation.requirements.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                                      ✓ Uppercase letter
                                    </div>
                                    <div className={`text-xs ${validation.requirements.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                                      ✓ Lowercase letter
                                    </div>
                                    <div className={`text-xs ${validation.requirements.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                                      ✓ Number
                                    </div>
                                    <div className={`text-xs ${validation.requirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                                      ✓ Special character
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium">Confirm New Password</label>
                          <Input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                        </div>
                        <Button onClick={handleChangePassword} className="w-full">
                          Change Password
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Notifications</CardTitle>
                <CardDescription>Get notified about important security events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Login Notifications</div>
                    <div className="text-sm text-muted-foreground">Get notified of new logins</div>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => handleSecuritySettingChange('loginNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Transaction Alerts</div>
                    <div className="text-sm text-muted-foreground">Get notified of large transactions</div>
                  </div>
                  <Switch
                    checked={securitySettings.transactionAlerts}
                    onCheckedChange={(checked) => handleSecuritySettingChange('transactionAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Security Alerts</div>
                    <div className="text-sm text-muted-foreground">Get notified of suspicious activity</div>
                  </div>
                  <Switch
                    checked={securitySettings.securityAlerts}
                    onCheckedChange={(checked) => handleSecuritySettingChange('securityAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Failed Login Attempts</div>
                    <div className="text-sm text-muted-foreground">Get notified of failed login attempts</div>
                  </div>
                  <Switch
                    checked={securitySettings.failedLoginAlerts}
                    onCheckedChange={(checked) => handleSecuritySettingChange('failedLoginAlerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session Management */}
            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>Control your active sessions and timeouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Select
                    value={securitySettings.sessionTimeout?.toString()}
                    onValueChange={(value) => handleSecuritySettingChange('sessionTimeout', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-lock on Inactivity</div>
                    <div className="text-sm text-muted-foreground">Lock app when inactive</div>
                  </div>
                  <Switch
                    checked={securitySettings.autoLock}
                    onCheckedChange={(checked) => handleSecuritySettingChange('autoLock', checked)}
                  />
                </div>

                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  End All Other Sessions
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Security */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Security</CardTitle>
                <CardDescription>Additional security features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Device Management</div>
                    <div className="text-sm text-muted-foreground">Manage trusted devices</div>
                  </div>
                  <Switch
                    checked={securitySettings.deviceManagement}
                    onCheckedChange={(checked) => handleSecuritySettingChange('deviceManagement', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">IP Restriction</div>
                    <div className="text-sm text-muted-foreground">Restrict access by IP address</div>
                  </div>
                  <Switch
                    checked={securitySettings.ipRestriction}
                    onCheckedChange={(checked) => handleSecuritySettingChange('ipRestriction', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Geolocation Alerts</div>
                    <div className="text-sm text-muted-foreground">Alert on unusual locations</div>
                  </div>
                  <Switch
                    checked={securitySettings.geolocationAlerts}
                    onCheckedChange={(checked) => handleSecuritySettingChange('geolocationAlerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trusted Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Trusted Devices</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </div>

          <div className="grid gap-4">
            {devices.map(device => (
              <Card key={device.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.browser} • {device.os}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last active: {formatDate(device.lastActive)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {device.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={device.isCurrent ? 'default' : 'secondary'}>
                        {device.isCurrent ? 'Current' : 'Trusted'}
                      </Badge>
                      {!device.isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeDevice(device.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <h2 className="text-2xl font-semibold">Security Activity</h2>

          <div className="space-y-4">
            {loginHistory.map(entry => (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${entry.success ? 'bg-green-100' : 'bg-red-100'}`}>
                        {entry.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {entry.success ? 'Successful Login' : 'Failed Login Attempt'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.device} • {entry.browser}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {entry.location} • {entry.ipAddress}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{formatDate(entry.timestamp)}</div>
                      {entry.method && (
                        <Badge variant="outline" className="text-xs">
                          {entry.method}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <h2 className="text-2xl font-semibold">Privacy Settings</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Data Privacy</CardTitle>
                <CardDescription>Control how your data is used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Analytics Tracking</div>
                    <div className="text-sm text-muted-foreground">Help improve our services</div>
                  </div>
                  <Switch
                    checked={securitySettings.analyticsTracking}
                    onCheckedChange={(checked) => handleSecuritySettingChange('analyticsTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Marketing Communications</div>
                    <div className="text-sm text-muted-foreground">Receive promotional emails</div>
                  </div>
                  <Switch
                    checked={securitySettings.marketingCommunications}
                    onCheckedChange={(checked) => handleSecuritySettingChange('marketingCommunications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Data Sharing</div>
                    <div className="text-sm text-muted-foreground">Share data with partners</div>
                  </div>
                  <Switch
                    checked={securitySettings.dataSharing}
                    onCheckedChange={(checked) => handleSecuritySettingChange('dataSharing', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Download My Data
                </Button>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Data Deletion
                </Button>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data
const mockSecuritySettings = {
  mfaEnabled: true,
  biometricEnabled: false,
  loginNotifications: true,
  transactionAlerts: true,
  securityAlerts: true,
  failedLoginAlerts: true,
  sessionTimeout: 30,
  autoLock: true,
  deviceManagement: true,
  ipRestriction: false,
  geolocationAlerts: true,
  analyticsTracking: true,
  marketingCommunications: false,
  dataSharing: false,
  passwordStrength: 'strong'
};

const mockDevices = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    type: 'mobile',
    browser: 'Safari',
    os: 'iOS 17.2',
    location: 'New York, NY',
    lastActive: '2025-06-13T20:00:00Z',
    isCurrent: true
  },
  {
    id: 2,
    name: 'MacBook Pro',
    type: 'desktop',
    browser: 'Chrome',
    os: 'macOS 14.2',
    location: 'New York, NY',
    lastActive: '2025-06-12T15:30:00Z',
    isCurrent: false
  }
];

const mockSecurityAlerts = [
  {
    id: 1,
    title: 'New Device Login',
    message: 'A new device logged into your account from New York, NY',
    severity: 'medium',
    timestamp: '2025-06-13T19:30:00Z'
  },
  {
    id: 2,
    title: 'Large Transaction',
    message: 'A transaction of $2,500 was processed',
    severity: 'low',
    timestamp: '2025-06-13T14:15:00Z'
  }
];

const mockLoginHistory = [
  {
    id: 1,
    success: true,
    device: 'iPhone 15 Pro',
    browser: 'Safari',
    location: 'New York, NY',
    ipAddress: '192.168.1.1',
    timestamp: '2025-06-13T20:00:00Z',
    method: 'Biometric'
  },
  {
    id: 2,
    success: false,
    device: 'Unknown Device',
    browser: 'Chrome',
    location: 'Los Angeles, CA',
    ipAddress: '10.0.0.1',
    timestamp: '2025-06-13T18:45:00Z',
    method: 'Password'
  },
  {
    id: 3,
    success: true,
    device: 'MacBook Pro',
    browser: 'Chrome',
    location: 'New York, NY',
    ipAddress: '192.168.1.2',
    timestamp: '2025-06-12T15:30:00Z',
    method: 'MFA'
  }
];

export default EnhancedSecurityScreen;

