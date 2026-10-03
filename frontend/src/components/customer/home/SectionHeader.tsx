import React from "react";

export default function SectionHeader({ title }) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent animate-fadeColor inline-block relative uppercase">
      {title}
      <span className="block h-1 w-full max-w-xs mx-auto mt-2 bg-gradient-to-r from-blue-400 to-sky-400 rounded animate-slideLine"></span>
    </h2>
  );
}
