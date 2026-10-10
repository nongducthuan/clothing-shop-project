import { useLanguage } from "../../../../context/LanguageContext";
import { balanceReturnItemsRefund } from "../../../../utils/orderUtils";
import type { ProfileOrder } from "../../../../hooks/customer/profileTypes";

const OrderDetailReturnInfo = ({ order, formatCurrency, getImgUrl }: {
  order: ProfileOrder; formatCurrency: (amount: number | string | null | undefined) => string;
  getImgUrl: (path: string | null | undefined) => string;
}) => {
  const { t, getLocalizedText, getLocalizedLabel } = useLanguage();
  return (
    <>
    {/* Thông tin yêu cầu đổi trả (đặt trên cùng, đồng bộ với admin & tra cứu guest) */}
    {order.return_request && (
      <div className="bg-amber-50/60 dark:bg-amber-950/40 p-3.5 sm:p-5 rounded-xl border border-amber-200/70 dark:border-amber-900/50 space-y-3 text-xs sm:text-sm">
        <div className="flex justify-between items-center">
          <p className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            {t('order_details.return_summary', 'Thông tin yêu cầu đổi trả')}
          </p>
          {order.return_request.reason_code && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              {getLocalizedLabel("returnReason", order.return_request.reason_code) || order.return_request.reason_code}
            </span>
          )}
        </div>

        {order.return_request.items && order.return_request.items.length > 0 && (
          <div className="space-y-1.5 border-t border-amber-200/60 dark:border-amber-900/50 pt-2">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('order_details.returned_items_title', 'Sản phẩm yêu cầu trả:')}</p>
            {balanceReturnItemsRefund(order.return_request.items, order.return_request.refund_amount).map((ri, rIdx: number) => {
              const pName = String(getLocalizedText(ri, "product_name") || ri.product_name || `Sản phẩm #${ri.order_item_id}`);
              const cName = String(getLocalizedText(ri, "color_name") || ri.color_name || "");
              const originalItem = order.items?.find((item) => item.id === ri.order_item_id);
              const orderItemDetail = ri.order_item;
              const rawImg = originalItem?.image || originalItem?.image_url || originalItem?.color_image || originalItem?.product_image || orderItemDetail?.color?.image_url || orderItemDetail?.product?.image_url || ri.image || ri.image_url || ri.color_image || ri.product_image;
              const safeImgSrc = typeof rawImg === "string" ? getImgUrl(rawImg) : "https://via.placeholder.com/150?text=No+Image";

              return (
                <div key={rIdx} className="flex justify-between items-start text-xs bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30 gap-2.5">
                  <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-600 bg-white dark:bg-slate-700">
                    <img
                      src={safeImgSrc}
                      alt={pName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2"
                        title={pName}
                      >{pName}</span>
                      {ri.is_gift && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0">
                          <i className="fa-solid fa-gift" />
                          {t("lookup.gift_item_badge", "Quà tặng")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {cName && <span className="bg-white/80 dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{t('order_details.color_label', 'Màu')}: {cName}</span>}
                      {ri.size != null && String(ri.size).length > 0 && <span className="bg-white/80 dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{t('order_details.size_label', 'Size')}: {String(ri.size)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center text-right shrink-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ri.is_gift ? formatCurrency(0) : formatCurrency(ri.refund_amount)}
                    </span>
                    {ri.refund_amount != null && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                        {ri.is_gift ? `${formatCurrency(0)} × ${ri.return_quantity}` : `${formatCurrency(Math.round(Number(ri.refund_amount) / Number(ri.return_quantity)))} × ${ri.return_quantity}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center border-t border-amber-200/60 dark:border-amber-900/50 pt-2">
          <div>
            <span className="text-slate-600 dark:text-slate-400 font-medium block">{t('order_details.estimated_refund', 'Số tiền hoàn dự kiến:')}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block">{t('lookup.no_shipping_refund_note', '*Không hoàn lại phí vận chuyển')}</span>
          </div>
          <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
            {formatCurrency(order.return_request.refund_amount || 0)}
          </span>
        </div>

        {order.return_request.admin_response ? (
          <div className="mt-2 bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block mb-0.5">
              {t('order_details.admin_response', 'Phản hồi từ Admin:')}
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {["Approved", "Rejected", "Rejected by admin", "Manually approved by admin", "Manually rejected by admin"].includes(order.return_request.admin_response)
                ? t(`api_msg.${order.return_request.admin_response}`, order.return_request.admin_response)
                : order.return_request.admin_response}
            </p>
          </div>
        ) : order.return_request.status === "Approved" ? (
          <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-check"></i>
              {t('order_details.return_approved_note', 'Yêu cầu đổi trả đã được chấp nhận. Shop sẽ liên hệ để hoàn tiền.')}
            </p>
          </div>
        ) : null}
      </div>
    )}
    </>
  );
};

export default OrderDetailReturnInfo;
