/**
 * Dynamic Breadcrumb Schema Generator for SEO
 * Automatically generates breadcrumb structured data based on URL path
 */

class BreadcrumbSchemaGenerator {
  constructor() {
    this.baseUrl = 'https://safonas.com';
    this.pathMapping = {
      'services': 'Services',
      'chatbots-ia-tunisie': 'Chatbots IA',
      'analytics-predictives-tunisie': 'Analytics Prédictives',
      'automatisation-processus-ia': 'Automatisation Processus',
      'agence-ia-tunis': 'Agence IA Tunis',
      'blog': 'Blog',
      'contact': 'Contact',
      'a-propos': 'À Propos',
      'success-stories-transformation-digitale-tunisie': 'Success Stories',
      'roi-intelligence-artificielle-guide': 'Guide ROI IA',
      'tendances-ia-2025-tunisie': 'Tendances IA 2025'
    };
  }

  /**
   * Generate breadcrumb schema for current page
   * @param {string} currentPath - Current URL path
   * @returns {Object} JSON-LD breadcrumb schema
   */
  generateBreadcrumbSchema(currentPath = window.location.pathname) {
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": this.baseUrl + "/"
      }
    ];

    let currentUrl = this.baseUrl;
    let position = 2;

    pathSegments.forEach((segment, index) => {
      currentUrl += '/' + segment;
      const name = this.pathMapping[segment] || this.formatSegmentName(segment);
      
      // Don't add the last segment as a link if it's the current page
      const isCurrentPage = index === pathSegments.length - 1;
      
      breadcrumbItems.push({
        "@type": "ListItem",
        "position": position,
        "name": name,
        "item": isCurrentPage ? undefined : currentUrl + "/"
      });
      
      position++;
    });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems
    };
  }

  /**
   * Format segment name for display
   * @param {string} segment - URL segment
   * @returns {string} Formatted name
   */
  formatSegmentName(segment) {
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Inject breadcrumb schema into page head
   */
  injectBreadcrumbSchema() {
    const schema = this.generateBreadcrumbSchema();
    
    // Remove existing breadcrumb schema if any
    const existingSchema = document.querySelector('script[data-breadcrumb-schema]');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Create new schema script tag
    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.setAttribute('data-breadcrumb-schema', 'true');
    scriptTag.textContent = JSON.stringify(schema, null, 2);
    
    document.head.appendChild(scriptTag);
  }

  /**
   * Generate HTML breadcrumb navigation
   * @returns {string} HTML breadcrumb navigation
   */
  generateBreadcrumbHTML() {
    const schema = this.generateBreadcrumbSchema();
    
    let html = '<nav aria-label="Breadcrumb" class="breadcrumb-nav">';
    html += '<ol class="breadcrumb-list" itemscope itemtype="https://schema.org/BreadcrumbList">';
    
    schema.itemListElement.forEach((item, index) => {
      const isLast = index === schema.itemListElement.length - 1;
      
      html += '<li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
      
      if (isLast || !item.item) {
        html += `<span itemprop="name" class="breadcrumb-current">${item.name}</span>`;
      } else {
        html += `<a href="${item.item}" itemprop="item" class="breadcrumb-link">`;
        html += `<span itemprop="name">${item.name}</span>`;
        html += '</a>';
      }
      
      html += `<meta itemprop="position" content="${item.position}">`;
      html += '</li>';
      
      if (!isLast) {
        html += '<li class="breadcrumb-separator" aria-hidden="true">&gt;</li>';
      }
    });
    
    html += '</ol>';
    html += '</nav>';
    
    return html;
  }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  const breadcrumbGenerator = new BreadcrumbSchemaGenerator();
  breadcrumbGenerator.injectBreadcrumbSchema();
  
  // Also inject HTML breadcrumbs if container exists
  const breadcrumbContainer = document.getElementById('breadcrumb-container');
  if (breadcrumbContainer) {
    breadcrumbContainer.innerHTML = breadcrumbGenerator.generateBreadcrumbHTML();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BreadcrumbSchemaGenerator;
}