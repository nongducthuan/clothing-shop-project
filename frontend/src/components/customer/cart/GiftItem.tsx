export default function GiftItem({ gift, detail, helpers, onSelectVariant }) {
  const { formatPrice, getImageUrl } = helpers;

  if (!detail) {
    return <div className="animate-pulse h-24 bg-slate-50 rounded-2xl"></div>;
  }

  const currentColor = detail.colors?.find(c => c.id === gift.color_id) || detail.colors?.[0];
  const currentSize = currentColor?.sizes?.find(s => s.id === gift.size_id) || currentColor?.sizes?.[0];
  const colorImageUrl = currentColor?.image_url || detail.image_url;

  const handleColorChange = (e) => {
    const newColorId = Number(e.target.value);
    const newColorObj = detail.colors?.find(c => c.id === newColorId);
    const availableSize = newColorObj?.sizes?.find(s => s.stock > 0) || newColorObj?.sizes?.[0];
    if (onSelectVariant) {
      onSelectVariant(gift.giftProductId, newColorId, availableSize?.id || null);
    }
  };

  const handleSizeChange = (e) => {
    const newSizeId = Number(e.target.value);
    if (onSelectVariant) {
      onSelectVariant(gift.giftProductId, currentColor?.id || null, newSizeId);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden group border border-slate-200/60 shadow-sm">
      <div className="w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100">
        <img src={getImageUrl(colorImageUrl)} alt={detail.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-grow z-10 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-slate-900 text-sm leading-tight">{detail.name}</h4>
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <i className="fa-solid fa-gift text-rose-500"></i> Free Gift ({gift.promoName})
          </span>
        </div>

        {/* COLOR & SIZE SELECTORS FOR FREE GIFT */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {detail.colors?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-400">Color:</span>
              <select
                value={currentColor?.id || ""}
                onChange={handleColorChange}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-400 font-medium cursor-pointer shadow-sm"
              >
                {detail.colors.map(c => (
                  <option key={c.id} value={c.id}>{c.color_name}</option>
                ))}
              </select>
            </div>
          )}

          {currentColor?.sizes?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-400">Size:</span>
              <select
                value={currentSize?.id || ""}
                onChange={handleSizeChange}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-400 font-medium cursor-pointer shadow-sm"
              >
                {currentColor.sizes.map(s => (
                  <option key={s.id} value={s.id} disabled={s.stock === 0}>
                    {s.size} {s.stock === 0 ? "(Out of stock)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="text-right hidden sm:block z-10 pr-4">
        <span className="text-xs text-slate-400 line-through block">{formatPrice(detail.price)}</span>
        <span className="font-bold text-emerald-600 text-sm">Free</span>
      </div>

      <div className="font-semibold text-slate-700 z-10 pr-2 self-end sm:self-center bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs shadow-sm">
        x{gift.quantity}
      </div>
    </div>
  );
}
