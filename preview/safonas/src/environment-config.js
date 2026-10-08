/**
 * Environment Detection and Configuration System
 * Automatically adapts chatbot behavior based on hosting environment
 * 
 * Features:
 * - Detects local development vs production environments
 * - Configures Supabase connections appropriately
 * - Sets timeout values and retry policies
 * - Chooses between direct API calls vs PHP proxy
 * - Configures CORS settings
 * - Handles webhook URLs dynamically
 * - Provides debug mode settings
 * - Includes fallback configurations
 * - Logs environment detection results
 */

class EnvironmentConfigManager {
  constructor() {
    this.config = null;
    this.environment = null;
    this.detectionLog = [];
    this.initialized = false;
    
    // Default configurations for different environments
    this.environmentConfigs = {
      local_file: {
        name: "Local File Protocol",
        type: "development",
        protocol: "file:",
        supabase: {
          method: "direct",
          timeout: 10000,
          retryAttempts: 2,
          retryDelay: 1000,
          corsEnabled: true,
          fallbackToProxy: true
        },
        webhooks: {
          primary: "/api/chatbot-proxy.php",
          fallback: "/api/chatbot-proxy.php",
          timeout: 15000,
          retryAttempts: 3
        },
        api: {
          method: "direct",
          baseUrl: "https://ejonogfzwsrmuzgiywge.supabase.co",
          corsMode: "cors",
          credentials: "omit"
        },
        debug: {
          enabled: true,
          verbose: true,
          logLevel: "debug",
          showNotifications: true
        },
        features: {
          offlineMode: false,
          cacheEnabled: true,
          analytics: false,
          errorReporting: true
        }
      },
      
      local_http: {
        name: "Local HTTP Server",
        type: "development", 
        protocol: "http:",
        supabase: {
          method: "direct",
          timeout: 8000,
          retryAttempts: 3,
          retryDelay: 800,
          corsEnabled: true,
          fallbackToProxy: false
        },
        webhooks: {
          primary: "/api/chatbot-proxy.php",
          fallback: "/api/chatbot-proxy.php",
          timeout: 12000,
          retryAttempts: 2
        },
        api: {
          method: "direct",
          baseUrl: "https://ejonogfzwsrmuzgiywge.supabase.co", 
          corsMode: "cors",
          credentials: "same-origin"
        },
        debug: {
          enabled: true,
          verbose: true,
          logLevel: "debug",
          showNotifications: true
        },
        features: {
          offlineMode: false,
          cacheEnabled: true,
          analytics: false,
          errorReporting: true
        }
      },
      
      local_https: {
        name: "Local HTTPS Server",
        type: "development",
        protocol: "https:",
        supabase: {
          method: "direct",
          timeout: 6000,
          retryAttempts: 3,
          retryDelay: 600,
          corsEnabled: true,
          fallbackToProxy: false
        },
        webhooks: {
          primary: "/api/chatbot-proxy.php",
          fallback: "/api/chatbot-proxy.php",
          timeout: 10000,
          retryAttempts: 2
        },
        api: {
          method: "direct",
          baseUrl: "https://ejonogfzwsrmuzgiywge.supabase.co",
          corsMode: "cors", 
          credentials: "same-origin"
        },
        debug: {
          enabled: true,
          verbose: false,
          logLevel: "info",
          showNotifications: true
        },
        features: {
          offlineMode: false,
          cacheEnabled: true,
          analytics: false,
          errorReporting: true
        }
      },
      
      staging: {
        name: "Staging Environment",
        type: "staging",
        protocol: "https:",
        supabase: {
          method: "proxy",
          timeout: 5000,
          retryAttempts: 2,
          retryDelay: 500,
          corsEnabled: false,
          fallbackToProxy: true
        },
        webhooks: {
          primary: "/api/chatbot-proxy.php",
          fallback: "/api/chatbot-proxy.php",
          timeout: 8000,
          retryAttempts: 2
        },
        api: {
          method: "proxy",
          baseUrl: "https://staging.safonas.com/api",
          corsMode: "same-origin",
          credentials: "same-origin"
        },
        debug: {
          enabled: true,
          verbose: false,
          logLevel: "info",
          showNotifications: false
        },
        features: {
          offlineMode: false,
          cacheEnabled: true,
          analytics: true,
          errorReporting: true
        }
      },
      
      production: {
        name: "Production Environment",
        type: "production",
        protocol: "https:",
        supabase: {
          method: "proxy",
          timeout: 5000,
          retryAttempts: 2,
          retryDelay: 500,
          corsEnabled: false,
          fallbackToProxy: true
        },
        webhooks: {
          primary: "/api/chatbot-proxy.php",
          fallback: "/api/chatbot-proxy.php",
          timeout: 6000,
          retryAttempts: 2
        },
        api: {
          method: "proxy",
          baseUrl: "https://safonas.com/api",
          corsMode: "same-origin", 
          credentials: "same-origin"
        },
        debug: {
          enabled: false,
          verbose: false,
          logLevel: "error",
          showNotifications: false
        },
        features: {
          offlineMode: false,
          cacheEnabled: true,
          analytics: true,
          errorReporting: false
        }
      },
      
      cdn: {
        name: "CDN/Edge Environment",
        type: "production",
        protocol: "https:",
        supabase: {
          method: "direct",
          timeout: 3000,
          retryAttempts: 1,
          retryDelay: 300,
          corsEnabled: true,
          fallbackToProxy: true
        },
        webhooks: {
          primary: "/api/chatbot-proxy.php",
          fallback: "/api/chatbot-proxy.php",
          timeout: 4000,
          retryAttempts: 1
        },
        api: {
          method: "direct",
          baseUrl: "https://ejonogfzwsrmuzgiywge.supabase.co",
          corsMode: "cors",
          credentials: "omit"
        },
        debug: {
          enabled: false,
          verbose: false,
          logLevel: "error",
          showNotifications: false
        },
        features: {
          offlineMode: false,
          cacheEnabled: true,
          analytics: true,
          errorReporting: false
        }
      }
    };
  }

