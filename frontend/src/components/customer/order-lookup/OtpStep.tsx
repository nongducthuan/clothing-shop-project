import React from "react";

export default function OtpStep({ otp, setOtp, onSubmit, loading, onBack }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <label className="block text-sm font-semibold text-gray-600 dark:text-slate-300 mb-4">Nhập mã 6 số vừa được gửi cho bạn</label>
        <input
          type="text"
          required
          autoFocus
          className="w-full max-w-[260px] mx-auto block text-center text-2xl sm:text-3xl tracking-[0.25em] font-mono font-bold border-b-2 border-gray-300 dark:border-slate-600 focus:border-violet-600 dark:focus:border-violet-400 outline-none py-2 text-violet-800 dark:text-violet-300 bg-transparent"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
          maxLength={6}
          placeholder="••••••"
        />
      </div>
      <button
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:opacity-70"
      >
        {loading ? "Đang kiểm tra..." : "Xác nhận & Xem đơn hàng"}
      </button>
      <div className="text-center mt-4">
        <button type="button" onClick={onBack} className="text-gray-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition">
          <i className="fa-solid fa-arrow-left mr-1"></i> Gửi lại mã hoặc đổi Email?
        </button>
      </div>
    </form>
  );
}
