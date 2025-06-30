/**
 * Compliance Configuration for Flowlet Financial Application
 * Implements GDPR, PCI DSS, SOX, and other financial compliance requirements
 */

export const COMPLIANCE_CONFIG = {
  // GDPR Configuration
  GDPR: {
    ENABLED: true,
    CONSENT_REQUIRED: true,
    CONSENT_CATEGORIES: [
      {
        id: 'essential',
        name: 'Essential Cookies',
        description: 'Required for basic website functionality',
        required: true,
        enabled: true
      },
      {
        id: 'functional',
        name: 'Functional Cookies',
        description: 'Enable enhanced functionality and personalization',
        required: false,
        enabled: false
      },
      {
        id: 'analytics',
        name: 'Analytics Cookies',
        description: 'Help us understand how visitors interact with our website',
        required: false,
        enabled: false
      },
      {
        id: 'marketing',
        name: 'Marketing Cookies',
        description: 'Used to track visitors across websites for marketing purposes',
        required: false,
        enabled: false
      }
    ],
    DATA_RETENTION: {
      USER_DATA: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      SESSION_DATA: 30 * 24 * 60 * 60 * 1000, // 30 days
      LOG_DATA: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      CONSENT_DATA: 2 * 365 * 24 * 60 * 60 * 1000 // 2 years
    },
    RIGHTS: {
      ACCESS: true,
      RECTIFICATION: true,
      ERASURE: true,
      PORTABILITY: true,
      RESTRICTION: true,
      OBJECTION: true,
      AUTOMATED_DECISION_MAKING: false
    },
    LAWFUL_BASIS: [
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests'
    ]
  },

  // PCI DSS Configuration
  PCI_DSS: {
    ENABLED: true,
    VERSION: '4.0',
    REQUIREMENTS: {
      // Requirement 1: Install and maintain network security controls
      NETWORK_SECURITY: {
        firewall_configured: true,
        default_passwords_changed: true,
        network_segmentation: true
      },
      
      // Requirement 2: Apply secure configurations
      SECURE_CONFIGURATIONS: {
        vendor_defaults_removed: true,
        security_parameters_configured: true,
        encryption_enabled: true
      },
      
      // Requirement 3: Protect stored cardholder data
      DATA_PROTECTION: {
        data_retention_policy: true,
        secure_deletion: true,
        encryption_at_rest: true,
        key_management: true
      },
      
      // Requirement 4: Protect cardholder data with strong cryptography
      CRYPTOGRAPHY: {
        encryption_in_transit: true,
        strong_cryptography: true,
        secure_protocols: true
      },
      
      // Requirement 6: Develop and maintain secure systems
      SECURE_DEVELOPMENT: {
        security_vulnerabilities: true,
        secure_coding: true,
        change_control: true,
        web_application_security: true
      }
    },
    CARDHOLDER_DATA: {
      STORAGE_PROHIBITED: [
        'full_magnetic_stripe',
        'cav2_cvc2_cvv2_cid',
        'pin_pin_block'
      ],
      MASKING_REQUIRED: true,
      ENCRYPTION_REQUIRED: true,
      ACCESS_LOGGING: true
    },
    CLIENT_SIDE_SECURITY: {
      // PCI DSS 6.4.3 - Client-side security for payment pages
      SCRIPT_INTEGRITY: true,
      CSP_ENABLED: true,
      SRI_ENABLED: true,
      MONITORING_ENABLED: true
    }
  },

  // SOX Compliance (Sarbanes-Oxley Act)
  SOX: {
    ENABLED: true,
    CONTROLS: {
      ACCESS_CONTROLS: true,
      CHANGE_MANAGEMENT: true,
      DATA_BACKUP: true,
      INCIDENT_RESPONSE: true,
      MONITORING: true,
      DOCUMENTATION: true
    },
    AUDIT_REQUIREMENTS: {
      USER_ACCESS_REVIEWS: true,
      CHANGE_LOGS: true,
      SECURITY_ASSESSMENTS: true,
      CONTROL_TESTING: true,
      DOCUMENTATION_REVIEWS: true
    },
    REPORTING: {
      QUARTERLY_REPORTS: true,
      ANNUAL_ASSESSMENTS: true,
      DEFICIENCY_TRACKING: true,
      REMEDIATION_PLANS: true
    }
  },

  // CCPA (California Consumer Privacy Act)
  CCPA: {
    ENABLED: true,
    CONSUMER_RIGHTS: {
      KNOW: true, // Right to know what personal information is collected
      DELETE: true, // Right to delete personal information
      OPT_OUT: true, // Right to opt-out of sale of personal information
      NON_DISCRIMINATION: true // Right to non-discrimination
    },
    DISCLOSURE_REQUIREMENTS: {
      COLLECTION_NOTICE: true,
      PRIVACY_POLICY: true,
      OPT_OUT_LINK: true
    }
  },

  // Financial Industry Regulatory Authority (FINRA)
  FINRA: {
    ENABLED: true,
    REQUIREMENTS: {
      BOOKS_AND_RECORDS: true,
      CUSTOMER_PROTECTION: true,
      ANTI_MONEY_LAUNDERING: true,
      KNOW_YOUR_CUSTOMER: true,
      SUPERVISION: true
    }
  },

  // Audit and Logging Configuration
  AUDIT: {
    ENABLED: true,
    LOG_RETENTION: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    EVENTS_TO_LOG: [
      'user_login',
      'user_logout',
      'data_access',
      'data_modification',
      'permission_changes',
      'system_configuration_changes',
      'security_events',
      'failed_access_attempts',
      'privilege_escalation',
      'data_export',
      'account_creation',
      'account_deletion',
      'password_changes',
      'mfa_events'
    ],
    LOG_FIELDS: [
      'timestamp',
      'user_id',
      'session_id',
      'ip_address',
      'user_agent',
      'action',
      'resource',
      'result',
      'risk_score'
    ],
    REAL_TIME_MONITORING: true,
    AUTOMATED_ALERTS: true
  },

  // Data Classification
  DATA_CLASSIFICATION: {
    PUBLIC: {
      level: 0,
      description: 'Information that can be freely shared',
      handling: 'standard'
    },
    INTERNAL: {
      level: 1,
      description: 'Information for internal use only',
      handling: 'controlled'
    },
    CONFIDENTIAL: {
      level: 2,
      description: 'Sensitive business information',
      handling: 'restricted'
    },
    RESTRICTED: {
      level: 3,
      description: 'Highly sensitive information requiring special handling',
      handling: 'highly_restricted'
    },
    PII: {
      level: 4,
      description: 'Personally Identifiable Information',
      handling: 'privacy_protected'
    },
    FINANCIAL: {
      level: 5,
      description: 'Financial and payment information',
      handling: 'financial_grade'
    }
  },

  // Privacy Configuration
  PRIVACY: {
    DATA_MINIMIZATION: true,
    PURPOSE_LIMITATION: true,
    STORAGE_LIMITATION: true,
    ACCURACY: true,
    INTEGRITY_CONFIDENTIALITY: true,
    ACCOUNTABILITY: true,
    PRIVACY_BY_DESIGN: true,
    PRIVACY_BY_DEFAULT: true
  },

  // Incident Response
  INCIDENT_RESPONSE: {
    ENABLED: true,
    NOTIFICATION_TIMEFRAME: 72 * 60 * 60 * 1000, // 72 hours for GDPR
    BREACH_CATEGORIES: [
      'confidentiality_breach',
      'integrity_breach',
      'availability_breach'
    ],
    SEVERITY_LEVELS: [
      'low',
      'medium',
      'high',
      'critical'
    ],
    RESPONSE_TEAM: [
      'security_officer',
      'privacy_officer',
      'legal_counsel',
      'it_manager',
      'business_owner'
    ]
  }
};

