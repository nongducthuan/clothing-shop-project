import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/currencyUtils";
import { formatDisplayDateTime } from "../../../utils/dateUtils";
import { PaymentBadge } from "../../common/PaymentBadge";
import type { AdminMembership, AdminUser, UserOrderSummary } from "../../../hooks/admin/useUserManager";

interface UserDetailModalProps {
  detailModal: {
    isOpen: boolean;
    loading: boolean;
    user: AdminUser | null;
    orders: UserOrderSummary[];
  };
  memberships: AdminMembership[];
  onClose: () => void;
}

const getInitials = (name?: string): string => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const statusColor = (status: string): string => {
  switch (status) {
    case "Delivered":
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
    case "Cancelled":
    case "Return_Rejected":
      return "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400";
    case "Return_Approved":
      return "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400";
    default:
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400";
  }
};

export default function UserDetailModal({ detailModal, memberships, onClose }: UserDetailModalProps) {
  const { t, language, getLocalizedText, getOrderStatusLabel } = useLanguage();

  if (!detailModal.isOpen) return null;

  const user = detailModal.user;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-200/80 dark:border-slate-700 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-sm ${
                user?.role === "admin" ? "bg-violet-500" : "bg-sky-500"
              }`}
            >
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 m-0 truncate">
                {user?.name || t("admin.user_detail")}
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 m-0 truncate">{user?.email}</p>
              {user?.phone ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 m-0">{user.phone}</p>
              ) : null}
              {user?.created_at ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 m-0 flex items-center gap-1.5">
                  <i className="fa-regular fa-calendar-plus"></i>
                  {t("admin.joined_date")}: {formatDisplayDateTime(user.created_at).split(" ")[0]}
                </p>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300"
            title={t("common.close")}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {detailModal.loading ? (
          <div className="py-16 text-center text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
            <p className="mt-3 font-medium">{t("common.loading")}</p>
          </div>
        ) : (
          <>
            {/* Thông tin nhanh */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">{t("admin.role")}</p>
                <p className="font-extrabold text-slate-800 dark:text-slate-100 m-0">
                  {user?.role === "admin" ? t("admin.role_admin") : t("admin.role_customer")}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">
                  {t("admin.membership_tier")}
                </p>
                <p className="font-extrabold text-slate-800 dark:text-slate-100 m-0 truncate">
                  {/* Fallback tạm cho user cũ đang null (chưa chạy migration):
                      hiển thị "Thường" thay vì "Chưa có hạng". Sau khi DB đã
                      backfill, user.membership luôn có nên không vào nhánh này. */}
                  {user?.membership
                    ? getLocalizedText(user.membership as unknown as Record<string, unknown>, "name")
                    : getLocalizedText(
                        (memberships.find((m) => Number(m.min_spending) === 0) || memberships[0] || {}) as unknown as Record<string, unknown>,
                        "name"
                      ) || t("admin.no_membership")}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">
                  {t("admin.orders_count")}
                </p>
                <p className="font-extrabold text-slate-800 dark:text-slate-100 m-0">
                  {user?._count?.orders ?? detailModal.orders.length}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">
                  {t("admin.total_spent")}
                </p>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 m-0 whitespace-nowrap">
                  {formatCurrency(user?.total_spent, language)}
                </p>
              </div>
            </div>
            {/* Lịch sử mua gần đây (tối đa 10 đơn) */}
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-clock-rotate-left text-violet-500 dark:text-violet-400"></i>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 m-0 text-sm uppercase tracking-wider">
                {t("admin.recent_orders")}
              </h4>
            </div>

            {detailModal.orders.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600">
                <i className="fa-solid fa-receipt text-slate-300 dark:text-slate-500 text-2xl"></i>
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm m-0 mt-2">
                  {t("admin.no_orders_yet")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-200/70 dark:border-slate-700 rounded-2xl overflow-hidden">
                {detailModal.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 m-0">#{order.id}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 m-0 sm:truncate">
                        {formatDisplayDateTime(order.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:gap-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap sm:px-3 ${statusColor(order.status)}`}
                      >
                        {getOrderStatusLabel(order.status)}
                      </span>
                      <PaymentBadge method={order.payment_method} showText={false} />
                      <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap sm:text-base">
                        {formatCurrency(order.total_price, language)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
