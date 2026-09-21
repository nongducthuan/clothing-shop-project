import { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import { clearChatHistory, sendChatMessage } from "../services/aiService";
import { useLanguage } from "./LanguageContext";
import { ChatMessage } from "../types";

const STORAGE_SESSION_KEY = "ai_chat_session_id";
const STORAGE_HISTORY_KEY = "ai_chat_history";

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

export const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: AIChatProviderProps) {
  const { t, language, translateApiMessage } = useLanguage();
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
        const { reply } = await sendChatMessage({ message: trimmed, sessionId, language });

        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: reply || "No Reply",
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err: unknown) {
        const rawMsg =
          (err as { response?: { data?: { error?: string } }; message?: string })
            ?.response?.data?.error ||
          (err as { message?: string })?.message;
        const translated = translateApiMessage(rawMsg);
        const finalMsg = translated || t("chat.error_msg", "Rất tiếc, hệ thống Trợ lý AI đang gặp sự cố. Vui lòng thử lại sau ít phút.");
        setError(finalMsg);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: finalMsg,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, t, translateApiMessage]
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
