/**
 * Content Security Policy (CSP) configuration for financial applications
 * Implements strict security policies to prevent XSS and data injection attacks
 */

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'frame-ancestors'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
  'worker-src'?: string[];
  'child-src'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

/**
 * CSP Configuration Service
 */
export class CSPService {
  
  /**
   * Generate strict CSP for financial applications
   * @param options - Custom CSP options
   * @returns CSP header string
   */
  static generateStrictCSP(options: Partial<CSPDirectives> = {}): string {
    const defaultDirectives: CSPDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'strict-dynamic'",
        // Allow specific trusted domains for financial services
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        'https://api.plaid.com',
        // Nonce will be added dynamically
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS libraries
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        // Allow trusted image sources
        'https://logos.stripe.com',
        'https://q.stripe.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'connect-src': [
        "'self'",
        // API endpoints
        'https://api.stripe.com',
        'https://api.plaid.com',
        'https://production.plaid.com',
        'https://sandbox.plaid.com',
        // WebSocket connections
        'wss://ws.stripe.com',
        // Analytics (if needed)
        'https://analytics.google.com'
      ],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': [
        "'self'",
        // Payment frames
        'https://js.stripe.com',
        'https://hooks.stripe.com',
        'https://checkout.stripe.com'
      ],
      'frame-ancestors': ["'none'"], // Prevent clickjacking
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'"],
      'child-src': ["'none'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true
    };

    // Merge with custom options
    const mergedDirectives = { ...defaultDirectives, ...options };
    
    // Convert to CSP string
    const cspParts: string[] = [];
    
    Object.entries(mergedDirectives).forEach(([directive, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          cspParts.push(directive);
        }
      } else if (Array.isArray(value) && value.length > 0) {
        cspParts.push(`${directive} ${value.join(' ')}`);
      }
    });
    
    return cspParts.join('; ');
  }

  /**
   * Generate CSP for development environment
   * @returns Development CSP header string
   */
  static generateDevelopmentCSP(): string {
    return this.generateStrictCSP({
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Required for development
        "'unsafe-inline'", // Required for HMR
        'localhost:*',
        '127.0.0.1:*',
        'ws://localhost:*',
        'ws://127.0.0.1:*'
      ],
      'connect-src': [
        "'self'",
        'localhost:*',
        '127.0.0.1:*',
        'ws://localhost:*',
        'ws://127.0.0.1:*',
        'https://api.stripe.com',
        'https://api.plaid.com'
      ]
    });
  }

  /**
   * Generate nonce for inline scripts
   * @returns Base64 encoded nonce
   */
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
  }

  /**
   * Apply CSP to document
   * @param csp - CSP header string
   */
  static applyCSP(csp: string): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
  }

  /**
   * Validate CSP compliance for a given resource
   * @param resourceType - Type of resource (script, style, img, etc.)
   * @param resourceUrl - URL of the resource
   * @param csp - CSP directives object
   * @returns True if resource is allowed by CSP
   */
  static validateResource(
    resourceType: string,
    resourceUrl: string,
    csp: CSPDirectives
  ): boolean {
    const directiveMap: { [key: string]: keyof CSPDirectives } = {
      'script': 'script-src',
      'style': 'style-src',
      'img': 'img-src',
      'font': 'font-src',
      'connect': 'connect-src',
      'media': 'media-src',
      'object': 'object-src',
      'frame': 'frame-src'
    };

    const directive = directiveMap[resourceType] || 'default-src';
    const allowedSources = csp[directive] || csp['default-src'] || [];

    // Check if resource URL matches any allowed source
    return allowedSources.some(source => {
      if (source === "'self'") {
        return new URL(resourceUrl).origin === window.location.origin;
      }
      if (source === "'none'") {
        return false;
      }
      if (source.startsWith('https://')) {
        return resourceUrl.startsWith(source) || 
               new URL(resourceUrl).hostname === new URL(source).hostname;
      }
      return false;
    });
  }

  /**
   * Report CSP violations
   * @param violationReport - CSP violation report
   */
  static reportViolation(violationReport: any): void {
    console.error('CSP Violation:', violationReport);
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/csp-violation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...violationReport,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(error => {
        console.error('Failed to report CSP violation:', error);
      });
    }
  }
}

/**
 * Security Headers Configuration
 */
export class SecurityHeadersService {
  
  /**
   * Get recommended security headers for financial applications
   * @returns Object containing security headers
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      // Content Security Policy
      'Content-Security-Policy': CSPService.generateStrictCSP(),
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Strict Transport Security (HTTPS only)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy (formerly Feature Policy)
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=(self)',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()'
      ].join(', '),
      
      // Cross-Origin Embedder Policy
      'Cross-Origin-Embedder-Policy': 'require-corp',
      
      // Cross-Origin Opener Policy
      'Cross-Origin-Opener-Policy': 'same-origin',
      
      // Cross-Origin Resource Policy
      'Cross-Origin-Resource-Policy': 'same-origin'
    };
  }

  /**
   * Apply security headers to fetch requests
   * @param headers - Existing headers object
   * @returns Headers with security headers applied
   */
  static applyToFetch(headers: HeadersInit = {}): HeadersInit {
    const securityHeaders = this.getSecurityHeaders();
    return {
      ...headers,
      ...securityHeaders
    };
  }
}

// Initialize CSP violation reporting
if (typeof window !== 'undefined') {
  document.addEventListener('securitypolicyviolation', (event) => {
    CSPService.reportViolation({
      blockedURI: event.blockedURI,
      columnNumber: event.columnNumber,
      disposition: event.disposition,
      documentURI: event.documentURI,
      effectiveDirective: event.effectiveDirective,
      lineNumber: event.lineNumber,
      originalPolicy: event.originalPolicy,
      referrer: event.referrer,
      sample: event.sample,
      sourceFile: event.sourceFile,
      statusCode: event.statusCode,
      violatedDirective: event.violatedDirective
    });
  });
}

export default CSPService;

