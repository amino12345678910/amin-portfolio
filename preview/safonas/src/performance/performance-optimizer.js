/**
 * Performance Optimizer for Mobile-First Blog
 * Focuses on Core Web Vitals and optimal loading strategies
 */

class PerformanceOptimizer {
  constructor() {
    this.observers = new Map();
    this.resourceHints = new Set();
    this.criticalResources = new Set();
    this.performanceMarks = new Map();
    this.init();
  }

  init() {
    // Start performance monitoring immediately
    this.markNavigationTiming();
    
    // Initialize observers
    this.initIntersectionObserver();
    this.initResourceObserver();
    this.initPerformanceObserver();
    
    // Optimize resources
    this.optimizeCriticalPath();
    this.setupLazyLoading();
    this.optimizeFonts();
    this.prefetchResources();
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
  }

  // === CRITICAL PATH OPTIMIZATION ===
  
  optimizeCriticalPath() {
    // Identify critical CSS
    this.extractCriticalCSS();
    
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Defer non-critical scripts
    this.deferNonCriticalScripts();
  }

  extractCriticalCSS() {
    // Get viewport dimensions
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Identify above-the-fold elements
    const criticalSelectors = this.getAboveFoldSelectors(viewport);
    
    // Mark critical CSS for inlining
    this.criticalResources.add('critical-css');
    
    return criticalSelectors;
  }

