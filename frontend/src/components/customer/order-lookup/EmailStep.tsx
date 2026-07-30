import React from "react";

export default function EmailStep({ email, setEmail, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">Purchasing Email</label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-400"><i className="fa-solid fa-at"></i></span>
          <input
            type="email"
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
          />
        </div>
      </div>
      <button
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:opacity-70"
      >
        {loading ? <span><i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Sending...</span> : "Send Verification Code"}
      </button>
    </form>
  );
}
