import React from "react";

export default function ProfileTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex justify-center mb-12">
      <div className="relative flex bg-slate-100 p-1.5 rounded-full w-full max-w-md select-none shadow-inner">
        <div className="absolute inset-y-1.5 left-1.5 right-1.5 pointer-events-none">
          <div
            className={`w-1/2 h-full bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${
              activeTab === "orders" ? "translate-x-full" : "translate-x-0"
            }`}
          ></div>
        </div>

        <button
          onClick={() => setActiveTab("info")}
          style={{ WebkitTapHighlightColor: "transparent" }}
          className={`relative bg-transparent z-10 flex-1 flex justify-center items-center py-3 text-sm font-medium rounded-full transition-colors duration-300 outline-none ${
            activeTab === "info" ? "text-slate-900" : "text-slate-500  hover:text-slate-700"
          }`}
        >
          <i className="fa-solid fa-user mr-2"></i> Profile
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          style={{ WebkitTapHighlightColor: "transparent" }}
          className={`relative bg-transparent z-10 flex-1 flex justify-center items-center py-3 text-sm font-medium rounded-full transition-colors duration-300 outline-none ${
            activeTab === "orders" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <i className="fa-solid fa-box mr-2"></i> Orders
        </button>
      </div>
    </div>
  );
}
