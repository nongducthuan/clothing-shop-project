export default function PaginationControls({ currentPage, totalPages, onPrev, onNext }) {
  const buttonBaseClass = `px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium transition-colors duration-300
    hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white hover:border-slate-900 dark:hover:border-slate-600
    disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-slate-800
    disabled:cursor-not-allowed disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/40 disabled:hover:text-slate-400 dark:disabled:hover:text-slate-600`;

  return (
    <div className="flex justify-center items-center gap-6 mt-16">
      <button disabled={currentPage === 1} onClick={onPrev} className={buttonBaseClass}>
        &larr; Previous
      </button>
      <span className="font-medium text-slate-600 dark:text-slate-400 text-sm tracking-wide">
        Page {currentPage} of {totalPages}
      </span>
      <button disabled={currentPage === totalPages} onClick={onNext} className={buttonBaseClass}>
        Next &rarr;
      </button>
    </div>
  );
}
