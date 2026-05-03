import React, { useEffect, useMemo, useState } from 'react';

const API_ADMIN_DASHBOARD_URL = '/api/v1/admin/dashboard';
const API_STATISTICS_REVENUE_URL = '/api/v1/admin/statistics/revenue';
const API_STATISTICS_ORDERS_URL = '/api/v1/admin/statistics/orders';
const API_STATISTICS_PRODUCTS_URL = '/api/v1/admin/statistics/products';

function safeParseJson(res) {
  return res
    .text()
    .then((text) => {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    })
    .catch(() => null);
}

function extractMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  return fallback;
}

function formatVND(value) {
  const n = Number(value) || 0;
  return `${new Intl.NumberFormat('vi-VN').format(n)}₫`;
}

function formatInt(value) {
  return `${Number(value) || 0}`;
}

function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toChartPoints(values, width, height, paddingTop, paddingBottom) {
  const vals = Array.isArray(values) ? values.map((v) => Number(v) || 0) : [];
  if (!vals.length) return [];

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const usableHeight = height - paddingTop - paddingBottom;

  return vals.map((v, idx) => {
    const x = vals.length === 1 ? width / 2 : (idx * width) / (vals.length - 1);
    const yNorm = (v - min) / range; // 0..1
    const y = paddingTop + (1 - yNorm) * usableHeight;
    return { x, y, v };
  });
}

function buildPath(points) {
  if (!points.length) return '';
  return points
    .map((p, i) => (i === 0 ? `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}` : `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`))
    .join(' ');
}

function buildAreaPath(points, height, paddingBottom) {
  if (!points.length) return '';
  const first = points[0];
  const last = points[points.length - 1];
  const baseY = height - paddingBottom;
  const linePath = buildPath(points);
  if (!linePath) return '';
  return `${linePath} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`;
}

