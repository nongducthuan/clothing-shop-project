import { createContext, useCallback, useEffect, useState } from "react";
import { clearChatHistory, sendChatMessage } from "../services/aiService";

const STORAGE_SESSION_KEY = "ai_chat_session_id";
const STORAGE_HISTORY_KEY = "ai_chat_history";

export const AIChatContext = createContext();

export function AIChatProvider({ children }) {
  const [sessionId, setSessionId] = useState(() => {
    const stored = localStorage.getItem(STORAGE_SESSION_KEY);
    return stored ?? crypto.randomUUID();
  });

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        const { reply } = await sendChatMessage({ message: trimmed, sessionId });

        const aiMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: reply || "No Reply",
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Error sending message");
        const errorMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: "Sorry, the system is experiencing issues. Please try again later.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
      }
    },
    [sessionId]
  );

  const resetChat = useCallback(async () => {
    try {
      await clearChatHistory({ sessionId });
    } catch (err) {
      console.warn("Failed to clear server chat history", err);
    }

    const nextSession = crypto.randomUUID();
    setSessionId(nextSession);
    setMessages([]);
  }, [sessionId]);

  return (
    <AIChatContext.Provider
      value={{ sessionId, messages, isSending, error, sendMessage, resetChat }}
    >
      {children}
    </AIChatContext.Provider>
  );
}
