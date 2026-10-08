// Security Utilities Module
// Contains XSS protection, input sanitization, and validation functions

class SecurityUtils {
  /**
   * Comprehensive text sanitization to prevent XSS attacks
   * @param {string} text - The text to sanitize
   * @returns {string} - Sanitized text safe for display
   */
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    // Limit text length to prevent DoS
    if (text.length > 10000) {
      text = text.substring(0, 10000);
    }
    
    // Escape HTML entities
    return SecurityUtils.escapeHtml(text);
  }

  /**
   * Escape HTML entities to prevent XSS
   * @param {string} text - The text to escape
   * @returns {string} - HTML-escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitize API responses to prevent XSS from external sources
   * @param {string} response - The API response to sanitize
   * @returns {string} - Sanitized response
   */
  static sanitizeApiResponse(response) {
    if (!response || typeof response !== 'string') {
      return 'Réponse invalide du serveur';
    }
    
    // Limit response length
    if (response.length > 5000) {
      response = response.substring(0, 5000) + '... [tronqué]';
    }
    
    // Basic content validation - reject responses with potentially harmful content
    const dangerousPatterns = [
      /<script[\s\S]*?>.*?<\/script>/gi,
      /<iframe[\s\S]*?>.*?<\/iframe>/gi,
      /<object[\s\S]*?>.*?<\/object>/gi,
      /<embed[\s\S]*?>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(response)) {
        return 'Réponse filtrée pour des raisons de sécurité';
      }
    }
    
    return response;
  }

  /**
   * Validate and sanitize URLs for links
   * @param {string} url - The URL to validate
   * @returns {string|null} - Validated URL or null if invalid
   */
  static validateAndSanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }
    
    // Remove dangerous protocols
    const dangerousProtocols = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'ftp:'
    ];
    
    const lowerUrl = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return null;
      }
    }
    
    // Only allow http, https, mailto, and tel protocols
    if (!lowerUrl.startsWith('http://') && 
        !lowerUrl.startsWith('https://') && 
        !lowerUrl.startsWith('mailto:') && 
        !lowerUrl.startsWith('tel:')) {
      // If no protocol specified, assume https
      if (!lowerUrl.includes('://')) {
        url = 'https://' + url;
      } else {
        return null;
      }
    }
    
    // Basic URL validation
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }

  /**
   * Initialize legacy security utilities for backward compatibility
   */
  static initializeLegacySupport() {
    if (!window.SecurityUtils) {
      window.SecurityUtils = {
        sanitizeText: SecurityUtils.sanitizeText,
        sanitizeApiResponse: SecurityUtils.sanitizeApiResponse,
        validateAndSanitizeUrl: SecurityUtils.validateAndSanitizeUrl,
        escapeHtml: SecurityUtils.escapeHtml
      };
    }
  }
}

// Auto-initialize for backward compatibility
SecurityUtils.initializeLegacySupport();

// Export for module use
window.SecurityUtils = SecurityUtils;