function sampleLabels(labels, count = 6) {
  const arr = Array.isArray(labels) ? labels : [];
  const n = arr.length;
  if (n === 0) return [];
  if (n <= count) return arr;

  const idxs = new Set([0, n - 1]);
  for (let i = 1; i < count - 1; i += 1) {
    const idx = Math.round((i * (n - 1)) / (count - 1));
    idxs.add(clamp(idx, 0, n - 1));
  }
  return Array.from(idxs)
    .sort((a, b) => a - b)
    .map((i) => arr[i]);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [revenueStat, setRevenueStat] = useState(null);
  const [productStat, setProductStat] = useState(null);
  const [orderStat, setOrderStat] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const today = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);

    const fromStr = formatDateInput(from);
    const toStr = formatDateInput(today);

    const run = async () => {
      setLoading(true);
      setError('');
      setDashboard(null);
      setRevenueStat(null);
      setProductStat(null);
      setOrderStat(null);

      try {
        const [dashRes, revRes, prodRes, ordRes] = await Promise.all([
          fetch(API_ADMIN_DASHBOARD_URL, { headers }),
          fetch(`${API_STATISTICS_REVENUE_URL}?period=day&from_date=${fromStr}&to_date=${toStr}`, { headers }),
          fetch(`${API_STATISTICS_PRODUCTS_URL}?from_date=${fromStr}&to_date=${toStr}`, { headers }),
          fetch(`${API_STATISTICS_ORDERS_URL}?period=day&from_date=${fromStr}&to_date=${toStr}`, { headers }),
        ]);

        const [dashPayload, revPayload, prodPayload, ordPayload] = await Promise.all([
          safeParseJson(dashRes),
          safeParseJson(revRes),
          safeParseJson(prodRes),
          safeParseJson(ordRes),
        ]);

        if (!dashRes.ok) throw new Error(extractMessage(dashPayload, 'Không thể tải dashboard.'));
        if (!revRes.ok) throw new Error(extractMessage(revPayload, 'Không thể tải thống kê doanh thu.'));
        if (!prodRes.ok) throw new Error(extractMessage(prodPayload, 'Không thể tải thống kê sản phẩm.'));
        if (!ordRes.ok) throw new Error(extractMessage(ordPayload, 'Không thể tải thống kê đơn hàng.'));

        setDashboard(dashPayload?.data || dashPayload);
        setRevenueStat(revPayload?.data || revPayload);
        setProductStat(prodPayload?.data || prodPayload);
        setOrderStat(ordPayload?.data || ordPayload);
      } catch (e) {
        setError(e?.message || 'Đã xảy ra lỗi khi tải dashboard.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const summaryCards = useMemo(() => {
    const revToday = dashboard?.revenueToday ?? 0;
    const ordersToday = dashboard?.newOrdersToday ?? 0;
    const newCustomersThisMonth = dashboard?.newCustomersThisMonth ?? 0;
    const lowStockProducts = dashboard?.lowStockProducts ?? 0;

    return [
      { label: 'Tổng doanh thu', val: formatVND(revToday), trend: 'Hôm nay', icon: 'payments' },
      { label: 'Tổng đơn hàng', val: formatInt(ordersToday), trend: 'Hôm nay', icon: 'shopping_bag' },
      { label: 'Khách hàng mới', val: formatInt(newCustomersThisMonth), trend: 'Tháng này', icon: 'person_add' },
      { label: 'Sản phẩm sắp hết', val: formatInt(lowStockProducts), trend: 'Cần bổ sung', icon: 'pulse_alert' },
    ];
  }, [dashboard]);

  const revenueChart = useMemo(() => {
    const labels = Array.isArray(revenueStat?.labels) ? revenueStat.labels : [];
    const revenue = Array.isArray(revenueStat?.revenue) ? revenueStat.revenue : [];
    return { labels, revenue };
  }, [revenueStat]);

  const chartPaths = useMemo(() => {
    const labels = revenueChart.labels;
    const values = revenueChart.revenue;

    const width = 1000;
    const height = 300;
    const padTop = 30;
    const padBottom = 40;

    const points = toChartPoints(values, width, height, padTop, padBottom);
    return {
      labels,
      points,
      areaPath: buildAreaPath(points, height, padBottom),
      linePath: buildPath(points),
      sampledLabels: sampleLabels(labels, 6),
    };
  }, [revenueChart]);

  const topSelling = useMemo(() => {
    const arr = Array.isArray(productStat?.topSelling) ? productStat.topSelling : [];
    return arr;
  }, [productStat]);

  const recentOrdersRows = useMemo(() => {
    // orderStat.chartData items: { label, completed, cancelled }
    const chartData = Array.isArray(orderStat?.chartData) ? orderStat.chartData : [];
    // show last 7 points
    const slice = chartData.slice(Math.max(0, chartData.length - 7));
    return slice;
  }, [orderStat]);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      <div className="p-8 space-y-8">
        {loading ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-700 font-bold">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Đang tải dashboard...
            </div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 text-rose-700 font-bold">
            {error}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{card.label}</p>
                      <h3 className="text-2xl font-bold mt-1 text-slate-900">{card.val}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm font-semibold text-slate-500">
                        <span className="material-symbols-outlined text-lg">trending_flat</span>
                        <span>{card.trend}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#ff6b00]/10 flex items-center justify-center text-[#ff6b00]">
                      <span className="material-symbols-outlined">{card.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Chart Section */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Xu hướng doanh thu</h2>
                  <p className="text-slate-500 text-sm">30 ngày gần đây (ước tính từ hóa đơn PAID)</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-semibold bg-[#ff6b00]/10 text-[#ff6b00] rounded-lg">
                    30 Ngày qua
                  </button>
                </div>
              </div>

              <div className="h-80 w-full relative">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                  <defs>
                    <linearGradient id="dashboardGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b00" stopOpacity="0.3" />
                      <stop offset="95%" stopColor="#ff6b00" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {chartPaths.areaPath ? (
                    <path d={chartPaths.areaPath} fill="url(#dashboardGradient)" />
                  ) : null}

                  {chartPaths.linePath ? (
                    <path
                      d={chartPaths.linePath}
                      fill="none"
                      stroke="#ff6b00"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                  ) : null}

                  <line stroke="#e2e8f0" strokeWidth="1" x1="0" x2="1000" y1="300" y2="300" />
                </svg>

                <div className="flex justify-between mt-4 text-xs font-semibold text-slate-400 px-2 gap-2">
                  {chartPaths.sampledLabels?.length ? (
                    chartPaths.sampledLabels.map((l, idx) => (
                      <span key={`${l}-${idx}`} className="truncate">
                        {l}
                      </span>
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Selling Products */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-900">Sản phẩm bán chạy</h3>
                  <button className="text-[#ff6b00] text-sm font-bold hover:underline">Cập nhật theo thời gian</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Sản phẩm</th>
                        <th className="px-6 py-4">Đã bán</th>
                        <th className="px-6 py-4">Doanh thu</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {topSelling.length ? (
                        topSelling.map((row) => (
                          <tr key={String(row.productId)} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={row.thumbnailUrl || 'https://placehold.co/40x40'}
                                  className="w-10 h-10 rounded-lg object-cover"
                                  alt={row.name}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/40x40';
                                  }}
                                />
                                <span className="font-medium text-sm text-slate-700">{row.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                              {formatInt(row.quantitySold)}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-[#ff6b00]">
                              {formatVND(row.revenue ?? 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-bold">
                            Chưa có dữ liệu bán chạy.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Orders (by status) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-900">Đơn hàng gần đây</h3>
                  <button className="text-[#ff6b00] text-sm font-bold hover:underline">Hoàn tất vs Hủy</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Ngày</th>
                        <th className="px-6 py-4">Hoàn tất</th>
                        <th className="px-6 py-4">Đã hủy</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {recentOrdersRows.length ? (
                        recentOrdersRows
                          .slice()
                          .reverse()
                          .map((row) => (
                            <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.label}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                                {formatInt(row.completed)}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-rose-700">
                                {formatInt(row.cancelled)}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-bold">
                            Chưa có dữ liệu đơn hàng theo khoảng thời gian.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
