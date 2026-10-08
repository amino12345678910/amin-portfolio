/**
 * Internal Linking Optimizer for SEO
 * Automatically creates contextual internal links for better crawler discovery
 */

class InternalLinkingOptimizer {
  constructor() {
    this.linkMap = new Map();
    this.contextKeywords = new Map();
    this.processedElements = new Set();
    
    // Define internal link opportunities
    this.linkOpportunities = {
      // Services
      'chatbot': '/services/chatbots-ia-tunisie/',
      'chatbots': '/services/chatbots-ia-tunisie/',
      'assistant virtuel': '/services/chatbots-ia-tunisie/',
      'service client': '/services/chatbots-ia-tunisie/',
      
      'analytics': '/services/analytics-predictives-tunisie/',
      'analytics prédictives': '/services/analytics-predictives-tunisie/',
      'analyse de données': '/services/analytics-predictives-tunisie/',
      'business intelligence': '/services/analytics-predictives-tunisie/',
      'prédiction': '/services/analytics-predictives-tunisie/',
      
      'automatisation': '/services/automatisation-processus-ia/',
      'automatisation processus': '/services/automatisation-processus-ia/',
      'processus métier': '/services/automatisation-processus-ia/',
      'workflow': '/services/automatisation-processus-ia/',
      'rpa': '/services/automatisation-processus-ia/',
      
      // Location-based
      'agence ia tunis': '/agence-ia-tunis/',
      'intelligence artificielle tunisie': '/agence-ia-tunis/',
      'ia tunisie': '/agence-ia-tunis/',
      'agence tunisienne': '/agence-ia-tunis/',
      
      // Content pages
      'roi intelligence artificielle': '/roi-intelligence-artificielle-guide/',
      'retour sur investissement': '/roi-intelligence-artificielle-guide/',
      'rentabilité ia': '/roi-intelligence-artificielle-guide/',
      'mesurer roi': '/roi-intelligence-artificielle-guide/',
      
      'tendances ia': '/tendances-ia-2025-tunisie/',
      'futur intelligence artificielle': '/tendances-ia-2025-tunisie/',
      'innovation ia': '/tendances-ia-2025-tunisie/',
      'technologies émergentes': '/tendances-ia-2025-tunisie/',
      
      // Blog content
      'guide intelligence artificielle': '/blog/guide-intelligence-artificielle-tunisie/',
      'outils ia gratuits': '/blog/outils-ai-creation-site-gratuit/',
      'hugging face': '/blog/hugging-face-spaces-guide/',
      'déployer modèles ia': '/blog/hugging-face-spaces-guide/',
      
      // Success stories
      'cas d\'usage': '/success-stories-transformation-digitale-tunisie/',
      'transformation digitale': '/success-stories-transformation-digitale-tunisie/',
      'success story': '/success-stories-transformation-digitale-tunisie/',
      'étude de cas': '/success-stories-transformation-digitale-tunisie/',
      
      // Company pages
      'contact': '/contact/',
      'devis gratuit': '/contact/',
      'consultation': '/contact/',
      'à propos': '/a-propos/',
      'équipe safonas': '/a-propos/',
      
      // Why choose us
      'pourquoi choisir': '/pourquoi-choisir-agence-ia-tunisienne/',
      'avantages': '/pourquoi-choisir-agence-ia-tunisienne/',
      'expertise': '/pourquoi-choisir-agence-ia-tunisienne/'
    };
    
    // Contextual relevance scores
    this.contextRelevance = {
      'h1': 3,
      'h2': 2.5,
      'h3': 2,
      'strong': 1.5,
      'b': 1.5,
      'em': 1.2,
      'i': 1.2,
      'p': 1,
      'li': 1,
      'span': 0.8
    };
    
    this.init();
  }

