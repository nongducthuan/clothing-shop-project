import React from "react";
import EmptyState from "../../common/EmptyState";

export default function VoucherTable({ vouchers, onShowDetail, onDelete, onEdit }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-6 border border-slate-200/80 dark:border-slate-700">
      <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2 m-0 leading-none">
        <div className="w-2 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full"></div>
        Voucher Inventory
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-400 text-sm">
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Voucher Code</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Discount Type</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Scope</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Limits & Min Spend</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Duration</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {vouchers && vouchers.length > 0 ? (
              vouchers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                      {item.code}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[11px] font-black uppercase border border-emerald-200 dark:border-emerald-900/50">
                      {Number(item.discount_percent)}% OFF
                    </span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Max: {Number(item.max_discount_amount).toLocaleString()}đ
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => item.apply_scope !== 'all' && onShowDetail(item.id, item.apply_scope)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase transition-all shadow-xs ${
                        item.apply_scope === 'all'
                          ? 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-default'
                          : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/80'
                      }`}
                    >
                      {item.apply_scope}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Min Spend: <span className="font-bold text-slate-800 dark:text-slate-200">{Number(item.min_order_value).toLocaleString()}đ</span>
                    </div>
                    <div className="text-[11px] text-pink-500 dark:text-pink-400 font-bold mt-1">
                      {item.usage_limit === null ? "Unlimited uses" : `${item.usage_limit - (item.used_count || 0)} uses remaining`}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {formatDate(item.start_date)} - {formatDate(item.end_date)}
                  </td>
                  <td className="py-4 px-4 flex justify-center items-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="bg-transparent text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="bg-transparent text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12">
                  <EmptyState 
                    title="No Vouchers Found"
                    subtitle="There are currently no vouchers available in the system."
                    icon="fa-ticket"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

