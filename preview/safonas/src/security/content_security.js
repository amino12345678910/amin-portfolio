/**
 * Content Security Module
 * Secure resource loading, external script validation, and content protection
 * Version: 1.0.0
 */

class ContentSecurity {
  constructor() {
    this.trustedDomains = [
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'unpkg.com',
      'cdnjs.cloudflare.com'
    ];

    this.allowedImageDomains = [
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos'
    ];

    this.blockedExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'
    ];

    this.contentValidators = new Map();
    this.resourceIntegrity = new Map();
    
    this.init();
  }

  init() {
    this.setupResourceValidation();
    this.protectExternalContent();
    this.setupImageSecurity();
    this.monitorDOMChanges();
    this.implementCSP();
    this.setupSocialMediaSecurity();
  }

  /**
   * Setup resource validation for scripts and stylesheets
   */
  setupResourceValidation() {
    // Validate existing resources
    this.validateExistingResources();
    
    // Monitor new resource additions
    this.observeResourceAdditions();
    
    // Setup integrity checking
    this.setupIntegrityChecking();
  }

  /**
   * Validate existing resources on page
   */
  validateExistingResources() {
    // Check all scripts
    document.querySelectorAll('script[src]').forEach(script => {
      this.validateScript(script);
    });

    // Check all stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      this.validateStylesheet(link);
    });

    // Check all images
    document.querySelectorAll('img[src]').forEach(img => {
      this.validateImage(img);
    });
  }

  /**
   * Validate script resources
   */
  validateScript(script) {
    const src = script.getAttribute('src');
    if (!src) return;

    // Check if domain is trusted
    if (!this.isDomainTrusted(src)) {
      console.warn('Untrusted script blocked:', src);
      this.blockResource(script, 'untrusted_script');
      return;
    }

    // Check for inline event handlers
    this.checkInlineHandlers(script);

    // Verify integrity if provided
    this.verifyResourceIntegrity(script);
  }

  /**
   * Validate stylesheet resources
   */
  validateStylesheet(link) {
    const href = link.getAttribute('href');
    if (!href) return;

    // Check if domain is trusted
    if (!this.isDomainTrusted(href)) {
      console.warn('Untrusted stylesheet blocked:', href);
      this.blockResource(link, 'untrusted_stylesheet');
      return;
    }

    // Add security attributes
    this.addSecurityAttributes(link);
  }

  /**
   * Validate image resources
   */
  validateImage(img) {
    const src = img.getAttribute('src');
    if (!src) return;

    // Skip data URLs and relative paths for images
    if (src.startsWith('data:') || src.startsWith('/') || src.startsWith('./')) {
      return;
    }

    // Check if image domain is allowed
    if (!this.isImageDomainAllowed(src)) {
      console.warn('Untrusted image blocked:', src);
      this.blockResource(img, 'untrusted_image');
      return;
    }

    // Add security attributes to images
    img.setAttribute('referrerpolicy', 'no-referrer');
    img.setAttribute('crossorigin', 'anonymous');
  }

  /**
   * Check if domain is trusted
   */
  isDomainTrusted(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      
      // Allow same origin
      if (urlObj.origin === window.location.origin) {
        return true;
      }

      // Check against trusted domains
      return this.trustedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if image domain is allowed
   */
  isImageDomainAllowed(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      
      // Allow same origin
      if (urlObj.origin === window.location.origin) {
        return true;
      }

      // Check against allowed image domains
      return this.allowedImageDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Block malicious resource
   */
  blockResource(element, reason) {
    // Log security incident
    this.logSecurityIncident('resource_blocked', {
      element: element.tagName,
      src: element.src || element.href,
      reason: reason
    });

    // Remove the element
    element.remove();
    
    // Create placeholder for blocked content
    this.createBlockedContentPlaceholder(element, reason);
  }

  /**
   * Create placeholder for blocked content
   */
  createBlockedContentPlaceholder(originalElement, reason) {
    const placeholder = document.createElement('div');
    placeholder.className = 'blocked-content-placeholder';
    placeholder.style.cssText = `
      background: #2a2a2a;
      border: 2px dashed #666;
      padding: 20px;
      text-align: center;
      color: #ccc;
      border-radius: 8px;
      margin: 10px 0;
    `;
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-shield-alt';
    icon.style.fontSize = '24px';
    icon.style.marginBottom = '10px';
    icon.style.display = 'block';
    
    const message = document.createElement('p');
    message.textContent = `Contenu bloqué pour des raisons de sécurité (${reason})`;
    message.style.margin = '0';
    message.style.fontSize = '14px';
    
    placeholder.appendChild(icon);
    placeholder.appendChild(message);
    
    // Insert placeholder where original element was
    if (originalElement.parentNode) {
      originalElement.parentNode.insertBefore(placeholder, originalElement);
    }
  }

  /**
   * Check for dangerous inline event handlers
   */
  checkInlineHandlers(element) {
    const dangerousEvents = [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown'
    ];

    dangerousEvents.forEach(event => {
      if (element.hasAttribute(event)) {
        console.warn(`Dangerous inline handler removed: ${event}`);
        element.removeAttribute(event);
        this.logSecurityIncident('inline_handler_removed', {
          element: element.tagName,
          handler: event
        });
      }
    });
  }

  /**
   * Add security attributes to external resources
   */
  addSecurityAttributes(element) {
    // Add crossorigin attribute for CORS
    if (element.tagName === 'LINK' || element.tagName === 'SCRIPT') {
      element.setAttribute('crossorigin', 'anonymous');
    }

    // Add referrer policy
    element.setAttribute('referrerpolicy', 'no-referrer');
    
    // Add rel="noopener noreferrer" for links
    if (element.tagName === 'A' && element.hasAttribute('target')) {
      const rel = element.getAttribute('rel') || '';
      if (!rel.includes('noopener')) {
        element.setAttribute('rel', (rel + ' noopener noreferrer').trim());
      }
    }
  }

  /**
   * Observe new resource additions via DOM mutations
   */
  observeResourceAdditions() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check new scripts
            if (node.tagName === 'SCRIPT' && node.hasAttribute('src')) {
              this.validateScript(node);
            }
            
            // Check new stylesheets
            if (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet') {
              this.validateStylesheet(node);
            }
            
            // Check new images
            if (node.tagName === 'IMG' && node.hasAttribute('src')) {
              this.validateImage(node);
            }
            
            // Check for scripts within added elements
            node.querySelectorAll && node.querySelectorAll('script[src]').forEach(script => {
              this.validateScript(script);
            });
            
            // Check for stylesheets within added elements
            node.querySelectorAll && node.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
              this.validateStylesheet(link);
            });
            
            // Check for images within added elements
            node.querySelectorAll && node.querySelectorAll('img[src]').forEach(img => {
              this.validateImage(img);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup subresource integrity checking
   */
  setupIntegrityChecking() {
    // Check existing resources with integrity attributes
    document.querySelectorAll('[integrity]').forEach(element => {
      this.verifyResourceIntegrity(element);
    });
  }

  /**
   * Verify resource integrity
   */
  verifyResourceIntegrity(element) {
    const integrity = element.getAttribute('integrity');
    const src = element.src || element.href;
    
    if (!integrity || !src) return;

    // Store integrity information for validation
    this.resourceIntegrity.set(src, integrity);
    
    // Listen for load events to verify integrity
    element.addEventListener('load', () => {
      console.log('Resource loaded with integrity check:', src);
    });
    
    element.addEventListener('error', () => {
      console.warn('Resource failed integrity check:', src);
      this.logSecurityIncident('integrity_check_failed', { src, integrity });
    });
  }

  /**
   * Protect external content (iframes, embeds)
   */
  protectExternalContent() {
    // Validate iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      this.validateIframe(iframe);
    });

    // Validate embeds and objects
    document.querySelectorAll('embed, object').forEach(element => {
      this.validateEmbed(element);
    });
  }

  /**
   * Validate iframe sources
   */
  validateIframe(iframe) {
    const src = iframe.getAttribute('src');
    if (!src) return;

    // List of trusted iframe sources
    const trustedIframeDomains = [
      'www.youtube.com',
      'player.vimeo.com',
      'www.google.com'
    ];

    try {
      const urlObj = new URL(src);
      const isTrusted = trustedIframeDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );

      if (!isTrusted) {
        console.warn('Untrusted iframe blocked:', src);
        this.blockResource(iframe, 'untrusted_iframe');
        return;
      }

      // Add security attributes
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'no-referrer');
      
    } catch (e) {
      this.blockResource(iframe, 'invalid_iframe_url');
    }
  }

  /**
   * Validate embed and object elements
   */
  validateEmbed(element) {
    const src = element.src || element.data;
    if (src) {
      // Block all embed/object elements as they can be dangerous
      console.warn('Embed/Object element blocked for security:', src);
      this.blockResource(element, 'embed_object_blocked');
    }
  }

  /**
   * Setup image security measures
   */
  setupImageSecurity() {
    // Prevent image-based attacks
    document.addEventListener('DOMContentLoaded', () => {
      this.validateAllImages();
      this.setupImageErrorHandling();
    });
  }

  /**
   * Validate all images on the page
   */
  validateAllImages() {
    document.querySelectorAll('img').forEach(img => {
      // Check file extension
      const src = img.src || img.getAttribute('src');
      if (src && this.hasBlockedExtension(src)) {
        console.warn('Image with blocked extension removed:', src);
        this.blockResource(img, 'blocked_extension');
        return;
      }

      // Add security attributes
      img.setAttribute('referrerpolicy', 'no-referrer');
      
      // Prevent context menu on images (optional)
      img.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    });
  }

  /**
   * Check if file has blocked extension
   */
  hasBlockedExtension(url) {
    const urlLower = url.toLowerCase();
    return this.blockedExtensions.some(ext => urlLower.endsWith(ext));
  }

  /**
   * Setup image error handling
   */
  setupImageErrorHandling() {
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        console.warn('Image failed to load:', e.target.src);
        this.handleImageError(e.target);
      }
    }, true);
  }

  /**
   * Handle image loading errors
   */
  handleImageError(img) {
    // Replace broken image with placeholder
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik01MCA1MEwxNTAgMTUwTTUwIDE1MEwxNTAgNTAiIHN0cm9rZT0iI0NDQ0NDQyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTk5OTkiPkltYWdlIG5vbiB0cm91dsOpZTwvdGV4dD4KPC9zdmc+';
    img.alt = 'Image non trouvée';
    
    this.logSecurityIncident('image_load_error', {
      originalSrc: img.getAttribute('data-original-src') || 'unknown'
    });
  }

  /**
   * Monitor DOM changes for security threats
   */
  monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check for dangerous attribute changes
        if (mutation.type === 'attributes') {
          this.validateAttributeChange(mutation);
        }
        
        // Check for dangerous node additions
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.validateNewElement(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'src', 'href']
    });
  }

  /**
   * Validate attribute changes
   */
  validateAttributeChange(mutation) {
    const element = mutation.target;
    const attributeName = mutation.attributeName;
    
    // Check for dangerous event handlers
    if (attributeName.startsWith('on')) {
      console.warn('Dangerous event handler blocked:', attributeName);
      element.removeAttribute(attributeName);
      this.logSecurityIncident('dangerous_attribute_blocked', {
        element: element.tagName,
        attribute: attributeName
      });
    }
    
    // Check for dangerous src/href changes
    if (attributeName === 'src' || attributeName === 'href') {
      const value = element.getAttribute(attributeName);
      if (value && this.isDangerousUrl(value)) {
        console.warn('Dangerous URL blocked:', value);
        element.removeAttribute(attributeName);
        this.logSecurityIncident('dangerous_url_blocked', {
          element: element.tagName,
          url: value
        });
      }
    }
  }

  /**
   * Check if URL is dangerous
   */
  isDangerousUrl(url) {
    const dangerousPatterns = [
      /^javascript:/i,
      /^data:text\/html/i,
      /^vbscript:/i,
      /<script/i,
      /onclick=/i
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Validate new elements added to DOM
   */
  validateNewElement(element) {
    // Check for script injection
    if (element.tagName === 'SCRIPT') {
      if (!element.src) {
        // Inline script - check content
        const content = element.textContent || element.innerHTML;
        if (this.containsDangerousCode(content)) {
          console.warn('Dangerous inline script blocked');
          element.remove();
          this.logSecurityIncident('dangerous_inline_script', {
            content: content.substring(0, 100)
          });
        }
      }
    }
    
    // Check all attributes for dangerous content
    if (element.attributes) {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || this.isDangerousUrl(attr.value)) {
          element.removeAttribute(attr.name);
          this.logSecurityIncident('dangerous_attribute_removed', {
            element: element.tagName,
            attribute: attr.name
          });
        }
      });
    }
  }

  /**
   * Check if code contains dangerous patterns
   */
  containsDangerousCode(code) {
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /outerHTML\s*=/,
      /location\s*=/,
      /window\.open/
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Implement Content Security Policy via JavaScript
   */
  implementCSP() {
    // Create CSP meta tag if not exists
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      cspMeta.setAttribute('content', this.generateCSPPolicy());
      document.head.appendChild(cspMeta);
    }
  }

  /**
   * Generate CSP policy string
   */
  generateCSPPolicy() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net unpkg.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net",
      "font-src 'self' fonts.gstatic.com cdn.jsdelivr.net",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  /**
   * Setup social media widget security
   */
  setupSocialMediaSecurity() {
    // Monitor for social media widgets
    const socialWidgets = document.querySelectorAll('[class*="twitter"], [class*="facebook"], [class*="linkedin"], [id*="social"]');
    
    socialWidgets.forEach(widget => {
      // Add security sandbox
      if (widget.tagName === 'IFRAME') {
        widget.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
      }
    });
  }

  /**
   * Log security incidents
   */
  logSecurityIncident(type, details) {
    const incident = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.warn('Content Security Incident:', incident);
    
    // Send to analytics if available
    if (window.gtag) {
      gtag('event', 'security_incident', {
        event_category: 'Content Security',
        event_label: type,
        custom_parameter: JSON.stringify(details)
      });
    }
    
    // Store incidents locally for debugging
    const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
    incidents.push(incident);
    
    // Keep only last 50 incidents
    if (incidents.length > 50) {
      incidents.splice(0, incidents.length - 50);
    }
    
    localStorage.setItem('security_incidents', JSON.stringify(incidents));
  }

  /**
   * Get security report
   */
  getSecurityReport() {
    const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
    const recentIncidents = incidents.filter(incident => 
      Date.now() - incident.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    return {
      totalIncidents: incidents.length,
      recentIncidents: recentIncidents.length,
      incidentTypes: [...new Set(incidents.map(i => i.type))],
      lastIncident: incidents[incidents.length - 1] || null,
      securityScore: Math.max(0, 100 - (recentIncidents.length * 5))
    };
  }
}

// Initialize Content Security
const contentSecurity = new ContentSecurity();

// Export for global use
window.ContentSecurity = ContentSecurity;
window.contentSecurity = contentSecurity;

console.log('✓ Content Security initialized');