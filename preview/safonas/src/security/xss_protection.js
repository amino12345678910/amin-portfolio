/**
 * Enhanced XSS Protection Module
 * Comprehensive client-side protection against XSS attacks
 * Version: 1.0.0
 */

class XSSProtection {
  constructor() {
    this.trustedOrigins = [
      'https://cdn.jsdelivr.net',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://unpkg.com'
    ];

    this.dangerousPatterns = [
      // Script injection patterns
      /<script[\s\S]*?>.*?<\/script>/gi,
      /<iframe[\s\S]*?>.*?<\/iframe>/gi,
      /<object[\s\S]*?>.*?<\/object>/gi,
      /<embed[\s\S]*?>/gi,
      /<applet[\s\S]*?>/gi,
      /<meta[\s\S]*?>/gi,
      /<link[\s\S]*?>/gi,
      /<style[\s\S]*?>.*?<\/style>/gi,
      
      // JavaScript protocol and event handlers
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi,
      
      // Additional dangerous patterns
      /<form[\s\S]*?>/gi,
      /<input[\s\S]*?>/gi,
      /<textarea[\s\S]*?>/gi,
      /<select[\s\S]*?>/gi,
      /<option[\s\S]*?>/gi,
      
      // SVG-based XSS
      /<svg[\s\S]*?>/gi,
      /<foreignobject[\s\S]*?>/gi,
      
      // CSS-based XSS
      /expression\s*\(/gi,
      /binding\s*:/gi,
      /@import/gi,
      /url\s*\(/gi
    ];

    this.maxLengths = {
      text: 10000,
      url: 2048,
      email: 254,
      phone: 20,
      name: 100,
      message: 5000,
      subject: 200
    };

    this.init();
  }

  init() {
    this.setupGlobalProtection();
    this.protectDOMManipulation();
    this.setupCSPViolationReporting();
    this.validateExternalResources();
  }

  /**
   * Comprehensive text sanitization
   */
  sanitizeText(text, type = 'text') {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Length validation
    const maxLength = this.maxLengths[type] || this.maxLengths.text;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength);
    }

    // Remove null bytes and control characters
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // HTML entity encoding
    text = this.escapeHtml(text);

    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(text)) {
        console.warn('XSS Protection: Dangerous pattern detected and sanitized');
        text = text.replace(pattern, '[CONTENU_FILTRE]');
      }
    }

    return text;
  }

  /**
   * Enhanced HTML escaping
   */
  escapeHtml(text) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };

    return String(text).replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
  }

  /**
   * URL validation and sanitization
   */
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Length check
    if (url.length > this.maxLengths.url) {
      return null;
    }

    // Remove dangerous protocols
    const dangerousProtocols = [
      'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:', 
      'blob:', 'about:', 'chrome:', 'chrome-extension:'
    ];

    const lowerUrl = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        console.warn('XSS Protection: Dangerous URL protocol blocked');
        return null;
      }
    }

    // Only allow safe protocols
    const allowedProtocols = /^(https?:\/\/|mailto:|tel:|#)/i;
    if (!allowedProtocols.test(url)) {
      // Assume HTTPS if no protocol
      if (!url.includes(':') && !url.startsWith('#')) {
        url = 'https://' + url;
      } else {
        return null;
      }
    }

    try {
      // Additional URL validation
      const urlObj = new URL(url, window.location.href);
      
      // Check for suspicious URL patterns
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
   * Secure JSON parsing
   */
  parseJSON(jsonString) {
    try {
      // Basic validation before parsing
      if (!jsonString || typeof jsonString !== 'string') {
        throw new Error('Invalid JSON string');
      }

      // Check for dangerous patterns in JSON
      const dangerousJsonPatterns = [
        /__proto__/g,
        /constructor/g,
        /prototype/g,
        /<script/gi,
        /javascript:/gi
      ];

      for (const pattern of dangerousJsonPatterns) {
        if (pattern.test(jsonString)) {
          throw new Error('Potentially dangerous JSON content');
        }
      }

      const parsed = JSON.parse(jsonString);
      
      // Recursively sanitize object values
      return this.sanitizeObject(parsed);
    } catch (error) {
      console.error('XSS Protection: JSON parsing failed:', error);
      return null;
    }
  }

  /**
   * Recursively sanitize object properties
   */
  sanitizeObject(obj, depth = 0) {
    // Prevent deep recursion
    if (depth > 10) {
      return {};
    }

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, depth + 1));
    }

    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names
        const cleanKey = this.sanitizeText(key).slice(0, 100);
        if (cleanKey && !cleanKey.includes('__proto__') && cleanKey !== 'constructor') {
          sanitized[cleanKey] = this.sanitizeObject(value, depth + 1);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Setup global DOM protection
   */
  setupGlobalProtection() {
    // Override dangerous functions
    this.protectInnerHTML();
    this.protectEval();
    this.protectDocumentWrite();
  }

  /**
   * Protect innerHTML and similar DOM manipulation
   */
  protectDOMManipulation() {
    const originalCreateElement = document.createElement;
    const xssProtection = this;

    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      // Override innerHTML setter
      const originalInnerHTMLSetter = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
      Object.defineProperty(element, 'innerHTML', {
        set: function(value) {
          const sanitizedValue = xssProtection.sanitizeText(value);
          originalInnerHTMLSetter.call(this, sanitizedValue);
        },
        get: function() {
          return this.innerHTML;
        }
      });

      return element;
    };
  }

  /**
   * Protect innerHTML globally
   */
  protectInnerHTML() {
    const xssProtection = this;
    
    // Override innerHTML for existing elements
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        const sanitizedValue = xssProtection.sanitizeHtmlContent(value);
        this.textContent = sanitizedValue; // Use textContent for safety
      },
      get: function() {
        return this.innerHTML;
      }
    });
  }

  /**
   * Sanitize HTML content more thoroughly
   */
  sanitizeHtmlContent(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Create a temporary element to safely parse HTML
    const temp = document.createElement('div');
    temp.textContent = html;
    
    // Additional sanitization
    let sanitized = temp.innerHTML;
    
    // Remove any remaining dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '[CONTENU_BLOQUE]');
    }

    return sanitized;
  }

  /**
   * Disable eval and Function constructor
   */
  protectEval() {
    try {
      window.eval = function() {
        throw new Error('eval() is disabled for security');
      };
      
      window.Function = function() {
        throw new Error('Function constructor is disabled for security');
      };
    } catch (e) {
      // Some environments may not allow this override
      console.warn('Could not disable eval/Function:', e);
    }
  }

  /**
   * Protect document.write
   */
  protectDocumentWrite() {
    document.write = function() {
      console.warn('document.write blocked for security');
    };
    
    document.writeln = function() {
      console.warn('document.writeln blocked for security');
    };
  }

  /**
   * Setup CSP violation reporting
   */
  setupCSPViolationReporting() {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('CSP Violation:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
        disposition: e.disposition
      });

      // Report to analytics if available
      if (window.gtag) {
        gtag('event', 'csp_violation', {
          blocked_uri: e.blockedURI,
          directive: e.violatedDirective
        });
      }
    });
  }

  /**
   * Validate external resources
   */
  validateExternalResources() {
    // Check all external scripts
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (!this.isTrustedOrigin(src)) {
        console.warn('Untrusted script detected:', src);
        script.remove();
      }
    });

    // Check all external stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (!this.isTrustedOrigin(href)) {
        console.warn('Untrusted stylesheet detected:', href);
        link.remove();
      }
    });
  }

  /**
   * Check if origin is trusted
   */
  isTrustedOrigin(url) {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url, window.location.href);
      return this.trustedOrigins.some(origin => 
        urlObj.origin === origin || urlObj.href.startsWith(origin)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Secure form data sanitization
   */
  sanitizeFormData(formData) {
    const sanitized = new FormData();
    
    for (const [key, value] of formData.entries()) {
      const cleanKey = this.sanitizeText(key, 'name');
      let cleanValue = value;
      
      if (typeof value === 'string') {
        // Determine value type for appropriate sanitization
        if (key.includes('email')) {
          cleanValue = this.sanitizeText(value, 'email');
        } else if (key.includes('phone')) {
          cleanValue = this.sanitizeText(value, 'phone');
        } else if (key.includes('message')) {
          cleanValue = this.sanitizeText(value, 'message');
        } else if (key.includes('subject')) {
          cleanValue = this.sanitizeText(value, 'subject');
        } else {
          cleanValue = this.sanitizeText(value, 'text');
        }
      }
      
      sanitized.append(cleanKey, cleanValue);
    }
    
    return sanitized;
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Initialize XSS Protection
const xssProtection = new XSSProtection();

// Export for global use
window.XSSProtection = XSSProtection;
window.xssProtection = xssProtection;

// Legacy support - map old functions to new implementation
window.SecurityUtils = {
  sanitizeText: (text, type) => xssProtection.sanitizeText(text, type),
  sanitizeApiResponse: (response) => xssProtection.sanitizeText(response, 'message'),
  validateAndSanitizeUrl: (url) => xssProtection.sanitizeUrl(url),
  escapeHtml: (text) => xssProtection.escapeHtml(text),
  sanitizeFormData: (formData) => xssProtection.sanitizeFormData(formData),
  parseJSON: (jsonString) => xssProtection.parseJSON(jsonString)
};

console.log('✓ Enhanced XSS Protection initialized');