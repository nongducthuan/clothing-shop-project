import { createContext } from "react";
import { ChatMessage } from "../types";

export interface AIChatContextType {
  sessionId: string;
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => Promise<void>;
}

export const AIChatContext = createContext<AIChatContextType | undefined>(undefined);
