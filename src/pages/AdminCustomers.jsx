import React, { useEffect, useMemo, useState } from 'react';

const API_ADMIN_CUSTOMERS_URL = '/api/v1/admin/customers';

function formatVND(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;
}

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

function extractListMetaAndItems(payload) {
  // Backend trả về ResultPaginationDTO(meta, content) => { meta, result }
  if (!payload) return { meta: null, items: [] };

  const meta = payload.meta || payload.data?.meta || null;

  const rawItems =
    payload.result ||
    payload.data?.result ||
    payload.data?.content ||
    payload.content ||
    payload.data ||
    [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  return { meta, items };
}

function extractMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.data?.message === 'string') return payload.data.message;
  return fallback;
}

function statusLabel(status) {
  return status ? 'Đang hoạt động' : 'Bị khóa';
}

function genderLabel(gender) {
  if (gender === null || gender === undefined || gender === '') return '—';
  return String(gender);
}

function verifiedLabel(verified) {
  return verified ? 'Đã xác thực' : 'Chưa xác thực';
}

export default function AdminCustomers() {
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });

  const [filters, setFilters] = useState({
    keyword: '',
    status: '', // '', 'true', 'false'
  });

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activeCount, lockedCount } = useMemo(() => {
    let active = 0;
    let locked = 0;
    for (const c of customers) {
      if (c?.status) active += 1;
      else locked += 1;
    }
    return { activeCount: active, lockedCount: locked };
  }, [customers]);

  const fetchCustomers = async (page = pagination.current) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: String(page - 1), // backend expects 0-based page
        pageSize: String(pagination.pageSize || 20),
      });

      const keyword = (filters.keyword || '').trim();
      if (keyword) queryParams.append('keyword', keyword);

      if (filters.status === 'true') queryParams.append('status', 'true');
      if (filters.status === 'false') queryParams.append('status', 'false');

      const res = await fetch(`${API_ADMIN_CUSTOMERS_URL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = await safeParseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải danh sách khách hàng (admin).'));

      const { meta, items } = extractListMetaAndItems(payload);
      setCustomers(items);

      if (meta) {
        setPagination({
          current: meta.page !== undefined ? meta.page + 1 : 1,
          pageSize: meta.pageSize || pagination.pageSize || 20,
          total: meta.totals ?? 0,
          pages: meta.pages || 1,
        });
      } else {
        setPagination((prev) => ({ ...prev, total: items.length, pages: 1 }));
      }
    } catch (e) {
      setError(e?.message || 'Không thể kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (userId) => {
    if (!userId) return;

    setDetailsLoading(true);
    setDetailsError('');
    setSelectedCustomer(null);

    try {
      const res = await fetch(`${API_ADMIN_CUSTOMERS_URL}/${userId}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = await safeParseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, 'Không thể tải chi tiết khách hàng.'));

      setSelectedCustomer(payload?.data || payload); // tùy controller trả trực tiếp DTO hay bọc
      setIsModalOpen(true);
    } catch (e) {
      setDetailsError(e?.message || 'Lỗi tải chi tiết khách hàng.');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // khi thay bộ lọc -> quay lại trang 1 và load
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [filters.keyword, filters.status]);

  useEffect(() => {
    // load lại khi current thay theo bộ lọc
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const canPrev = pagination.current > 1;
  const canNext = pagination.current < pagination.pages;

  const handleClearFilters = () => {
    setFilters({ keyword: '', status: '' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f6f6] font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý khách hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Tìm kiếm theo tên/email, lọc trạng thái và xem chi tiết.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            Đang hoạt động: {activeCount}
          </span>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
            Bị khóa: {lockedCount}
          </span>
        </div>
      </div>

      <section className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <div className="w-full sm:w-[340px]">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tìm kiếm</label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                placeholder="Nhập tên hoặc email..."
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
              />
            </div>

            <div className="w-full sm:w-[220px]">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
              >
                <option value="">Tất cả</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Bị khóa</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
            {(filters.keyword || filters.status) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 hover:bg-rose-100"
              >
                Xóa lọc
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchCustomers(1)}
              className="rounded-xl bg-[#ec5b13] px-4 py-2 text-sm font-black text-white hover:bg-[#d95210]"
            >
              Áp dụng
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        <div className="text-sm text-slate-500">
          Hiển thị trang <span className="font-bold text-slate-900">{pagination.current}</span> /{' '}
          <span className="font-bold text-slate-900">{pagination.pages}</span> · Tổng:{' '}
          <span className="font-bold text-slate-900">{pagination.total}</span>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-6">Đang tải...</div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-10 text-center text-slate-500 font-bold">
          Chưa tìm thấy khách hàng.
        </div>
      ) : (
        <section className="rounded-3xl border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Khách hàng</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Email / SĐT</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">Giới tính</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-center">Xác thực</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-right"># Đơn hàng</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={String(c.userId)} className="group transition hover:bg-[#fdf7f3]">
                    <td className="px-6 py-5 align-middle">
                      <div className="max-w-[260px]">
                        <div className="text-sm font-bold text-slate-900 truncate">{c.fullName || '—'}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          userId: <span className="font-mono text-slate-600">{c.userId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-middle">
                      <div className="text-sm text-slate-700">
                        <div className="truncate">{c.email || '—'}</div>
                        <div className="mt-1 text-xs text-slate-500 truncate">{c.phoneNumber || '—'}</div>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-middle text-center text-sm font-semibold text-slate-700">
                      {genderLabel(c.gender)}
                    </td>

                    <td className="px-6 py-5 align-middle text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase ${
                          c.status
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                      >
                        {statusLabel(c.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 align-middle text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase ${
                          c.emailVerified
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {verifiedLabel(c.emailVerified)}
                      </span>
                    </td>

                    <td className="px-6 py-5 align-middle text-right text-sm font-black text-slate-900">
                      {c.totalOrders ?? 0}
                    </td>

                    <td className="px-6 py-5 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => fetchCustomerDetail(c.userId)}
                        className="inline-flex items-center justify-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Trang hiện tại: <span className="font-bold text-slate-900">{pagination.current}</span> · Tổng:{' '}
              <span className="font-bold text-slate-900">{pagination.total}</span> khách hàng
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={!canPrev}
                onClick={() => fetchCustomers(pagination.current - 1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              <button className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#ec5b13] px-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(236,91,19,0.2)]">
                {pagination.current}
              </button>

              <button
                disabled={!canNext}
                onClick={() => fetchCustomers(pagination.current + 1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-900 truncate">
                  {selectedCustomer?.fullName || 'Chi tiết khách hàng'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  userId: <span className="font-mono">{selectedCustomer?.userId ?? '—'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-auto">
              {detailsLoading ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-sm font-bold text-slate-700">
                  Đang tải chi tiết...
                </div>
              ) : detailsError ? (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm font-bold text-rose-700">
                  {detailsError}
                </div>
              ) : !selectedCustomer ? (
                <div className="rounded-2xl bg-white border border-slate-100 p-6 text-sm text-slate-500">
                  Không có dữ liệu.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900 break-words">
                        {selectedCustomer.email || '—'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 break-words">
                        SĐT: {selectedCustomer.phoneNumber || '—'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        Giới tính: {genderLabel(selectedCustomer.gender)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Ngày sinh:{' '}
                        <span className="font-semibold text-slate-700">
                          {selectedCustomer.dateOfBirth
                            ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString('vi-VN')
                            : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase ${
                            selectedCustomer.status
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {statusLabel(selectedCustomer.status)}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase ${
                            selectedCustomer.emailVerified
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {verifiedLabel(selectedCustomer.emailVerified)}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-slate-700">
                        Tổng chi tiêu:{' '}
                        <span className="font-black text-slate-900">{formatVND(selectedCustomer.totalSpent)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase">Tổng đơn</div>
                      <div className="mt-2 text-2xl font-black text-slate-900">
                        {selectedCustomer.totalOrders ?? 0}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-xs font-bold text-emerald-700 uppercase">Completed</div>
                      <div className="mt-2 text-2xl font-black text-emerald-800">
                        {selectedCustomer.completedOrders ?? 0}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-xs font-bold text-amber-700 uppercase">Cancelled</div>
                      <div className="mt-2 text-2xl font-black text-amber-800">
                        {selectedCustomer.cancelledOrders ?? 0}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase">Email</div>
                      <div className="mt-2 text-sm font-semibold text-slate-700 break-words">
                        {selectedCustomer.email || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-900">5 đơn gần nhất</h3>
                      <p className="text-xs text-slate-500 mt-1">Dựa theo ngày tạo đơn.</p>
                    </div>

                    {Array.isArray(selectedCustomer.recentOrders) && selectedCustomer.recentOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead className="bg-slate-50">
                            <tr className="border-b border-slate-100">
                              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mã đơn</th>
                              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Trạng thái</th>
                              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Thanh toán</th>
                              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 text-right">Tổng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedCustomer.recentOrders.map((o) => (
                              <tr key={String(o.orderId)} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="text-sm font-bold text-slate-900">{o.orderCode || `#${o.orderId}`}</div>
                                  <div className="text-xs text-slate-500 mt-1">items: {o.itemCount ?? 0}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase text-slate-700">
                                    {o.status || '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-slate-700">
                                    {o.paymentMethod || '—'}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {o.paymentStatus ? `Status: ${o.paymentStatus}` : '—'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-black text-slate-900">
                                  {formatVND(o.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-5 text-sm text-slate-500">Khách hàng chưa có đơn nào.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
