export default function GiftItem({ gift, detail, helpers }) {
  const { formatPrice, getImageUrl } = helpers;

  if (!detail) {
    return <div className="animate-pulse h-24 bg-slate-50 rounded-2xl"></div>;
  }

  return (
    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
      <div className="w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-sm">
        <img src={getImageUrl(detail.image_url)} alt={detail.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-grow z-10">
        <h4 className="font-medium text-slate-900 text-sm leading-tight">{detail.name}</h4>
        <span className="inline-flex items-center gap-1 bg-white text-slate-600 border border-slate-200 text-[10px] font-bold mt-2 px-2 py-1 rounded-md uppercase tracking-widest">
          <i className="fa-solid fa-gift text-rose-500"></i> {gift.promoName}
        </span>
      </div>

      <div className="text-right hidden sm:block z-10 pr-4">
        <span className="text-xs text-slate-400 line-through block">{formatPrice(detail.price)}</span>
        <span className="font-medium text-slate-900">Free</span>
      </div>

      <div className="font-medium text-slate-900 z-10 pr-2">
        x{gift.quantity}
      </div>
    </div>
  );
}
