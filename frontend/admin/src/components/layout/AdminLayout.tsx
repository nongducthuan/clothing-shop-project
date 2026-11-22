import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { io } from "socket.io-client";
import { useToast } from "@shop/shared/context/ToastContext";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import { formatCurrency } from "@shop/shared/utils/currencyUtils";
import { getConfig } from "@shop/shared/config";

/**
 * Shared layout wrapper for all admin routes.
 * Renders child admin pages via <Outlet />.
 * Listens to realtime socket events for all admin views.
 */
export default function AdminLayout() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    const socketUrl = getConfig().socketUrl || getConfig().apiUrl.replace(/\/api$/, "") || "http://localhost:5000";
    const socket = io(socketUrl, {
      withCredentials: true,
      auth: { token: localStorage.getItem("token") },
    });

    socket.emit("join_admin_room");

    socket.on("new_order", (data: { orderId: number; total: number; customerName: string }) => {
      showToast(
        t("admin.toast_new_order", `Đơn hàng mới #{orderId} từ {customerName} - {total}`)
          .replace("{orderId}", String(data.orderId))
          .replace("{customerName}", data.customerName)
          .replace("{total}", formatCurrency(data.total, language)),
        "info"
      );
    });

    socket.on("new_return_request", (data: { orderId: number; customerName: string }) => {
      showToast(
        t("admin.toast_new_return_request", `Yêu cầu đổi trả mới cho đơn #${data.orderId} từ ${data.customerName}`),
        "warning"
      );
    });
    socket.on("order_cancelled", (data: { orderId: number; customerName: string; isPaid: boolean }) => {
      const template = data.isPaid
        ? t("admin.toast_order_cancelled_paid", `Đơn hàng #{orderId} từ {customerName} đã bị khách hủy (ĐÃ THANH TOÁN - Cần hoàn tiền)`)
        : t("admin.toast_order_cancelled", `Đơn hàng #{orderId} từ {customerName} đã bị khách hủy`);
      showToast(
        template.replace("{orderId}", String(data.orderId)).replace("{customerName}", data.customerName),
        "warning"
      );
    });

    socket.on("return_cancelled", (data: { orderId: number; customerName: string }) => {
      showToast(
        t("admin.toast_return_cancelled", `Khách hàng {customerName} đã hủy yêu cầu đổi trả cho đơn #{orderId}`)
          .replace("{orderId}", String(data.orderId))
          .replace("{customerName}", data.customerName),
        "info"
      );
    });

    socket.on("payment_success", (data: { orderId: number; amount: number; method: string }) => {
      showToast(
        t("admin.toast_payment_success", `Đơn hàng #{orderId} thanh toán thành công qua {method} ({amount})`)
          .replace("{orderId}", String(data.orderId))
          .replace("{method}", data.method)
          .replace("{amount}", formatCurrency(data.amount, language)),
        "success"
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [showToast, t, language]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <AdminHeader />
      <div className="flex-1 flex flex-col lg:flex-row items-start w-full">
        <AdminSidebar />
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
