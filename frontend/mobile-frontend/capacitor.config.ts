import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowlet.mobile',
  appName: 'Flowlet Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SecureStorage: {
      group: 'com.flowlet.mobile.secure',
      synchronize: true,
      requireBiometry: false
    },
    BiometricAuth: {
      reason: 'Use your biometric to authenticate',
      title: 'Biometric Authentication',
      subtitle: 'Flowlet Mobile',
      description: 'Authenticate using your fingerprint or face',
      fallbackTitle: 'Use PIN',
      negativeText: 'Cancel'
    },
    Device: {
      // Device plugin configuration
    },
    Haptics: {
      // Haptics plugin configuration
    },
    Camera: {
      permissions: ['camera', 'photos']
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
      signingType: 'apksigner'
    },
    webContentsDebuggingEnabled: false, // Disable in production
    allowMixedContent: false,
    captureInput: true,
    webViewAssetLoader: true,
    loggingBehavior: 'none', // Disable logging in production
    useLegacyBridge: false,
    appendUserAgent: 'FlowletMobile/1.0.0'
  },
  ios: {
    scheme: 'Flowlet Mobile',
    webContentsDebuggingEnabled: false, // Disable in production
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    appendUserAgent: 'FlowletMobile/1.0.0',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true,
    scrollEnabled: true,
    allowsInlineMediaPlayback: true,
    allowsAirPlayForMediaPlayback: false,
    allowsPictureInPictureMediaPlayback: false,
    allowsBackForwardNavigationGestures: true
  },
  security: {
    // Security configuration
    contentSecurityPolicy: "default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; media-src *; img-src 'self' data: content:;",
    allowNavigation: [
      'https://api.flowlet.com',
      'https://*.flowlet.com'
    ]
  }
};

export default config;

