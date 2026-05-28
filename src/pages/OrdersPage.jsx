import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatDateTime,
  formatVND,
  getOrderStatusColor,
  translateOrderStatus,
  translatePaymentStatus,
} from '../utils/format';

const API_ORDERS_URL = '/api/v1/orders';
const PAGE_SIZE = 6;

function findFirstArray(value, visited = new Set()) {
  if (!value || typeof value !== 'object' || visited.has(value)) return null;
  visited.add(value);

  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.result)) return value.result;
  if (Array.isArray(value.content)) return value.content;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.list)) return value.list;
  if (Array.isArray(value.orders)) return value.orders;
  if (Array.isArray(value.records)) return value.records;

  return (
    findFirstArray(value.data, visited) ||
    findFirstArray(value.result, visited) ||
    findFirstArray(value.content, visited) ||
    findFirstArray(value.page, visited) ||
    findFirstArray(value.payload, visited)
  );
}

function getUniqueOrderKey(order) {
  return String(order?.orderId ?? order?.id ?? order?.orderCode ?? '');
}

function normalizeOrdersPayload(payload) {
  const source = findFirstArray(payload) || [];
  const flat = [];
  const seen = new Set();

  for (const item of source) {
    if (!item || typeof item !== 'object') continue;

    const key = getUniqueOrderKey(item);
    const dedupeKey = key || JSON.stringify(item);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    flat.push(item);
  }

  return flat;
}

function getOrderId(order) {
  return order?.orderId ?? order?.id ?? order?.orderCode ?? '';
}

function getOrderTotal(order) {
  return order?.totalAmount ?? order?.total ?? order?.subTotal ?? order?.grandTotal ?? 0;
}

function getItemCount(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
}

function getPaymentStatus(order) {
  return order?.paymentStatus ?? order?.payment?.status ?? '';
}

function getPaymentBadgeClass(order) {
  const paymentStatus = getPaymentStatus(order).toLowerCase();
  return paymentStatus === 'paid'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';
}

function getOrderLabel(order) {
  const orderId = getOrderId(order);
  return order?.orderCode || (orderId ? `#${orderId}` : '—');
}

function OrderMetaCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-lumiere-blush/35 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lumiere-gray">{label}</p>
      <p className="mt-1 text-sm font-semibold text-lumiere-charcoal">{value || '—'}</p>
    </div>
  );
}

function PaginationButton({ active, children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition ${
        active
          ? 'border-lumiere-charcoal bg-lumiere-charcoal text-white'
          : 'border-lumiere-gray/20 bg-white text-lumiere-gray hover:border-lumiere-charcoal hover:text-lumiere-charcoal'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vui lòng đăng nhập để xem đơn hàng.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(API_ORDERS_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(payload?.message || 'Không thể tải đơn hàng.');
        }

        const data = normalizeOrdersPayload(payload);
        setOrders(data);
      } catch (err) {
        setError(err?.message || 'Không thể tải đơn hàng.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (currentPage > 1 && (currentPage - 1) * PAGE_SIZE >= orders.length) {
      setCurrentPage(1);
    }
  }, [orders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const visibleOrders = useMemo(
    () => orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [orders, currentPage]
  );

  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

    const filtered = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    const output = [];
    for (let i = 0; i < filtered.length; i += 1) {
      const page = filtered[i];
      const prev = filtered[i - 1];

      if (i > 0 && page - prev > 1) {
        output.push('ellipsis');
      }

      output.push(page);
    }

    return output;
  }, [currentPage, totalPages]);

  const emptyState = useMemo(
    () => (
      <div className="rounded-3xl border border-dashed border-lumiere-gray/25 bg-white px-6 py-14 text-center shadow-sm">
        <h2 className="serif text-3xl font-light text-lumiere-charcoal">Chưa có đơn hàng nào</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-lumiere-gray">
          Bạn chưa có đơn hàng nào trong hệ thống. Khi có đơn mới, tất cả thông tin sẽ hiển thị ở đây.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl bg-lumiere-charcoal px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-lumiere-terracotta"
          >
            Mua sắm ngay
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-xl border border-lumiere-gray/20 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-lumiere-charcoal transition hover:border-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white"
          >
            Về hồ sơ
          </Link>
        </div>
      </div>
    ),
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-lumiere-cream px-4 py-16">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-white/70 bg-white/70 py-24 shadow-sm backdrop-blur">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-lumiere-terracotta border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lumiere-cream py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lumiere-gray">Tài khoản</p>
            <h1 className="serif mt-2 text-3xl font-light text-lumiere-charcoal sm:text-4xl">Đơn hàng của tôi</h1>
            <p className="mt-2 text-sm text-lumiere-gray">
              Theo dõi trạng thái, xem chi tiết và quản lý lịch sử mua hàng.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl border border-lumiere-gray/20 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-lumiere-charcoal transition hover:border-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {!error && orders.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <div className="text-sm text-lumiere-gray">
              Hiển thị {orders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, orders.length)} / {orders.length} đơn hàng
            </div>

            {visibleOrders.map((order) => {
              const orderId = getOrderId(order);
              const orderCode = getOrderLabel(order);
              const createdAt = formatDateTime(order?.createdAt || order?.createdDate || order?.orderDate || order?.createdOn);
              const total = formatVND(getOrderTotal(order));
              const itemCount = getItemCount(order);
              const statusClass = getOrderStatusColor((order?.status || '').toLowerCase());
              const paymentClass = getPaymentBadgeClass(order);
              const paymentStatusLabel = translatePaymentStatus(getPaymentStatus(order));

              return (
                <article
                  key={String(orderId || orderCode)}
                  className="rounded-3xl border border-lumiere-gray/15 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusClass}`}
                        >
                          {translateOrderStatus(order?.status)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${paymentClass}`}
                        >
                          {paymentStatusLabel}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <OrderMetaCard label="Mã đơn hàng" value={orderCode} />
                        <OrderMetaCard label="Ngày đặt" value={createdAt || '—'} />
                        <OrderMetaCard label="Sản phẩm" value={itemCount > 0 ? `${itemCount} món` : '—'} />
                        <OrderMetaCard label="Tổng tiền" value={total} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:w-52">
                      <Link
                        to={`/orders/${orderId}`}
                        className="inline-flex items-center justify-center rounded-xl bg-lumiere-charcoal px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-lumiere-terracotta"
                      >
                        Xem chi tiết
                      </Link>

                      {order?.paymentUrl ? (
                        <a
                          href={order.paymentUrl}
                          className="inline-flex items-center justify-center rounded-xl border border-lumiere-terracotta/20 bg-lumiere-terracotta/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-lumiere-terracotta transition hover:bg-lumiere-terracotta hover:text-white"
                        >
                          Thanh toán ngay
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {totalPages > 1 ? (
              <div className="flex flex-col gap-4 border-t border-lumiere-gray/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-lumiere-gray">
                  Trang {currentPage} / {totalPages}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <PaginationButton
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trước
                  </PaginationButton>

                  {paginationRange.map((page, index) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-lumiere-gray">
                        ...
                      </span>
                    ) : (
                      <PaginationButton
                        key={page}
                        type="button"
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationButton>
                    )
                  )}

                  <PaginationButton
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                  </PaginationButton>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
