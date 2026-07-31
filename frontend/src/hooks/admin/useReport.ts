import { useState, useEffect } from "react";
import API from "../../services/apiClient";

export function useReport() {
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // Nếu đang loading hoặc lỗi thì chưa cần map data
  if (loading || !stats) {
    return { loading, stats, formatCurrency };
  }

  // Lấy dữ liệu từ Backend
  const { summary, revenue7Days, orderStatus, revenueMonths, categoryStats, returnStatuses, returnReasons } = stats;

  // Xử lý dữ liệu cho các biểu đồ
  const weeklyChartData = [
    ["Day", "Revenue", "Profit"],
    ...(revenue7Days || []).map(r => [r.day, Number(r.revenue), Number(r.profit)])
  ];

  const statusPieData = [
    ["Status", "Quantity"],
    ...(orderStatus || [])
      .filter(r => ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"].includes(r.status))
      .map(r => [r.status, r.quantity])
  ];

  const yearlyTrendData = [
    ["Month", "Revenue", "Profit"],
    ...(revenueMonths || []).map(r => [r.month_label, Number(r.revenue), Number(r.profit)])
  ];

  const categoryRevenueData = [
    ["Category", "Revenue"],
    ...(categoryStats || []).map(r => [r.category_name, Number(r.total_revenue)])
  ];

  const returnApprovalData = [
    ["Status", "Quantity"],
    ...(returnStatuses || []).map(r => [r.status, r.quantity])
  ];

  const reasonData = [
    ["Reason", "Quantity"],
    ...(returnReasons || []).map(r => [r.reason ? r.reason.charAt(0).toUpperCase() + r.reason.slice(1) : "Other", Number(r.quantity)])
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
