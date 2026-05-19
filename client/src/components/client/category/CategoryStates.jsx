export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-slate-100 h-[400px] rounded-3xl animate-pulse"></div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="text-center py-24 bg-slate-50 rounded-[2rem] border border-slate-100">
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <i className="fa-solid fa-box-open text-2xl text-slate-300"></i>
      </div>
      <p className="text-slate-600 text-lg font-medium">No matching products found.</p>
      <button
        onClick={() => window.history.back()}
        className="mt-6 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors"
      >
        &larr; Go Back
      </button>
    </div>
  );
}