  /**
   * Initialize the internal linking optimizer
   */
  init() {
    if (typeof window === 'undefined') return;
    
    document.addEventListener('DOMContentLoaded', () => {
      this.optimizeInternalLinks();
      this.addContextualRelevance();
      this.createLinkingSuggestions();
      this.trackLinkPerformance();
    });
  }

  /**
   * Main optimization function
   */
  optimizeInternalLinks() {
    const textNodes = this.getTextNodes(document.body);
    
    textNodes.forEach(node => {
      if (this.shouldProcessNode(node)) {
        this.processTextNode(node);
      }
    });
  }

  /**
   * Get all text nodes in the document
   */
  getTextNodes(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and already processed nodes
          if (node.parentNode.tagName === 'SCRIPT' || 
              node.parentNode.tagName === 'STYLE' ||
              node.parentNode.tagName === 'A' ||
              this.processedElements.has(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  /**
   * Check if node should be processed
   */
  shouldProcessNode(node) {
    const parentTag = node.parentNode.tagName.toLowerCase();
    const text = node.textContent.trim();
    
    return text.length > 10 && 
           !['script', 'style', 'a', 'button', 'input'].includes(parentTag) &&
           !this.processedElements.has(node);
  }

  /**
   * Process individual text node for linking opportunities
   */
  processTextNode(node) {
    let text = node.textContent;
    let hasChanges = false;
    const parentElement = node.parentNode;
    const parentTag = parentElement.tagName.toLowerCase();
    const relevanceScore = this.contextRelevance[parentTag] || 1;
    
    // Find linking opportunities in order of length (longer first)
    const sortedKeywords = Object.keys(this.linkOpportunities)
      .sort((a, b) => b.length - a.length);
    
    for (const keyword of sortedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches && matches.length > 0) {
        const url = this.linkOpportunities[keyword];
        
        // Check if we should create this link
        if (this.shouldCreateLink(keyword, url, parentElement, relevanceScore)) {
          // Create link only for the first occurrence in this node
          text = text.replace(regex, (match) => {
            if (!hasChanges) {
              hasChanges = true;
              return `<a href="${url}" class="internal-link" data-keyword="${keyword}" data-relevance="${relevanceScore}">${match}</a>`;
            }
            return match;
          });
          
          // Track the link creation
          this.trackLinkCreation(keyword, url, parentTag, relevanceScore);
        }
      }
    }
    
    // Update the DOM if changes were made
    if (hasChanges) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = text;
      parentElement.replaceChild(wrapper, node);
      this.processedElements.add(wrapper);
    } else {
      this.processedElements.add(node);
    }
  }

  /**
   * Determine if a link should be created
   */
  shouldCreateLink(keyword, url, parentElement, relevanceScore) {
    // Don't link to current page
    if (window.location.pathname === url) {
      return false;
    }
    
    // Check link density - avoid over-linking
    const existingLinks = parentElement.querySelectorAll('a').length;
    const textLength = parentElement.textContent.length;
    const linkDensity = existingLinks / (textLength / 100); // Links per 100 characters
    
    if (linkDensity > 0.05) { // Max 5 links per 100 characters
      return false;
    }
    
    // Check if similar link already exists nearby
    const nearbyLinks = this.getNearbyLinks(parentElement, 3);
    const similarLinkExists = nearbyLinks.some(link => 
      link.href.includes(url) || 
      link.textContent.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (similarLinkExists) {
      return false;
    }
    
    // Higher relevance scores get priority
    return relevanceScore >= 1;
  }

  /**
   * Get links within specified number of parent levels
   */
  getNearbyLinks(element, levels) {
    let current = element;
    const links = [];
    
    for (let i = 0; i < levels && current.parentElement; i++) {
      current = current.parentElement;
      const elemLinks = current.querySelectorAll('a');
      links.push(...Array.from(elemLinks));
    }
    
    return links;
  }

  /**
   * Track link creation for analytics
   */
  trackLinkCreation(keyword, url, parentTag, relevanceScore) {
    if (!this.linkMap.has(url)) {
      this.linkMap.set(url, []);
    }
    
    this.linkMap.get(url).push({
      keyword,
      parentTag,
      relevanceScore,
      timestamp: Date.now(),
      pageUrl: window.location.href
    });
  }

  /**
   * Add contextual relevance indicators
   */
  addContextualRelevance() {
    // Add structured data for internal linking
    const linkingData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "mainEntity": {
        "@type": "Organization",
        "@id": "https://safonas.com/#organization"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": this.generateBreadcrumbItems()
      },
      "relatedLink": Array.from(this.linkMap.keys()).map(url => ({
        "@type": "WebPage",
        "url": `https://safonas.com${url}`,
        "name": this.getPageTitle(url)
      }))
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(linkingData, null, 2);
    document.head.appendChild(script);
  }

  /**
   * Generate breadcrumb items for current page
   */
  generateBreadcrumbItems() {
    const pathSegments = window.location.pathname.split('/').filter(s => s);
    const items = [{
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://safonas.com/"
    }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += '/' + segment;
      items.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": this.formatSegmentName(segment),
        "item": `https://safonas.com${currentPath}`
      });
    });
    
