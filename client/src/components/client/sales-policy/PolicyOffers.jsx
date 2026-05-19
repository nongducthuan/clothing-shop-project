import React from "react";
import { Zap, Star } from "lucide-react";
import { NEW_CUSTOMER_BENEFITS, VIP_BENEFITS } from "./salesPolicyData";

export default function PolicyOffers({ state, actions }) {
  const { activeTab } = state;
  const { setActiveTab, handleShopNow, handleContactSupport } = actions;

  return (
    <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden">

      {/* TABS HEADER */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("new")}
          className={`flex-1 py-6 font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base ${
            activeTab === "new"
              ? "bg-white text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}
        >
          <Zap size={20} className={activeTab === "new" ? "text-amber-500" : ""} />
          New Customers
        </button>
        <button
          onClick={() => setActiveTab("vip")}
          className={`flex-1 py-6 font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base ${
            activeTab === "vip"
              ? "bg-white text-slate-900 border-b-2 border-slate-900"
              : "text-slate-500 hover:text-slate-700 bg-transparent"
          }`}
        >
          <Star size={20} className={activeTab === "vip" ? "text-violet-500" : ""} />
          Loyal Members
        </button>
      </div>

      {/* TABS CONTENT */}
      <div className="p-8 sm:p-12 bg-white">
        {activeTab === "new" ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-8">
              Welcome offer for new friends 🎁
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <ul className="space-y-5">
                {NEW_CUSTOMER_BENEFITS.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="text-emerald-500 bg-emerald-50 p-2 rounded-full flex-shrink-0">
                      <Zap size={16} />
                    </span>
                    <span className="text-slate-600 leading-relaxed mt-1">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center shadow-lg">
                <p className="text-xs text-slate-400 mb-3 uppercase tracking-widest font-bold">
                  Discount Code
                </p>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                  HELLO2026
                </h3>
                <p className="text-sm text-slate-400">
                  Apply at checkout step
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-medium text-slate-900 mb-8">
              VIP Member Privileges 👑
            </h2>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <ul className="grid md:grid-cols-2 gap-6">
                {VIP_BENEFITS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <span className="text-violet-500 font-bold mt-0.5">✓</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* CALL TO ACTIONS */}
        <div className="mt-12 pt-12 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleShopNow}
            className="px-10 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-all active:scale-95"
          >
            Shop Now
          </button>
          <button
            onClick={handleContactSupport}
            className="px-10 py-4 bg-white border border-slate-200 text-slate-700 font-medium rounded-full hover:bg-slate-50 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
