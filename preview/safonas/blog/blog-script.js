// Blog Specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize AOS (Animate On Scroll)
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50
  });

  // Scroll Progress Bar
  function updateScrollProgress() {
    const scrollProgress = document.querySelector('.scroll-progress');
    if (scrollProgress) {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / documentHeight) * 100;
      scrollProgress.style.transform = `scaleX(${scrollPercent / 100})`;
    }
  }

  // Reading Time Calculation
  function calculateReadingTime() {
    const article = document.querySelector('.blog-article-content');
    const readingTimeElement = document.getElementById('reading-time');
    
    if (article && readingTimeElement) {
      const text = article.textContent || article.innerText;
      const wordsPerMinute = 200;
      const wordCount = text.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / wordsPerMinute);
      readingTimeElement.textContent = readingTime;
    }
  }

  // Smooth Scrolling for TOC Links
  function initSmoothScrolling() {
    const tocLinks = document.querySelectorAll('.toc-list a');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerOffset = 100;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Social Share Functionality
  function initShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    const currentUrl = window.location.href;
    const pageTitle = document.title;
    
    shareButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const platform = this.getAttribute('data-platform');
        
        let shareUrl = '';
        
        switch(platform) {
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(pageTitle)}`;
            break;
          case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
            break;
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
            break;
        }
        
        if (shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
        }
      });
    });

    // Copy Link Functionality
    const copyLinkButton = document.querySelector('.copy-link');
    if (copyLinkButton) {
      copyLinkButton.addEventListener('click', function() {
        navigator.clipboard.writeText(currentUrl).then(() => {
          // Visual feedback
          const originalIcon = this.innerHTML;
          this.innerHTML = '<i class="fas fa-check"></i>';
          this.style.background = 'var(--electric-mint)';
          this.style.color = 'var(--deep-navy)';
          
          setTimeout(() => {
            this.innerHTML = originalIcon;
            this.style.background = '';
            this.style.color = '';
          }, 2000);
        });
      });
    }
  }

  // Newsletter Form Handling
  function initNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value;
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Inscription...';
        submitButton.disabled = true;
        
        // Simulate API call (replace with actual newsletter API)
        setTimeout(() => {
          // Success feedback
          submitButton.innerHTML = '<i class="fas fa-check mr-2"></i>Inscrit !';
          submitButton.style.background = '#10B981';
          
          // Reset form
          this.reset();
          
          // Reset button after delay
          setTimeout(() => {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            submitButton.style.background = '';
          }, 3000);
        }, 2000);
      });
    }
  }

  // Header Scroll Effect
  function initHeaderScrollEffect() {
    const header = document.getElementById('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      // Hide/show header on scroll
      if (scrollTop > lastScrollTop && scrollTop > 200) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      
      lastScrollTop = scrollTop;
    });
  }

  // Table of Contents Highlighting
  function initTOCHighlighting() {
    const tocLinks = document.querySelectorAll('.toc-list a');
    const sections = document.querySelectorAll('section[id]');
    
    if (tocLinks.length === 0 || sections.length === 0) return;
    
    function highlightTOC() {
      let current = '';
      const scrollY = window.pageYOffset;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;
        
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });
      
      tocLinks.forEach(link => {
        link.classList.remove('text-electric-mint', 'font-semibold');
        link.classList.add('text-graphite-light');
        
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.remove('text-graphite-light');
          link.classList.add('text-electric-mint', 'font-semibold');
        }
      });
    }
    
    window.addEventListener('scroll', highlightTOC);
    highlightTOC(); // Run once on load
  }

  // Mobile Menu Enhancement for Blog
  function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        this.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('hidden');
        
        // Animate hamburger icon
        const icon = this.querySelector('i');
        if (!isExpanded) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
      
      // Close mobile menu when clicking outside
      document.addEventListener('click', function(e) {
        if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
          mobileMenu.classList.add('hidden');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
          const icon = mobileMenuBtn.querySelector('i');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
    }
  }

  // Lazy Loading Images (if any are added later)
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Initialize all functions
  calculateReadingTime();
  initSmoothScrolling();
  initShareButtons();
  initNewsletterForm();
  initHeaderScrollEffect();
  initTOCHighlighting();
  initMobileMenu();
  initLazyLoading();
  
  // Event listeners
  window.addEventListener('scroll', updateScrollProgress);
  window.addEventListener('resize', calculateReadingTime);
  
  // Performance optimization: debounce scroll events
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick);
  
  // Initial call
  updateScrollProgress();
  
  console.log('Blog functionality initialized successfully!');
});