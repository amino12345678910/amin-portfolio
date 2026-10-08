/**
 * Secure Configuration System
 * Replaces sensitive environment configuration with secure client-side configuration
 * All sensitive data is handled server-side only
 */

class SecureConfigManager {
  constructor() {
    this.config = null;
    this.environment = null;
    this.csrfToken = null;
    this.initialized = false;
    this.sessionId = this.getSessionId();
    
    // Only non-sensitive configuration exposed to client
    this.clientConfig = {
      api: {
        proxy_endpoint: '/api/chatbot-proxy.php',
        csrf_endpoint: '/api/csrf-token.php',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      security: {
        max_message_length: 5000,
        csrf_enabled: true,
        rate_limit_enabled: true
      },
      debug: {
        enabled: this.isDevelopment(),
        verbose: false,
        level: this.isDevelopment() ? 'info' : 'error'
      }
    };
  }

  /**
   * Initialize secure configuration
   */
  async initialize() {
    if (this.initialized) {
      return this.config;
    }

    this.log('🔒 Initializing Secure Configuration System...');
    
    try {
      // Detect environment (client-side detection only)
      this.environment = this.detectEnvironment();
      
      // Load CSRF token
      await this.loadCSRFToken();
      
      // Set up secure fetch wrapper
      this.setupSecureFetch();
      
      // Apply security configurations
      this.applySecurityMeasures();
      
      this.config = this.clientConfig;
      this.initialized = true;
      
      this.log('✅ Secure configuration initialized');
      
      return this.config;
      
    } catch (error) {
      this.logError('Secure configuration initialization failed:', error);
      
      // Fallback to minimal secure config
      this.config = this.getMinimalSecureConfig();
      this.initialized = true;
      
      return this.config;
    }
  }

  /**
   * Detect environment (basic client-side detection)
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Local development detection
    if (protocol === 'file:' || 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.includes('local')) {
      return 'development';
    }
    
    // Production detection
    if (hostname === 'safonas.com' || hostname === 'www.safonas.com') {
      return 'production';
    }
    
    // Default to production for security
    return 'production';
  }

  /**
   * Load CSRF token from server
   */
  async loadCSRFToken() {
    try {
      const response = await fetch(this.clientConfig.api.csrf_endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrf_token;
        this.log('✅ CSRF token loaded');
      } else {
        throw new Error('Failed to load CSRF token');
      }
    } catch (error) {
      this.logError('CSRF token loading failed:', error);
      // Generate client-side fallback token
      this.csrfToken = this.generateFallbackToken();
    }
  }

  /**
   * Setup secure fetch wrapper
   */
  setupSecureFetch() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function(url, options = {}) {
      // Only intercept requests to our proxy
      if (typeof url === 'string' && url.includes('/api/')) {
        // Add security headers
        options.headers = {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': self.csrfToken || '',
          'X-Session-ID': self.sessionId,
          ...options.headers
        };
        
        // Add credentials for same-origin requests
        options.credentials = 'include';
        
        // Add timeout
        if (!options.signal) {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), self.clientConfig.api.timeout);
          options.signal = controller.signal;
        }
      }
      
      return originalFetch(url, options);
    };
    
    this.log('🛡️ Secure fetch wrapper configured');
  }

  /**
   * Apply security measures
   */
  applySecurityMeasures() {
    // Disable debug in production
    if (this.environment === 'production') {
      // Override console methods
      const noop = () => {};
      window.console = {
        ...window.console,
        log: noop,
        debug: noop,
        info: noop
      };
    }
    
    // Set global security flags
    window.SECURE_MODE = true;
    window.ENVIRONMENT = this.environment;
    window.DEBUG_ENABLED = this.clientConfig.debug.enabled;
    
    // Clear any exposed configuration
    delete window.environmentConfig;
    delete window.n8nWebhookUrl;
    
    this.log('🔐 Security measures applied');
  }

  /**
   * Get minimal secure configuration for fallback
   */
  getMinimalSecureConfig() {
    return {
      api: {
        proxy_endpoint: '/api/chatbot-proxy.php',
        timeout: 30000,
        retryAttempts: 1
      },
      security: {
        max_message_length: 1000,
        csrf_enabled: false,
        rate_limit_enabled: true
      },
      debug: {
        enabled: false,
        verbose: false,
        level: 'error'
      }
    };
  }

  /**
   * Secure message sending
   */
  async sendSecureMessage(message, platform = 'desktop') {
    try {
      // Validate message
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message');
      }
      
      if (message.length > this.config.security.max_message_length) {
        throw new Error('Message too long');
      }
      
      // Sanitize message
      const sanitizedMessage = this.sanitizeMessage(message);
      
      // Prepare request payload
      const payload = {
        message: sanitizedMessage,
        session_id: this.sessionId,
        platform: platform,
        timestamp: new Date().toISOString(),
        csrf_token: this.csrfToken
      };
      
      // Send to secure proxy
      const response = await this.retryRequest(() => 
        fetch(this.config.api.proxy_endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          response: data.response || data.reply || 'Message reçu',
          request_id: data.request_id
        };
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
      
    } catch (error) {
      this.logError('Secure message sending failed:', error);
      return {
        success: false,
        response: 'Une erreur est survenue. Veuillez réessayer.',
        error: error.message
      };
    }
  }

  /**
   * Sanitize message content
   */
  sanitizeMessage(message) {
    // Remove potentially dangerous content
    return message
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/document\.cookie/gi, '')
      .replace(/window\.location/gi, '')
      .trim();
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retryRequest(requestFunction) {
    const maxRetries = this.config.api.retryAttempts;
    const baseDelay = this.config.api.retryDelay;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFunction();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Generate session ID
   */
  getSessionId() {
    let sessionId = localStorage.getItem("safonas_secure_session_id");
    
    if (!sessionId) {
      sessionId = crypto.randomUUID ? 
        crypto.randomUUID() : 
        this.generateFallbackUUID();
      localStorage.setItem("safonas_secure_session_id", sessionId);
    }
    
    return sessionId;
  }

  /**
   * Generate fallback UUID
   */
  generateFallbackUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate fallback token
   */
  generateFallbackToken() {
    const array = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for older browsers
      return Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
  }

  /**
   * Check if in development mode
   */
  isDevelopment() {
    return this.environment === 'development' || 
           window.location.hostname === 'localhost' ||
           window.location.protocol === 'file:';
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Internal logging
   */
  log(message, data = null) {
    if (this.clientConfig.debug.enabled && window.console) {
      // Only log in development mode
    }
  }

  /**
   * Error logging
   */
  logError(message, error) {
    if (window.console && window.console.error) {
      // Only log errors, never expose sensitive data
    }
  }
}

// Create global secure configuration manager
window.SecureConfigManager = SecureConfigManager;
window.secureConfigManager = new SecureConfigManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.secureConfigManager.initialize();
  });
} else {
  window.secureConfigManager.initialize();
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecureConfigManager;
}