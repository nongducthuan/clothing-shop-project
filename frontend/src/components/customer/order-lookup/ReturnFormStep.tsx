import React from "react";

export default function ReturnFormStep({
  returnForm, setReturnForm, selectedOrder, formatCurrency,
  handleReturnSubmit, loading, onCancel
}) {
  return (
    <form onSubmit={handleReturnSubmit} className="space-y-4">
      <div className="bg-violet-50 p-3 rounded-lg text-xs sm:text-sm text-violet-700 mb-4 flex flex-wrap justify-between items-center gap-1">
        <span>Order ID: <strong>#{selectedOrder?.id}</strong></span>
        <span>Total: <strong>{formatCurrency(selectedOrder?.total_price)}</strong></span>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Return</label>
        <select
          required
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          value={returnForm.reason_code}
          onChange={(e) => setReturnForm({ ...returnForm, reason_code: e.target.value })}
        >
          <option value="">-- Select a reason --</option>
          <option value="Damaged">Damaged Product</option>
          <option value="Wrong item">Wrong Item Received</option>
          <option value="Not as described">Not as Described</option>
          <option value="Change mind">Change of Mind</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
        <textarea
          required
          rows={3}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Please describe the issue in detail..."
          value={returnForm.description}
          onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })}
        ></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 uppercase">Refund Bank Info</label>
        </div>
        <input
          type="text" placeholder="Bank Name" required
          className="p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
          value={returnForm.bank_name}
          onChange={(e) => setReturnForm({ ...returnForm, bank_name: e.target.value })}
        />
        <input
          type="text" placeholder="Account Number" required
          className="p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
          value={returnForm.bank_acc}
          onChange={(e) => setReturnForm({ ...returnForm, bank_acc: e.target.value })}
        />
        <input
          type="text" placeholder="Account Holder Name" required
          className="col-span-1 sm:col-span-2 p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
          value={returnForm.bank_owner}
          onChange={(e) => setReturnForm({ ...returnForm, bank_owner: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Proof Image
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          className="w-full text-xs sm:text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          onChange={(e) => setReturnForm({ ...returnForm, images: Array.from(e.target.files) })}
        />
        {returnForm.images && returnForm.images.length > 0 && (
          <p className="text-xs text-violet-600 font-medium mt-1">
            <i className="fa-solid fa-paperclip mr-1"></i> {returnForm.images.length} file(s) selected
          </p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">Upload photos of the product condition.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50 transition text-center"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg font-bold text-sm hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i> Submitting...
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </div>
    </form>
  );
}

