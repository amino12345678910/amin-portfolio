/**
 * Environment-Aware Chatbot Manager
 * Integrates with the Environment Configuration System to provide
 * adaptive chatbot functionality based on hosting environment
 *
 * NOTE: Supabase functionality has been removed - using N8N webhook only
 */

class ChatbotManager {
  constructor() {
    this.config = null;
    this.initialized = false;
    this.sessionId = null;
    this.conversationLog = [];

    // Bind methods
    this.sendMessage = this.sendMessage.bind(this);
    this.saveChatInteraction = this.saveChatInteraction.bind(this);
  }

  /**
   * Initialize the chatbot with environment configuration
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Wait for environment manager to be ready
      if (!window.environmentManager) {
        await this.waitForEnvironmentManager();
      }

      // Get environment configuration
      this.config = window.environmentManager.getConfig();

      // Initialize session ID
      this.initializeSessionId();

      this.initialized = true;

      console.log('Chatbot initialized successfully');

    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      // Still mark as initialized to prevent repeated failures
      this.initialized = true;
    }
  }

  /**
   * Wait for environment manager to be available
   */
  async waitForEnvironmentManager() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.environmentManager) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('Environment manager not available, proceeding with defaults');
        resolve();
      }, 5000);
    });
  }

  /**
   * Initialize session ID
   */
  initializeSessionId() {
    // Try to get existing session ID from localStorage
    let sessionId = localStorage.getItem('safonas_chatbot_session_id');

    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem('safonas_chatbot_session_id', sessionId);
    }

    this.sessionId = sessionId;
  }

  /**
   * Generate a new session ID
   */
  generateSessionId() {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Send a message to the chatbot
   */
  async sendMessage(message, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Add message to conversation log
      this.conversationLog.push({
        type: 'user',
        message: message,
        timestamp: new Date().toISOString()
      });

      // Get webhook URL from config or use default
      const webhookUrl = options.webhookUrl || this.config?.n8n?.webhookPrimary || '/api/chatbot-proxy-simple.php';

      // Prepare request payload
      const payload = {
        message: message,
        sessionId: this.sessionId,
        environment: window.environmentManager?.getEnvironment() || 'unknown',
        timestamp: new Date().toISOString(),
        ...options
      };

      // Send to N8N webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add bot response to conversation log
      if (data.response) {
        this.conversationLog.push({
          type: 'bot',
          message: data.response,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: true,
        response: data.response,
        sessionId: this.sessionId,
        conversationLog: this.conversationLog
      };

    } catch (error) {
      console.error('Error sending message:', error);

      return {
        success: false,
        error: error.message,
        sessionId: this.sessionId
      };
    }
  }

  /**
   * Save chat interaction (now disabled - data handled by N8N)
   */
  async saveChatInteraction(userMessage, botResponse, metadata = {}) {
    // Supabase functionality removed - N8N webhook handles data storage
    console.log('Chat interaction saving disabled - handled by N8N webhook');
    return true;
  }

  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return [...this.conversationLog];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory() {
    this.conversationLog = [];
    localStorage.removeItem('safonas_chatbot_session_id');
    this.sessionId = this.generateSessionId();
    localStorage.setItem('safonas_chatbot_session_id', this.sessionId);
  }

  /**
   * Get chatbot status and diagnostics
   */
  getStatus() {
    return {
      initialized: this.initialized,
      sessionId: this.sessionId,
      conversationCount: this.conversationLog.length,
      lastConversation: this.conversationLog[this.conversationLog.length - 1],
      environment: window.environmentManager?.getEnvironment() || 'unknown',
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset chatbot session
   */
  resetSession() {
    this.conversationLog = [];
    this.sessionId = this.generateSessionId();
    localStorage.setItem('safonas_chatbot_session_id', this.sessionId);
  }
}

// Export for global use
window.ChatbotManager = ChatbotManager;