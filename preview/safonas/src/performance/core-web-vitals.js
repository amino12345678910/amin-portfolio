/**
 * Core Web Vitals Optimization Script
 * Monitors and improves LCP, FID, CLS, INP performance metrics
 */

class CoreWebVitalsOptimizer {
  constructor() {
    this.metrics = {
      LCP: null,
      FID: null,
      CLS: null,
      INP: null,
      TTFB: null
    };
    
    this.thresholds = {
      LCP: 2500, // Good: < 2.5s
      FID: 100,  // Good: < 100ms
      CLS: 0.1,  // Good: < 0.1
      INP: 200,  // Good: < 200ms
      TTFB: 800  // Good: < 800ms
    };

    this.init();
  }

  /**
   * Initialize Core Web Vitals monitoring and optimization
   */
  init() {
    if (typeof window === 'undefined') return;
    
    // Load web-vitals library dynamically
    this.loadWebVitalsLibrary().then(() => {
      this.startMonitoring();
      this.optimizePerformance();
    });
  }

  /**
   * Load web-vitals library
   */
  async loadWebVitalsLibrary() {
    if (window.webVitals) return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Start monitoring Core Web Vitals
   */
  startMonitoring() {
    if (!window.webVitals) return;

    // Monitor Largest Contentful Paint
    window.webVitals.getLCP((metric) => {
      this.metrics.LCP = metric.value;
      this.handleMetric('LCP', metric);
    });

    // Monitor First Input Delay
    window.webVitals.getFID((metric) => {
      this.metrics.FID = metric.value;
      this.handleMetric('FID', metric);
    });

    // Monitor Cumulative Layout Shift
    window.webVitals.getCLS((metric) => {
      this.metrics.CLS = metric.value;
      this.handleMetric('CLS', metric);
    });

    // Monitor Interaction to Next Paint
    window.webVitals.getINP((metric) => {
      this.metrics.INP = metric.value;
      this.handleMetric('INP', metric);
    });

    // Monitor Time to First Byte
    window.webVitals.getTTFB((metric) => {
      this.metrics.TTFB = metric.value;
      this.handleMetric('TTFB', metric);
    });
  }

  /**
   * Handle individual metric measurement
   */
  handleMetric(name, metric) {
    const threshold = this.thresholds[name];
    const isGood = metric.value < threshold;
    
    // Log to console for debugging
    console.log(`[Core Web Vitals] ${name}: ${metric.value}ms (${isGood ? 'Good' : 'Needs Improvement'})`);
    
    // Send to analytics if configured
    this.sendToAnalytics(name, metric);
    
    // Apply optimizations if metric is poor
    if (!isGood) {
      this.applyMetricOptimization(name, metric);
    }
  }

  /**
   * Apply specific optimizations based on poor metrics
   */
  applyMetricOptimization(metricName, metric) {
    switch (metricName) {
      case 'LCP':
        this.optimizeLCP();
        break;
      case 'FID':
        this.optimizeFID();
        break;
      case 'CLS':
        this.optimizeCLS();
        break;
      case 'INP':
        this.optimizeINP();
        break;
      case 'TTFB':
        this.optimizeTTFB();
        break;
    }
  }

  /**
   * Optimize Largest Contentful Paint (LCP)
   */
  optimizeLCP() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Optimize images
    this.optimizeImages();
    
    // Remove unused CSS
    this.removeUnusedCSS();
    
    // Implement lazy loading for non-critical content
    this.implementLazyLoading();
  }

  /**
   * Optimize First Input Delay (FID)
   */
  optimizeFID() {
    // Break up long tasks
    this.breakUpLongTasks();
    
    // Optimize third-party scripts
    this.optimizeThirdPartyScripts();
    
    // Use web workers for heavy computations
    this.useWebWorkers();
  }

  /**
   * Optimize Cumulative Layout Shift (CLS)
   */
  optimizeCLS() {
    // Set size attributes for images and embeds
    this.setSizeAttributesForMedia();
    
    // Reserve space for ads and dynamic content
    this.reserveSpaceForDynamicContent();
    
    // Avoid inserting content above existing content
    this.avoidContentInsertion();
  }

  /**
   * Optimize Interaction to Next Paint (INP)
   */
  optimizeINP() {
    // Optimize event handlers
    this.optimizeEventHandlers();
    
    // Reduce JavaScript execution time
    this.reduceJSExecutionTime();
    
    // Implement input response optimization
    this.implementInputResponseOptimization();
  }

