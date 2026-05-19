import React from "react";

export default function MembershipInfoTab({ state, actions, helpers }) {
  const { user, phone, tier, currentConfig, totalSpent, safeProgress } = state;
  const { setPhone } = actions;
  const { formatCurrency } = helpers;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">

      {/* Profile Card */}
      <div className="bg-slate-50 rounded-[2rem] p-8 sm:p-12 flex flex-col items-center text-center border border-slate-100">
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-white shadow-sm object-cover bg-white mb-6"
        />
        <h2 className="text-2xl font-medium text-slate-900">{user.name}</h2>
        <div className="inline-block mt-3 px-4 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
          {user.role || "Member"}
        </div>

        <div className="w-full mt-10 space-y-6 text-left">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
              placeholder="Enter phone number"
            />
          </div>
          <button className="w-full py-4 bg-slate-900 text-white font-medium text-sm rounded-full hover:bg-slate-800 transition-colors shadow-sm">
            Update Profile
          </button>
        </div>
      </div>

      {/* Membership Tier Card */}
      <div className="bg-slate-50 rounded-[2rem] p-8 sm:p-12 border border-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Membership Tier
              </h3>
              <div className="flex items-center gap-3">
                <i className={`fa-solid ${currentConfig.icon} ${currentConfig.color} text-2xl`}></i>
                <span className="text-3xl font-medium text-slate-900">{tier}</span>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Discount
              </h3>
              <span className="text-lg font-medium text-emerald-600 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                {Math.round(user?.discount_percent || 0)}%
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 mb-8">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-4">
              <p className="text-sm font-medium text-slate-500">Total Spending</p>
              <p className="text-lg font-medium text-slate-900">{formatCurrency(totalSpent)}</p>
            </div>
            {currentConfig.next && (
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-500">Next Milestone</p>
                <p className="text-lg font-medium text-slate-900">{formatCurrency(currentConfig.next)}</p>
              </div>
            )}
          </div>
        </div>

        {currentConfig.next ? (
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              <span>Progress to {currentConfig.label}</span>
              <span>{Math.round(safeProgress)}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 shadow-inner overflow-hidden border border-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-1000 ease-out"
                style={{ width: `${safeProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="py-4 px-6 bg-slate-900 rounded-2xl text-white text-center">
            <p className="font-medium text-sm">🎉 You have reached the maximum tier!</p>
          </div>
        )}
      </div>

    </div>
  );
}