    return items;
  }

  /**
   * Format URL segment for display
   */
  formatSegmentName(segment) {
    const nameMap = {
      'services': 'Services',
      'chatbots-ia-tunisie': 'Chatbots IA',
      'analytics-predictives-tunisie': 'Analytics Prédictives',
      'automatisation-processus-ia': 'Automatisation Processus',
      'agence-ia-tunis': 'Agence IA Tunis',
      'blog': 'Blog',
      'contact': 'Contact',
      'a-propos': 'À Propos'
    };
    
    return nameMap[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get page title from URL
   */
  getPageTitle(url) {
    const titleMap = {
      '/services/chatbots-ia-tunisie/': 'Chatbots IA Tunisie',
      '/services/analytics-predictives-tunisie/': 'Analytics Prédictives',
      '/services/automatisation-processus-ia/': 'Automatisation Processus IA',
      '/agence-ia-tunis/': 'Agence IA Tunis',
      '/roi-intelligence-artificielle-guide/': 'Guide ROI Intelligence Artificielle',
      '/tendances-ia-2025-tunisie/': 'Tendances IA 2025 Tunisie',
      '/blog/guide-intelligence-artificielle-tunisie/': 'Guide IA Tunisie',
      '/contact/': 'Contact',
      '/a-propos/': 'À Propos'
    };
    
    return titleMap[url] || url.replace(/^\/|\/$/g, '').replace(/-/g, ' ');
  }

  /**
   * Create linking suggestions for content creators
   */
  createLinkingSuggestions() {
    const suggestions = this.generateLinkingSuggestions();
    
    // Store suggestions in sessionStorage for content management
    if (suggestions.length > 0) {
      sessionStorage.setItem('linkingSuggestions', JSON.stringify(suggestions));
      
      // Optionally display suggestions to content editors
      if (this.isContentEditor()) {
        this.displaySuggestions(suggestions);
      }
    }
  }

  /**
   * Generate linking suggestions based on page content
   */
  generateLinkingSuggestions() {
    const suggestions = [];
    const pageContent = document.body.textContent.toLowerCase();
    
    // Analyze content for missing internal links
    for (const [keyword, url] of Object.entries(this.linkOpportunities)) {
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = pageContent.match(keywordRegex);
      
      if (matches && matches.length > 0) {
        const existingLinks = document.querySelectorAll(`a[href*="${url}"]`).length;
        
        if (existingLinks === 0) {
          suggestions.push({
            keyword,
            url,
            occurrences: matches.length,
            priority: this.calculateSuggestionPriority(keyword, matches.length)
          });
        }
      }
    }
    
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate suggestion priority
   */
  calculateSuggestionPriority(keyword, occurrences) {
    const keywordLength = keyword.length;
    const relevanceBoost = keyword.includes('tunisie') || keyword.includes('ia') ? 1.5 : 1;
    
    return occurrences * keywordLength * relevanceBoost;
  }

  /**
   * Check if current user is a content editor
   */
  isContentEditor() {
    // Check for content editor indicators
    return window.location.search.includes('edit=1') || 
           document.body.classList.contains('admin-user') ||
           sessionStorage.getItem('isEditor') === 'true';
  }

  /**
   * Display linking suggestions to content editors
   */
  displaySuggestions(suggestions) {
    if (suggestions.length === 0) return;
    
    const suggestionPanel = document.createElement('div');
    suggestionPanel.id = 'linking-suggestions';
    suggestionPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: #fff;
      border: 2px solid #007cba;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-height: 400px;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
    `;
    
    let html = '<h3 style="margin-top:0;color:#007cba;">Suggestions de liens internes</h3>';
    
    suggestions.slice(0, 5).forEach((suggestion, index) => {
      html += `
        <div style="margin-bottom: 10px; padding: 8px; background: #f9f9f9; border-radius: 4px;">
          <strong>${suggestion.keyword}</strong><br>
          <small>→ <a href="${suggestion.url}" target="_blank">${suggestion.url}</a></small><br>
          <small style="color: #666;">${suggestion.occurrences} occurrence(s), Priorité: ${suggestion.priority.toFixed(1)}</small>
        </div>
      `;
    });
    
    html += '<button onclick="this.parentElement.remove()" style="background:#007cba;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;margin-top:10px;">Fermer</button>';
    
    suggestionPanel.innerHTML = html;
    document.body.appendChild(suggestionPanel);
  }

  /**
   * Track link performance and user interactions
   */
  trackLinkPerformance() {
    const internalLinks = document.querySelectorAll('a.internal-link');
    
    internalLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        const linkData = {
          keyword: link.dataset.keyword,
          relevance: link.dataset.relevance,
          targetUrl: link.href,
          sourceUrl: window.location.href,
          timestamp: Date.now(),
          position: this.getLinkPosition(link)
        };
        
        // Send to analytics
        this.sendLinkAnalytics(linkData);
      });
    });
  }

  /**
   * Get link position on page
   */
  getLinkPosition(link) {
    const rect = link.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
      x: rect.left,
      y: rect.top + scrollTop,
      visible: rect.top >= 0 && rect.bottom <= window.innerHeight
    };
  }

  /**
   * Send link analytics data
   */
  sendLinkAnalytics(linkData) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'internal_link_click', {
        link_text: linkData.keyword,
        link_url: linkData.targetUrl,
        source_url: linkData.sourceUrl,
        relevance_score: linkData.relevance
      });
    }
    
    // Custom analytics
    if (window.safonasAnalytics) {
      window.safonasAnalytics.track('internal_link_interaction', linkData);
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    const totalLinks = this.linkMap.size;
    const totalKeywords = Array.from(this.linkMap.values()).reduce((sum, links) => sum + links.length, 0);
    const avgRelevance = Array.from(this.linkMap.values())
      .flat()
      .reduce((sum, link) => sum + link.relevanceScore, 0) / totalKeywords;
    
    return {
      totalPages: totalLinks,
      totalKeywords,
      averageRelevanceScore: avgRelevance || 0,
      linkDensity: totalKeywords / (document.body.textContent.length / 1000), // links per 1000 chars
      topKeywords: this.getTopKeywords()
    };
  }

  /**
   * Get most frequently used keywords
   */
  getTopKeywords() {
    const keywordCounts = {};
    
    Array.from(this.linkMap.values()).flat().forEach(link => {
      keywordCounts[link.keyword] = (keywordCounts[link.keyword] || 0) + 1;
    });
    
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }
}

// Initialize internal linking optimizer
document.addEventListener('DOMContentLoaded', () => {
  window.internalLinkingOptimizer = new InternalLinkingOptimizer();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InternalLinkingOptimizer;
}