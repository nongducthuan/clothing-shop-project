import React from "react";

export default function SaleTable({ sales, onShowDetail, onDelete, onEdit }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="mt-8 bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
        Active Sales List
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-sm">
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Campaign Name</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Type</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Scope</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Duration</th>
              <th className="pb-3 font-semibold px-4 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales && sales.length > 0 ? sales.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 font-bold text-gray-800">{item.name}</td>
                <td className="py-4 px-4">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-black uppercase">
                    {Number.parseFloat(item.discount_percent)}% OFF
                  </span>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => item.apply_scope !== 'all' && onShowDetail(item.id, item.apply_scope)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase transition-all shadow-sm ${
                      item.apply_scope === 'all'
                        ? 'text-gray-600 bg-gray-50 border-gray-200 cursor-default'
                        : 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {item.apply_scope}
                  </button>
                </td>
                <td className="py-4 px-4 text-xs font-medium text-slate-500">
                  {formatDate(item.start_date)} - {formatDate(item.end_date)}
                </td>
                <td className="py-4 px-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-500 bg-transparent hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold border border-transparent hover:border-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-rose-500 bg-transparent hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold border border-transparent hover:border-rose-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 italic font-light">No active sales found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

