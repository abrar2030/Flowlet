/**
 * Mobile Login Page for Flowlet Financial Application
 * Enhanced with biometric authentication and mobile-specific security
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Fingerprint, Smartphone, Shield, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../components/security/MobileAuthGuard';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const Login = () => {
  const { login, biometricAvailable, deviceInfo } = useAuth();
  const [loginMethod, setLoginMethod] = useState('password'); // password, biometric, pin
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    pin: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinInput, setPinInput] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    // Check for saved biometric/PIN preferences
    checkSavedAuthMethods();
  }, []);

  const checkSavedAuthMethods = async () => {
    try {
      const hasBiometric = localStorage.getItem('biometric-data');
      const hasPin = localStorage.getItem('pin-data');
      
      if (biometricAvailable && hasBiometric) {
        setLoginMethod('biometric');
      } else if (hasPin) {
        setLoginMethod('pin');
      }
    } catch (error) {
      console.error('Failed to check saved auth methods:', error);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({
        username: formData.username,
        password: formData.password,
        rememberMe: formData.rememberMe
      }, 'password');

      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      setError(error.message || 'Login failed');
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await login({}, 'biometric');
      
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      setError(error.message || 'Biometric authentication failed');
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async () => {
    const pin = pinInput.join('');
    if (pin.length !== 6) {
      setError('Please enter a 6-digit PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login({ pin }, 'pin');
      
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      setError(error.message || 'PIN authentication failed');
      setPinInput(['', '', '', '', '', '']);
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinInputChange = (index, value) => {
    if (value.length > 1) return;
    
    const newPin = [...pinInput];
    newPin[index] = value;
    setPinInput(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when PIN is complete
    if (newPin.every(digit => digit !== '') && newPin.join('').length === 6) {
      setTimeout(() => {
        const pin = newPin.join('');
        handlePinLogin();
      }, 100);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderPasswordLogin = () => (
    <form onSubmit={handlePasswordLogin} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="text"
          name="username"
          placeholder="Username or Email"
          value={formData.username}
          onChange={handleInputChange}
          required
          className="h-12"
        />
      </div>
      
      <div className="space-y-2 relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
          className="h-12 pr-12"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-8 w-8 p-0"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="rememberMe"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          className="rounded"
        />
        <label htmlFor="rememberMe" className="text-sm">
          Remember me
        </label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-12">
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );

  const renderBiometricLogin = () => (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Fingerprint className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">Biometric Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Use your fingerprint or face to sign in securely
          </p>
        </div>
      </div>

      <Button 
        onClick={handleBiometricLogin} 
        disabled={isLoading} 
        className="w-full h-12"
      >
        {isLoading ? 'Authenticating...' : 'Authenticate'}
      </Button>
    </div>
  );

  const renderPinLogin = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Enter Your PIN</h3>
        <p className="text-sm text-muted-foreground">
          Enter your 6-digit PIN to continue
        </p>
      </div>

      <div className="flex justify-center space-x-2">
        {pinInput.map((digit, index) => (
          <Input
            key={index}
            id={`pin-${index}`}
            type="password"
            maxLength={1}
            value={digit}
            onChange={(e) => handlePinInputChange(index, e.target.value)}
            className="w-12 h-12 text-center text-lg font-bold"
            inputMode="numeric"
          />
        ))}
      </div>

      <Button 
        onClick={handlePinLogin} 
        disabled={isLoading || pinInput.some(digit => digit === '')} 
        className="w-full h-12"
      >
        {isLoading ? 'Verifying...' : 'Verify PIN'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Flowlet</CardTitle>
          <CardDescription>
            Secure mobile banking at your fingertips
          </CardDescription>
          
          {deviceInfo && (
            <Badge variant="outline" className="text-xs">
              {deviceInfo.platform} {deviceInfo.osVersion}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Method Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={loginMethod === 'password' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLoginMethod('password')}
              className="flex-1"
            >
              <Lock className="h-4 w-4 mr-2" />
              Password
            </Button>
            
            {biometricAvailable && (
              <Button
                variant={loginMethod === 'biometric' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginMethod('biometric')}
                className="flex-1"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Biometric
              </Button>
            )}
            
            <Button
              variant={loginMethod === 'pin' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLoginMethod('pin')}
              className="flex-1"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              PIN
            </Button>
          </div>

          {/* Login Forms */}
          {loginMethod === 'password' && renderPasswordLogin()}
          {loginMethod === 'biometric' && renderBiometricLogin()}
          {loginMethod === 'pin' && renderPinLogin()}

          {/* Footer Links */}
          <div className="text-center space-y-2">
            <Button variant="link" size="sm">
              Forgot Password?
            </Button>
            <div className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Button variant="link" size="sm" className="p-0 h-auto">
                Sign Up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

