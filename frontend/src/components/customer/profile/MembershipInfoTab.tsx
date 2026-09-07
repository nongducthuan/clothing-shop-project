import React, { useState } from "react";

export default function MembershipInfoTab({ state, actions, helpers }) {
  const { user, phone, tier, currentConfig, totalSpent, safeProgress } = state;
  const { setPhone } = actions;
  const { formatCurrency } = helpers;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if role badge adds value and isn't redundant with user's display name
  const showRoleBadge =
    user?.role &&
    user?.role.toUpperCase() !== user?.name?.toUpperCase() &&
    user?.role.toUpperCase() !== "CUSTOMER" &&
    user?.role.toUpperCase() !== "USER";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Row: Full-width User Profile Info Banner */}
      <div className="bg-slate-50 rounded-[2rem] p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        {/* Left: Avatar + User Details */}
        <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto min-w-0">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=random`
            }
            alt="Profile"
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-sm object-cover bg-white shrink-0"
          />
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap w-full">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                {user?.name}
              </h2>
              {showRoleBadge && (
                <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {user.role}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium truncate w-full">{user?.email}</p>
          </div>
        </div>

        {/* Right: Explicit Phone Number Input Box */}
        <div className="w-full md:w-auto flex flex-col gap-1 shrink-0">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Phone Number
          </label>
          <div className="flex items-center gap-2 bg-white p-1.5 pl-3.5 rounded-2xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-slate-900 transition-all w-full max-w-full overflow-hidden">
            <i className="fa-solid fa-phone text-slate-400 text-sm shrink-0"></i>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold outline-none text-sm min-w-0 flex-1 placeholder:text-slate-400 placeholder:font-normal"
              placeholder="Enter phone number"
            />
            <button
              onClick={actions.updateProfile}
              className="px-3.5 py-2 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap uppercase tracking-wider shadow-sm shrink-0"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: 2 Equal Columns (Membership Tier | Change Password) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Membership Tier */}
        <div className="bg-slate-50 rounded-[2rem] p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <i className="fa-solid fa-crown text-slate-800 text-sm"></i>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider truncate">
                Membership Status
              </h3>
            </div>

            <div className="flex justify-between items-center mb-5 gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">
                  Current Tier
                </p>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentConfig?.bg || "bg-slate-100"} flex items-center justify-center shrink-0`}>
                    <i className={`fa-solid ${currentConfig?.icon || "fa-shield-halved"} ${currentConfig?.color || "text-slate-500"} text-sm sm:text-lg`}></i>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{tier}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Discount
                </p>
                <span className="text-sm sm:text-base font-bold text-emerald-600 px-3 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 inline-block">
                  {Math.round(user?.discount_percent || 0)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-5 divide-y divide-slate-200 overflow-hidden">
              <div className="flex justify-between items-center px-3.5 sm:px-4 py-3 gap-2">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Total Spending</p>
                <p className="text-sm sm:text-base font-bold text-slate-900 shrink-0">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              {currentConfig?.next && (
                <div className="flex justify-between items-center px-3.5 sm:px-4 py-3 gap-2">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Next Milestone</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 shrink-0">
                    {formatCurrency(currentConfig.next)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            {currentConfig?.next ? (
              <div>
                <div className="flex justify-between text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 gap-2">
                  <span className="truncate">Progress to {currentConfig.label}</span>
                  <span className="text-slate-900 font-extrabold shrink-0">{Math.round(safeProgress)}%</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-slate-300/60 shadow-inner">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-1000 ease-out"
                    style={{ width: `${safeProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="py-3 px-4 bg-slate-900 rounded-2xl text-white text-center shadow-sm">
                <p className="font-medium text-xs sm:text-sm">🎉 You have reached the maximum tier!</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Change Password */}
        <div className="bg-slate-50 rounded-[2rem] p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <i className="fa-solid fa-key text-slate-800 text-sm"></i>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider truncate">
                Security & Password
              </h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={state.currentPassword}
                    onChange={(e) => actions.setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-xs sm:text-sm font-medium"
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    aria-label="Toggle current password"
                  >
                    <i className={`fa-solid ${showCurrent ? "fa-eye-slash" : "fa-eye"} text-xs sm:text-sm`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={state.newPassword}
                    onChange={(e) => actions.setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-xs sm:text-sm font-medium"
                    placeholder="New password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    aria-label="Toggle new password"
                  >
                    <i className={`fa-solid ${showNew ? "fa-eye-slash" : "fa-eye"} text-xs sm:text-sm`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={state.confirmPassword}
                    onChange={(e) => actions.setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-xs sm:text-sm font-medium"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    aria-label="Toggle confirm password"
                  >
                    <i className={`fa-solid ${showConfirm ? "fa-eye-slash" : "fa-eye"} text-xs sm:text-sm`}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={actions.changePassword}
            disabled={state.isChangingPassword}
            className="w-full py-3 mt-5 bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-2xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {state.isChangingPassword ? "Updating..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}



