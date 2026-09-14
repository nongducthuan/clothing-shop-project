import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function AIMessage({ role, content }) {
  const { t } = useLanguage();
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl border border-white/10 px-4 py-3 text-sm leading-relaxed text-white shadow-sm ${
          isUser
            ? "bg-indigo-500/20 border-indigo-400/40"
            : "bg-white/10"
        }`}
      >
        <span className="block text-[11px] font-medium uppercase tracking-wide text-white/60">
          {isUser ? t("chat.you", "You") : "AI"}
        </span>
        <p className="mt-1 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
