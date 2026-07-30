import React from "react";

export default function AuthInput({ label, type = "text", name, value, onChange, placeholder, required = false }) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
      />
    </div>
  );
}
