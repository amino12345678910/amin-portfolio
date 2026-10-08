// Form Handler Module
// Contains form validation, submission, and client type toggle functionality

class FormHandler {
  constructor() {
    this.init();
  }

  init() {
    this.initClientTypeToggle();
    this.initFormValidation();
    this.initBlogSearch();
  }

  // Client Type Toggle Functionality
  initClientTypeToggle() {
    const clientTypeRadios = document.querySelectorAll('input[name="clientType"]');
    const companyFields = document.getElementById("companyFields");
    const companyInput = document.getElementById("company");
    const companyInputGroup = companyInput ? companyInput.closest('.form-group') : null;
    const individualSubject = document.querySelector('.individual-subject');
    const positionSelect = document.getElementById("position");
    const revenueSelect = document.getElementById("revenue");

    if (clientTypeRadios.length > 0) {
      clientTypeRadios.forEach((radio) => {
        radio.addEventListener("change", function() {
          if (this.value === "company") {
            // Show company fields
            if (companyFields) {
              companyFields.classList.remove("hidden");
            }
            if (companyInputGroup) {
              companyInputGroup.style.display = 'block';
            }
            if (individualSubject) {
              individualSubject.style.display = 'none';
            }
            if (companyInput) companyInput.setAttribute("required", "");
            if (positionSelect) positionSelect.setAttribute("required", "");
            if (revenueSelect) revenueSelect.setAttribute("required", "");
          } else {
            // Show individual fields
            if (companyFields) {
              companyFields.classList.add("hidden");
            }
            if (companyInputGroup) {
              companyInputGroup.style.display = 'none';
            }
            if (individualSubject) {
              individualSubject.style.display = 'block';
            }
            
            // Clear company fields
            if (companyInput) {
              companyInput.removeAttribute("required");
              companyInput.value = '';
              companyInput.classList.remove("invalid", "valid");
              const companyError = companyInput.parentElement.querySelector(".error-message");
              if (companyError) companyError.remove();
            }
            if (positionSelect) {
              positionSelect.removeAttribute("required");
              positionSelect.classList.remove("invalid", "valid");
              const positionError = positionSelect.parentElement.querySelector(".error-message");
              if (positionError) positionError.remove();
            }
            if (revenueSelect) {
              revenueSelect.removeAttribute("required");
              revenueSelect.classList.remove("invalid", "valid");
              const revenueError = revenueSelect.parentElement.querySelector(".error-message");
              if (revenueError) revenueError.remove();
            }
          }
        });
      });
      
      // Set initial state
      const checkedRadio = document.querySelector('input[name="clientType"]:checked');
      if (checkedRadio) {
        if (checkedRadio.value === 'individual') {
          if (companyInputGroup) companyInputGroup.style.display = 'none';
          if (individualSubject) individualSubject.style.display = 'block';
          if (companyFields) companyFields.classList.add("hidden");
        } else {
          if (companyInputGroup) companyInputGroup.style.display = 'block';
          if (individualSubject) individualSubject.style.display = 'none';
          if (companyFields) companyFields.classList.remove("hidden");
        }
      }
    }
  }

  // Form validation functionality
  initFormValidation() {
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
      contactForm.addEventListener("submit", this.handleFormSubmit.bind(this));
    }

    // Real-time validation
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
    });
  }

  handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    let isValid = true;

    // Validate all fields
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    if (isValid) {
      this.submitForm(formData);
    } else {
      this.showNotification("Veuillez corriger les erreurs dans le formulaire", "error");
    }
  }

  validateField(input) {
    const value = input.value.trim();
    const fieldType = input.type;
    const isRequired = input.hasAttribute('required');

    // Clear previous validation
    this.clearFieldError(input);

    if (isRequired && !value) {
      this.showFieldError(input, "Ce champ est requis");
      return false;
    }

    if (value) {
      switch (fieldType) {
        case 'email':
          if (!this.isValidEmail(value)) {
            this.showFieldError(input, "Veuillez entrer une adresse email valide");
            return false;
          }
          break;
        case 'tel':
          if (!this.isValidPhone(value)) {
            this.showFieldError(input, "Veuillez entrer un numéro de téléphone valide");
            return false;
          }
          break;
        default:
          if (input.minLength && value.length < input.minLength) {
            this.showFieldError(input, `Ce champ doit contenir au moins ${input.minLength} caractères`);
            return false;
          }
      }
    }

    this.showFieldSuccess(input);
    return true;
  }

  showFieldError(input, message) {
    if (!input) return;
    const formGroup = input.parentElement;
    if (!formGroup) return;
    
    const existingError = formGroup.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    const errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = window.SecurityUtils ? window.SecurityUtils.sanitizeText(message) : message;
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    formGroup.appendChild(errorElement);

    input.classList.add("invalid");
    input.classList.remove("valid");
    input.setAttribute('aria-invalid', 'true');
  }

  showFieldSuccess(input) {
    if (!input) return;
    const formGroup = input.parentElement;
    if (!formGroup) return;
    
    const error = formGroup.querySelector(".error-message");
    if (error) {
      error.remove();
    }

    input.classList.add("valid");
    input.classList.remove("invalid");
    input.setAttribute('aria-invalid', 'false');
  }

  clearFieldError(input) {
    if (!input) return;
    const formGroup = input.parentElement;
    if (!formGroup) return;
    
    const error = formGroup.querySelector(".error-message");
    if (error) {
      error.remove();
    }

    input.classList.remove("invalid", "valid");
    input.removeAttribute('aria-invalid');
  }

  async submitForm(formData) {
    this.showNotification("Envoi du message en cours...", "info");
    
    try {
      const response = await fetch('api/contact_simple.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.showNotification("Message envoyé avec succès! Nous vous recontacterons bientôt.", "success");
        document.getElementById("contactForm").reset();
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      // Form submission error occurred
      console.error('Form submission error:', error);
      this.showNotification("Erreur: " + error.message, "error");
    }
  }

  // Blog search functionality
  initBlogSearch() {
    const blogSearch = document.getElementById("blogSearch");
    const blogPosts = document.querySelectorAll(".blog-card");
    const noResults = document.getElementById("no-results");

    if (blogSearch) {
      blogSearch.addEventListener("keyup", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let found = false;

        blogPosts.forEach((post) => {
          const title = post.dataset.title.toLowerCase();
          if (title.includes(searchTerm)) {
            post.style.display = "block";
            found = true;
          } else {
            post.style.display = "none";
          }
        });

        if (found || !searchTerm) {
          if (noResults) noResults.classList.add("hidden");
        } else {
          if (noResults) noResults.classList.remove("hidden");
        }
      });
    }
  }

  // Validation helpers
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone) {
    // Basic phone validation - can be enhanced based on requirements
    return /^[\d\s\+\-\(\)\.]{6,}$/.test(phone);
  }

  showNotification(message, type = 'info') {
    // Use UI components notification if available
    if (window.UIComponents && typeof window.uiComponents.showNotification === 'function') {
      window.uiComponents.showNotification(message, type);
    } else {
      // Fallback notification
      alert(message); // Basic fallback
    }
  }
}

// Export for global use
window.FormHandler = FormHandler;