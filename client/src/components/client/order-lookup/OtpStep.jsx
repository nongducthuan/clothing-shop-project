import React from "react";

export default function OtpStep({ otp, setOtp, onSubmit, loading, onBack }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <label className="block text-sm font-semibold text-gray-600 mb-4">Enter the 6-digit code we just sent</label>
        <input
          type="text"
          required
          className="w-2/3 mx-auto block text-center text-3xl tracking-[0.5em] font-bold border-b-2 border-gray-300 focus:border-violet-600 outline-none py-2 text-violet-800"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
          maxLength={6}
          placeholder="------"
        />
      </div>
      <button
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:opacity-70"
      >
        {loading ? "Checking..." : "Confirm & View Orders"}
      </button>
      <div className="text-center mt-4">
        <button type="button" onClick={onBack} className="text-gray-500 hover:text-violet-600 text-sm font-medium transition">
          <i className="fa-solid fa-arrow-left mr-1"></i> Resend code or change Email?
        </button>
      </div>
    </form>
  );
}