  getAboveFoldSelectors(viewport) {
    const selectors = new Set();
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewport.height && rect.bottom > 0) {
        // Element is in viewport
        selectors.add(this.getSelector(element));
      }
    });
    
    return Array.from(selectors);
  }

  getSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c);
      if (classes.length) return `.${classes.join('.')}`;
    }
    return element.tagName.toLowerCase();
  }

  preloadCriticalResources() {
    const criticalResources = [
      { href: '/assets/css/critical.css', as: 'style' },
      { href: '/assets/fonts/main-font.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
    ];

    criticalResources.forEach(resource => {
      if (!document.querySelector(`link[href="${resource.href}"][rel="preload"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        Object.assign(link, resource);
        document.head.appendChild(link);
      }
    });
  }

  deferNonCriticalScripts() {
    const scripts = document.querySelectorAll('script:not([async]):not([defer]):not([type="application/ld+json"])');
    
    scripts.forEach(script => {
      if (!script.src.includes('critical') && !script.src.includes('gtag')) {
        script.defer = true;
      }
    });
  }

  // === LAZY LOADING ===
  
  setupLazyLoading() {
    // Images lazy loading
    this.lazyLoadImages();
    
    // Iframes lazy loading
    this.lazyLoadIframes();
    
    // JavaScript modules lazy loading
    this.setupModuleLazyLoading();
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading
      images.forEach(img => {
        if (!img.loading) img.loading = 'lazy';
        if (img.dataset.src && !img.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
      });
    } else {
      // Intersection Observer fallback
      this.observeImages(images);
    }
  }

  observeImages(images) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            delete img.dataset.srcset;
          }
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    images.forEach(img => imageObserver.observe(img));
    this.observers.set('images', imageObserver);
  }

  lazyLoadIframes() {
    const iframes = document.querySelectorAll('iframe[data-src]');
    
    const iframeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          if (iframe.dataset.src) {
            iframe.src = iframe.dataset.src;
            delete iframe.dataset.src;
          }
          iframeObserver.unobserve(iframe);
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0.01
    });

    iframes.forEach(iframe => iframeObserver.observe(iframe));
    this.observers.set('iframes', iframeObserver);
  }

  setupModuleLazyLoading() {
    // Dynamic import for non-critical modules
    const lazyModules = {
      'comments': () => import('./modules/comments.js'),
      'share': () => import('./modules/share.js'),
      'analytics': () => import('./modules/analytics.js')
    };

    // Load modules on demand
    Object.entries(lazyModules).forEach(([name, loader]) => {
      const trigger = document.querySelector(`[data-module="${name}"]`);
      if (trigger) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            loader().then(module => {
              if (module.default && typeof module.default.init === 'function') {
                module.default.init();
              }
            });
            observer.disconnect();
          }
        }, { rootMargin: '200px' });
        
        observer.observe(trigger);
      }
    });
  }

  // === FONT OPTIMIZATION ===
  
  optimizeFonts() {
    // Font display swap
    this.setFontDisplaySwap();
    
    // Preconnect to font providers
    this.preconnectFontProviders();
    
    // Subset fonts for critical text
    this.subsetFonts();
  }

  setFontDisplaySwap() {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  preconnectFontProviders() {
    const fontProviders = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    fontProviders.forEach(origin => {
      if (!document.querySelector(`link[href="${origin}"][rel="preconnect"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }

  subsetFonts() {
    // Create subset for critical characters
    const criticalChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!? ';
    
    // This would be implemented server-side typically
    // Marking for optimization
    this.performanceMarks.set('font-subset', criticalChars);
  }

  // === RESOURCE PREFETCHING ===
  
  prefetchResources() {
    // Prefetch next page resources
    this.prefetchNextPage();
    
    // DNS prefetch for external resources
    this.dnsPrefetch();
    
    // Prerender high-probability pages
    this.prerenderPages();
  }

  prefetchNextPage() {
    const nextLinks = document.querySelectorAll('a[rel="next"], .pagination a');
    
    nextLinks.forEach(link => {
      if (!this.resourceHints.has(link.href)) {
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = link.href;
        document.head.appendChild(prefetchLink);
        this.resourceHints.add(link.href);
      }
    });
  }

  dnsPrefetch() {
    const domains = [
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://www.googletagmanager.com'
    ];

    domains.forEach(domain => {
      if (!document.querySelector(`link[href="${domain}"][rel="dns-prefetch"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      }
    });
  }

  prerenderPages() {
    // Prerender high-probability navigation targets
    const highProbabilityLinks = document.querySelectorAll('.blog-card:first-child a, .featured-post a');
    
    highProbabilityLinks.forEach((link, index) => {
      if (index < 2) { // Limit prerendering to avoid resource waste
        const prerenderLink = document.createElement('link');
        prerenderLink.rel = 'prerender';
        prerenderLink.href = link.href;
        document.head.appendChild(prerenderLink);
      }
    });
  }

  // === INTERSECTION OBSERVER ===
  
  initIntersectionObserver() {
    // Observe elements for various optimizations
    this.observeVisibility();
  }

  observeVisibility() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Trigger animations only when visible
          if (entry.target.dataset.animate) {
            this.triggerAnimation(entry.target);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    const elements = document.querySelectorAll('[data-observe]');
    elements.forEach(el => observer.observe(el));
    
    this.observers.set('visibility', observer);
  }

  triggerAnimation(element) {
    element.classList.add('animate');
    // Remove data attribute to prevent re-animation
    delete element.dataset.animate;
  }

  // === RESOURCE OBSERVER ===
  
  initResourceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.analyzeResourceTiming(entry);
        }
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resources', resourceObserver);
      } catch (e) {
        console.warn('Resource timing not supported');
      }
    }
  }

  analyzeResourceTiming(entry) {
    const slowThreshold = 1000; // 1 second
    
    if (entry.duration > slowThreshold) {
      console.warn(`Slow resource detected: ${entry.name} (${Math.round(entry.duration)}ms)`);
      
      // Report to analytics
      if (window.gtag) {
        gtag('event', 'slow_resource', {
          resource_url: entry.name,
          duration: Math.round(entry.duration),
          type: entry.initiatorType
        });
      }
    }
  }

  // === PERFORMANCE OBSERVER ===
  
  initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Long task observer
      this.observeLongTasks();
      
      // Layout shift observer
      this.observeLayoutShifts();
    }
  }

  observeLongTasks() {
    if ('PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`Long task detected: ${entry.duration}ms`);
          
          // Report long tasks
          if (window.gtag) {
            gtag('event', 'long_task', {
              duration: Math.round(entry.duration),
              start_time: Math.round(entry.startTime)
            });
          }
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtasks', longTaskObserver);
      } catch (e) {
        console.warn('Long task timing not supported');
      }
    }
  }

  observeLayoutShifts() {
    if ('LayoutShift' in window) {
      let clsValue = 0;
      let clsEntries = [];

      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layoutshift', layoutShiftObserver);
        
        // Store CLS data
        this.performanceMarks.set('cls', { value: clsValue, entries: clsEntries });
      } catch (e) {
        console.warn('Layout shift timing not supported');
      }
    }
  }

  // === CORE WEB VITALS ===
  
  monitorCoreWebVitals() {
    // LCP (Largest Contentful Paint)
    this.observeLCP();
    
    // FID (First Input Delay)
    this.observeFID();
    
    // CLS (Cumulative Layout Shift)
    // Already handled in observeLayoutShifts
    
    // Report vitals
    this.reportWebVitals();
  }

  observeLCP() {
    if ('PerformanceObserver' in window) {
      let lcpValue = 0;
      
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.renderTime || lastEntry.loadTime;
        
        this.performanceMarks.set('lcp', lcpValue);
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP timing not supported');
      }
    }
  }

  observeFID() {
    // First Input Delay
    let fidValue = null;
    
    const fidHandler = (event) => {
      const entry = performance.getEntriesByType('first-input')[0];
      if (entry) {
        fidValue = entry.processingStart - entry.startTime;
        this.performanceMarks.set('fid', fidValue);
        
        // Remove listener after first input
        ['click', 'keydown', 'touchstart'].forEach(type => {
          document.removeEventListener(type, fidHandler, { passive: true, capture: true });
        });
      }
    };

    ['click', 'keydown', 'touchstart'].forEach(type => {
      document.addEventListener(type, fidHandler, { passive: true, capture: true });
    });
  }

  reportWebVitals() {
    // Wait for page load
    if (document.readyState === 'complete') {
      this.sendVitalsReport();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.sendVitalsReport(), 2000);
      });
    }
  }

  sendVitalsReport() {
    const vitals = {
      lcp: this.performanceMarks.get('lcp') || null,
      fid: this.performanceMarks.get('fid') || null,
      cls: this.performanceMarks.get('cls')?.value || null,
      ttfb: this.getTTFB(),
      fcp: this.getFCP()
    };

    console.log('Core Web Vitals:', vitals);

    // Send to analytics
    if (window.gtag) {
      Object.entries(vitals).forEach(([metric, value]) => {
        if (value !== null) {
          gtag('event', 'web_vitals', {
            metric_name: metric.toUpperCase(),
            metric_value: Math.round(value),
            metric_rating: this.getRating(metric, value)
          });
        }
      });
    }

    // Send to custom monitoring endpoint
    this.sendToMonitoring(vitals);
  }

  getTTFB() {
    const navTiming = performance.getEntriesByType('navigation')[0];
    return navTiming ? navTiming.responseStart - navTiming.fetchStart : null;
  }

  getFCP() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  getRating(metric, value) {
    const thresholds = {
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      ttfb: { good: 800, needsImprovement: 1800 },
      fcp: { good: 1800, needsImprovement: 3000 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  sendToMonitoring(vitals) {
    // Send to monitoring service
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        ...vitals,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });

      // Uncomment when monitoring endpoint is ready
      // navigator.sendBeacon('/api/vitals', data);
    }
  }

  // === NAVIGATION TIMING ===
  
  markNavigationTiming() {
    if (performance.timing) {
      const timing = performance.timing;
      const marks = {
        'dns-lookup': timing.domainLookupEnd - timing.domainLookupStart,
        'tcp-connection': timing.connectEnd - timing.connectStart,
        'request-response': timing.responseEnd - timing.requestStart,
        'dom-processing': timing.domComplete - timing.domLoading,
        'onload': timing.loadEventEnd - timing.loadEventStart
      };

      Object.entries(marks).forEach(([name, duration]) => {
        if (duration > 0) {
          performance.mark(`${name}-start`);
          performance.mark(`${name}-end`);
          performance.measure(name, `${name}-start`, `${name}-end`);
        }
      });
    }
  }

  // === CLEANUP ===
  
  destroy() {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear marks
    this.performanceMarks.clear();
    
    // Clear resource hints
    this.resourceHints.clear();
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
  });
} else {
  window.performanceOptimizer = new PerformanceOptimizer();
}

export default PerformanceOptimizer;