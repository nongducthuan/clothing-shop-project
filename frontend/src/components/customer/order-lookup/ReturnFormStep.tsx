import React from "react";

export default function ReturnFormStep({
  returnForm, setReturnForm, selectedOrder, formatCurrency,
  handleReturnSubmit, loading, onCancel
}) {
  const inputCls = "w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500";

  return (
    <form onSubmit={handleReturnSubmit} className="space-y-4">
      <div className="bg-violet-50 dark:bg-violet-900/30 p-3 rounded-lg text-xs sm:text-sm text-violet-700 dark:text-violet-300 mb-4 flex flex-wrap justify-between items-center gap-1 border border-violet-100 dark:border-violet-700">
        <span>Mã đơn: <strong>#{selectedOrder?.id}</strong></span>
        <span>Tổng tiền: <strong>{formatCurrency(selectedOrder?.total_price)}</strong></span>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Lý do đổi trả</label>
        <select
          required
          className={inputCls}
          value={returnForm.reason_code}
          onChange={(e) => setReturnForm({ ...returnForm, reason_code: e.target.value })}
        >
          <option value="">-- Chọn lý do --</option>
          <option value="Damaged">Sản phẩm bị hỏng</option>
          <option value="Wrong item">Nhận nhầm sản phẩm</option>
          <option value="Not as described">Không giống mô tả</option>
          <option value="Change mind">Đổi ý không mua nữa</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Mô tả</label>
        <textarea
          required
          rows={3}
          className={inputCls}
          placeholder="Vui lòng mô tả chi tiết vấn đề..."
          value={returnForm.description}
          onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })}
        ></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">Thông tin hoàn tiền</label>
        </div>
        <input
          type="text" placeholder="Tên ngân hàng" required
          className={inputCls}
          value={returnForm.bank_name}
          onChange={(e) => setReturnForm({ ...returnForm, bank_name: e.target.value })}
        />
        <input
          type="text" placeholder="Số tài khoản" required
          className={inputCls}
          value={returnForm.bank_acc}
          onChange={(e) => setReturnForm({ ...returnForm, bank_acc: e.target.value })}
        />
        <input
          type="text" placeholder="Tên chủ tài khoản" required
          className={`col-span-1 sm:col-span-2 p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500`}
          value={returnForm.bank_owner}
          onChange={(e) => setReturnForm({ ...returnForm, bank_owner: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
          Ảnh minh chứng
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          className="w-full text-xs sm:text-sm text-gray-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 dark:file:bg-violet-900/40 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900/60"
          onChange={(e) => setReturnForm({ ...returnForm, images: Array.from(e.target.files) })}
        />
        {returnForm.images && returnForm.images.length > 0 && (
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1">
            <i className="fa-solid fa-paperclip mr-1"></i> Đã chọn {returnForm.images.length} tệp
          </p>
        )}
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Tải lên ảnh chụp tình trạng sản phẩm.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition text-center"
        >
          Hủy
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg font-bold text-sm hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i> Đang gửi...
            </>
          ) : (
            "Gửi yêu cầu"
          )}
        </button>
      </div>
    </form>
  );
}
