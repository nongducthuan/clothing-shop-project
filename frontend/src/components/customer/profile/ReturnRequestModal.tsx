import React from "react";

export default function ReturnRequestModal({ state, actions }) {
  if (!state.showReturnModal) return null;

  const { returnData } = state;
  const { setShowReturnModal, handleReturnDataChange, handleSubmitReturn } = actions;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowReturnModal(false)}>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-lg rounded-[2rem] shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 text-lg">Request Return</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Order #{state.returnOrderId}</p>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Reason</label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              value={returnData.reason}
              onChange={(e) => handleReturnDataChange("reason", e.target.value)}
            >
              <option value="Change mind">Change of mind</option>
              <option value="Damaged">Damaged product</option>
              <option value="Wrong item">Wrong item received</option>
              <option value="Not as described">Not as described</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Additional Notes</label>
            <textarea
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors resize-none"
              placeholder="Describe the issue..."
              value={returnData.note}
              onChange={(e) => handleReturnDataChange("note", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Proof Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
              onChange={(e) => handleReturnDataChange("images", e.target.files)}
            />
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Refund Bank Details</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Bank Name"
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400"
                value={returnData.bankName}
                onChange={(e) => handleReturnDataChange("bankName", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Account Number"
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  value={returnData.bankNumber}
                  onChange={(e) => handleReturnDataChange("bankNumber", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Account Holder"
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  value={returnData.accountHolder}
                  onChange={(e) => handleReturnDataChange("accountHolder", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setShowReturnModal(false)}
              className="flex-1 py-4 text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReturn}
              className="flex-1 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-full hover:bg-slate-800 dark:hover:bg-white transition-colors text-sm"
            >
              Submit Request
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

