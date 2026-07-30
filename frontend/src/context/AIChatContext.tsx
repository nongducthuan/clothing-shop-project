import { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import { clearChatHistory, sendChatMessage } from "../services/aiService";
import { ChatMessage } from "../types";

const STORAGE_SESSION_KEY = "ai_chat_session_id";
const STORAGE_HISTORY_KEY = "ai_chat_history";

// --------------- Types ---------------

interface AIChatContextType {
  sessionId: string;
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => Promise<void>;
}

interface AIChatProviderProps {
  children: ReactNode;
}

// --------------- Context ---------------

export const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: AIChatProviderProps) {
  const [sessionId, setSessionId] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_SESSION_KEY);
    return stored ?? crypto.randomUUID();
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
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

        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: reply || "No Reply",
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { error?: string } }; message?: string })
            ?.response?.data?.error ||
          (err as { message?: string })?.message ||
          "Error sending message";
        setError(errorMsg);
        const errorMessage: ChatMessage = {
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
