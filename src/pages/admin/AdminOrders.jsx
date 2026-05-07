import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './AdminProducts.css';

const API_ADMIN_ORDERS_URL = '/api/v1/admin/orders';

const parseJson = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const extractMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  return fallback;
};

function formatVND(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;
}

function getAvailableNextStatuses(status) {
  if (status === 'pending') return ['confirmed', 'cancelled'];
  if (status === 'confirmed') return ['shipping', 'cancelled'];
  if (status === 'shipping') return ['completed'];
  if (status === 'payment_failed') return ['cancelled'];
  return [];
}

function humanStatus(status) {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'confirmed': return 'Đã xác nhận';
    case 'shipping': return 'Đang giao';
    case 'completed': return 'Hoàn tất';
    case 'cancelled': return 'Đã hủy';
    case 'payment_failed': return 'Thanh toán lỗi';
    default: return status || '—';
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'pending': return 'badge-cat';
    case 'confirmed': return 'badge-amber';
    case 'shipping': return 'badge-teal';
    case 'completed': return 'badge-green';
    case 'cancelled': return 'badge-red';
    case 'payment_failed': return 'badge-red';
    default: return 'badge-gray';
  }
}

export default function AdminOrders() {
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0, pages: 1 });
  
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
    fromDate: '',
    toDate: '',
  });

  const [keywordInput, setKeywordInput] = useState('');

  // Modals state
  const [detailOrder, setDetailOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [updateOrder, setUpdateOrder] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingCode: '', reason: '' });
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page - 1,
        size: pagination.pageSize || 20,
      });

      if (filters.status) queryParams.append('status', filters.status);
      if (filters.keyword) queryParams.append('keyword', filters.keyword);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const res = await fetch(`${API_ADMIN_ORDERS_URL}?${queryParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải đơn hàng.'));
      
      const data = payload?.data || payload;
      const orderList = data.result || data.content || data || [];
      const meta = data.meta || {};

      setOrders(orderList);
      setPagination(prev => ({
        ...prev,
        current: meta.page !== undefined ? meta.page + 1 : page,
        total: meta.totals || meta.totalElements || orderList.length,
        pages: meta.pages || meta.totalPages || 1
      }));
    } catch (e) {
      setError(e?.message || 'Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize, token]);

  useEffect(() => {
    fetchOrders(pagination.current);
  }, [filters, pagination.current]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleKeywordSearch = () => {
    setFilters(prev => ({ ...prev, keyword: keywordInput }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') handleKeywordSearch();
  };

  const clearFilters = () => {
    setKeywordInput('');
    setFilters({ status: '', keyword: '', fromDate: '', toDate: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openDetail = async (orderId) => {
    setDetailLoading(true);
    setIsDetailOpen(true);
    setDetailOrder(null);
    try {
      const res = await fetch(`${API_ADMIN_ORDERS_URL}/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải chi tiết đơn.'));
      setDetailOrder(payload?.data || payload);
    } catch (e) {
      alert(e.message);
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openUpdate = (order) => {
    setUpdateOrder(order);
    const nexts = getAvailableNextStatuses(order.status);
    setUpdateForm({
      status: nexts[0] || '',
      trackingCode: order.trackingCode || '',
      reason: ''
    });
    setIsUpdateOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!updateOrder) return;
    setUpdating(true);
    try {
      const orderId = updateOrder.orderId ?? updateOrder.id;
      const res = await fetch(`${API_ADMIN_ORDERS_URL}/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateForm),
      });

      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Cập nhật thất bại.'));
      
      setIsUpdateOpen(false);
      fetchOrders(pagination.current);
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleExportInvoice = async (orderId, orderCode) => {
    try {
      const res = await fetch(`/api/v1/admin/invoices/order/${orderId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Không thể xuất hóa đơn. Có thể hóa đơn chưa được tạo hoặc lỗi hệ thống.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderCode || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  };

  // Stats summary (Still using current page orders for summary, or could fetch from dashboard API)
  const summary = useMemo(() => {
    const s = { pending: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0, payment_failed: 0 };
    for (const o of orders) {
      const st = o?.status;
      if (st in s) s[st] += 1;
    }
    return s;
  }, [orders]);

  const statsCards = [
    { label: 'Chờ xác nhận', value: summary.pending, icon: 'pending_actions', tone: 'si-blue' },
    { label: 'Đã xác nhận', value: summary.confirmed, icon: 'inventory', tone: 'si-amber' },
    { label: 'Đang giao', value: summary.shipping, icon: 'local_shipping', tone: 'si-teal' },
    { label: 'Hoàn tất', value: summary.completed, icon: 'check_circle', tone: 'si-green' },
    { label: 'Đã hủy', value: summary.cancelled, icon: 'cancel', tone: 'si-red' },
    { label: 'Lỗi T.Toán', value: summary.payment_failed, icon: 'error', tone: 'si-gray' },
  ];

  const hasFilters = filters.status || filters.keyword || filters.fromDate || filters.toDate;

  // Grid template for orders table
  const orderGridStyle = { gridTemplateColumns: '180px 1fr 140px 140px 140px 260px' };

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap">
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý đơn hàng</div>
            <div className="pm-subtitle">Xử lý, lọc và cập nhật trạng thái đơn hàng thời gian thực.</div>
          </div>
          <div className="pm-actions">
            <button className="btn-ghost" onClick={() => fetchOrders(pagination.current)} disabled={loading}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span> Làm mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {statsCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.tone}`}>
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search keyword */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '17px', color: '#94a3b8', pointerEvents: 'none'
              }}>search</span>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Tìm Mã đơn, Tên khách... (Enter)"
                style={{
                  width: '100%', padding: '8px 40px 8px 34px', borderRadius: '6px',
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontSize: '13px', fontFamily: 'inherit', outline: 'none'
                }}
              />
              {keywordInput && (
                <button onClick={handleKeywordSearch} style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: '#0f172a', border: 'none', borderRadius: '4px',
                  width: '24px', height: '24px', color: '#fff', cursor: 'pointer'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                </button>
              )}
            </div>

            {/* Trạng thái */}
            <select className="fselect" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
              <option value="payment_failed">Thanh toán lỗi</option>
            </select>

            {/* Date Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Từ:</span>
              <input 
                type="date" 
                className="fselect" 
                value={filters.fromDate} 
                onChange={(e) => handleFilterChange('fromDate', e.target.value)} 
              />
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Đến:</span>
              <input 
                type="date" 
                className="fselect" 
                value={filters.toDate} 
                onChange={(e) => handleFilterChange('toDate', e.target.value)} 
              />
            </div>

            {hasFilters && (
              <button onClick={clearFilters} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca',
                background: '#fef2f2', fontSize: '13px', color: '#dc2626',
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="table-wrap">
          <div className="tbl-header" style={orderGridStyle}>
            <div className="th">Mã đơn hàng</div>
            <div className="th">Khách hàng</div>
            <div className="th">Thanh toán</div>
            <div className="th right">Tổng cộng</div>
            <div className="th center">Trạng thái</div>
            <div className="th right">Thao tác</div>
          </div>

          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>
          ) : orders.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy đơn hàng nào.</div>
          ) : (
            orders.map((o) => {
              const orderId = o?.orderId ?? o?.id;
              const nextStatuses = getAvailableNextStatuses(o.status);
              return (
                <div className="tbl-row" key={String(orderId)} style={orderGridStyle}>
                  <div>
                    <div className="prod-name" style={{ color: '#0066A2', fontWeight: 900 }}>{o?.orderCode || `#${orderId}`}</div>
                    <div className="price-note" style={{ textAlign: 'left' }}>{o?.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}</div>
                  </div>
                  <div>
                    <div className="prod-name" style={{ fontSize: '13px' }}>{o?.fullName || '—'}</div>
                    <div className="prod-meta">{o?.phone || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{o?.paymentMethod}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{o?.paymentStatus}</div>
                  </div>
                  <div className="right">
                    <div className="price-val" style={{ color: '#0f172a' }}>{formatVND(o?.total)}</div>
                  </div>
                  <div className="center">
                    <span className={`badge ${getStatusBadge(o?.status)}`}>
                      {humanStatus(o?.status)}
                    </span>
                  </div>
                  <div className="right">
                    <div className="act-row">
                      <button className="act-btn" onClick={() => handleExportInvoice(orderId, o?.orderCode)} title="Xuất hóa đơn PDF">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>receipt_long</span> In HĐ
                      </button>
                      <button className="act-btn" onClick={() => openDetail(orderId)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span> Chi tiết
                      </button>
                      {nextStatuses.length > 0 && (
                        <button className="act-btn edit" onClick={() => openUpdate(o)}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit_square</span> Cập nhật
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer Pagination */}
          <div className="tbl-footer">
            <span className="footer-text">
              Tổng số: <strong>{pagination.total}</strong> đơn hàng
            </span>
            <div className="pager">
              <button className="page-btn" disabled={pagination.current <= 1} onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`page-btn ${pagination.current === p ? 'active' : ''}`} onClick={() => setPagination(prev => ({ ...prev, current: p }))}>
                    {p}
                  </button>
                );
              })}
              <button className="page-btn" disabled={pagination.current >= pagination.pages} onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">Chi tiết đơn hàng {detailOrder?.orderCode}</h2>
                <p className="text-xs text-slate-500 mt-0.5">ID: #{detailOrder?.orderId}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="text-center py-20 text-slate-500 font-bold">Đang tải dữ liệu...</div>
              ) : !detailOrder ? (
                <div className="text-center py-20 text-rose-500 font-bold">Không tìm thấy thông tin đơn hàng.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trạng thái & Thanh toán</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Trạng thái:</span>
                          <span className={`badge ${getStatusBadge(detailOrder.status)}`}>{humanStatus(detailOrder.status)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Thanh toán:</span>
                          <span className="text-xs font-bold text-slate-700">{detailOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Tình trạng:</span>
                          <span className="text-xs font-bold text-slate-700">{detailOrder.paymentStatus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Người nhận</div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900">{detailOrder.recipientName}</div>
                        <div className="text-xs text-slate-500">{detailOrder.recipientPhone}</div>
                        <div className="text-xs text-slate-600 mt-1 leading-relaxed">{detailOrder.addressLine}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ghi chú & Vận đơn</div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-600 italic">"{detailOrder.note || 'Không có ghi chú'}"</div>
                        {detailOrder.trackingCode && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Mã vận đơn:</span>
                            <div className="text-sm font-mono font-bold text-[#0066A2]">{detailOrder.trackingCode}</div>
                          </div>
                        )}
                        {detailOrder.cancelReason && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <span className="text-[10px] text-rose-400 uppercase font-bold">Lý do hủy:</span>
                            <div className="text-xs text-rose-600">{detailOrder.cancelReason}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="table-wrap overflow-hidden">
                    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 font-bold text-sm text-slate-700">Sản phẩm đã đặt</div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sản phẩm</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">SL</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Đơn giá</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailOrder.items?.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0" />
                                <div>
                                  <div className="text-sm font-bold text-slate-900">{item.productName}</div>
                                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Màu: {item.color} · Size: {item.size}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-slate-600">{formatVND(item.price)}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatVND(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Tạm tính:</span>
                        <span>{formatVND(detailOrder.subTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-rose-500">
                        <span>Giảm giá ({detailOrder.voucherCode || '—'}):</span>
                        <span>-{formatVND(detailOrder.discountAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">Tổng thanh toán:</span>
                        <span className="text-xl font-black text-[#0066A2]">{formatVND(detailOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/30">
              <button 
                onClick={() => handleExportInvoice(detailOrder?.orderId, detailOrder?.orderCode)} 
                className="btn-ghost"
                style={{ color: '#0066A2' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span> Xuất hóa đơn PDF
              </button>
              <button onClick={() => setIsDetailOpen(false)} className="btn-ghost">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {isUpdateOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsUpdateOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-black text-slate-900">Cập nhật đơn hàng {updateOrder?.orderCode}</h2>
              <p className="text-xs text-slate-500">Chuyển trạng thái theo quy trình vận hành.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Trạng thái tiếp theo</label>
                <select
                  className="fselect w-full"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                >
                  {getAvailableNextStatuses(updateOrder?.status).map(st => (
                    <option key={st} value={st}>{humanStatus(st)}</option>
                  ))}
                </select>
              </div>

              {updateForm.status === 'shipping' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Mã vận đơn (Tracking Code)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0066A2] outline-none"
                    placeholder="VD: VNPOST123..."
                    value={updateForm.trackingCode}
                    onChange={(e) => setUpdateForm({ ...updateForm, trackingCode: e.target.value })}
                  />
                </div>
              )}

              {updateForm.status === 'cancelled' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 text-rose-500">Lý do hủy đơn</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-rose-400 outline-none min-h-[100px]"
                    placeholder="VD: Khách thay đổi ý định, hết hàng..."
                    value={updateForm.reason}
                    onChange={(e) => setUpdateForm({ ...updateForm, reason: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button onClick={() => setIsUpdateOpen(false)} className="btn-ghost flex-1">Hủy</button>
              <button 
                onClick={handleUpdateStatus} 
                disabled={updating}
                className="btn-primary flex-1"
              >
                {updating ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
