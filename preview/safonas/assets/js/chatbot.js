// Chatbot Module
// Contains chatbot functionality for both desktop and mobile interfaces

class ChatbotManager {
  constructor() {
    // Use proxy to avoid CORS issues on production
    // Use emergency proxy during troubleshooting
    this.webhookUrl = "/api/chatbot-proxy-simple.php";
    this.sessionId = this.getSessionId();
    this.init();
  }

  init() {
    this.initDesktopChatbot();
    this.initMobileChatbot();
  }

  // Session management
  getSessionId() {
    let sessionId = localStorage.getItem("safonas_chatbot_session_id");
    
    // Clear old session ID format (session_TIMESTAMP_RANDOM)
    if (sessionId && sessionId.startsWith('session_')) {
      localStorage.removeItem("safonas_chatbot_session_id");
      sessionId = null;
    }
    
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : this.generateFallbackId();
      localStorage.setItem("safonas_chatbot_session_id", sessionId);
    }
    return sessionId;
  }

  generateFallbackId() {
    // Generate fallback session ID
    return 'session_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
  }

  // Desktop chatbot initialization
  initDesktopChatbot() {
    const heroChatInput = document.getElementById("heroChatInput");
    const heroSendMessage = document.getElementById("heroSendMessage");
    const heroChatMessages = document.getElementById("heroChatMessages");

    if (heroSendMessage && heroChatInput && heroChatMessages) {
      heroSendMessage.addEventListener("click", () => this.sendMessage('desktop'));
      
      heroChatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendMessage('desktop');
        }
      });
    }

    this.desktopElements = { heroChatInput, heroSendMessage, heroChatMessages };
  }

  // Mobile chatbot initialization
  initMobileChatbot() {
    const heroChatInputMobile = document.getElementById("heroChatInputMobile");
    const heroSendMessageMobile = document.getElementById("heroSendMessageMobile");
    const heroChatMessagesMobile = document.getElementById("heroChatMessagesMobile");

    if (heroSendMessageMobile && heroChatInputMobile && heroChatMessagesMobile) {
      heroSendMessageMobile.addEventListener("click", () => this.sendMessage('mobile'));
      
      heroChatInputMobile.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendMessage('mobile');
        }
      });
    }

    this.mobileElements = { heroChatInputMobile, heroSendMessageMobile, heroChatMessagesMobile };
  }

  // Main message sending function
  async sendMessage(platform) {
    const callId = Date.now() + `-${platform}`;
    // sendMessage() called for platform
    
    const isDesktop = platform === 'desktop';
    const inputElement = isDesktop ? this.desktopElements.heroChatInput : this.mobileElements.heroChatInputMobile;
    const messagesElement = isDesktop ? this.desktopElements.heroChatMessages : this.mobileElements.heroChatMessagesMobile;
    
    const message = inputElement.value.trim();
    // Processing user message for platform
    
    if (!message) {
      // Empty message, returning early
      return;
    }

    // Add user message to chat
    this.addMessageToChat(message, "user", platform);
    inputElement.value = "";

    // Add typing indicator
    const typingIndicator = this.addTypingIndicator(platform);

    try {
      // Use Enhanced Chatbot if available
      if (window.enhancedChatbot) {
        // Using Enhanced Chatbot system
        const result = await window.enhancedChatbot.sendMessage(message);
        
        this.removeTypingIndicator(typingIndicator);
        
        if (result.success) {
          // Enhanced Chatbot response received
          this.addMessageToChat(result.response, "bot", platform);
        } else {
          // Enhanced Chatbot failed, using fallback response
          this.addMessageToChat(result.response, "bot", platform);
        }
        
        return;
      }
      
      // Legacy system fallback
      
      // Validate and sanitize message
      const sanitizedMessage = window.SecurityUtils ? 
        window.SecurityUtils.sanitizeText(message) : message;
        
      if (!sanitizedMessage || sanitizedMessage.length > 5000) {
        throw new Error("Message invalide ou trop long");
      }
      
      // Message validation passed

      // Send to webhook
      const requestBody = {
        message: sanitizedMessage,
        timestamp: new Date().toISOString(),
        chatId: this.sessionId,
        platform: platform
      };
      
      // Use secure configuration manager if available
      if (window.secureConfigManager) {
        const result = await window.secureConfigManager.sendSecureMessage(sanitizedMessage, platform);
        
        this.removeTypingIndicator(typingIndicator);
        
        if (result.success) {
          this.addMessageToChat(result.response, "bot", platform);
        } else {
          this.addMessageToChat(result.response, "bot", platform);
        }
        return;
      }
      
      // Fallback to direct fetch with security headers
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-Client-Security": "enabled",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      this.removeTypingIndicator(typingIndicator);

      // Processing webhook response

      if (response.ok) {
        const data = await response.json();
        // Response received from webhook
        
        const rawBotMessage = data.reply || data.response || data.message || data.text || data.answer || data.output || "Merci pour votre message ! Notre équipe vous répondra bientôt.";
        
        // Sanitize response
        const botMessage = window.SecurityUtils ? 
          window.SecurityUtils.sanitizeApiResponse(rawBotMessage) : rawBotMessage;
        
        // Adding bot message to chat UI
        this.addMessageToChat(botMessage, "bot", platform);
      } else {
        const errorText = await response.text();
        // Webhook response failed
        throw new Error("Erreur de communication avec le serveur");
      }
    } catch (error) {
      // Error occurred in sendMessage
      
      this.removeTypingIndicator(typingIndicator);
      this.addMessageToChat("Désolé, une erreur s'est produite. Veuillez réessayer plus tard.", "bot", platform);
    }
    
    // sendMessage() completed
  }

  // Add message to chat interface
  addMessageToChat(message, sender, platform) {
    const isDesktop = platform === 'desktop';
    const messagesElement = isDesktop ? this.desktopElements.heroChatMessages : this.mobileElements.heroChatMessagesMobile;
    
    if (!messagesElement) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    
    // Handle RTL for Arabic text
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(message);
    
    if (hasArabic) {
      messageContent.dir = "rtl";
      messageContent.style.textAlign = "right";
    } else {
      messageContent.dir = "ltr";
      messageContent.style.textAlign = "left";
    }
    
    // Parse markdown for bot messages, plain text for user messages
    if (sender === 'user') {
      messageContent.textContent = message;
    } else {
      messageContent.innerHTML = this.parseMarkdownSecure(message);
    }
    
    const messageTime = document.createElement("div");
    messageTime.className = "message-time";
    messageTime.textContent = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    messagesElement.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }

  // Secure markdown parser
  parseMarkdownSecure(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Sanitize input
    let sanitizedText = window.SecurityUtils ? 
      window.SecurityUtils.sanitizeText(text) : text;
    
    let html = sanitizedText;
    
    // Headers
    html = html.replace(/^### (.{1,200})$/gim, (match, content) => {
      return '<h3>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content.trim()) : content.trim()) + '</h3>';
    });
    html = html.replace(/^## (.{1,200})$/gim, (match, content) => {
      return '<h2>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content.trim()) : content.trim()) + '</h2>';
    });
    html = html.replace(/^# (.{1,200})$/gim, (match, content) => {
      return '<h1>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content.trim()) : content.trim()) + '</h1>';
    });
    
    // Bold and Italic
    html = html.replace(/\*\*\*(.{1,500}?)\*\*\*/g, (match, content) => {
      return '<strong><em>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content) : content) + '</em></strong>';
    });
    html = html.replace(/\*\*(.{1,500}?)\*\*/g, (match, content) => {
      return '<strong>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content) : content) + '</strong>';
    });
    html = html.replace(/\*(.{1,500}?)\*/g, (match, content) => {
      return '<em>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content) : content) + '</em>';
    });
    
    // Lists
    html = html.replace(/^\* (.{1,1000})$/gim, (match, content) => {
      return '<li>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content.trim()) : content.trim()) + '</li>';
    });
    html = html.replace(/^- (.{1,1000})$/gim, (match, content) => {
      return '<li>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content.trim()) : content.trim()) + '</li>';
    });
    
    // Wrap consecutive list items in ul tags
    html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    // Code blocks
    html = html.replace(/```([\s\S]{1,5000}?)```/g, (match, content) => {
      return '<pre><code>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content) : content) + '</code></pre>';
    });
    html = html.replace(/`([^`]{1,200})`/g, (match, content) => {
      return '<code>' + (window.SecurityUtils ? window.SecurityUtils.sanitizeText(content) : content) + '</code>';
    });
    
    // Links
    html = html.replace(/\[([^\]]{1,200})\]\(([^)]{1,500})\)/g, (match, linkText, url) => {
      const sanitizedText = window.SecurityUtils ? 
        window.SecurityUtils.sanitizeText(linkText) : linkText;
      const validatedUrl = window.SecurityUtils ? 
        window.SecurityUtils.validateAndSanitizeUrl(url) : url;
      
      if (validatedUrl) {
        return `<a href="${validatedUrl}" target="_blank" rel="noopener noreferrer nofollow">${sanitizedText}</a>`;
      } else {
        return sanitizedText;
      }
    });
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    // Clean up
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br>/g, '<p>');
    
    return html;
  }

  // Typing indicator functions
  addTypingIndicator(platform) {
    const isDesktop = platform === 'desktop';
    const messagesElement = isDesktop ? this.desktopElements.heroChatMessages : this.mobileElements.heroChatMessagesMobile;
    
    if (!messagesElement) return null;

    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message typing-message";
    
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "typing-indicator";
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "typing-dot";
      typingIndicator.appendChild(dot);
    }
    
    messageContent.appendChild(typingIndicator);
    typingDiv.appendChild(messageContent);
    
    messagesElement.appendChild(typingDiv);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    return typingDiv;
  }

  removeTypingIndicator(typingElement) {
    if (typingElement && typingElement.parentNode) {
      typingElement.parentNode.removeChild(typingElement);
    }
  }
}

// Export for global use
window.ChatbotManager = ChatbotManager;