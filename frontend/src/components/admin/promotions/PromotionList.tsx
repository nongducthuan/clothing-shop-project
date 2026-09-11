import React from "react";
import EmptyState from "../../common/EmptyState";

export default function PromotionList({ state, actions, helpers }) {
  const { filteredPromotions, searchTerm } = state;
  const { handleEditClick, handleDeleteClick, setSearchTerm } = actions;
  const { getProductName, formatDateDisplay } = helpers;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Danh sách chiến dịch</h2>
        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full shadow-sm">
          {filteredPromotions.length} chiến dịch
        </span>
      </div>

      <div className="relative w-full md:w-80 mb-6">
        <input
          type="text"
          placeholder="Tìm chiến dịch..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-full text-sm focus:ring-2 focus:ring-purple-500 transition-all shadow-sm outline-none text-slate-800 dark:text-slate-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <i className="fa-solid fa-magnifying-glass text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"></i>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPromotions.length > 0 ? (
          filteredPromotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700 hover:shadow-md transition-all group flex flex-col sm:flex-row gap-6 relative overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${promo.status === "active" ? "bg-emerald-400" : "bg-rose-400"}`}
              ></div>

              <div className="flex-1 w-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                      {promo.name}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider whitespace-nowrap ml-2 ${promo.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"}`}
                  >
                    {promo.status === "active" ? "Đang chạy" : "Không hoạt động"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-4">
                  <div className="bg-slate-50/50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-600/60 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase min-w-[30px]">
                      Mua
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate ml-2 text-right">
                      <span className="text-indigo-600 dark:text-indigo-400 font-black mr-1">
                        {promo.buy_quantity}x
                      </span>
                      {getProductName(promo.buy_product_id)}
                    </span>
                  </div>
                  <div className="bg-purple-50/50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-purple-400 dark:text-purple-400 uppercase min-w-[30px]">
                      Tặng
                    </span>
                    <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm truncate ml-2 text-right">
                      <span className="text-purple-600 dark:text-purple-400 font-black mr-1">
                        {promo.gift_quantity}x
                      </span>
                      {getProductName(promo.gift_product_id)}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-600/60 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                      Thời gian
                    </span>
                    <span className="font-medium text-slate-600 dark:text-slate-300 text-xs">
                      {formatDateDisplay(promo.start_date)} -{" "}
                      {formatDateDisplay(promo.end_date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200/80 dark:border-slate-600/60 pt-4 sm:pt-0 sm:pl-4">
                <button
                  onClick={() => handleEditClick(promo)}
                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                  title="Chỉnh sửa"
                >
                  <i className="fa-solid fa-pen text-lg"></i>
                </button>
                <button
                  onClick={() => handleDeleteClick(promo.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                  title="Xóa"
                >
                  <i className="fa-solid fa-trash text-lg"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 border-dashed">
            <EmptyState 
              title="Chưa có chiến dịch"
              subtitle="Hiện chưa có chiến dịch nào phù hợp với tìm kiếm của bạn."
              icon="fa-gift"
            />
          </div>
        )}
      </div>
    </div>
  );
}
