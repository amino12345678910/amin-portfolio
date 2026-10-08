
    // Session ID management for chatbot conversations
    document.addEventListener('DOMContentLoaded', function () {

      // Session ID management (inline fallback)
      window.getChatSessionId = function () {
        let sessionId = localStorage.getItem("safonas_chatbot_session_id");

        // Clear old session ID format (session_TIMESTAMP_RANDOM)
        if (sessionId && sessionId.startsWith('session_')) {
          localStorage.removeItem("safonas_chatbot_session_id");
          sessionId = null;
        }

        if (!sessionId) {
          sessionId = crypto.randomUUID();
          localStorage.setItem("safonas_chatbot_session_id", sessionId);
        }
        return sessionId;
      };

      // ULTRA SIMPLE chat save function - no complexity!
      window.saveChatInteraction = async function (userMessage, botResponse) {
        try {
          const sessionId = window.getChatSessionId();

          const data = {
            user_message: userMessage,
            chatbot_response: botResponse,
            session_id: sessionId
          };

          const response = await fetch('api/simple-chat-save.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          if (result.success) {
            return { success: true, data: result.data };
          } else {
            return { success: false, error: result.error };
          }

        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      // Start the initialization process
      if (typeof waitForEnvironmentSystem === 'function') {
        waitForEnvironmentSystem();
      }
    });
  