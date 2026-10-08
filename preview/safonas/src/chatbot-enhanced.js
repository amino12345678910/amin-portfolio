/**
 * Enhanced Chatbot with Comprehensive Error Handling and Supabase Integration
 * Features:
 * - Environment detection (local file:// vs production https://)
 * - Multiple fallback methods (direct Supabase, PHP proxy, local storage)
 * - Retry logic with exponential backoff
 * - Session management and chat history persistence
 * - Network timeout and connection failure handling
 * - Comprehensive error logging and debugging
 * - CORS-resistant functionality for file:// protocol
 */

class EnhancedChatbot {
  constructor(config = {}) {
    // Configuration with defaults
    this.config = {
      supabaseUrl: config.supabaseUrl || 'https://ejonogfzwsrmuzgiywge.supabase.co',
      supabaseKey: config.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqb25vZ2Z6d3NybXV6Z2l5d2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDc5MDIsImV4cCI6MjA3MjA4MzkwMn0.nMBja006ztFIGcS6hw7pRRroGy-MIJUNOn_yfpYgzxM',
      webhookUrl: config.webhookUrl || 'https://n8n.safonas.com/webhook/d0cdbca7-2772-4e64-9230-0f06e7a53c75/chat',
      phpProxyUrl: config.phpProxyUrl || 'api/supabase-proxy.php',
      maxRetries: config.maxRetries || 3,
      initialRetryDelay: config.initialRetryDelay || 1000,
      maxRetryDelay: config.maxRetryDelay || 10000,
      requestTimeout: config.requestTimeout || 30000,
      ...config
    };
    
    // Runtime state
    this.environment = this.detectEnvironment();
    this.supabaseClient = null;
    this.sessionId = this.getOrCreateSessionId();
    this.fallbackStorage = new Map();
    this.retryQueue = [];
    
    // Statistics and diagnostics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      localStorageUsed: 0,
      averageResponseTime: 0,
      lastError: null,
      startTime: Date.now()
    };
    
