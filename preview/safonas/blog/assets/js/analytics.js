// Analytics Module for Blog
// Privacy-compliant analytics with performance tracking and user behavior insights

class BlogAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.pageStartTime = Date.now();
        this.interactions = [];
        this.performanceMetrics = {};
        this.scrollDepth = 0;
        this.maxScrollDepth = 0;
        this.readingTime = 0;
        this.articleProgress = 0;
        
        // Privacy settings
        this.cookieConsent = this.checkCookieConsent();
        this.trackingEnabled = this.cookieConsent !== false;
        
        this.init();
    }
    
    init() {
        if (!this.trackingEnabled) {
            console.log('Analytics: Tracking disabled due to privacy settings');
            return;
        }
        
        this.setupEventListeners();
        this.trackPageLoad();
        this.measureCoreWebVitals();
        this.setupScrollTracking();
        this.setupReadingTimeTracking();
        this.setupInteractionTracking();
        
        // Send analytics data periodically
        this.startAnalyticsReporting();
    }
    
    generateSessionId() {
        // Generate a privacy-friendly session ID (no personal info)
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    checkCookieConsent() {
        try {
            const consent = localStorage.getItem('cookie-consent');
            return consent === 'accepted';
        } catch (error) {
            // If localStorage is not available, assume no consent
            return false;
        }
    }
    
    setupEventListeners() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Track beforeunload
        window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
        
        // Track search interactions
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', this.trackSearch.bind(this));
        }
        
        // Track category clicks
        document.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', this.trackCategoryClick.bind(this));
        });
        
        // Track article clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.article-card__read-more, .article-card__title a')) {
                this.trackArticleClick(e);
            }
        });
        
        // Track newsletter signup
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', this.trackNewsletterSignup.bind(this));
        }
        
        // Track social shares (if implemented)
        document.querySelectorAll('.share-button').forEach(button => {
            button.addEventListener('click', this.trackSocialShare.bind(this));
        });
    }
    
    trackPageLoad() {
        const pageData = {
            event: 'page_view',
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer || null,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            connectionType: this.getConnectionType(),
            deviceType: this.getDeviceType()
        };
        
        this.sendAnalytics(pageData);
        
        // Track page performance
        if ('performance' in window && 'timing' in performance) {
            window.addEventListener('load', () => {
                this.trackPagePerformance();
            });
        }
    }
    
    trackPagePerformance() {
        const timing = performance.timing;
        const navigation = performance.navigation;
        
        const performanceData = {
            event: 'page_performance',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            metrics: {
                // Navigation timing
                domainLookupTime: timing.domainLookupEnd - timing.domainLookupStart,
                tcpConnectTime: timing.connectEnd - timing.connectStart,
                responseTime: timing.responseEnd - timing.requestStart,
                domLoadTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                windowLoadTime: timing.loadEventEnd - timing.navigationStart,
                
                // Navigation type
                navigationType: navigation.type,
                redirectCount: navigation.redirectCount,
                
                // Additional metrics
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
                largestContentfulPaint: this.getLargestContentfulPaint()
            }
        };
        
        this.performanceMetrics = performanceData.metrics;
        this.sendAnalytics(performanceData);
    }
    
    measureCoreWebVitals() {
        // Measure Core Web Vitals
        this.measureCLS();
        this.measureFID();
        this.measureLCP();
    }
    
    measureCLS() {
        // Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                let clsValue = 0;
                
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                
                if (clsValue > 0) {
                    this.sendAnalytics({
                        event: 'core_web_vital',
                        metric: 'CLS',
                        value: clsValue,
                        sessionId: this.sessionId,
                        timestamp: Date.now()
                    });
                }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }
    
    measureFID() {
        // First Input Delay
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.sendAnalytics({
                        event: 'core_web_vital',
                        metric: 'FID',
                        value: entry.processingStart - entry.startTime,
                        sessionId: this.sessionId,
                        timestamp: Date.now()
                    });
                }
            });
            
            observer.observe({ entryTypes: ['first-input'] });
        }
    }
    
    measureLCP() {
        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                this.sendAnalytics({
                    event: 'core_web_vital',
                    metric: 'LCP',
                    value: lastEntry.startTime,
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                });
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }
    
    setupScrollTracking() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateScrollDepth();
            }, 100);
        });
    }
    
    updateScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        this.scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
        this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);
        
        // Track scroll milestones
        const milestones = [25, 50, 75, 100];
        milestones.forEach(milestone => {
            if (this.scrollDepth >= milestone && !this.scrollMilestones?.[milestone]) {
                if (!this.scrollMilestones) this.scrollMilestones = {};
                this.scrollMilestones[milestone] = true;
                
                this.sendAnalytics({
                    event: 'scroll_depth',
                    depth: milestone,
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                });
            }
        });
    }
    
    setupReadingTimeTracking() {
        let readingStartTime = Date.now();
        let isReading = true;
        
        // Pause reading time when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (isReading) {
                    this.readingTime += Date.now() - readingStartTime;
                    isReading = false;
                }
            } else {
                readingStartTime = Date.now();
                isReading = true;
            }
        });
        
        // Update reading time periodically
        setInterval(() => {
            if (isReading && !document.hidden) {
                this.readingTime += Date.now() - readingStartTime;
                readingStartTime = Date.now();
            }
        }, 5000);
    }
    
    setupInteractionTracking() {
        // Track clicks on various elements
        document.addEventListener('click', (e) => {
            const interaction = {
                type: 'click',
                element: e.target.tagName.toLowerCase(),
                className: e.target.className,
                id: e.target.id,
                timestamp: Date.now(),
                x: e.clientX,
                y: e.clientY
            };
            
            this.interactions.push(interaction);
            
            // Limit stored interactions to prevent memory issues
            if (this.interactions.length > 100) {
                this.interactions = this.interactions.slice(-50);
            }
        });
    }
    
    trackSearch(e) {
        const searchInput = document.getElementById('blog-search');
        const query = searchInput.value.trim();
        
        if (query) {
            this.sendAnalytics({
                event: 'search',
                query: query.substring(0, 100), // Limit query length for privacy
                queryLength: query.length,
                sessionId: this.sessionId,
                timestamp: Date.now()
            });
        }
    }
    
    trackCategoryClick(e) {
        const category = e.target.textContent.trim();
        
        this.sendAnalytics({
            event: 'category_click',
            category: category,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }
    
    trackArticleClick(e) {
        const articleCard = e.target.closest('.article-card');
        if (!articleCard) return;
        
        const title = articleCard.querySelector('.article-card__title a')?.textContent?.trim();
        const href = e.target.href || e.target.closest('a')?.href;
        
        this.sendAnalytics({
            event: 'article_click',
            articleTitle: title?.substring(0, 100),
            articleUrl: href,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }
    
    trackNewsletterSignup(e) {
        this.sendAnalytics({
            event: 'newsletter_signup',
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }
    
    trackSocialShare(e) {
        const platform = e.target.dataset.platform || 'unknown';
        
        this.sendAnalytics({
            event: 'social_share',
            platform: platform,
            url: window.location.href,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Page became hidden - track time on page
            const timeOnPage = Date.now() - this.pageStartTime;
            
            this.sendAnalytics({
                event: 'page_visibility',
                state: 'hidden',
                timeOnPage: timeOnPage,
                maxScrollDepth: this.maxScrollDepth,
                readingTime: this.readingTime,
                sessionId: this.sessionId,
                timestamp: Date.now()
            });
        } else {
            // Page became visible again
            this.pageStartTime = Date.now();
        }
    }
    
    handlePageUnload() {
        // Send final analytics before page unload
        const finalData = {
            event: 'page_unload',
            timeOnPage: Date.now() - this.pageStartTime,
            totalReadingTime: this.readingTime,
            maxScrollDepth: this.maxScrollDepth,
            interactionCount: this.interactions.length,
            sessionId: this.sessionId,
            timestamp: Date.now()
        };
        
        // Use sendBeacon for reliable delivery
        if ('sendBeacon' in navigator) {
            const blob = new Blob([JSON.stringify(finalData)], { type: 'application/json' });
            navigator.sendBeacon('/blog/api/analytics', blob);
        } else {
            this.sendAnalytics(finalData);
        }
    }
    
    sendAnalytics(data) {
        if (!this.trackingEnabled) return;
        
        // Add common properties
        data.sessionId = this.sessionId;
        data.url = window.location.href;
        data.timestamp = data.timestamp || Date.now();
        
        // Send to analytics endpoint
        if ('sendBeacon' in navigator) {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            navigator.sendBeacon('/blog/api/analytics', blob);
        } else {
            fetch('/blog/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(error => {
                console.warn('Analytics send failed:', error);
                
                // Store in local storage for retry later
                this.queueAnalyticsData(data);
            });
        }
        
        // Also send to Google Analytics if configured
        if (window.gtag) {
            this.sendToGoogleAnalytics(data);
        }
    }
    
    queueAnalyticsData(data) {
        try {
            const queue = JSON.parse(localStorage.getItem('analytics-queue') || '[]');
            queue.push(data);
            
            // Limit queue size
            if (queue.length > 50) {
                queue.splice(0, 10); // Remove oldest 10 items
            }
            
            localStorage.setItem('analytics-queue', JSON.stringify(queue));
        } catch (error) {
            console.warn('Failed to queue analytics data:', error);
        }
    }
    
    startAnalyticsReporting() {
        // Send queued analytics data when online
        this.sendQueuedAnalytics();
        
        // Set up periodic reporting
        setInterval(() => {
            this.sendPeriodicReport();
        }, 30000); // Every 30 seconds
        
        // Retry queued data periodically
        setInterval(() => {
            this.sendQueuedAnalytics();
        }, 60000); // Every minute
    }
    
    async sendQueuedAnalytics() {
        try {
            const queue = JSON.parse(localStorage.getItem('analytics-queue') || '[]');
            
            if (queue.length === 0) return;
            
            // Send queued data
            for (const data of queue) {
                await fetch('/blog/api/analytics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
            }
            
            // Clear queue after successful send
            localStorage.removeItem('analytics-queue');
            console.log('Sent queued analytics data:', queue.length, 'items');
            
        } catch (error) {
            console.warn('Failed to send queued analytics:', error);
        }
    }
    
    sendPeriodicReport() {
        if (document.hidden) return; // Don't send when page is not visible
        
        const reportData = {
            event: 'periodic_report',
            currentScrollDepth: this.scrollDepth,
            maxScrollDepth: this.maxScrollDepth,
            currentReadingTime: this.readingTime,
            recentInteractions: this.interactions.slice(-10), // Last 10 interactions
            performanceMetrics: this.performanceMetrics,
            sessionId: this.sessionId,
            timestamp: Date.now()
        };
        
        this.sendAnalytics(reportData);
    }
    
    sendToGoogleAnalytics(data) {
        // Convert our analytics events to Google Analytics format
        switch (data.event) {
            case 'page_view':
                gtag('config', 'G-32YPLYV9T5', {
                    page_title: data.title,
                    page_location: data.page
                });
                break;
                
            case 'search':
                gtag('event', 'search', {
                    search_term: data.query
                });
                break;
                
            case 'article_click':
                gtag('event', 'click', {
                    event_category: 'article',
                    event_label: data.articleTitle
                });
                break;
                
            case 'newsletter_signup':
                gtag('event', 'sign_up', {
                    method: 'newsletter'
                });
                break;
                
            case 'social_share':
                gtag('event', 'share', {
                    method: data.platform,
                    content_type: 'article',
                    content_id: window.location.pathname
                });
                break;
        }
    }
    
    // Utility methods
    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }
    
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    getFirstPaint() {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : null;
        }
        return null;
    }
    
    getFirstContentfulPaint() {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            return fcp ? fcp.startTime : null;
        }
        return null;
    }
    
    getLargestContentfulPaint() {
        if ('PerformanceObserver' in window) {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry.startTime);
                    observer.disconnect();
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, 10000);
            });
        }
        return null;
    }
    
    // Public methods for manual tracking
    trackCustomEvent(eventName, properties = {}) {
        this.sendAnalytics({
            event: 'custom_event',
            customEventName: eventName,
            properties: properties,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }
    
    trackError(error, context = {}) {
        this.sendAnalytics({
            event: 'javascript_error',
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }
    
    // Privacy methods
    enableTracking() {
        this.trackingEnabled = true;
        try {
            localStorage.setItem('cookie-consent', 'accepted');
        } catch (error) {
            console.warn('Failed to save cookie consent:', error);
        }
    }
    
    disableTracking() {
        this.trackingEnabled = false;
        try {
            localStorage.setItem('cookie-consent', 'rejected');
            localStorage.removeItem('analytics-queue');
        } catch (error) {
            console.warn('Failed to save cookie consent:', error);
        }
    }
    
    getPrivacyStatus() {
        return {
            trackingEnabled: this.trackingEnabled,
            cookieConsent: this.cookieConsent,
            sessionId: this.sessionId
        };
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    if (window.blogAnalytics) {
        window.blogAnalytics.trackError(event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    if (window.blogAnalytics) {
        window.blogAnalytics.trackError(new Error(event.reason), {
            type: 'unhandled_promise_rejection'
        });
    }
});

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogAnalytics = new BlogAnalytics();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogAnalytics;
}