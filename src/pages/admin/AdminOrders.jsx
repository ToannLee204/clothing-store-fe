import React, { useEffect, useMemo, useState } from 'react';
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

const normalizeOrdersPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.data?.result)) return payload.data.result;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data?.content)) return payload.data.content;
  return [];
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
    default: return 'badge-gray';
  }
}

export default function AdminOrders() {
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  // Modals state
  const [detailOrder, setDetailOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [updateOrder, setUpdateOrder] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingCode: '', reason: '' });
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ADMIN_ORDERS_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải đơn hàng.'));
      setOrders(normalizeOrdersPayload(payload));
    } catch (e) {
      setError(e?.message || 'Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
      await fetchOrders();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

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
    { label: 'Đang xử lý', value: summary.confirmed, icon: 'inventory', tone: 'si-amber' },
    { label: 'Đang giao', value: summary.shipping, icon: 'local_shipping', tone: 'si-teal' },
    { label: 'Hoàn tất', value: summary.completed, icon: 'check_circle', tone: 'si-green' },
    { label: 'Đã hủy', value: summary.cancelled, icon: 'cancel', tone: 'si-red' },
    { label: 'Lỗi T.Toán', value: summary.payment_failed, icon: 'error', tone: 'si-gray' },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] font-sans">
      <div className="pm-wrap">
        <div className="pm-topbar">
          <div className="pm-title-block">
            <div className="pm-title">Quản lý đơn hàng</div>
            <div className="pm-subtitle">Xử lý, cập nhật trạng thái và xem chi tiết đơn hàng khách hàng.</div>
          </div>
          <div className="pm-actions">
            <button className="btn-primary" onClick={fetchOrders} disabled={loading}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span> {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

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

        {loading ? (
          <div className="table-wrap">
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đơn hàng...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="table-wrap">
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chưa có đơn hàng nào.</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((o) => {
              const orderId = o?.orderId ?? o?.id;
              const nextStatuses = getAvailableNextStatuses(o.status);

              return (
                <div key={String(orderId)} className="table-wrap" style={{ padding: '24px' }}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                          {o?.orderCode || `#${orderId}`}
                        </span>
                        <span className={`badge ${getStatusBadge(o?.status)}`}>
                          {humanStatus(o?.status)}
                        </span>
                        <span className="badge badge-gray" style={{ textTransform: 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>payments</span>
                          {o?.paymentMethod} · {o?.paymentStatus}
                        </span>
                      </div>

                      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tổng cộng</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#0066A2', marginTop: '4px' }}>{formatVND(o?.total)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Khách hàng</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>{o?.fullName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Ngày tạo</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                            {o?.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="btn-ghost" onClick={() => openDetail(orderId)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span> Chi tiết
                      </button>
                      {nextStatuses.length > 0 && (
                        <button className="btn-primary" onClick={() => openUpdate(o)}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_square</span> Cập nhật
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end bg-slate-50/30">
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
