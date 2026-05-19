import React from "react";

export default function VoucherTable({ vouchers, onShowDetail, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="mt-8 bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
        <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
        Voucher Inventory
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-sm">
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Voucher Code</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Discount Type</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Scope</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Limits & Min Spend</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Duration</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vouchers && vouchers.length > 0 ? (
              vouchers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-indigo-600">
                    <span className="bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                      {item.code}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-black uppercase">
                      {Number(item.discount_percent)}% OFF
                    </span>
                    <div className="text-[11px] text-gray-500 mt-1 font-medium">
                      Max: {Number(item.max_discount_amount).toLocaleString()}đ
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => item.apply_scope !== 'all' && onShowDetail(item.id, item.apply_scope)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase transition-all shadow-sm ${
                        item.apply_scope === 'all'
                          ? 'text-gray-600 bg-gray-50 border-gray-200 cursor-default'
                          : 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
                      }`}
                    >
                      {item.apply_scope}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs text-gray-600">
                      Min Spend: <span className="font-bold text-gray-800">{Number(item.min_order_value).toLocaleString()}đ</span>
                    </div>
                    <div className="text-[11px] text-pink-500 font-bold mt-1">
                      {item.usage_limit} uses remaining
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-500 leading-relaxed">
                    {formatDate(item.start_date)} - {formatDate(item.end_date)}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => onDelete(item.id)}
                      className="bg-transparent text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all text-sm font-bold border border-transparent hover:border-rose-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-400 italic font-light">
                  Voucher list is currently empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
