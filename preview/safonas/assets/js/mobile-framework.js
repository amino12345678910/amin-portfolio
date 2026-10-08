/**
 * Mobile-First JavaScript Framework for AI Tools Page
 * Safonas - Performance Optimized
 * Features: Touch gestures, smooth scrolling, lazy loading, dark mode
 */

(function() {
    'use strict';

    // ========================================
    // 1. UTILITY FUNCTIONS
    // ========================================
    
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    
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
    
    const throttle = (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };
    
    // ========================================
    // 2. MOBILE MENU HANDLER
    // ========================================
    
    class MobileMenu {
        constructor() {
            this.toggle = $('.mobile-menu-toggle');
            this.menu = $('.nav-menu');
            this.overlay = $('.mobile-menu-overlay');
            this.isOpen = false;
            
            this.init();
        }
        
        init() {
            if (!this.toggle || !this.menu) return;
            
            this.toggle.addEventListener('click', () => this.toggleMenu());
            this.overlay?.addEventListener('click', () => this.closeMenu());
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                }
            });
            
            // Close on menu item click
            this.menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 768) {
                        this.closeMenu();
                    }
                });
            });
        }
        
        toggleMenu() {
            this.isOpen ? this.closeMenu() : this.openMenu();
        }
        
        openMenu() {
            this.isOpen = true;
            this.menu.classList.add('active');
            this.overlay?.classList.add('active');
            this.toggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        
        closeMenu() {
            this.isOpen = false;
            this.menu.classList.remove('active');
            this.overlay?.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }
    
    // ========================================
    // 3. SMOOTH SCROLL HANDLER
    // ========================================
    
    class SmoothScroll {
        constructor() {
            this.init();
        }
        
        init() {
            // Handle anchor links
            $$('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const target = $(targetId);
                    if (target) {
                        e.preventDefault();
                        this.scrollToElement(target);
                    }
                });
            });
        }
        
        scrollToElement(element) {
            const headerHeight = $('.header')?.offsetHeight || 0;
            const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementTop - headerHeight - 20;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }
    
    // ========================================
    // 4. FILTER SYSTEM
    // ========================================
    
    class FilterSystem {
        constructor() {
            this.filters = $$('.filter-btn');
            this.cards = $$('.tool-card');
            this.activeFilter = 'all';
            
            this.init();
        }
        
        init() {
            if (this.filters.length === 0) return;
            
            this.filters.forEach(filter => {
                filter.addEventListener('click', () => {
                    const category = filter.dataset.category;
                    this.filterCards(category);
                    this.updateActiveFilter(filter);
                });
            });
        }
        
        filterCards(category) {
            this.activeFilter = category;
            
            this.cards.forEach(card => {
                const cardCategory = card.dataset.category;
                const shouldShow = category === 'all' || cardCategory === category;
                
                if (shouldShow) {
                    card.style.display = '';
                    card.style.animation = 'fadeInUp 0.4s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        updateActiveFilter(activeButton) {
            this.filters.forEach(filter => {
                filter.classList.remove('active');
            });
            activeButton.classList.add('active');
        }
    }
    
    // ========================================
    // 5. SAVE/BOOKMARK FUNCTIONALITY
    // ========================================
    
    class BookmarkManager {
        constructor() {
            this.storageKey = 'safonas-saved-tools';
            this.savedTools = this.getSavedTools();
            
            this.init();
        }
        
        init() {
            $$('.btn-save').forEach(btn => {
                const toolCard = btn.closest('.tool-card');
                const toolTitle = toolCard?.querySelector('.tool-title')?.textContent;
                
                if (toolTitle && this.savedTools.includes(toolTitle)) {
                    btn.classList.add('saved');
                }
                
                btn.addEventListener('click', () => {
                    this.toggleSave(btn, toolTitle);
                });
            });
        }
        
        toggleSave(btn, toolTitle) {
            if (!toolTitle) return;
            
            if (this.savedTools.includes(toolTitle)) {
                this.removeSave(toolTitle);
                btn.classList.remove('saved');
                this.showToast('Outil retiré des favoris');
            } else {
                this.addSave(toolTitle);
                btn.classList.add('saved');
                this.showToast('Outil ajouté aux favoris');
            }
        }
        
        addSave(toolTitle) {
            this.savedTools.push(toolTitle);
            this.updateStorage();
        }
        
        removeSave(toolTitle) {
            const index = this.savedTools.indexOf(toolTitle);
            if (index > -1) {
                this.savedTools.splice(index, 1);
                this.updateStorage();
            }
        }
        
        getSavedTools() {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        }
        
        updateStorage() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.savedTools));
        }
        
        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary);
                color: white;
                padding: 12px 24px;
                border-radius: var(--border-radius-full);
                z-index: 9999;
                animation: slideUp 0.3s ease;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    }
    
    // ========================================
    // 6. DARK MODE TOGGLE
    // ========================================
    
    class DarkMode {
        constructor() {
            this.storageKey = 'safonas-theme';
            this.currentTheme = this.getTheme();
            
            this.init();
        }
        
        init() {
            // Apply saved theme
            if (this.currentTheme) {
                document.documentElement.setAttribute('data-theme', this.currentTheme);
            }
            
            // Create toggle button
            this.createToggle();
        }
        
        createToggle() {
            const toggle = document.createElement('button');
            toggle.className = 'dark-mode-toggle';
            toggle.setAttribute('aria-label', 'Toggle dark mode');
            toggle.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
            toggle.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--primary);
                color: white;
                border: none;
                cursor: pointer;
                font-size: 24px;
                z-index: 1000;
                box-shadow: var(--shadow-lg);
                transition: all 0.3s ease;
            `;
            
            toggle.addEventListener('click', () => this.toggleTheme(toggle));
            document.body.appendChild(toggle);
        }
        
        toggleTheme(toggle) {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem(this.storageKey, newTheme);
            this.currentTheme = newTheme;
            
            toggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            
            // Add rotation animation
            toggle.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                toggle.style.transform = '';
            }, 300);
        }
        
        getTheme() {
            return localStorage.getItem(this.storageKey) || 
                   (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
    }
    
    // ========================================
    // 7. LAZY LOADING
    // ========================================
    
    class LazyLoader {
        constructor() {
            this.images = $$('img[data-src]');
            this.cards = $$('.tool-card');
            
            this.init();
        }
        
        init() {
            if ('IntersectionObserver' in window) {
                this.createObserver();
            } else {
                // Fallback for older browsers
                this.loadAllImages();
            }
        }
        
        createObserver() {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            this.images.forEach(img => imageObserver.observe(img));
            
            // Animate cards on scroll
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animation = 'fadeInUp 0.5s ease';
                        entry.target.style.opacity = '1';
                    }
                });
            }, {
                threshold: 0.1
            });
            
            this.cards.forEach(card => {
                card.style.opacity = '0';
                cardObserver.observe(card);
            });
        }
        
        loadAllImages() {
            this.images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }
    
    // ========================================
    // 8. LOAD MORE FUNCTIONALITY
    // ========================================
    
    class LoadMore {
        constructor() {
            this.button = $('.btn-load-more');
            this.cardsPerLoad = 6;
            this.currentlyShown = 6;
            
            this.init();
        }
        
        init() {
            if (!this.button) return;
            
            // Initially hide extra cards
            this.hideExtraCards();
            
            this.button.addEventListener('click', () => this.loadMoreCards());
        }
        
        hideExtraCards() {
            const cards = $$('.tool-card');
            cards.forEach((card, index) => {
                if (index >= this.currentlyShown) {
                    card.style.display = 'none';
                }
            });
        }
        
        loadMoreCards() {
            const cards = $$('.tool-card');
            const nextBatch = Math.min(this.currentlyShown + this.cardsPerLoad, cards.length);
            
            for (let i = this.currentlyShown; i < nextBatch; i++) {
                cards[i].style.display = '';
                cards[i].style.animation = 'fadeInUp 0.5s ease';
            }
            
            this.currentlyShown = nextBatch;
            
            // Hide button if all cards are shown
            if (this.currentlyShown >= cards.length) {
                this.button.style.display = 'none';
            }
        }
    }
    
    // ========================================
    // 9. SCROLL PROGRESS INDICATOR
    // ========================================
    
    class ScrollProgress {
        constructor() {
            this.createIndicator();
            this.init();
        }
        
        createIndicator() {
            this.indicator = document.createElement('div');
            this.indicator.className = 'scroll-indicator';
            document.body.appendChild(this.indicator);
        }
        
        init() {
            window.addEventListener('scroll', throttle(() => {
                this.updateProgress();
            }, 100));
        }
        
        updateProgress() {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.pageYOffset;
            const progress = scrolled / scrollHeight;
            
            this.indicator.style.transform = `scaleX(${progress})`;
        }
    }
    
    // ========================================
    // 10. TOUCH GESTURES
    // ========================================
    
    class TouchGestures {
        constructor() {
            this.touchStartX = 0;
            this.touchEndX = 0;
            this.touchStartY = 0;
            this.touchEndY = 0;
            
            this.init();
        }
        
        init() {
            // Swipe to open/close menu
            document.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
                this.touchStartY = e.changedTouches[0].screenY;
            });
            
            document.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.touchEndY = e.changedTouches[0].screenY;
                this.handleSwipe();
            });
        }
        
        handleSwipe() {
            const swipeThreshold = 50;
            const verticalThreshold = 100;
            
            const horizontalDiff = this.touchEndX - this.touchStartX;
            const verticalDiff = Math.abs(this.touchEndY - this.touchStartY);
            
            // Only handle horizontal swipes
            if (verticalDiff < verticalThreshold) {
                if (horizontalDiff > swipeThreshold) {
                    // Swipe right - open menu
                    if (this.touchStartX < 50) { // Started from left edge
                        const menu = new MobileMenu();
                        menu.openMenu();
                    }
                } else if (horizontalDiff < -swipeThreshold) {
                    // Swipe left - close menu
                    const menu = new MobileMenu();
                    if (menu.isOpen) {
                        menu.closeMenu();
                    }
                }
            }
        }
    }
    
    // ========================================
    // 11. PERFORMANCE MONITORING
    // ========================================
    
    class PerformanceMonitor {
        constructor() {
            this.init();
        }
        
        init() {
            // Log performance metrics
            if ('performance' in window && 'PerformanceObserver' in window) {
                // Monitor Largest Contentful Paint
                try {
                    const lcpObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
                    });
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                } catch (e) {
                    // Silently fail if not supported
                }
                
                // Monitor First Input Delay
                try {
                    const fidObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            console.log('FID:', entry.processingStart - entry.startTime);
                        }
                    });
                    fidObserver.observe({ entryTypes: ['first-input'] });
                } catch (e) {
                    // Silently fail if not supported
                }
            }
        }
    }
    
    // ========================================
    // 12. INITIALIZE EVERYTHING
    // ========================================
    
    class App {
        constructor() {
            this.init();
        }
        
        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initComponents());
            } else {
                this.initComponents();
            }
        }
        
        initComponents() {
            // Initialize all components
            new MobileMenu();
            new SmoothScroll();
            new FilterSystem();
            new BookmarkManager();
            new DarkMode();
            new LazyLoader();
            new LoadMore();
            new ScrollProgress();
            new TouchGestures();
            new PerformanceMonitor();
            
            // Add animations to existing styles
            this.addAnimations();
            
            // Handle viewport height on mobile
            this.handleViewportHeight();
            
            // Prevent zoom on double tap
            this.preventDoubleTapZoom();
        }
        
        addAnimations() {
            // Add animation styles if not already present
            if (!document.querySelector('#animation-styles')) {
                const style = document.createElement('style');
                style.id = 'animation-styles';
                style.textContent = `
                    @keyframes slideUp {
                        from {
                            transform: translate(-50%, 100%);
                            opacity: 0;
                        }
                        to {
                            transform: translate(-50%, 0);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes fadeOut {
                        from {
                            opacity: 1;
                        }
                        to {
                            opacity: 0;
                        }
                    }
                    
                    @keyframes rotate {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        handleViewportHeight() {
            // Fix viewport height on mobile browsers
            const setViewportHeight = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            
            setViewportHeight();
            window.addEventListener('resize', debounce(setViewportHeight, 100));
            window.addEventListener('orientationchange', setViewportHeight);
        }
        
        preventDoubleTapZoom() {
            // Prevent double-tap zoom on iOS
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }
    }
    
    // Start the application
    new App();
    
})();