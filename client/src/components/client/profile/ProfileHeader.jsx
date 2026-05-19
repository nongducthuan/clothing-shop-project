import React from "react";

export default function ProfileHeader({ user, logout }) {
  return (
    <div className="bg-white border-b border-slate-100 px-6 sm:px-12 py-8 mb-8">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-medium text-slate-900 tracking-tight">Account</h1>
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full font-medium text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
