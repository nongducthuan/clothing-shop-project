import { useState } from "react";
import AIChatWindow from "./AIChatWindow";

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <AIChatWindow onClose={() => setOpen(false)} />}

      <button
        type="button"
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-violet-400 text-white shadow-lg transition-transform duration-150 ease-out hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-label={open ? "Close AI" : "Open AI"}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-xl" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
        </span>
      </button>
    </>
  );
}
