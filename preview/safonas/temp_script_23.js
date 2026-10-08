
    // Additional initialization after DOM content loaded
    document.addEventListener("DOMContentLoaded", function () {


      // Force cache refresh for mobile chatbot functionality

      // CORS-resistant chatbot functionality (inline fallback)
      // Basic chatbot UI elements (corrected selectors matching actual HTML)
      const heroChatInput = document.getElementById('heroChatInput');
      const heroChatInputMobile = document.getElementById('heroChatInputMobile');
      const heroSendMessage = document.getElementById('heroSendMessage');
      const heroSendMessageMobile = document.getElementById('heroSendMessageMobile');

      // Supabase manager removed - data storage handled by N8N webhook
      window.dataStorageManager = {
        init() {
          return true; // Always succeed - data handled by N8N
        },
        generateSessionId() {
          return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        },
        async saveChatInteraction(userMessage, botResponse, sessionId) {
          if (!this.client) return false;

          const data = {
            user_message: userMessage,
            chatbot_response: botResponse,
            session_id: sessionId,
            created_at: new Date().toISOString()
          };

          try {
            const { data: result, error } = await this.client
              .from('chatbot_interactions')
              .insert([data])
              .select();

            if (error) {
              return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        }
      };

      // Initialize Supabase manager
      window.dataStorageManager.init();

      // Get or create session ID
      window.getChatSessionIdInline = function () {
        let sessionId = localStorage.getItem('safonas_chatbot_session_id');
        if (!sessionId || sessionId.startsWith('session_')) {
          sessionId = window.dataStorageManager.generateSessionId();
          localStorage.setItem('safonas_chatbot_session_id', sessionId);
        }
        return sessionId;
      };

      // Enhanced chatbot functionality with platform-aware debugging and Supabase integration
      window.sendMessageInline = async function (input, isMobile = false) {
        if (!input) return;

        const message = input.value.trim();
        const platform = isMobile ? 'MOBILE' : 'DESKTOP';

        if (!message) {
          return;
        }


        try {
          // Add user message to chat UI
          window.addMessageToChatInline(message, "user", isMobile);
          input.value = "";

          // Add typing indicator
          const typingId = window.addTypingIndicatorInline(isMobile);

          // Direct N8N webhook call with CORS headers and error handling
          const webhookUrl = 'https://n8n.safonas.com/webhook/d0cdbca7-2772-4e64-9230-0f06e7a53c75/chat';
          const sessionId = window.getChatSessionIdInline();
          const isMobileDetected = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

          const requestData = {
            message: message,
            chatId: sessionId
          };


          const fetchOptions = {
            method: 'POST',
            mode: 'cors', // Explicitly enable CORS
            credentials: 'omit', // Don't send cookies
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Requested-With': 'XMLHttpRequest',
              'Origin': window.location.origin
            },
            body: JSON.stringify(requestData)
          };

          const startTime = Date.now();

          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          fetchOptions.signal = controller.signal;

          const response = await fetch(webhookUrl, fetchOptions);
          clearTimeout(timeoutId);
          const endTime = Date.now();


          // Remove typing indicator
          window.removeTypingIndicatorInline(typingId);

          if (response.ok) {
            const data = await response.json();

            const botMessage = data.output || data.reply || data.response || data.message || data.chatbot_response || "Désolé, je n'ai pas pu traiter votre demande.";

            // Add bot response
            window.addMessageToChatInline(botMessage, "bot", isMobile);

            // Data storage handled by N8N webhook in chat processing
            // No local database storage needed

          } else {

            try {
              const errorText = await response.text();
            } catch (e) {
              // Could not read error response
            }

            // REMOVE ALL "Connexion en cours" messages - use only specific errors
            if (response.status === 404) {
              window.addMessageToChatInline("🔧 Service temporairement indisponible. Réessayez dans un moment.", "bot", isMobile);
            } else if (response.status >= 500) {
              window.addMessageToChatInline("⚡ Erreur serveur. Veuillez réessayer.", "bot", isMobile);
            } else {
              window.addMessageToChatInline("❌ Erreur de connexion. Vérifiez votre réseau.", "bot", isMobile);
            }
          }

        } catch (error) {

          window.removeTypingIndicatorInline();
          console.error('Chatbot fetch error:', error);

          // More specific error messages
          let errorMessage = "🚫 Erreur de connexion. Veuillez réessayer.";

          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = "🔄 Service temporairement indisponible. Réessayez dans un instant.";
          } else if (error.name === 'AbortError') {
            errorMessage = "⏱️ Délai d'attente dépassé. Réessayez.";
          }

          window.addMessageToChatInline(errorMessage, "bot", isMobile);
        }
      }

      // Minimal chat UI functions (make globally accessible)
      window.addMessageToChatInline = function (message, sender, isMobile = false) {
        const chatContainer = isMobile ?
          document.getElementById('heroChatMessagesMobile') :
          document.getElementById('heroChatMessages');

        if (chatContainer) {
          const messageDiv = document.createElement('div');
          messageDiv.className = `message ${sender}-message`;
          messageDiv.innerHTML = `
              <div class="message-content">
                ${message}
              </div>
              <div class="message-time">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            `;
          chatContainer.appendChild(messageDiv);
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }

      let typingCounter = 0;
      window.addTypingIndicatorInline = function (isMobile = false) {
        const id = 'typing-' + (++typingCounter);
        const chatContainer = isMobile ?
          document.getElementById('heroChatMessagesMobile') :
          document.getElementById('heroChatMessages');

        if (chatContainer) {
          const typingDiv = document.createElement('div');
          typingDiv.id = id;
          typingDiv.className = 'message bot-message typing-message';
          typingDiv.innerHTML = `
              <div class="message-content">
                <div class="typing-indicator">
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                </div>
              </div>
            `;
          chatContainer.appendChild(typingDiv);
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        return id;
      }

      window.removeTypingIndicatorInline = function (id) {
        if (id) {
          const indicator = document.getElementById(id);
          if (indicator) indicator.remove();
        } else {
          // Remove all typing indicators
          document.querySelectorAll('.typing-indicator').forEach(el => el.remove());
        }
      }

      // Attach event listeners (fallback for when script.js fails to load)
      setTimeout(() => {
        // Always attach fallback listeners since external scripts fail to load due to CORS

        // Desktop chat
        if (heroChatInput) {
          heroChatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              window.sendMessageInline(this, false);
            }
          });
        }

        // Desktop send button
        if (heroSendMessage) {
          heroSendMessage.addEventListener('click', function () {
            window.sendMessageInline(heroChatInput, false);
          });
        }

        // Mobile chat
        if (heroChatInputMobile) {
          heroChatInputMobile.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              window.sendMessageInline(this, true);
            }
          });
        }

        // Mobile send button with proper touch events
        if (heroSendMessageMobile) {
          // Touch events for immediate response on mobile devices
          heroSendMessageMobile.addEventListener('touchstart', function (e) {
            e.preventDefault();
            window.sendMessageInline(heroChatInputMobile, true);
          }, { passive: false });

          // Keep click as fallback
          heroSendMessageMobile.addEventListener('click', function (e) {
            // Only fire if touchstart didn't already handle it
            if (!e.isTrusted || e.detail === 0) return;
            window.sendMessageInline(heroChatInputMobile, true);
          });
        }

        // Also add touch support for desktop button when on mobile
        if (heroSendMessage && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          heroSendMessage.addEventListener('touchstart', function (e) {
            e.preventDefault();
            window.sendMessageInline(heroChatInput, false);
          }, { passive: false });
        }

      }, 1000);

      // Add any additional custom initialization here

      // Mobile Menu Functionality - Execute immediately without waiting for DOMContentLoaded
      (function () {
        // Function to initialize mobile menu
        function initMobileMenu() {
          const mobileMenuBtn = document.getElementById('mobile-menu-btn');
          const mobileMenu = document.getElementById('mobile-menu');
          const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
          const mobileMenuClose = document.getElementById('mobile-menu-close');


          if (mobileMenuBtn && mobileMenu && mobileMenuOverlay && mobileMenuClose) {

            // Remove any existing event listeners to avoid duplicates
            mobileMenuBtn.onclick = null;

            // Open mobile menu
            mobileMenuBtn.onclick = function (e) {
              e.preventDefault();
              e.stopPropagation();

              mobileMenu.classList.add('active');
              mobileMenuOverlay.classList.add('active');
              mobileMenuBtn.setAttribute('aria-expanded', 'true');
              mobileMenu.setAttribute('aria-hidden', 'false');

              // Prevent body scroll when menu is open
              document.body.style.overflow = 'hidden';

              return false;
            };

            // Close mobile menu
            function closeMobileMenu() {
              mobileMenu.classList.remove('active');
              mobileMenuOverlay.classList.remove('active');
              mobileMenuBtn.setAttribute('aria-expanded', 'false');
              mobileMenu.setAttribute('aria-hidden', 'true');

              // Restore body scroll
              document.body.style.overflow = '';

            }

            mobileMenuClose.onclick = closeMobileMenu;
            mobileMenuOverlay.onclick = closeMobileMenu;

            // Close menu when clicking on menu links
            const mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
            mobileNavLinks.forEach(function (link) {
              link.onclick = closeMobileMenu;
            });

            // Close menu with Escape key
            document.addEventListener('keydown', function (e) {
              if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMobileMenu();
              }
            });

            return true;
          } else {
            console.error('Mobile menu elements missing:', {
              mobileMenuBtn: !!mobileMenuBtn,
              mobileMenu: !!mobileMenu,
              mobileMenuOverlay: !!mobileMenuOverlay,
              mobileMenuClose: !!mobileMenuClose
            });
            return false;
          }
        }

        // Try to initialize immediately
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initMobileMenu);
        } else {
          initMobileMenu();
        }

        // Also try with a small delay as fallback
        setTimeout(initMobileMenu, 100);
      })();

      // Add smooth hover effects for feature cards
      const featureCards = document.querySelectorAll(".feature-card");
      featureCards.forEach((card) => {
        card.addEventListener("mouseenter", function () {
          this.style.transform = "translateY(-8px) scale(1.02)";
        });

        card.addEventListener("mouseleave", function () {
          this.style.transform = "translateY(0) scale(1)";
        });
      });

      // Add glow effect to buttons on hover
      const buttons = document.querySelectorAll(
        ".btn-electric-mint, .border-electric-mint"
      );
      buttons.forEach((button) => {
        button.addEventListener("mouseenter", function () {
          this.style.boxShadow =
            "0 0 30px rgba(0, 255, 148, 0.4), 0 10px 20px rgba(0, 0, 0, 0.3)";
        });

        button.addEventListener("mouseleave", function () {
          this.style.boxShadow = "";
        });
      });
      document.querySelector('.hero-section').style.marginTop = document.querySelector('header').offsetHeight + 'px !important';

      // Testimonials Carousel Functionality
      initializeTestimonialsCarousel();

      // Initialize main action buttons
      initializeActionButtons();

      // Initialize FAQ functionality
      initializeFAQ();
    });

    // Testimonials Carousel Functions
    function initializeTestimonialsCarousel() {
      const track = document.getElementById("testimonialTrack");
      const prevBtn = document.getElementById("prevBtn");
      const nextBtn = document.getElementById("nextBtn");
      const dots = document.querySelectorAll(".carousel-dot");

      if (!track || !prevBtn || !nextBtn) return;

      let currentSlide = 0;
      const totalSlides = document.querySelectorAll(".carousel-item").length;

      function updateCarousel() {
        const translateX = -currentSlide * 100;
        track.style.transform = `translateX(${translateX}%)`;

        // Update dots
        dots.forEach((dot, index) => {
          dot.classList.toggle("active", index === currentSlide);
        });
      }

      function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
      }

      function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
      }


      // Dot navigation
      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          currentSlide = index;
          updateCarousel();
        });
      });

      let timeout;
      let interval;
      // Auto-play every 6 seconds for better engagement
      interval = setInterval(nextSlide, 6000);

      // Event listeners
      nextBtn.addEventListener("click", () => {
        nextSlide();
        clearInterval(interval);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          interval = setInterval(nextSlide, 6000);
        }, 20000)
      });

      prevBtn.addEventListener("click", () => {
        prevSlide();
        clearInterval(interval);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          interval = setInterval(nextSlide, 6000);
        }, 20000)
      });
    }

    // Action Buttons Functionality
    function initializeActionButtons() {
      const startBtn = document.getElementById('heroStartBtn');
      const demoBtn = document.getElementById('heroDemoBtn');
      const startNowBtn = document.getElementById('startNowBtn');
      const scheduleDemoBtn = document.getElementById('scheduleDemoBtn');

      // Main hero buttons
      if (startBtn) {
        startBtn.addEventListener('click', function (e) {
          e.preventDefault();
          // Scroll to contact form
          const contactForm = document.getElementById('contact');
          if (contactForm) {
            contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }

      if (demoBtn) {
        demoBtn.addEventListener('click', function (e) {
          e.preventDefault();
          // Scroll to contact form and pre-select "Planifier une démo"
          const contactForm = document.getElementById('contact');
          const subjectSelect = document.getElementById('subject');

          if (contactForm) {
            contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Pre-select demo option if available
            if (subjectSelect) {
              setTimeout(() => {
                subjectSelect.value = 'Planifier une démo';
              }, 500);
            }
          }
        });
      }

      // Secondary action buttons
      if (startNowBtn) {
        startNowBtn.addEventListener('click', function (e) {
          e.preventDefault();
          const contactForm = document.getElementById('contact');
          if (contactForm) {
            contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }

      if (scheduleDemoBtn) {
        scheduleDemoBtn.addEventListener('click', function (e) {
          e.preventDefault();
          const contactForm = document.getElementById('contact');
          const subjectSelect = document.getElementById('subject');

          if (contactForm) {
            contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

            if (subjectSelect) {
              setTimeout(() => {
                subjectSelect.value = 'Planifier une démo';
              }, 500);
            }
          }
        });
      }
    }

    // FAQ Functionality
    function initializeFAQ() {
      const faqItems = document.querySelectorAll('.faq-item');

      faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question ? question.querySelector('svg') : null;

        if (question && answer) {
          question.addEventListener('click', function () {
            const isOpen = !answer.classList.contains('hidden');

            // Close all other FAQ items
            faqItems.forEach(otherItem => {
              if (otherItem !== item) {
                const otherAnswer = otherItem.querySelector('.faq-answer');
                const otherIcon = otherItem.querySelector('.faq-question svg');

                if (otherAnswer) {
                  otherAnswer.classList.add('hidden');
                }
                if (otherIcon) {
                  otherIcon.style.transform = 'rotate(0deg)';
                }
              }
            });

            // Toggle current item
            if (isOpen) {
              answer.classList.add('hidden');
              if (icon) {
                icon.style.transform = 'rotate(0deg)';
              }
            } else {
              answer.classList.remove('hidden');
              if (icon) {
                icon.style.transform = 'rotate(45deg)';
              }
            }
          });
        }
      });
    }
  