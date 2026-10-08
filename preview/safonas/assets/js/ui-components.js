// UI Components Module
// Contains navigation, carousel, FAQ, and interactive UI elements

class UIComponents {
  constructor() {
    this.currentCarouselIndex = 0;
    this.init();
  }

  init() {
    this.initNavigation();
    this.initTestimonialCarousel();
    this.initFAQAccordion();
    this.initButtonHandlers();
  }

  // Navigation functionality
  initNavigation() {
    // Check if we are on a blog page
    if (window.location.pathname.includes('blog-')) {
      this.initBlogNavigation();
    } else {
      this.initMainNavigation();
    }
  }

  initBlogNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[href^="index.html#"]');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = this.getAttribute('href');
      });
    });

    const logo = document.getElementById("logo");
    if (logo) {
      logo.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
      });
    }
  }

  initMainNavigation() {
    // Modern mobile menu toggle with slide-out animation
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
    const mobileMenuClose = document.getElementById("mobile-menu-close");

    const openMobileMenu = () => {
      if (mobileMenu && mobileMenuOverlay) {
        mobileMenu.classList.add("active");
        mobileMenuOverlay.classList.add("active");
        mobileMenuBtn.setAttribute("aria-expanded", "true");
        mobileMenu.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }
    };

    const closeMobileMenu = () => {
      if (mobileMenu && mobileMenuOverlay) {
        mobileMenu.classList.remove("active");
        mobileMenuOverlay.classList.remove("active");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    };

    // Event listeners
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", openMobileMenu);
    }

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener("click", closeMobileMenu);
    }

    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener("click", closeMobileMenu);
    }

    // Close menu when escape key is pressed
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu && mobileMenu.classList.contains("active")) {
        closeMobileMenu();
      }
    });

    // Enhanced Navbar Links Smooth Scrolling
    const navLinks = document.querySelectorAll('.nav-link[href^="#"], .mobile-nav-link[href^="#"]');

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          targetSection.scrollIntoView({ behavior: "smooth" });
          closeMobileMenu();
        }
      });
    });

    // Handle mobile nav links that link to other pages
    const mobileExternalLinks = document.querySelectorAll('.mobile-nav-link:not([href^="#"])');
    mobileExternalLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeMobileMenu();
      });
    });

    // Logo Click Functionality
    const logo = document.getElementById("logo");
    if (logo) {
      logo.addEventListener("click", (e) => {
        const logoLink = logo.querySelector('a[href="index.html"]');
        if (logoLink && window.location.pathname.includes('services.html')) {
          return; // Let the link work normally
        } else {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });

          if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
            mobileMenu.classList.add("hidden");
          }
        }
      });
    }

    // Store closeMobileMenu for external access
    this.closeMobileMenu = closeMobileMenu;
  }

  // Testimonial Carousel
  initTestimonialCarousel() {
    const track = document.getElementById("testimonialTrack");
    const items = track ? Array.from(track.children) : [];
    const dots = document.querySelectorAll(".carousel-dot");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!track || items.length === 0) return;

    const updateCarousel = () => {
      track.style.transform = `translateX(${-this.currentCarouselIndex * 100}%)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === this.currentCarouselIndex);
      });
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        this.currentCarouselIndex = index;
        updateCarousel();
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        this.currentCarouselIndex = (this.currentCarouselIndex - 1 + items.length) % items.length;
        updateCarousel();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        this.currentCarouselIndex = (this.currentCarouselIndex + 1) % items.length;
        updateCarousel();
      });
    }
  }

  // FAQ Accordion
  initFAQAccordion() {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const icon = item.querySelector("i");

      if (question && answer && icon) {
        question.addEventListener("click", () => {
          answer.classList.toggle("hidden");
          icon.classList.toggle("rotate-180");
        });
      }
    });
  }

  // Button handlers for hero and CTA sections
  initButtonHandlers() {
    // Ready to Start Section Buttons
    const startNowBtn = document.getElementById("startNowBtn");
    const scheduleDemoBtn = document.getElementById("scheduleDemoBtn");

    // Hero Section Buttons
    const heroStartBtn = document.getElementById("heroStartBtn");
    const heroDemoBtn = document.getElementById("heroDemoBtn");

    const scrollToContact = () => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    };

    const scrollToContactWithDemo = () => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
        // Pre-fill subject for demo
        setTimeout(() => {
          const subjectField = document.getElementById("subject");
          if (subjectField) {
            subjectField.value = "Demande de démonstration";
          }
        }, 500);
      }
    };

    if (startNowBtn) {
      startNowBtn.addEventListener("click", scrollToContact);
    }

    if (scheduleDemoBtn) {
      scheduleDemoBtn.addEventListener("click", scrollToContactWithDemo);
    }

    if (heroStartBtn) {
      heroStartBtn.addEventListener("click", scrollToContact);
    }

    if (heroDemoBtn) {
      heroDemoBtn.addEventListener("click", scrollToContactWithDemo);
    }
  }

  // Utility function to show notifications
  showNotification(message, type = 'info') {
    // Use enhanced client validation notification system if available
    if (window.clientValidation && typeof window.clientValidation.showSecurityNotification === 'function') {
      window.clientValidation.showSecurityNotification(message, type);
      return;
    }
    
    // Fallback to legacy notification system
    const notification = document.createElement("div");
    let sanitizedType, sanitizedMessage;
    
    if (window.SecurityUtils) {
      sanitizedType = window.SecurityUtils.sanitizeText(type);
      sanitizedMessage = window.SecurityUtils.sanitizeText(message);
    } else {
      sanitizedType = type;
      sanitizedMessage = message;
    }
    
    notification.className = `notification ${sanitizedType}`;
    notification.textContent = sanitizedMessage;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 100);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

// Export for global use
window.UIComponents = UIComponents;