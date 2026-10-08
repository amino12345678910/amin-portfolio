
    document.addEventListener('DOMContentLoaded', function () {
      const contactForm = document.getElementById('contactForm');
      const successPopup = document.getElementById('successPopup');
      let isSubmitting = false; // Flag to prevent duplicate submissions

      if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          e.stopPropagation(); // Stop event propagation
          e.stopImmediatePropagation(); // Stop all other handlers

          // Prevent duplicate submissions
          if (isSubmitting) {
            return false;
          }
          isSubmitting = true;

          const submitBtn = this.querySelector('.form-submit-btn');
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...';
          submitBtn.disabled = true;

          const formData = new FormData(this);

          try {
            const response = await fetch('api/contact_simple.php', {
              method: 'POST',
              body: formData
            });

            const result = await response.json();

            if (result.success) {
              // Show success popup
              successPopup.classList.remove('hidden');
              successPopup.classList.add('animate-slide-in');

              // Reset form
              contactForm.reset();

              // Hide popup after 5 seconds
              setTimeout(() => {
                successPopup.classList.add('animate-slide-out');
                setTimeout(() => {
                  successPopup.classList.add('hidden');
                  successPopup.classList.remove('animate-slide-out');
                }, 300);
              }, 5000);
            } else {
              alert(result.message || 'Une erreur est survenue. Veuillez réessayer.');
            }
          } catch (error) {
            console.error('Error:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
          } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            isSubmitting = false; // Reset the flag
          }

          return false; // Ensure form doesn't submit normally
        });
      }

      // Client Type Form Switching
      const clientTypeRadios = document.querySelectorAll('input[name="clientType"]');
      const companyFields = document.getElementById('companyFields');
      const individualSubject = document.querySelector('.individual-subject');
      const companyField = document.querySelector('.company-field');

      function toggleFormFields() {
        const selectedType = document.querySelector('input[name="clientType"]:checked').value;

        if (selectedType === 'company') {
          companyFields.classList.remove('hidden');
          individualSubject.classList.add('hidden');
          if (companyField) companyField.style.display = 'block';
        } else {
          companyFields.classList.add('hidden');
          individualSubject.classList.remove('hidden');
          if (companyField) companyField.style.display = 'block'; // Keep company field visible for both
        }
      }

      // Add event listeners to radio buttons
      clientTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleFormFields);
      });

      // Initialize form state
      toggleFormFields();

      // IntersectionObserver for entrance animations
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              let el = entry.target;
              let delay = parseInt(el.dataset.delay) || 0;
              setTimeout(() => {
                el.classList.replace("hiddenView", "show");
              }, delay);
              observer.unobserve(el); // stop observing after shown
            }
          });
        },
        { threshold: 0.075 }
      );

      document.querySelectorAll(".hiddenView").forEach((el) => {
        observer.observe(el);
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState == "hidden") {
          document.querySelectorAll(".show").forEach((el) => {
            el.classList.replace("show", "hiddenVis");
            void el.offsetWidth;
          })
        }
        else {
          document.querySelectorAll(".hiddenVis").forEach((el) => {
            el.classList.replace("hiddenVis", "show");
            void el.offsetWidth;
          })
        }
      });
    });
  