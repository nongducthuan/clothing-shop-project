import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";

export default function AIMessage({ role, content }: { role: string; content: string }) {
  const { t } = useLanguage();
  const isUser = role === "user";

  const renderInlineContent = (text: string, lineIdx: number) => {
    // Accept ordinary markdown links, including links with harmless extra spaces.
    const tokenPattern = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(\s*(\/products\/\d+)\s*\)/g;
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    let tokenIndex = 0;

    while ((match = tokenPattern.exec(text)) !== null) {
      if (match.index > cursor) {
        nodes.push(text.slice(cursor, match.index));
      }

      if (match[1] !== undefined) {
        nodes.push(
          <strong key={`${lineIdx}-bold-${tokenIndex}`} className="font-bold text-white">
            {match[1]}
          </strong>,
        );
      } else if (match[2] !== undefined && match[3] !== undefined) {
        // Only allow internal product links; never turn arbitrary AI output into a link.
        nodes.push(
          <Link
            key={`${lineIdx}-product-${tokenIndex}`}
            to={match[3]}
            className="font-medium text-sky-300 underline decoration-sky-300/50 underline-offset-2 transition-colors hover:text-sky-200"
          >
            {match[2]}
          </Link>,
        );
      }

      cursor = tokenPattern.lastIndex;
      tokenIndex += 1;
    }

    if (cursor < text.length) {
      nodes.push(text.slice(cursor));
    }

    return nodes;
  };

  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    // Normalize malformed product links across line breaks before splitting into display lines.
    const normalized = text.replace(
      /(\[[^\]\n]+\])\s*(?:\r?\n\s*)?\(\s*(\/products\/\d+)\s*\)/g,
      "$1($2)",
    );
    const lines = normalized.split(/\r?\n/);

    return lines.map((line, lineIdx) => (
      <React.Fragment key={lineIdx}>
        {renderInlineContent(line, lineIdx)}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    ));
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
