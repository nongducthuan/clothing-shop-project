import { useState, useEffect } from "react";
import API from "../../services/apiClient";
import { useLanguage } from "../../context/LanguageContext";

export function useReport() {
  const { getLocalizedText, getLocalizedLabel, t } = useLanguage();
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
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
      .filter(r => ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"].includes(r.status))
      .map(r => [getLocalizedLabel("orderStatus", r.status), Number(r.quantity)])
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
