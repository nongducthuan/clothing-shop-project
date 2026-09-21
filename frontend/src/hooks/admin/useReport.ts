import { useState, useEffect } from "react";
import API from "../../services/apiClient";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";

export function useReport() {
  const { getLocalizedText, getLocalizedLabel, t, language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get("/admin/stats");
        setStats(response.data);
      } catch (err) {
        console.error("Report Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount: number | string | null | undefined) => {
    return formatCurrencyUtil(amount, language);
  };

  // Nếu đang loading hoặc lỗi thì chưa cần map data
  if (loading || !stats) {
    return { loading, stats, summary: {}, formatCurrency };
  }

  // Lấy dữ liệu từ Backend
  // Backend trả summary fields trực tiếp trong stats (không phải stats.summary)
  const summary = stats;
  const { revenue7Days, orderStatus, revenueMonths, categoryStats, returnStatuses, returnReasons } = stats;

  // Xử lý dữ liệu cho các biểu đồ (header dịch qua i18n)
  const weeklyChartData = [
    [t("admin.chart_date"), t("admin.chart_revenue"), t("admin.chart_profit")],
    ...(revenue7Days || []).map(r => [r.day, Number(r.revenue), Number(r.profit)])
  ];

  const statusPieData = [
    [t("admin.chart_status"), t("admin.chart_quantity")],
    ...(orderStatus || [])
      // Gộp 3 status Return_* của orders thành 1 nhóm "Phát sinh trả hàng" để pie
      // "Vòng đời đơn hàng" còn 6 nhóm loại trừ nhau, không trùng label với chart
      // "Phê duyệt trả hàng" (nguồn return_requests) bên dưới.
      .reduce((acc: { key: string; quantity: number }[], r) => {
        const raw = String(r.status || "").replace(/_/g, " ");
        const isReturn = ["Return Requested", "Return Approved", "Return Rejected"].includes(raw);
        const key = isReturn ? "__RETURN_GROUP__" : raw;
        const found = acc.find((x) => x.key === key);
        if (found) found.quantity += Number(r.quantity);
        else acc.push({ key, quantity: Number(r.quantity) });
        return acc;
      }, [])
      .filter((r) => ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled", "__RETURN_GROUP__"].includes(r.key))
      .map((r) => [
        r.key === "__RETURN_GROUP__"
          ? t("admin.chart_return_group", "Phát sinh trả hàng")
          : getLocalizedLabel("orderStatus", r.key),
        Number(r.quantity),
      ])
  ];

  const yearlyTrendData = [
    [t("admin.chart_month"), t("admin.chart_revenue"), t("admin.chart_profit")],
    ...(revenueMonths || []).map(r => [r.month_label, Number(r.revenue), Number(r.profit)])
  ];

  const categoryRevenueData = [
    [t("admin.chart_category"), t("admin.chart_revenue")],
    ...(categoryStats || []).map(r => [getLocalizedText(r, "category_name") || r.category_name, Number(r.total_revenue)])
  ];

  const returnApprovalData = [
    [t("admin.chart_status"), t("admin.chart_quantity")],
    ...(returnStatuses || []).map(r => [getLocalizedLabel("returnStatus", r.status), Number(r.quantity)])
  ];

  const reasonData = [
    [t("admin.chart_reason"), t("admin.chart_quantity")],
    ...(returnReasons || []).map(r => [getLocalizedLabel("returnReason", r.reason) || t("admin.chart_no_data"), Number(r.quantity)])
  ];

  return {
    loading,
    stats,
    summary,
    weeklyChartData,
    statusPieData,
    yearlyTrendData,
    categoryRevenueData,
    returnApprovalData,
    reasonData,
    orderStatus,
    returnStatuses,
    formatCurrency
  };
}
