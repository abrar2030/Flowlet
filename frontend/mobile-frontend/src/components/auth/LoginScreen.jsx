import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Smartphone, Mail, Lock, ArrowRight, Fingerprint, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useAuth, useFormValidation } from '../../hooks/index.js';
import { useUIStore } from '../../store/index.js';
import { SecurityUtils, BiometricUtils } from '../../utils/security.js';
import { FinancialValidators } from '../../utils/validation.js';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const { addNotification } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [deviceTrusted, setDeviceTrusted] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [sessionId, setSessionId] = useState('');

  // Enhanced form validation rules
  const validationRules = {
    email: [
      (value) => !value ? 'Email is required' : '',
      (value) => {
        const validation = FinancialValidators.validateEmail(value);
        return validation.isValid ? '' : validation.error;
      },
    ],
    password: [
      (value) => !value ? 'Password is required' : '',
      (value) => value.length < 8 ? 'Password must be at least 8 characters' : '',
    ],
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    isValid,
  } = useFormValidation(
    { email: '', password: '' },
    validationRules
  );

  // Check for biometric availability and device trust status
  useEffect(() => {
    const checkSecurityFeatures = async () => {
      // Check biometric availability
      const biometricSupported = await BiometricUtils.isAvailable();
      setBiometricAvailable(biometricSupported);

      // Check if device is trusted
      const deviceFingerprint = SecurityUtils.generateDeviceFingerprint();
      const trustedDevices = JSON.parse(localStorage.getItem('trustedDevices') || '[]');
      setDeviceTrusted(trustedDevices.includes(deviceFingerprint));

      // Check for existing login blocks
      const blockData = JSON.parse(localStorage.getItem('loginBlock') || '{}');
      if (blockData.blockedUntil && Date.now() < blockData.blockedUntil) {
        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil((blockData.blockedUntil - Date.now()) / 1000));
      }

      // Get current login attempts
      const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
      setLoginAttempts(attempts);
    };

    checkSecurityFeatures();
  }, []);

  // Block countdown timer
  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            localStorage.removeItem('loginBlock');
            localStorage.removeItem('loginAttempts');
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('loginAttempts', newAttempts.toString());

    if (newAttempts >= 5) {
      const blockDuration = 15 * 60 * 1000; // 15 minutes
      const blockedUntil = Date.now() + blockDuration;
      localStorage.setItem('loginBlock', JSON.stringify({ blockedUntil }));
      setIsBlocked(true);
      setBlockTimeRemaining(Math.ceil(blockDuration / 1000));
      
      addNotification({
        type: 'error',
        title: 'Account Temporarily Locked',
        message: 'Too many failed login attempts. Please try again in 15 minutes.',
      });
    }
  };

  const handleSuccessfulLogin = () => {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('loginBlock');
    setLoginAttempts(0);
    setIsBlocked(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (isBlocked) {
      addNotification({
        type: 'error',
        title: 'Account Locked',
        message: `Please wait ${Math.ceil(blockTimeRemaining / 60)} minutes before trying again.`,
      });
      return;
    }

    if (!validateAll()) {
      return;
    }

    try {
      // Sanitize inputs
      const sanitizedEmail = SecurityUtils.sanitizeInput(values.email);
      const deviceFingerprint = SecurityUtils.generateDeviceFingerprint();
      
      const loginData = {
        email: sanitizedEmail,
        password: values.password,
        deviceFingerprint,
        deviceTrusted
      };

      const response = await login(loginData);
      
      // Check if MFA is required
      if (response.requiresMFA) {
        setShowMFA(true);
        setSessionId(response.sessionId);
        addNotification({
          type: 'info',
          title: 'Multi-Factor Authentication Required',
          message: 'Please enter the verification code sent to your registered device.',
        });
        return;
      }

      handleSuccessfulLogin();
      
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have successfully logged in.',
      });
      
      navigate('/dashboard');
    } catch (error) {
      handleFailedLogin();
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: error.message || 'Please check your credentials and try again.',
      });
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    
    if (!mfaCode || mfaCode.length !== 6) {
      addNotification({
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter a valid 6-digit verification code.',
      });
      return;
    }

    try {
      // Verify MFA code (this would be an API call in real implementation)
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode, sessionId })
      });

      if (response.ok) {
        handleSuccessfulLogin();
        addNotification({
          type: 'success',
          title: 'Authentication Successful',
          message: 'You have been successfully logged in.',
        });
        navigate('/dashboard');
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Verification Failed',
        message: 'Invalid verification code. Please try again.',
      });
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const userId = localStorage.getItem('lastUserId');
      if (!userId) {
        addNotification({
          type: 'error',
          title: 'Biometric Login Unavailable',
          message: 'Please log in with your password first to set up biometric authentication.',
        });
        return;
      }

      const credentialId = localStorage.getItem(`biometric_${userId}`);
      if (!credentialId) {
        addNotification({
          type: 'error',
          title: 'Biometric Not Set Up',
          message: 'Please set up biometric authentication in your security settings.',
        });
        return;
      }

      await BiometricUtils.authenticate(credentialId);
      
      handleSuccessfulLogin();
      addNotification({
        type: 'success',
        title: 'Biometric Authentication Successful',
        message: 'You have been successfully logged in.',
      });
      navigate('/dashboard');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Biometric Authentication Failed',
        message: 'Please try again or use password login.',
      });
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showMFA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="card-mobile shadow-xl border-0">
            <CardHeader className="space-y-1 pb-4 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold">Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Enter the 6-digit verification code sent to your registered device
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleMFASubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="mfaCode" className="text-sm font-medium text-foreground">
                    Verification Code
                  </label>
                  <Input
                    id="mfaCode"
                    type="text"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-mobile text-center text-2xl tracking-widest"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="btn-mobile w-full gradient-primary text-white font-semibold"
                  disabled={isLoading || mfaCode.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setShowMFA(false)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <Smartphone className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Flowlet account</p>
          
          {/* Security Status Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {deviceTrusted && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Trusted Device
              </Badge>
            )}
            {biometricAvailable && (
              <Badge variant="secondary" className="text-xs">
                <Fingerprint className="w-3 h-3 mr-1" />
                Biometric Ready
              </Badge>
            )}
          </div>
        </div>

        <Card className="card-mobile shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Security Warnings */}
            {isBlocked && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Account temporarily locked due to multiple failed attempts. 
                  Try again in {formatTime(blockTimeRemaining)}.
                </AlertDescription>
              </Alert>
            )}

            {loginAttempts > 0 && loginAttempts < 5 && !isBlocked && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {5 - loginAttempts} login attempts remaining before account lock.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`input-mobile pl-10 ${errors.email && touched.email ? 'border-destructive' : ''}`}
                    disabled={isLoading || isBlocked}
                    autoComplete="email"
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`input-mobile pl-10 pr-10 ${errors.password && touched.password ? 'border-destructive' : ''}`}
                    disabled={isLoading || isBlocked}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isBlocked}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="btn-mobile w-full gradient-primary text-white font-semibold"
                disabled={isLoading || !isValid || isBlocked}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>
            </form>

            {/* Biometric Login */}
            {biometricAvailable && !isBlocked && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBiometricLogin}
                  className="btn-mobile w-full"
                  disabled={isLoading}
                >
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Use Biometric Login
                </Button>
              </>
            )}

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          <p className="mt-2">🔒 Your data is protected with bank-level security</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;

