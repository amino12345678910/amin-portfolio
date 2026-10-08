/**
 * Comprehensive Client-Side Security Validation Module
 * Advanced XSS prevention, input sanitization, CSRF token management,
 * form validation, anti-automation, and secure API communication
 * Version: 2.0.0 - Production Ready
 */

class ClientValidation {
  constructor() {
    this.config = {
      // Rate limiting configuration
      maxRequests: 5,
      timeWindow: 60000, // 1 minute
      
      // Input validation limits
      maxLengths: {
        name: 100,
        email: 254,
        phone: 25,
        company: 200,
        subject: 150,
        message: 8000,
        url: 2048
      },
      
      // Security thresholds
      minFormFillTime: 2000, // 2 seconds
      maxFormFillTime: 3600000, // 1 hour
      suspiciousTypingSpeed: 150, // chars per second
      honeypotDelay: 100, // ms
      
      // Trusted domains for external resources
      trustedDomains: [
        'cdn.jsdelivr.net',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'unpkg.com',
        'n8n.safonas.com'
      ]
    };

    // Security state management
    this.rateLimiter = new Map();
    this.csrfTokens = new Map();
    this.formMetrics = new Map();
    this.securityLog = [];
    this.encryptedSessions = new Map();
    
    // Dangerous patterns for XSS prevention
    this.xssPatterns = [
      // Script injection
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      /<embed[\s\S]*?>/gi,
      /<applet[\s\S]*?>/gi,
      /<meta[\s\S]*?>/gi,
      /<link[\s\S]*?>/gi,
      /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
      /<form[\s\S]*?>/gi,
      /<input[\s\S]*?>/gi,
      /<textarea[\s\S]*?>/gi,
      /<select[\s\S]*?>/gi,
      /<option[\s\S]*?>/gi,
      
      // JavaScript protocols and handlers
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi,
      
      // SVG and CSS-based XSS
      /<svg[\s\S]*?>/gi,
      /<foreignobject[\s\S]*?>/gi,
      /expression\s*\(/gi,
      /binding\s*:/gi,
      /@import/gi,
      /url\s*\([^)]*javascript:/gi,
      
      // Additional dangerous patterns
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /document\.write/gi,
      /window\.open/gi,
      /location\s*=/gi
    ];

    this.init();
  }

  /**
   * Initialize all security modules
   */
  init() {
    this.setupGlobalProtection();
    this.implementCSPCompliance();
    this.initializeFormProtection();
    this.setupAPISecurityLayer();
    this.createSecurityUI();
    this.startSecurityMonitoring();
    this.setupEventSecurity();
    
    console.log('✅ Client Validation Security System Initialized');
    this.logSecurityEvent('system_initialized', { timestamp: Date.now() });
  }

  /**
   * Setup global DOM protection and security measures
   */
  setupGlobalProtection() {
    // Disable dangerous global functions
    this.disableDangerousFunctions();
    
    // Protect DOM manipulation
    this.protectDOMManipulation();
    
    // Setup CSP violation reporting
    this.setupCSPReporting();
    
    // Validate all existing content
    this.validateExistingContent();
  }

  /**
   * Disable dangerous JavaScript functions
   */
  disableDangerousFunctions() {
    try {
      // Disable eval and Function constructor
      window.eval = () => {
        this.logSecurityEvent('eval_blocked', { source: 'global_protection' });
        throw new Error('eval() disabled for security');
      };
      
      const originalFunction = window.Function;
      window.Function = function() {
        this.logSecurityEvent('function_constructor_blocked', { source: 'global_protection' });
        throw new Error('Function constructor disabled for security');
      }.bind(this);
      
      // Disable document.write
      document.write = (content) => {
        this.logSecurityEvent('document_write_blocked', { content: content?.substring(0, 100) });
        console.warn('document.write blocked for security');
      };
      
      document.writeln = (content) => {
        this.logSecurityEvent('document_writeln_blocked', { content: content?.substring(0, 100) });
        console.warn('document.writeln blocked for security');
      };
    } catch (error) {
      console.warn('Could not disable some dangerous functions:', error);
    }
  }

  /**
   * Protect DOM manipulation methods
   */
  protectDOMManipulation() {
    const self = this;
    
    // Override innerHTML setter
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTMLDescriptor) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
          const sanitizedValue = self.sanitizeHTML(value);
          originalInnerHTMLDescriptor.set.call(this, sanitizedValue);
        },
        get: originalInnerHTMLDescriptor.get
      });
    }
    
    // Override insertAdjacentHTML
    const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(position, text) {
      const sanitizedText = self.sanitizeHTML(text);
      return originalInsertAdjacentHTML.call(this, position, sanitizedText);
    };
  }

  /**
   * Comprehensive HTML sanitization
   */
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';
    
    // First pass: remove all dangerous patterns
    let sanitized = html;
    this.xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[CONTENT_BLOCKED]');
    });
    
    // Second pass: HTML entity encoding
    sanitized = this.escapeHTML(sanitized);
    
    // Third pass: validate URLs
    sanitized = this.sanitizeURLsInHTML(sanitized);
    
    this.logSecurityEvent('html_sanitized', { 
      originalLength: html.length, 
      sanitizedLength: sanitized.length 
    });
    
    return sanitized;
  }

  /**
   * HTML entity escaping
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitize URLs in HTML content
   */
  sanitizeURLsInHTML(html) {
    return html.replace(/(?:href|src)\s*=\s*["']([^"']+)["']/gi, (match, url) => {
      const sanitizedUrl = this.sanitizeURL(url);
      return sanitizedUrl ? match.replace(url, sanitizedUrl) : '';
    });
  }

  /**
   * Advanced input sanitization
   */
  sanitizeInput(input, type = 'text') {
    if (!input || typeof input !== 'string') return '';
    
    // Length validation
    const maxLength = this.config.maxLengths[type] || 1000;
    if (input.length > maxLength) {
      input = input.substring(0, maxLength);
    }
    
    // Remove null bytes and control characters
    input = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Type-specific sanitization
    switch (type) {
      case 'email':
        input = this.sanitizeEmail(input);
        break;
      case 'phone':
        input = this.sanitizePhone(input);
        break;
      case 'url':
        input = this.sanitizeURL(input) || '';
        break;
      case 'name':
        input = this.sanitizeName(input);
        break;
      default:
        input = this.sanitizeText(input);
    }
    
    return input;
  }

  /**
   * Email sanitization
   */
  sanitizeEmail(email) {
    // Remove dangerous characters
    email = email.replace(/[<>"'\\]/g, '');
    
    // Basic email pattern validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email) ? email : '';
  }

  /**
   * Phone number sanitization
   */
  sanitizePhone(phone) {
    // Keep only numbers, +, -, (, ), and spaces
    return phone.replace(/[^0-9+\-\(\)\s]/g, '');
  }

  /**
   * Name sanitization
   */
  sanitizeName(name) {
    // Remove dangerous characters but keep accented characters
    name = name.replace(/[<>"'\\]/g, '');
    
    // Remove multiple spaces
    name = name.replace(/\s+/g, ' ').trim();
    
    return name;
  }

  /**
   * Text sanitization
   */
  sanitizeText(text) {
    // Remove XSS patterns
    this.xssPatterns.forEach(pattern => {
      text = text.replace(pattern, '');
    });
    
    // HTML encode dangerous characters
    return this.escapeHTML(text);
  }

  /**
   * URL sanitization and validation
   */
  sanitizeURL(url) {
    if (!url || typeof url !== 'string') return null;
    
    url = url.trim();
    
    // Check for dangerous protocols
    const dangerousProtocols = [
      'javascript:', 'data:', 'vbscript:', 'file:', 
      'blob:', 'about:', 'chrome:', 'chrome-extension:'
    ];
    
    const lowerUrl = url.toLowerCase();
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        this.logSecurityEvent('dangerous_url_blocked', { url });
        return null;
      }
    }
    
    // Only allow safe protocols
    const safeProtocols = /^(https?:\/\/|mailto:|tel:|#|\/)/;
    if (!safeProtocols.test(url) && !url.startsWith('.')) {
      if (!url.includes(':')) {
        url = 'https://' + url;
      } else {
        return null;
      }
    }
    
    // Validate URL structure
    try {
      const urlObj = new URL(url, window.location.href);
      
      // Check for encoded dangerous content
      if (urlObj.href.includes('%3Cscript') || 
          urlObj.href.includes('%3ciframe') ||
          urlObj.href.includes('javascript:')) {
        return null;
      }
      
      return urlObj.href;
    } catch (e) {
      return null;
    }
  }

  /**
   * CSRF token management
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Form protection initialization
   */
  initializeFormProtection() {
    document.addEventListener('DOMContentLoaded', () => {
      this.protectAllForms();
      this.setupHoneypots();
    });
  }

  /**
   * Protect all forms on the page
   */
  protectAllForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => this.protectForm(form));
  }

  /**
   * Comprehensive form protection
   */
  protectForm(form) {
    const formId = form.id || `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    form.id = formId;
    
    // Initialize form metrics
    this.formMetrics.set(formId, {
      startTime: Date.now(),
      interactions: 0,
      keystrokes: 0,
      focusEvents: 0,
      suspiciousActivity: [],
      fieldValues: new Map()
    });
    
    // Generate and inject CSRF token
    this.addCSRFToken(form);
    
    // Add security attributes
    this.addFormSecurityAttributes(form);
    
    // Setup field monitoring
    this.setupFieldMonitoring(form);
    
    // Add submission protection
    this.addSubmissionProtection(form);
    
    // Monitor behavior patterns
    this.monitorFormBehavior(form);
  }

  /**
   * Add CSRF token to form
   */
  addCSRFToken(form) {
    const token = this.generateCSRFToken();
    this.csrfTokens.set(form.id, token);
    
    // Create hidden token field
    const tokenField = document.createElement('input');
    tokenField.type = 'hidden';
    tokenField.name = '_csrf_token';
    tokenField.value = token;
    form.appendChild(tokenField);
  }

  /**
   * Add security attributes to form
   */
  addFormSecurityAttributes(form) {
    form.setAttribute('autocomplete', 'on');
    form.setAttribute('spellcheck', 'false');
    form.setAttribute('data-security-protected', 'true');
    form.setAttribute('novalidate', 'true'); // We'll handle validation
  }

  /**
   * Setup field monitoring for bot detection
   */
  setupFieldMonitoring(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    const formId = form.id;
    
    fields.forEach(field => {
      // Input validation and sanitization
      field.addEventListener('input', (e) => {
        this.handleFieldInput(e, formId);
      });
      
      // Focus tracking
      field.addEventListener('focus', (e) => {
        this.trackFieldFocus(e, formId);
      });
      
      // Paste protection
      field.addEventListener('paste', (e) => {
        this.handlePaste(e, formId);
      });
      
      // Copy protection for sensitive fields
      if (field.type === 'password' || field.name.includes('secret')) {
        field.addEventListener('copy', (e) => {
          e.preventDefault();
          this.logSuspiciousActivity(formId, 'copy_sensitive_field');
        });
      }
    });
  }

  /**
   * Handle field input with real-time sanitization
   */
  handleFieldInput(event, formId) {
    const field = event.target;
    const metrics = this.formMetrics.get(formId);
    
    if (metrics) {
      metrics.interactions++;
      metrics.keystrokes++;
    }
    
    // Determine field type for sanitization
    let fieldType = 'text';
    if (field.type === 'email') fieldType = 'email';
    else if (field.type === 'tel' || field.name.includes('phone')) fieldType = 'phone';
    else if (field.type === 'url') fieldType = 'url';
    else if (field.name.includes('name')) fieldType = 'name';
    
    // Sanitize input
    const originalValue = field.value;
    const sanitizedValue = this.sanitizeInput(originalValue, fieldType);
    
    // Update field if value was changed
    if (sanitizedValue !== originalValue) {
      field.value = sanitizedValue;
      this.logSuspiciousActivity(formId, 'input_sanitized', {
        field: field.name,
        originalLength: originalValue.length,
        sanitizedLength: sanitizedValue.length
      });
    }
    
    // Check typing speed
    this.checkTypingSpeed(formId, field.value.length);
  }

  /**
   * Track field focus patterns
   */
  trackFieldFocus(event, formId) {
    const metrics = this.formMetrics.get(formId);
    if (metrics) {
      metrics.focusEvents++;
    }
  }

  /**
   * Handle paste events securely
   */
  handlePaste(event, formId) {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('text');
    
    // Check for suspicious content
    let isSuspicious = false;
    this.xssPatterns.forEach(pattern => {
      if (pattern.test(pastedData)) {
        isSuspicious = true;
      }
    });
    
    if (isSuspicious) {
      event.preventDefault();
      this.logSuspiciousActivity(formId, 'malicious_paste_blocked');
      this.showSecurityNotification('Contenu de collage bloqué pour des raisons de sécurité', 'warning');
      return;
    }
    
    // Log large pastes
    if (pastedData.length > 1000) {
      this.logSuspiciousActivity(formId, 'large_paste', { length: pastedData.length });
    }
  }

  /**
   * Check typing speed for bot detection
   */
  checkTypingSpeed(formId, currentLength) {
    const metrics = this.formMetrics.get(formId);
    if (!metrics) return;
    
    const timeElapsed = Date.now() - metrics.startTime;
    const typingSpeed = currentLength / (timeElapsed / 1000);
    
    if (typingSpeed > this.config.suspiciousTypingSpeed) {
      this.logSuspiciousActivity(formId, 'suspicious_typing_speed', { speed: typingSpeed });
    }
  }

  /**
   * Setup honeypot fields
   */
  setupHoneypots() {
    document.querySelectorAll('form').forEach(form => {
      const honeypot = this.createHoneypotField();
      form.appendChild(honeypot);
      
      honeypot.addEventListener('input', () => {
        this.logSuspiciousActivity(form.id, 'honeypot_triggered');
      });
    });
  }

  /**
   * Create invisible honeypot field
   */
  createHoneypotField() {
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website_url';
    honeypot.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      z-index: -1 !important;
    `;
    honeypot.setAttribute('tabindex', '-1');
    honeypot.setAttribute('autocomplete', 'off');
    honeypot.setAttribute('aria-hidden', 'true');
    return honeypot;
  }

  /**
   * Add submission protection with comprehensive validation
   */
  addSubmissionProtection(form) {
    form.addEventListener('submit', (e) => {
      if (!this.validateFormSubmission(form)) {
        e.preventDefault();
        return false;
      }
    });
  }

  /**
   * Comprehensive form submission validation
   */
  validateFormSubmission(form) {
    const formId = form.id;
    const metrics = this.formMetrics.get(formId);
    
    // Rate limiting check
    if (!this.checkRateLimit(formId)) {
      this.showSecurityNotification('Trop de tentatives. Veuillez patienter.', 'error');
      return false;
    }
    
    // Check form fill time
    const fillTime = Date.now() - metrics.startTime;
    if (fillTime < this.config.minFormFillTime) {
      this.logSuspiciousActivity(formId, 'form_filled_too_quickly', { time: fillTime });
      this.showSecurityNotification('Veuillez prendre plus de temps pour remplir le formulaire.', 'warning');
      return false;
    }
    
    if (fillTime > this.config.maxFormFillTime) {
      this.logSuspiciousActivity(formId, 'form_session_expired', { time: fillTime });
      this.showSecurityNotification('Session expirée. Veuillez rafraîchir la page.', 'warning');
      return false;
    }
    
    // Honeypot check
    const honeypot = form.querySelector('input[name="website_url"]');
    if (honeypot && honeypot.value) {
      this.logSuspiciousActivity(formId, 'honeypot_filled');
      this.showSecurityNotification('Soumission bloquée pour des raisons de sécurité.', 'error');
      return false;
    }
    
    // CSRF token validation
    if (!this.validateCSRFToken(form)) {
      this.showSecurityNotification('Token de sécurité invalide. Veuillez rafraîchir la page.', 'error');
      return false;
    }
    
    // Behavioral validation
    if (!this.validateBehaviorPattern(metrics)) {
      return false;
    }
    
    // Update rate limit
    this.updateRateLimit(formId);
    
    // Final sanitization of form data
    this.sanitizeFormData(form);
    
    return true;
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
   * Validate behavior patterns for bot detection
   */
  validateBehaviorPattern(metrics) {
    // Check interaction count
    if (metrics.interactions < 3) {
      this.showSecurityNotification('Interaction insuffisante détectée.', 'warning');
      return false;
    }
    
    // Check focus events
    if (metrics.focusEvents < 2) {
      this.showSecurityNotification('Pattern de navigation suspect détecté.', 'warning');
      return false;
    }
    
    // Check suspicious activity count
    if (metrics.suspiciousActivity.length > 5) {
      this.showSecurityNotification('Trop d\'activités suspectes détectées.', 'error');
      return false;
    }
    
    return true;
  }

  /**
   * Rate limiting implementation
   */
  checkRateLimit(identifier) {
    const now = Date.now();
    const key = `${this.getClientId()}_${identifier}`;
    const attempts = this.rateLimiter.get(key) || [];
    
    // Filter recent attempts
    const recentAttempts = attempts.filter(time => now - time < this.config.timeWindow);
    
    return recentAttempts.length < this.config.maxRequests;
  }

  /**
   * Update rate limiting records
   */
  updateRateLimit(identifier) {
    const now = Date.now();
    const key = `${this.getClientId()}_${identifier}`;
    const attempts = this.rateLimiter.get(key) || [];
    
    attempts.push(now);
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter(time => now - time < this.config.timeWindow);
    this.rateLimiter.set(key, recentAttempts);
  }

  /**
   * Get or generate client ID
   */
  getClientId() {
    let clientId = localStorage.getItem('secure_client_id');
    if (!clientId) {
      clientId = 'client_' + Date.now() + '_' + this.generateSecureToken(16);
      localStorage.setItem('secure_client_id', clientId);
    }
    return clientId;
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sanitize form data before submission
   */
  sanitizeFormData(form) {
    const formData = new FormData(form);
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        let fieldType = 'text';
        if (key.includes('email')) fieldType = 'email';
        else if (key.includes('phone')) fieldType = 'phone';
        else if (key.includes('name')) fieldType = 'name';
        else if (key.includes('message')) fieldType = 'message';
        
        const sanitizedValue = this.sanitizeInput(value, fieldType);
        
        // Find and update the field
        const field = form.querySelector(`[name="${key}"]`);
        if (field && field.value !== sanitizedValue) {
          field.value = sanitizedValue;
        }
      }
    }
  }

  /**
   * Setup secure API communication layer
   */
  setupAPISecurityLayer() {
    // Override fetch for automatic security headers
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function(url, options = {}) {
      // Add security headers
      options.headers = options.headers || {};
      options.headers['X-Requested-With'] = 'XMLHttpRequest';
      options.headers['X-Client-Security'] = 'enabled';
      
      // Add CSRF token if available
      const activeForm = document.querySelector('form[data-security-protected="true"]');
      if (activeForm) {
        const csrfToken = self.csrfTokens.get(activeForm.id);
        if (csrfToken) {
          options.headers['X-CSRF-Token'] = csrfToken;
        }
      }
      
      // Log API calls
      self.logSecurityEvent('api_call', { url, method: options.method || 'GET' });
      
      return originalFetch.call(this, url, options);
    };
  }

  /**
   * Create security UI components
   */
  createSecurityUI() {
    this.createSecurityStatusIndicator();
    this.createEncryptionBadges();
    this.setupSecurityNotificationSystem();
  }

  /**
   * Create security status indicator
   */
  createSecurityStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'security-status-indicator';
    indicator.className = 'security-status-indicator';
    indicator.innerHTML = `
      <div class="security-icon">
        <i class="fas fa-shield-alt"></i>
      </div>
      <div class="security-text">
        <span class="status-text">Sécurisé</span>
        <span class="status-details">Protection active</span>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(indicator);
    
    // Update status periodically
    this.updateSecurityStatus();
    setInterval(() => this.updateSecurityStatus(), 30000);
  }

  /**
   * Update security status indicator
   */
  updateSecurityStatus() {
    const indicator = document.getElementById('security-status-indicator');
    if (!indicator) return;
    
    const securityScore = this.calculateSecurityScore();
    const statusText = indicator.querySelector('.status-text');
    const statusDetails = indicator.querySelector('.status-details');
    const icon = indicator.querySelector('i');
    
    if (securityScore >= 90) {
      indicator.className = 'security-status-indicator secure';
      statusText.textContent = 'Très Sécurisé';
      statusDetails.textContent = 'Protection maximale';
      icon.className = 'fas fa-shield-alt';
    } else if (securityScore >= 70) {
      indicator.className = 'security-status-indicator warning';
      statusText.textContent = 'Sécurisé';
      statusDetails.textContent = 'Protection active';
      icon.className = 'fas fa-shield-alt';
    } else {
      indicator.className = 'security-status-indicator danger';
      statusText.textContent = 'Risques Détectés';
      statusDetails.textContent = 'Activité suspecte';
      icon.className = 'fas fa-exclamation-triangle';
    }
  }

  /**
   * Calculate overall security score
   */
  calculateSecurityScore() {
    let score = 100;
    
    // Deduct for security incidents
    const recentIncidents = this.securityLog.filter(
      event => Date.now() - event.timestamp < 600000 // Last 10 minutes
    );
    score -= recentIncidents.length * 5;
    
    // Deduct for suspicious activities
    let totalSuspiciousActivities = 0;
    this.formMetrics.forEach(metrics => {
      totalSuspiciousActivities += metrics.suspiciousActivity.length;
    });
    score -= totalSuspiciousActivities * 3;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create encryption communication badges
   */
  createEncryptionBadges() {
    // Add HTTPS indicator if on HTTPS
    if (window.location.protocol === 'https:') {
      const badge = document.createElement('div');
      badge.className = 'encryption-badge';
      badge.innerHTML = `
        <i class="fas fa-lock"></i>
        <span>Connexion Sécurisée</span>
      `;
      document.body.appendChild(badge);
    }
    
    // Add encryption badges to forms
    document.querySelectorAll('form').forEach(form => {
      const badge = document.createElement('div');
      badge.className = 'form-security-badge';
      badge.innerHTML = `
        <i class="fas fa-shield-check"></i>
        <span>Données Protégées</span>
      `;
      form.appendChild(badge);
    });
  }

  /**
   * Setup security notification system
   */
  setupSecurityNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('security-notifications')) {
      const container = document.createElement('div');
      container.id = 'security-notifications';
      container.className = 'security-notifications-container';
      document.body.appendChild(container);
    }
  }

  /**
   * Show security notification to user
   */
  showSecurityNotification(message, type = 'info', duration = 8000) {
    const container = document.getElementById('security-notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `security-notification notification-${type}`;
    
    // Sanitize message
    const sanitizedMessage = this.sanitizeInput(message, 'text');
    
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-message">${sanitizedMessage}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove notification
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
    
    // Log notification
    this.logSecurityEvent('notification_shown', { type, message: sanitizedMessage });
  }

  /**
   * Get icon for notification type
   */
  getNotificationIcon(type) {
    switch (type) {
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'success': return 'fa-check-circle';
      default: return 'fa-info-circle';
    }
  }

  /**
   * Setup secure event handling
   */
  setupEventSecurity() {
    // Monitor for dangerous event handlers
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const attributeName = mutation.attributeName;
          const element = mutation.target;
          
          // Check for dangerous event handlers
          if (attributeName && attributeName.startsWith('on')) {
            console.warn('Dangerous event handler blocked:', attributeName);
            element.removeAttribute(attributeName);
            this.logSuspiciousActivity('dom_mutation', 'dangerous_event_handler', {
              element: element.tagName,
              attribute: attributeName
            });
          }
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
    });
  }

  /**
   * Implement CSP compliance checks
   */
  implementCSPCompliance() {
    // Add CSP meta tag if not present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const csp = document.createElement('meta');
      csp.setAttribute('http-equiv', 'Content-Security-Policy');
      csp.setAttribute('content', this.generateCSPPolicy());
      document.head.appendChild(csp);
    }
  }

  /**
   * Generate Content Security Policy
   */
  generateCSPPolicy() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net unpkg.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net",
      "font-src 'self' fonts.gstatic.com cdn.jsdelivr.net data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: n8n.safonas.com",
      "frame-src 'none'",
      "object-src 'none'",
      "media-src 'self' data:",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  /**
   * Setup CSP violation reporting
   */
  setupCSPReporting() {
    document.addEventListener('securitypolicyviolation', (e) => {
      this.logSecurityEvent('csp_violation', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy
      });
      
      console.error('CSP Violation detected:', e);
    });
  }

  /**
   * Validate existing content on page load
   */
  validateExistingContent() {
    // Check all scripts
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (!this.isTrustedDomain(src)) {
        console.warn('Untrusted script detected:', src);
        this.logSecurityEvent('untrusted_script', { src });
      }
    });
    
    // Check all external links
    document.querySelectorAll('link[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href.startsWith('http') && !this.isTrustedDomain(href)) {
        console.warn('Untrusted external resource:', href);
        this.logSecurityEvent('untrusted_resource', { href });
      }
    });
  }

  /**
   * Check if domain is trusted
   */
  isTrustedDomain(url) {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url, window.location.href);
      
      // Always trust same origin
      if (urlObj.origin === window.location.origin) return true;
      
      // Check against trusted domains
      return this.config.trustedDomains.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Monitor form behavior patterns
   */
  monitorFormBehavior(form) {
    const formId = form.id;
    let mouseMovements = 0;
    let scrollEvents = 0;
    
    // Track mouse movements
    form.addEventListener('mousemove', () => {
      mouseMovements++;
    });
    
    // Track scroll events
    window.addEventListener('scroll', () => {
      scrollEvents++;
    });
    
    // Store behavior data on form submission
    form.addEventListener('submit', () => {
      const metrics = this.formMetrics.get(formId);
      if (metrics) {
        metrics.mouseMovements = mouseMovements;
        metrics.scrollEvents = scrollEvents;
        
        // Analyze behavior patterns
        this.analyzeBehaviorPatterns(metrics);
      }
    });
  }

  /**
   * Analyze user behavior patterns
   */
  analyzeBehaviorPatterns(metrics) {
    const patterns = [];
    
    // Check mouse movement patterns
    if (metrics.mouseMovements < 5) {
      patterns.push('low_mouse_activity');
    }
    
    // Check interaction diversity
    const interactionRatio = metrics.focusEvents / Math.max(metrics.interactions, 1);
    if (interactionRatio < 0.3) {
      patterns.push('unusual_interaction_pattern');
    }
    
    // Log patterns for analysis
    if (patterns.length > 0) {
      this.logSecurityEvent('behavior_analysis', { patterns });
    }
  }

  /**
   * Start security monitoring background processes
   */
  startSecurityMonitoring() {
    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logSecurityEvent('page_hidden', { timestamp: Date.now() });
      }
    });
    
    // Monitor window focus changes
    window.addEventListener('focus', () => {
      this.logSecurityEvent('window_focus', { timestamp: Date.now() });
    });
    
    window.addEventListener('blur', () => {
      this.logSecurityEvent('window_blur', { timestamp: Date.now() });
    });
    
    // Periodic security checks
    setInterval(() => {
      this.performSecurityScan();
    }, 60000); // Every minute
  }

  /**
   * Perform periodic security scan
   */
  performSecurityScan() {
    const issues = [];
    
    // Check for new untrusted scripts
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (!this.isTrustedDomain(src)) {
        issues.push({ type: 'untrusted_script', src });
      }
    });
    
    // Check for dangerous inline handlers
    document.querySelectorAll('*').forEach(element => {
      const attributes = element.attributes;
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (attr.name.startsWith('on')) {
          issues.push({ type: 'dangerous_handler', element: element.tagName, attribute: attr.name });
        }
      }
    });
    
    if (issues.length > 0) {
      this.logSecurityEvent('security_scan_issues', { issues });
    }
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(formId, activityType, details = {}) {
    const metrics = this.formMetrics.get(formId);
    if (metrics) {
      metrics.suspiciousActivity.push({
        type: activityType,
        details,
        timestamp: Date.now()
      });
    }
    
    this.logSecurityEvent('suspicious_activity', {
      formId,
      activityType,
      details
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, details = {}) {
    const event = {
      type: eventType,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      clientId: this.getClientId()
    };
    
    this.securityLog.push(event);
    
    // Keep only last 1000 events
    if (this.securityLog.length > 1000) {
      this.securityLog.splice(0, this.securityLog.length - 1000);
    }
    
    // Console logging for development
    if (eventType.includes('suspicious') || eventType.includes('violation') || eventType.includes('blocked')) {
      console.warn('🔒 Security Event:', event);
    } else {
      console.log('🔒 Security Event:', event);
    }
    
    // Send critical events to analytics if available
    if (window.gtag && (eventType.includes('violation') || eventType.includes('blocked'))) {
      gtag('event', 'security_incident', {
        event_category: 'Security',
        event_label: eventType,
        value: 1
      });
    }
  }

  /**
   * Get comprehensive security report
   */
  getSecurityReport() {
    const recentEvents = this.securityLog.filter(event => 
      Date.now() - event.timestamp < 3600000 // Last hour
    );
    
    const suspiciousEvents = recentEvents.filter(event => 
      event.type.includes('suspicious') || event.type.includes('blocked') || event.type.includes('violation')
    );
    
    return {
      securityScore: this.calculateSecurityScore(),
      totalEvents: this.securityLog.length,
      recentEvents: recentEvents.length,
      suspiciousEvents: suspiciousEvents.length,
      activeForms: this.formMetrics.size,
      lastScan: new Date().toISOString(),
      threatLevel: suspiciousEvents.length > 10 ? 'high' : suspiciousEvents.length > 5 ? 'medium' : 'low'
    };
  }

  /**
   * Export security logs (for debugging)
   */
  exportSecurityLogs() {
    const data = {
      logs: this.securityLog,
      formMetrics: Object.fromEntries(this.formMetrics),
      report: this.getSecurityReport()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

// Initialize Client Validation Security System
const clientValidation = new ClientValidation();

// Export for global use and debugging
window.ClientValidation = ClientValidation;
window.clientValidation = clientValidation;

// Legacy compatibility with existing code
window.SecurityUtils = {
  sanitizeText: (text, type) => clientValidation.sanitizeInput(text, type),
  sanitizeApiResponse: (response) => clientValidation.sanitizeInput(response, 'text'),
  validateAndSanitizeUrl: (url) => clientValidation.sanitizeURL(url),
  escapeHtml: (text) => clientValidation.escapeHTML(text),
  sanitizeFormData: (form) => clientValidation.sanitizeFormData(form),
  generateToken: () => clientValidation.generateSecureToken()
};

// Debug functions (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
  window.debugSecurity = {
    getReport: () => clientValidation.getSecurityReport(),
    exportLogs: () => clientValidation.exportSecurityLogs(),
    showNotification: (msg, type) => clientValidation.showSecurityNotification(msg, type)
  };
}

console.log('🛡️ Client Validation Security System v2.0.0 - Production Ready');