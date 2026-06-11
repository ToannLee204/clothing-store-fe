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

// Helper functions (giữ nguyên logic)
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

// Component Meta Card được làm đẹp
function OrderMetaCard({ label, value, icon }) {
  return (
    <div className="group flex items-start gap-3 rounded-2xl bg-white/60 p-4 transition-all hover:bg-white hover:shadow-sm">
      {icon && <div className="mt-0.5 text-lumiere-terracotta/70">{icon}</div>}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lumiere-gray">{label}</p>
        <p className="mt-1 font-serif text-base font-medium text-lumiere-charcoal">{value || '—'}</p>
      </div>
    </div>
  );
}

// Nút phân trang được thiết kế lại
function PaginationButton({ active, children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-all duration-200 ${
        active
          ? 'border-lumiere-terracotta bg-lumiere-terracotta text-white shadow-md'
          : 'border-lumiere-gray/30 bg-white text-lumiere-gray hover:border-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white'
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
        if (!res.ok) throw new Error(payload?.message || 'Không thể tải đơn hàng.');
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
      if (i > 0 && page - prev > 1) output.push('ellipsis');
      output.push(page);
    }
    return output;
  }, [currentPage, totalPages]);

  const emptyState = useMemo(
    () => (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-lumiere-blush/30 px-6 py-16 text-center shadow-md">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-lumiere-terracotta/10">
          <svg className="h-12 w-12 text-lumiere-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="serif text-3xl font-light text-lumiere-charcoal">Chưa có đơn hàng</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-lumiere-gray">
          Khi bạn đặt hàng lần đầu, mọi thông tin sẽ hiển thị tại đây.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/products"
            className="rounded-full bg-lumiere-charcoal px-8 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-lumiere-terracotta"
          >
            Khám phá sản phẩm
          </Link>
          <Link
            to="/profile"
            className="rounded-full border border-lumiere-gray/30 bg-white px-8 py-3 text-xs font-bold uppercase tracking-wider text-lumiere-charcoal transition hover:border-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white"
          >
            Thông tin tài khoản
          </Link>
        </div>
      </div>
    ),
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-lumiere-cream px-4 py-20">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-lumiere-terracotta border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lumiere-cream pt-24 pb-12 sm:pt-28 sm:pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-lumiere-terracotta/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-lumiere-terracotta">Lịch sử mua hàng</span>
            </div>
            <h1 className="serif mt-3 text-4xl font-light tracking-tight text-lumiere-charcoal sm:text-5xl">
              Đơn hàng của tôi
            </h1>
            <p className="mt-2 max-w-lg text-sm text-lumiere-gray">
              Quản lý và theo dõi trạng thái các đơn hàng đã đặt.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 self-start rounded-full border border-lumiere-gray/30 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-lumiere-charcoal transition hover:border-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tiếp tục mua sắm
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Orders List */}
        {!error && orders.length === 0 ? (
          emptyState
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-lumiere-gray">
              <span>
                Hiển thị{' '}
                <span className="font-medium text-lumiere-charcoal">
                  {orders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, orders.length)}
                </span>{' '}
                / <span className="font-medium text-lumiere-charcoal">{orders.length}</span> đơn hàng
              </span>
            </div>

            <div className="space-y-6">
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
                    className="group relative overflow-hidden rounded-3xl border border-lumiere-gray/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Decorative gradient line */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-lumiere-terracotta/40 via-lumiere-terracotta to-lumiere-terracotta/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
                          >
                            {translateOrderStatus(order?.status)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${paymentClass}`}
                          >
                            {paymentStatusLabel}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <OrderMetaCard
                            label="Mã đơn hàng"
                            value={orderCode}
                            icon={
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                            }
                          />
                          <OrderMetaCard
                            label="Ngày đặt"
                            value={createdAt || '—'}
                            icon={
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            }
                          />
                          <OrderMetaCard
                            label="Sản phẩm"
                            value={itemCount > 0 ? `${itemCount} món` : '—'}
                            icon={
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            }
                          />
                          <OrderMetaCard
                            label="Tổng tiền"
                            value={total}
                            icon={
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:w-52 lg:flex-col">
                        <Link
                          to={`/orders/${orderId}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-lumiere-charcoal px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-lumiere-terracotta"
                        >
                          Xem chi tiết
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        {order?.paymentUrl && (
                          <a
                            href={order.paymentUrl}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-lumiere-terracotta/30 bg-lumiere-terracotta/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-lumiere-terracotta transition hover:bg-lumiere-terracotta hover:text-white"
                          >
                            Thanh toán ngay
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-lumiere-gray/10 pt-8 sm:flex-row">
                <p className="text-sm text-lumiere-gray">
                  Trang {currentPage} / {totalPages}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <PaginationButton
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ←
                  </PaginationButton>

                  {paginationRange.map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-lumiere-gray">
                        ...
                      </span>
                    ) : (
                      <PaginationButton
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationButton>
                    )
                  )}

                  <PaginationButton
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    →
                  </PaginationButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}