  /**
   * Initialize the environment configuration system
   */
  async initialize() {
    if (this.initialized) {
      return this.config;
    }

    this.log("🌍 Environment Detection System - Initializing...");
    
    try {
      // Detect the current environment
      this.environment = await this.detectEnvironment();
      
      // Get configuration for detected environment
      this.config = this.getConfigForEnvironment(this.environment);
      
      // Validate configuration
      this.validateConfiguration();
      
      // Apply environment-specific configurations
      await this.applyConfigurations();
      
      // Test connectivity
      await this.testConnectivity();
      
      this.initialized = true;
      
      this.log(`✅ Environment configuration initialized for: ${this.config.name}`);
      this.logConfiguration();
      
      return this.config;
      
    } catch (error) {
      this.log(`❌ Environment initialization failed: ${error.message}`, 'error');
      
      // Fallback to safe default configuration
      this.config = this.getFallbackConfiguration();
      this.initialized = true;
      
      return this.config;
    }
  }

  /**
   * Detect the current hosting environment
   */
  async detectEnvironment() {
    const detectionResults = {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      search: window.location.search,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    this.log("🔍 Detecting environment...", 'debug', detectionResults);
    
    // File protocol detection
    if (detectionResults.protocol === 'file:') {
      this.log("📁 File protocol detected - Local development environment");
      return 'local_file';
    }
    
    // Local development detection
    const localHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    const isLocalHost = localHosts.includes(detectionResults.hostname.toLowerCase()) || 
                       detectionResults.hostname.endsWith('.local') ||
                       detectionResults.hostname.startsWith('192.168.') ||
                       detectionResults.hostname.startsWith('10.') ||
                       detectionResults.hostname.startsWith('172.');
    
    if (isLocalHost) {
      if (detectionResults.protocol === 'https:') {
        this.log("🔒 Local HTTPS detected - Local development with SSL");
        return 'local_https';
      } else {
        this.log("🌐 Local HTTP detected - Local development server");
        return 'local_http';
      }
    }
    
    // Production domain detection
    if (detectionResults.hostname === 'safonas.com' || 
        detectionResults.hostname === 'www.safonas.com') {
      this.log("🚀 Production domain detected - Live environment");
      return 'production';
    }
    
    // Staging environment detection
    if (detectionResults.hostname.includes('staging') || 
        detectionResults.hostname.includes('dev') ||
        detectionResults.hostname.includes('test')) {
      this.log("🧪 Staging environment detected");
      return 'staging';
    }
    
    // CDN detection (Netlify, Vercel, etc.)
    const cdnPatterns = [
      /\.netlify\.app$/,
      /\.vercel\.app$/,
      /\.herokuapp\.com$/,
      /\.github\.io$/,
      /\.surge\.sh$/,
      /\.firebase\.app$/
    ];
    
    for (const pattern of cdnPatterns) {
      if (pattern.test(detectionResults.hostname)) {
        this.log("☁️ CDN/Edge environment detected");
        return 'cdn';
      }
    }
    
    // Default to production for HTTPS, staging for HTTP
    if (detectionResults.protocol === 'https:') {
      this.log("🔒 HTTPS detected - Defaulting to production configuration");
      return 'production';
    } else {
      this.log("⚠️ HTTP detected - Defaulting to staging configuration");
      return 'staging';
    }
  }

  /**
   * Get configuration for detected environment
   */
  getConfigForEnvironment(environmentType) {
    const config = this.environmentConfigs[environmentType];
    
    if (!config) {
      this.log(`⚠️ Unknown environment type: ${environmentType}, using fallback`, 'warning');
      return this.getFallbackConfiguration();
    }
    
    // Deep clone the configuration to avoid mutations
    return JSON.parse(JSON.stringify(config));
  }

  /**
   * Get fallback configuration for edge cases
   */
  getFallbackConfiguration() {
    this.log("🛟 Using fallback configuration", 'warning');
    
    return {
      name: "Fallback Configuration",
      type: "fallback",
      protocol: window.location.protocol || "https:",
      supabase: {
        method: "direct",
        timeout: 10000,
        retryAttempts: 1,
        retryDelay: 1000,
        corsEnabled: true,
        fallbackToProxy: true
      },
      webhooks: {
        primary: "/api/chatbot-proxy.php",
        fallback: null,
        timeout: 15000,
        retryAttempts: 1
      },
      api: {
        method: "direct",
        baseUrl: "https://ejonogfzwsrmuzgiywge.supabase.co",
        corsMode: "cors",
        credentials: "omit"
      },
      debug: {
        enabled: true,
        verbose: true,
        logLevel: "debug",
        showNotifications: true
      },
      features: {
        offlineMode: false,
        cacheEnabled: false,
        analytics: false,
        errorReporting: true
      }
    };
  }

  /**
   * Validate the configuration
   */
  validateConfiguration() {
    if (!this.config) {
      throw new Error("Configuration is null or undefined");
    }
    
    const requiredFields = [
      'supabase', 'webhooks', 'api', 'debug', 'features'
    ];
    
    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }
    
    // Validate timeout values
    if (this.config.supabase.timeout < 1000 || this.config.supabase.timeout > 30000) {
      this.log("⚠️ Invalid Supabase timeout, using default", 'warning');
      this.config.supabase.timeout = 8000;
    }
    
    if (this.config.webhooks.timeout < 1000 || this.config.webhooks.timeout > 60000) {
      this.log("⚠️ Invalid webhook timeout, using default", 'warning');
      this.config.webhooks.timeout = 10000;
    }
    
    this.log("✅ Configuration validation passed");
  }

