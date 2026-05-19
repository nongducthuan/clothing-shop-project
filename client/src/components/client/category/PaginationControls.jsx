export default function PaginationControls({ currentPage, totalPages, onPrev, onNext }) {
  const buttonBaseClass = `px-6 py-3 rounded-full border border-slate-200 bg-white text-slate-700 font-medium transition-colors duration-300
    hover:bg-slate-900 hover:text-white hover:border-slate-900
    disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100
    disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:text-slate-400`;

  return (
    <div className="flex justify-center items-center gap-6 mt-16">
      <button disabled={currentPage === 1} onClick={onPrev} className={buttonBaseClass}>
        &larr; Previous
      </button>
      <span className="font-medium text-slate-600 text-sm tracking-wide">
        Page {currentPage} of {totalPages}
      </span>
      <button disabled={currentPage === totalPages} onClick={onNext} className={buttonBaseClass}>
        Next &rarr;
      </button>
    </div>
  );
}