// Compliance utility functions
export const ComplianceUtils = {
  /**
   * Check if GDPR consent is required
   */
  isGDPRConsentRequired() {
    return COMPLIANCE_CONFIG.GDPR.ENABLED && COMPLIANCE_CONFIG.GDPR.CONSENT_REQUIRED;
  },

  /**
   * Get required consent categories
   */
  getRequiredConsentCategories() {
    return COMPLIANCE_CONFIG.GDPR.CONSENT_CATEGORIES.filter(category => category.required);
  },

  /**
   * Validate data retention period
   */
  validateDataRetention(dataType, timestamp) {
    const retentionPeriod = COMPLIANCE_CONFIG.GDPR.DATA_RETENTION[dataType];
    if (!retentionPeriod) return true;
    
    const now = Date.now();
    const dataAge = now - timestamp;
    return dataAge < retentionPeriod;
  },

  /**
   * Check if data should be anonymized
   */
  shouldAnonymizeData(dataType, timestamp) {
    return !this.validateDataRetention(dataType, timestamp);
  },

  /**
   * Get data classification level
   */
  getDataClassification(dataType) {
    return COMPLIANCE_CONFIG.DATA_CLASSIFICATION[dataType] || 
           COMPLIANCE_CONFIG.DATA_CLASSIFICATION.INTERNAL;
  },

  /**
   * Check if audit logging is required for action
   */
  isAuditLoggingRequired(action) {
    return COMPLIANCE_CONFIG.AUDIT.ENABLED && 
           COMPLIANCE_CONFIG.AUDIT.EVENTS_TO_LOG.includes(action);
  },

  /**
   * Generate compliance report
   */
  generateComplianceReport() {
    return {
      gdpr: {
        enabled: COMPLIANCE_CONFIG.GDPR.ENABLED,
        consentManagement: COMPLIANCE_CONFIG.GDPR.CONSENT_REQUIRED,
        dataRights: Object.keys(COMPLIANCE_CONFIG.GDPR.RIGHTS).filter(
          right => COMPLIANCE_CONFIG.GDPR.RIGHTS[right]
        )
      },
      pciDss: {
        enabled: COMPLIANCE_CONFIG.PCI_DSS.ENABLED,
        version: COMPLIANCE_CONFIG.PCI_DSS.VERSION,
        clientSideSecurity: COMPLIANCE_CONFIG.PCI_DSS.CLIENT_SIDE_SECURITY
      },
      sox: {
        enabled: COMPLIANCE_CONFIG.SOX.ENABLED,
        controls: Object.keys(COMPLIANCE_CONFIG.SOX.CONTROLS).filter(
          control => COMPLIANCE_CONFIG.SOX.CONTROLS[control]
        )
      },
      audit: {
        enabled: COMPLIANCE_CONFIG.AUDIT.ENABLED,
        realTimeMonitoring: COMPLIANCE_CONFIG.AUDIT.REAL_TIME_MONITORING,
        retentionPeriod: COMPLIANCE_CONFIG.AUDIT.LOG_RETENTION
      }
    };
  }
};

export default COMPLIANCE_CONFIG;

