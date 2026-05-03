import React, { useEffect, useMemo, useState } from 'react';

const API_ADMIN_DASHBOARD_URL = '/api/v1/admin/dashboard';
const API_STATISTICS_REVENUE_URL = '/api/v1/admin/statistics/revenue';
const API_STATISTICS_ORDERS_URL = '/api/v1/admin/statistics/orders';
const API_STATISTICS_PRODUCTS_URL = '/api/v1/admin/statistics/products';
const API_STATISTICS_EXPORT_URL = '/api/v1/admin/statistics/export';

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
  // Simple polyline path
  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      return `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(' ');
  return d;
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

function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  // local timezone safe
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // backend expects ISO yyyy-MM-dd; we can just send value directly
  return value;
}

export default function AdminReports() {
  const token = localStorage.getItem('token');

  const todayStr = useMemo(() => formatDateInput(new Date()), []);
  const defaultFromStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateInput(d);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [period, setPeriod] = useState('day'); // for revenue/orders
  const [fromDate, setFromDate] = useState(defaultFromStr);
  const [toDate, setToDate] = useState(todayStr);

  const [revenueStat, setRevenueStat] = useState(null);
  const [orderStat, setOrderStat] = useState(null);
  const [productStat, setProductStat] = useState(null);

  const [chartMode, setChartMode] = useState('revenue'); // 'revenue'|'profit'|'both'

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const applyFilters = async () => {
    setLoading(true);
    setError('');
    setRevenueStat(null);
    setOrderStat(null);
    setProductStat(null);

    try {
      const from = parseDateInput(fromDate);
      const to = parseDateInput(toDate);

      // If user accidentally clears dates, fall back gracefully (backend also handles null but
      // we are sending explicit values for consistency).
      const safeFrom = from || defaultFromStr;
      const safeTo = to || todayStr;

      const qsRevenue = new URLSearchParams({
        period,
        from_date: safeFrom,
        to_date: safeTo,
      });

      const qsOrders = new URLSearchParams({
        period,
        from_date: safeFrom,
        to_date: safeTo,
      });

      const qsProducts = new URLSearchParams({
        from_date: safeFrom,
        to_date: safeTo,
      });

      const [dashRes, revRes, ordRes, prodRes] = await Promise.all([
        fetch(API_ADMIN_DASHBOARD_URL, { headers }),
        fetch(`${API_STATISTICS_REVENUE_URL}?${qsRevenue.toString()}`, { headers }),
        fetch(`${API_STATISTICS_ORDERS_URL}?${qsOrders.toString()}`, { headers }),
        fetch(`${API_STATISTICS_PRODUCTS_URL}?${qsProducts.toString()}`, { headers }),
      ]);

      const [dashPayload, revPayload, ordPayload, prodPayload] = await Promise.all([
        safeParseJson(dashRes),
        safeParseJson(revRes),
        safeParseJson(ordRes),
        safeParseJson(prodRes),
      ]);

      if (!dashRes.ok) throw new Error(extractMessage(dashPayload, 'Không thể tải dashboard.'));
      if (!revRes.ok) throw new Error(extractMessage(revPayload, 'Không thể tải thống kê doanh thu.'));
      if (!ordRes.ok) throw new Error(extractMessage(ordPayload, 'Không thể tải thống kê đơn hàng.'));
      if (!prodRes.ok) throw new Error(extractMessage(prodPayload, 'Không thể tải thống kê sản phẩm.'));

      setRevenueStat(revPayload?.data || revPayload);
      setOrderStat(ordPayload?.data || ordPayload);
      setProductStat(prodPayload?.data || prodPayload);
    } catch (e) {
      setError(e?.message || 'Đã xảy ra lỗi khi tải báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canExport = useMemo(() => {
    return !!(fromDate && toDate);
  }, [fromDate, toDate]);

  const exportExcel = async () => {
    try {
      const from = parseDateInput(fromDate) || defaultFromStr;
      const to = parseDateInput(toDate) || todayStr;

      const qs = new URLSearchParams({
        from_date: from,
        to_date: to,
      });

      const res = await fetch(`${API_STATISTICS_EXPORT_URL}?${qs.toString()}`, {
        headers,
      });

      if (!res.ok) {
        const payload = await safeParseJson(res);
        throw new Error(extractMessage(payload, 'Không thể xuất Excel.'));
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bao_Cao_Thong_Ke.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.message || 'Xuất Excel thất bại.');
    }
  };

  const revenueChart = useMemo(() => {
    if (!revenueStat) return null;
    const labels = Array.isArray(revenueStat.labels) ? revenueStat.labels : [];
    const revenue = Array.isArray(revenueStat.revenue) ? revenueStat.revenue : [];
    const profit = Array.isArray(revenueStat.profit) ? revenueStat.profit : [];

    return { labels, revenue, profit };
  }, [revenueStat]);

  const orderChart = useMemo(() => {
    if (!orderStat) return null;
    const chartData = Array.isArray(orderStat.chartData) ? orderStat.chartData : [];
    // each item: {label, completed, cancelled}
    return chartData;
  }, [orderStat]);

  const kpi = useMemo(() => {
    const cards = [
      {
        label: 'Tổng doanh thu',
        value: revenueStat?.totalRevenue ?? 0,
        tone: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      },
      {
        label: 'Tổng lợi nhuận',
        value: revenueStat?.totalProfit ?? 0,
        tone: 'bg-amber-50 border-amber-200 text-amber-800',
      },
      {
        label: 'Tổng số đơn',
        value: orderStat?.total ?? 0,
        tone: 'bg-slate-50 border-slate-200 text-slate-800',
      },
      {
        label: 'Tỷ lệ hoàn tất',
        value: `${Number(orderStat?.completionRate || 0).toFixed(1)}%`,
        tone: 'bg-rose-50 border-rose-200 text-rose-800',
      },
    ];
    return cards;
  }, [orderStat, revenueStat]);

  const tickLabels = useMemo(() => {
    const labels = revenueChart?.labels || [];
    const n = labels.length;
    if (n <= 6) return labels;
    const step = Math.floor(n / 6) || 1;
    const idxs = new Set([0, n - 1]);
    for (let i = 1; i < n - 1; i += step) idxs.add(i);
    return Array.from(idxs)
      .sort((a, b) => a - b)
      .map((i) => ({ label: labels[i], index: i }));
  }, [revenueChart]);

  // Chart drawing constants
  const chartW = 900;
  const chartH = 260;
  const padTop = 18;
  const padBottom = 26;

  const revenuePoints = useMemo(() => {
    if (!revenueChart) return null;
    return toChartPoints(revenueChart.revenue, chartW, chartH, padTop, padBottom);
  }, [revenueChart]);

  const profitPoints = useMemo(() => {
    if (!revenueChart) return null;
    return toChartPoints(revenueChart.profit, chartW, chartH, padTop, padBottom);
  }, [revenueChart]);

  const revenuePath = useMemo(() => {
    if (!revenuePoints) return '';
    return buildPath(revenuePoints);
  }, [revenuePoints]);

  const profitPath = useMemo(() => {
    if (!profitPoints) return '';
    return buildPath(profitPoints);
  }, [profitPoints]);

  const revenueArea = useMemo(() => {
    if (!revenuePoints) return '';
    return buildAreaPath(revenuePoints, chartH, padBottom);
  }, [revenuePoints]);

  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8f6f6] font-sans">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ec5b13] via-[#ff8a4c] to-[#ffd0b0]" />
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ec5b13]/8 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-slate-200/60 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ec5b13]/15 bg-[#ec5b13]/8 px-3 py-1 text-xs font-semibold text-[#c84c10]">
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                Admin / Báo cáo & Thống kê
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Báo cáo thống kê
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Theo dõi doanh thu, lợi nhuận, trạng thái đơn hàng và hiệu quả sản phẩm theo khoảng thời gian.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {kpi.map((c) => (
                  <div
                    key={c.label}
                    className={`rounded-2xl border px-4 py-3 shadow-sm ${c.tone}`}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-90">
                      {c.label}
                    </p>
                    <p className="mt-2 text-lg font-black tracking-tight">
                      {typeof c.value === 'number' ? formatVND(c.value) : c.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full xl:w-[520px]">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Chi tiết theo
                      </label>
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="mt-2 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ec5b13]/30 focus:bg-white focus:ring-4 focus:ring-[#ec5b13]/10"
                      >
                        <option value="day">Ngày</option>
                        <option value="week">Tuần</option>
                        <option value="month">Tháng</option>
                        <option value="year">Năm</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={applyFilters}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(236,91,19,0.22)] transition hover:bg-[#d95210] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">search</span>
                            Áp dụng
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setChartMode('revenue')}
                      className={`rounded-2xl border px-3 py-2 text-sm font-bold transition ${
                        chartMode === 'revenue'
                          ? 'border-[#ec5b13]/30 bg-[#ec5b13]/10 text-[#c84c10]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Doanh thu
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode('profit')}
                      className={`rounded-2xl border px-3 py-2 text-sm font-bold transition ${
                        chartMode === 'profit'
                          ? 'border-[#ec5b13]/30 bg-[#ec5b13]/10 text-[#c84c10]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Lợi nhuận
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode('both')}
                      className={`rounded-2xl border px-3 py-2 text-sm font-bold transition ${
                        chartMode === 'both'
                          ? 'border-[#ec5b13]/30 bg-[#ec5b13]/10 text-[#c84c10]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Cả hai
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      disabled={!canExport || loading}
                      onClick={exportExcel}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px]">file_download</span>
                      Xuất Excel
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-700 font-bold">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Đang tải báo cáo...
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 px-6 py-5 bg-slate-50/40">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Doanh thu & Lợi nhuận</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Period: <span className="font-bold text-slate-700">{period}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-800">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Doanh thu
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-800">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Lợi nhuận
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 overflow-hidden">
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="320" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ec5b13" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#ec5b13" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="profitArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 1, 2, 3].map((i) => {
                      const y = padTop + ((chartH - padTop - padBottom) * i) / 3;
                      return <line key={i} x1="0" x2={chartW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
                    })}

                    {chartMode !== 'profit' && revenueArea && (
                      <path d={revenueArea} fill="url(#revArea)" />
                    )}

                    {chartMode !== 'profit' && revenuePath && (
                      <path d={revenuePath} fill="none" stroke="#ec5b13" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                    )}

                    {chartMode !== 'revenue' && profitPoints && (
                      <path d={buildAreaPath(profitPoints, chartH, padBottom)} fill="url(#profitArea)" opacity={0.95} />
                    )}

                    {chartMode !== 'revenue' && profitPath && (
                      <path d={profitPath} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                    )}
                  </svg>

                  <div className="mt-3 flex justify-between text-[11px] font-bold text-slate-400 px-2">
                    {tickLabels && tickLabels.length ? (
                      tickLabels.map((t) => (
                        <span key={String(t.index)} className="truncate max-w-[90px]">
                          {t.label}
                        </span>
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Tổng doanh thu
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-900">
                        {revenueStat ? formatVND(revenueStat.totalRevenue) : '—'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Tổng lợi nhuận
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-900">
                        {revenueStat ? formatVND(revenueStat.totalProfit) : '—'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Growth rate
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-900">
                        {revenueStat ? `${Number(revenueStat.growthRate || 0).toFixed(1)}%` : '0.0%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 px-6 py-5 bg-slate-50/40">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Trạng thái đơn hàng</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Completed vs Cancelled theo {period}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-800">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Completed: {orderStat?.completed ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-800">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Cancelled: {orderStat?.cancelled ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-sm text-slate-500">
                      Tổng đơn: <span className="font-bold text-slate-900">{orderStat?.total ?? 0}</span> · Delivery: <span className="font-bold text-slate-900">{orderStat?.delivering ?? 0}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Completion rate:{' '}
                      <span className="font-bold text-slate-900">{Number(orderStat?.completionRate || 0).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg viewBox={`0 0 ${chartW} 240`} width="100%" height="260" preserveAspectRatio="none">
                      {/* grid */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const y = 18 + (200 * i) / 4;
                        return <line key={i} x1="0" x2={chartW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
                      })}

                      {(() => {
                        if (!Array.isArray(orderChart) || orderChart.length === 0) return null;

                        const completed = orderChart.map((d) => Number(d.completed) || 0);
                        const cancelled = orderChart.map((d) => Number(d.cancelled) || 0);
                        const max = Math.max(...completed.map((v, i) => v + cancelled[i]), 1);

                        const usableH = 200;
                        const baseY = 218;

                        const barGap = 2;
                        const total = orderChart.length;
                        const barW = total ? (chartW - barGap * (total - 1)) / total : 0;

                        return orderChart.map((d, i) => {
                          const c = Number(d.completed) || 0;
                          const x = i * (barW + barGap);
                          const hC = (c / max) * usableH;

                          const canc = Number(d.cancelled) || 0;
                          const hCanc = (canc / max) * usableH;

                          const yC = baseY - hC - hCanc; // stacked top

                          return (
                            <g key={d.label || i}>
                              {/* cancelled */}
                              <rect
                                x={x}
                                y={yC}
                                width={barW}
                                height={hCanc}
                                rx="6"
                                fill="#f43f5e"
                                opacity="0.75"
                              />
                              {/* completed */}
                              <rect
                                x={x}
                                y={baseY - hC}
                                width={barW}
                                height={hC}
                                rx="6"
                                fill="#10b981"
                                opacity="0.85"
                              />
                            </g>
                          );
                        });
                      })()}
                    </svg>

                    <div className="mt-3 flex justify-between text-[11px] font-bold text-slate-400 px-2">
                      {(() => {
                        if (!Array.isArray(orderChart) || orderChart.length === 0) return <span>—</span>;
                        const n = orderChart.length;
                        if (n <= 6) {
                          return orderChart.map((d, i) => (
                            <span key={d.label || i} className="truncate max-w-[100px]">
                              {d.label}
                            </span>
                          ));
                        }
                        const step = Math.floor(n / 6) || 1;
                        return orderChart.map((d, i) => {
                          if (i === 0 || i === n - 1 || i % step === 0) {
                            return (
                              <span key={d.label || i} className="truncate max-w-[100px]">
                                {d.label}
                              </span>
                            );
                          }
                          return <span key={d.label || i} className="opacity-0">.</span>;
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 bg-slate-50/40">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Sản phẩm bán chạy</h2>
                    <p className="mt-1 text-sm text-slate-500">Top selling theo khoảng thời gian</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-800">
                    {productStat?.topSelling?.length ?? 0} sản phẩm
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50/95 backdrop-blur">
                      <tr className="border-b border-slate-200">
                        <th className="w-24 px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ảnh</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sản phẩm</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Danh mục</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">Đã bán</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-right">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productStat?.topSelling?.length ? (
                        productStat.topSelling.map((p) => (
                          <tr key={String(p.productId)} className="group transition hover:bg-[#fdf7f3]">
                            <td className="px-6 py-5 align-middle">
                              <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden">
                                <img
                                  src={p.thumbnailUrl || 'https://placehold.co/120x120?text=No+Image'}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/120x120?text=Error';
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-5 align-middle">
                              <div className="max-w-[320px]">
                                <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  ID: <span className="font-mono text-slate-600">{p.productId}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 align-middle">
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                {p.categoryName || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-5 align-middle text-center font-bold text-slate-700">
                              {p.quantitySold ?? 0}
                            </td>
                            <td className="px-6 py-5 align-middle text-right font-black text-[#ec5b13]">
                              {formatVND(p.revenue ?? 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-20 text-center">
                            <div className="mx-auto flex max-w-md flex-col items-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <span className="material-symbols-outlined text-[30px]">inventory_2_off</span>
                              </div>
                              <h4 className="mt-4 text-lg font-bold text-slate-900">Không có dữ liệu</h4>
                              <p className="mt-2 text-sm text-slate-500">Thử chọn lại khoảng thời gian.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 bg-slate-50/40">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Sản phẩm tồn kho chậm</h2>
                    <p className="mt-1 text-sm text-slate-500">Danh sách theo tồn kho</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-800">
                    {productStat?.slowMoving?.length ?? 0} sản phẩm
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50/95 backdrop-blur">
                      <tr className="border-b border-slate-200">
                        <th className="w-24 px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ảnh</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sản phẩm</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Danh mục</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">Tồn kho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productStat?.slowMoving?.length ? (
                        productStat.slowMoving.map((p) => (
                          <tr key={String(p.productId)} className="group transition hover:bg-[#fdf7f3]">
                            <td className="px-6 py-5 align-middle">
                              <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden">
                                <img
                                  src={p.thumbnailUrl || 'https://placehold.co/120x120?text=No+Image'}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/120x120?text=Error';
                                  }}
                                />
                              </div>
                            </td>

                            <td className="px-6 py-5 align-middle">
                              <div className="max-w-[320px]">
                                <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  ID: <span className="font-mono text-slate-600">{p.productId}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 align-middle">
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                {p.categoryName || '—'}
                              </span>
                            </td>

                            <td className="px-6 py-5 align-middle text-center font-black text-amber-700">
                              {p.stockQty ?? 0}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-20 text-center">
                            <div className="mx-auto flex max-w-md flex-col items-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                <span className="material-symbols-outlined text-[30px]">inventory_2_off</span>
                              </div>
                              <h4 className="mt-4 text-lg font-bold text-slate-900">Không có dữ liệu</h4>
                              <p className="mt-2 text-sm text-slate-500">Hãy kiểm tra tồn kho hoặc khoảng thời gian.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
