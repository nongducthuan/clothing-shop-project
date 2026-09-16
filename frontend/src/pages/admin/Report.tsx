import { Chart } from "react-google-charts";
import { useReport } from "../../hooks/admin/useReport";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

/** Bảng màu đồng bộ cho các trạng thái */
const STATUS_COLORS = {
  'Pending': '#ffc107',
  'Confirmed': '#17a2b8',
  'Shipping': '#3b82f6',
  'Delivered': '#10b981',
  'Cancelled': '#ef4444',
  'Approved': '#10b981',
  'Rejected': '#ef4444',
};

export default function Report() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Color variables for charts based on theme
  const textColor = isDark ? '#e2e8f0' : '#334155';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  // Chỉ việc gọi hook và lấy data ra dùng
  const {
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
  } = useReport();

  // Modern Loading Pill UI
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500"></i>
          <p className="font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase text-sm">{t("admin.analyzing_data")}</p>
        </div>
      </div>
    );
  }

  // Modern Error State
  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-rose-100 dark:border-slate-700 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center text-2xl mb-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{t("admin.connection_error")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("admin.failed_to_load_report")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1 font-sans">

      {/* Pill UI Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3.5 rounded-full shadow-sm border border-slate-200/80 dark:border-slate-700">
          <div className="w-3 h-3 flex-shrink-0 bg-indigo-500 rounded-full animate-pulse"></div>
          <h2 className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-100 uppercase tracking-widest m-0 leading-none">
            {t("admin.report_management")}
          </h2>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto space-y-10">

        {/* --- PHẦN 1: CÁC THẺ THỐNG KÊ NHANH --- */}
        <div className="space-y-8">
          <section>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-6 border border-indigo-100 dark:border-indigo-800/50">
              <i className="fa-solid fa-calendar-week text-indigo-500 text-xs"></i>
              <h3 className="text-[10px] font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-widest m-0 leading-none">{t("admin.overview_7days")}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title={t("admin.stat_orders")} value={summary?.weeklyOrders ?? 0} color="text-indigo-600 dark:text-indigo-400" />
              <StatCard title={t("admin.stat_revenue")} value={formatCurrency(summary?.weeklyRevenue ?? 0)} color="text-amber-500 dark:text-amber-400" />
              <StatCard title={t("admin.stat_profit")} value={formatCurrency(summary?.weeklyProfit ?? 0)} color="text-emerald-500 dark:text-emerald-400" />
              <StatCard title={t("admin.stat_sold")} value={summary?.productsSoldWeek ?? 0} color="text-rose-500 dark:text-rose-400" />
            </div>
          </section>

          <section>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-full mb-6 border border-purple-100 dark:border-purple-800/50">
              <i className="fa-solid fa-calendar-days text-purple-500 text-xs"></i>
              <h3 className="text-[10px] font-black text-purple-800 dark:text-purple-300 uppercase tracking-widest m-0 leading-none">{t("admin.overview_30days")}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title={t("admin.stat_orders")} value={summary?.monthlyOrders ?? 0} color="text-emerald-600 dark:text-emerald-400" />
              <StatCard title={t("admin.stat_revenue")} value={formatCurrency(summary?.monthlyRevenue ?? 0)} color="text-purple-600 dark:text-purple-400" />
              <StatCard title={t("admin.stat_profit")} value={formatCurrency(summary?.monthlyProfit ?? 0)} color="text-teal-600 dark:text-teal-400" />
              <StatCard title={t("admin.stat_sold")} value={summary?.productsSoldMonth ?? 0} color="text-blue-600 dark:text-blue-400" />
            </div>
          </section>
        </div>

        {/* --- PHẦN 2: PHÂN TÍCH BIỂU ĐỒ --- */}
        <div className="space-y-8">

          {/* Hàng 1: Doanh thu 7 ngày (full width) */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm rounded-[2rem] border border-slate-200/80 dark:border-slate-700 flex flex-col justify-center overflow-hidden">
            <Chart
              chartType="ColumnChart"
              width="100%" height="350px"
              data={weeklyChartData.length > 1 ? weeklyChartData : [[t("admin.chart_date"), t("admin.chart_revenue"), t("admin.chart_profit")], [t("admin.chart_no_data"), 0, 0]]}
              options={{
                title: t("admin.chart_daily_performance", "Xu hướng hiệu suất hàng ngày"),
                backgroundColor: "transparent",
                titleTextStyle: { color: textColor, fontSize: 16, bold: true },
                series: { 0: { color: '#6366f1' }, 1: { color: '#10b981' } },
                chartArea: { width: '90%', height: '70%' },
                legend: { position: "top", textStyle: { color: subTextColor } },
                hAxis: { textStyle: { color: subTextColor } },
                vAxis: { textStyle: { color: subTextColor }, format: 'short' }
              }}
            />
          </div>

          {/* Hàng 2: Xu hướng 12 tháng (trend dài hạn, full width) */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm rounded-[2rem] border border-slate-200/80 dark:border-slate-700 flex flex-col justify-center overflow-hidden">
            <Chart
              chartType="LineChart"
              width="100%" height="350px"
              data={yearlyTrendData.length > 1 ? yearlyTrendData : [[t("admin.chart_month"), t("admin.chart_revenue"), t("admin.chart_profit")], [t("admin.chart_no_data"), 0, 0]]}
              options={{
                title: t("admin.chart_year_trend", "Xu hướng phát triển 12 tháng"),
                backgroundColor: "transparent",
                titleTextStyle: { color: textColor, fontSize: 16, bold: true },
                curveType: "function",
                series: { 0: { color: '#8b5cf6', lineWidth: 4 }, 1: { color: '#14b8a6', lineWidth: 4 } },
                legend: { position: "top", textStyle: { color: subTextColor } },
                chartArea: { width: '90%', height: '70%' },
                hAxis: { title: t("admin.chart_month_axis", "Tháng"), titleTextStyle: { color: subTextColor, italic: false }, textStyle: { color: subTextColor } },
                vAxis: { format: 'short', textStyle: { color: subTextColor } }
              }}
            />
          </div>

          {/* Hàng 3: 4 biểu đồ tròn — lưới 2x2 (phân tích cơ cấu & vận hành) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={t("admin.chart_revenue_category", "Doanh thu theo danh mục")}>
              <Chart
                chartType="PieChart"
                width="100%" height="300px"
                data={categoryRevenueData.length > 1 ? categoryRevenueData : [[t("admin.chart_category"), t("admin.chart_revenue")], [t("admin.chart_no_data"), 1]]}
                options={{
                  backgroundColor: "transparent",
                  pieHole: 0.4,
                  colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"],
                  legend: { position: "bottom", textStyle: { color: subTextColor } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </ChartCard>

            <ChartCard title={t("admin.chart_order_ratio", "Vòng đời đơn hàng")}>
              <Chart
                chartType="PieChart"
                width="100%" height="300px"
                data={statusPieData.length > 1 ? statusPieData : [[t("admin.chart_status"), t("admin.chart_quantity")], [t("admin.chart_no_data"), 1]]}
                options={{
                  backgroundColor: "transparent",
                  colors: (orderStatus || []).map(r => STATUS_COLORS[r.status] || "#cbd5e1"),
                  pieHole: 0.5,
                  legend: { position: "bottom", textStyle: { color: subTextColor } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </ChartCard>

            <ChartCard title={t("admin.chart_return_ratio", "Phê duyệt trả hàng")}>
              <Chart
                chartType="PieChart"
                width="100%" height="300px"
                data={returnApprovalData.length > 1 ? returnApprovalData : [[t("admin.chart_status"), t("admin.chart_quantity")], [t("admin.chart_no_data"), 1]]}
                options={{
                  backgroundColor: "transparent",
                  colors: (returnStatuses || []).map(r => STATUS_COLORS[r.status] || "#fb923c"),
                  pieHole: 0.5,
                  legend: { position: "bottom", textStyle: { color: subTextColor } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </ChartCard>

            <ChartCard title={t("admin.chart_return_reason", "Lý do trả hàng")}>
              <Chart
                chartType="PieChart"
                width="100%" height="300px"
                data={reasonData.length > 1 ? reasonData : [[t("admin.chart_reason"), t("admin.chart_quantity")], [t("admin.chart_no_data"), 1]]}
                options={{
                  backgroundColor: "transparent",
                  colors: ["#94a3b8", "#ef4444", "#f59e0b", "#3b82f6"],
                  pieHole: 0.5,
                  legend: { position: "bottom", textStyle: { color: subTextColor } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </ChartCard>
          </div>

        </div>
      </div>
    </div>
  );
}

/** Component thẻ biểu đồ con */
function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 shadow-sm rounded-[2rem] border border-slate-200/80 dark:border-slate-700 flex flex-col items-center hover:border-indigo-100 dark:hover:border-indigo-700 transition-colors duration-300">
      <h4 className="text-center font-bold text-slate-600 dark:text-slate-300 mb-4 uppercase text-[10px] tracking-widest bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-full w-fit">
        {title}
      </h4>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

/** Component thẻ thống kê */
function StatCard({ title, value, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm rounded-[2rem] border border-slate-200/80 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-700 flex flex-col justify-center gap-2">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className={`text-lg sm:text-xl xl:text-2xl font-black ${color} truncate`} title={String(value)}>{value}</h3>
    </div>
  );
}
