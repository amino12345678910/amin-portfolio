/**
 * Environment Initialization Script
 * Loads and initializes the environment detection system and chatbot manager
 * Provides fallback functionality for edge cases and error scenarios
 */

(function() {
  'use strict';

  // Configuration constants
  const INIT_CONFIG = {
    maxInitRetries: 3,
    initTimeout: 10000,
    fallbackDelay: 2000,
    debugEnabled: true
  };

  // Global state
  let initAttempts = 0;
  let initializationComplete = false;
  let fallbackMode = false;

  /**
   * Main initialization function
   */
  async function initializeEnvironmentSystem() {
    log('🚀 Starting Environment System Initialization...');
    
    try {
      initAttempts++;
      
      // Check if already initialized
      if (initializationComplete) {
        log('✅ Environment system already initialized');
        return;
      }

      // Check if we exceed max retries
      if (initAttempts > INIT_CONFIG.maxInitRetries) {
        log('⚠️ Max initialization attempts reached, switching to fallback mode');
        await initializeFallbackMode();
        return;
      }

      log(`🔄 Initialization attempt ${initAttempts}/${INIT_CONFIG.maxInitRetries}`);

      // Load required modules
      await loadRequiredModules();

      // Initialize environment manager
      await initializeEnvironmentManager();

      // Initialize chatbot manager
      await initializeChatbotManager();

      // Setup global error handling
      setupGlobalErrorHandling();

      // Mark as complete
      initializationComplete = true;
      log('✅ Environment system initialization complete!');
      
      // Fire custom event
      fireInitializationEvent('environment-system-ready');

    } catch (error) {
      logError('Environment system initialization failed:', error);
      
      // Retry after delay
      if (initAttempts < INIT_CONFIG.maxInitRetries) {
        log(`⏳ Retrying initialization in ${INIT_CONFIG.fallbackDelay}ms...`);
        setTimeout(initializeEnvironmentSystem, INIT_CONFIG.fallbackDelay);
      } else {
        log('❌ All initialization attempts failed, activating emergency fallback');
        await initializeEmergencyFallback();
      }
    }
  }

  /**
   * Load required modules dynamically
   */
  async function loadRequiredModules() {
    log('📦 Loading required modules...');

    const modules = [
      {
        name: 'Environment Config Manager',
        check: () => window.EnvironmentConfigManager,
        load: () => loadScript('/src/environment-config.js')
      },
      {
        name: 'Chatbot Manager',
        check: () => window.ChatbotManager,
        load: () => loadScript('/src/chatbot-manager.js')
      },
      {
        name: 'Supabase Client',
        check: () => window.supabase,
        load: () => loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')
      }
    ];

    for (const module of modules) {
      if (!module.check()) {
        log(`📥 Loading ${module.name}...`);
        try {
          await module.load();
          
          // Wait a bit for module to initialize
          await waitFor(() => module.check(), 2000);
          
          if (module.check()) {
            log(`✅ ${module.name} loaded successfully`);
          } else {
            log(`⚠️ ${module.name} loaded but not available`);
          }
        } catch (error) {
          log(`❌ Failed to load ${module.name}: ${error.message}`);
          // Continue with other modules
        }
      } else {
        log(`✅ ${module.name} already available`);
      }
    }
  }

  /**
   * Load script dynamically
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    });
  }

  /**
   * Wait for condition to be true
   */
  function waitFor(condition, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  }

  /**
   * Initialize Environment Manager
   */
  async function initializeEnvironmentManager() {
    log('🌍 Initializing Environment Manager...');

    if (!window.EnvironmentConfigManager) {
      throw new Error('EnvironmentConfigManager class not available');
    }

    // Create instance if it doesn't exist
    if (!window.environmentManager) {
      window.environmentManager = new window.EnvironmentConfigManager();
    }

    // Initialize with timeout
    const config = await Promise.race([
      window.environmentManager.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Environment manager initialization timeout')), INIT_CONFIG.initTimeout)
      )
    ]);

    if (!config) {
      throw new Error('Environment manager returned null configuration');
    }

    log(`✅ Environment Manager initialized: ${config.name} (${config.type})`);
  }

  /**
   * Initialize Chatbot Manager
   */
  async function initializeChatbotManager() {
    log('🤖 Initializing Chatbot Manager...');

    if (!window.ChatbotManager) {
      log('⚠️ ChatbotManager class not available, using fallback chatbot');
      await initializeFallbackChatbot();
      return;
    }

    // Create instance if it doesn't exist
    if (!window.chatbotManager) {
      window.chatbotManager = new window.ChatbotManager();
    }

    // Initialize with timeout
    await Promise.race([
      window.chatbotManager.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Chatbot manager initialization timeout')), INIT_CONFIG.initTimeout)
      )
    ]);

    log('✅ Chatbot Manager initialized successfully');
  }

  /**
   * Setup global error handling
   */
  function setupGlobalErrorHandling() {
    log('🛡️ Setting up global error handling...');

    window.addEventListener('error', (event) => {
      if (event.filename?.includes('environment') || 
          event.filename?.includes('chatbot') ||
          event.message?.toLowerCase().includes('environment') ||
          event.message?.toLowerCase().includes('chatbot')) {
        logError('Global environment/chatbot error:', event.error);
        
        // Attempt recovery
        if (!fallbackMode && !initializationComplete) {
          log('🔄 Attempting error recovery...');
          setTimeout(initializeEnvironmentSystem, 1000);
        }
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('environment') ||
          event.reason?.message?.includes('chatbot') ||
          event.reason?.stack?.includes('environment') ||
          event.reason?.stack?.includes('chatbot')) {
        logError('Unhandled environment/chatbot promise rejection:', event.reason);
        event.preventDefault(); // Prevent console error
      }
    });

    log('✅ Global error handling configured');
  }

  /**
   * Initialize fallback mode
   */
  async function initializeFallbackMode() {
    log('🛟 Initializing fallback mode...');
    fallbackMode = true;

    try {
      // Create minimal environment manager
      await createMinimalEnvironmentManager();

      // Initialize basic chatbot functionality
      await initializeFallbackChatbot();

      initializationComplete = true;
      log('✅ Fallback mode initialized successfully');
      fireInitializationEvent('environment-system-fallback');

    } catch (error) {
      logError('Fallback mode initialization failed:', error);
      await initializeEmergencyFallback();
    }
  }

  /**
   * Create minimal environment manager
   */
  async function createMinimalEnvironmentManager() {
    log('🔧 Creating minimal environment manager...');

    window.environmentManager = {
      initialized: true,
      environment: detectBasicEnvironment(),
      
      getConfig() {
        return {
          name: 'Minimal Configuration',
          type: this.environment === 'local' ? 'development' : 'production',
          supabase: {
            method: 'direct',
            timeout: 10000,
            retryAttempts: 2,
            fallbackToProxy: true
          },
          webhooks: {
            primary: 'https://n8n.safonas.com/webhook/d0cdbca7-2772-4e64-9230-0f06e7a6544b',
            timeout: 15000,
            retryAttempts: 2
          },
          debug: {
            enabled: true,
            verbose: false
          }
        };
      },

      getEnvironment() {
        return this.environment;
      },

      isDevelopment() {
        return this.environment === 'local';
      },

      isProduction() {
        return this.environment === 'production';
      },

      getFetchOptions(customOptions = {}) {
        return {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            'X-Environment': this.environment,
            ...customOptions.headers
          },
          ...customOptions
        };
      },

      async retryWithBackoff(asyncFunction, maxRetries = 2, baseDelay = 1000) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await asyncFunction();
          } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
            }
          }
        }
        throw lastError;
      }
    };

    log('✅ Minimal environment manager created');
  }

  /**
   * Detect basic environment
   */
  function detectBasicEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (protocol === 'file:') return 'local';
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) return 'local';
    if (hostname === 'safonas.com' || hostname === 'www.safonas.com') return 'production';
    return 'production'; // Default to production
  }

  /**
   * Initialize fallback chatbot
   */
  async function initializeFallbackChatbot() {
    log('🤖 Initializing fallback chatbot...');

    // Create minimal chatbot functionality
    window.chatbotManager = {
      initialized: true,
      sessionId: getChatSessionId(),

      async sendMessage(platform = 'desktop') {
        const inputId = platform === 'mobile' ? 'heroChatInputMobile' : 'heroChatInput';
        const input = document.getElementById(inputId);
        
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        input.value = '';

        // Add user message to UI
        this.addMessageToUI(message, 'user', platform);

        // Show typing indicator
        const typing = this.showTypingIndicator(platform);

        try {
          // Send to secure proxy only
          const response = await fetch('/api/chatbot-proxy.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: message,
              timestamp: new Date().toISOString(),
              session_id: this.sessionId
            }),
            credentials: 'include'
          });

          this.hideTypingIndicator(typing);

          if (response.ok) {
            const data = await response.json();
            const botMessage = data.reply || data.response || data.message || 
                             'Merci pour votre message ! Nous vous répondrons bientôt.';
            this.addMessageToUI(botMessage, 'bot', platform);
          } else {
            throw new Error('Webhook failed');
          }

        } catch (error) {
          this.hideTypingIndicator(typing);
          this.addMessageToUI('Désolé, une erreur s\'est produite. Veuillez réessayer.', 'bot', platform);
        }
      },

      addMessageToUI(message, sender, platform) {
        const containerId = platform === 'mobile' ? 'heroChatMessagesMobile' : 'heroChatMessages';
        const container = document.getElementById(containerId) || 
                         document.querySelector('.chat-messages');

        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
          <div class="message-content">${this.escapeHtml(message)}</div>
          <div class="message-time">${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</div>
        `;

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
      },

      showTypingIndicator(platform) {
        const containerId = platform === 'mobile' ? 'heroChatMessagesMobile' : 'heroChatMessages';
        const container = document.getElementById(containerId);
        if (!container) return null;

        const typing = document.createElement('div');
        typing.className = 'message bot-message typing-indicator';
        typing.innerHTML = '<div class="message-content"><div class="typing-dots">...</div></div>';
        
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
        return typing;
      },

      hideTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      },

      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
    };

    // Setup event listeners
    setupFallbackChatbotEvents();

    log('✅ Fallback chatbot initialized');
  }

  /**
   * Setup fallback chatbot event listeners
   */
  function setupFallbackChatbotEvents() {
    // Desktop chatbot
    const desktopInput = document.getElementById('heroChatInput');
    const desktopButton = document.getElementById('heroSendMessage');

    if (desktopInput && desktopButton) {
      desktopButton.onclick = () => window.chatbotManager.sendMessage('desktop');
      desktopInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.chatbotManager.sendMessage('desktop');
        }
      };
    }

    // Mobile chatbot
    const mobileInput = document.getElementById('heroChatInputMobile');
    const mobileButton = document.getElementById('heroSendMessageMobile');

    if (mobileInput && mobileButton) {
      mobileButton.onclick = () => window.chatbotManager.sendMessage('mobile');
      mobileInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.chatbotManager.sendMessage('mobile');
        }
      };
    }
  }

  /**
   * Initialize emergency fallback
   */
  async function initializeEmergencyFallback() {
    log('🚨 Initializing emergency fallback...');

    // Absolute minimal functionality
    window.safonasEmergencyMode = true;

    // Basic session ID
    const sessionId = getChatSessionId();

    // Inline message sender
    window.sendEmergencyMessage = function(input) {
      const message = input?.value?.trim();
      if (!message) return;

      input.value = '';
      
      // Simple message display
      const container = document.querySelector('#heroChatMessages, #heroChatMessagesMobile, .chat-messages');
      if (container) {
        container.innerHTML += `
          <div class="message user-message">
            <div class="message-content">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
          <div class="message bot-message">
            <div class="message-content">Message reçu ! Nous vous répondrons bientôt.</div>
          </div>
        `;
        container.scrollTop = container.scrollHeight;
      }

      // Try to send to secure proxy (fire and forget)
      fetch('/api/chatbot-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, session_id: sessionId, emergency: true }),
        credentials: 'include'
      }).catch(() => {
        // Silently fail
      });
    };

    // Attach to any available inputs
    document.querySelectorAll('input[id*="chat"], button[id*="send"]').forEach(el => {
      if (el.tagName === 'INPUT') {
        el.onkeypress = (e) => {
          if (e.key === 'Enter') {
            window.sendEmergencyMessage(el);
          }
        };
      } else if (el.tagName === 'BUTTON') {
        el.onclick = () => {
          const input = el.parentElement?.querySelector('input') || 
                       document.querySelector('input[id*="chat"]');
          window.sendEmergencyMessage(input);
        };
      }
    });

    log('🆘 Emergency fallback initialized');
    fireInitializationEvent('environment-system-emergency');
  }

  /**
   * Get or create session ID
   */
  function getChatSessionId() {
    let sessionId = localStorage.getItem("safonas_chatbot_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem("safonas_chatbot_session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Fire initialization event
   */
  function fireInitializationEvent(eventName) {
    const event = new CustomEvent(eventName, {
      detail: {
        initAttempts: initAttempts,
        fallbackMode: fallbackMode,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Logging functions
   */
  function log(message, data = null) {
    // Logging disabled
  }

  function logError(message, error) {
    // Error logging disabled
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnvironmentSystem);
  } else {
    // DOM already ready, start immediately
    initializeEnvironmentSystem();
  }

  // Also initialize after a delay as backup
  setTimeout(initializeEnvironmentSystem, 1000);

  // Export functions for debugging
  window.environmentInit = {
    initialize: initializeEnvironmentSystem,
    fallback: initializeFallbackMode,
    emergency: initializeEmergencyFallback,
    status: () => ({
      initialized: initializationComplete,
      attempts: initAttempts,
      fallbackMode: fallbackMode
    })
  };

})();