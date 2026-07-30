import React from "react";

export default function ReturnRequestModal({ state, actions }) {
  if (!state.showReturnModal) return null;

  const { returnData } = state;
  const { setShowReturnModal, handleReturnDataChange, handleSubmitReturn } = actions;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowReturnModal(false)}>
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-medium text-slate-900 text-lg">Request Return</h3>
          <p className="text-xs text-slate-500 mt-1">Order #{state.returnOrderId}</p>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Reason</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 transition-colors"
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Additional Notes</label>
            <textarea
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 transition-colors resize-none"
              placeholder="Describe the issue..."
              value={returnData.note}
              onChange={(e) => handleReturnDataChange("note", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Proof Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              onChange={(e) => handleReturnDataChange("images", e.target.files)}
            />
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Refund Bank Details</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Bank Name"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-900"
                value={returnData.bankName}
                onChange={(e) => handleReturnDataChange("bankName", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Account Number"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-900"
                  value={returnData.bankNumber}
                  onChange={(e) => handleReturnDataChange("bankNumber", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Account Holder"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-900"
                  value={returnData.accountHolder}
                  onChange={(e) => handleReturnDataChange("accountHolder", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setShowReturnModal(false)}
              className="flex-1 py-4 text-slate-600 font-medium bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReturn}
              className="flex-1 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors text-sm"
            >
              Submit Request
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

