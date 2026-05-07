import React, { useEffect, useMemo, useState } from 'react';
import './AdminProducts.css';

const API_ADMIN_DASHBOARD_URL = '/api/v1/admin/dashboard';
const API_STATISTICS_REVENUE_URL = '/api/v1/admin/statistics/revenue';
const API_STATISTICS_ORDERS_URL = '/api/v1/admin/statistics/orders';
const API_STATISTICS_PRODUCTS_URL = '/api/v1/admin/statistics/products';
const API_STATISTICS_EXPORT_URL = '/api/v1/admin/statistics/export';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `http://localhost:8080/api/v1${url}`;
  return `http://localhost:8080/api/v1/uploads/products/${url}`;
};

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
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
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

  const [period, setPeriod] = useState('day');
  const [fromDate, setFromDate] = useState(defaultFromStr);
  const [toDate, setToDate] = useState(todayStr);

  const [revenueStat, setRevenueStat] = useState(null);
  const [orderStat, setOrderStat] = useState(null);
  const [productStat, setProductStat] = useState(null);
  const [dashboardStat, setDashboardStat] = useState(null);

  const [chartMode, setChartMode] = useState('revenue');

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const applyFilters = async () => {
    setLoading(true);
    setError('');

    try {
      const from = parseDateInput(fromDate);
      const to = parseDateInput(toDate);
      const safeFrom = from || defaultFromStr;
      const safeTo = to || todayStr;

      const qsRevenue = new URLSearchParams({ period, from_date: safeFrom, to_date: safeTo });
      const qsOrders = new URLSearchParams({ period, from_date: safeFrom, to_date: safeTo });
      const qsProducts = new URLSearchParams({ from_date: safeFrom, to_date: safeTo });

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

      setDashboardStat(dashPayload?.data || dashPayload);
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
    applyFilters();
  }, []);

  const canExport = useMemo(() => !!(fromDate && toDate), [fromDate, toDate]);

  const exportExcel = async () => {
    try {
      const from = parseDateInput(fromDate) || defaultFromStr;
      const to = parseDateInput(toDate) || todayStr;
      const qs = new URLSearchParams({ from_date: from, to_date: to });

      const res = await fetch(`${API_STATISTICS_EXPORT_URL}?${qs.toString()}`, { headers });
      if (!res.ok) {
        const payload = await safeParseJson(res);
        throw new Error(extractMessage(payload, 'Không thể xuất Excel.'));
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_Cao_Thong_Ke_${from}_${to}.xlsx`;
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
    return Array.isArray(orderStat.chartData) ? orderStat.chartData : [];
  }, [orderStat]);

  const stats = useMemo(() => {
    return [
      {
        label: 'Doanh thu hôm nay',
        value: formatVND(dashboardStat?.revenueToday ?? 0),
        icon: 'today',
        siTone: 'si-blue',
        detail: 'Doanh thu phát sinh trong ngày'
      },
      {
        label: 'Đơn hàng mới',
        value: dashboardStat?.newOrdersToday ?? 0,
        icon: 'shopping_cart',
        siTone: 'si-teal',
        detail: 'Số đơn hàng vừa tạo hôm nay'
      },
      {
        label: 'Doanh thu tháng này',
        value: formatVND(dashboardStat?.revenueThisMonth ?? 0),
        icon: 'calendar_month',
        siTone: 'si-amber',
        detail: 'Tổng doanh thu tính từ đầu tháng'
      },
      {
        label: 'Khách hàng mới',
        value: dashboardStat?.newCustomersThisMonth ?? 0,
        icon: 'person_add',
        siTone: 'si-gray',
        detail: 'Khách đăng ký mới trong tháng'
      },
      {
        label: 'Sắp hết hàng',
        value: dashboardStat?.lowStockProducts ?? 0,
        icon: 'inventory_2',
        siTone: 'si-red',
        detail: 'Số sản phẩm có tồn kho thấp',
        isWarn: (dashboardStat?.lowStockProducts ?? 0) > 0
      }
    ];
  }, [dashboardStat]);

  const tickLabels = useMemo(() => {
    const labels = revenueChart?.labels || [];
    const n = labels.length;
    if (n <= 6) return labels;
    const step = Math.floor(n / 6) || 1;
    const idxs = new Set([0, n - 1]);
    for (let i = 1; i < n - 1; i += step) idxs.add(i);
    return Array.from(idxs).sort((a, b) => a - b).map((i) => ({ label: labels[i], index: i }));
  }, [revenueChart]);

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

  const revenuePath = useMemo(() => revenuePoints ? buildPath(revenuePoints) : '', [revenuePoints]);
  const profitPath = useMemo(() => profitPoints ? buildPath(profitPoints) : '', [profitPoints]);
  const revenueArea = useMemo(() => revenuePoints ? buildAreaPath(revenuePoints, chartH, padBottom) : '', [revenuePoints]);

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap">
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Báo cáo & Thống kê</div>
            <div className="pm-subtitle">Theo dõi tình hình kinh doanh, doanh thu và hiệu quả sản phẩm.</div>
          </div>
          <div className="pm-actions">
            <button className="btn-ghost" disabled={!canExport || loading} onClick={exportExcel}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span> Xuất Excel
            </button>
            <button className="btn-primary" onClick={applyFilters} disabled={loading}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span> {loading ? 'Đang cập nhật...' : 'Cập nhật dữ liệu'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fcebeb', color: '#a32d2d', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {stats.map((stat) => (
            <div key={stat.label} className={`stat-card ${stat.isWarn ? 'warn' : ''}`}>
              <div className={`stat-icon ${stat.siTone}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-desc">{stat.detail}</div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Từ ngày:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: '7px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                  background: '#f8fafc', fontSize: '13px', fontFamily: 'inherit', outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Đến ngày:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: '7px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                  background: '#f8fafc', fontSize: '13px', fontFamily: 'inherit', outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Xem theo:</span>
              <select
                className="fselect"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
              </select>
            </div>

            <div style={{ height: '24px', width: '1px', background: '#e2e8f0', margin: '0 5px' }} />

            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'revenue', label: 'Doanh thu' },
                { id: 'profit', label: 'Lợi nhuận' },
                { id: 'both', label: 'Cả hai' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setChartMode(m.id)}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    border: '1px solid',
                    borderColor: chartMode === m.id ? '#0f172a' : '#e2e8f0',
                    background: chartMode === m.id ? '#0f172a' : '#fff',
                    color: chartMode === m.id ? '#fff' : '#64748b',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Revenue Chart */}
          <div className="table-wrap" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontBold: 700, color: '#0f172a' }}>Biểu đồ Doanh thu & Lợi nhuận</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Tăng trưởng so với kỳ trước: <span style={{ color: '#10b981', fontWeight: 700 }}>{revenueStat ? `${Number(revenueStat.growthRate || 0).toFixed(1)}%` : '0.0%'}</span></p>
              </div>
            </div>

            <div style={{ position: 'relative', background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '15px' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0066A2" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0066A2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((i) => {
                  const y = padTop + ((chartH - padTop - padBottom) * i) / 3;
                  return <line key={i} x1="0" x2={chartW} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
                })}
                {chartMode !== 'profit' && revenueArea && <path d={revenueArea} fill="url(#revArea)" />}
                {chartMode !== 'profit' && revenuePath && <path d={revenuePath} fill="none" stroke="#0066A2" strokeWidth="3" strokeLinecap="round" />}
                {chartMode !== 'revenue' && profitPoints && <path d={buildPath(profitPoints)} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 2" />}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '10px' }}>
                {tickLabels.map((t, idx) => (
                  <span key={idx} style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{t.label || t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="table-wrap" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontBold: 700, color: '#0f172a' }}>Thống kê Đơn hàng</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Hoàn thành: <span style={{ color: '#10b981', fontWeight: 700 }}>{orderStat?.completed ?? 0}</span> · Hủy: <span style={{ color: '#f43f5e', fontWeight: 700 }}>{orderStat?.cancelled ?? 0}</span></p>
            </div>
            
            <div style={{ position: 'relative', background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '15px' }}>
              <svg viewBox={`0 0 ${chartW} 240`} width="100%" height="240" preserveAspectRatio="none">
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = 18 + (200 * i) / 4;
                  return <line key={i} x1="0" x2={chartW} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
                })}
                {(() => {
                  if (!orderChart || orderChart.length === 0) return null;
                  const completed = orderChart.map((d) => Number(d.completed) || 0);
                  const cancelled = orderChart.map((d) => Number(d.cancelled) || 0);
                  const max = Math.max(...completed.map((v, i) => v + cancelled[i]), 1);
                  const barW = (chartW / orderChart.length) * 0.6;
                  const gap = (chartW / orderChart.length) * 0.4;
                  return orderChart.map((d, i) => {
                    const hC = (Number(d.completed) / max) * 200;
                    const hX = (Number(d.cancelled) / max) * 200;
                    return (
                      <g key={i}>
                        <rect x={i * (barW + gap) + gap / 2} y={218 - hC - hX} width={barW} height={hX} fill="#f43f5e" rx="2" />
                        <rect x={i * (barW + gap) + gap / 2} y={218 - hC} width={barW} height={hC} fill="#10b981" rx="2" />
                      </g>
                    );
                  });
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Products Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Top Selling */}
          <div className="table-wrap">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Sản phẩm bán chạy</h3>
              <span className="badge badge-green">{productStat?.topSelling?.length ?? 0} SP</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Sản phẩm</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Đã bán</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {productStat?.topSelling?.map(p => (
                  <tr key={p.productId} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={getImageUrl(p.thumbnailUrl)} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#475569' }}>{p.quantitySold}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#0066A2' }}>{formatVND(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Slow Moving */}
          <div className="table-wrap">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Sản phẩm tồn kho lâu</h3>
              <span className="badge badge-red">{productStat?.slowMoving?.length ?? 0} SP</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Sản phẩm</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tồn kho</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Danh mục</th>
                </tr>
              </thead>
              <tbody>
                {productStat?.slowMoving?.map(p => (
                  <tr key={p.productId} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={getImageUrl(p.thumbnailUrl)} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>{p.stockQty}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <span className="badge badge-cat">{p.categoryName || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
