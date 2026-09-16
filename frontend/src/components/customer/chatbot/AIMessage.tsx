import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function AIMessage({ role, content }: { role: string; content: string }) {
  const { t } = useLanguage();
  const isUser = role === "user";

  // Parse **bold** markdown tags into <strong> elements
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");

    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, partIdx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong key={partIdx} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {parsedLine}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

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
        <div className="mt-1 whitespace-pre-wrap">{renderFormattedContent(content)}</div>
      </div>
    </div>
  );
}
