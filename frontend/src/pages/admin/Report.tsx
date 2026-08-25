import { Chart } from "react-google-charts";
import { useReport } from "../../hooks/admin/useReport";

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
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500"></i>
          <p className="font-bold text-slate-500 tracking-widest uppercase text-sm">Analyzing Data...</p>
        </div>
      </div>
    );
  }

  // Modern Error State
  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-2xl mb-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest">Connection Error</h3>
          <p className="text-sm text-slate-500">Failed to load report data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-4 md:p-8 font-sans">

      {/* Pill UI Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="inline-flex items-center gap-3 bg-white px-6 py-3.5 rounded-full shadow-sm border border-gray-100">
          <div className="w-3 h-3 flex-shrink-0 bg-indigo-500 rounded-full animate-pulse"></div>
          <h2 className="text-sm sm:text-base font-black text-slate-700 uppercase tracking-widest m-0 leading-none">
            Business Performance <span className="text-indigo-500">Report</span>
          </h2>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto space-y-10">

        {/* --- PHẦN 1: CÁC THẺ THỐNG KÊ NHANH --- */}
        <div className="space-y-8">
          <section>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mb-6 border border-indigo-100">
              <i className="fa-solid fa-calendar-week text-indigo-500 text-xs"></i>
              <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">7-Day Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Orders" value={summary?.weeklyOrders ?? 0} color="text-indigo-600" />
              <StatCard title="Revenue" value={formatCurrency(summary?.weeklyRevenue ?? 0)} color="text-amber-500" />
              <StatCard title="Profit" value={formatCurrency(summary?.weeklyProfit ?? 0)} color="text-emerald-500" />
              <StatCard title="Units Sold" value={summary?.productsSoldWeek ?? 0} color="text-rose-500" />
            </div>
          </section>

          <section>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6 border border-purple-100">
              <i className="fa-solid fa-calendar-days text-purple-500 text-xs"></i>
              <h3 className="text-[10px] font-black text-purple-800 uppercase tracking-widest">30-Day Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Orders" value={summary?.monthlyOrders ?? 0} color="text-emerald-600" />
              <StatCard title="Revenue" value={formatCurrency(summary?.monthlyRevenue ?? 0)} color="text-purple-600" />
              <StatCard title="Profit" value={formatCurrency(summary?.monthlyProfit ?? 0)} color="text-teal-600" />
              <StatCard title="Units Sold" value={summary?.productsSoldMonth ?? 0} color="text-blue-600" />
            </div>
          </section>
        </div>

        {/* --- PHẦN 2: PHÂN TÍCH BIỂU ĐỒ --- */}
        <div className="space-y-8">

          {/* Hàng 1: Doanh thu 7 ngày & Category */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 md:p-8 shadow-sm rounded-[2rem] border border-gray-100 flex flex-col justify-center overflow-hidden">
              <Chart
                chartType="ColumnChart"
                width="100%" height="300px"
                data={weeklyChartData}
                options={{
                  title: "Daily Performance Trends",
                  titleTextStyle: { color: '#334155', fontSize: 14, bold: true },
                  series: { 0: { color: '#6366f1' }, 1: { color: '#10b981' } },
                  chartArea: { width: '85%', height: '70%' },
                  legend: { position: "top", textStyle: { color: '#64748b' } },
                  hAxis: { textStyle: { color: '#94a3b8' } },
                  vAxis: { textStyle: { color: '#94a3b8' }, format: 'short' }
                }}
              />
            </div>

            <div className="bg-white p-6 md:p-8 shadow-sm rounded-[2rem] border border-gray-100 flex flex-col justify-center overflow-hidden">
              <Chart
                chartType="PieChart"
                width="100%" height="300px"
                data={categoryRevenueData.length > 1 ? categoryRevenueData : [["N/A", "N/A"], ["No Data", 1]]}
                options={{
                  title: "Revenue by Category",
                  titleTextStyle: { color: '#334155', fontSize: 14, bold: true },
                  pieHole: 0.4,
                  colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"],
                  legend: { position: "bottom", textStyle: { color: '#64748b' } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </div>
          </div>

          {/* Hàng 2: Order Status & Return Status & Return Reason */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="📦 Order Lifecycle">
              <Chart
                chartType="PieChart"
                width="100%" height="250px"
                data={statusPieData}
                options={{
                  colors: (orderStatus || []).map(r => STATUS_COLORS[r.status] || "#cbd5e1"),
                  pieHole: 0.5,
                  legend: { position: "bottom", textStyle: { color: '#64748b' } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </ChartCard>

            <ChartCard title="⚖️ Return Approval">
              <Chart
                chartType="PieChart"
                width="100%" height="250px"
                data={returnApprovalData.length > 0 ? returnApprovalData : [["None", 1]]}
                options={{
                  colors: (returnStatuses || []).map(r => STATUS_COLORS[r.status] || "#fb923c"),
                  pieHole: 0.5,
                  legend: { position: "bottom", textStyle: { color: '#64748b' } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </ChartCard>

            <ChartCard title="⚠️ Return Reasons">
              <Chart
                chartType="PieChart"
                width="100%" height="250px"
                data={reasonData.length > 0 ? reasonData : [["None", 1]]}
                options={{
                  colors: ["#94a3b8", "#ef4444", "#f59e0b", "#3b82f6"],
                  pieHole: 0.5,
                  legend: { position: "bottom", textStyle: { color: '#64748b' } },
                  chartArea: { width: '90%', height: '75%' }
                }}
              />
            </ChartCard>
          </div>

          {/* Hàng 3: Biểu đồ Năm */}
          <div className="bg-white p-6 md:p-8 shadow-sm rounded-[2rem] border border-gray-100 flex flex-col justify-center overflow-hidden">
            <Chart
              chartType="LineChart"
              width="100%" height="350px"
              data={yearlyTrendData}
              options={{
                title: "12-Month Continuous Growth Trend",
                titleTextStyle: { color: '#334155', fontSize: 16, bold: true },
                curveType: "function",
                series: { 0: { color: '#8b5cf6', lineWidth: 4 }, 1: { color: '#14b8a6', lineWidth: 4 } },
                legend: { position: "top", textStyle: { color: '#64748b' } },
                chartArea: { width: '90%', height: '70%' },
                hAxis: { title: 'Months', titleTextStyle: { color: '#94a3b8', italic: false }, textStyle: { color: '#94a3b8' } },
                vAxis: { format: 'short', textStyle: { color: '#94a3b8' } }
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

/** Component thẻ biểu đồ con */
function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-6 shadow-sm rounded-[2rem] border border-gray-100 flex flex-col items-center hover:border-indigo-100 transition-colors duration-300">
      <h4 className="text-center font-bold text-slate-600 mb-4 uppercase text-[10px] tracking-widest bg-slate-50 px-4 py-2 rounded-full w-fit">
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
    <div className="bg-white p-6 md:p-8 shadow-sm rounded-[2rem] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-100 flex flex-col justify-center gap-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className={`text-2xl sm:text-3xl font-black ${color} truncate`}>{value}</h3>
    </div>
  );
}
