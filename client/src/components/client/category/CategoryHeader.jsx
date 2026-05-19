export default function CategoryHeader({ categoryName, productCount }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-slate-100 pb-6">
      <h1 className="text-4xl sm:text-5xl font-medium text-slate-900 tracking-tight capitalize">
        {categoryName}
      </h1>
      <span className="text-slate-500 mt-4 md:mt-0 font-medium">
        {productCount > 0 ? `${productCount} products available` : "Fetching products..."}
      </span>
    </div>
  );
}
