/**
 * Mobile Compliance Configuration for Flowlet Financial Application
 * GDPR, PCI DSS, SOX, and other regulatory compliance for mobile environments
 */

export const COMPLIANCE_CONFIG = {
  // GDPR Configuration for Mobile
  GDPR: {
    ENABLED: true,
    CONSENT_REQUIRED: true,
    CONSENT_CATEGORIES: {
      NECESSARY: {
        name: 'Strictly Necessary',
        description: 'Essential for app functionality and security',
        required: true,
        cookies: ['session', 'security', 'authentication']
      },
      FUNCTIONAL: {
        name: 'Functional',
        description: 'Remember your preferences and settings',
        required: false,
        cookies: ['preferences', 'language', 'theme']
      },
      ANALYTICS: {
        name: 'Analytics',
        description: 'Help us understand app usage and performance',
        required: false,
        cookies: ['analytics', 'performance', 'usage']
      },
      MARKETING: {
        name: 'Marketing',
        description: 'Personalized offers and communications',
        required: false,
        cookies: ['marketing', 'advertising', 'personalization']
      }
    },
    DATA_RETENTION: {
      USER_DATA: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      SESSION_DATA: 24 * 60 * 60 * 1000, // 24 hours
      ANALYTICS_DATA: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      MARKETING_DATA: 365 * 24 * 60 * 60 * 1000, // 1 year
      CONSENT_RECORDS: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years
    },
    LAWFUL_BASIS: {
      CONSENT: 'consent',
      CONTRACT: 'contract',
      LEGAL_OBLIGATION: 'legal_obligation',
      VITAL_INTERESTS: 'vital_interests',
      PUBLIC_TASK: 'public_task',
      LEGITIMATE_INTERESTS: 'legitimate_interests'
    },
    SUBJECT_RIGHTS: {
      ACCESS: true,
      RECTIFICATION: true,
      ERASURE: true,
      RESTRICT_PROCESSING: true,
      DATA_PORTABILITY: true,
      OBJECT: true,
      AUTOMATED_DECISION_MAKING: true
    }
  },

  // PCI DSS Configuration for Mobile
  PCI_DSS: {
    ENABLED: true,
    VERSION: '4.0',
    REQUIREMENTS: {
      // Requirement 6.4.3: Client-side security for mobile
      CLIENT_SIDE_SECURITY: {
        INPUT_VALIDATION: true,
        OUTPUT_ENCODING: true,
        AUTHENTICATION_CONTROLS: true,
        SESSION_MANAGEMENT: true,
        ACCESS_CONTROLS: true,
        ERROR_HANDLING: true,
        LOGGING: true
      },
      // Mobile-specific requirements
      MOBILE_SECURITY: {
        APP_STORE_VALIDATION: true,
        CODE_OBFUSCATION: true,
        ANTI_TAMPERING: true,
        CERTIFICATE_PINNING: true,
        SECURE_STORAGE: true,
        BIOMETRIC_PROTECTION: true
      }
    },
    SENSITIVE_DATA: {
      PAN: 'Primary Account Number',
      CVV: 'Card Verification Value',
      EXPIRY: 'Card Expiry Date',
      CARDHOLDER_NAME: 'Cardholder Name',
      TRACK_DATA: 'Magnetic Stripe Data'
    },
    STORAGE_RESTRICTIONS: {
      NO_STORAGE: ['CVV', 'TRACK_DATA'],
      ENCRYPTED_STORAGE: ['PAN'],
      MASKED_DISPLAY: ['PAN', 'EXPIRY']
    }
  },

  // SOX Compliance for Mobile
  SOX: {
    ENABLED: true,
    CONTROLS: {
      ACCESS_CONTROLS: {
        USER_AUTHENTICATION: true,
        ROLE_BASED_ACCESS: true,
        SEGREGATION_OF_DUTIES: true,
        PRIVILEGED_ACCESS_MANAGEMENT: true
      },
      AUDIT_CONTROLS: {
        COMPREHENSIVE_LOGGING: true,
        LOG_INTEGRITY: true,
        LOG_RETENTION: true,
        AUDIT_TRAIL: true
      },
      CHANGE_CONTROLS: {
        CHANGE_MANAGEMENT: true,
        VERSION_CONTROL: true,
        TESTING_PROCEDURES: true,
        DEPLOYMENT_CONTROLS: true
      }
    },
    AUDIT_REQUIREMENTS: {
      LOG_ALL_TRANSACTIONS: true,
      LOG_ACCESS_ATTEMPTS: true,
      LOG_CONFIGURATION_CHANGES: true,
      LOG_PRIVILEGE_ESCALATION: true,
      IMMUTABLE_LOGS: true
    }
  },

  // CCPA Configuration for Mobile
  CCPA: {
    ENABLED: true,
    CONSUMER_RIGHTS: {
      RIGHT_TO_KNOW: true,
      RIGHT_TO_DELETE: true,
      RIGHT_TO_OPT_OUT: true,
      RIGHT_TO_NON_DISCRIMINATION: true
    },
    PERSONAL_INFORMATION_CATEGORIES: [
      'Identifiers',
      'Personal information categories',
      'Protected classification characteristics',
      'Commercial information',
      'Biometric information',
      'Internet or other similar network activity',
      'Geolocation data',
      'Sensory data',
      'Professional or employment-related information',
      'Non-public education information',
      'Inferences drawn from other personal information'
    ]
  },

  // Mobile App Store Compliance
  APP_STORE: {
    APPLE: {
      PRIVACY_LABELS: true,
      DATA_COLLECTION_DISCLOSURE: true,
      THIRD_PARTY_SDK_DISCLOSURE: true,
      TRACKING_AUTHORIZATION: true,
      APP_TRACKING_TRANSPARENCY: true
    },
    GOOGLE: {
      DATA_SAFETY: true,
      PERMISSIONS_DECLARATION: true,
      SENSITIVE_PERMISSIONS: true,
      TARGET_API_COMPLIANCE: true
    }
  },

  // Financial Regulations for Mobile
  FINANCIAL: {
    FINRA: {
      ENABLED: true,
      RECORDKEEPING: true,
      SUPERVISION: true,
      COMMUNICATIONS: true
    },
    FFIEC: {
      ENABLED: true,
      AUTHENTICATION_GUIDANCE: true,
      RISK_MANAGEMENT: true,
      INCIDENT_RESPONSE: true
    },
    GLBA: {
      ENABLED: true,
      PRIVACY_RULE: true,
      SAFEGUARDS_RULE: true,
      PRETEXTING_PROVISIONS: true
    }
  },

  // Mobile-specific Compliance Settings
  MOBILE: {
    DEVICE_COMPLIANCE: {
      REQUIRE_PASSCODE: true,
      REQUIRE_BIOMETRIC: false,
      JAILBREAK_DETECTION: true,
      SCREENSHOT_PREVENTION: true,
      SCREEN_RECORDING_PREVENTION: true
    },
    APP_COMPLIANCE: {
      CODE_SIGNING: true,
      CERTIFICATE_VALIDATION: true,
      RUNTIME_PROTECTION: true,
      ANTI_DEBUGGING: true,
      OBFUSCATION: true
    },
    DATA_COMPLIANCE: {
      ENCRYPTION_AT_REST: true,
      ENCRYPTION_IN_TRANSIT: true,
      SECURE_KEY_STORAGE: true,
      DATA_LOSS_PREVENTION: true,
      REMOTE_WIPE: true
    }
  },

  // Compliance Utilities
  ComplianceUtils: {
    /**
     * Check if audit logging is required for event type
     */
    isAuditLoggingRequired(eventType) {
      const auditEvents = [
        'user_login',
        'user_logout',
        'password_change',
        'permission_change',
        'data_access',
        'data_modification',
        'financial_transaction',
        'configuration_change',
        'security_event',
        'compliance_event'
      ];
      
      return auditEvents.includes(eventType);
    },

    /**
     * Get data retention period for data type
     */
    getDataRetentionPeriod(dataType) {
      const retentionPeriods = {
        'user_data': COMPLIANCE_CONFIG.GDPR.DATA_RETENTION.USER_DATA,
        'session_data': COMPLIANCE_CONFIG.GDPR.DATA_RETENTION.SESSION_DATA,
        'analytics_data': COMPLIANCE_CONFIG.GDPR.DATA_RETENTION.ANALYTICS_DATA,
        'marketing_data': COMPLIANCE_CONFIG.GDPR.DATA_RETENTION.MARKETING_DATA,
        'consent_records': COMPLIANCE_CONFIG.GDPR.DATA_RETENTION.CONSENT_RECORDS,
        'audit_logs': 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        'transaction_records': 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        'security_logs': 2 * 365 * 24 * 60 * 60 * 1000 // 2 years
      };
      
      return retentionPeriods[dataType] || retentionPeriods['user_data'];
    },

    /**
     * Validate consent for data processing
     */
    validateConsent(consentData, purpose) {
      if (!consentData || !consentData.categories) {
        return false;
      }

      const purposeMapping = {
        'analytics': 'ANALYTICS',
        'marketing': 'MARKETING',
        'functional': 'FUNCTIONAL',
        'necessary': 'NECESSARY'
      };

      const category = purposeMapping[purpose];
      if (!category) {
        return false;
      }

      const categoryConsent = consentData.categories[category];
      return categoryConsent && categoryConsent.granted;
    },

    /**
     * Generate compliance report
     */
    generateComplianceReport() {
      return {
        timestamp: new Date().toISOString(),
        gdpr: {
          enabled: COMPLIANCE_CONFIG.GDPR.ENABLED,
          consentRequired: COMPLIANCE_CONFIG.GDPR.CONSENT_REQUIRED,
          subjectRights: COMPLIANCE_CONFIG.GDPR.SUBJECT_RIGHTS
        },
        pciDss: {
          enabled: COMPLIANCE_CONFIG.PCI_DSS.ENABLED,
          version: COMPLIANCE_CONFIG.PCI_DSS.VERSION,
          clientSideSecurity: COMPLIANCE_CONFIG.PCI_DSS.REQUIREMENTS.CLIENT_SIDE_SECURITY
        },
        sox: {
          enabled: COMPLIANCE_CONFIG.SOX.ENABLED,
          auditControls: COMPLIANCE_CONFIG.SOX.CONTROLS.AUDIT_CONTROLS
        },
        ccpa: {
          enabled: COMPLIANCE_CONFIG.CCPA.ENABLED,
          consumerRights: COMPLIANCE_CONFIG.CCPA.CONSUMER_RIGHTS
        },
        mobile: {
          deviceCompliance: COMPLIANCE_CONFIG.MOBILE.DEVICE_COMPLIANCE,
          appCompliance: COMPLIANCE_CONFIG.MOBILE.APP_COMPLIANCE,
          dataCompliance: COMPLIANCE_CONFIG.MOBILE.DATA_COMPLIANCE
        }
      };
    },

    /**
     * Check PCI DSS compliance for data handling
     */
    checkPciCompliance(dataType, operation) {
      const sensitiveData = COMPLIANCE_CONFIG.PCI_DSS.SENSITIVE_DATA;
      const restrictions = COMPLIANCE_CONFIG.PCI_DSS.STORAGE_RESTRICTIONS;

      if (Object.values(sensitiveData).includes(dataType)) {
        if (operation === 'store' && restrictions.NO_STORAGE.includes(dataType)) {
          return {
            compliant: false,
            reason: `Storage of ${dataType} is prohibited by PCI DSS`
          };
        }

        if (operation === 'display' && restrictions.MASKED_DISPLAY.includes(dataType)) {
          return {
            compliant: true,
            requirement: 'Data must be masked when displayed'
          };
        }

        if (operation === 'store' && restrictions.ENCRYPTED_STORAGE.includes(dataType)) {
          return {
            compliant: true,
            requirement: 'Data must be encrypted when stored'
          };
        }
      }

      return { compliant: true };
    },

    /**
     * Validate mobile app compliance
     */
    validateMobileCompliance() {
      const issues = [];

      // Check device compliance
      if (COMPLIANCE_CONFIG.MOBILE.DEVICE_COMPLIANCE.REQUIRE_PASSCODE) {
        // This would be checked via native mobile APIs
        // For web context, we can only check basic security
      }

      // Check app compliance
      if (COMPLIANCE_CONFIG.MOBILE.APP_COMPLIANCE.CODE_SIGNING) {
        // Verify app signature (mobile-specific)
      }

      // Check data compliance
      if (COMPLIANCE_CONFIG.MOBILE.DATA_COMPLIANCE.ENCRYPTION_AT_REST) {
        // Verify secure storage implementation
      }

      return {
        compliant: issues.length === 0,
        issues
      };
    },

    /**
     * Generate audit log entry
     */
    generateAuditLog(eventType, userId, details) {
      return {
        timestamp: new Date().toISOString(),
        eventType,
        userId,
        sessionId: sessionStorage.getItem('sessionId'),
        deviceId: localStorage.getItem('deviceId'),
        ipAddress: 'client-side', // Would be set by server
        userAgent: navigator.userAgent,
        details,
        compliance: {
          gdpr: COMPLIANCE_CONFIG.GDPR.ENABLED,
          pciDss: COMPLIANCE_CONFIG.PCI_DSS.ENABLED,
          sox: COMPLIANCE_CONFIG.SOX.ENABLED
        }
      };
    }
  }
};

export default COMPLIANCE_CONFIG;

