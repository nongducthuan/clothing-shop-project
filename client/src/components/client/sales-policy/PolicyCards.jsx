import React from "react";
import { POLICIES } from "./salesPolicyData";

export default function PolicyCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      {POLICIES.map((policy, idx) => {
        const Icon = policy.icon;
        return (
          <div
            key={idx}
            className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-slate-200 transition-colors flex flex-col items-start"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${policy.styleClass}`}>
              <Icon size={28} strokeWidth={1.5} />
            </div>
            <h3 className="font-medium text-xl text-slate-900 mb-3">{policy.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{policy.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