    // Initialize the chatbot
    this.init();
  }
  
  /**
   * Detect the current environment
   */
  detectEnvironment() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    if (protocol === 'file:') {
      return 'local';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else {
      return 'production';
    }
  }
  
  /**
   * Initialize the chatbot system
   */
  async init() {
    // Enhanced Chatbot initializing
    
    try {
      // Initialize Supabase client if available
      if (typeof supabase !== 'undefined' && this.environment !== 'local') {
        this.supabaseClient = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);
        // Supabase client initialized
      } else {
        // Supabase client not available - fallback methods will be used
      }
      
      // Run diagnostic tests
      await this.runDiagnostics();
      
      // Load chat history
      await this.loadChatHistory();
      
      // Start retry queue processor
      this.startRetryProcessor();
      
      // Enhanced Chatbot initialized successfully
      
    } catch (error) {
      // Failed to initialize Enhanced Chatbot
      this.logError('INIT_ERROR', error);
    }
  }
  
  /**
   * Get or create a session ID
   */
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('safonas_chatbot_session_id');
    
    if (!sessionId) {
      // Generate UUID v4 compatible session ID
      sessionId = crypto.randomUUID ? crypto.randomUUID() : this.generateUUID();
      localStorage.setItem('safonas_chatbot_session_id', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * Generate UUID v4 fallback
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics() {
    // Running Enhanced Chatbot diagnostics
    
    const diagnostics = {
      environment: this.environment,
      supabaseAvailable: !!this.supabaseClient,
      localStorageAvailable: this.testLocalStorage(),
      networkConnectivity: false,
      supabaseConnectivity: false,
      webhookConnectivity: false,
      errors: []
    };
    
    // Test network connectivity
    try {
      const response = await this.timeoutFetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      }, 5000);
      diagnostics.networkConnectivity = true;
      // Network connectivity: OK
    } catch (error) {
      diagnostics.errors.push(`Network connectivity: ${error.message}`);
      // Network connectivity: Failed
    }
    
    // Test Supabase connectivity (if available and not local)
    if (this.supabaseClient && this.environment !== 'local') {
      try {
        const { data, error } = await this.supabaseClient
          .from('chatbot_interactions')
          .select('id')
          .limit(1);
          
        if (!error) {
          diagnostics.supabaseConnectivity = true;
          // Supabase connectivity: OK
        } else {
          diagnostics.errors.push(`Supabase connectivity: ${error.message}`);
          // Supabase connectivity: Failed
        }
      } catch (error) {
        diagnostics.errors.push(`Supabase connectivity: ${error.message}`);
        // Supabase connectivity: Failed
      }
    }
    
    // Test webhook connectivity
    try {
      // For local environment, skip webhook test to avoid CORS issues
      if (this.environment !== 'local') {
        const response = await this.timeoutFetch(this.config.webhookUrl, {
          method: 'HEAD'
        }, 5000);
        diagnostics.webhookConnectivity = response.ok;
      } else {
        diagnostics.webhookConnectivity = 'skipped_local';
      }
      // Webhook connectivity: OK
    } catch (error) {
      diagnostics.errors.push(`Webhook connectivity: ${error.message}`);
      // Webhook connectivity: Failed
    }
    
    // Store diagnostics globally for inspection
    window.enhancedChatbotDiagnostics = diagnostics;
    
    // Diagnostics completed
    return diagnostics;
  }
  
  /**
   * Test local storage availability
   */
  testLocalStorage() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Fetch with timeout
   */
  async timeoutFetch(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }
  
  /**
   * Send message with comprehensive error handling
   */
  async sendMessage(userMessage) {
    const startTime = Date.now();
    const messageId = this.generateUUID();
    
    // Enhanced Chatbot sending message
    
    this.stats.totalRequests++;
    
    try {
      // Validate and sanitize input
      const sanitizedMessage = this.sanitizeInput(userMessage);
      if (!sanitizedMessage) {
        throw new Error('Invalid or empty message');
      }
      
      // Send to webhook and get response
      const botResponse = await this.sendToWebhook(sanitizedMessage, messageId);
      
      // Save interaction with multiple fallback methods
      await this.saveInteractionWithFallbacks(sanitizedMessage, botResponse, messageId);
      
      // Update statistics
      this.stats.successfulRequests++;
      this.updateAverageResponseTime(Date.now() - startTime);
      
      // Message sent successfully
      
      return {
        success: true,
        response: botResponse,
        messageId,
        responseTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.stats.failedRequests++;
      this.logError('SEND_MESSAGE_ERROR', error, { messageId, userMessage });
      
      // Return fallback response
      const fallbackResponse = "Désolé, une erreur s'est produite. Veuillez réessayer plus tard.";
      
      // Still try to save the interaction for analysis
      try {
        await this.saveToLocalStorage(userMessage, fallbackResponse, messageId, error.message);
      } catch (localError) {
        console.error('❌ Failed to save to local storage:', localError);
      }
      
      return {
        success: false,
        response: fallbackResponse,
        error: error.message,
        messageId,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Send message to webhook with retry logic
   */
  async sendToWebhook(message, messageId) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Webhook attempt with retry logic
        
        const response = await this.timeoutFetch(this.config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Session-ID': this.sessionId,
            'X-Message-ID': messageId
          },
          body: JSON.stringify({
            message,
            timestamp: new Date().toISOString(),
            chatId: this.sessionId,
            messageId,
            environment: this.environment
          })
        }, this.config.requestTimeout);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        const botResponse = data.reply || data.response || data.message || data.text || data.answer || data.output;
        
        if (!botResponse) {
          throw new Error('No valid response from webhook');
        }
        
        return this.sanitizeInput(botResponse);
        
      } catch (error) {
        lastError = error;
        // Webhook attempt failed
        
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          // Retrying with exponential backoff
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`Webhook failed after ${this.config.maxRetries} attempts: ${lastError.message}`);
  }
  
  /**
   * Save interaction with multiple fallback methods
   */
  async saveInteractionWithFallbacks(userMessage, botResponse, messageId) {
    const interactionData = {
      user_message: userMessage,
      chatbot_response: botResponse,
      session_id: this.sessionId,
      message_id: messageId,
      created_at: new Date().toISOString(),
      environment: this.environment
    };
    
    // Method 1: Direct Supabase (if available and not local)
    if (this.supabaseClient && this.environment !== 'local') {
      try {
        // Attempting direct Supabase save
        await this.saveToSupabase(interactionData);
        // Saved to Supabase successfully
        return;
      } catch (error) {
        // Direct Supabase save failed
        this.logError('SUPABASE_DIRECT_ERROR', error, interactionData);
      }
    }
    
    // Method 2: PHP Proxy (for production environments with PHP backend)
    if (this.environment === 'production') {
      try {
        // Attempting PHP proxy save
        await this.saveViaPHPProxy(interactionData);
        // Saved via PHP proxy successfully
        this.stats.fallbackUsed++;
        return;
      } catch (error) {
        // PHP proxy save failed
        this.logError('PHP_PROXY_ERROR', error, interactionData);
      }
    }
    
    // Method 3: Local Storage (always available)
    try {
      // Attempting local storage save
      await this.saveToLocalStorage(userMessage, botResponse, messageId);
      // Saved to local storage successfully
      this.stats.localStorageUsed++;
      
      // Add to retry queue for later sync
      this.addToRetryQueue(interactionData);
      
    } catch (error) {
      // Local storage save failed
      this.logError('LOCAL_STORAGE_ERROR', error, interactionData);
      throw new Error('All save methods failed');
    }
  }
  
  /**
   * Save to Supabase directly
   */
  async saveToSupabase(data) {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }
    
    const { error } = await this.supabaseClient
      .from('chatbot_interactions')
      .insert([data]);
    
    if (error) {
      throw error;
    }
  }
  
  /**
   * Save via PHP proxy
   */
  async saveViaPHPProxy(data) {
    const response = await this.timeoutFetch(this.config.phpProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ action: 'save_interaction', data })
    }, this.config.requestTimeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PHP proxy error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'PHP proxy save failed');
    }
  }
  
  /**
   * Save to local storage
   */
  async saveToLocalStorage(userMessage, botResponse, messageId, errorInfo = null) {
    const storageKey = 'safonas_chatbot_interactions';
    
    try {
      let interactions = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      interactions.push({
        id: messageId,
        user_message: userMessage,
        chatbot_response: botResponse,
        session_id: this.sessionId,
        created_at: new Date().toISOString(),
        environment: this.environment,
        saved_locally: true,
        synced: false,
        error_info: errorInfo
      });
      
      // Keep only last 100 interactions to prevent storage overflow
      if (interactions.length > 100) {
        interactions = interactions.slice(-100);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(interactions));
      
    } catch (error) {
      throw new Error(`Local storage error: ${error.message}`);
    }
  }
  
  /**
   * Add to retry queue for later sync
   */
  addToRetryQueue(data) {
    this.retryQueue.push({
      ...data,
      added_at: Date.now(),
      retry_count: 0
    });
    
    // Persist retry queue to localStorage
    this.persistRetryQueue();
  }
  
  /**
   * Start retry queue processor
   */
  startRetryProcessor() {
    // Load existing retry queue
    this.loadRetryQueue();
    
    // Process queue every 2 minutes
    setInterval(() => {
      this.processRetryQueue();
    }, 120000); // 2 minutes
    
    // Initial processing after 10 seconds
    setTimeout(() => {
      this.processRetryQueue();
    }, 10000);
  }
  
  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (this.retryQueue.length === 0) return;
    
    // Processing retry queue items
    
    const processedItems = [];
    
    for (const item of this.retryQueue) {
      try {
        // Only retry if we have network connectivity and it's not too old
        const age = Date.now() - item.added_at;
        if (age > 86400000) { // 24 hours
          // Item too old, removing from queue
          processedItems.push(item);
          continue;
        }
        
        if (item.retry_count >= 5) {
          // Max retries reached, removing from queue
          processedItems.push(item);
          continue;
        }
        
        // Try to save to Supabase
        if (this.supabaseClient && this.environment !== 'local') {
          await this.saveToSupabase(item);
          // Retry successful
          processedItems.push(item);
        }
        
      } catch (error) {
        item.retry_count++;
        // Retry failed for item
      }
    }
    
    // Remove processed items
    this.retryQueue = this.retryQueue.filter(item => !processedItems.includes(item));
    this.persistRetryQueue();
    
    if (processedItems.length > 0) {
      // Processed items from retry queue
    }
  }
  
  /**
   * Load retry queue from localStorage
   */
  loadRetryQueue() {
    try {
      const queueData = localStorage.getItem('safonas_chatbot_retry_queue');
      if (queueData) {
        this.retryQueue = JSON.parse(queueData);
        // Loaded items from retry queue
      }
    } catch (error) {
      // Failed to load retry queue
      this.retryQueue = [];
    }
  }
  
  /**
   * Persist retry queue to localStorage
   */
  persistRetryQueue() {
    try {
      localStorage.setItem('safonas_chatbot_retry_queue', JSON.stringify(this.retryQueue));
    } catch (error) {
      // Failed to persist retry queue
    }
  }
  
  /**
   * Load chat history
   */
  async loadChatHistory() {
    try {
      // Try to load from Supabase first
      if (this.supabaseClient && this.environment !== 'local') {
        const { data, error } = await this.supabaseClient
          .from('chatbot_interactions')
          .select('*')
          .eq('session_id', this.sessionId)
          .order('created_at', { ascending: true })
          .limit(20);
        
        if (!error && data && data.length > 0) {
          // Loaded messages from Supabase history
          return data;
        }
      }
      
      // Fallback to local storage
      const localHistory = JSON.parse(localStorage.getItem('safonas_chatbot_interactions') || '[]');
      const sessionHistory = localHistory.filter(item => item.session_id === this.sessionId);
      
      if (sessionHistory.length > 0) {
        // Loaded messages from local storage
      }
      
      return sessionHistory;
      
    } catch (error) {
      // Failed to load chat history
      return [];
    }
  }
  
  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(2, attempt - 1),
      this.config.maxRetryDelay
    );
    
    // Add some jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }
  
  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Sanitize input
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Limit length
    if (input.length > 5000) {
      input = input.substring(0, 5000);
    }
    
    // Use client validation if available, otherwise basic sanitization
    if (window.clientValidation && typeof window.clientValidation.sanitizeInput === 'function') {
      return window.clientValidation.sanitizeInput(input, 'text');
    } else {
      // Basic HTML escaping
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    }
  }
  
  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    const totalTime = this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime;
    this.stats.averageResponseTime = totalTime / this.stats.successfulRequests;
  }
  
  /**
   * Log error with context
   */
  logError(type, error, context = {}) {
    const errorLog = {
      type,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      environment: this.environment,
      sessionId: this.sessionId
    };
    
    // Store last error
    this.stats.lastError = errorLog;
    
    // Error logged internally
    
    // Store error history in localStorage for debugging
    try {
      const errorHistory = JSON.parse(localStorage.getItem('safonas_chatbot_errors') || '[]');
      errorHistory.push(errorLog);
      
      // Keep only last 50 errors
      if (errorHistory.length > 50) {
        errorHistory.shift();
      }
      
      localStorage.setItem('safonas_chatbot_errors', JSON.stringify(errorHistory));
    } catch (e) {
      // Failed to store error history
    }
  }
  
  /**
   * Get statistics and diagnostics
   */
  getStats() {
    return {
      ...this.stats,
      sessionId: this.sessionId,
      environment: this.environment,
      retryQueueLength: this.retryQueue.length,
      uptime: Date.now() - this.stats.startTime,
      successRate: this.stats.totalRequests > 0 ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%'
    };
  }
  
  /**
   * Manual sync of local data to Supabase
   */
  async syncLocalData() {
    console.log('🔄 Starting manual sync of local data...');
    
    try {
      const localData = JSON.parse(localStorage.getItem('safonas_chatbot_interactions') || '[]');
      const unsyncedData = localData.filter(item => !item.synced);
      
      if (unsyncedData.length === 0) {
        // No unsynced data found
        return { success: true, synced: 0 };
      }
      
      let syncedCount = 0;
      
      for (const item of unsyncedData) {
        try {
          await this.saveToSupabase({
            user_message: item.user_message,
            chatbot_response: item.chatbot_response,
            session_id: item.session_id,
            created_at: item.created_at,
            message_id: item.id
          });
          
          // Mark as synced
          item.synced = true;
          syncedCount++;
          
        } catch (error) {
          // Failed to sync item
        }
      }
      
      // Update localStorage
      localStorage.setItem('safonas_chatbot_interactions', JSON.stringify(localData));
      
      // Synced items successfully
      
      return { success: true, synced: syncedCount, total: unsyncedData.length };
      
    } catch (error) {
      // Manual sync failed
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Clear local storage data
   */
  clearLocalData() {
    try {
      localStorage.removeItem('safonas_chatbot_interactions');
      localStorage.removeItem('safonas_chatbot_retry_queue');
      localStorage.removeItem('safonas_chatbot_errors');
      // Local chatbot data cleared
      return { success: true };
    } catch (error) {
      // Failed to clear local data
      return { success: false, error: error.message };
    }
  }
}

// Global instance and utilities
window.EnhancedChatbot = EnhancedChatbot;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnhancedChatbot);
} else {
  initializeEnhancedChatbot();
}

function initializeEnhancedChatbot() {
  // Initialize with default config (can be overridden)
  window.enhancedChatbot = new EnhancedChatbot();
  
  // Global debugging functions
  window.chatbotDebug = {
    getStats: () => window.enhancedChatbot.getStats(),
    getDiagnostics: () => window.enhancedChatbotDiagnostics,
    syncData: () => window.enhancedChatbot.syncLocalData(),
    clearData: () => window.enhancedChatbot.clearLocalData(),
    getErrors: () => JSON.parse(localStorage.getItem('safonas_chatbot_errors') || '[]'),
    getLocalHistory: () => JSON.parse(localStorage.getItem('safonas_chatbot_interactions') || '[]'),
    getRetryQueue: () => JSON.parse(localStorage.getItem('safonas_chatbot_retry_queue') || '[]')
  };
  
  // Enhanced Chatbot debugging tools available in window.chatbotDebug
}

// Integration helper for existing chatbot code
window.enhancedChatbotSendMessage = async function(message) {
  if (window.enhancedChatbot) {
    return await window.enhancedChatbot.sendMessage(message);
  } else {
    throw new Error('Enhanced chatbot not initialized');
  }
};