/**
 * Security Headers Management Service
 * Implements comprehensive security headers for financial applications
 */

export interface SecurityHeadersConfig {
  csp?: string;
  hsts?: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  contentTypeOptions?: boolean;
  xssProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string[];
  crossOriginEmbedderPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;
}

/**
 * Security Headers Service
 */
export class SecurityHeadersService {
  private static readonly DEFAULT_CONFIG: SecurityHeadersConfig = {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameOptions: 'DENY',
    contentTypeOptions: true,
    xssProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
      'fullscreen=(self)',
      'picture-in-picture=()'
    ],
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin'
  };

  /**
   * Generate security headers object
   * @param config - Custom configuration
   * @returns Headers object
   */
  static generateHeaders(config: Partial<SecurityHeadersConfig> = {}): Record<string, string> {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (mergedConfig.csp) {
      headers['Content-Security-Policy'] = mergedConfig.csp;
    }

    // HTTP Strict Transport Security
    if (mergedConfig.hsts) {
      const { maxAge, includeSubDomains, preload } = mergedConfig.hsts;
      let hstsValue = `max-age=${maxAge}`;
      if (includeSubDomains) hstsValue += '; includeSubDomains';
      if (preload) hstsValue += '; preload';
      headers['Strict-Transport-Security'] = hstsValue;
    }

    // X-Frame-Options
    if (mergedConfig.frameOptions) {
      headers['X-Frame-Options'] = mergedConfig.frameOptions;
    }

    // X-Content-Type-Options
    if (mergedConfig.contentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-XSS-Protection
    if (mergedConfig.xssProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    // Referrer-Policy
    if (mergedConfig.referrerPolicy) {
      headers['Referrer-Policy'] = mergedConfig.referrerPolicy;
    }

    // Permissions-Policy
    if (mergedConfig.permissionsPolicy) {
      headers['Permissions-Policy'] = mergedConfig.permissionsPolicy.join(', ');
    }

    // Cross-Origin Embedder Policy
    if (mergedConfig.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = mergedConfig.crossOriginEmbedderPolicy;
    }

    // Cross-Origin Opener Policy
    if (mergedConfig.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = mergedConfig.crossOriginOpenerPolicy;
    }

    // Cross-Origin Resource Policy
    if (mergedConfig.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = mergedConfig.crossOriginResourcePolicy;
    }

    return headers;
  }

  /**
   * Apply security headers to HTTP client
   * @param headers - Existing headers
   * @param config - Security configuration
   * @returns Enhanced headers
   */
  static applyToRequest(
    headers: Record<string, string> = {},
    config: Partial<SecurityHeadersConfig> = {}
  ): Record<string, string> {
    const securityHeaders = this.generateHeaders(config);
    return { ...headers, ...securityHeaders };
  }

  /**
   * Validate security headers in response
   * @param response - HTTP response
   * @returns Validation result
   */
  static validateResponse(response: Response): {
    isSecure: boolean;
    missingHeaders: string[];
    warnings: string[];
  } {
    const missingHeaders: string[] = [];
    const warnings: string[] = [];
    
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy'
    ];

    const recommendedHeaders = [
      'Strict-Transport-Security',
      'X-XSS-Protection',
      'Permissions-Policy'
    ];

    // Check required headers
    requiredHeaders.forEach(header => {
      if (!response.headers.get(header)) {
        missingHeaders.push(header);
      }
    });

    // Check recommended headers
    recommendedHeaders.forEach(header => {
      if (!response.headers.get(header)) {
        warnings.push(`Missing recommended header: ${header}`);
      }
    });

    // Validate CSP
    const csp = response.headers.get('Content-Security-Policy');
    if (csp) {
      if (!csp.includes("'unsafe-inline'") && !csp.includes("'strict-dynamic'")) {
        // Good - no unsafe inline
      } else if (csp.includes("'unsafe-inline'")) {
        warnings.push('CSP allows unsafe-inline which may be risky');
      }
    }

    // Validate HSTS
    const hsts = response.headers.get('Strict-Transport-Security');
    if (hsts) {
      const maxAge = hsts.match(/max-age=(\d+)/);
      if (maxAge && parseInt(maxAge[1]) < 31536000) {
        warnings.push('HSTS max-age should be at least 1 year (31536000 seconds)');
      }
    }

    return {
      isSecure: missingHeaders.length === 0,
      missingHeaders,
      warnings
    };
  }

  /**
   * Create secure fetch wrapper with security headers
   * @param config - Security configuration
   * @returns Enhanced fetch function
   */
  static createSecureFetch(config: Partial<SecurityHeadersConfig> = {}) {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const secureHeaders = this.applyToRequest(
        options.headers as Record<string, string>,
        config
      );

      const secureOptions: RequestInit = {
        ...options,
        headers: {
          ...secureHeaders,
          // Add CSRF protection
          'X-Requested-With': 'XMLHttpRequest',
          // Add timestamp for request freshness
          'X-Request-Timestamp': Date.now().toString()
        },
        // Ensure credentials are handled securely
        credentials: options.credentials || 'same-origin',
        // Set secure mode
        mode: options.mode || 'cors',
        // Set cache policy
        cache: options.cache || 'no-cache'
      };

      try {
        const response = await fetch(url, secureOptions);
        
        // Validate response security headers
        const validation = this.validateResponse(response);
        if (!validation.isSecure) {
          console.warn('Response missing security headers:', validation.missingHeaders);
        }
        
        if (validation.warnings.length > 0) {
          console.warn('Security warnings:', validation.warnings);
        }

        return response;
      } catch (error) {
        console.error('Secure fetch failed:', error);
        throw error;
      }
    };
  }

  /**
   * Monitor security headers compliance
   * @param url - URL to monitor
   * @returns Monitoring result
   */
  static async monitorCompliance(url: string): Promise<{
    url: string;
    timestamp: string;
    compliance: {
      isSecure: boolean;
      missingHeaders: string[];
      warnings: string[];
    };
    headers: Record<string, string>;
  }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const compliance = this.validateResponse(response);
      
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        url,
        timestamp: new Date().toISOString(),
        compliance,
        headers
      };
    } catch (error) {
      throw new Error(`Failed to monitor compliance for ${url}: ${error}`);
    }
  }

  /**
   * Generate security report
   * @param urls - URLs to check
   * @returns Security compliance report
   */
  static async generateSecurityReport(urls: string[]): Promise<{
    timestamp: string;
    overallCompliance: boolean;
    results: Array<{
      url: string;
      isSecure: boolean;
      missingHeaders: string[];
      warnings: string[];
    }>;
    recommendations: string[];
  }> {
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const monitoring = await this.monitorCompliance(url);
          return {
            url,
            isSecure: monitoring.compliance.isSecure,
            missingHeaders: monitoring.compliance.missingHeaders,
            warnings: monitoring.compliance.warnings
          };
        } catch (error) {
          return {
            url,
            isSecure: false,
            missingHeaders: ['Failed to check'],
            warnings: [`Error: ${error}`]
          };
        }
      })
    );

    const overallCompliance = results.every(result => result.isSecure);
    
    // Generate recommendations
    const recommendations: string[] = [];
    const allMissingHeaders = new Set<string>();
    
    results.forEach(result => {
      result.missingHeaders.forEach(header => allMissingHeaders.add(header));
    });

    if (allMissingHeaders.has('Content-Security-Policy')) {
      recommendations.push('Implement Content Security Policy to prevent XSS attacks');
    }
    
    if (allMissingHeaders.has('Strict-Transport-Security')) {
      recommendations.push('Enable HSTS to enforce HTTPS connections');
    }
    
    if (allMissingHeaders.has('X-Frame-Options')) {
      recommendations.push('Set X-Frame-Options to prevent clickjacking attacks');
    }

    return {
      timestamp: new Date().toISOString(),
      overallCompliance,
      results,
      recommendations
    };
  }
}

/**
 * CSRF Protection Service
 */
export class CSRFService {
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly TOKEN_STORAGE_KEY = 'csrf_token';

  /**
   * Generate CSRF token
   * @returns CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Set CSRF token
   * @param token - CSRF token
   */
  static setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_STORAGE_KEY, token);
  }

  /**
   * Get CSRF token
   * @returns CSRF token or null
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
  }

  /**
   * Add CSRF token to request headers
   * @param headers - Existing headers
   * @returns Headers with CSRF token
   */
  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[this.TOKEN_HEADER] = token;
    }
    return headers;
  }

  /**
   * Validate CSRF token
   * @param token - Token to validate
   * @returns True if valid
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }
}

export default SecurityHeadersService;

