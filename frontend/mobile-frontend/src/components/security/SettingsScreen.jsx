import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Smartphone, 
  CreditCard, 
  Shield, 
  Eye, 
  EyeOff, 
  Edit, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Save, 
  X, 
  Check,
  ChevronRight,
  LogOut,
  HelpCircle,
  MessageSquare,
  Star,
  Download,
  Upload,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { useUIStore, useAuthStore } from '../../store/index.js';
import { userAPI } from '../../services/api.js';
import { useAuth, useApi } from '../../hooks/index.js';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const { request, isLoading } = useApi();
  const { addNotification, theme, setTheme } = useUIStore();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    date_of_birth: '1990-01-15',
    occupation: 'Software Engineer',
    bio: 'Passionate about fintech and building great user experiences.'
  });

  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    notifications: {
      push: true,
      email: true,
      sms: false,
      marketing: false,
      security: true,
      transactions: true,
      budgets: true,
      insights: true
    },
    privacy: {
      profile_visibility: 'private',
      transaction_history: 'private',
      analytics_sharing: false,
      location_tracking: true
    },
    accessibility: {
      large_text: false,
      high_contrast: false,
      reduce_motion: false,
      screen_reader: false
    }
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      // For demo purposes, use mock data
      // In real implementation:
      // const userData = await request(() => userAPI.getProfile(user.id));
      // const userPrefs = await request(() => userAPI.getPreferences(user.id));
      // setProfileData(userData);
      // setPreferences(userPrefs);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Load Settings',
        message: error.message || 'Could not load user settings.',
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditingProfile(false);
      
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile.',
      });
    }
  };

  const handlePreferenceChange = async (category, key, value) => {
    try {
      const newPreferences = {
        ...preferences,
        [category]: {
          ...preferences[category],
          [key]: value
        }
      };
      setPreferences(newPreferences);
      
      // Special handling for theme
      if (category === 'theme' || key === 'theme') {
        setTheme(value);
      }
      
      addNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your preferences have been saved.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update preferences.',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      addNotification({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been logged out successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Logout Failed',
        message: error.message || 'Failed to log out.',
      });
    }
  };

  const handleExportData = async () => {
    try {
      // Mock data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification({
        type: 'success',
        title: 'Data Export Started',
        message: 'Your data export will be emailed to you within 24 hours.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.message || 'Failed to export data.',
      });
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
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
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Information */}
              <Card className="card-mobile">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </div>
                    <Button
                      variant={editingProfile ? "default" : "outline"}
                      onClick={() => {
                        if (editingProfile) {
                          handleSaveProfile();
                        } else {
                          setEditingProfile(true);
                        }
                      }}
                      disabled={isLoading}
                    >
                      {editingProfile ? (
                        isLoading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save</>
                      ) : (
                        <><Edit className="w-4 h-4 mr-2" />Edit</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="text-lg">
                        {getInitials(profileData.first_name, profileData.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    {editingProfile && (
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="date-of-birth">Date of Birth</Label>
                      <Input
                        id="date-of-birth"
                        type="date"
                        value={profileData.date_of_birth}
                        onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        value={profileData.occupation}
                        onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!editingProfile}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {editingProfile && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingProfile(false);
                          // Reset to original data
                          loadUserSettings();
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>Your account verification and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Email Verified</p>
                          <p className="text-sm text-muted-foreground">Your email address is verified</p>
                        </div>
                      </div>
                      <Badge variant="default">Verified</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Phone Verified</p>
                          <p className="text-sm text-muted-foreground">Your phone number is verified</p>
                        </div>
                      </div>
                      <Badge variant="default">Verified</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">KYC Completed</p>
                          <p className="text-sm text-muted-foreground">Identity verification complete</p>
                        </div>
                      </div>
                      <Badge variant="default">Complete</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              {/* Appearance */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the app looks and feels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => handlePreferenceChange('theme', 'theme', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center space-x-2">
                            <Sun className="w-4 h-4" />
                            <span>Light</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center space-x-2">
                            <Moon className="w-4 h-4" />
                            <span>Dark</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4" />
                            <span>System</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => handlePreferenceChange('language', 'language', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={preferences.currency}
                      onValueChange={(value) => handlePreferenceChange('currency', 'currency', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Timezone</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => handlePreferenceChange('timezone', 'timezone', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Privacy</CardTitle>
                  <CardDescription>Control your privacy and data sharing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Analytics Sharing</p>
                      <p className="text-sm text-muted-foreground">Help improve the app with usage data</p>
                    </div>
                    <Switch
                      checked={preferences.privacy.analytics_sharing}
                      onCheckedChange={(checked) => handlePreferenceChange('privacy', 'analytics_sharing', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Location Tracking</p>
                      <p className="text-sm text-muted-foreground">Allow location-based features</p>
                    </div>
                    <Switch
                      checked={preferences.privacy.location_tracking}
                      onCheckedChange={(checked) => handlePreferenceChange('privacy', 'location_tracking', checked)}
                    />
                  </div>
                  
                  <div>
                    <Label>Profile Visibility</Label>
                    <Select
                      value={preferences.privacy.profile_visibility}
                      onValueChange={(value) => handlePreferenceChange('privacy', 'profile_visibility', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Accessibility</CardTitle>
                  <CardDescription>Customize accessibility features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Large Text</p>
                      <p className="text-sm text-muted-foreground">Increase text size for better readability</p>
                    </div>
                    <Switch
                      checked={preferences.accessibility.large_text}
                      onCheckedChange={(checked) => handlePreferenceChange('accessibility', 'large_text', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">High Contrast</p>
                      <p className="text-sm text-muted-foreground">Enhance contrast for better visibility</p>
                    </div>
                    <Switch
                      checked={preferences.accessibility.high_contrast}
                      onCheckedChange={(checked) => handlePreferenceChange('accessibility', 'high_contrast', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reduce Motion</p>
                      <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                    </div>
                    <Switch
                      checked={preferences.accessibility.reduce_motion}
                      onCheckedChange={(checked) => handlePreferenceChange('accessibility', 'reduce_motion', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Delivery Methods</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Instant notifications on your device</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.notifications.push}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'push', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Detailed email updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.notifications.email}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'email', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-muted-foreground">Text message alerts</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.notifications.sms}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'sms', checked)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Notification Types</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-muted-foreground">Login attempts and security events</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.security}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'security', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Transaction Alerts</p>
                        <p className="text-sm text-muted-foreground">Payment and transaction notifications</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.transactions}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'transactions', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Budget Alerts</p>
                        <p className="text-sm text-muted-foreground">Budget limits and spending warnings</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.budgets}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'budgets', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Financial Insights</p>
                        <p className="text-sm text-muted-foreground">AI-powered financial recommendations</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.insights}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'insights', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing</p>
                        <p className="text-sm text-muted-foreground">Product updates and promotional content</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.marketing}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', 'marketing', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              {/* Help & Support */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>Get help and contact support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-3">
                      <HelpCircle className="w-5 h-5" />
                      <span>Help Center</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-5 h-5" />
                      <span>Contact Support</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5" />
                      <span>Rate the App</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Export or manage your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportData}
                    disabled={isLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isLoading ? 'Exporting...' : 'Export My Data'}
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>Manage your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                  
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                      <strong>Danger Zone:</strong> These actions cannot be undone.
                    </p>
                    
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* App Information */}
              <Card className="card-mobile">
                <CardHeader>
                  <CardTitle>App Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Version</span>
                    <span>2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Build</span>
                    <span>2025.06.11</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform</span>
                    <span>Web</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsScreen;

