import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContext } from "react";
import { AIChatContext } from "../../../context/AIChatContext";
import AIMessage from "./AIMessage";

export default function AIChatWindow({ onClose }) {
  const { messages, sendMessage, isSending, resetChat, error } = useContext(AIChatContext);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;
    await sendMessage(inputValue);
    setInputValue("");
  };

  const hasMessages = messages.length > 0;

  const statusMessage = useMemo(() => {
    if (error) return error;
    if (isSending) return "AI responding..";
    if (!hasMessages) return "Hi! Feel free to ask me anything.";
    return null;
  }, [error, isSending, hasMessages]);

  return (
    <div
      className="fixed right-5 bottom-20 z-50 flex w-[min(420px,calc(100vw-2.5rem))] max-h-[72vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      role="dialog"
      aria-label="AI chat"
      aria-modal="true"
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 pt-4 pb-3">
        <div>
          <strong className="block text-white text-base">AI Assistance</strong>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onClick={resetChat}
          >
            Delete Chat
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onClick={onClose}
            aria-label="Đóng chat"
          >
            ✕
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-3 space-y-3" aria-live="polite">
        {statusMessage && (
          <div className="text-center text-sm text-white/70">{statusMessage}</div>
        )}

        {messages.map((message) => (
          <AIMessage key={message.id} role={message.role} content={message.content} />
        ))}

        <div ref={messagesEndRef} />
      </section>

      <form className="flex gap-2 border-t border-white/10 px-4 py-3 bg-white/5" onSubmit={onSubmit}>
        <textarea
          className="h-10 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          rows={1}
          placeholder="Ask AI.."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSending || !inputValue.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