  /**
   * Optimize Time to First Byte (TTFB)
   */
  optimizeTTFB() {
    // This is primarily server-side, but we can optimize client-side aspects
    console.warn('[TTFB] Server-side optimization needed. Consider CDN, server optimization, and caching.');
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    const criticalResources = [
      { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', as: 'style' },
      { href: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css', as: 'style' },
      { href: '/images/logo.png', as: 'image' },
      { href: '/images/hero-ai-tunisia.jpg', as: 'image' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.as === 'style') {
        link.onload = function() {
          this.rel = 'stylesheet';
        };
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize images for better performance
   */
  optimizeImages() {
    const images = document.querySelectorAll('img:not([loading])');
    
    images.forEach((img, index) => {
      // Add loading attribute for non-critical images
      if (index > 2) { // First 3 images are critical
        img.loading = 'lazy';
      }
      
      // Add decoding attribute
      img.decoding = 'async';
      
      // Set proper size attributes if missing
      if (!img.width && !img.height) {
        const computedStyle = window.getComputedStyle(img);
        img.width = computedStyle.width;
        img.height = computedStyle.height;
      }
    });
  }

  /**
   * Remove unused CSS dynamically
   */
  removeUnusedCSS() {
    // This is a simplified version - production should use tools like PurgeCSS
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    stylesheets.forEach(stylesheet => {
      if (stylesheet.href.includes('unused') || 
          stylesheet.href.includes('non-critical')) {
        stylesheet.media = 'print';
        stylesheet.onload = function() {
          this.media = 'all';
        };
      }
    });
  }

  /**
   * Implement lazy loading for content
   */
  implementLazyLoading() {
    // Lazy load iframe embeds
    const iframes = document.querySelectorAll('iframe:not([loading])');
    iframes.forEach(iframe => {
      iframe.loading = 'lazy';
    });
    
    // Lazy load background images
    const elementsWithBgImages = document.querySelectorAll('[data-bg-image]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          element.style.backgroundImage = `url(${element.dataset.bgImage})`;
          observer.unobserve(element);
        }
      });
    });
    
    elementsWithBgImages.forEach(element => {
      imageObserver.observe(element);
    });
  }

  /**
   * Break up long tasks to improve FID
   */
  breakUpLongTasks() {
    // Use scheduler.postTask if available, otherwise setTimeout
    window.scheduleWork = window.scheduler?.postTask || 
      ((callback) => setTimeout(callback, 0));
  }

  /**
   * Optimize third-party scripts
   */
  optimizeThirdPartyScripts() {
    const thirdPartyScripts = document.querySelectorAll('script[src*="//"]');
    
    thirdPartyScripts.forEach(script => {
      if (!script.async && !script.defer) {
        script.defer = true;
      }
    });
  }

  /**
   * Set size attributes for media to prevent CLS
   */
  setSizeAttributesForMedia() {
    const mediaElements = document.querySelectorAll('img, video, embed, iframe');
    
    mediaElements.forEach(element => {
      if (!element.width || !element.height) {
        const rect = element.getBoundingClientRect();
        if (rect.width && rect.height) {
          element.width = rect.width;
          element.height = rect.height;
        }
      }
    });
  }

  /**
   * Reserve space for dynamic content
   */
  reserveSpaceForDynamicContent() {
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
    
    dynamicContainers.forEach(container => {
      const minHeight = container.dataset.minHeight || '200px';
      if (!container.style.minHeight) {
        container.style.minHeight = minHeight;
      }
    });
  }

  /**
   * Avoid inserting content above existing content
   */
  avoidContentInsertion() {
    // Override common DOM insertion methods to use append instead of prepend
    const originalPrepend = Element.prototype.prepend;
    Element.prototype.prepend = function(...nodes) {
      console.warn('[CLS Warning] Using prepend may cause layout shift. Consider using append.');
      return originalPrepend.apply(this, nodes);
    };
  }

  /**
   * Optimize event handlers for better INP
   */
  optimizeEventHandlers() {
    // Use passive listeners where possible
    const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'scroll'];
    
    passiveEvents.forEach(eventType => {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (passiveEvents.includes(type) && typeof options === 'object') {
          options.passive = true;
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
  }

  /**
   * Implement input response optimization
   */
  implementInputResponseOptimization() {
    // Debounce input handlers
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
    
    // Apply to common input elements
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const originalHandler = input.oninput;
      if (originalHandler) {
        input.oninput = debounce(originalHandler, 100);
      }
    });
  }

  /**
   * Send metrics to analytics
   */
  sendToAnalytics(name, metric) {
    // Google Analytics 4 implementation
    if (typeof gtag !== 'undefined') {
      gtag('event', name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
    
    // Custom analytics endpoint
    if (window.safonautics && window.safonautics.analytics) {
      window.safonautics.analytics.track('core_web_vital', {
        metric: name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        url: window.location.href
      });
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary() {
    return {
      ...this.metrics,
      overall_score: this.calculateOverallScore(),
      timestamp: Date.now()
    };
  }

  /**
   * Calculate overall performance score
   */
  calculateOverallScore() {
    const scores = Object.entries(this.metrics).map(([name, value]) => {
      if (value === null) return null;
      const threshold = this.thresholds[name];
      return Math.min(100, Math.max(0, 100 - (value / threshold) * 100));
    }).filter(score => score !== null);
    
    return scores.length > 0 ? 
      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }
}

// Initialize Core Web Vitals optimization
document.addEventListener('DOMContentLoaded', () => {
  window.coreWebVitalsOptimizer = new CoreWebVitalsOptimizer();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreWebVitalsOptimizer;
}