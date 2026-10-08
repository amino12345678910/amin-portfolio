/**
 * Performance Monitor for Google Search Console Optimization
 * Tracks and reports performance metrics relevant to search indexing
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.reportingEndpoint = '/api/performance-metrics';
    this.reportingInterval = 30000; // 30 seconds
    
    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (typeof window === 'undefined') return;
    
    // Start monitoring when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }
  }

  /**
   * Start all performance monitoring
   */
  startMonitoring() {
    this.monitorPageLoadMetrics();
    this.monitorRuntimeMetrics();
    this.monitorUserInteractions();
    this.monitorResourceLoading();
    this.monitorCrawlerAccessibility();
    this.startPeriodicReporting();
    
    // Set up visibility change monitoring
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.reportMetrics('visibility_hidden');
      }
    });
    
    // Report metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics('page_unload');
    });
  }

  /**
   * Monitor page load performance metrics
   */
  monitorPageLoadMetrics() {
    // Monitor navigation timing
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      
      const loadMetrics = {
        dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcp_connection: timing.connectEnd - timing.connectStart,
        ssl_handshake: timing.secureConnectionStart ? timing.connectEnd - timing.secureConnectionStart : 0,
        ttfb: timing.responseStart - timing.navigationStart,
        dom_loading: timing.domLoading - timing.navigationStart,
        dom_interactive: timing.domInteractive - timing.navigationStart,
        dom_complete: timing.domComplete - timing.navigationStart,
        load_complete: timing.loadEventEnd - timing.navigationStart,
        page_size: this.estimatePageSize()
      };
      
      this.metrics.pageLoad = loadMetrics;
      
      // Calculate derived metrics
      this.metrics.pageLoad.first_byte_time = loadMetrics.ttfb;
      this.metrics.pageLoad.dom_processing_time = loadMetrics.dom_complete - loadMetrics.dom_loading;
      this.metrics.pageLoad.network_time = loadMetrics.ttfb - loadMetrics.dns_lookup - loadMetrics.tcp_connection;
    }

    // Monitor resource loading
    if ('performance' in window && 'getEntriesByType' in performance) {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        this.analyzeResourcePerformance(resources);
      }, 2000); // Wait 2 seconds after load
    }
  }

  /**
   * Monitor runtime performance metrics
   */
  monitorRuntimeMetrics() {
    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        this.metrics.memory = {
          used_heap: performance.memory.usedJSHeapSize,
          total_heap: performance.memory.totalJSHeapSize,
          heap_limit: performance.memory.jsHeapSizeLimit,
          memory_pressure: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
        };
      }, 10000); // Every 10 seconds
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const longTasks = list.getEntries();
          
          if (!this.metrics.longTasks) {
            this.metrics.longTasks = [];
          }
          
          longTasks.forEach(task => {
            this.metrics.longTasks.push({
              duration: task.duration,
              start_time: task.startTime,
              attribution: task.attribution ? task.attribution.map(attr => ({
                name: attr.name,
                type: attr.containerType,
                src: attr.containerSrc
              })) : []
            });
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task monitoring not supported:', e);
      }
    }
  }

  /**
   * Monitor user interactions relevant to SEO
   */
  monitorUserInteractions() {
    const interactionMetrics = {
      clicks: 0,
      scrolls: 0,
      time_on_page: 0,
      bounce_indicators: [],
      engagement_score: 0
    };

    // Track clicks
    document.addEventListener('click', (event) => {
      interactionMetrics.clicks++;
      
      // Track internal vs external links
      if (event.target.tagName === 'A') {
        const isInternal = event.target.hostname === window.location.hostname;
        if (!this.metrics.linkClicks) this.metrics.linkClicks = { internal: 0, external: 0 };
        this.metrics.linkClicks[isInternal ? 'internal' : 'external']++;
      }
    });

    // Track scrolling behavior
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      interactionMetrics.scrolls++;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = this.getScrollPercentage();
        if (!this.metrics.scrollBehavior) this.metrics.scrollBehavior = [];
        this.metrics.scrollBehavior.push({
          percentage: scrollPercentage,
          timestamp: Date.now()
        });
      }, 100);
    });

    // Track time on page
    const startTime = Date.now();
    setInterval(() => {
      interactionMetrics.time_on_page = Date.now() - startTime;
      interactionMetrics.engagement_score = this.calculateEngagementScore(interactionMetrics);
    }, 1000);

    this.metrics.userInteraction = interactionMetrics;
  }

  /**
   * Monitor resource loading for crawler optimization
   */
  monitorResourceLoading() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const resources = list.getEntries();
        
        resources.forEach(resource => {
          this.categorizeResourcePerformance(resource);
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource monitoring not supported:', e);
    }
  }

  /**
   * Monitor crawler accessibility metrics
   */
  monitorCrawlerAccessibility() {
    const accessibilityMetrics = {
      images_with_alt: 0,
      images_without_alt: 0,
      headings_structure: this.analyzeHeadingStructure(),
      internal_links: document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]').length,
      external_links: document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])').length,
      structured_data: this.detectStructuredData(),
      meta_tags: this.analyzeMetaTags(),
      page_depth: this.calculatePageDepth(),
      content_length: document.body.textContent.length,
      content_quality: this.assessContentQuality()
    };

    // Analyze images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.alt && img.alt.trim() !== '') {
        accessibilityMetrics.images_with_alt++;
      } else {
        accessibilityMetrics.images_without_alt++;
      }
    });

    this.metrics.crawlerAccessibility = accessibilityMetrics;
  }

  /**
   * Analyze resource performance
   */
  analyzeResourcePerformance(resources) {
    const resourceMetrics = {
      css: { count: 0, total_size: 0, avg_load_time: 0 },
      js: { count: 0, total_size: 0, avg_load_time: 0 },
      images: { count: 0, total_size: 0, avg_load_time: 0 },
      fonts: { count: 0, total_size: 0, avg_load_time: 0 },
      other: { count: 0, total_size: 0, avg_load_time: 0 }
    };

    resources.forEach(resource => {
      const category = this.categorizeResource(resource.name);
      const loadTime = resource.responseEnd - resource.responseStart;
      const size = resource.transferSize || resource.encodedBodySize || 0;

      resourceMetrics[category].count++;
      resourceMetrics[category].total_size += size;
      resourceMetrics[category].avg_load_time = 
        (resourceMetrics[category].avg_load_time * (resourceMetrics[category].count - 1) + loadTime) / 
        resourceMetrics[category].count;
    });

    this.metrics.resourcePerformance = resourceMetrics;
  }

  /**
   * Categorize resource by type
   */
  categorizeResource(url) {
    const ext = url.split('.').pop().toLowerCase().split('?')[0];
    
    if (['css'].includes(ext)) return 'css';
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'js';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(ext)) return 'images';
    if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext)) return 'fonts';
    
    return 'other';
  }

  /**
   * Categorize individual resource performance
   */
  categorizeResourcePerformance(resource) {
    const loadTime = resource.responseEnd - resource.responseStart;
    
    if (loadTime > 1000) { // Slow resources > 1s
      if (!this.metrics.slowResources) this.metrics.slowResources = [];
      this.metrics.slowResources.push({
        url: resource.name,
        load_time: loadTime,
        size: resource.transferSize,
        type: this.categorizeResource(resource.name)
      });
    }
  }

  /**
   * Analyze heading structure for SEO
   */
  analyzeHeadingStructure() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const structure = {};
    
    headings.forEach(heading => {
      const level = heading.tagName.toLowerCase();
      if (!structure[level]) structure[level] = 0;
      structure[level]++;
    });
    
    return {
      ...structure,
      total: headings.length,
      has_h1: !!document.querySelector('h1'),
      multiple_h1: document.querySelectorAll('h1').length > 1,
      hierarchy_valid: this.validateHeadingHierarchy(headings)
    };
  }

  /**
   * Validate heading hierarchy
   */
  validateHeadingHierarchy(headings) {
    let currentLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel === 0) {
        if (level !== 1) return false; // Should start with H1
        currentLevel = level;
      } else {
        if (level > currentLevel + 1) return false; // Can't skip levels
        currentLevel = level;
      }
    }
    
    return true;
  }

  /**
   * Detect structured data
   */
  detectStructuredData() {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const microdataElements = document.querySelectorAll('[itemtype]');
    const rdfa = document.querySelectorAll('[typeof]');
    
    return {
      json_ld_count: jsonLdScripts.length,
      microdata_count: microdataElements.length,
      rdfa_count: rdfa.length,
      total_structured_data: jsonLdScripts.length + microdataElements.length + rdfa.length,
      has_organization_schema: !!document.querySelector('script[type="application/ld+json"]') && 
        Array.from(jsonLdScripts).some(script => {
          try {
            const data = JSON.parse(script.textContent);
            return data['@type'] === 'Organization' || 
                   (data['@graph'] && data['@graph'].some(item => item['@type'] === 'Organization'));
          } catch (e) {
            return false;
          }
        })
    };
  }

  /**
   * Analyze meta tags
   */
  analyzeMetaTags() {
    const metaTags = document.querySelectorAll('meta');
    const analysis = {
      total: metaTags.length,
      has_description: !!document.querySelector('meta[name="description"]'),
      has_keywords: !!document.querySelector('meta[name="keywords"]'),
      has_viewport: !!document.querySelector('meta[name="viewport"]'),
      has_robots: !!document.querySelector('meta[name="robots"]'),
      has_canonical: !!document.querySelector('link[rel="canonical"]'),
      has_og_tags: document.querySelectorAll('meta[property^="og:"]').length,
      has_twitter_tags: document.querySelectorAll('meta[name^="twitter:"]').length
    };
    
    // Check meta description length
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      analysis.description_length = description.content.length;
      analysis.description_optimal = analysis.description_length >= 120 && analysis.description_length <= 160;
    }
    
    // Check title length
    const title = document.querySelector('title');
    if (title) {
      analysis.title_length = title.textContent.length;
      analysis.title_optimal = analysis.title_length >= 30 && analysis.title_length <= 60;
    }
    
    return analysis;
  }

  /**
   * Calculate page depth from root
   */
  calculatePageDepth() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    return pathSegments.length;
  }

  /**
   * Assess content quality metrics
   */
  assessContentQuality() {
    const textContent = document.body.textContent;
    const wordCount = textContent.split(/\s+/).length;
    const sentences = textContent.split(/[.!?]+/).length;
    const paragraphs = document.querySelectorAll('p').length;
    
    return {
      word_count: wordCount,
      sentence_count: sentences,
      paragraph_count: paragraphs,
      avg_words_per_sentence: wordCount / sentences,
      reading_level: this.calculateReadingLevel(textContent),
      content_density: wordCount / (document.body.innerHTML.length - textContent.length) // Text vs markup ratio
    };
  }

  /**
   * Calculate basic reading level (Flesch Reading Ease approximation)
   */
  calculateReadingLevel(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = this.countSyllables(text);
    
    // Flesch Reading Ease formula approximation
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    
    if (score >= 90) return 'very_easy';
    if (score >= 80) return 'easy';
    if (score >= 70) return 'fairly_easy';
    if (score >= 60) return 'standard';
    if (score >= 50) return 'fairly_difficult';
    if (score >= 30) return 'difficult';
    return 'very_difficult';
  }

  /**
   * Count syllables in text (approximation)
   */
  countSyllables(text) {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/[^a]/g, '').length || 1;
  }

  /**
   * Get scroll percentage
   */
  getScrollPercentage() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / scrollHeight) * 100);
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(interactions) {
    const timeScore = Math.min(interactions.time_on_page / 30000, 1) * 40; // 30s = max time score
    const clickScore = Math.min(interactions.clicks / 5, 1) * 30; // 5 clicks = max click score
    const scrollScore = Math.min(interactions.scrolls / 10, 1) * 30; // 10 scrolls = max scroll score
    
    return Math.round(timeScore + clickScore + scrollScore);
  }

  /**
   * Estimate page size
   */
  estimatePageSize() {
    return new Blob([document.documentElement.outerHTML]).size;
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    setInterval(() => {
      this.reportMetrics('periodic');
    }, this.reportingInterval);
  }

  /**
   * Report metrics to endpoint
   */
  reportMetrics(trigger = 'manual') {
    const report = {
      url: window.location.href,
      timestamp: Date.now(),
      trigger,
      user_agent: navigator.userAgent,
      metrics: { ...this.metrics }
    };

    // Add current viewport information
    report.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1
    };

    // Send to server
    this.sendReport(report);
    
    // Send to Google Analytics if available
    this.sendToAnalytics(report);
  }

  /**
   * Send report to server
   */
  async sendReport(report) {
    try {
      // Use sendBeacon if available for reliability
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify(report)
        );
      } else {
        // Fallback to fetch
        fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
          keepalive: true
        }).catch(err => {
          console.warn('Failed to send performance report:', err);
        });
      }
    } catch (error) {
      console.warn('Error sending performance report:', error);
    }
  }

  /**
   * Send key metrics to Google Analytics
   */
  sendToAnalytics(report) {
    if (typeof gtag === 'function') {
      // Send Core Web Vitals data
      if (report.metrics.pageLoad) {
        gtag('event', 'page_performance', {
          event_category: 'Performance',
          ttfb: report.metrics.pageLoad.ttfb,
          dom_complete: report.metrics.pageLoad.dom_complete,
          load_complete: report.metrics.pageLoad.load_complete
        });
      }
      
      // Send SEO metrics
      if (report.metrics.crawlerAccessibility) {
        gtag('event', 'seo_metrics', {
          event_category: 'SEO',
          internal_links: report.metrics.crawlerAccessibility.internal_links,
          content_length: report.metrics.crawlerAccessibility.content_length,
          structured_data: report.metrics.crawlerAccessibility.structured_data.total_structured_data
        });
      }
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary() {
    return {
      page_load_score: this.calculatePageLoadScore(),
      seo_score: this.calculateSEOScore(),
      user_experience_score: this.calculateUXScore(),
      crawler_friendliness: this.calculateCrawlerFriendliness(),
      overall_score: this.calculateOverallScore(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Calculate page load performance score
   */
  calculatePageLoadScore() {
    if (!this.metrics.pageLoad) return 0;
    
    const { ttfb, dom_complete, load_complete } = this.metrics.pageLoad;
    
    // Score based on thresholds
    let score = 100;
    if (ttfb > 800) score -= 20;
    if (dom_complete > 2000) score -= 20;
    if (load_complete > 3000) score -= 20;
    if (this.metrics.slowResources && this.metrics.slowResources.length > 0) {
      score -= Math.min(this.metrics.slowResources.length * 5, 40);
    }
    
    return Math.max(0, score);
  }

  /**
   * Calculate SEO score
   */
  calculateSEOScore() {
    if (!this.metrics.crawlerAccessibility) return 0;
    
    const ca = this.metrics.crawlerAccessibility;
    let score = 100;
    
    // Meta tags
    if (!ca.meta_tags.has_description) score -= 15;
    if (!ca.meta_tags.description_optimal) score -= 10;
    if (!ca.meta_tags.has_canonical) score -= 10;
    if (!ca.meta_tags.title_optimal) score -= 10;
    
    // Structure
    if (!ca.headings_structure.has_h1) score -= 15;
    if (ca.headings_structure.multiple_h1) score -= 10;
    if (!ca.headings_structure.hierarchy_valid) score -= 10;
    
    // Content
    if (ca.images_without_alt > 0) score -= Math.min(ca.images_without_alt * 2, 20);
    if (ca.structured_data.total_structured_data === 0) score -= 15;
    
    return Math.max(0, score);
  }

  /**
   * Calculate user experience score
   */
  calculateUXScore() {
    if (!this.metrics.userInteraction) return 0;
    
    const ui = this.metrics.userInteraction;
    let score = ui.engagement_score || 0;
    
    // Add bonuses for good performance
    if (this.metrics.pageLoad && this.metrics.pageLoad.load_complete < 2000) score += 20;
    if (this.metrics.longTasks && this.metrics.longTasks.length === 0) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Calculate crawler friendliness score
   */
  calculateCrawlerFriendliness() {
    if (!this.metrics.crawlerAccessibility) return 0;
    
    const ca = this.metrics.crawlerAccessibility;
    let score = 100;
    
    // Internal linking
    if (ca.internal_links < 3) score -= 20;
    if (ca.page_depth > 3) score -= 10;
    
    // Content quality
    if (ca.content_quality.word_count < 300) score -= 15;
    if (ca.content_quality.content_density < 0.1) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * Calculate overall performance score
   */
  calculateOverallScore() {
    const pageLoadScore = this.calculatePageLoadScore();
    const seoScore = this.calculateSEOScore();
    const uxScore = this.calculateUXScore();
    const crawlerScore = this.calculateCrawlerFriendliness();
    
    return Math.round((pageLoadScore * 0.3 + seoScore * 0.35 + uxScore * 0.2 + crawlerScore * 0.15));
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Page load recommendations
    if (this.metrics.pageLoad) {
      if (this.metrics.pageLoad.ttfb > 800) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          issue: 'Slow server response time',
          recommendation: 'Optimize server performance, use CDN, or improve hosting'
        });
      }
      
      if (this.metrics.pageLoad.load_complete > 3000) {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          issue: 'Slow page load',
          recommendation: 'Optimize images, minify CSS/JS, reduce HTTP requests'
        });
      }
    }
    
    // SEO recommendations
    if (this.metrics.crawlerAccessibility) {
      const ca = this.metrics.crawlerAccessibility;
      
      if (!ca.meta_tags.has_description) {
        recommendations.push({
          priority: 'high',
          category: 'seo',
          issue: 'Missing meta description',
          recommendation: 'Add a compelling meta description (120-160 characters)'
        });
      }
      
      if (!ca.headings_structure.has_h1) {
        recommendations.push({
          priority: 'high',
          category: 'seo',
          issue: 'Missing H1 tag',
          recommendation: 'Add a clear H1 tag with target keywords'
        });
      }
      
      if (ca.images_without_alt > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'accessibility',
          issue: `${ca.images_without_alt} images missing alt text`,
          recommendation: 'Add descriptive alt text to all images'
        });
      }
      
      if (ca.structured_data.total_structured_data === 0) {
        recommendations.push({
          priority: 'medium',
          category: 'seo',
          issue: 'No structured data found',
          recommendation: 'Implement JSON-LD structured data for better search visibility'
        });
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Clean up observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize performance monitor
document.addEventListener('DOMContentLoaded', () => {
  window.performanceMonitor = new PerformanceMonitor();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}