  /**
   * Apply environment-specific configurations
   */
  async applyConfigurations() {
    this.log("⚙️ Applying environment configurations...");
    
    // Configure global timeout values
    if (window.fetch) {
      this.setupFetchTimeouts();
    }
    
    // Configure CORS settings
    this.configureCORS();
    
    // Setup debug logging
    this.configureDebugLogging();
    
    // Configure analytics
    this.configureAnalytics();
    
    // Setup error reporting
    this.configureErrorReporting();
    
    // Cache configuration globally
    window.environmentConfig = this.config;
    window.environmentManager = this;
    
    this.log("✅ Environment configurations applied");
  }

  /**
   * Setup fetch timeouts based on configuration
   */
  setupFetchTimeouts() {
    const originalFetch = window.fetch;
    const config = this.config;
    
    window.fetch = function(url, options = {}) {
      // Determine timeout based on URL type
      let timeout = config.supabase.timeout;
      
      if (typeof url === 'string') {
        if (url.includes('webhook')) {
          timeout = config.webhooks.timeout;
        } else if (url.includes('supabase.co')) {
          timeout = config.supabase.timeout;
        }
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      });
      
      // Race between fetch and timeout
      return Promise.race([
        originalFetch(url, options),
        timeoutPromise
      ]);
    };
    
