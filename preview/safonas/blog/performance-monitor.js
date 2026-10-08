/**
 * Mobile Performance Monitor
 * Real-time performance tracking and optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      FCP: 0,  // First Contentful Paint
      LCP: 0,  // Largest Contentful Paint
      FID: 0,  // First Input Delay
      CLS: 0,  // Cumulative Layout Shift
      TTI: 0,  // Time to Interactive
      TBT: 0   // Total Blocking Time
    };
    
    this.observers = new Map();
    this.startTime = performance.now();
    
    // Initialize monitoring
    this.init();
  }
  
  init() {
    // Check browser support
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }
    
    // Monitor paint timing
    this.observePaintTiming();
    
    // Monitor layout shifts
    this.observeLayoutShifts();
    
    // Monitor largest contentful paint
    this.observeLCP();
    
    // Monitor first input delay
    this.observeFID();
    
    // Monitor long tasks
    this.observeLongTasks();
    
    // Resource timing
    this.observeResources();
    
    // Memory usage (if available)
    this.monitorMemory();
    
    // Network information
    this.monitorNetwork();
    
    // Device capabilities
    this.checkDeviceCapabilities();
  }
  
  observePaintTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = Math.round(entry.startTime);
            this.logMetric('FCP', this.metrics.FCP);
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', observer);
    } catch (e) {
      console.error('Paint timing observation failed:', e);
    }
  }
  
  observeLayoutShifts() {
    let clsValue = 0;
    let clsEntries = [];
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push({
              value: entry.value,
              sources: entry.sources
            });
          }
        }
        
        this.metrics.CLS = Math.round(clsValue * 1000) / 1000;
        this.logMetric('CLS', this.metrics.CLS);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', observer);
    } catch (e) {
      console.error('Layout shift observation failed:', e);
    }
  }
  
  observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.LCP = Math.round(lastEntry.startTime);
        this.logMetric('LCP', this.metrics.LCP);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (e) {
      console.error('LCP observation failed:', e);
    }
  }
  
  observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            this.metrics.FID = Math.round(entry.processingStart - entry.startTime);
            this.logMetric('FID', this.metrics.FID);
            observer.disconnect();
          }
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('first-input', observer);
    } catch (e) {
      console.error('FID observation failed:', e);
    }
  }
  
  observeLongTasks() {
    let totalBlockingTime = 0;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            totalBlockingTime += entry.duration - 50;
          }
        }
        
        this.metrics.TBT = Math.round(totalBlockingTime);
        this.logMetric('TBT', this.metrics.TBT);
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (e) {
      console.error('Long task observation failed:', e);
    }
  }
  
  observeResources() {
    try {
      const observer = new PerformanceObserver((list) => {
        const resources = list.getEntries();
        
        // Group resources by type
        const resourceStats = {
          css: [],
          js: [],
          img: [],
          font: [],
          total: 0
        };
        
        resources.forEach(resource => {
          const duration = Math.round(resource.duration);
          const size = resource.transferSize || 0;
          
          if (resource.name.includes('.css')) {
            resourceStats.css.push({ duration, size });
          } else if (resource.name.includes('.js')) {
            resourceStats.js.push({ duration, size });
          } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
            resourceStats.img.push({ duration, size });
          } else if (resource.name.match(/\.(woff|woff2|ttf|otf)/i)) {
            resourceStats.font.push({ duration, size });
          }
          
          resourceStats.total += duration;
        });
        
        this.logResourceStats(resourceStats);
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (e) {
      console.error('Resource observation failed:', e);
    }
  }
  
  monitorMemory() {
    if (performance.memory) {
      setInterval(() => {
        const memoryInfo = {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
        
        this.logMemory(memoryInfo);
      }, 5000);
    }
  }
  
  monitorNetwork() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
      
      this.logNetwork(networkInfo);
      
      // Listen for network changes
      connection.addEventListener('change', () => {
        this.logNetwork({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }
  
  checkDeviceCapabilities() {
    const capabilities = {
      cores: navigator.hardwareConcurrency || 1,
      memory: navigator.deviceMemory || 'unknown',
      connection: navigator.connection?.effectiveType || 'unknown',
      gpu: this.detectGPU(),
      touchDevice: 'ontouchstart' in window,
      screenSize: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio || 1
    };
    
    this.optimizeForDevice(capabilities);
  }
  
  detectGPU() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
    
    return 'unknown';
  }
  
  optimizeForDevice(capabilities) {
    const isLowEnd = 
      capabilities.memory <= 4 ||
      capabilities.cores <= 2 ||
      capabilities.connection === '2g' ||
      capabilities.connection === 'slow-2g';
    
    if (isLowEnd) {
      this.applyLowEndOptimizations();
    } else {
      this.applyHighEndEnhancements();
    }
  }
  
  applyLowEndOptimizations() {
    // Reduce animation complexity
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    
    // Disable backdrop filters
    document.querySelectorAll('[class*="backdrop"]').forEach(el => {
      el.style.backdropFilter = 'none';
    });
    
    // Simplify shadows
    document.documentElement.style.setProperty('--shadow-complexity', 'simple');
    
    // Lazy load images more aggressively
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
    
    console.log('Applied low-end device optimizations');
  }
  
  applyHighEndEnhancements() {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Preload next page resources
    this.prefetchResources();
    
    console.log('Applied high-end device enhancements');
  }
  
  prefetchResources() {
    // Prefetch likely next navigation
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      if (link.href.includes('/blog/') && !link.href.includes('#')) {
        const prefetch = document.createElement('link');
        prefetch.rel = 'prefetch';
        prefetch.href = link.href;
        document.head.appendChild(prefetch);
      }
    });
  }
  
  logMetric(name, value) {
    const status = this.getMetricStatus(name, value);
    console.log(`%c${name}: ${value}ms [${status}]`, 
      `color: ${status === 'good' ? '#00ff94' : status === 'needs-improvement' ? '#ffa500' : '#ff4444'}`
    );
  }
  
  getMetricStatus(name, value) {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TBT: { good: 200, poor: 600 }
    };
    
    const threshold = thresholds[name];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }
  
  logResourceStats(stats) {
    console.group('Resource Performance');
    console.log(`CSS: ${stats.css.length} files, ${this.formatSize(stats.css)}`);
    console.log(`JS: ${stats.js.length} files, ${this.formatSize(stats.js)}`);
    console.log(`Images: ${stats.img.length} files, ${this.formatSize(stats.img)}`);
    console.log(`Fonts: ${stats.font.length} files, ${this.formatSize(stats.font)}`);
    console.log(`Total load time: ${stats.total}ms`);
    console.groupEnd();
  }
  
  formatSize(resources) {
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    return `${Math.round(totalSize / 1024)}KB`;
  }
  
  logMemory(info) {
    if (info.used / info.limit > 0.9) {
      console.warn(`High memory usage: ${info.used}MB / ${info.limit}MB`);
    }
  }
  
  logNetwork(info) {
    console.log('Network:', info);
  }
  
  generateReport() {
    const report = {
      metrics: this.metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      recommendations: this.getRecommendations()
    };
    
    return report;
  }
  
  getRecommendations() {
    const recommendations = [];
    
    if (this.metrics.FCP > 3000) {
      recommendations.push('Reduce server response time and optimize critical rendering path');
    }
    
    if (this.metrics.LCP > 4000) {
      recommendations.push('Optimize largest contentful paint element (images, text blocks)');
    }
    
    if (this.metrics.CLS > 0.25) {
      recommendations.push('Fix layout shifts by specifying dimensions for images and ads');
    }
    
    if (this.metrics.FID > 300) {
      recommendations.push('Reduce JavaScript execution time and break up long tasks');
    }
    
    if (this.metrics.TBT > 600) {
      recommendations.push('Minimize main thread blocking time');
    }
    
    return recommendations;
  }
  
  destroy() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Initialize performance monitoring
const perfMonitor = new PerformanceMonitor();

// Export for use in other scripts
window.PerformanceMonitor = PerformanceMonitor;

// Log final report on page unload
window.addEventListener('beforeunload', () => {
  const report = perfMonitor.generateReport();
  
  // Send to analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'performance_metrics', report);
  }
  
  // Store in localStorage for debugging
  localStorage.setItem('last_performance_report', JSON.stringify(report));
});