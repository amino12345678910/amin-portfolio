// Main Application Orchestrator
// Initializes all modules and handles global application state

class SafonasApp {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.initStartTime = performance.now();
  }

  async init() {
    if (this.isInitialized) {
      return;
    }

    try {

      // Initialize security utilities first
      this.initSecurityUtils();

      // Initialize user session management
      this.initUserSession();

      // Initialize core modules in order of dependency
      await this.initSupabase();
      this.initUIComponents();
      this.initFormHandler();
      this.initChatbot();

      // Initialize AOS (Animate On Scroll) if available
      this.initAOS();

      // Run post-initialization tasks
      await this.postInit();

      this.isInitialized = true;
      const initTime = performance.now() - this.initStartTime;

      // Global app ready event
      this.dispatchAppReadyEvent();

    } catch (error) {
      this.handleInitError(error);
    }
  }

  // Initialize security utilities
  initSecurityUtils() {
    try {
      // Security utilities are auto-initialized via their module
      // No action needed if not available - fallbacks are automatic
    } catch (error) {
      // Silent fallback
    }
  }

  // Initialize user session management
  initUserSession() {
    try {
      // Generate or retrieve user ID
      let userId = localStorage.getItem("safonas_user_id");
      if (!userId) {
        userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("safonas_user_id", userId);
      }

      // Store globally
      window.safonasUserId = userId;

    } catch (error) {
      // Silent fallback
    }
  }

  // Initialize Supabase
  async initSupabase() {
    try {
      if (window.SupabaseManager) {
        this.modules.supabase = new window.SupabaseManager();

        // Run diagnostics in background
        setTimeout(async () => {
          try {
            await this.modules.supabase.runDiagnostics();
          } catch (error) {
            // Silent fallback
          }
        }, 1000);
      }

    } catch (error) {
      // Silent fallback
    }
  }

  // Initialize UI Components
  initUIComponents() {
    try {
      if (window.UIComponents) {
        this.modules.ui = new window.UIComponents();

        // Store global reference for notifications
        window.uiComponents = this.modules.ui;
      }

      // Initialize testimonials carousel
      this.initTestimonialsCarousel();

    } catch (error) {
      // Silent fallback
    }
  }

  // Initialize testimonials carousel functionality



  // Initialize Form Handler
  initFormHandler() {
    try {
      if (window.FormHandler) {
        this.modules.forms = new window.FormHandler();
      }

    } catch (error) {
      // Silent fallback
    }
  }

  // Initialize Chatbot
  initChatbot() {
    try {
      if (window.ChatbotManager) {
        this.modules.chatbot = new window.ChatbotManager();
      }

    } catch (error) {
      // Silent fallback
    }
  }

  // Initialize AOS (Animate On Scroll)
  initAOS() {
    try {
      if (typeof AOS !== "undefined") {
        AOS.init({
          duration: 800,
          once: true,
        });
      }
    } catch (error) {
      // Silent fallback
    }
  }

  // Post-initialization tasks
  async postInit() {
    try {
      // Show startup completion guide
      this.showStartupGuide();

    } catch (error) {
      // Silent fallback
    }
  }

  // Show startup guide in console
  showStartupGuide() {
    // Debug tools available via window.safonasApp
    // Startup guide removed - check window.safonasApp.getStatus() for info
  }

  // Dispatch app ready event
  dispatchAppReadyEvent() {
    const event = new CustomEvent('safonasAppReady', {
      detail: {
        modules: Object.keys(this.modules),
        initTime: performance.now() - this.initStartTime
      }
    });
    document.dispatchEvent(event);
  }

  // Handle initialization errors
  handleInitError(error) {
    // Error handled silently - check window.safonasApp.getStatus() for debug info
  }

  // Utility methods
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      modules: Object.keys(this.modules),
      initTime: this.isInitialized ? performance.now() - this.initStartTime : null,
      timestamp: new Date().toISOString()
    };
  }

  async restart() {
    this.isInitialized = false;
    this.modules = {};
    this.initStartTime = performance.now();
    await this.init();
  }
}

// Initialize the app when DOM is ready
document.addEventListener("DOMContentLoaded", async function () {
  // Create global app instance
  window.safonasApp = new SafonasApp();

  // Initialize the application
  await window.safonasApp.init();
});

// Export for module use
window.SafonasApp = SafonasApp;