import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import AIChatWindow from "./AIChatWindow";

export default function AIChatBubble() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <AIChatWindow onClose={() => setOpen(false)} />}

      <button
        type="button"
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-violet-400 text-white shadow-lg shadow-violet-500/30 transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-label={open ? t("chat.close", "Close AI") : t("chat.open", "Open AI")}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Sparkles size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </>
  );
}