    this.log(`🕒 Fetch timeouts configured - Supabase: ${config.supabase.timeout}ms, Webhooks: ${config.webhooks.timeout}ms`);
  }

  /**
   * Configure CORS settings
   */
  configureCORS() {
    if (this.config.supabase.corsEnabled) {
      // Add CORS headers to requests
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      };
      
      this.log("🌐 CORS enabled with headers:", corsHeaders);
    }
  }

  /**
   * Configure debug logging
   */
  configureDebugLogging() {
    const debugConfig = this.config.debug;
    
    // Set global debug flags
    window.DEBUG_ENABLED = debugConfig.enabled;
    window.DEBUG_VERBOSE = debugConfig.verbose;
    window.DEBUG_LEVEL = debugConfig.logLevel;
    
    if (!debugConfig.enabled) {
      // Override console methods in production
      const originalConsole = window.console;
      window.console = {
        ...originalConsole,
        log: debugConfig.logLevel === 'error' ? () => {} : originalConsole.log,
        debug: () => {},
        info: debugConfig.logLevel === 'error' ? () => {} : originalConsole.info,
        warn: originalConsole.warn,
        error: originalConsole.error
      };
    }
    
    this.log(`🐛 Debug logging configured - Enabled: ${debugConfig.enabled}, Level: ${debugConfig.logLevel}`);
  }

  /**
   * Configure analytics
   */
  configureAnalytics() {
    if (this.config.features.analytics && this.config.type === 'production') {
      // Initialize analytics in production
      this.log("📊 Analytics enabled for production environment");
      
      // You can add analytics initialization code here
      // window.gtag, window.analytics, etc.
    } else {
      this.log("📊 Analytics disabled for development environment");
    }
  }

  /**
   * Configure error reporting
   */
  configureErrorReporting() {
    if (this.config.features.errorReporting) {
      // Setup global error handler
      window.addEventListener('error', (event) => {
        this.logError('Global Error:', event.error);
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.logError('Unhandled Promise Rejection:', event.reason);
      });
      
      this.log("🚨 Error reporting enabled");
    }
  }

  /**
   * Test connectivity to external services
   */
  async testConnectivity() {
    this.log("🔌 Testing connectivity...");
    
    const tests = [];
    
    // Test webhook connectivity
    if (this.config.webhooks.primary) {
      tests.push(this.testWebhookConnectivity());
    }
    
    // Test Supabase connectivity
    tests.push(this.testSupabaseConnectivity());
    
    try {
      const results = await Promise.allSettled(tests);
      let successCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          this.log(`❌ Connectivity test ${index + 1} failed: ${result.reason}`, 'warning');
        }
      });
      
      this.log(`🔌 Connectivity tests completed: ${successCount}/${tests.length} successful`);
      
    } catch (error) {
      this.log(`⚠️ Connectivity testing failed: ${error.message}`, 'warning');
    }
  }

  /**
   * Test webhook connectivity
   */
  async testWebhookConnectivity() {
    const testUrl = this.config.webhooks.primary;
    
    try {
      // Send a minimal test request
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Environment-Test': 'true'
        },
        body: JSON.stringify({
          test: true,
          environment: this.environment,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok || response.status === 404) {
        // 404 is acceptable - webhook exists but may not handle test requests
        this.log("✅ Webhook connectivity test passed");
        return true;
      } else {
        throw new Error(`Webhook returned status: ${response.status}`);
      }
      
    } catch (error) {
      this.log(`⚠️ Webhook connectivity test failed: ${error.message}`, 'warning');
      throw error;
    }
  }

  /**
   * Test Supabase connectivity
   */
  async testSupabaseConnectivity() {
    if (!window.supabase || !window.supabaseClient) {
      this.log("⚠️ Supabase client not available for connectivity test", 'warning');
      return false;
    }
    
    try {
      // Simple connectivity test
      const { data, error } = await window.supabaseClient
        .from('chatbot_interactions')
        .select('id')
        .limit(1);
      
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw error;
      }
      
      this.log("✅ Supabase connectivity test passed");
      return true;
      
    } catch (error) {
      this.log(`⚠️ Supabase connectivity test failed: ${error.message}`, 'warning');
      throw error;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get environment type
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Check if in development mode
   */
  isDevelopment() {
    return this.config && (this.config.type === 'development' || this.config.type === 'staging');
  }

  /**
   * Check if in production mode
   */
  isProduction() {
    return this.config && this.config.type === 'production';
  }

  /**
   * Get appropriate API URL based on configuration
   */
  getApiUrl(endpoint) {
    if (this.config.api.method === 'proxy') {
      return `${this.config.api.baseUrl}/${endpoint}`;
    } else {
      // Direct API access
      return `${this.config.api.baseUrl}/rest/v1/${endpoint}`;
    }
  }

  /**
   * Get appropriate webhook URL with fallback
   */
  getWebhookUrl(useFallback = false) {
    if (useFallback && this.config.webhooks.fallback) {
      return this.config.webhooks.fallback;
    }
    return this.config.webhooks.primary;
  }

  /**
   * Create configured fetch options
   */
  getFetchOptions(customOptions = {}) {
    const defaultOptions = {
      mode: this.config.api.corsMode,
      credentials: this.config.api.credentials,
      headers: {
        'Content-Type': 'application/json',
        'X-Environment': this.environment,
        ...customOptions.headers
      }
    };
    
    return { ...defaultOptions, ...customOptions };
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retryWithBackoff(asyncFunction, maxRetries = null, baseDelay = null) {
    const retries = maxRetries || this.config.supabase.retryAttempts;
    const delay = baseDelay || this.config.supabase.retryDelay;
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await asyncFunction();
      } catch (error) {
        lastError = error;
        
        if (attempt === retries) {
          break; // Final attempt failed
        }
        
        const waitTime = delay * Math.pow(2, attempt);
        this.log(`⏳ Retry attempt ${attempt + 1}/${retries + 1} in ${waitTime}ms...`, 'debug');
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }

  /**
   * Log environment detection and configuration details
   */
  logConfiguration() {
    if (!this.config.debug.enabled) {
      return;
    }
    
    this.log("📋 Environment Configuration Summary:");
    this.log(`   Environment: ${this.config.name} (${this.environment})`);
    this.log(`   Type: ${this.config.type}`);
    this.log(`   Protocol: ${this.config.protocol}`);
    this.log(`   Supabase Method: ${this.config.supabase.method}`);
    this.log(`   API Method: ${this.config.api.method}`);
    this.log(`   Debug Enabled: ${this.config.debug.enabled}`);
    this.log(`   Analytics Enabled: ${this.config.features.analytics}`);
    this.log(`   Timeout Settings: Supabase=${this.config.supabase.timeout}ms, Webhooks=${this.config.webhooks.timeout}ms`);
    
    if (this.detectionLog.length > 0) {
      this.log("🔍 Detection Log:", this.detectionLog);
    }
  }

  /**
   * Internal logging method
   */
  log(message, level = 'info', data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    this.detectionLog.push(logEntry);
    
    // Keep only last 50 log entries
    if (this.detectionLog.length > 50) {
      this.detectionLog = this.detectionLog.slice(-50);
    }
    
    // Console logging disabled
  }

  /**
   * Log errors with context
   */
  logError(message, error) {
    this.log(`${message} ${error?.message || error}`, 'error', {
      error: error,
      stack: error?.stack,
      environment: this.environment,
      config: this.config?.name
    });
  }

  /**
   * Get detection and configuration logs
   */
  getLogs() {
    return this.detectionLog;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.detectionLog = [];
  }

  /**
   * Export configuration for debugging
   */
  exportConfiguration() {
    return {
      environment: this.environment,
      config: this.config,
      logs: this.detectionLog,
      timestamp: new Date().toISOString(),
      initialized: this.initialized
    };
  }
}

// Create global instance
window.EnvironmentConfigManager = EnvironmentConfigManager;
window.environmentManager = new EnvironmentConfigManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.environmentManager.initialize();
  });
} else {
  // DOM already ready
  window.environmentManager.initialize();
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnvironmentConfigManager;
}