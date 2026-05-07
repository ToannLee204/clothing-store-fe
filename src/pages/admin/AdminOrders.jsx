import React, { useEffect, useMemo, useState } from 'react';

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

function getAvailableNextStatuses(order) {
  // Mirrors backend allowed transitions in OrderServiceImpl.updateOrderStatus:
  // pending -> confirmed | cancelled
  // confirmed -> shipping | cancelled
  // shipping -> completed
  const status = order?.status;
  if (status === 'pending') return ['confirmed', 'cancelled'];
  if (status === 'confirmed') return ['shipping', 'cancelled'];
  if (status === 'shipping') return ['completed'];
  return [];
}

function humanStatus(status) {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    case 'shipping':
      return 'shipping';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'payment_failed':
      return 'payment_failed';
    default:
      return status || '—';
  }
}

export default function AdminOrders() {
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const [busyOrderId, setBusyOrderId] = useState(null);

  const [trackingCodeByOrderId, setTrackingCodeByOrderId] = useState({});
  const [cancelReasonByOrderId, setCancelReasonByOrderId] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ADMIN_ORDERS_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải đơn hàng (admin).'));
      setOrders(normalizeOrdersPayload(payload));
    } catch (e) {
      setError(e?.message || 'Không thể tải đơn hàng (admin).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (orderId, nextStatus) => {
    if (!orderId) return;
    if (busyOrderId) return;

    setBusyOrderId(orderId);

    try {
      const body = { status: nextStatus };

      if (nextStatus === 'shipping') {
        const trackingCode = (trackingCodeByOrderId[orderId] || '').trim();
        if (!trackingCode) throw new Error('trackingCode là bắt buộc khi chuyển sang shipping.');
        body.trackingCode = trackingCode;
      }

      if (nextStatus === 'cancelled') {
        const reason = (cancelReasonByOrderId[orderId] || '').trim();
        if (!reason) throw new Error('reason là bắt buộc khi hủy đơn.');
        body.reason = reason;
      }

      const res = await fetch(`${API_ADMIN_ORDERS_URL}/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể cập nhật trạng thái đơn.'));
      await fetchOrders();
    } catch (e) {
      alert(e?.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const summary = useMemo(() => {
    const s = { pending: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0 };
    for (const o of orders) {
      const st = o?.status;
      if (st in s) s[st] += 1;
    }
    return s;
  }, [orders]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f6f6] font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Cập nhật trạng thái theo workflow backend.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            pending: {summary.pending}
          </span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
            confirmed: {summary.confirmed}
          </span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
            shipping: {summary.shipping}
          </span>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            completed: {summary.completed}
          </span>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
            cancelled: {summary.cancelled}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-6">Đang tải...</div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-700 font-bold">{error}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-10 text-center text-slate-500 font-bold">
          Chưa có đơn hàng.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((o) => {
            const orderId = o?.orderId ?? o?.id;
            const nextStatuses = getAvailableNextStatuses(o);

            return (
              <div key={String(orderId)} className="rounded-2xl bg-white border border-slate-100 p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900 truncate max-w-[220px]">
                        {o?.orderCode || `#${orderId}`}
                      </span>
                      <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                        status: {humanStatus(o?.status)}
                      </span>
                      <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                        payment: {o?.paymentStatus ?? '—'}
                      </span>
                      <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                        method: {o?.paymentMethod ?? '—'}
                      </span>
                    </div>

                    <div className="text-sm text-slate-500 mt-2">
                      Tổng: <span className="font-bold text-slate-900">{formatVND(o?.total)}</span>
                      {o?.createdAt ? (
                        <>
                          {' '}
                          · Ngày tạo:{' '}
                          <span className="font-semibold text-slate-700">
                            {new Date(o.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-full lg:w-[520px] space-y-3">
                    {nextStatuses.includes('shipping') ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tracking code"
                          value={trackingCodeByOrderId[orderId] ?? ''}
                          onChange={(e) =>
                            setTrackingCodeByOrderId((prev) => ({ ...prev, [orderId]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
                          disabled={busyOrderId === orderId}
                        />
                        <button
                          type="button"
                          onClick={() => updateStatus(orderId, 'shipping')}
                          disabled={busyOrderId === orderId}
                          className="rounded-xl bg-[#ec5b13] px-4 py-2 text-sm font-black text-white hover:bg-[#d95210] disabled:opacity-50"
                        >
                          {busyOrderId === orderId ? 'Đang cập nhật...' : 'Chuyển shipping'}
                        </button>
                      </div>
                    ) : null}

                    {nextStatuses.includes('cancelled') ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder="Lý do hủy (bắt buộc)"
                          value={cancelReasonByOrderId[orderId] ?? ''}
                          onChange={(e) =>
                            setCancelReasonByOrderId((prev) => ({ ...prev, [orderId]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-200 disabled:opacity-50"
                          disabled={busyOrderId === orderId}
                        />
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.includes('confirmed') ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(orderId, 'confirmed')}
                          disabled={busyOrderId === orderId}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {busyOrderId === orderId ? 'Đang...' : 'Xác nhận'}
                        </button>
                      ) : null}

                      {nextStatuses.includes('cancelled') ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(orderId, 'cancelled')}
                          disabled={busyOrderId === orderId}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          {busyOrderId === orderId ? 'Đang...' : 'Hủy đơn'}
                        </button>
                      ) : null}

                      {nextStatuses.includes('completed') ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(orderId, 'completed')}
                          disabled={busyOrderId === orderId}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {busyOrderId === orderId ? 'Đang...' : 'Hoàn tất'}
                        </button>
                      ) : null}
                    </div>

                    {nextStatuses.length === 0 ? (
                      <div className="text-xs text-slate-500">Không có thao tác phù hợp cho trạng thái hiện tại.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
