/**
 * Enhanced Form Security Module
 * Comprehensive form protection with CSRF, rate limiting, and anti-automation
 * Version: 1.0.0
 */

class FormSecurity {
  constructor() {
    this.rateLimits = new Map();
    this.honeypots = new Map();
    this.behaviorTracking = new Map();
    this.csrfTokens = new Map();
    
    this.config = {
      maxSubmissions: 3,
      timeWindow: 60000, // 1 minute
      minFillTime: 3000, // 3 seconds minimum
      maxFillTime: 1800000, // 30 minutes maximum
      honeypotThreshold: 0.1, // 100ms
      suspiciousSpeedThreshold: 100, // characters per second
      maxFieldLength: {
        name: 100,
        email: 254,
        phone: 20,
        company: 200,
        message: 5000,
        subject: 100
      }
    };

    this.init();
  }

  init() {
    this.setupFormProtection();
    this.createHoneypots();
    this.setupBehaviorTracking();
    this.setupCSRFProtection();
  }

  /**
   * Setup comprehensive form protection
   */
  setupFormProtection() {
    document.addEventListener('DOMContentLoaded', () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => this.protectForm(form));
    });
  }

  /**
   * Protect individual form
   */
  protectForm(form) {
    const formId = form.id || `form_${Date.now()}`;
    form.id = formId;

    // Initialize form tracking
    this.initializeFormTracking(formId);
    
    // Add security attributes
    this.addSecurityAttributes(form);
    
    // Setup field validation
    this.setupFieldValidation(form);
    
    // Add submission protection
    this.addSubmissionProtection(form);
    
    // Setup behavior monitoring
    this.monitorFormBehavior(form);
  }

  /**
   * Initialize form tracking data
   */
  initializeFormTracking(formId) {
    this.behaviorTracking.set(formId, {
      startTime: Date.now(),
      keystrokes: 0,
      fieldFocusCount: new Map(),
      suspiciousActivity: [],
      fieldValues: new Map(),
      lastActivity: Date.now()
    });

    // Generate CSRF token
    const token = this.generateCSRFToken();
    this.csrfTokens.set(formId, token);
  }

  /**
   * Add security attributes to form
   */
  addSecurityAttributes(form) {
    form.setAttribute('autocomplete', 'on');
    form.setAttribute('spellcheck', 'false');
    form.setAttribute('data-security-protected', 'true');

    // Add CSRF token field
    const csrfToken = this.csrfTokens.get(form.id);
    if (csrfToken) {
      const tokenField = document.createElement('input');
      tokenField.type = 'hidden';
      tokenField.name = '_csrf_token';
      tokenField.value = csrfToken;
      form.appendChild(tokenField);
    }
  }

  /**
   * Setup field validation with security checks
   */
  setupFieldValidation(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      // Input sanitization
      field.addEventListener('input', (e) => {
        this.sanitizeFieldInput(e.target);
        this.trackFieldBehavior(form.id, field);
      });

      // Focus tracking
      field.addEventListener('focus', (e) => {
        this.trackFieldFocus(form.id, e.target);
      });

      // Paste protection
      field.addEventListener('paste', (e) => {
        this.handlePasteEvent(e, form.id);
      });

      // Copy protection for sensitive fields
      if (field.type === 'password' || field.name.includes('secret')) {
        field.addEventListener('copy', (e) => {
          e.preventDefault();
          this.logSuspiciousActivity(form.id, 'copy_attempt_sensitive_field');
        });
      }
    });
  }

  /**
   * Sanitize field input in real-time
   */
  sanitizeFieldInput(field) {
    const originalValue = field.value;
    let sanitizedValue = originalValue;

    // Length validation
    const maxLength = this.config.maxFieldLength[field.name] || 1000;
    if (sanitizedValue.length > maxLength) {
      sanitizedValue = sanitizedValue.substring(0, maxLength);
    }

    // Remove dangerous characters
    if (field.type !== 'password') {
      sanitizedValue = sanitizedValue.replace(/[<>]/g, '');
      sanitizedValue = sanitizedValue.replace(/javascript:/gi, '');
      sanitizedValue = sanitizedValue.replace(/data:text\/html/gi, '');
    }

    // Email validation
    if (field.type === 'email') {
      // Remove spaces and dangerous characters
      sanitizedValue = sanitizedValue.replace(/[<>"'\\]/g, '');
    }

    // Phone validation
    if (field.type === 'tel' || field.name.includes('phone')) {
      sanitizedValue = sanitizedValue.replace(/[^0-9+\-\(\)\s]/g, '');
    }

    // Update field if value changed
    if (sanitizedValue !== originalValue) {
      field.value = sanitizedValue;
      this.logSuspiciousActivity(field.form.id, 'dangerous_input_sanitized');
    }
  }

  /**
   * Track field behavior for bot detection
   */
  trackFieldBehavior(formId, field) {
    const tracking = this.behaviorTracking.get(formId);
    if (!tracking) return;

    tracking.keystrokes++;
    tracking.lastActivity = Date.now();

    // Calculate typing speed
    const timeElapsed = Date.now() - tracking.startTime;
    const typingSpeed = tracking.keystrokes / (timeElapsed / 1000);

    // Flag suspicious typing speed
    if (typingSpeed > this.config.suspiciousSpeedThreshold) {
      this.logSuspiciousActivity(formId, 'suspicious_typing_speed', { speed: typingSpeed });
    }

    // Track field value changes
    const currentValues = tracking.fieldValues.get(field.name) || [];
    currentValues.push({
      value: field.value,
      timestamp: Date.now()
    });
    tracking.fieldValues.set(field.name, currentValues);
  }

  /**
   * Track field focus patterns
   */
  trackFieldFocus(formId, field) {
    const tracking = this.behaviorTracking.get(formId);
    if (!tracking) return;

    const focusCount = tracking.fieldFocusCount.get(field.name) || 0;
    tracking.fieldFocusCount.set(field.name, focusCount + 1);

    // Flag suspicious focus patterns (too many focus events on same field)
    if (focusCount > 10) {
      this.logSuspiciousActivity(formId, 'excessive_field_focus', { field: field.name, count: focusCount });
    }
  }

  /**
   * Handle paste events securely
   */
  handlePasteEvent(e, formId) {
    const pastedData = (e.clipboardData || window.clipboardData).getData('text');
    
    // Check for suspicious content in pasted data
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /<iframe/i,
      /onclick=/i,
      /onerror=/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(pastedData)) {
        e.preventDefault();
        this.logSuspiciousActivity(formId, 'malicious_paste_attempt');
        this.showSecurityNotification('Contenu de collage bloqué pour des raisons de sécurité');
        return;
      }
    }

    // Log large pastes (potential bulk data injection)
    if (pastedData.length > 1000) {
      this.logSuspiciousActivity(formId, 'large_paste_detected', { length: pastedData.length });
    }
  }

  /**
   * Create invisible honeypot fields
   */
  createHoneypots() {
    document.addEventListener('DOMContentLoaded', () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const honeypot = this.createHoneypotField();
        form.appendChild(honeypot);
        
        // Track honeypot interaction
        honeypot.addEventListener('input', () => {
          this.logSuspiciousActivity(form.id, 'honeypot_triggered');
        });
      });
    });
  }

  /**
   * Create honeypot field
   */
  createHoneypotField() {
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website_url'; // Common bot target
    honeypot.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      z-index: -1 !important;
      tab-index: -1;
    `;
    honeypot.setAttribute('tabindex', '-1');
    honeypot.setAttribute('autocomplete', 'off');
    honeypot.setAttribute('aria-hidden', 'true');
    return honeypot;
  }

  /**
   * Add submission protection with rate limiting
   */
  addSubmissionProtection(form) {
    form.addEventListener('submit', (e) => {
      if (!this.validateSubmission(form)) {
        e.preventDefault();
        return false;
      }
    });
  }

  /**
   * Comprehensive submission validation
   */
  validateSubmission(form) {
    const formId = form.id;
    const tracking = this.behaviorTracking.get(formId);
    
    // Rate limiting check
    if (!this.checkRateLimit(formId)) {
      this.showSecurityNotification('Trop de tentatives. Veuillez patienter avant de réessayer.');
      return false;
    }

    // Check fill time (too fast = bot, too slow = suspicious)
    const fillTime = Date.now() - tracking.startTime;
    if (fillTime < this.config.minFillTime) {
      this.logSuspiciousActivity(formId, 'form_filled_too_quickly', { time: fillTime });
      this.showSecurityNotification('Veuillez prendre plus de temps pour remplir le formulaire.');
      return false;
    }

    if (fillTime > this.config.maxFillTime) {
      this.logSuspiciousActivity(formId, 'form_session_expired', { time: fillTime });
      this.showSecurityNotification('Session expirée. Veuillez rafraîchir la page.');
      return false;
    }

    // Check honeypot
    const honeypot = form.querySelector('input[name="website_url"]');
    if (honeypot && honeypot.value) {
      this.logSuspiciousActivity(formId, 'honeypot_filled');
      this.showSecurityNotification('Soumission bloquée pour des raisons de sécurité.');
      return false;
    }

    // CSRF token validation
    if (!this.validateCSRFToken(form)) {
      this.showSecurityNotification('Token de sécurité invalide. Veuillez rafraîchir la page.');
      return false;
    }

    // Check for suspicious activity
    if (tracking.suspiciousActivity.length > 3) {
      this.logSuspiciousActivity(formId, 'too_many_suspicious_activities');
      this.showSecurityNotification('Activité suspecte détectée. Veuillez réessayer plus tard.');
      return false;
    }

    // Behavioral validation
    if (!this.validateBehavior(tracking)) {
      return false;
    }

    // Update rate limiting
    this.updateRateLimit(formId);
    
    return true;
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(formId) {
    const now = Date.now();
    const clientId = this.getClientId();
    const key = `${clientId}_${formId}`;
    
    const attempts = this.rateLimits.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < this.config.timeWindow);
    
    return recentAttempts.length < this.config.maxSubmissions;
  }

  /**
   * Update rate limiting
   */
  updateRateLimit(formId) {
    const now = Date.now();
    const clientId = this.getClientId();
    const key = `${clientId}_${formId}`;
    
    const attempts = this.rateLimits.get(key) || [];
    attempts.push(now);
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter(time => now - time < this.config.timeWindow);
    this.rateLimits.set(key, recentAttempts);
  }

  /**
   * Validate behavioral patterns
   */
  validateBehavior(tracking) {
    // Check if user interacted with form naturally
    if (tracking.keystrokes < 5) {
      this.showSecurityNotification('Interaction insuffisante détectée.');
      return false;
    }

    // Check field focus patterns
    const focusedFields = Array.from(tracking.fieldFocusCount.keys()).length;
    if (focusedFields < 2) {
      this.showSecurityNotification('Pattern de navigation suspect.');
      return false;
    }

    return true;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(form) {
    const tokenField = form.querySelector('input[name="_csrf_token"]');
    if (!tokenField) return false;

    const providedToken = tokenField.value;
    const expectedToken = this.csrfTokens.get(form.id);

    return providedToken === expectedToken;
  }

  /**
   * Get unique client identifier
   */
  getClientId() {
    let clientId = localStorage.getItem('client_id');
    if (!clientId) {
      clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('client_id', clientId);
    }
    return clientId;
  }

  /**
   * Monitor form behavior patterns
   */
  monitorFormBehavior(form) {
    // Mouse movement tracking
    let mouseMovements = 0;
    form.addEventListener('mousemove', () => {
      mouseMovements++;
    });

    // Keyboard interaction tracking
    form.addEventListener('keydown', () => {
      const tracking = this.behaviorTracking.get(form.id);
      if (tracking) {
        tracking.lastActivity = Date.now();
      }
    });

    // Window focus/blur tracking
    let windowFocusChanges = 0;
    window.addEventListener('focus', () => windowFocusChanges++);
    window.addEventListener('blur', () => windowFocusChanges++);

    // Store behavior metrics
    form.addEventListener('submit', () => {
      const tracking = this.behaviorTracking.get(form.id);
      if (tracking) {
        tracking.mouseMovements = mouseMovements;
        tracking.windowFocusChanges = windowFocusChanges;
      }
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(formId, activityType, details = {}) {
    const tracking = this.behaviorTracking.get(formId);
    if (!tracking) return;

    const activity = {
      type: activityType,
      timestamp: Date.now(),
      details: details,
      userAgent: navigator.userAgent,
      clientId: this.getClientId()
    };

    tracking.suspiciousActivity.push(activity);

    // Log to console for debugging
    console.warn('Suspicious form activity:', activity);

    // Send to analytics if available
    if (window.gtag) {
      gtag('event', 'security_incident', {
        event_category: 'Form Security',
        event_label: activityType,
        custom_parameter: JSON.stringify(details)
      });
    }
  }

  /**
   * Show security notification to user
   */
  showSecurityNotification(message) {
    // Create notification element
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
    
    // Sanitize message
    notification.textContent = window.xssProtection ? 
      window.xssProtection.sanitizeText(message) : message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 8000);
  }

  /**
   * Setup behavior tracking for all forms
   */
  setupBehaviorTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched tabs/minimized window
        this.behaviorTracking.forEach((tracking, formId) => {
          this.logSuspiciousActivity(formId, 'window_focus_lost');
        });
      }
    });
  }

  /**
   * Setup CSRF protection
   */
  setupCSRFProtection() {
    // Rotate CSRF tokens periodically
    setInterval(() => {
      this.csrfTokens.forEach((token, formId) => {
        const form = document.getElementById(formId);
        if (form) {
          const newToken = this.generateCSRFToken();
          this.csrfTokens.set(formId, newToken);
          
          const tokenField = form.querySelector('input[name="_csrf_token"]');
          if (tokenField) {
            tokenField.value = newToken;
          }
        }
      });
    }, 600000); // Rotate every 10 minutes
  }

  /**
   * Get comprehensive security report for form
   */
  getSecurityReport(formId) {
    const tracking = this.behaviorTracking.get(formId);
    if (!tracking) return null;

    return {
      formId,
      fillTime: Date.now() - tracking.startTime,
      keystrokes: tracking.keystrokes,
      suspiciousActivities: tracking.suspiciousActivity.length,
      fieldFocusPattern: Object.fromEntries(tracking.fieldFocusCount),
      lastActivity: tracking.lastActivity,
      securityScore: this.calculateSecurityScore(tracking)
    };
  }

  /**
   * Calculate security score (0-100, higher is more secure)
   */
  calculateSecurityScore(tracking) {
    let score = 100;
    
    // Deduct for suspicious activities
    score -= tracking.suspiciousActivity.length * 10;
    
    // Deduct for unusual timing
    const fillTime = Date.now() - tracking.startTime;
    if (fillTime < this.config.minFillTime) score -= 30;
    if (fillTime > this.config.maxFillTime) score -= 20;
    
    // Deduct for unusual keystroke patterns
    const avgKeystrokesPerField = tracking.keystrokes / Math.max(tracking.fieldFocusCount.size, 1);
    if (avgKeystrokesPerField < 2) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }
}

// Initialize Form Security
const formSecurity = new FormSecurity();

// Export for global use
window.FormSecurity = FormSecurity;
window.formSecurity = formSecurity;

console.log('✓ Enhanced Form Security initialized');