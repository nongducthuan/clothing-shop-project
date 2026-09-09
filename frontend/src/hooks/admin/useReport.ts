import { useState, useEffect } from "react";
import API from "../../services/apiClient";
import { useLanguage } from "../../context/LanguageContext";

export function useReport() {
  const { getLocalizedText, t } = useLanguage();
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

  // Nhãn tiếng Việt cho trạng thái đơn hàng / đổi trả
  const orderStatusLabel = (status) => {
    const keyMap = {
      Pending: "order_status.pending",
      Confirmed: "order_status.confirmed",
      Shipping: "order_status.shipping",
      Delivered: "order_status.delivered",
      Cancelled: "order_status.cancelled"
    };
    return keyMap[status] ? t(keyMap[status], status) : status;
  };

  const returnStatusLabel = (status) => {
    const keyMap = {
      Pending: "order_status.return_pending",
      Approved: "order_status.return_approved",
      Rejected: "order_status.return_rejected"
    };
    return keyMap[status] ? t(keyMap[status], status) : status;
  };

  // Nhãn tiếng Việt cho lý do đổi trả
  const reasonLabel = (reason) => {
    if (!reason) return "Khác";
    const reasonMap = {
      "Damaged": "Hàng bị hỏng",
      "Wrong item": "Giao nhầm hàng",
      "Change mind": "Đổi ý không mua",
      "Not as described": "Không giống mô tả",
      "Other": "Khác"
    };
    return reasonMap[reason] || (reason.charAt(0).toUpperCase() + reason.slice(1));
  };

  // Xử lý dữ liệu cho các biểu đồ
  const weeklyChartData = [
    ["Ngày", "Doanh thu", "Lợi nhuận"],
    ...(revenue7Days || []).map(r => [r.day, Number(r.revenue), Number(r.profit)])
  ];

  const statusPieData = [
    ["Trạng thái", "Số lượng"],
    ...(orderStatus || [])
      .filter(r => ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"].includes(r.status))
      .map(r => [orderStatusLabel(r.status), Number(r.quantity)])
  ];

  const yearlyTrendData = [
    ["Tháng", "Doanh thu", "Lợi nhuận"],
    ...(revenueMonths || []).map(r => [r.month_label, Number(r.revenue), Number(r.profit)])
  ];

  const categoryRevenueData = [
    ["Danh mục", "Doanh thu"],
    ...(categoryStats || []).map(r => [getLocalizedText(r, "category_name") || r.category_name, Number(r.total_revenue)])
  ];

  const returnApprovalData = [
    ["Trạng thái", "Số lượng"],
    ...(returnStatuses || []).map(r => [returnStatusLabel(r.status), Number(r.quantity)])
  ];

  const reasonData = [
    ["Lý do", "Số lượng"],
    ...(returnReasons || []).map(r => [reasonLabel(r.reason), Number(r.quantity)])
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
