import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './AdminProducts.css';
import { getImageUrl, translateOrderStatus, translatePaymentStatus } from '../../utils/format';

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
  return translateOrderStatus(status);
}

function getStatusBadge(status) {
  switch (status) {
    case 'pending': return 'badge-cat';
    case 'confirmed': return 'badge-amber';
    case 'shipping': return 'badge-teal';
    case 'completed': return 'badge-green';
    case 'cancelled': return 'badge-red';
    case 'payment_failed': return 'badge-red';
    case 'refund_requested':
    case 'return_requested': return 'badge-orange';
    case 'return_approved': return 'badge-indigo';
    case 'returning':
    case 'return_confirmed':
    case 'returned': return 'badge-indigo';
    case 'rejected_refund': 
    case 'rejected_return':
    case 'recjected_refund': return 'badge-red';
    case 'refunded': return 'badge-purple';
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

  const [refundInfo, setRefundInfo] = useState(null);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const [updateOrder, setUpdateOrder] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingCode: '', reason: '' });
  const [updating, setUpdating] = useState(false);
  const [billImage, setBillImage] = useState(null);
  const [billPreview, setBillPreview] = useState(null);

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

  const openRefundInfo = async (orderId) => {
    setRefundLoading(true);
    setIsRefundOpen(true);
    setRefundInfo(null);
    setBillImage(null);
    setBillPreview(null);
    try {
      const res = await fetch(`${API_ADMIN_ORDERS_URL}/${orderId}/return-request`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải thông tin hoàn tiền.'));
      setRefundInfo(payload?.data || payload);
    } catch (e) {
      alert(e.message);
      setIsRefundOpen(false);
    } finally {
      setRefundLoading(false);
    }
  };

  const handleConfirmReturnRequest = async (orderId) => {
    if (!window.confirm('Xác nhận chấp nhận yêu cầu trả hàng này?')) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`${API_ADMIN_ORDERS_URL}/${orderId}/confirm-return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await parseJson(res);
      if (res.ok) {
        alert('Đã chấp nhận yêu cầu trả hàng. Đang chờ khách hàng gửi lại hàng.');
        openRefundInfo(orderId); // Refresh modal info
        fetchOrders(pagination.current);
      } else {
        alert(extractMessage(payload, 'Thao tác thất bại.'));
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectReturnRequest = async (orderId) => {
    const reason = window.prompt('Vui lòng nhập lý do từ chối yêu cầu trả hàng (bắt buộc):');
    if (!reason) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`${API_ADMIN_ORDERS_URL}/${orderId}/reject-return`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      const payload = await parseJson(res);
      if (res.ok) {
        alert('Đã từ chối yêu cầu trả hàng.');
        setIsRefundOpen(false);
        fetchOrders(pagination.current);
      } else {
        alert(extractMessage(payload, 'Thao tác thất bại.'));
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRefundReturnOrder = async (orderId) => {
    const isCod = refundInfo?.paymentMethod === 'cod';
    if (isCod && !billImage) {
      alert('Vui lòng tải lên ảnh bill chuyển khoản cho đơn COD.');
      return;
    }

    if (!window.confirm('Xác nhận đã nhận được hàng và thực hiện hoàn tiền ngay lập tức?')) return;
    
    setUpdating(true);
    try {
      const formData = new FormData();
      if (billImage) {
        formData.append('billImage', billImage);
      }

      const res = await fetch(`${API_ADMIN_ORDERS_URL}/${orderId}/refund-return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const payload = await parseJson(res);
      if (res.ok) {
        alert('Đã thực hiện hoàn tiền thành công!');
        setIsRefundOpen(false);
        setBillImage(null);
        setBillPreview(null);
        fetchOrders(pagination.current);
      } else {
        alert(extractMessage(payload, 'Hoàn tiền thất bại.'));
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối.');
    } finally {
      setUpdating(false);
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

  const summary = useMemo(() => {
    const s = { pending: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0, payment_failed: 0, returns: 0 };
    for (const o of orders) {
      const st = o?.status;
      if (['return_requested', 'refund_requested', 'return_approved', 'returning', 'return_confirmed', 'returned', 'rejected_refund', 'rejected_return', 'recjected_refund'].includes(st)) {
        s.returns += 1;
      } else if (st in s) {
        s[st] += 1;
      }
    }
    return s;
  }, [orders]);

  const statsCards = [
    { label: 'Chờ xác nhận', value: summary.pending, icon: 'pending_actions', tone: 'si-blue' },
    { label: 'Đã xác nhận', value: summary.confirmed, icon: 'inventory', tone: 'si-amber' },
    { label: 'Đang giao', value: summary.shipping, icon: 'local_shipping', tone: 'si-teal' },
    { label: 'Hoàn tất', value: summary.completed, icon: 'check_circle', tone: 'si-green' },
    { label: 'Trả hàng', value: summary.returns, icon: 'assignment_return', tone: 'si-orange' },
    { label: 'Đã hủy', value: summary.cancelled, icon: 'cancel', tone: 'si-red' },
  ];

  const hasFilters = filters.status || filters.keyword || filters.fromDate || filters.toDate;

  const orderGridStyle = {
    gridTemplateColumns: 'minmax(170px, 1fr) minmax(220px, 1.35fr) minmax(165px, 0.95fr) minmax(140px, 0.85fr) minmax(160px, 0.95fr) minmax(220px, 1.2fr)',
  };

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap min-w-0">
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

        {/* FILTER BAR */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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

            <select className="fselect" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
              <option value="payment_failed">Thanh toán lỗi</option>
              <option value="return_requested">Yêu cầu trả hàng</option>
              <option value="rejected_refund">Từ chối trả hàng</option>
            </select>

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

        <div className="table-wrap table-wrap-scroll table-wrap-orders">
          <div className="table-wrap-orders-inner" style={{ minWidth: '1080px', width: 'max(100%, 1080px)' }}>
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
                const statusKey = (o.status || '').toLowerCase();
                const isRefundRelated = ['return_requested', 'refund_requested', 'refunded', 'return_approved', 'returning', 'return_confirmed', 'returned', 'rejected_refund', 'rejected_return', 'recjected_refund'].includes(statusKey);

                return (
                  <div className="tbl-row" key={String(orderId)} style={orderGridStyle}>
                    <div>
                      <div className="prod-name" style={{ color: '#0066A2', fontWeight: 900 }}>{o?.orderCode || `#${orderId}`}</div>
                      <div className="price-note" style={{ textAlign: 'left' }}>{o?.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}</div>
                    </div>
                    <div>
                      <div className="prod-name" style={{ fontSize: '13px' }}>{o?.customerName || '—'}</div>
                      <div className="prod-meta" style={{ textTransform: 'none', letterSpacing: 'normal' }}>{o?.customerEmail || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>{o?.paymentMethod}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{translatePaymentStatus(o?.paymentStatus)}</div>
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
                      <div className="act-row order-actions">
                        {isRefundRelated && (
                          <button className="act-btn" onClick={() => openRefundInfo(orderId)} style={{ color: '#C4714A', borderColor: '#F8D5C8' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span> {['return_requested', 'refund_requested'].includes(statusKey) ? 'Xử lý hoàn' : 'Chi tiết hoàn'}
                          </button>
                        )}
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

          <div className="tbl-footer">
            <span className="footer-text">
              Tổng số: <strong>{pagination.total}</strong> đơn hàng
            </span>
            <div className="pager">
              <button className="page-btn" disabled={pagination.current <= 1} onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let start = Math.max(1, pagination.current - 2);
                let end = Math.min(pagination.pages, start + maxVisible - 1);
                
                if (end - start + 1 < maxVisible) {
                  start = Math.max(1, end - maxVisible + 1);
                }

                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
                return pages.map(p => (
                  <button key={p} className={`page-btn ${pagination.current === p ? 'active' : ''}`} onClick={() => setPagination(prev => ({ ...prev, current: p }))}>
                    {p}
                  </button>
                ));
              })()}
              <button className="page-btn" disabled={pagination.current >= pagination.pages} onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
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
                          <span className="text-xs font-bold text-slate-700 uppercase">{detailOrder.payment?.method || detailOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Tình trạng:</span>
                          <span className={`text-xs font-bold ${detailOrder.payment?.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {translatePaymentStatus(detailOrder.payment?.status || detailOrder.paymentStatus)}
                          </span>
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
                                <img src={getImageUrl(item.thumbnailUrl)} alt={item.productName} className="size-12 rounded-lg object-cover" />
                                <div>
                                  <div className="text-sm font-bold text-slate-900">{item.productName}</div>
                                  <div className="text-[10px] text-slate-500 uppercase">Màu: {item.color} · Size: {item.size}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm">{formatVND(item.unitPrice || item.price)}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold">{formatVND(item.lineTotal || (item.price * item.quantity))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-4">
                    <div className="w-full max-w-xs space-y-2 text-right">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Tạm tính:</span>
                        <span>{formatVND(detailOrder.subTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-rose-500 font-bold">
                        <span>Giảm giá:</span>
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
              <button onClick={() => handleExportInvoice(detailOrder?.orderId, detailOrder?.orderCode)} className="btn-ghost" style={{ color: '#0066A2' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span> Xuất hóa đơn
              </button>
              <button onClick={() => setIsDetailOpen(false)} className="btn-ghost">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND INFO MODAL */}
      {isRefundOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setIsRefundOpen(false);
            setBillImage(null);
            setBillPreview(null);
          }} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-orange-50/50">
              <div>
                <h2 className="text-xl font-black text-orange-900">Thông tin hoàn tiền</h2>
                <p className="text-xs text-orange-700 mt-0.5">Yêu cầu cho đơn hàng {refundInfo?.orderCode}</p>
              </div>
              <button onClick={() => {
                setIsRefundOpen(false);
                setBillImage(null);
                setBillPreview(null);
              }} className="p-2 hover:bg-orange-100 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {refundLoading ? (
                <div className="text-center py-20 text-slate-500 font-bold">Đang tải dữ liệu...</div>
              ) : !refundInfo ? (
                <div className="text-center py-20 text-rose-500 font-bold">Không tìm thấy thông tin hoàn tiền.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Khách hàng</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Họ tên</div>
                        <div className="text-sm font-bold text-slate-900">{refundInfo.customerName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Email</div>
                        <div className="text-sm text-slate-700">{refundInfo.customerEmail}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Chi tiết</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Lý do hoàn hàng</div>
                        <div className="text-sm p-3 bg-orange-50 text-orange-800 rounded-xl border border-orange-100 italic">
                          "{refundInfo.refundReason}"
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-right w-full">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Số tiền hoàn</div>
                          <div className="text-lg font-black text-rose-600">{formatVND(refundInfo.refundAmount || refundInfo.orderTotal)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {refundInfo.refundBankInfo && (
                    <div className="col-span-1 md:col-span-2 space-y-4">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Thông tin ngân hàng nhận hoàn (COD)</h3>
                      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-mono text-sm">
                        {refundInfo.refundBankInfo}
                      </div>
                    </div>
                  )}

                  {refundInfo.refundTransferProofUrl && (
                    <div className="col-span-1 md:col-span-2 space-y-4">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Minh chứng hoàn tiền (Admin)</h3>
                      <img 
                        src={getImageUrl(refundInfo.refundTransferProofUrl)} 
                        alt="Bill" 
                        className="w-full max-w-sm object-contain rounded-xl border border-slate-200 cursor-pointer" 
                        onClick={() => window.open(getImageUrl(refundInfo.refundTransferProofUrl), '_blank')} 
                      />
                    </div>
                  )}

                  {!refundInfo.refundApprovedAt && refundInfo.paymentMethod === 'cod' && ['returning', 'return_confirmed', 'return_approved', 'returned'].includes(refundInfo.orderStatus) && (
                    <div className="col-span-1 md:col-span-2 space-y-4 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 text-orange-600">Tải lên ảnh Bill chuyển khoản (Bắt buộc cho COD)</h3>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition text-slate-700">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setBillImage(file);
                              setBillPreview(URL.createObjectURL(file));
                            }
                          }} />
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            Chọn ảnh bill
                          </div>
                        </label>
                        {billPreview && (
                          <div className="relative group">
                            <img src={billPreview} alt="Preview" className="size-24 object-cover rounded-lg border border-slate-200" />
                            <button onClick={() => { setBillImage(null); setBillPreview(null); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-lg">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 space-y-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Hình ảnh minh chứng</h3>
                    {refundInfo.imageUrls && refundInfo.imageUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-4">
                        {refundInfo.imageUrls.map((url, index) => (
                          <img key={index} src={getImageUrl(url)} alt="proof" className="w-32 h-32 object-cover rounded-xl border border-slate-200 cursor-pointer" onClick={() => window.open(getImageUrl(url), '_blank')} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Không có hình ảnh đính kèm.</div>
                    )}
                  </div>
                  
                  {refundInfo.refundApprovedAt && (
                    <div className="col-span-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                       <div className="text-[10px] text-emerald-600 uppercase font-bold">Đã duyệt hoàn tiền lúc</div>
                       <div className="text-sm font-bold text-emerald-900">{new Date(refundInfo.refundApprovedAt).toLocaleString('vi-VN')}</div>
                    </div>
                  )}

                  {['rejected_refund', 'rejected_return', 'recjected_refund'].includes(refundInfo.orderStatus) && (
                    <div className="col-span-2 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                       <div className="text-[10px] text-rose-600 uppercase font-bold">Lý do từ chối trả hàng</div>
                       <div className="text-sm font-bold text-rose-900 italic">"{refundInfo.refundRejectReason || 'Không có lý do cụ thể'}"</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/30">
              <button onClick={() => {
                setIsRefundOpen(false);
                setBillImage(null);
                setBillPreview(null);
              }} className="btn-ghost">Đóng</button>
              {!refundInfo?.refundApprovedAt && (
                <>
                  {['return_requested', 'refund_requested'].includes(refundInfo?.orderStatus) && (
                    <>
                      <button onClick={() => handleRejectReturnRequest(refundInfo?.orderId)} disabled={updating} className="bg-rose-100 text-rose-700 text-[11px] uppercase font-bold px-8 py-3">Từ chối</button>
                      <button onClick={() => handleConfirmReturnRequest(refundInfo?.orderId)} disabled={updating} className="bg-slate-900 text-white text-[11px] uppercase font-bold px-8 py-3">Chấp nhận trả hàng</button>
                    </>
                  )}
                  {['returning', 'return_confirmed', 'return_approved', 'returned'].includes(refundInfo?.orderStatus) && (
                    <button onClick={() => handleRefundReturnOrder(refundInfo?.orderId)} disabled={updating} className="bg-emerald-600 text-white text-[11px] uppercase font-bold px-8 py-3">Xác nhận & Hoàn tiền</button>
                  )}
                </>
              )}
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
              <h2 className="text-lg font-black text-slate-900">Cập nhật đơn hàng</h2>
            </div>
            <div className="p-6 space-y-4">
              <select className="fselect w-full" value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}>
                {getAvailableNextStatuses(updateOrder?.status).map(st => (
                  <option key={st} value={st}>{humanStatus(st)}</option>
                ))}
              </select>
              {updateForm.status === 'shipping' && (
                <input type="text" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Mã vận đơn" value={updateForm.trackingCode} onChange={(e) => setUpdateForm({ ...updateForm, trackingCode: e.target.value })} />
              )}
              {updateForm.status === 'cancelled' && (
                <textarea className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm min-h-[100px]" placeholder="Lý do hủy" value={updateForm.reason} onChange={(e) => setUpdateForm({ ...updateForm, reason: e.target.value })} />
              )}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button onClick={() => setIsUpdateOpen(false)} className="btn-ghost flex-1">Hủy</button>
              <button onClick={handleUpdateStatus} disabled={updating} className="btn-primary flex-1">{updating ? 'Đang lưu...' : 'Xác nhận'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
