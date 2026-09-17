import React, { useState } from "react";
import { Crown } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

export default function MembershipInfoTab({ state, actions, helpers }) {
  const { user, phone, tier, currentConfig, totalSpent, safeProgress } = state;
  const { setPhone } = actions;
  const { formatCurrency } = helpers;
  const { t, getLocalizedTierName } = useLanguage();

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
      <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        {/* Left: Avatar + User Details */}
        <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto min-w-0">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=random`
            }
            alt="Profile"
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-white dark:border-slate-700 shadow-sm object-cover bg-white dark:bg-slate-700 shrink-0"
          />
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap w-full">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name}
              </h2>
              {showRoleBadge && (
                <span className="px-2.5 py-0.5 bg-slate-900 dark:bg-slate-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {user.role}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium truncate w-full">{user?.email}</p>
          </div>
        </div>

        {/* Right: Explicit Phone Number Input Box */}
        <div className="w-full md:w-auto flex flex-col gap-1 shrink-0">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
            {t("profile.phone_number", "Phone Number")}
          </label>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-700 p-1.5 pl-3.5 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-sm focus-within:ring-2 focus-within:ring-slate-900 dark:focus-within:ring-slate-400 transition-all w-full max-w-full overflow-hidden">
            <i className="fa-solid fa-phone text-slate-400 text-sm shrink-0"></i>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-semibold outline-none text-sm min-w-0 flex-1 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
              placeholder={t("profile.phone_placeholder", "Enter phone number")}
            />
            <button
              onClick={actions.updateProfile}
              className="px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap uppercase tracking-wider shadow-sm shrink-0"
            >
              {t("profile.update", "Update")}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: 2 Equal Columns (Membership Tier | Change Password) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Membership Tier */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <i className="fa-solid fa-crown text-slate-800 dark:text-slate-300 text-sm"></i>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
                {t("profile.membership_status", "Membership Status")}
              </h3>
            </div>

            <div className="flex justify-between items-center mb-5 gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
                  {t("profile.current_tier", "Current Tier")}
                </p>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentConfig?.bg || "bg-slate-100"} flex items-center justify-center shrink-0`}>
                    <i className={`fa-solid ${currentConfig?.icon || "fa-shield-halved"} ${currentConfig?.color || "text-slate-500"} text-sm sm:text-lg`}></i>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{getLocalizedTierName(tier)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {t("profile.discount", "Discount")}
                </p>
                <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 px-3 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200 dark:border-emerald-900/50 inline-block">
                  {Math.round(user?.discount_percent || 0)}%
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-xs mb-5 divide-y divide-slate-200 dark:divide-slate-600 overflow-hidden">
              <div className="flex justify-between items-center px-3.5 sm:px-4 py-3 gap-2">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{t("profile.total_spending", "Total Spending")}</p>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 shrink-0">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              {currentConfig?.next && (
                <div className="flex justify-between items-center px-3.5 sm:px-4 py-3 gap-2">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{t("profile.next_milestone", "Next Milestone")}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    {formatCurrency(currentConfig.next)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            {currentConfig?.next ? (
              <div>
                <div className="flex justify-between text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 gap-2">
                  <span className="truncate">{t("profile.progress_to", "Progress to")} {getLocalizedTierName(currentConfig.label)}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-extrabold shrink-0">{Math.round(safeProgress)}%</span>
                </div>
                <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden border border-slate-300/60 dark:border-slate-600 shadow-inner">
                  <div
                    className="h-full rounded-full bg-slate-900 dark:bg-slate-100 transition-all duration-1000 ease-out"
                    style={{ width: `${safeProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="py-3 px-4 bg-slate-900 dark:bg-slate-700 rounded-2xl text-white text-center shadow-sm flex items-center justify-center gap-1.5">
                <Crown size={16} className="text-amber-400" />
                <span className="font-medium text-xs sm:text-sm">{t("profile.max_tier", "You have reached the maximum tier!")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Change Password */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <i className="fa-solid fa-key text-slate-800 dark:text-slate-300 text-sm"></i>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
                {t("profile.security_password", "Security & Password")}
              </h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                  {t("profile.current_password", "Current Password")}
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={state.currentPassword}
                    onChange={(e) => actions.setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100"
                    placeholder={t("profile.current_password_placeholder", "Current password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1"
                    aria-label={t("profile.toggle_current_password", "Toggle current password")}
                  >
                    <i className={`fa-solid ${showCurrent ? "fa-eye-slash" : "fa-eye"} text-xs sm:text-sm`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                  {t("profile.new_password", "New Password")}
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={state.newPassword}
                    onChange={(e) => actions.setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100"
                    placeholder={t("profile.new_password_placeholder", "New password (min 6 chars)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1"
                    aria-label={t("profile.toggle_new_password", "Toggle new password")}
                  >
                    <i className={`fa-solid ${showNew ? "fa-eye-slash" : "fa-eye"} text-xs sm:text-sm`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                  {t("profile.confirm_new_password", "Confirm New Password")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={state.confirmPassword}
                    onChange={(e) => actions.setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100"
                    placeholder={t("profile.confirm_password_placeholder", "Confirm new password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1"
                    aria-label={t("profile.toggle_confirm_password", "Toggle confirm password")}
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
            className="w-full py-3 mt-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs sm:text-sm rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-sm disabled:opacity-50"
          >
            {state.isChangingPassword ? t("profile.updating", "Updating...") : t("profile.change_password", "Change Password")}
          </button>
        </div>
      </div>
    </div>
  );
}



