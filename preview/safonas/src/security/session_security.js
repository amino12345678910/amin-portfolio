/**
 * Session Security Module
 * Session timeout, privacy-focused analytics, and secure navigation
 * Version: 1.0.0
 */

class SessionSecurity {
  constructor() {
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      warningTime: 5 * 60 * 1000, // 5 minutes before timeout
      idleTimeout: 15 * 60 * 1000, // 15 minutes idle
      maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours max
      privacyMode: true,
      secureNavigation: true
    };

    this.sessionData = {
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      interactions: 0,
      warnings: 0,
      userId: this.generateUserId(),
      sessionId: this.generateSessionId()
    };

    this.activityTracking = {
      mouseMovements: 0,
      keystrokes: 0,
      clicks: 0,
      scrolls: 0,
      focusLost: 0
    };

    this.timers = {
      session: null,
      idle: null,
      warning: null
    };

    this.init();
  }

  init() {
    this.setupSessionManagement();
    this.setupActivityTracking();
    this.setupPrivacyAnalytics();
    this.setupSecureNavigation();
    this.setupErrorHandling();
    this.restoreSession();
  }

  /**
   * Setup session management with timeout handling
   */
  setupSessionManagement() {
    // Start session timers
    this.startSessionTimer();
    this.startIdleTimer();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Handle window beforeunload
    window.addEventListener('beforeunload', () => {
      this.saveSessionData();
    });

    // Handle window focus/blur
    window.addEventListener('focus', () => this.handleWindowFocus());
    window.addEventListener('blur', () => this.handleWindowBlur());
  }

  /**
   * Start session timeout timer
   */
  startSessionTimer() {
    this.clearTimer('session');
    
    const timeToWarning = this.config.sessionTimeout - this.config.warningTime;
    
    this.timers.warning = setTimeout(() => {
      this.showSessionWarning();
    }, timeToWarning);

    this.timers.session = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.config.sessionTimeout);
  }

  /**
   * Start idle timeout timer
   */
  startIdleTimer() {
    this.clearTimer('idle');
    
    this.timers.idle = setTimeout(() => {
      this.handleIdleTimeout();
    }, this.config.idleTimeout);
  }

  /**
   * Clear specific timer
   */
  clearTimer(timerName) {
    if (this.timers[timerName]) {
      clearTimeout(this.timers[timerName]);
      this.timers[timerName] = null;
    }
  }

  /**
   * Reset session activity
   */
  resetActivity() {
    this.sessionData.lastActivity = Date.now();
    this.startSessionTimer();
    this.startIdleTimer();
    
    // Hide warning if showing
    this.hideSessionWarning();
  }

  /**
   * Setup comprehensive activity tracking
   */
  setupActivityTracking() {
    // Mouse movement tracking
    let mouseTimeout;
    document.addEventListener('mousemove', () => {
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        this.activityTracking.mouseMovements++;
        this.resetActivity();
      }, 100);
    });

    // Keyboard activity
    document.addEventListener('keydown', () => {
      this.activityTracking.keystrokes++;
      this.resetActivity();
    });

    // Click tracking
    document.addEventListener('click', (e) => {
      this.activityTracking.clicks++;
      this.trackClickSecurity(e);
      this.resetActivity();
    });

    // Scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.activityTracking.scrolls++;
        this.resetActivity();
      }, 250);
    });

    // Form interaction tracking
    document.addEventListener('focus', (e) => {
      if (e.target.matches('input, textarea, select')) {
        this.sessionData.interactions++;
        this.resetActivity();
      }
    }, true);

    // Touch events for mobile
    document.addEventListener('touchstart', () => {
      this.resetActivity();
    });
  }

  /**
   * Track click security
   */
  trackClickSecurity(event) {
    const target = event.target;
    
    // Check for suspicious click patterns
    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href && this.isDangerousUrl(href)) {
        event.preventDefault();
        this.logSecurityEvent('dangerous_link_clicked', { href });
        this.showSecurityNotification('Lien bloqué pour des raisons de sécurité');
      }
    }

    // Track rapid clicking (potential bot behavior)
    const now = Date.now();
    if (!this.lastClickTime) this.lastClickTime = 0;
    
    if (now - this.lastClickTime < 50) { // Less than 50ms between clicks
      this.logSecurityEvent('rapid_clicking_detected', { 
        interval: now - this.lastClickTime 
      });
    }
    
    this.lastClickTime = now;
  }

  /**
   * Check if URL is dangerous
   */
  isDangerousUrl(url) {
    const dangerousPatterns = [
      /^javascript:/i,
      /^data:/i,
      /^vbscript:/i,
      /<script/i,
      /onclick=/i
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Handle page hidden (tab switched, window minimized)
   */
  handlePageHidden() {
    this.sessionData.lastVisible = Date.now();
    this.activityTracking.focusLost++;
    this.saveSessionData();
  }

  /**
   * Handle page visible again
   */
  handlePageVisible() {
    const hiddenDuration = Date.now() - (this.sessionData.lastVisible || Date.now());
    
    // If hidden for more than idle timeout, show session check
    if (hiddenDuration > this.config.idleTimeout) {
      this.showSessionCheck();
    }
    
    this.resetActivity();
  }

  /**
   * Handle window focus
   */
  handleWindowFocus() {
    this.resetActivity();
  }

  /**
   * Handle window blur
   */
  handleWindowBlur() {
    this.activityTracking.focusLost++;
  }

  /**
   * Show session timeout warning
   */
  showSessionWarning() {
    this.sessionData.warnings++;
    
    const warning = this.createWarningDialog(
      'Session Timeout',
      `Votre session expirera dans ${this.config.warningTime / 60000} minutes d'inactivité.`,
      [
        {
          text: 'Continuer',
          action: () => this.extendSession(),
          primary: true
        },
        {
          text: 'Déconnexion',
          action: () => this.handleSessionTimeout(),
          secondary: true
        }
      ]
    );
    
    document.body.appendChild(warning);
  }

  /**
   * Hide session warning
   */
  hideSessionWarning() {
    const warning = document.querySelector('.session-warning-dialog');
    if (warning) {
      warning.remove();
    }
  }

  /**
   * Show session check dialog
   */
  showSessionCheck() {
    const dialog = this.createWarningDialog(
      'Vérification de Session',
      'Vous êtes de retour ! Souhaitez-vous continuer votre session ?',
      [
        {
          text: 'Continuer',
          action: () => this.extendSession(),
          primary: true
        },
        {
          text: 'Nouvelle Session',
          action: () => this.startNewSession(),
          secondary: true
        }
      ]
    );
    
    document.body.appendChild(dialog);
  }

  /**
   * Create warning dialog
   */
  createWarningDialog(title, message, buttons) {
    const overlay = document.createElement('div');
    overlay.className = 'session-warning-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'session-warning-dialog';
    dialog.style.cssText = `
      background: #1a1a1a;
      border: 2px solid #00ff94;
      border-radius: 12px;
      padding: 32px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 255, 148, 0.3);
    `;
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      color: #ffffff;
      margin: 0 0 16px 0;
      font-size: 20px;
    `;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #cccccc;
      margin: 0 0 24px 0;
      line-height: 1.5;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.style.cssText = `
        padding: 12px 24px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
        ${btn.primary ? 
          'background: #00ff94; color: #000;' : 
          'background: transparent; color: #00ff94; border: 1px solid #00ff94;'
        }
      `;
      
      button.addEventListener('click', () => {
        overlay.remove();
        btn.action();
      });
      
      button.addEventListener('mouseover', () => {
        button.style.transform = 'translateY(-2px)';
      });
      
      button.addEventListener('mouseout', () => {
        button.style.transform = 'translateY(0)';
      });
      
      buttonContainer.appendChild(button);
    });
    
    dialog.appendChild(titleEl);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    
    return overlay;
  }

  /**
   * Extend current session
   */
  extendSession() {
    this.sessionData.lastActivity = Date.now();
    this.resetActivity();
    this.hideSessionWarning();
    this.logSecurityEvent('session_extended');
  }

  /**
   * Start new session
   */
  startNewSession() {
    this.clearAllTimers();
    this.sessionData = {
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      interactions: 0,
      warnings: 0,
      userId: this.sessionData.userId, // Keep same user
      sessionId: this.generateSessionId() // New session ID
    };
    this.resetActivityTracking();
    this.startSessionTimer();
    this.startIdleTimer();
    this.logSecurityEvent('new_session_started');
  }

  /**
   * Handle session timeout
   */
  handleSessionTimeout() {
    this.logSecurityEvent('session_timeout');
    this.clearAllTimers();
    this.clearSessionData();
    this.showTimeoutMessage();
  }

  /**
   * Handle idle timeout
   */
  handleIdleTimeout() {
    this.logSecurityEvent('idle_timeout');
    this.showIdleMessage();
  }

  /**
   * Show timeout message
   */
  showTimeoutMessage() {
    const message = this.createWarningDialog(
      'Session Expirée',
      'Votre session a expiré pour des raisons de sécurité. Vous pouvez continuer à naviguer sur le site.',
      [
        {
          text: 'Nouvelle Session',
          action: () => this.startNewSession(),
          primary: true
        }
      ]
    );
    
    document.body.appendChild(message);
  }

  /**
   * Show idle message
   */
  showIdleMessage() {
    const message = this.createWarningDialog(
      'Session Inactive',
      'Votre session est inactive. Souhaitez-vous continuer ?',
      [
        {
          text: 'Continuer',
          action: () => this.extendSession(),
          primary: true
        },
        {
          text: 'Nouvelle Session',
          action: () => this.startNewSession(),
          secondary: true
        }
      ]
    );
    
    document.body.appendChild(message);
  }

  /**
   * Clear all timers
   */
  clearAllTimers() {
    Object.keys(this.timers).forEach(timer => {
      this.clearTimer(timer);
    });
  }

  /**
   * Setup privacy-focused analytics
   */
  setupPrivacyAnalytics() {
    if (!this.config.privacyMode) return;

    // Track page views without personal data
    this.trackPageView();
    
    // Track user interactions privately
    this.setupPrivateTracking();
    
    // Setup performance monitoring
    this.setupPerformanceTracking();
  }

  /**
   * Track page view privately
   */
  trackPageView() {
    this.sessionData.pageViews++;
    
    const analytics = {
      page: window.location.pathname,
      timestamp: Date.now(),
      sessionId: this.hashString(this.sessionData.sessionId), // Hashed for privacy
      userAgent: this.getSimplifiedUserAgent(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer ? 'external' : 'direct' // Simplified referrer
    };
    
    this.logAnalytics('page_view', analytics);
  }

  /**
   * Setup private tracking
   */
  setupPrivateTracking() {
    // Track engagement without identifying users
    setInterval(() => {
      if (Date.now() - this.sessionData.lastActivity < 60000) { // Active in last minute
        this.logAnalytics('engagement_pulse', {
          sessionDuration: Date.now() - this.sessionData.startTime,
          interactions: this.sessionData.interactions,
          pageViews: this.sessionData.pageViews
        });
      }
    }, 60000); // Every minute
  }

  /**
   * Setup performance tracking
   */
  setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      if (performance && performance.timing) {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        this.logAnalytics('performance', {
          loadTime,
          domReady,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Get simplified user agent for privacy
   */
  getSimplifiedUserAgent() {
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    
    return 'Other';
  }

  /**
   * Hash string for privacy
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Setup secure navigation
   */
  setupSecureNavigation() {
    if (!this.config.secureNavigation) return;

    // Intercept all link clicks for security validation
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        const link = e.target.tagName === 'A' ? e.target : e.target.closest('a');
        this.validateNavigation(e, link);
      }
    }, true);

    // Prevent dangerous redirections
    this.preventDangerousRedirects();
  }

  /**
   * Validate navigation security
   */
  validateNavigation(event, link) {
    const href = link.getAttribute('href');
    if (!href) return;

    // Check for dangerous URLs
    if (this.isDangerousUrl(href)) {
      event.preventDefault();
      this.logSecurityEvent('dangerous_navigation_blocked', { href });
      this.showSecurityNotification('Navigation bloquée pour des raisons de sécurité');
      return;
    }

    // Check for external links
    if (this.isExternalLink(href)) {
      this.handleExternalLink(event, link);
    }

    // Track internal navigation
    if (this.isInternalLink(href)) {
      this.trackInternalNavigation(href);
    }
  }

  /**
   * Check if link is external
   */
  isExternalLink(href) {
    try {
      const url = new URL(href, window.location.href);
      return url.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if link is internal
   */
  isInternalLink(href) {
    return href.startsWith('#') || href.startsWith('/') || 
           href.startsWith('./') || href.startsWith(window.location.origin);
  }

  /**
   * Handle external link navigation
   */
  handleExternalLink(event, link) {
    // Add security attributes for external links
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('target', '_blank');
    
    // Log external navigation
    this.logSecurityEvent('external_navigation', {
      href: link.href,
      text: link.textContent.trim().substring(0, 50)
    });
  }

  /**
   * Track internal navigation
   */
  trackInternalNavigation(href) {
    this.logAnalytics('internal_navigation', {
      from: window.location.pathname,
      to: href,
      timestamp: Date.now()
    });
  }

  /**
   * Prevent dangerous redirects
   */
  preventDangerousRedirects() {
    // Override location changes
    const originalReplace = history.replaceState;
    const originalPush = history.pushState;
    
    history.replaceState = (state, title, url) => {
      if (this.validateHistoryChange(url)) {
        originalReplace.call(history, state, title, url);
      }
    };
    
    history.pushState = (state, title, url) => {
      if (this.validateHistoryChange(url)) {
        originalPush.call(history, state, title, url);
      }
    };
  }

  /**
   * Validate history changes
   */
  validateHistoryChange(url) {
    if (url && this.isDangerousUrl(url)) {
      this.logSecurityEvent('dangerous_history_change_blocked', { url });
      return false;
    }
    return true;
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Handle JavaScript errors securely
    window.addEventListener('error', (e) => {
      this.handleError('javascript_error', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.handleError('unhandled_rejection', {
        reason: e.reason ? e.reason.toString() : 'Unknown'
      });
    });

    // Handle CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      this.handleError('csp_violation', {
        violatedDirective: e.violatedDirective,
        blockedURI: e.blockedURI,
        originalPolicy: e.originalPolicy
      });
    });
  }

  /**
   * Handle errors securely
   */
  handleError(type, details) {
    // Sanitize error details to prevent information leakage
    const sanitizedDetails = {
      type,
      timestamp: Date.now(),
      userAgent: this.getSimplifiedUserAgent(),
      // Only include non-sensitive error information
      hasError: true
    };

    this.logSecurityEvent('error_handled', sanitizedDetails);
    
    // Don't expose detailed error information to console in production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.error('Detailed error (dev mode):', details);
    }
  }

  /**
   * Generate unique user ID
   */
  generateUserId() {
    let userId = localStorage.getItem('user_session_id');
    if (!userId) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      userId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('user_session_id', userId);
    }
    return userId;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Save session data
   */
  saveSessionData() {
    const sessionInfo = {
      ...this.sessionData,
      activityTracking: this.activityTracking,
      lastSaved: Date.now()
    };
    
    sessionStorage.setItem('session_data', JSON.stringify(sessionInfo));
  }

  /**
   * Restore session data
   */
  restoreSession() {
    try {
      const saved = sessionStorage.getItem('session_data');
      if (saved) {
        const sessionInfo = JSON.parse(saved);
        
        // Check if session is still valid
        const timeSinceLastSave = Date.now() - sessionInfo.lastSaved;
        if (timeSinceLastSave < this.config.sessionTimeout) {
          this.sessionData = { ...this.sessionData, ...sessionInfo };
          this.activityTracking = sessionInfo.activityTracking || this.activityTracking;
        }
      }
    } catch (e) {
      console.warn('Could not restore session data');
    }
  }

  /**
   * Clear session data
   */
  clearSessionData() {
    sessionStorage.removeItem('session_data');
    this.resetActivityTracking();
  }

  /**
   * Reset activity tracking
   */
  resetActivityTracking() {
    this.activityTracking = {
      mouseMovements: 0,
      keystrokes: 0,
      clicks: 0,
      scrolls: 0,
      focusLost: 0
    };
  }

  /**
   * Log security events
   */
  logSecurityEvent(type, details = {}) {
    const event = {
      type,
      details,
      timestamp: Date.now(),
      sessionId: this.hashString(this.sessionData.sessionId)
    };
    
    // Store security events
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    events.push(event);
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('security_events', JSON.stringify(events));
    
    // Send to analytics if available
    if (window.gtag) {
      gtag('event', 'security_event', {
        event_category: 'Session Security',
        event_label: type
      });
    }
  }

  /**
   * Log analytics privately
   */
  logAnalytics(type, data) {
    if (!this.config.privacyMode) return;
    
    const analytics = JSON.parse(localStorage.getItem('privacy_analytics') || '[]');
    analytics.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Keep only last 50 analytics events
    if (analytics.length > 50) {
      analytics.splice(0, analytics.length - 50);
    }
    
    localStorage.setItem('privacy_analytics', JSON.stringify(analytics));
  }

  /**
   * Show security notification
   */
  showSecurityNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'security-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4757;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Get session security report
   */
  getSecurityReport() {
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    const analytics = JSON.parse(localStorage.getItem('privacy_analytics') || '[]');
    
    return {
      sessionId: this.hashString(this.sessionData.sessionId),
      sessionDuration: Date.now() - this.sessionData.startTime,
      activity: this.activityTracking,
      securityEvents: events.length,
      recentEvents: events.slice(-10),
      analyticsEvents: analytics.length,
      warnings: this.sessionData.warnings,
      securityScore: this.calculateSecurityScore()
    };
  }

  /**
   * Calculate security score
   */
  calculateSecurityScore() {
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    const recentEvents = events.filter(event => 
      Date.now() - event.timestamp < 60 * 60 * 1000 // Last hour
    );
    
    let score = 100;
    score -= recentEvents.length * 5; // Deduct for security events
    score -= this.sessionData.warnings * 3; // Deduct for session warnings
    score -= this.activityTracking.focusLost * 0.5; // Deduct for focus loss
    
    return Math.max(0, Math.min(100, score));
  }
}

// Initialize Session Security
const sessionSecurity = new SessionSecurity();

// Export for global use
window.SessionSecurity = SessionSecurity;
window.sessionSecurity = sessionSecurity;

console.log('✓ Session Security initialized');