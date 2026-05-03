import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_ORDERS_URL = '/api/v1/orders';

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

function normalizeOrdersPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.data?.result)) return payload.data.result;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data?.content)) return payload.data.content;
  return [];
}

function StatusPill({ label, tone = 'slate' }) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : tone === 'rose'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

export default function OrdersPage() {
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const [actionBusyId, setActionBusyId] = useState(null);
  const [cancelReasonById, setCancelReasonById] = useState({});

  const fetchMyOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ORDERS_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseJson(res);

      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải đơn hàng.'));
      setOrders(normalizeOrdersPayload(payload));
    } catch (e) {
      setError(e?.message || 'Không thể tải đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCancel = (order) => order?.status === 'pending';

  const canRetryVnpay = (order) => order?.status === 'payment_failed' && order?.paymentMethod === 'vnpay';

  const cancelOrder = async (orderId) => {
    if (actionBusyId) return;
    setActionBusyId(orderId);
    try {
      const res = await fetch(`${API_ORDERS_URL}/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReasonById[orderId] || 'Người dùng hủy đơn' }),
      });
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể hủy đơn.'));
      await fetchMyOrders();
    } catch (e) {
      alert(e?.message || 'Không thể hủy đơn.');
    } finally {
      setActionBusyId(null);
    }
  };

  const retryVnpay = async (orderId) => {
    if (actionBusyId) return;
    setActionBusyId(orderId);
    try {
      const res = await fetch(`${API_ORDERS_URL}/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod: 'vnpay' }),
      });
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tạo lại thanh toán.'));
      const paymentUrl = payload?.paymentUrl ?? payload?.data?.paymentUrl;
      if (!paymentUrl) throw new Error('Không tìm thấy paymentUrl từ server.');
      window.location.href = paymentUrl;
    } catch (e) {
      alert(e?.message || 'Không thể thanh toán lại.');
    } finally {
      setActionBusyId(null);
    }
  };

  const summary = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const shipping = orders.filter((o) => o.status === 'shipping').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    return { pending, confirmed, shipping, completed };
  }, [orders]);

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen pb-24">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Đơn hàng của tôi</h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi trạng thái đặt hàng & thanh toán</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill label={`Chờ xử lý: ${summary.pending}`} />
            <StatusPill label={`Đã xác nhận: ${summary.confirmed}`} tone="amber" />
            <StatusPill label={`Đang giao: ${summary.shipping}`} tone="amber" />
            <StatusPill label={`Hoàn tất: ${summary.completed}`} tone="emerald" />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-100 p-6">Đang tải...</div>
        ) : error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-700 font-bold">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-100 p-10 text-center">
            <div className="text-slate-500 font-bold">Bạn chưa có đơn hàng.</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((o) => {
              const orderId = o.orderId ?? o.id;
              const status = o.status;
              const paymentStatus = o.paymentStatus;

              const statusTone =
                status === 'completed'
                  ? 'emerald'
                  : status === 'cancelled'
                    ? 'rose'
                    : status === 'shipping'
                      ? 'amber'
                      : 'slate';

              const paymentTone = paymentStatus === 'paid' ? 'emerald' : paymentStatus === 'unpaid' ? 'slate' : paymentStatus === 'refund_requested' ? 'amber' : 'slate';

              return (
                <div key={String(orderId)} className="rounded-2xl bg-white border border-slate-100 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/orders/${orderId}`}
                          className="font-black text-slate-900 hover:text-[#ec5b13] truncate max-w-[240px]"
                        >
                          {o.orderCode}
                        </Link>
                        <StatusPill label={`Trạng thái: ${status}`} tone={statusTone} />
                        <StatusPill label={`Thanh toán: ${paymentStatus}`} tone={paymentTone} />
                      </div>
                      <div className="text-sm text-slate-500 mt-2">
                        PT thanh toán: <span className="font-bold">{o.paymentMethod}</span> · Tổng:{' '}
                        <span className="font-bold">{o.total ?? 0}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="text-xs text-slate-500">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''}
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        {canRetryVnpay(o) ? (
                          <button
                            type="button"
                            disabled={actionBusyId === orderId}
                            onClick={() => retryVnpay(orderId)}
                            className="rounded-xl bg-[#ec5b13] px-4 py-2 text-xs font-black text-white hover:bg-[#d95210] disabled:opacity-50"
                          >
                            {actionBusyId === orderId ? 'Đang tạo...' : 'Thanh toán lại (VNPAY)'}
                          </button>
                        ) : null}

                        {canCancel(o) ? (
                          <>
                            <input
                              type="text"
                              value={cancelReasonById[orderId] ?? ''}
                              onChange={(e) => setCancelReasonById((prev) => ({ ...prev, [orderId]: e.target.value }))}
                              placeholder="Lý do hủy (tuỳ chọn)"
                              className="w-full sm:w-56 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
                              disabled={actionBusyId === orderId}
                            />
                            <button
                              type="button"
                              disabled={actionBusyId === orderId}
                              onClick={() => cancelOrder(orderId)}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              Hủy đơn
                            </button>
                          </>
                        ) : null}

                        <Link
                          to={`/orders/${orderId}`}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
